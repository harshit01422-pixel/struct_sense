import type { TelemetryData } from '../types/telemetry';

export interface MockCallbacks {
  onData: (data: TelemetryData) => void;
  onStatusChange: (status: string) => void;
}

export class MockTelemetryService {
  private timer: number | null = null;
  private isRunning = false;
  private callbacks: MockCallbacks | null = null;

  // Internal state
  private swHits = 0;
  private mpuHits = 0;
  private alertUntil = 0;
  private vibrationDecay = 0;
  private simulatedTaps = 0;

  public start(callbacks: MockCallbacks): void {
    if (this.isRunning) return;
    this.callbacks = callbacks;
    this.isRunning = true;
    this.swHits = 0;
    this.mpuHits = 0;
    this.alertUntil = 0;
    this.vibrationDecay = 0;

    this.callbacks.onStatusChange('Demo mode active (simulated 200ms telemetry)');

    // Emit updates every 200ms (matching Arduino's PRINT_MS = 200)
    this.timer = window.setInterval(() => {
      this.tick();
    }, 200);
  }

  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
    this.callbacks?.onStatusChange('Demo mode stopped.');
  }

  public triggerSimulatedEvent(): void {
    if (!this.isRunning) return;
    const now = Date.now();
    this.simulatedTaps++;
    this.swHits += Math.floor(Math.random() * 3) + 5; // e.g., 5-7 hits to exceed SW_HITS_NEEDED = 5
    this.mpuHits += Math.floor(Math.random() * 2) + 2;
    this.alertUntil = now + 1500; // 1500ms hold period
    this.vibrationDecay = 1.0; // Start visual spike
  }

  private tick(): void {
    if (!this.isRunning || !this.callbacks) return;

    const now = Date.now();
    const isAlertActive = now < this.alertUntil;

    // Decay transient vibration
    if (this.vibrationDecay > 0.01) {
      this.vibrationDecay *= 0.82;
    } else {
      this.vibrationDecay = 0;
    }

    // Baseline sensor noise
    const baseNoiseX = (Math.random() - 0.5) * 0.015;
    const baseNoiseY = (Math.random() - 0.5) * 0.015;
    const baseNoiseZ = 1.0 + (Math.random() - 0.5) * 0.012;

    // Additional transient perturbation during vibration
    const vibOffset = (Math.random() - 0.5) * 0.45 * this.vibrationDecay;

    const ax = Number((baseNoiseX + vibOffset * 0.4).toFixed(4));
    const ay = Number((baseNoiseY + vibOffset * 0.3).toFixed(4));
    const az = Number((baseNoiseZ + vibOffset).toFixed(4));

    const mag = Number(Math.sqrt(ax * ax + ay * ay + az * az).toFixed(4));
    const dev = Number(Math.abs(mag - 1.0).toFixed(4));

    const ratio = Math.min(1.0, Math.max(-1.0, az / (mag || 1.0)));
    const tilt = Number(((Math.acos(ratio) * 180) / Math.PI).toFixed(2));

    const sw = this.vibrationDecay > 0.2 ? 1 : 0;

    const data: TelemetryData = {
      ax,
      ay,
      az,
      mag,
      dev,
      tilt,
      sw,
      swHits: this.swHits,
      mpuHits: this.mpuHits,
      mpuWorking: true,
      alert: isAlertActive,
      timestamp: now,
    };

    this.callbacks.onData(data);
  }

  public getActive(): boolean {
    return this.isRunning;
  }
}

export const mockTelemetry = new MockTelemetryService();
