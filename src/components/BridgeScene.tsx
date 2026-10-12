import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Text } from '@react-three/drei';
import * as THREE from 'three';
import type { TelemetryData } from '../types/telemetry';
import { RotateCcw, AlertTriangle } from 'lucide-react';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

interface BridgeSceneProps {
  telemetry: TelemetryData | null;
  isAlert: boolean;
  isConnected: boolean;
}

// 3D Bridge Structure Subcomponent
const BridgeModel: React.FC<{
  telemetry: TelemetryData | null;
  isAlert: boolean;
}> = ({ telemetry, isAlert }) => {
  const deckRef = useRef<THREE.Group>(null);
  const sensorGlowRef = useRef<THREE.Mesh>(null);
  const pulseRingRef = useRef<THREE.Mesh>(null);

  // Vibration simulation state
  const vibAmplitude = useRef(0);
  const vibPhase = useRef(0);

  // Pillars configuration along the span
  const pillarXPositions = useMemo(() => [-8.5, -4.25, 0, 4.25, 8.5], []);
  const deckLength = 22;
  const deckWidth = 3.6;
  const deckThickness = 0.45;
  const pillarHeight = 4.2;

  useFrame((state, delta) => {
    // Determine target oscillation intensity
    let targetAmp = 0;
    if (isAlert) {
      targetAmp = 0.22; // Controlled visual deflection
    } else if (telemetry && telemetry.dev > 0.05) {
      targetAmp = Math.min(0.2, (telemetry.dev - 0.05) * 0.8);
    }

    // Spring interpolation towards target amplitude
    vibAmplitude.current = THREE.MathUtils.damp(
      vibAmplitude.current,
      targetAmp,
      isAlert ? 10 : 3.5,
      delta
    );

    // Oscillation frequency ~ 14 rad/s (approx 2.2 Hz visual oscillation)
    vibPhase.current += delta * 14;

    // Apply subtle vertical translation & torsion
    if (deckRef.current) {
      const osc = Math.sin(vibPhase.current) * vibAmplitude.current;
      deckRef.current.position.y = pillarHeight + osc;
      deckRef.current.rotation.z = Math.cos(vibPhase.current) * (vibAmplitude.current * 0.015);
      deckRef.current.rotation.x = Math.sin(vibPhase.current * 0.8) * (vibAmplitude.current * 0.01);
    }

    // Sensor pulse animation
    if (pulseRingRef.current) {
      if (isAlert) {
        pulseRingRef.current.visible = true;
        const s = 1.0 + (Math.sin(state.clock.elapsedTime * 8) + 1) * 0.8;
        pulseRingRef.current.scale.set(s, s, s);
        const mat = pulseRingRef.current.material as THREE.MeshBasicMaterial;
        mat.opacity = 0.8 - (s - 1.0) * 0.4;
      } else {
        pulseRingRef.current.visible = false;
      }
    }

    // Sensor status core glow
    if (sensorGlowRef.current) {
      const mat = sensorGlowRef.current.material as THREE.MeshStandardMaterial;
      if (isAlert) {
        mat.emissive.setHex(0xef4444);
        mat.emissiveIntensity = 2.0 + Math.sin(state.clock.elapsedTime * 12) * 1.0;
      } else if (telemetry) {
        mat.emissive.setHex(0x06b6d4);
        mat.emissiveIntensity = 0.8;
      } else {
        mat.emissive.setHex(0x3f3f46);
        mat.emissiveIntensity = 0.2;
      }
    }
  });

  return (
    <group>
      {/* GROUND FOUNDATION PIERS & PLINTHS */}
      {pillarXPositions.map((px, idx) => (
        <group key={`pillar-${idx}`} position={[px, 0, 0]}>
          {/* Foundation Plinth on ground */}
          <mesh position={[0, 0.2, 0]}>
            <boxGeometry args={[1.5, 0.4, 2.6]} />
            <meshStandardMaterial color="#1e2430" roughness={0.8} />
          </mesh>

          {/* Dual Column Pillar Set */}
          <mesh position={[0, pillarHeight / 2 + 0.2, -0.9]}>
            <cylinderGeometry args={[0.26, 0.32, pillarHeight, 16]} />
            <meshStandardMaterial color="#2d3748" roughness={0.7} />
          </mesh>
          <mesh position={[0, pillarHeight / 2 + 0.2, 0.9]}>
            <cylinderGeometry args={[0.26, 0.32, pillarHeight, 16]} />
            <meshStandardMaterial color="#2d3748" roughness={0.7} />
          </mesh>

          {/* Pier Cap Beams supporting deck */}
          <mesh position={[0, pillarHeight + 0.1, 0]}>
            <boxGeometry args={[1.2, 0.35, 3.2]} />
            <meshStandardMaterial color="#374151" roughness={0.6} />
          </mesh>
        </group>
      ))}

      {/* DYNAMIC VIBRATING DECK ASSEMBLY */}
      <group ref={deckRef} position={[0, pillarHeight, 0]}>
        {/* Main Road Deck Structure */}
        <mesh position={[0, deckThickness / 2 + 0.25, 0]} receiveShadow>
          <boxGeometry args={[deckLength, deckThickness, deckWidth]} />
          <meshStandardMaterial color="#1f2937" roughness={0.6} />
        </mesh>

        {/* Deck Underside Longitudinal Steel Girders */}
        <mesh position={[0, 0.08, -1.1]}>
          <boxGeometry args={[deckLength, 0.3, 0.2]} />
          <meshStandardMaterial color="#111827" roughness={0.5} metalness={0.4} />
        </mesh>
        <mesh position={[0, 0.08, 0]}>
          <boxGeometry args={[deckLength, 0.3, 0.2]} />
          <meshStandardMaterial color="#111827" roughness={0.5} metalness={0.4} />
        </mesh>
        <mesh position={[0, 0.08, 1.1]}>
          <boxGeometry args={[deckLength, 0.3, 0.2]} />
          <meshStandardMaterial color="#111827" roughness={0.5} metalness={0.4} />
        </mesh>

        {/* Asphalt Road Surface */}
        <mesh position={[0, deckThickness + 0.26, 0]}>
          <planeGeometry args={[deckLength, deckWidth - 0.5]} />
          <meshStandardMaterial color="#141820" roughness={0.9} />
        </mesh>

        {/* Centerline Lane Markings (White Dashed Stripes) */}
        {[-9, -6, -3, 0, 3, 6, 9].map((stripeX) => (
          <mesh
            key={`stripe-${stripeX}`}
            position={[stripeX, deckThickness + 0.265, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <planeGeometry args={[1.6, 0.1]} />
            <meshBasicMaterial color="#e2e8f0" />
          </mesh>
        ))}

        {/* Outer Edge Curbs */}
        <mesh position={[0, deckThickness + 0.32, -deckWidth / 2 + 0.15]}>
          <boxGeometry args={[deckLength, 0.15, 0.3]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
        <mesh position={[0, deckThickness + 0.32, deckWidth / 2 - 0.15]}>
          <boxGeometry args={[deckLength, 0.15, 0.3]} />
          <meshStandardMaterial color="#334155" />
        </mesh>

        {/* Guardrails (North & South Sides) */}
        {[-1, 1].map((side) => (
          <group key={`guardrail-${side}`} position={[0, deckThickness + 0.65, side * (deckWidth / 2 - 0.15)]}>
            {/* Top Rail Tube */}
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.04, 0.04, deckLength, 8]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Mid Rail Tube */}
            <mesh position={[0, -0.2, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.03, 0.03, deckLength, 8]} />
              <meshStandardMaterial color="#64748b" metalness={0.7} roughness={0.3} />
            </mesh>
            {/* Railing Vertical Posts */}
            {[-10, -7.5, -5, -2.5, 0, 2.5, 5, 7.5, 10].map((postX) => (
              <mesh key={`post-${side}-${postX}`} position={[postX, -0.15, 0]}>
                <cylinderGeometry args={[0.035, 0.035, 0.45, 8]} />
                <meshStandardMaterial color="#64748b" metalness={0.7} roughness={0.3} />
              </mesh>
            ))}
          </group>
        ))}

        {/* PHYSICAL SENSOR HARDWARE NODE (MPU-6050 + SW-420 LOCATION) */}
        {/* Mounted at Deck Midspan on the Curb (x = 0, z = -1.5) */}
        <group position={[0, deckThickness + 0.38, -1.45]}>
          {/* Sensor Mounting Bracket / Enclosure */}
          <mesh>
            <boxGeometry args={[0.65, 0.12, 0.55]} />
            <meshStandardMaterial color="#090d16" metalness={0.8} roughness={0.3} />
          </mesh>

          {/* Sensor Status LED Core */}
          <mesh ref={sensorGlowRef} position={[0, 0.08, 0]}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive="#06b6d4"
              emissiveIntensity={0.8}
            />
          </mesh>

          {/* Alert Expanding Pulse Wave Ring */}
          <mesh
            ref={pulseRingRef}
            position={[0, 0.08, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            visible={false}
          >
            <ringGeometry args={[0.2, 0.35, 32]} />
            <meshBasicMaterial
              color="#ef4444"
              transparent
              opacity={0.8}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Hardware Label Flag */}
          <group position={[0, 0.5, 0]}>
            <mesh position={[0, 0, 0]}>
              <cylinderGeometry args={[0.015, 0.015, 0.8, 8]} />
              <meshStandardMaterial color="#0284c7" />
            </mesh>
            <mesh position={[0.4, 0.3, 0]}>
              <planeGeometry args={[0.8, 0.28]} />
              <meshBasicMaterial color="#0f172a" side={THREE.DoubleSide} />
            </mesh>
            <Text
              position={[0.4, 0.3, 0.01]}
              fontSize={0.11}
              color="#38bdf8"
              anchorX="center"
              anchorY="middle"
            >
              MPU + SW420
            </Text>
          </group>
        </group>
      </group>
    </group>
  );
};

export const BridgeScene: React.FC<BridgeSceneProps> = ({
  telemetry,
  isAlert,
  isConnected,
}) => {
  const controlsRef = useRef<OrbitControlsImpl>(null);

  const resetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
      controlsRef.current.object.position.set(18, 11, 20);
      controlsRef.current.target.set(0, 2.5, 0);
      controlsRef.current.update();
    }
  };

  return (
    <div className="relative w-full h-full min-h-[420px] rounded-xl overflow-hidden border border-zinc-800 bg-[#07090e] shadow-2xl">
      {/* 3D WEBGL CANVAS */}
      <Canvas
        shadows
        camera={{ position: [18, 11, 20], fov: 45, near: 0.1, far: 100 }}
        className="w-full h-full"
      >
        {/* LIGHTING ENVIRONMENT */}
        <ambientLight intensity={0.65} />
        <directionalLight
          position={[20, 25, 15]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <pointLight position={[-10, 8, -10]} intensity={0.4} color="#38bdf8" />
        <pointLight
          position={[0, 5, 5]}
          intensity={isAlert ? 1.8 : 0.2}
          color={isAlert ? '#ef4444' : '#0284c7'}
        />

        {/* SUBTLE ENGINEERING GROUND GRID */}
        <Grid
          position={[0, -0.01, 0]}
          args={[60, 60]}
          cellSize={1}
          cellThickness={0.6}
          cellColor="#1e293b"
          sectionSize={5}
          sectionThickness={1.2}
          sectionColor="#334155"
          fadeDistance={45}
          fadeStrength={1.5}
        />

        {/* PHYSICAL BRIDGE DIGITAL TWIN */}
        <BridgeModel telemetry={telemetry} isAlert={isAlert} />

        {/* ORBIT CONTROLS */}
        <OrbitControls
          ref={controlsRef}
          target={[0, 2.5, 0]}
          maxPolarAngle={Math.PI / 2 - 0.05} // Prevent camera going below ground
          minDistance={6}
          maxDistance={45}
          enableDamping
          dampingFactor={0.06}
        />
      </Canvas>

      {/* OVERLAY: ACTIVE ALERT BANNER */}
      {isAlert && (
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2.5 px-4 py-2 rounded-lg bg-red-950/80 border border-red-500/70 text-red-200 backdrop-blur-md shadow-[0_0_20px_rgba(239,68,68,0.5)] animate-pulse">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <div className="text-xs">
            <span className="font-bold tracking-wider uppercase">Active Vibration Event</span>
            <span className="block text-[11px] text-red-300/80">
              Sensors detected threshold excursion • 1500ms alert hold
            </span>
          </div>
        </div>
      )}

      {/* OVERLAY: TOP RIGHT CAMERA CONTROLS */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <button
          onClick={resetCamera}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-900/90 border border-zinc-700/80 text-zinc-300 hover:text-white hover:border-zinc-500 hover:bg-zinc-800 transition-all backdrop-blur-md shadow-lg"
          title="Reset Camera to default perspective"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset View
        </button>
      </div>

      {/* OVERLAY: BOTTOM STATUS BAR & ENGINEERING DISCLAIMER */}
      <div className="absolute bottom-3 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-zinc-950/80 border border-zinc-800/80 text-[11px] text-zinc-400 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>
            Physical Model: Multi-Pillar Highway Deck (MPU-6050 + SW-420 Node at Midspan)
          </span>
          {!isConnected && (
            <span className="text-zinc-500 italic">
              • Static Neutral View (Hardware Idle)
            </span>
          )}
        </div>
        <div className="text-[10px] text-zinc-500 font-mono">
          Note: Visualized deck motion is an illustrative response to sensor vibration, not physical displacement.
        </div>
      </div>
    </div>
  );
};
