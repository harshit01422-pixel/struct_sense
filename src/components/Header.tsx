import React, { useState, useEffect } from 'react';
import type { ConnectionStatus } from '../types/telemetry';
import { StatusIndicator } from './StatusIndicator';
import {
  FileText,
  Clock,
  Play,
  Square,
  Sparkles,
} from 'lucide-react';

interface HeaderProps {
  connectionStatus: ConnectionStatus;
  timeSinceLastPacketMs: number;
  isDemoMode: boolean;
  onToggleDemo: () => void;
  onSimulateTap: () => void;
  onOpenReport: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  connectionStatus,
  timeSinceLastPacketMs,
  isDemoMode,
  onToggleDemo,
  onSimulateTap,
  onOpenReport,
}) => {
  const [clock, setClock] = useState<string>('');
  const [sessionSeconds, setSessionSeconds] = useState<number>(0);

  // Live wall clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setClock(
        now.toLocaleTimeString([], {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Session elapsed timer
  useEffect(() => {
    const interval = setInterval(() => {
      setSessionSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60)
      .toString()
      .padStart(2, '0');
    const secs = (totalSec % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md shadow-xl print:hidden">
      {/* BRAND & SUBTITLE */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400 rotate-45 shadow-[0_0_8px_#00f2fe]" />
            <h1 className="text-xl font-black tracking-wider text-white uppercase font-sans">
              STRUCTSENSE
            </h1>
            <span className="px-1.5 py-0.5 text-[9px] font-mono tracking-widest uppercase bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 rounded">
              v1.0 IoT
            </span>
          </div>
          <p className="text-xs text-zinc-400 tracking-wide font-mono mt-0.5">
            Live Structural Health Monitoring & Digital Twin
          </p>
        </div>
      </div>

      {/* CENTER STATUS & TIMERS */}
      <div className="flex flex-wrap items-center gap-3">
        {/* WALL CLOCK & SESSION DURATION */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-zinc-900/90 border border-zinc-800 text-xs font-mono text-zinc-300">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>{clock}</span>
          </div>
          <span className="text-zinc-600">|</span>
          <div className="flex items-center gap-1">
            <span className="text-zinc-500">Session:</span>
            <span className="text-zinc-200">{formatTimer(sessionSeconds)}</span>
          </div>
        </div>

        {/* PROMINENT LIVE STATUS INDICATOR */}
        <StatusIndicator
          status={connectionStatus}
          timeSinceLastPacketMs={timeSinceLastPacketMs}
        />
      </div>

      {/* ACTION CONTROLS */}
      <div className="flex flex-wrap items-center gap-2">
        {/* DEMO MODE TOGGLE */}
        <button
          onClick={onToggleDemo}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg font-mono tracking-wide uppercase transition-all shadow-sm ${
            isDemoMode
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
              : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-700/80'
          }`}
          title={isDemoMode ? 'Stop simulated data generator' : 'Rehearse UI with simulated sensor stream'}
        >
          {isDemoMode ? (
            <>
              <Square className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              Stop Demo
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 text-zinc-400" />
              Demo Mode
            </>
          )}
        </button>

        {/* DEMO MODE: TRIGGER SIMULATED IMPACT BUTTON */}
        {isDemoMode && (
          <button
            onClick={onSimulateTap}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg font-mono tracking-wide uppercase bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-500/70 shadow-[0_0_12px_rgba(239,68,68,0.4)] transition-all animate-bounce"
            title="Simulate physical impact / tap on bridge"
          >
            <Sparkles className="w-3.5 h-3.5 text-red-400" />
            Simulate Tap
          </button>
        )}

        {/* GENERATE REPORT BUTTON */}
        <button
          onClick={onOpenReport}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg font-mono tracking-wide uppercase bg-zinc-900 hover:bg-zinc-800 text-cyan-400 hover:text-cyan-300 border border-cyan-800/60 hover:border-cyan-500/80 shadow-md transition-all active:scale-95"
        >
          <FileText className="w-4 h-4 text-cyan-400" />
          Generate Report
        </button>
      </div>
    </header>
  );
};
