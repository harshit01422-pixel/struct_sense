/*
 * ============================================================================
 * STRUCTSENSE — SMART BRIDGE DIGITAL TWIN
 * Firmware: structsense_bridge.ino
 * Target Board: Arduino Uno (ATmega328P)
 * Baud Rate: 115200
 * ============================================================================
 * 
 * HARDWARE PIN CONNECTIONS (DO NOT ALTER):
 * ----------------------------------------
 * 1. MPU-6050 Accelerometer (I2C):
 *    - VCC -> 5V or 3.3V power rail
 *    - GND -> GND rail
 *    - SDA -> Pin A4
 *    - SCL -> Pin A5
 * 
 * 2. SW-420 Digital Vibration Sensor:
 *    - VCC -> 5V rail
 *    - GND -> GND rail
 *    - DO  -> Pin D2
 * 
 * 3. Status Indicators:
 *    - Green LED -> Pin D8 (through 220-ohm current-limiting resistor)
 *    - Red LED   -> Pin D9 (through 220-ohm current-limiting resistor)
 * 
 * TELEMETRY JSON SPECIFICATION:
 * -----------------------------
 * Every 200ms (PRINT_MS), a single-line JSON string is emitted over Serial:
 * {"ax":0.0123,"ay":-0.0045,"az":0.9982,"mag":0.9983,"dev":0.0017,"tilt":3.45,"sw":0,"swHits":0,"mpuHits":0,"mpuWorking":true,"alert":false}
 * 
 * All detection thresholds, retry intervals, LED logic, and hold periods
 * match the physical prototype specification.
 * ============================================================================
 */

#include <Wire.h>
#include <math.h>

// --- PIN DEFINITIONS ---
const uint8_t PIN_SW420   = 2; // SW-420 DO on D2
const uint8_t PIN_LED_GRN = 8; // Normal status LED on D8
const uint8_t PIN_LED_RED = 9; // Alert status LED on D9

// --- MPU-6050 I2C ADDRESS & REGISTERS ---
uint8_t       mpuAddr            = 0x68; // Auto-detected (0x68 default, 0x69 fallback)
const uint8_t MPU6050_PWR_MGMT_1 = 0x6B;
const uint8_t MPU6050_ACCEL_XOUT = 0x3B;

// --- DETECTION CONSTANTS & TIMING ---
const float    ACCEL_THRESHOLD_G  = 0.15; // Threshold deviation from 1.0g
const uint8_t  SW420_ACTIVE_LEVEL = HIGH; // Active vibration logic level
const uint32_t SW_WINDOW_MS       = 1000; // Rolling window for SW-420 hit counting
const uint16_t SW_HITS_NEEDED     = 5;    // Edge hits within window to trigger alert
const uint32_t HOLD_MS            = 1500; // Alert hold period (ms)
const uint32_t PRINT_MS           = 200;  // Telemetry broadcast interval (ms)
const uint32_t MPU_RETRY_MS       = 3000; // Retry interval if MPU6050 disconnects

// --- SENSOR & SYSTEM STATE ---
float    ax = 0.0;
float    ay = 0.0;
float    az = 1.0;
float    mag = 1.0;
float    dev = 0.0;
float    tilt = 0.0;

uint8_t  swState = 0;
uint8_t  lastSwReading = LOW;
uint32_t swHits = 0;
uint32_t mpuHits = 0;
bool     mpuWorking = false;
bool     alert = false;

// SW-420 sliding window hits tracker
const uint8_t MAX_WINDOW_HITS = 20;
uint32_t swHitTimestamps[MAX_WINDOW_HITS];
uint8_t  swHitIndex = 0;
uint8_t  swHitCountInWindow = 0;

// Timing clocks
uint32_t lastPrintTime   = 0;
uint32_t alertTriggerTime = 0;
uint32_t lastMpuRetryTime = 0;

// Flag to record whether MPU exceeded threshold in current cycle
bool mpuThresholdExceeded = false;
bool lastMpuExceeded = false;

