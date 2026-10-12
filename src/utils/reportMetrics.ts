import type { TelemetryData, BridgeEvent, SessionMetrics } from '../types/telemetry';

export function calculateSessionMetrics(
  history: TelemetryData[],
  events: BridgeEvent[],
  malformedCount: number,
  isDemoMode: boolean
): SessionMetrics {
  if (history.length === 0) {
    const now = Date.now();
    return {
      startTime: now,
      endTime: now,
      durationSeconds: 0,
      totalPackets: 0,
      malformedPackets: malformedCount,
      packetRateHz: 0,
      eventsCount: events.length,
      peakDev: 0,
      peakAx: 0,
      peakAy: 0,
      peakAz: 0,
      finalSwHits: 0,
      finalMpuHits: 0,
      mpuWorkingSession: false,
      isDemoMode,
    };
  }

  const startTime = history[0].timestamp;
  const endTime = history[history.length - 1].timestamp;
  const durationSeconds = Math.max(1, Math.round((endTime - startTime) / 1000));
  const packetRateHz = Number((history.length / (durationSeconds || 1)).toFixed(1));

  let peakDev = 0;
  let peakAx = 0;
  let peakAy = 0;
  let peakAz = 0;
  let mpuWorkingSession = true;

  for (const item of history) {
    if (item.dev > peakDev) peakDev = item.dev;
    if (Math.abs(item.ax) > Math.abs(peakAx)) peakAx = item.ax;
    if (Math.abs(item.ay) > Math.abs(peakAy)) peakAy = item.ay;
    if (Math.abs(item.az) > Math.abs(peakAz)) peakAz = item.az;
    if (!item.mpuWorking) mpuWorkingSession = false;
  }

  const lastItem = history[history.length - 1];

  return {
    startTime,
    endTime,
    durationSeconds,
    totalPackets: history.length,
    malformedPackets: malformedCount,
    packetRateHz,
    eventsCount: events.length,
    peakDev: Number(peakDev.toFixed(4)),
    peakAx: Number(peakAx.toFixed(4)),
    peakAy: Number(peakAy.toFixed(4)),
    peakAz: Number(peakAz.toFixed(4)),
    finalSwHits: lastItem.swHits,
    finalMpuHits: lastItem.mpuHits,
    mpuWorkingSession,
    isDemoMode,
  };
}
