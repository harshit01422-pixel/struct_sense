import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';
import type { TelemetryData } from '../types/telemetry';
import { LineChart as ChartIcon, Zap } from 'lucide-react';

interface TelemetryChartsProps {
  history: TelemetryData[];
  isAlert: boolean;
}

export const TelemetryCharts: React.FC<TelemetryChartsProps> = ({
  history,
  isAlert,
}) => {
  // Format data for Recharts, taking last 100-150 points for rendering fluidity
  const chartData = useMemo(() => {
    return history.slice(-120).map((item, index) => {
      const d = new Date(item.timestamp);
      const timeStr = `${d.getMinutes().toString().padStart(2, '0')}:${d
        .getSeconds()
        .toString()
        .padStart(2, '0')}.${Math.floor(d.getMilliseconds() / 100)}`;
      return {
        index,
        time: timeStr,
        ax: item.ax,
        ay: item.ay,
        az: item.az,
        dev: item.dev,
        alert: item.alert,
      };
    });
  }, [history]);

  const hasData = chartData.length > 0;

  return (
    <div className="flex flex-col gap-3">
      {/* SECTION HEADER */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
          <ChartIcon className="w-4 h-4 text-cyan-400" />
          Real-Time Waveform Analysis (Latest Buffer)
        </h3>
        <span className="text-[11px] text-zinc-500 font-mono">
          Rolling Buffer: {history.length} / 300 samples
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* CHART 1: MAGNITUDE DEVIATION (dev) */}
        <div className="p-3.5 rounded-xl border border-zinc-800/80 bg-zinc-900/60 backdrop-blur-md flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-xs font-semibold text-zinc-200">
                Acceleration Deviation |mag - 1.0g|
              </span>
              <span className="block text-[10px] text-zinc-500 font-mono">
                Trigger limit: 0.150g • Dynamic vibration excursion
              </span>
            </div>
            {isAlert && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-red-950/80 border border-red-500 text-red-300 animate-pulse">
                <Zap className="w-3 h-3 text-red-400" />
                EXCURSION
              </span>
            )}
          </div>

          <div className="h-44 w-full">
            {hasData ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 12, left: -22, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis
                    dataKey="time"
                    tick={{ fill: '#71717a', fontSize: 9, fontFamily: 'monospace' }}
                    interval={Math.floor(chartData.length / 4) || 1}
                  />
                  <YAxis
                    domain={[0, (dataMax: number) => Math.max(0.25, Math.ceil(dataMax * 1.2 * 10) / 10)]}
                    tick={{ fill: '#71717a', fontSize: 9, fontFamily: 'monospace' }}
                    tickFormatter={(v: number) => v.toFixed(2)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#090d16',
                      borderColor: '#27272a',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                    }}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                  {/* Alert Threshold Reference Line */}
                  <ReferenceLine
                    y={0.15}
                    stroke="#ef4444"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{
                      value: 'ALERT 0.15g',
                      fill: '#ef4444',
                      fontSize: 9,
                      position: 'top',
                      fontFamily: 'monospace',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="dev"
                    stroke="#00f2fe"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-zinc-600 font-mono border border-dashed border-zinc-800 rounded-lg">
                No active stream data • Connect Arduino or enable Demo Mode
              </div>
            )}
          </div>
        </div>

        {/* CHART 2: 3-AXIS ACCELEROMETER TRACES */}
        <div className="p-3.5 rounded-xl border border-zinc-800/80 bg-zinc-900/60 backdrop-blur-md flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-xs font-semibold text-zinc-200">
                Tri-Axial Acceleration Traces (X, Y, Z)
              </span>
              <span className="block text-[10px] text-zinc-500 font-mono">
                Static gravity on Z (~1.0g) • Lateral dynamics on X/Y
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono">
              <span className="flex items-center gap-1 text-cyan-400">
                <span className="w-2 h-2 rounded-full bg-cyan-400" /> X
              </span>
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> Y
              </span>
              <span className="flex items-center gap-1 text-blue-400">
                <span className="w-2 h-2 rounded-full bg-blue-400" /> Z
              </span>
            </div>
          </div>

          <div className="h-44 w-full">
            {hasData ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 12, left: -22, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis
                    dataKey="time"
                    tick={{ fill: '#71717a', fontSize: 9, fontFamily: 'monospace' }}
                    interval={Math.floor(chartData.length / 4) || 1}
                  />
                  <YAxis
                    domain={[-1.2, 1.8]}
                    tick={{ fill: '#71717a', fontSize: 9, fontFamily: 'monospace' }}
                    tickFormatter={(v: number) => v.toFixed(1)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#090d16',
                      borderColor: '#27272a',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                    }}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                  <ReferenceLine y={1.0} stroke="#475569" strokeDasharray="2 2" />
                  <ReferenceLine y={0.0} stroke="#334155" />
                  <Line
                    type="monotone"
                    dataKey="ax"
                    stroke="#00f2fe"
                    strokeWidth={1.5}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="ay"
                    stroke="#10b981"
                    strokeWidth={1.5}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="az"
                    stroke="#60a5fa"
                    strokeWidth={1.5}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-zinc-600 font-mono border border-dashed border-zinc-800 rounded-lg">
                No active stream data • Connect Arduino or enable Demo Mode
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
