import React from 'react';
import type { ConnectionStatus } from '../types/telemetry';

interface StatusIndicatorProps {
  status: ConnectionStatus;
  timeSinceLastPacketMs?: number;
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  timeSinceLastPacketMs = 0,
  className = '',
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'CONNECTED_NORMAL':
        return {
          label: 'CONNECTED — NORMAL',
          color: 'bg-emerald-500',
          textColor: 'text-emerald-400',
          borderColor: 'border-emerald-500/40',
          glowColor: 'shadow-[0_0_12px_rgba(16,185,129,0.4)]',
          pulse: false,
        };
      case 'VIBRATION_ALERT':
        return {
          label: 'VIBRATION EVENT DETECTED',
          color: 'bg-red-500',
          textColor: 'text-red-400',
          borderColor: 'border-red-500/60',
          glowColor: 'shadow-[0_0_16px_rgba(239,68,68,0.7)]',
          pulse: true,
        };
      case 'TELEMETRY_STALE':
        return {
          label: `TELEMETRY STALE (${(timeSinceLastPacketMs / 1000).toFixed(1)}s)`,
          color: 'bg-amber-500',
          textColor: 'text-amber-400',
          borderColor: 'border-amber-500/50',
          glowColor: 'shadow-[0_0_12px_rgba(245,158,11,0.5)]',
          pulse: true,
        };
      case 'CONNECTING':
        return {
          label: 'CONNECTING...',
          color: 'bg-cyan-500',
          textColor: 'text-cyan-400',
          borderColor: 'border-cyan-500/40',
          glowColor: 'shadow-[0_0_12px_rgba(6,182,212,0.4)]',
          pulse: true,
        };
      case 'SENSOR_UNAVAILABLE':
        return {
          label: 'SENSOR UNAVAILABLE (MPU I2C ERR)',
          color: 'bg-orange-500',
          textColor: 'text-orange-400',
          borderColor: 'border-orange-500/50',
          glowColor: 'shadow-[0_0_12px_rgba(249,115,22,0.4)]',
          pulse: true,
        };
      case 'SERIAL_ERROR':
        return {
          label: 'SERIAL PORT ERROR',
          color: 'bg-rose-600',
          textColor: 'text-rose-400',
          borderColor: 'border-rose-600/50',
          glowColor: 'shadow-[0_0_12px_rgba(225,29,72,0.5)]',
          pulse: false,
        };
      case 'DISCONNECTED':
      default:
        return {
          label: 'DISCONNECTED',
          color: 'bg-zinc-500',
          textColor: 'text-zinc-400',
          borderColor: 'border-zinc-700',
          glowColor: '',
          pulse: false,
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border bg-zinc-900/80 backdrop-blur-md text-xs font-semibold tracking-wider uppercase ${config.borderColor} ${config.textColor} ${config.glowColor} ${className}`}
    >
      <span className="relative flex h-2.5 w-2.5">
        {config.pulse && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.color}`}
          />
        )}
        <span
          className={`relative inline-flex rounded-full h-2.5 w-2.5 ${config.color}`}
        />
      </span>
      <span>{config.label}</span>
    </div>
  );
};