// Forward Declarations
bool initMPU6050();
void readMPU6050();
void updateSW420();
void evaluateAlertLogic();
void updateLEDs();
void sendTelemetryJSON();

void setup() {
  // Initialize Serial port at high-speed 115200 baud
  Serial.begin(115200);

  // Configure hardware digital I/O pins
  pinMode(PIN_SW420, INPUT);
  pinMode(PIN_LED_GRN, OUTPUT);
  pinMode(PIN_LED_RED, OUTPUT);

  // Initial LED State: Green ON (booting/idle), Red OFF
  digitalWrite(PIN_LED_GRN, HIGH);
  digitalWrite(PIN_LED_RED, LOW);

  // Initialize I2C Bus
  Wire.begin();
  delay(100);

  // Initialize MPU-6050
  mpuWorking = initMPU6050();

  // Clear sliding window timestamps
  for (uint8_t i = 0; i < MAX_WINDOW_HITS; i++) {
    swHitTimestamps[i] = 0;
  }
}

void loop() {
  uint32_t currentMillis = millis();

  // 1. Maintain MPU-6050 connection
  if (!mpuWorking) {
    if (currentMillis - lastMpuRetryTime >= MPU_RETRY_MS) {
      lastMpuRetryTime = currentMillis;
      mpuWorking = initMPU6050();
    }
  }

  // 2. Read accelerometer if operational
  if (mpuWorking) {
    readMPU6050();
  }

  // 3. Monitor SW-420 Vibration sensor edges
  updateSW420();

  // 4. Evaluate Alert conditions and manage 1500ms hold period
  evaluateAlertLogic();

  // 5. Update physical Red / Green LEDs
  updateLEDs();

  // 6. Broadcast clean JSON telemetry at regular PRINT_MS intervals
  if (currentMillis - lastPrintTime >= PRINT_MS) {
    lastPrintTime = currentMillis;
    sendTelemetryJSON();
  }
}

/**
 * Initialize MPU-6050 by waking it from sleep mode (Register 0x6B = 0).
 */
bool initMPU6050() {
  // Probe default 0x68 address
  Wire.beginTransmission(0x68);
  Wire.write(MPU6050_PWR_MGMT_1);
  Wire.write(0x00); // Clear sleep bit (0)
  if (Wire.endTransmission() == 0) {
    mpuAddr = 0x68;
    return true;
  }

  // Fallback probe alternate 0x69 address (e.g. AD0 tied HIGH)
  Wire.beginTransmission(0x69);
  Wire.write(MPU6050_PWR_MGMT_1);
  Wire.write(0x00); // Clear sleep bit (0)
  if (Wire.endTransmission() == 0) {
    mpuAddr = 0x69;
    return true;
  }

  return false;
}

/**
 * Read raw 16-bit 2's complement accelerometer values and convert to g units.
 * Scale: +/- 2g range = 16384 LSB/g.
 */
void readMPU6050() {
  Wire.beginTransmission(mpuAddr);
  Wire.write(MPU6050_ACCEL_XOUT);
  byte error = Wire.endTransmission(false);

  if (error != 0) {
    mpuWorking = false;
    return;
  }

  Wire.requestFrom(mpuAddr, (uint8_t)6, (uint8_t)true);
  if (Wire.available() < 6) {
    mpuWorking = false;
    return;
  }

  int16_t rawX = (Wire.read() << 8) | Wire.read();
  int16_t rawY = (Wire.read() << 8) | Wire.read();
  int16_t rawZ = (Wire.read() << 8) | Wire.read();

  // Convert raw readings to acceleration in g (at default +/-2g sensitivity)
  ax = (float)rawX / 16384.0;
  ay = (float)rawY / 16384.0;
  az = (float)rawZ / 16384.0;

  // Compute magnitude and deviation from 1.0g standard gravity
  mag = sqrt(ax * ax + ay * ay + az * az);
  dev = fabs(mag - 1.0);

  // Calculate tilt angle in degrees relative to vertical (gravity axis)
  float safeRatio = az / (mag > 0.0001 ? mag : 1.0);
  if (safeRatio > 1.0) safeRatio = 1.0;
  if (safeRatio < -1.0) safeRatio = -1.0;
  tilt = acos(safeRatio) * (180.0 / 3.14159265);

  // Check deviation threshold for MPU hit detection
  mpuThresholdExceeded = (dev >= ACCEL_THRESHOLD_G);
  if (mpuThresholdExceeded && !lastMpuExceeded) {
    mpuHits++; // Increment active edge
  }
  lastMpuExceeded = mpuThresholdExceeded;
}

