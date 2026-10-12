export interface TelemetryData {
  ax: number;         // X-axis acceleration in g
  ay: number;         // Y-axis acceleration in g
  az: number;         // Z-axis acceleration in g
  mag: number;        // Acceleration magnitude sqrt(ax^2 + ay^2 + az^2) in g
  dev: number;        // Deviation from 1.0g |mag - 1.0|
  tilt: number;       // Tilt angle in degrees relative to vertical
  sw: number;         // SW-420 digital read (0 or 1)
  swHits: number;     // SW-420 hit counter
  mpuHits: number;    // MPU-6050 hit counter
  mpuWorking: boolean;// MPU-6050 I2C health status
  alert: boolean;     // Active alert state (within 1500ms hold period)
  timestamp: number;  // Local reception timestamp (ms since epoch)
}

export type ConnectionStatus =
  | 'DISCONNECTED'
  | 'CONNECTING'
  | 'CONNECTED_NORMAL'
  | 'VIBRATION_ALERT'
  | 'TELEMETRY_STALE'
  | 'SENSOR_UNAVAILABLE'
  | 'SERIAL_ERROR';

export interface BridgeEvent {
  id: string;
  seq: number;
  timestamp: number;
  peakDev: number;
  swHits: number;
  mpuHits: number;
  triggerSource: 'MPU6050' | 'SW420' | 'DUAL' | 'MANUAL_SIM';
  durationMs: number;
  resolvedAt?: number;
}

export interface SessionMetrics {
  startTime: number;
  endTime: number;
  durationSeconds: number;
  totalPackets: number;
  malformedPackets: number;
  packetRateHz: number;
  eventsCount: number;
  peakDev: number;
  peakAx: number;
  peakAy: number;
  peakAz: number;
  finalSwHits: number;
  finalMpuHits: number;
  mpuWorkingSession: boolean;
  isDemoMode: boolean;
}
