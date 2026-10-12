import { useState, useEffect, useRef, useCallback } from 'react';
import type {
  TelemetryData,
  ConnectionStatus,
  BridgeEvent,
} from '../types/telemetry';
import { arduinoSerial, ArduinoSerialService } from '../services/arduinoSerial';
import { mockTelemetry } from '../services/mockTelemetry';
import { EventDetector } from '../utils/eventDetection';

const MAX_HISTORY_POINTS = 300;
const STALE_TIMEOUT_MS = 2000;

export function useArduino() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('DISCONNECTED');
  const [statusMessage, setStatusMessage] = useState<string>('Ready to connect hardware.');
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [history, setHistory] = useState<TelemetryData[]>([]);
  const [events, setEvents] = useState<BridgeEvent[]>([]);
  const [malformedCount, setMalformedCount] = useState<number>(0);
  const [rawLines, setRawLines] = useState<string[]>([]);
  const [lastPacketTime, setLastPacketTime] = useState<number>(0);
  const [timeSinceLastPacketMs, setTimeSinceLastPacketMs] = useState<number>(0);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  const eventDetectorRef = useRef<EventDetector>(new EventDetector());
  const lastPacketTimeRef = useRef<number>(0);
  const isDemoRef = useRef<boolean>(false);
  const isConnectedRef = useRef<boolean>(false);

  // Keep ref synchronized
  useEffect(() => {
    isDemoRef.current = isDemoMode;
  }, [isDemoMode]);

  const handleIncomingData = useCallback((data: TelemetryData) => {
    const now = Date.now();
    lastPacketTimeRef.current = now;
    setLastPacketTime(now);
    setTelemetry(data);

    // Update rolling history buffer (bounded at 300 records)
    setHistory((prev) => {
      const next = [...prev, data];
      if (next.length > MAX_HISTORY_POINTS) {
        return next.slice(next.length - MAX_HISTORY_POINTS);
      }
      return next;
    });

    // Deduplicated event processing
    const { newEvent, resolvedEvent } = eventDetectorRef.current.process(data);

    if (newEvent) {
      setEvents((prev) => [newEvent, ...prev]);
    } else if (resolvedEvent) {
      setEvents((prev) =>
        prev.map((evt) => (evt.id === resolvedEvent.id ? resolvedEvent : evt))
      );
    }

    // Update connection status
    if (data.alert) {
      setConnectionStatus('VIBRATION_ALERT');
    } else if (!data.mpuWorking) {
      setConnectionStatus('SENSOR_UNAVAILABLE');
    } else {
      setConnectionStatus('CONNECTED_NORMAL');
    }
  }, []);

  // Connect real Arduino over Web Serial API
  const connect = useCallback(async () => {
    if (isDemoRef.current) {
      mockTelemetry.stop();
      setIsDemoMode(false);
      isDemoRef.current = false;
      eventDetectorRef.current.reset();
      setHistory([]);
      setEvents([]);
    }

    setConnectionStatus('CONNECTING');
    setStatusMessage('Initiating Web Serial connection...');

    const success = await arduinoSerial.connect({
      onData: handleIncomingData,
      onError: (err) => {
        setConnectionStatus('SERIAL_ERROR');
        setStatusMessage(err);
      },
      onStatusChange: (status) => {
        setStatusMessage(status);
      },
      onDisconnect: () => {
        isConnectedRef.current = false;
        setConnectionStatus('DISCONNECTED');
        setStatusMessage('Serial port closed.');
      },
      onMalformedPacket: () => {
        setMalformedCount((c) => c + 1);
      },
      onRawLine: (raw) => {
        setRawLines((prev) => [raw, ...prev].slice(0, 15));
      },
    });

    if (success) {
      isConnectedRef.current = true;
    } else {
      isConnectedRef.current = false;
      setConnectionStatus('DISCONNECTED');
    }
  }, [handleIncomingData]);

  // Disconnect real Arduino
  const disconnect = useCallback(async () => {
    isConnectedRef.current = false;
    await arduinoSerial.disconnect();
    setConnectionStatus('DISCONNECTED');
    setStatusMessage('Disconnected by user.');
  }, []);

  // Demonstration Mode toggle
  const startDemo = useCallback(() => {
    if (isConnectedRef.current) {
      arduinoSerial.disconnect();
      isConnectedRef.current = false;
    }

    // Reset history and event detector for an isolated demo session
    eventDetectorRef.current.reset();
    setHistory([]);
    setEvents([]);
    setMalformedCount(0);
    setIsDemoMode(true);
    isDemoRef.current = true;

    mockTelemetry.start({
      onData: handleIncomingData,
      onStatusChange: (msg) => setStatusMessage(msg),
    });
  }, [handleIncomingData]);

  const stopDemo = useCallback(() => {
    mockTelemetry.stop();
    setIsDemoMode(false);
    isDemoRef.current = false;
    setConnectionStatus('DISCONNECTED');
    setStatusMessage('Demo Mode stopped.');
    eventDetectorRef.current.reset();
  }, []);

  const triggerDemoTap = useCallback(() => {
    if (isDemoRef.current) {
      mockTelemetry.triggerSimulatedEvent();
    }
  }, []);

  // Clear Session History action
  const clearSession = useCallback(() => {
    eventDetectorRef.current.reset();
    setHistory([]);
    setEvents([]);
    setMalformedCount(0);
  }, []);

  // Stale Telemetry and heartbeat detector
  useEffect(() => {
    const interval = window.setInterval(() => {
      const now = Date.now();
      const last = lastPacketTimeRef.current;
      const elapsed = last > 0 ? now - last : 0;
      setTimeSinceLastPacketMs(elapsed);

      const isActive = isConnectedRef.current || isDemoRef.current;
      if (isActive && last > 0 && elapsed > STALE_TIMEOUT_MS) {
        setConnectionStatus((prev) => {
          if (prev !== 'TELEMETRY_STALE' && prev !== 'SERIAL_ERROR' && prev !== 'DISCONNECTED') {
            setStatusMessage(`Telemetry stale (>2000ms without packet)`);
            return 'TELEMETRY_STALE';
          }
          return prev;
        });
      }
    }, 250);

    return () => clearInterval(interval);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      arduinoSerial.disconnect();
      mockTelemetry.stop();
    };
  }, []);

  return {
    connectionStatus,
    statusMessage,
    telemetry,
    history,
    events,
    malformedCount,
    rawLines,
    lastPacketTime,
    timeSinceLastPacketMs,
    isDemoMode,
    isSupported: ArduinoSerialService.isSupported(),
    connect,
    disconnect,
    startDemo,
    stopDemo,
    triggerDemoTap,
    clearSession,
  };
}
