import React from 'react';
import type { TelemetryData } from '../types/telemetry';
import {
  Compass,
  Activity,
  Layers,
  HelpCircle,
  BellRing,
  CheckCircle2,
  AlertOctagon,
} from 'lucide-react';

interface TelemetryPanelProps {
  telemetry: TelemetryData | null;
  isAlert: boolean;
}

export const TelemetryPanel: React.FC<TelemetryPanelProps> = ({
  telemetry,
  isAlert,
}) => {
  // If no hardware is connected yet
  const t = telemetry ?? {
    ax: 0,
    ay: 0,
    az: 1.0,
    mag: 1.0,
    dev: 0,
    tilt: 0,
    sw: 0,
    swHits: 0,
    mpuHits: 0,
    mpuWorking: false,
    alert: false,
    timestamp: 0,
  };

  const isConnected = telemetry !== null;

  // Threshold 0.15g marker
  const devPercent = Math.min(100, (t.dev / 0.3) * 100);

  return (
    <div className="flex flex-col gap-3">
      {/* SECTION TITLE */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-cyan-400" />
          Live Sensor Telemetry
        </h3>
        {!isConnected && (
          <span className="text-[11px] text-zinc-500 italic font-mono">
            Awaiting Hardware Link
          </span>
        )}
      </div>

      {/* METRIC CARDS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {/* CARD 1: 3-AXIS ACCELEROMETER */}
        <div className="flex flex-col justify-between p-3 rounded-xl border border-zinc-800/80 bg-zinc-900/60 backdrop-blur-md relative group">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="font-semibold text-zinc-300">Accel Tri-Axial</span>
            <div className="relative cursor-help" title="MPU-6050 raw gravitational and dynamic acceleration components in g units.">
              <HelpCircle className="w-3.5 h-3.5 text-zinc-500 hover:text-cyan-400" />
            </div>
          </div>

          <div className="my-2 space-y-1.5 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-cyan-400 font-bold">X:</span>
              <span className="text-zinc-200">{isConnected ? `${t.ax.toFixed(3)} g` : '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-emerald-400 font-bold">Y:</span>
              <span className="text-zinc-200">{isConnected ? `${t.ay.toFixed(3)} g` : '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-blue-400 font-bold">Z:</span>
              <span className="text-zinc-200">{isConnected ? `${t.az.toFixed(3)} g` : '—'}</span>
            </div>
          </div>

          <div className="text-[10px] text-zinc-500 font-mono">
            Range: ±2g • I2C (0x68)
          </div>
        </div>

        {/* CARD 2: MAGNITUDE & GRAVITY DEVIATION */}
        <div className="flex flex-col justify-between p-3 rounded-xl border border-zinc-800/80 bg-zinc-900/60 backdrop-blur-md relative group">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="font-semibold text-zinc-300">Gravity Dev (dev)</span>
            <div className="relative cursor-help" title="dev = |mag - 1.0g|. Measures deviation from static 1g Earth gravity. Threshold = 0.15g. Note: This indicates vibration acceleration, not structural strain or stress.">
              <HelpCircle className="w-3.5 h-3.5 text-zinc-500 hover:text-cyan-400" />
            </div>
          </div>

          <div className="my-2">
            <div className="text-2xl font-bold font-mono text-zinc-100 flex items-baseline gap-1">
              <span>{isConnected ? t.dev.toFixed(4) : '—'}</span>
              <span className="text-xs font-normal text-zinc-500">g</span>
            </div>
            <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
              Mag: {isConnected ? `${t.mag.toFixed(3)} g` : '—'}
            </div>
          </div>

          {/* Micro Progress Bar vs Threshold */}
          <div>
            <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden relative">
              {/* 0.15g threshold reference mark at 50% */}
              <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-amber-500 z-10" />
              <div
                className={`h-full transition-all duration-200 ${
                  t.dev >= 0.15 ? 'bg-red-500' : 'bg-cyan-500'
                }`}
                style={{ width: isConnected ? `${devPercent}%` : '0%' }}
              />
            </div>
            <div className="flex justify-between text-[9px] text-zinc-500 mt-1 font-mono">
              <span>0.0g</span>
              <span className="text-amber-400">0.15g Limit</span>
              <span>0.30g</span>
            </div>
          </div>
        </div>

        {/* CARD 3: TILT & HARDWARE COUNTERS */}
        <div className="flex flex-col justify-between p-3 rounded-xl border border-zinc-800/80 bg-zinc-900/60 backdrop-blur-md relative group">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="font-semibold text-zinc-300 flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              Deck Tilt Angle
            </span>
            <div className="relative cursor-help" title="Incline angle derived from gravitational vector alignment relative to perpendicular normal.">
              <HelpCircle className="w-3.5 h-3.5 text-zinc-500 hover:text-cyan-400" />
            </div>
          </div>

          <div className="my-2">
            <div className="text-2xl font-bold font-mono text-zinc-100 flex items-baseline gap-1">
              <span>{isConnected ? t.tilt.toFixed(1) : '—'}</span>
              <span className="text-xs font-normal text-zinc-500">°</span>
            </div>
            <div className="text-[11px] text-zinc-400 font-mono mt-0.5 flex justify-between">
              <span>MPU Hits: <strong className="text-cyan-400">{isConnected ? t.mpuHits : '—'}</strong></span>
              <span>SW Hits: <strong className="text-cyan-400">{isConnected ? t.swHits : '—'}</strong></span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
            <span>MPU6050 Health:</span>
            {isConnected ? (
              t.mpuWorking ? (
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> OK
                </span>
              ) : (
                <span className="text-rose-400 font-semibold flex items-center gap-1">
                  <AlertOctagon className="w-3 h-3" /> FAULT
                </span>
              )
            ) : (
              <span>OFFLINE</span>
            )}
          </div>
        </div>

        {/* CARD 4: SW-420 VIBRATION STATE & ALERT HOLD */}
        <div className={`flex flex-col justify-between p-3 rounded-xl border backdrop-blur-md relative group transition-all duration-300 ${
          isAlert
            ? 'border-red-500/70 bg-red-950/40 shadow-[0_0_16px_rgba(239,68,68,0.3)]'
            : 'border-zinc-800/80 bg-zinc-900/60'
        }`}>
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="font-semibold text-zinc-300 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              SW-420 & Alert
            </span>
            <div className="relative cursor-help" title="SW-420 high-sensitivity spring vibration sensor on digital pin D2. Triggers alert when hits >= 5 within 1000ms window.">
              <HelpCircle className="w-3.5 h-3.5 text-zinc-500 hover:text-cyan-400" />
            </div>
          </div>

          <div className="my-2">
            <div className="flex items-center gap-2">
              <div
                className={`p-1.5 rounded-lg border ${
                  isAlert
                    ? 'bg-red-500/20 border-red-500/50 text-red-400 animate-pulse'
                    : isConnected
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-500'
                }`}
              >
                <BellRing className="w-5 h-5" />
              </div>
              <div>
                <span className={`text-sm font-bold tracking-wider uppercase font-mono ${
                  isAlert
                    ? 'text-red-400'
                    : isConnected
                    ? 'text-emerald-400'
                    : 'text-zinc-500'
                }`}>
                  {isAlert ? 'ALERT ACTIVE' : isConnected ? 'NORMAL' : 'IDLE'}
                </span>
                <span className="block text-[10px] text-zinc-400 font-mono">
                  {isAlert ? '1500ms Hold Window' : 'Monitoring Nominal'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
            <span>D2 Digital State:</span>
            <span className={`font-bold px-1.5 py-0.5 rounded ${
              t.sw === 1 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-zinc-800 text-zinc-400'
            }`}>
              {isConnected ? (t.sw === 1 ? 'HIGH (1)' : 'LOW (0)') : '—'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
