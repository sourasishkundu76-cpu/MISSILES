import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  TargetEntity,
  MissionStage,
  CameraPreset,
  VisionMode,
  ScenarioType,
  LogEntry,
  TelemetryData,
} from './types/simulator';
import { ThreeCanvas } from './components/ThreeCanvas';
import { HeaderBar } from './components/HeaderBar';
import { RadarTelemetryPanel } from './components/RadarTelemetryPanel';
import { TargetBrackets } from './components/TargetBrackets';
import { FireControlPanel } from './components/FireControlPanel';
import { WorkflowBar } from './components/WorkflowBar';
import { ConceptBriefingModal } from './components/ConceptBriefingModal';
import { aresAudio } from './audio/aresAudio';

// Initial dataset for Ground Recon & Armor Scenario (matching Image 1 & 2)
const INITIAL_GROUND_TARGETS: TargetEntity[] = [
  {
    id: 1,
    code: 'TGT 01',
    name: 'SUPPLY TRUCK',
    classification: 'TRUCK',
    dist: 120,
    bearing: 32.0,
    location: 'BORDER ROAD',
    threatLevel: 'MEDIUM',
    status: 'ANALYZING',
    alive: true,
    timeInZone: 1.5,
    screenCoords: { x: -999, y: -999, visible: false },
  },
  {
    id: 2,
    code: 'TGT 02',
    name: 'MAIN BATTLE TANK',
    classification: 'ARMOR TANK',
    dist: 95,
    bearing: 68.0,
    location: 'SECTOR BRAVO',
    threatLevel: 'HIGH',
    status: 'TRACKING',
    alive: true,
    timeInZone: 5.4,
    screenCoords: { x: -999, y: -999, visible: false },
  },
  {
    id: 3,
    code: 'TGT 03',
    name: 'PATROL SQUAD',
    classification: 'PATROL SQUAD',
    dist: 140,
    bearing: 110.0,
    location: 'OUTPOST FLANK',
    threatLevel: 'LOW',
    status: 'TRACKING',
    alive: true,
    timeInZone: 3.8,
    screenCoords: { x: -999, y: -999, visible: false },
  },
];

// Initial dataset for Opponent Airbase Scenario (matching Image 4)
const INITIAL_AIRBASE_TARGETS: TargetEntity[] = [
  {
    id: 1,
    code: 'TGT 01',
    name: 'SU-57 FELON',
    classification: 'SU-57 FELON',
    dist: 110,
    bearing: 38.5,
    location: 'MAIN APRON',
    threatLevel: 'CRITICAL',
    status: 'TRACKING',
    alive: true,
    timeInZone: 6.2,
    screenCoords: { x: -999, y: -999, visible: false },
  },
  {
    id: 2,
    code: 'TGT 02',
    name: 'MIG-35 FULCRUM',
    classification: 'MIG-35 STRIKE',
    dist: 135,
    bearing: 68.0,
    location: 'HANGAR 01 APRON',
    threatLevel: 'HIGH',
    status: 'LOCKED',
    alive: true,
    timeInZone: 5.5,
    screenCoords: { x: -999, y: -999, visible: false },
  },
  {
    id: 3,
    code: 'TGT 03',
    name: 'TU-22M BOMBER',
    classification: 'TU-22M BOMBER',
    dist: 160,
    bearing: 115.0,
    location: 'RWY THRESHOLD',
    threatLevel: 'HIGH',
    status: 'ANALYZING',
    alive: true,
    timeInZone: 2.1,
    screenCoords: { x: -999, y: -999, visible: false },
  },
];

