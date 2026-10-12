import type { TelemetryData } from '../types/telemetry';

export interface SerialCallbacks {
  onData: (data: TelemetryData) => void;
  onError: (error: string) => void;
  onStatusChange: (statusText: string) => void;
  onDisconnect: () => void;
  onMalformedPacket: (raw: string) => void;
  onRawLine?: (line: string) => void;
}

export class ArduinoSerialService {
  private port: SerialPort | null = null;
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private isReading = false;
  private buffer = '';
  private callbacks: SerialCallbacks | null = null;
  private disconnectHandler: ((e: Event) => void) | null = null;

  public static isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'serial' in navigator;
  }

  public async connect(callbacks: SerialCallbacks): Promise<boolean> {
    if (!ArduinoSerialService.isSupported()) {
      callbacks.onError(
        'Web Serial API is not supported in this browser. Please use Google Chrome or Edge on localhost.'
      );
      return false;
    }

    this.callbacks = callbacks;

    try {
      this.callbacks.onStatusChange('Requesting USB Serial Port...');
      // Request port from user gesture
      this.port = await navigator.serial.requestPort();

      this.callbacks.onStatusChange('Opening port at 115200 baud...');
      // Use clean standard baudRate configuration without driver-restrictive overrides
      await this.port.open({ baudRate: 115200 });

      // Listen for physical unplug event
      this.disconnectHandler = (event: Event) => {
        if ('port' in event && event.port === this.port) {
          this.handleDeviceLost();
        }
      };
      navigator.serial.addEventListener('disconnect', this.disconnectHandler);

      this.callbacks.onStatusChange('Connected. Listening for telemetry stream...');
      this.startReading();
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('No port selected') || msg.includes('cancelled')) {
        this.callbacks?.onStatusChange('Connection cancelled by user.');
      } else if (msg.includes('Failed to open serial port') || msg.includes('Access denied')) {
        this.callbacks?.onError(
          'COM Port Locked: The Arduino COM port is currently in use by another program. Please close the Arduino IDE Serial Monitor / Serial Plotter, or unplug and re-plug the USB cable.'
        );
      } else {
        this.callbacks?.onError(`Failed to connect: ${msg}`);
      }
      await this.cleanup();
      return false;
    }
  }

  private async startReading(): Promise<void> {
    if (!this.port || !this.port.readable) {
      this.callbacks?.onError('Serial port is not readable.');
      return;
    }

    this.isReading = true;
    const decoder = new TextDecoder();
    this.buffer = '';

    try {
      this.reader = this.port.readable.getReader();

      while (this.isReading && this.reader) {
        const { value, done } = await this.reader.read();
        if (done) {
          break;
        }

        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          this.processChunk(chunk);
        }
      }
    } catch (err) {
      if (this.isReading) {
        const msg = err instanceof Error ? err.message : String(err);
        this.callbacks?.onError(`Serial stream read error: ${msg}`);
      }
    } finally {
      await this.releaseReader();
    }
  }

  private processChunk(chunk: string): void {
    this.buffer += chunk;
    const lines = this.buffer.split(/\r?\n/);

    // Keep the last element (which may be an incomplete line) in the buffer
    this.buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Broadcast raw line to stream inspector monitor
      this.callbacks?.onRawLine?.(trimmed);

      // Path 1: Pure JSON format
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        try {
          const parsed = JSON.parse(trimmed);
          const telemetry = this.sanitizeTelemetry(parsed);
          if (telemetry) {
            this.callbacks?.onData(telemetry);
            continue;
          }
        } catch {
          // If JSON.parse fails, attempt legacy parse below
        }
      }

      // Path 2: Legacy Human-Readable Arduino format fallback
      // e.g. "tilt=2.15deg dev=0.034g sw=0 swHits=0 mpuHits=0 GREEN (normal)"
      const legacyTelemetry = this.parseLegacyLine(trimmed);
      if (legacyTelemetry) {
        this.callbacks?.onData(legacyTelemetry);
        continue;
      }

      // Neither valid JSON nor recognized legacy stream
      this.callbacks?.onMalformedPacket(trimmed);
    }
  }

  private parseLegacyLine(line: string): TelemetryData | null {
    const devMatch = line.match(/dev\s*=\s*([-\d.]+)/i);
    const tiltMatch = line.match(/tilt\s*=\s*([-\d.]+)/i);
    const swMatch = line.match(/sw\s*=\s*([01])/i);
    const swHitsMatch = line.match(/swHits\s*=\s*(\d+)/i);
    const mpuHitsMatch = line.match(/mpuHits\s*=\s*(\d+)/i);
    const alert = /RED|alert/i.test(line);

    if (!devMatch && !tiltMatch && !swHitsMatch) {
      return null;
    }

    const dev = devMatch ? Math.abs(parseFloat(devMatch[1])) : 0;
    const tilt = tiltMatch ? parseFloat(tiltMatch[1]) : 0;
    const sw = swMatch ? parseInt(swMatch[1], 10) : 0;
    const swHits = swHitsMatch ? parseInt(swHitsMatch[1], 10) : 0;
    const mpuHits = mpuHitsMatch ? parseInt(mpuHitsMatch[1], 10) : 0;

    const mag = 1.0 + (dev > 0 ? dev : 0);
    const tiltRad = (tilt * Math.PI) / 180;
    const az = mag * Math.cos(tiltRad);
    const ax = mag * Math.sin(tiltRad) * 0.7;
    const ay = mag * Math.sin(tiltRad) * 0.7;

    return {
      ax: Number(ax.toFixed(4)),
      ay: Number(ay.toFixed(4)),
      az: Number(az.toFixed(4)),
      mag: Number(mag.toFixed(4)),
      dev: Number(dev.toFixed(4)),
      tilt: Number(tilt.toFixed(2)),
      sw,
      swHits,
      mpuHits,
      mpuWorking: true,
      alert,
      timestamp: Date.now(),
    };
  }

  private sanitizeTelemetry(data: Record<string, unknown>): TelemetryData | null {
    // Validate required fields
    const ax = Number(data.ax);
    const ay = Number(data.ay);
    const az = Number(data.az);

    if (isNaN(ax) || isNaN(ay) || isNaN(az)) {
      return null;
    }

    // Derive or use provided mag
    let mag = Number(data.mag);
    if (isNaN(mag)) {
      mag = Math.sqrt(ax * ax + ay * ay + az * az);
    }

    // Derive or use provided dev
    let dev = Number(data.dev);
    if (isNaN(dev)) {
      dev = Math.abs(mag - 1.0);
    }

    // Derive or use provided tilt
    let tilt = Number(data.tilt);
    if (isNaN(tilt)) {
      // Tilt in degrees from vertical (Z-axis in 1g standard frame)
      const ratio = Math.min(1.0, Math.max(-1.0, az / (mag || 1.0)));
      tilt = (Math.acos(ratio) * 180) / Math.PI;
    }

    const sw = Number(data.sw) === 1 ? 1 : 0;
    const swHits = Number(data.swHits) || 0;
    const mpuHits = Number(data.mpuHits) || 0;
    const mpuWorking = data.mpuWorking !== undefined ? Boolean(data.mpuWorking) : true;
    const alert = Boolean(data.alert);

    return {
      ax: Number(ax.toFixed(4)),
      ay: Number(ay.toFixed(4)),
      az: Number(az.toFixed(4)),
      mag: Number(mag.toFixed(4)),
      dev: Number(dev.toFixed(4)),
      tilt: Number(tilt.toFixed(2)),
      sw,
      swHits,
      mpuHits,
      mpuWorking,
      alert,
      timestamp: Date.now(),
    };
  }

  public async disconnect(): Promise<void> {
    this.isReading = false;
    await this.cleanup();
    this.callbacks?.onDisconnect();
    this.callbacks?.onStatusChange('Disconnected.');
  }

  private handleDeviceLost(): void {
    this.isReading = false;
    this.cleanup();
    this.callbacks?.onError('USB Serial device was unplugged or disconnected.');
    this.callbacks?.onDisconnect();
  }

  private async releaseReader(): Promise<void> {
    if (this.reader) {
      try {
        await this.reader.cancel();
      } catch {
        // Ignore cancel errors on shutdown
      }
      try {
        this.reader.releaseLock();
      } catch {
        // Ignore release errors
      }
      this.reader = null;
    }
  }

  private async cleanup(): Promise<void> {
    await this.releaseReader();

    if (this.port) {
      try {
        await this.port.close();
      } catch {
        // Port may already be closed or disconnected
      }
      this.port = null;
    }

    if (this.disconnectHandler) {
      navigator.serial.removeEventListener('disconnect', this.disconnectHandler);
      this.disconnectHandler = null;
    }
    this.buffer = '';
  }

  public isConnected(): boolean {
    return this.port !== null && this.isReading;
  }
}

export const arduinoSerial = new ArduinoSerialService();
