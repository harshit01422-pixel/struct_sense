import React, { useState } from 'react';
import type { BridgeEvent } from '../types/telemetry';
import { History, Trash2, AlertTriangle, ShieldCheck } from 'lucide-react';

interface EventTimelineProps {
  events: BridgeEvent[];
  onClearSession: () => void;
}

export const EventTimeline: React.FC<EventTimelineProps> = ({
  events,
  onClearSession,
}) => {
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="flex flex-col gap-3 p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/60 backdrop-blur-md">
      {/* HEADER & ACTIONS */}
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800/70">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
            Vibration Event Log
          </h3>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-zinc-800 text-cyan-300 border border-zinc-700">
            {events.length} Recorded
          </span>
        </div>

        {events.length > 0 && (
          <div className="relative">
            {!showConfirm ? (
              <button
                onClick={() => setShowConfirm(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-950/40 border border-zinc-700/80 hover:border-rose-600/50 transition-all font-mono"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear Log
              </button>
            ) : (
              <div className="flex items-center gap-1.5 bg-zinc-950 px-2 py-1 rounded-lg border border-rose-600/60 text-xs">
                <span className="text-zinc-300 text-[11px]">Confirm?</span>
                <button
                  onClick={() => {
                    onClearSession();
                    setShowConfirm(false);
                  }}
                  className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-semibold text-[11px]"
                >
                  Yes
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px]"
                >
                  No
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* EVENT LIST TABLE */}
      <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-zinc-500">
            <ShieldCheck className="w-8 h-8 text-zinc-600 mb-1.5" />
            <span className="text-xs font-mono">No threshold excursions logged</span>
            <span className="text-[11px] text-zinc-600 mt-0.5">
              System operating nominally. Vibrations exceeding 0.15g or 5 SW-420 hits appear here.
            </span>
          </div>
        ) : (
          events.map((evt) => {
            const date = new Date(evt.timestamp);
            const timeStr = date.toLocaleTimeString([], {
              hour12: false,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });
            const msStr = date.getMilliseconds().toString().padStart(3, '0');

            return (
              <div
                key={evt.id}
                className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg border border-zinc-800 bg-zinc-950/60 hover:bg-zinc-800/40 transition-colors text-xs font-mono"
              >
                {/* ID & TIMESTAMP */}
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded bg-red-950/60 border border-red-500/50 text-red-400">
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-zinc-200">
                        EVT #{evt.seq.toString().padStart(3, '0')}
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        {timeStr}.{msStr}
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-400">
                      Trigger: <strong className="text-cyan-400">{evt.triggerSource}</strong>
                    </span>
                  </div>
                </div>

                {/* METRICS AT EVENT */}
                <div className="flex items-center gap-3 text-right">
                  <div>
                    <span className="block text-[10px] text-zinc-500">Peak Dev</span>
                    <span className="text-red-400 font-bold">
                      {evt.peakDev.toFixed(4)} g
                    </span>
                  </div>

                  <div>
                    <span className="block text-[10px] text-zinc-500">Counters</span>
                    <span className="text-zinc-300 text-[11px]">
                      SW:{evt.swHits} | MPU:{evt.mpuHits}
                    </span>
                  </div>

                  <div>
                    <span className="block text-[10px] text-zinc-500">Hold Window</span>
                    <span className="text-amber-300 text-[11px]">
                      {evt.durationMs > 0 ? `${evt.durationMs}ms` : '1500ms'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