export default function App() {
  const [scenario, setScenario] = useState<ScenarioType>('GROUND_ARMOR');
  const [targets, setTargets] = useState<TargetEntity[]>(INITIAL_GROUND_TARGETS);
  const [activeTargetIndex, setActiveTargetIndex] = useState<number>(1); // Default Target 2 (Tank)
  const [currentStage, setCurrentStage] = useState<MissionStage>(1); // Start at SCAN
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('command');
  const [visionMode, setVisionMode] = useState<VisionMode>('TACTICAL_3D');
  const [defcon, setDefcon] = useState<number>(2);

  const [analyzeCountdown, setAnalyzeCountdown] = useState<number>(5.0);
  const [isFiring, setIsFiring] = useState<boolean>(false);
  const [isAutoRunning, setIsAutoRunning] = useState<boolean>(false);
  const [isConceptModalOpen, setIsConceptModalOpen] = useState<boolean>(false);

  const [telemetry, setTelemetry] = useState<TelemetryData>({
    azimuthSweep: 90.0,
    sweepDirection: 1,
    sweepRange: '15° – 165° (180°)',
    sonicVelocity: 343.2,
    echoTime: 639.0,
    calculatedDist: 95.0,
    servoStatus: 'SYNCED (PWM 50Hz)',
    targetCount: 3,
  });

  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: '1',
      timestamp: '04:29:46',
      level: 'SYS',
      message: 'ARES Autonomous Defense Simulator MK-IV Online.',
    },
    {
      id: '2',
      timestamp: '04:29:48',
      level: 'RADAR',
      message: 'Ultrasonic ARES HC-SR04 Active. Sector 180° baseline synced.',
    },
    {
      id: '3',
      timestamp: '04:29:50',
      level: 'THREAT',
      message: 'Boundary line transgression detected at 68.0°.',
    },
  ]);

  // Helper to append log
  const appendLog = useCallback((message: string, level: LogEntry['level'] = 'SYS') => {
    const timeStr = new Date().toTimeString().split(' ')[0];
    const newEntry: LogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: timeStr,
      level,
      message,
    };
    setLogs((prev) => [newEntry, ...prev.slice(0, 40)]);
  }, []);

  // Handle Scenario Switch
  const handleScenarioChange = useCallback((newScenario: ScenarioType) => {
    setScenario(newScenario);
    const newTargets = newScenario === 'AIRBASE_GROUNDED' ? INITIAL_AIRBASE_TARGETS : INITIAL_GROUND_TARGETS;
    setTargets(newTargets.map((t) => ({ ...t, alive: true })));
    setActiveTargetIndex(0);
    setCurrentStage(1);
    setIsFiring(false);
    setIsAutoRunning(false);
    appendLog(
      newScenario === 'AIRBASE_GROUNDED'
        ? '[SCENARIO] Opponent Airbase Interdiction sector activated. 3 grounded aircraft detected on tarmac.'
        : '[SCENARIO] Ground Recon & Armor defense sector activated. Monitoring boundary line.',
      'SYS'
    );
  }, [appendLog]);

  // Handle Telemetry update from Three.js render loop
  const handleTelemetryUpdate = useCallback((azimuth: number, echoTime: number, calcDist: number) => {
    setTelemetry((prev) => ({
      ...prev,
      azimuthSweep: azimuth,
      echoTime,
      calculatedDist: calcDist,
    }));
  }, []);

  // Update target screen coords for 2D brackets
  const handleTargetScreenCoordsUpdate = useCallback(
    (coords: { id: number; x: number; y: number; visible: boolean }[]) => {
      setTargets((prev) =>
        prev.map((t) => {
          const match = coords.find((c) => c.id === t.id);
          if (!match) return t;
          return {
            ...t,
            screenCoords: { x: match.x, y: match.y, visible: match.visible },
          };
        })
      );
    },
    []
  );

  // Trigger Missile Launch
  const handleAuthorizeIntercept = useCallback(() => {
    if (isFiring) return;
    const activeTarget = targets[activeTargetIndex];
    if (!activeTarget || !activeTarget.alive) {
      appendLog('[WARN] Intercept aborted: No active or surviving target.', 'WARN');
      return;
    }

    setIsFiring(true);
    setCurrentStage(6); // Stage 6 INTERCEPT
    appendLog(
      `[LAUNCH] Kinetic Interceptor surface-to-air missile FIRED toward ${activeTarget.code} (${activeTarget.name})!`,
      'LAUNCH'
    );
  }, [isFiring, targets, activeTargetIndex, appendLog]);

  // Reset Missile firing state
  const handleResetFiring = useCallback(() => {
    setIsFiring(false);
    setCurrentStage(1); // Return to SCAN
    appendLog('[RESET] Interceptor rail reloaded. Radar returned to sector scan baseline.', 'RADAR');
  }, [appendLog]);

  // Handle Missile Impact
  const handleMissileImpact = useCallback(
    (targetId: number) => {
      setTargets((prev) =>
        prev.map((t) =>
          t.id === targetId ? { ...t, alive: false, status: 'NEUTRALIZED' } : t
        )
      );
      const hitTarget = targets.find((t) => t.id === targetId);
      appendLog(
        `[IMPACT] DIRECT HIT CONFIRMED! ${hitTarget?.code || 'Target'} neutralized. Threat eliminated.`,
        'IMPACT'
      );
    },
    [targets, appendLog]
  );

  // Target Selection
  const handleSelectTarget = useCallback(
    (index: number) => {
      if (index < 0 || index >= targets.length) return;
      setActiveTargetIndex(index);
      const tgt = targets[index];
      appendLog(`[RETICLE] Sensor locked onto ${tgt.code}: ${tgt.name} at Bearing ${tgt.bearing}°.`, 'THREAT');
      setCurrentStage(3); // Enter ANALYZE countdown for target
      setAnalyzeCountdown(5.0);
    },
    [targets, appendLog]
  );

  // Next target shortcut
  const handleNextTarget = useCallback(() => {
    let nextIdx = (activeTargetIndex + 1) % targets.length;
    handleSelectTarget(nextIdx);
  }, [activeTargetIndex, targets.length, handleSelectTarget]);

  // Reset sweep shortcut
  const handleResetSweep = useCallback(() => {
    aresAudio.playClick(900);
    setCurrentStage(1);
    setIsAutoRunning(false);
    appendLog('[RESET] Radar sweep reinitialized across 180° baseline sector.', 'RADAR');
  }, [appendLog]);

  // Simulate Evasion (< 3s NO FIRE rule from Card 4)
  const handleSimulateEvasion = useCallback(() => {
    aresAudio.playClick(800);
    const activeTarget = targets[activeTargetIndex];
    if (!activeTarget) return;

    setCurrentStage(4);
    appendLog(
      `[DECISION ENGINE] Target ${activeTarget.code} turned back and departed within < 3s. NO FIRE condition verified. Threat resolved.`,
      'DECISION'
    );
  }, [targets, activeTargetIndex, appendLog]);

  // Stage 3 Countdown Timer & Stage progression
  useEffect(() => {
    if (currentStage !== 3) return;

    setAnalyzeCountdown(5.0);
    const startTime = performance.now();

    const interval = setInterval(() => {
      const elapsed = (performance.now() - startTime) / 1000;
      const remaining = Math.max(0, 5.0 - elapsed);
      setAnalyzeCountdown(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        aresAudio.playLockAlarm();
        // Progress to Stage 4 (DECIDE) then 5 (LOCK & ALIGN)
        setCurrentStage(5);
        appendLog(
          `[DECISION ENGINE] Contact dwelt for ≥ 5.0s on perimeter. THREAT VALIDATED. Slew alignment confirmed.`,
          'DECISION'
        );
      }
    }, 100);

    return () => clearInterval(interval);
  }, [currentStage, appendLog]);

  // Automated Workflow Execution Pipeline (Auto Run)
  useEffect(() => {
    if (!isAutoRunning) return;

    let timeoutId: NodeJS.Timeout;

    if (currentStage === 1) {
      // Step 1: Scan for 2s then Detect
      timeoutId = setTimeout(() => {
        setCurrentStage(2);
        appendLog('[WORKFLOW 1/6] Object detected breaching perimeter. Triggering boundary assessment.', 'THREAT');
      }, 2000);
    } else if (currentStage === 2) {
      // Step 2: Detect for 1.5s then Analyze
      timeoutId = setTimeout(() => {
        setCurrentStage(3);
        setAnalyzeCountdown(5.0);
        appendLog('[WORKFLOW 2/6] System commencing 5.0s temporal Doppler stability analysis...', 'RADAR');
      }, 1500);
    } else if (currentStage === 5) {
      // Step 5: Lock & Align for 1.8s then Intercept!
      timeoutId = setTimeout(() => {
        handleAuthorizeIntercept();
      }, 1800);
    }

    return () => clearTimeout(timeoutId);
  }, [isAutoRunning, currentStage, handleAuthorizeIntercept, appendLog]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;

      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        handleAuthorizeIntercept();
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        handleResetSweep();
      } else if (e.code === 'Tab') {
        e.preventDefault();
        handleNextTarget();
      } else if (e.code === 'Digit1') {
        setCameraPreset('command');
      } else if (e.code === 'Digit2') {
        setCameraPreset('launcher');
      } else if (e.code === 'Digit3') {
        setCameraPreset('tower');
      } else if (e.code === 'Digit4') {
        setCameraPreset('tactical');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleAuthorizeIntercept, handleResetSweep, handleNextTarget]);

  const activeTarget = targets[activeTargetIndex];

  return (
    <div className={`relative w-screen h-screen overflow-hidden bg-[#030710] ${
      visionMode === 'FLIR_NIGHT' ? 'flir-vision' : visionMode === 'THERMAL' ? 'thermal-vision' : ''
    }`}>
      {/* 1. Main WebGL Three.js Canvas */}
      <ThreeCanvas
        scenario={scenario}
        targets={targets}
        activeTargetIndex={activeTargetIndex}
        currentStage={currentStage}
        cameraPreset={cameraPreset}
        onTelemetryUpdate={handleTelemetryUpdate}
        onTargetScreenCoordsUpdate={handleTargetScreenCoordsUpdate}
        onMissileImpact={handleMissileImpact}
        isFiring={isFiring}
        onResetFiring={handleResetFiring}
        visionMode={visionMode}
      />

      {/* 2. CRT Scanlines & Vignette */}
      <div className="scanlines absolute inset-0 z-10 pointer-events-none opacity-35" />

      {/* 3. Screen-Space 2D HUD Target Brackets */}
      <TargetBrackets
        targets={targets}
        activeTargetIndex={activeTargetIndex}
        onSelectTarget={handleSelectTarget}
      />

      {/* 4. Complete Interactive HUD Overlay Container */}
      <main className="absolute inset-0 flex flex-col justify-between p-2.5 sm:p-3.5 z-20 pointer-events-none">
        {/* Top Header Bar */}
        <HeaderBar
          visionMode={visionMode}
          onVisionModeChange={setVisionMode}
          onOpenConceptModal={() => setIsConceptModalOpen(true)}
          defcon={defcon}
          onDefconChange={setDefcon}
        />

        {/* Middle Viewport Panels (Left: Radar Telemetry, Right: Fire Control Solution) */}
        <div className="flex-1 flex justify-between items-center my-2 pointer-events-none">
          {/* Left Panel */}
          <RadarTelemetryPanel
            telemetry={telemetry}
            cameraPreset={cameraPreset}
            onCameraChange={setCameraPreset}
            scenario={scenario}
            onScenarioChange={handleScenarioChange}
          />

          {/* Right Panel */}
          <FireControlPanel
            activeTarget={activeTarget}
            currentStage={currentStage}
            isFiring={isFiring}
            onFireIntercept={handleAuthorizeIntercept}
            onResetSweep={handleResetSweep}
            onNextTarget={handleNextTarget}
            onSimulateEvasion={handleSimulateEvasion}
            logs={logs}
          />
        </div>

        {/* Bottom 6-Stage Mission Workflow Bar */}
        <WorkflowBar
          currentStage={currentStage}
          onSetStage={setCurrentStage}
          analyzeCountdown={analyzeCountdown}
          azimuthSweep={telemetry.azimuthSweep}
          onTriggerFire={handleAuthorizeIntercept}
          isAutoRunning={isAutoRunning}
          onToggleAutoRun={() => setIsAutoRunning((prev) => !prev)}
        />
      </main>

      {/* 5. Concept Briefing & Technical Specification Modal */}
      <ConceptBriefingModal
        isOpen={isConceptModalOpen}
        onClose={() => setIsConceptModalOpen(false)}
        onStartDemo={() => {
          setIsAutoRunning(true);
          setCurrentStage(1);
        }}
      />
    </div>
  );
}
