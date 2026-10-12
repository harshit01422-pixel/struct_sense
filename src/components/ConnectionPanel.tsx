import React from 'react';
import type { ConnectionStatus } from '../types/telemetry';
import { StatusIndicator } from './StatusIndicator';
import { Usb, PowerOff, AlertCircle, RefreshCw, Radio, Terminal, ChevronDown, ChevronUp } from 'lucide-react';

interface ConnectionPanelProps {
  connectionStatus: ConnectionStatus;
  statusMessage: string;
  isSupported: boolean;
  timeSinceLastPacketMs: number;
  malformedCount: number;
  packetRateHz: number;
  isDemoMode: boolean;
  rawLines?: string[];
  onConnect: () => void;
  onDisconnect: () => void;
}

export const ConnectionPanel: React.FC<ConnectionPanelProps> = ({
  connectionStatus,
  statusMessage,
  isSupported,
  timeSinceLastPacketMs,
  malformedCount,
  packetRateHz,
  isDemoMode,
  rawLines = [],
  onConnect,
  onDisconnect,
}) => {
  const [showTerminal, setShowTerminal] = React.useState(false);
  const isConnected =
    connectionStatus === 'CONNECTED_NORMAL' ||
    connectionStatus === 'VIBRATION_ALERT' ||
    connectionStatus === 'TELEMETRY_STALE' ||
    connectionStatus === 'SENSOR_UNAVAILABLE';

  return (
    <div className="flex flex-col gap-3 p-4 rounded-xl border border-zinc-800/90 bg-zinc-900/60 backdrop-blur-md shadow-lg">
      {/* HEADER & STATUS BADGE */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-800/40 text-cyan-400">
            <Usb className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-zinc-100 uppercase tracking-wider flex items-center gap-2">
              Hardware Serial Interface
              {isDemoMode && (
                <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded">
                  Demo Simulated
                </span>
              )}
            </h2>
            <p className="text-xs text-zinc-400 font-mono">
              USB COM Port • 115200 Baud • JSON Stream
            </p>
          </div>
        </div>

        <StatusIndicator
          status={connectionStatus}
          timeSinceLastPacketMs={timeSinceLastPacketMs}
        />
      </div>

      {/* UNSUPPORTED BROWSER WARNING */}
      {!isSupported && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-950/40 border border-amber-600/40 text-amber-300 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" />
          <div>
            <strong className="font-semibold">Web Serial API Required:</strong> Your
            current browser does not support Web Serial. Please open StructSense in{' '}
            <span className="underline font-bold">Google Chrome</span> or{' '}
            <span className="underline font-bold">Microsoft Edge</span> on{' '}
            <code>localhost</code>.
          </div>
        </div>
      )}

      {/* CONTROLS & DIAGNOSTIC METRICS */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* ACTION BUTTONS */}
        <div className="flex items-center gap-2">
          {!isConnected ? (
            <button
              onClick={onConnect}
              disabled={!isSupported || isDemoMode}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all shadow-md ${
                !isSupported || isDemoMode
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                  : 'bg-cyan-600 hover:bg-cyan-500 text-white border border-cyan-400/30 hover:shadow-[0_0_16px_rgba(6,182,212,0.5)] active:scale-95'
              }`}
            >
              <Usb className="w-4 h-4" />
              Connect Arduino
            </button>
          ) : (
            <button
              onClick={onDisconnect}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold tracking-wider uppercase bg-rose-950/80 hover:bg-rose-900 border border-rose-600/50 text-rose-200 transition-all shadow-md hover:shadow-[0_0_16px_rgba(225,29,72,0.4)] active:scale-95"
            >
              <PowerOff className="w-4 h-4" />
              Disconnect
            </button>
          )}

          {connectionStatus === 'CONNECTING' && (
            <span className="flex items-center gap-1.5 text-xs text-cyan-400 font-mono animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Establishing link...
            </span>
          )}
        </div>

        {/* COMPACT METRICS PILLS */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-950 border border-zinc-800 text-zinc-300">
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-zinc-500">Rate:</span>
            <span className="text-cyan-300 font-semibold">{packetRateHz} Hz</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-950 border border-zinc-800 text-zinc-300">
            <span className="text-zinc-500">Latency:</span>
            <span
              className={
                timeSinceLastPacketMs > 1500
                  ? 'text-amber-400 font-semibold'
                  : 'text-zinc-300'
              }
            >
              {timeSinceLastPacketMs}ms
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-950 border border-zinc-800 text-zinc-300">
            <span className="text-zinc-500">Malformed:</span>
            <span
              className={
                malformedCount > 0 ? 'text-amber-400 font-bold' : 'text-zinc-400'
              }
            >
              {malformedCount}
            </span>
          </div>

          <button
            onClick={() => setShowTerminal((v) => !v)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-mono transition-all ${
              showTerminal
                ? 'bg-cyan-950 border-cyan-500 text-cyan-300'
                : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
            }`}
            title="Inspect incoming raw serial stream"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Terminal</span>
            {rawLines.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
            {showTerminal ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* STATUS & RECOVERY MESSAGE */}
      <div className="flex flex-col gap-2 pt-1 border-t border-zinc-800/60">
        <div className="flex items-center justify-between text-[11px] text-zinc-400">
          <span className="font-mono text-zinc-400">
            Link Status: <span className={connectionStatus === 'SERIAL_ERROR' ? 'text-rose-400 font-semibold' : 'text-zinc-200'}>{statusMessage}</span>
          </span>
          <span className="text-zinc-500 hidden sm:inline">
            115200 Baud • Standard 8N1
          </span>
        </div>

        {/* GUIDED RECOVERY BOX ON PORT OPEN ERROR */}
        {connectionStatus === 'SERIAL_ERROR' && (
          <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-600/50 text-xs text-rose-200 space-y-1.5 animate-fadeIn">
            <div className="font-bold flex items-center gap-1.5 text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              How to Fix "Failed to open serial port":
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-zinc-300 pl-1 font-mono">
              <li>
                <strong className="text-rose-300">Step 1:</strong> In the <strong>Arduino IDE</strong>, close the <strong>Serial Monitor</strong> and <strong>Serial Plotter</strong> (press <kbd className="px-1 py-0.5 rounded bg-zinc-800 text-zinc-200">Ctrl+Shift+M</kbd> to toggle off).
              </li>
              <li>
                <strong className="text-rose-300">Step 2:</strong> <strong>Unplug the Arduino USB cable</strong> from your computer, wait 2 seconds, and plug it back in.
              </li>
              <li>
                <strong className="text-rose-300">Step 3:</strong> In the Chrome port selector dialog, select <strong>Arduino Uno</strong> or <strong>USB-SERIAL CH340</strong> (do not select Bluetooth or COM1).
              </li>
              <li>
                <strong className="text-rose-300">Step 4:</strong> Click the <span className="text-cyan-400 font-semibold">Connect Arduino</span> button again.
              </li>
            </ul>
          </div>
        )}

        {/* COLLAPSIBLE LIVE SERIAL MONITOR / STREAM INSPECTOR */}
        {showTerminal && (
          <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-[11px] space-y-1.5 animate-fadeIn">
            <div className="flex items-center justify-between text-zinc-400 pb-1 border-b border-zinc-800/80">
              <span className="flex items-center gap-1.5 text-zinc-300 font-bold">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                Live Serial Stream Monitor (Last 15 Lines)
              </span>
              <span className="text-[10px] text-zinc-500">
                {rawLines.length > 0 ? `${rawLines.length} lines captured` : 'Waiting for incoming bytes...'}
              </span>
            </div>
            <div className="max-h-36 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
              {rawLines.length === 0 ? (
                <div className="text-zinc-500 italic py-2">
                  No serial packets received yet. Make sure your Arduino is connected and emitting over 115200 baud.
                </div>
              ) : (
                rawLines.map((line, idx) => (
                  <div key={idx} className="truncate text-zinc-300 hover:text-white transition-colors">
                    <span className="text-zinc-600 select-none mr-2">[{idx + 1}]</span>
                    <span className={line.startsWith('{') ? 'text-emerald-300' : 'text-cyan-300'}>
                      {line}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
