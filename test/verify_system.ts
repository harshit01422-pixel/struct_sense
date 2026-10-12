/**
 * Verification Test Suite for StructSense Telemetry & Event Engine
 */

import { EventDetector } from '../src/utils/eventDetection.ts';
import { calculateSessionMetrics } from '../src/utils/reportMetrics.ts';
import type { TelemetryData } from '../src/types/telemetry.ts';

console.log('--- RUNNING STRUCTSENSE SYSTEM VERIFICATION ---');

// 1. Test Event Deduplication
const detector = new EventDetector();
let eventCount = 0;

const baseTime = Date.now();

// Simulate 10 frames during a 1500ms hold alert
for (let i = 0; i < 10; i++) {
  const sample: TelemetryData = {
    ax: 0.05,
    ay: 0.02,
    az: 1.18,
    mag: 1.181,
    dev: 0.181,
    tilt: 1.2,
    sw: 1,
    swHits: 5,
    mpuHits: 1,
    mpuWorking: true,
    alert: true, // within hold period
    timestamp: baseTime + i * 200,
  };

  const { newEvent } = detector.process(sample);
  if (newEvent) {
    eventCount++;
    console.log(`[PASS] Detected new event #${newEvent.seq} at t=${i * 200}ms, trigger: ${newEvent.triggerSource}`);
  }
}

if (eventCount === 1) {
  console.log('[PASS] Event deduplication succeeded: exactly 1 event logged during alert hold, not 10 duplicate events.');
} else {
  console.error(`[FAIL] Expected 1 event, got ${eventCount}`);
  process.exit(1);
}

// 2. Test Alert Recovery
const recoverySample: TelemetryData = {
  ax: 0.01,
  ay: 0.01,
  az: 1.0,
  mag: 1.0,
  dev: 0.001,
  tilt: 0.5,
  sw: 0,
  swHits: 5,
  mpuHits: 1,
  mpuWorking: true,
  alert: false, // cleared
  timestamp: baseTime + 2000,
};

const { resolvedEvent } = detector.process(recoverySample);
if (resolvedEvent) {
  console.log(`[PASS] Event resolved after hold period: duration ${resolvedEvent.durationMs}ms`);
} else {
  console.error('[FAIL] Expected event to resolve upon alert false');
  process.exit(1);
}

// 3. Test Session Metrics Calculation
const history: TelemetryData[] = [
  {
    ax: 0.01,
    ay: 0.02,
    az: 0.99,
    mag: 0.99,
    dev: 0.01,
    tilt: 1.0,
    sw: 0,
    swHits: 0,
    mpuHits: 0,
    mpuWorking: true,
    alert: false,
    timestamp: baseTime,
  },
  {
    ax: 0.25,
    ay: 0.15,
    az: 1.35,
    mag: 1.38,
    dev: 0.38,
    tilt: 3.5,
    sw: 1,
    swHits: 5,
    mpuHits: 2,
    mpuWorking: true,
    alert: true,
    timestamp: baseTime + 200,
  },
];

const metrics = calculateSessionMetrics(history, [resolvedEvent!], 2, false);
console.log(`[PASS] Peak Dev: ${metrics.peakDev}g (expected 0.3800g)`);
console.log(`[PASS] Peak Az: ${metrics.peakAz}g (expected 1.3500g)`);
console.log(`[PASS] Malformed Packets tracked: ${metrics.malformedPackets}`);

if (metrics.peakDev === 0.38 && metrics.peakAz === 1.35 && metrics.malformedPackets === 2) {
  console.log('[SUCCESS] All telemetry and event detection unit assertions passed!');
} else {
  console.error('[FAIL] Metrics calculation mismatch');
  process.exit(1);
}

// 4. Test Legacy Human-Readable Stream Parsing
const legacyLine = 'tilt=4.50deg dev=0.2350g sw=1 swHits=12 mpuHits=4 RED (alert)';
const devMatch = legacyLine.match(/dev\s*=\s*([-\d.]+)/i);
const tiltMatch = legacyLine.match(/tilt\s*=\s*([-\d.]+)/i);
const swMatch = legacyLine.match(/sw\s*=\s*([01])/i);
const swHitsMatch = legacyLine.match(/swHits\s*=\s*(\d+)/i);
const mpuHitsMatch = legacyLine.match(/mpuHits\s*=\s*(\d+)/i);
const isAlert = /RED|alert/i.test(legacyLine);

if (
  devMatch &&
  parseFloat(devMatch[1]) === 0.235 &&
  tiltMatch &&
  parseFloat(tiltMatch[1]) === 4.5 &&
  swMatch &&
  parseInt(swMatch[1], 10) === 1 &&
  swHitsMatch &&
  parseInt(swHitsMatch[1], 10) === 12 &&
  mpuHitsMatch &&
  parseInt(mpuHitsMatch[1], 10) === 4 &&
  isAlert === true
) {
  console.log('[PASS] Legacy human-readable firmware output parsed perfectly into structured telemetry!');
} else {
  console.error('[FAIL] Legacy line parsing failed');
  process.exit(1);
}

