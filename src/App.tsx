import { useState, useMemo } from 'react';
import { useArduino } from './hooks/useArduino';
import { calculateSessionMetrics } from './utils/reportMetrics';
import { Header } from './components/Header';
import { ConnectionPanel } from './components/ConnectionPanel';
import { BridgeScene } from './components/BridgeScene';
import { TelemetryPanel } from './components/TelemetryPanel';
import { TelemetryCharts } from './components/TelemetryCharts';
import { EventTimeline } from './components/EventTimeline';
import { StructuralReport } from './components/StructuralReport';
import { Info } from 'lucide-react';

export function App() {
  const {
    connectionStatus,
    statusMessage,
    telemetry,
    history,
    events,
    malformedCount,
    rawLines,
    timeSinceLastPacketMs,
    isDemoMode,
    isSupported,
    connect,
    disconnect,
    startDemo,
    stopDemo,
    triggerDemoTap,
    clearSession,
  } = useArduino();

  const [isReportOpen, setIsReportOpen] = useState(false);

  // Compute session metrics dynamically from valid telemetry
  const metrics = useMemo(() => {
    return calculateSessionMetrics(history, events, malformedCount, isDemoMode);
  }, [history, events, malformedCount, isDemoMode]);

  const isAlert = connectionStatus === 'VIBRATION_ALERT';
  const isConnected =
    connectionStatus === 'CONNECTED_NORMAL' ||
    connectionStatus === 'VIBRATION_ALERT' ||
    connectionStatus === 'TELEMETRY_STALE' ||
    connectionStatus === 'SENSOR_UNAVAILABLE';

  const handleToggleDemo = () => {
    if (isDemoMode) {
      stopDemo();
    } else {
      startDemo();
    }
  };

  return (
    <div className="min-h-screen bg-[#080a0f] text-zinc-100 flex flex-col p-3 sm:p-5 gap-4">
      {/* COMMAND CENTRE TOP BAR */}
      <Header
        connectionStatus={connectionStatus}
        timeSinceLastPacketMs={timeSinceLastPacketMs}
        isDemoMode={isDemoMode}
        onToggleDemo={handleToggleDemo}
        onSimulateTap={triggerDemoTap}
        onOpenReport={() => setIsReportOpen(true)}
      />

      {/* MAIN DASHBOARD CONTENT */}
      <main className="flex-1 flex flex-col gap-4">
        {/* TOP ROW: SERIAL HARDWARE CONNECTION BAR */}
        <ConnectionPanel
          connectionStatus={connectionStatus}
          statusMessage={statusMessage}
          isSupported={isSupported}
          timeSinceLastPacketMs={timeSinceLastPacketMs}
          malformedCount={malformedCount}
          packetRateHz={metrics.packetRateHz}
          isDemoMode={isDemoMode}
          rawLines={rawLines}
          onConnect={connect}
          onDisconnect={disconnect}
        />

        {/* MIDDLE SECTION: 3D DIGITAL TWIN + TELEMETRY CARDS */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          {/* 3D BRIDGE CANVAS (DOMINANT VISUAL COMPONENT) */}
          <div className="xl:col-span-8 flex flex-col h-[460px] xl:h-[520px]">
            <BridgeScene
              telemetry={telemetry}
              isAlert={isAlert}
              isConnected={isConnected}
            />
          </div>

          {/* TELEMETRY & EVENT LOG COLUMN */}
          <div className="xl:col-span-4 flex flex-col gap-4 justify-between">
            <TelemetryPanel telemetry={telemetry} isAlert={isAlert} />
            <EventTimeline events={events} onClearSession={clearSession} />
          </div>
        </div>

        {/* BOTTOM SECTION: REAL-TIME CHARTS */}
        <div className="w-full">
          <TelemetryCharts history={history} isAlert={isAlert} />
        </div>
      </main>

      {/* FOOTER & PROTOTYPE HONESTY NOTICE */}
      <footer className="flex flex-wrap items-center justify-between gap-2 pt-3 pb-1 border-t border-zinc-800/80 text-[11px] text-zinc-500 font-mono print:hidden">
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-cyan-400" />
          <span>
            StructSense Smart Bridge Prototype • Hardware: Arduino Uno + MPU-6050 + SW-420 • Web Serial 115200 Baud
          </span>
        </div>
        <div>
          Educational Demo Platform • Non-Structural Displacement Visualization
        </div>
      </footer>

      {/* STRUCTURAL REPORT MODAL */}
      {isReportOpen && (
        <StructuralReport
          metrics={metrics}
          events={events}
          onClose={() => setIsReportOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
