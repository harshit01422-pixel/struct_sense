import type { TelemetryData, BridgeEvent } from '../types/telemetry';

export class EventDetector {
  private previousAlert = false;
  private previousSwHits = 0;
  private previousMpuHits = 0;
  private eventSequence = 0;
  private activeEvent: BridgeEvent | null = null;

  public reset(): void {
    this.previousAlert = false;
    this.previousSwHits = 0;
    this.previousMpuHits = 0;
    this.eventSequence = 0;
    this.activeEvent = null;
  }

  /**
   * Processes a telemetry record. Returns a new BridgeEvent if a rising edge occurred,
   * or updates the ongoing event's peak deviation / duration.
   */
  public process(data: TelemetryData): { newEvent?: BridgeEvent; resolvedEvent?: BridgeEvent } {
    let newEvent: BridgeEvent | undefined;
    let resolvedEvent: BridgeEvent | undefined;

    const isRisingEdge = !this.previousAlert && data.alert;
    const swHitDelta = data.swHits - this.previousSwHits;
    const mpuHitDelta = data.mpuHits - this.previousMpuHits;

    if (isRisingEdge) {
      this.eventSequence += 1;

      let triggerSource: BridgeEvent['triggerSource'] = 'MPU6050';
      if (swHitDelta > 0 && mpuHitDelta > 0) {
        triggerSource = 'DUAL';
      } else if (swHitDelta > 0) {
        triggerSource = 'SW420';
      } else {
        triggerSource = 'MPU6050';
      }

      this.activeEvent = {
        id: `EVT-${Date.now()}-${this.eventSequence}`,
        seq: this.eventSequence,
        timestamp: data.timestamp,
        peakDev: data.dev,
        swHits: data.swHits,
        mpuHits: data.mpuHits,
        triggerSource,
        durationMs: 0,
      };

      newEvent = { ...this.activeEvent };
    } else if (this.activeEvent && data.alert) {
      // Event is currently ongoing (within 1500ms hold period)
      // Track peak deviation
      if (data.dev > this.activeEvent.peakDev) {
        this.activeEvent.peakDev = data.dev;
      }
      this.activeEvent.durationMs = data.timestamp - this.activeEvent.timestamp;
    } else if (this.activeEvent && !data.alert) {
      // Alert falling edge: event resolved
      this.activeEvent.resolvedAt = data.timestamp;
      this.activeEvent.durationMs = Math.max(
        this.activeEvent.durationMs,
        data.timestamp - this.activeEvent.timestamp
      );
      resolvedEvent = { ...this.activeEvent };
      this.activeEvent = null;
    }

    this.previousAlert = data.alert;
    this.previousSwHits = data.swHits;
    this.previousMpuHits = data.mpuHits;

    return { newEvent, resolvedEvent };
  }
}