/**
 * Monitor SW-420 digital pin D2, detect rising edges, and count hits
 * within the SW_WINDOW_MS (1000ms) sliding time window.
 */
void updateSW420() {
  swState = digitalRead(PIN_SW420);
  uint32_t now = millis();

  // Detect edge transition to active level
  if (swState == SW420_ACTIVE_LEVEL && lastSwReading != SW420_ACTIVE_LEVEL) {
    swHits++; // Cumulative lifetime counter

    // Record timestamp in circular buffer
    swHitTimestamps[swHitIndex] = now;
    swHitIndex = (swHitIndex + 1) % MAX_WINDOW_HITS;
  }
  lastSwReading = swState;

  // Count how many hits occurred within the last SW_WINDOW_MS (1000ms)
  swHitCountInWindow = 0;
  for (uint8_t i = 0; i < MAX_WINDOW_HITS; i++) {
    if (swHitTimestamps[i] > 0 && (now - swHitTimestamps[i] <= SW_WINDOW_MS)) {
      swHitCountInWindow++;
    }
  }
}

/**
 * Evaluate alert condition:
 * - SW-420 hits in window >= SW_HITS_NEEDED (5)
 *   OR
 * - Accelerometer magnitude deviation >= ACCEL_THRESHOLD_G (0.15g)
 * If triggered, alert is held for at least HOLD_MS (1500ms).
 */
void evaluateAlertLogic() {
  uint32_t now = millis();

  bool newTrigger = (swHitCountInWindow >= SW_HITS_NEEDED) || mpuThresholdExceeded;

  if (newTrigger) {
    alertTriggerTime = now;
    alert = true;
  } else {
    // Check if hold time has elapsed
    if (alert && (now - alertTriggerTime >= HOLD_MS)) {
      alert = false;
    }
  }
}

/**
 * Control physical LEDs based on alert state:
 * - Normal: Green LED ON (D8), Red LED OFF (D9)
 * - Alert:  Red LED ON (D9), Green LED OFF (D8)
 */
void updateLEDs() {
  if (alert) {
    digitalWrite(PIN_LED_RED, HIGH);
    digitalWrite(PIN_LED_GRN, LOW);
  } else {
    digitalWrite(PIN_LED_RED, LOW);
    digitalWrite(PIN_LED_GRN, HIGH);
  }
}

/**
 * Transmit strictly formatted single-line JSON telemetry over Serial.
 * No stray debug strings are emitted to prevent JSON parser interruption.
 */
void sendTelemetryJSON() {
  Serial.print("{\"ax\":");
  Serial.print(ax, 4);
  Serial.print(",\"ay\":");
  Serial.print(ay, 4);
  Serial.print(",\"az\":");
  Serial.print(az, 4);
  Serial.print(",\"mag\":");
  Serial.print(mag, 4);
  Serial.print(",\"dev\":");
  Serial.print(dev, 4);
  Serial.print(",\"tilt\":");
  Serial.print(tilt, 2);
  Serial.print(",\"sw\":");
  Serial.print(swState);
  Serial.print(",\"swHits\":");
  Serial.print(swHits);
  Serial.print(",\"mpuHits\":");
  Serial.print(mpuHits);
  Serial.print(",\"mpuWorking\":");
  Serial.print(mpuWorking ? "true" : "false");
  Serial.print(",\"alert\":");
  Serial.print(alert ? "true" : "false");
  Serial.println("}");
}
