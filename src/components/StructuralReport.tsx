import React from 'react';
import type { SessionMetrics, BridgeEvent } from '../types/telemetry';
import { Printer, X, ShieldAlert, Cpu } from 'lucide-react';

interface StructuralReportProps {
  metrics: SessionMetrics;
  events: BridgeEvent[];
  onClose: () => void;
}

export const StructuralReport: React.FC<StructuralReportProps> = ({
  metrics,
  events,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const hasData = metrics.totalPackets > 0;
  const now = new Date();

  const formatTimestamp = (ts: number) => {
    if (!ts) return 'N/A';
    return new Date(ts).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm print:p-0 print:bg-white print:static">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-6 sm:p-8 text-zinc-200 print:border-none print:bg-white print:text-black print:max-h-none print:overflow-visible print:p-8">
        {/* MODAL CLOSE & PRINT BUTTONS (HIDDEN IN PRINT) */}
        <div className="flex items-center justify-between pb-6 border-b border-zinc-800 print:hidden">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-xs font-mono font-semibold rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
              DOCUMENT ID: SSR-{Date.now().toString().slice(-6)}
            </span>
            {metrics.isDemoMode && (
              <span className="px-2.5 py-1 text-xs font-mono font-semibold rounded bg-amber-950 text-amber-400 border border-amber-800">
                SIMULATED DATASET
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition-all shadow-md"
            >
              <Printer className="w-4 h-4" />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE REPORT CONTENT */}
        <div className="report-printable-area mt-4 space-y-6">
          {/* HEADER */}
          <div className="border-b pb-4 border-zinc-800 print:border-black">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-white print:text-black uppercase">
                  STRUCTSENSE
                </h1>
                <h2 className="text-sm font-medium text-cyan-400 print:text-gray-800 tracking-wider">
                  Smart Bridge Structural Health Monitoring — Session Report
                </h2>
              </div>
              <div className="text-right text-xs font-mono text-zinc-400 print:text-gray-600">
                <div>Generated: {now.toLocaleString()}</div>
                <div>Status: Verified Local Session</div>
              </div>
            </div>
          </div>

          {/* SIMULATION WARNING IF DEMO MODE */}
          {metrics.isDemoMode && (
            <div className="p-3 bg-amber-950/40 border border-amber-500/50 rounded-lg text-amber-300 text-xs font-mono print:bg-yellow-50 print:border-yellow-400 print:text-yellow-900">
              <strong>ATTENTION:</strong> This report was compiled from an active Demonstration Mode session. All readings, timestamps, and recorded events are simulated model responses and do not reflect physical bridge measurements.
            </div>
          )}

          {/* STATISTICAL SUMMARY METRICS */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 print:text-gray-800 mb-3">
              1. Session Overview & Operational Telemetry
            </h3>

            {hasData ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800 print:bg-gray-100 print:border-gray-300">
                  <span className="text-[10px] text-zinc-500 print:text-gray-600 block">SESSION DURATION</span>
                  <span className="text-base font-bold text-zinc-100 print:text-black">
                    {metrics.durationSeconds}s ({Math.floor(metrics.durationSeconds / 60)}m {metrics.durationSeconds % 60}s)
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800 print:bg-gray-100 print:border-gray-300">
                  <span className="text-[10px] text-zinc-500 print:text-gray-600 block">TOTAL PACKETS (200MS)</span>
                  <span className="text-base font-bold text-zinc-100 print:text-black">
                    {metrics.totalPackets} ({metrics.packetRateHz} Hz)
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800 print:bg-gray-100 print:border-gray-300">
                  <span className="text-[10px] text-zinc-500 print:text-gray-600 block">EXCURSION EVENTS</span>
                  <span className="text-base font-bold text-red-400 print:text-red-700">
                    {metrics.eventsCount}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800 print:bg-gray-100 print:border-gray-300">
                  <span className="text-[10px] text-zinc-500 print:text-gray-600 block">PEAK ACCEL DEVIATION</span>
                  <span className="text-base font-bold text-cyan-400 print:text-blue-800">
                    {metrics.peakDev.toFixed(4)} g
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 text-center text-xs font-mono text-zinc-400">
                Insufficient telemetry to calculate session metrics.
              </div>
            )}
          </div>

          {/* TELEMETRY READINGS EXTENTS */}
          {hasData && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 print:text-gray-800 mb-3">
                2. Peak Sensor Extents & Cumulative Counters
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-2.5 rounded bg-zinc-900/50 border border-zinc-800 print:bg-gray-50 print:border-gray-200">
                  <span className="text-[10px] text-zinc-500 block">PEAK AX</span>
                  <span className="font-bold text-zinc-200 print:text-black">{metrics.peakAx.toFixed(4)} g</span>
                </div>
                <div className="p-2.5 rounded bg-zinc-900/50 border border-zinc-800 print:bg-gray-50 print:border-gray-200">
                  <span className="text-[10px] text-zinc-500 block">PEAK AY</span>
                  <span className="font-bold text-zinc-200 print:text-black">{metrics.peakAy.toFixed(4)} g</span>
                </div>
                <div className="p-2.5 rounded bg-zinc-900/50 border border-zinc-800 print:bg-gray-50 print:border-gray-200">
                  <span className="text-[10px] text-zinc-500 block">PEAK AZ</span>
                  <span className="font-bold text-zinc-200 print:text-black">{metrics.peakAz.toFixed(4)} g</span>
                </div>
                <div className="p-2.5 rounded bg-zinc-900/50 border border-zinc-800 print:bg-gray-50 print:border-gray-200">
                  <span className="text-[10px] text-zinc-500 block">SENSOR COUNTERS</span>
                  <span className="font-bold text-zinc-200 print:text-black">
                    SW:{metrics.finalSwHits} | MPU:{metrics.finalMpuHits}
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-zinc-500 mt-1 font-mono">
                * Note: Counter values reflect lifetime electrical trigger counts and are distinct from deduplicated structural events.
              </p>
            </div>
          )}

          {/* CHRONOLOGICAL EVENT TABLE */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 print:text-gray-800 mb-2">
              3. Chronological Excursion Event Log
            </h3>
            {events.length === 0 ? (
              <p className="text-xs text-zinc-500 font-mono italic">
                Zero threshold excursion incidents recorded during this monitoring session.
              </p>
            ) : (
              <div className="border border-zinc-800 print:border-gray-300 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-zinc-900 print:bg-gray-200 text-zinc-400 print:text-gray-700">
                    <tr>
                      <th className="p-2">SEQ</th>
                      <th className="p-2">TIMESTAMP</th>
                      <th className="p-2">TRIGGER</th>
                      <th className="p-2">PEAK DEV</th>
                      <th className="p-2">SW HITS</th>
                      <th className="p-2">MPU HITS</th>
                      <th className="p-2">HOLD TIME</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800 print:divide-gray-300">
                    {events.map((evt) => (
                      <tr key={evt.id} className="hover:bg-zinc-900/40 print:hover:bg-transparent">
                        <td className="p-2 font-bold">#{evt.seq}</td>
                        <td className="p-2 text-zinc-400 print:text-gray-600">
                          {formatTimestamp(evt.timestamp)}
                        </td>
                        <td className="p-2 text-cyan-400 print:text-blue-700">{evt.triggerSource}</td>
                        <td className="p-2 text-red-400 print:text-red-700 font-bold">
                          {evt.peakDev.toFixed(4)} g
                        </td>
                        <td className="p-2">{evt.swHits}</td>
                        <td className="p-2">{evt.mpuHits}</td>
                        <td className="p-2">{evt.durationMs || 1500}ms</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* SENSOR INVENTORY & CONFIGURATION */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 print:text-gray-800 mb-2">
              4. Hardware Configuration & Detection Thresholds
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-3 rounded-lg bg-zinc-900/40 border border-zinc-800 print:bg-gray-50 print:border-gray-200 space-y-1">
                <div className="font-bold text-zinc-300 print:text-black flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                  Hardware Inventory
                </div>
                <div>• Microcontroller: Arduino Uno (ATmega328P @ 16MHz)</div>
                <div>• Accelerometer: MPU-6050 (I2C: SDA-A4, SCL-A5, ±2g range)</div>
                <div>• Vibration Sensor: SW-420 (Digital DO on Pin D2)</div>
                <div>• Status Indicators: Green LED (D8), Red LED (D9)</div>
                <div>• Serial Baud: 115200 bps • Interval: 200ms (PRINT_MS)</div>
              </div>

              <div className="p-3 rounded-lg bg-zinc-900/40 border border-zinc-800 print:bg-gray-50 print:border-gray-200 space-y-1">
                <div className="font-bold text-zinc-300 print:text-black flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  Detection Thresholds
                </div>
                <div>• ACCEL_THRESHOLD_G: 0.15g magnitude deviation</div>
                <div>• SW_WINDOW_MS: 1000ms rolling window</div>
                <div>• SW_HITS_NEEDED: 5 active rising edges within window</div>
                <div>• HOLD_MS: 1500ms minimum alert persistence</div>
                <div>• MPU Retry: 3000ms on I2C communication fault</div>
              </div>
            </div>
          </div>

          {/* DATA INTEGRITY & AUDIT NOTES */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 print:text-gray-800 mb-2">
              5. Data Quality & Audit Observations
            </h3>
            <div className="text-xs font-mono space-y-1 text-zinc-400 print:text-gray-700">
              <div>• Session Start: {formatTimestamp(metrics.startTime)}</div>
              <div>• Session End: {formatTimestamp(metrics.endTime)}</div>
              <div>• Rejected / Malformed JSON Lines: {metrics.malformedPackets}</div>
              <div>• MPU6050 Operational Availability: {metrics.mpuWorkingSession ? 'Nominal (100%)' : 'Intermittent I2C'}</div>
            </div>
          </div>

          {/* MANDATORY PROTOTYPE LIMITATION & HONEST DISCLAIMER */}
          <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-700/80 print:bg-gray-100 print:border-gray-400">
            <h4 className="text-xs font-bold text-zinc-200 print:text-black uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              Engineering Prototype Limitation & Disclaimer
            </h4>
            <p className="text-xs text-zinc-400 print:text-gray-800 leading-relaxed font-sans">
              <strong>“StructSense is an educational prototype that visualizes accelerometer and vibration-sensor telemetry. Its alert status is based on configured sensor thresholds and does not establish the safety or structural integrity of a real bridge.”</strong>
            </p>
            <p className="text-[11px] text-zinc-500 print:text-gray-600 mt-2 font-mono">
              The MPU-6050 and SW-420 sensors do not directly measure structural strain, bending stress, fatigue life, or physical load-bearing capacity. Visual 3D animations in the digital twin are illustrative responses to detected vibration events, not a validated finite element analysis (FEA) simulation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
