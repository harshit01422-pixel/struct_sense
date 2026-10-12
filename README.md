# STRUCTSENSE — SMART BRIDGE DIGITAL TWIN
## Live 3D Structural Health Monitoring & Telemetry Dashboard

StructSense is a full-stack, local structural health monitoring web application and interactive 3D digital twin connected via USB Serial (115200 baud) to a physical smart bridge prototype driven by an **Arduino Uno**, an **MPU-6050 6-DOF accelerometer**, and an **SW-420 high-sensitivity vibration sensor**.

---

## 1. Quick Start

### Prerequisites
- **Google Chrome** or **Microsoft Edge** (required for native Web Serial API support)
- **Node.js** (v18+) & **npm**
- **Arduino IDE** (to flash the firmware to the Arduino Uno)

### Installation & Launch
```bash
# In the project directory: c:\Users\DELL\Desktop\struct_sense
npm install

# Start development server
npm run dev
```

Open Google Chrome to:
```
http://localhost:5173/
```

To build for production:
```bash
npm run build
npm run preview
```

---

## 2. Hardware Wiring Diagram

The physical smart bridge uses the exact pin configuration below:

| Component | Arduino Uno Pin | Wire / Note |
|---|---|---|
| **MPU-6050 SDA** | **A4** (Analog 4) | I2C Data line |
| **MPU-6050 SCL** | **A5** (Analog 5) | I2C Clock line |
| **MPU-6050 VCC** | **5V** or **3.3V** | Power rail |
| **MPU-6050 GND** | **GND** | Ground rail |
| **SW-420 DO** | **D2** (Digital 2) | Active HIGH digital vibration edge |
| **SW-420 VCC** | **5V** | Power rail |
| **SW-420 GND** | **GND** | Ground rail |
| **Green LED (Anode)** | **D8** | Series 220Ω resistor to ground (Nominal status) |
| **Red LED (Anode)** | **D9** | Series 220Ω resistor to ground (Alert status) |

---

## 3. Arduino Firmware Flashing & Serial Monitor Caveat

The firmware is located at:
```
arduino/structsense_bridge.ino
```

### Steps to Upload:
1. Open `arduino/structsense_bridge.ino` in the **Arduino IDE**.
2. Select your board: **Tools > Board > Arduino Uno**.
3. Select your port: **Tools > Port > COMx** (Windows) or `/dev/cu.usbmodem...` (macOS).
4. Click **Upload** (Ctrl+U / Cmd+U).
5. **CRITICAL STEP:** **CLOSE THE ARDUINO SERIAL MONITOR AND SERIAL PLOTTER!**
   * *The USB COM port can only be opened by one program at a time.* If the Arduino IDE Serial Monitor is open, Chrome will be blocked from accessing the port (`Failed to open serial port`).

---

## 4. Web Serial Telemetry Specification

The firmware outputs a single newline-terminated JSON object every **200 ms (`PRINT_MS`)** at **115200 baud**:

```json
{
  "ax": 0.0123,
  "ay": -0.0045,
  "az": 0.9982,
  "mag": 0.9983,
  "dev": 0.0017,
  "tilt": 3.45,
  "sw": 0,
  "swHits": 0,
  "mpuHits": 0,
  "mpuWorking": true,
  "alert": false
}
```

### Detection Logic & Constants
- `ACCEL_THRESHOLD_G = 0.15`: Acceleration magnitude deviation `dev = |mag - 1.0| >= 0.15g` triggers an alert.
- `SW420_ACTIVE_LEVEL = HIGH`: Triggered by active vibrations on D2.
- `SW_WINDOW_MS = 1000`: 1.0 second sliding window for SW-420 hit counting.
- `SW_HITS_NEEDED = 5`: 5 vibration spikes within 1000ms triggers an alert.
- `HOLD_MS = 1500`: Alert persists for a minimum of 1.5 seconds, illuminating Red LED (D9) and animating the 3D twin.
- `PRINT_MS = 200`: Broadcast interval for JSON telemetry.

---

## 5. Demonstration Mode

If the physical Arduino is not connected:
1. Click **Demo Mode** in the top navigation bar.
2. The UI switches to simulated 200ms telemetry with baseline sensor noise.
3. Click **Simulate Tap** to simulate a physical bridge impact. The 3D deck vibrates, the sensor node glows red, the red alert banner fires, the event log registers an entry, and the session metrics update.
4. Demo Mode data is isolated and clearly badged on all screens and printable reports.

---

## 6. Architecture & File Structure

```
struct_sense/
├── arduino/
│   └── structsense_bridge.ino   # Production Arduino Uno firmware
├── src/
│   ├── components/
│   │   ├── BridgeScene.tsx       # 3D interactive R3F twin, multi-pillar highway, damped vibration
│   │   ├── ConnectionPanel.tsx   # Web Serial connection manager, port diagnostic indicators
│   │   ├── TelemetryPanel.tsx    # Live sensor cards, threshold micro-gauges, tooltips
│   │   ├── TelemetryCharts.tsx   # Recharts waveforms (dev limit, 3-axis traces, bounded buffer)
│   │   ├── EventTimeline.tsx     # Deduplicated event log with edge detection & confirmation clear
│   │   ├── StructuralReport.tsx  # Printable engineering report with CSS @media print
│   │   ├── StatusIndicator.tsx   # Glowing system state badges
│   │   └── Header.tsx            # Navigation, wall clock, session timer, demo toggle
│   ├── hooks/
│   │   └── useArduino.ts         # Central reactive telemetry state & stale detector
│   ├── services/
│   │   ├── arduinoSerial.ts      # Web Serial stream reader, chunk buffer, JSON sanitizer
│   │   └── mockTelemetry.ts      # Isolated simulated stream for Demo Mode
│   ├── types/
│   │   └── telemetry.ts          # Strictly typed telemetry, connection, event & report schemas
│   ├── utils/
│   │   ├── eventDetection.ts     # Edge-detection deduplication utility
│   │   └── reportMetrics.ts      # Statistical session analysis calculations
│   ├── App.tsx                   # Main layout container
│   ├── index.css                 # Graphite dark theme, grid background, print layout
│   └── main.tsx                  # React DOM entry point
├── test/
│   └── verify_system.ts          # Automated validation test suite
└── package.json
```

---

## 7. Engineering Honesty & Prototype Limitations

> **Disclaimer:** StructSense is an educational engineering prototype designed to visualize accelerometer and vibration sensor telemetry. The alert status is derived from configured sensor threshold excursions and does not validate the physical structural integrity, bending moment, stress load, or fatigue life of an actual bridge. Visualized deck deflections in the 3D digital twin are illustrative responses to detected vibration events rather than measured displacements.
