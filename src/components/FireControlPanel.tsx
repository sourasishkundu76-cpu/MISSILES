import React, { useRef, useEffect } from 'react';
import { TargetEntity, MissionStage, LogEntry } from '../types/simulator';
import { aresAudio } from '../audio/aresAudio';
import { Zap, RotateCcw, SkipForward, ShieldCheck } from 'lucide-react';

interface FireControlPanelProps {
  activeTarget: TargetEntity | undefined;
  currentStage: MissionStage;
  isFiring: boolean;
  onFireIntercept: () => void;
  onResetSweep: () => void;
  onNextTarget: () => void;
  onSimulateEvasion: () => void;
  logs: LogEntry[];
}

export const FireControlPanel: React.FC<FireControlPanelProps> = ({
  activeTarget,
  currentStage,
  isFiring,
  onFireIntercept,
  onResetSweep,
  onNextTarget,
  onSimulateEvasion,
  logs,
}) => {
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs to top when new messages arrive
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = 0;
    }
  }, [logs]);

  // Ballistics Math
  const dist = activeTarget ? activeTarget.dist : 95.0;
  const bearingRad = activeTarget ? (activeTarget.bearing * Math.PI) / 180 : 0;
  const cartX = (dist * Math.cos(bearingRad)).toFixed(2);
  const cartY = (dist * Math.sin(bearingRad)).toFixed(2);
  const tof = (dist / 115).toFixed(2); // Missiles at ~115m/s effective average velocity
  const pk = activeTarget && activeTarget.alive ? (98.0 + (activeTarget.id % 2) * 1.1).toFixed(1) : '0.0';

  const isLockConfirmed = currentStage >= 4 && activeTarget?.alive;

  return (
    <aside className="tech-panel interactive-element w-72 sm:w-80 p-3.5 rounded flex flex-col space-y-3 text-xs pointer-events-auto">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-cyan-500/30 pb-1.5">
        <span className="font-bold text-cyan-200 uppercase tracking-wider text-[11px] font-mono">
          FIRE CONTROL SOLUTION
        </span>
        <span
          className={`text-[9px] px-1.5 py-0.5 rounded font-bold font-mono transition-all ${
            isLockConfirmed
              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/60 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
              : 'bg-red-950 text-red-300 border border-red-500/40 animate-pulse'
          }`}
        >
          {isLockConfirmed ? 'FIRE LOCK CONFIRMED' : 'SEARCHING'}
        </span>
      </div>

      {/* Ballistics Solution Formula Readout */}
      <div className="space-y-1.5 font-mono text-[11px] bg-black/50 p-2.5 rounded border border-cyan-900/60 shadow-inner">
        <div className="flex justify-between items-center">
          <span className="text-gray-400">ACTIVE TARGET:</span>
          <span className="text-red-400 font-bold truncate max-w-[150px] text-right">
            {activeTarget ? `${activeTarget.code} (${activeTarget.name})` : 'NO TARGET'}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">TARGET STATE:</span>
          <span className="text-emerald-400 font-bold">
            {activeTarget?.alive ? 'GROUNDED / STATIONARY' : 'NEUTRALIZED'}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">CARTESIAN X (R·cosθ):</span>
          <span className="text-cyan-300 font-bold">{cartX} m</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">CARTESIAN Y (R·sinθ):</span>
          <span className="text-cyan-300 font-bold">{cartY} m</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">EST. TIME FLIGHT:</span>
          <span className="text-amber-300 font-bold">{tof} s</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">HIT PROBABILITY (Pk):</span>
          <span className="text-emerald-400 font-bold">{pk} %</span>
        </div>
      </div>

      {/* Interception Fire Control Button */}
      <div className="space-y-2 pt-1">
        <button
          onClick={onFireIntercept}
          disabled={isFiring || !activeTarget?.alive}
          className={`w-full py-3 text-white font-black text-sm uppercase tracking-widest rounded border-2 transition-all flex items-center justify-center space-x-2 font-mono ${
            isFiring
              ? 'bg-amber-600 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.8)] cursor-wait'
              : !activeTarget?.alive
              ? 'bg-gray-800 border-gray-600 opacity-50 cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-500 active:scale-98 border-red-400 shadow-[0_0_20px_rgba(255,51,68,0.7)] cursor-pointer'
          }`}
        >
          <Zap className={`w-4 h-4 ${isFiring ? 'animate-spin' : 'animate-bounce'}`} />
          <span>
            {isFiring
              ? 'ENGAGEMENT IN PROGRESS...'
              : !activeTarget?.alive
              ? 'TARGET NEUTRALIZED'
              : 'AUTHORIZE INTERCEPT [ENTER]'}
          </span>
        </button>

        {/* Quick action buttons */}
        <div className="grid grid-cols-2 gap-1.5 font-mono text-[10px]">
          <button
            onClick={onResetSweep}
            className="py-1.5 bg-black/60 border border-gray-700 hover:border-cyan-400 text-gray-300 uppercase rounded flex items-center justify-center space-x-1 transition"
          >
            <RotateCcw className="w-3 h-3 text-cyan-400" />
            <span>RESET SWEEP [R]</span>
          </button>
          <button
            onClick={onNextTarget}
            className="py-1.5 bg-cyan-950/70 border border-cyan-700 hover:border-cyan-300 text-cyan-200 uppercase rounded flex items-center justify-center space-x-1 transition"
          >
            <SkipForward className="w-3 h-3 text-cyan-400" />
            <span>NEXT TGT [TAB]</span>
          </button>
        </div>

        {/* Evasion Simulation trigger button (< 3s test) */}
        <button
          onClick={onSimulateEvasion}
          className="w-full py-1 bg-black/50 border border-amber-800/80 hover:border-amber-400 text-amber-300 text-[10px] font-mono uppercase rounded flex items-center justify-center space-x-1.5 transition"
        >
          <ShieldCheck className="w-3 h-3 text-amber-400" />
          <span>TEST 3s EVASION (NO FIRE RULE)</span>
        </button>
      </div>

      {/* Tactical Event Log Feed */}
      <div className="pt-2 border-t border-cyan-500/20 font-mono text-[9px] text-cyan-300/80 space-y-1">
        <div className="flex justify-between items-center text-gray-400 uppercase text-[9px]">
          <span>TACTICAL EVENT LOG:</span>
          <span className="text-[8px] text-cyan-400/60">LIVE TELEMETRY STREAM</span>
        </div>
        <div
          ref={logContainerRef}
          className="h-20 sm:h-24 overflow-y-auto space-y-1 bg-black/70 p-2 rounded border border-cyan-950 font-mono"
        >
          {logs.map((log) => (
            <div key={log.id} className="leading-tight">
              <span className="text-gray-500">[{log.timestamp}]</span>{' '}
              <span
                className={
                  log.level === 'IMPACT'
                    ? 'text-emerald-400 font-bold'
                    : log.level === 'LAUNCH'
                    ? 'text-red-400 font-bold'
                    : log.level === 'THREAT'
                    ? 'text-amber-400'
                    : 'text-cyan-300'
                }
              >
                {log.message}
              </span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};
