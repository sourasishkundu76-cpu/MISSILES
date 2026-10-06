import React from 'react';
import { MissionStage } from '../types/simulator';
import { aresAudio } from '../audio/aresAudio';
import { Play, Pause } from 'lucide-react';

interface WorkflowBarProps {
  currentStage: MissionStage;
  onSetStage: (stage: MissionStage) => void;
  analyzeCountdown: number; // 5.0 to 0.0
  azimuthSweep: number;
  onTriggerFire: () => void;
  isAutoRunning: boolean;
  onToggleAutoRun: () => void;
}

export const WorkflowBar: React.FC<WorkflowBarProps> = ({
  currentStage,
  onSetStage,
  analyzeCountdown,
  azimuthSweep,
  onTriggerFire,
  isAutoRunning,
  onToggleAutoRun,
}) => {
  const handleCardClick = (stage: MissionStage) => {
    aresAudio.playClick(1000 + stage * 100);
    if (stage === 6) {
      onTriggerFire();
    } else {
      onSetStage(stage);
    }
  };

  // SVG Circular countdown stroke offset (Circumference of r=18 is ~113.1)
  const circleOffset = 113.1 * (1 - Math.max(0, analyzeCountdown) / 5.0);

  return (
    <footer className="tech-panel interactive-element rounded p-2 sm:p-2.5 shadow-2xl z-30 pointer-events-auto">
      {/* Top micro bar with step indicators & Auto-Run toggle */}
      <div className="flex justify-between items-center pb-1.5 px-1 border-b border-cyan-500/20 text-[10px] font-mono">
        <div className="flex items-center space-x-2">
          <span className="text-gray-400">TACTICAL DEFENSE WORKFLOW:</span>
          <span className="text-cyan-300 font-bold uppercase">
            STAGE 0{currentStage}:{' '}
            {currentStage === 1
              ? 'SECTOR SCAN'
              : currentStage === 2
              ? 'TARGET DETECTED'
              : currentStage === 3
              ? 'TEMPORAL ANALYSIS'
              : currentStage === 4
              ? 'DECISION ENGINE'
              : currentStage === 5
              ? 'LOCK & SLEW ALIGN'
              : 'KINETIC INTERCEPTION'}
          </span>
        </div>

        <button
          onClick={onToggleAutoRun}
          className={`flex items-center space-x-1 px-2.5 py-0.5 rounded text-[10px] uppercase font-bold transition border ${
            isAutoRunning
              ? 'bg-amber-950 border-amber-500 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
              : 'bg-cyan-950/80 border-cyan-600/70 text-cyan-200 hover:bg-cyan-800'
          }`}
        >
          {isAutoRunning ? (
            <>
              <Pause className="w-3 h-3 text-amber-400" />
              <span>PAUSE AUTO PIPELINE</span>
            </>
          ) : (
            <>
              <Play className="w-3 h-3 text-cyan-400" />
              <span>AUTO RUN WORKFLOW</span>
            </>
          )}
        </button>
      </div>

      {/* 6 Grid Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mt-2">
        {/* Stage 1: SCAN */}
        <div
          onClick={() => handleCardClick(1)}
          className={`tech-panel p-2 rounded flex flex-col justify-between cursor-pointer transition select-none ${
            currentStage === 1
              ? 'border-cyan-400 bg-cyan-900/50 ring-1 ring-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.3)]'
              : 'border-cyan-500/30 bg-cyan-950/20 hover:bg-cyan-900/30'
          }`}
        >
          <div>
            <div className="flex items-center space-x-1.5 mb-1.5">
              <span
                className={`flex items-center justify-center w-5 h-5 rounded-full font-black text-xs ${
                  currentStage === 1 ? 'bg-cyan-400 text-black' : 'bg-cyan-700 text-white'
                }`}
              >
                1
              </span>
              <span className="text-xs font-bold text-white tracking-wider font-mono">SCAN</span>
            </div>

            {/* Mini Radar Screen */}
            <div className="relative w-full h-16 bg-black/70 rounded border border-cyan-500/30 flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-14 h-14 rounded-full border border-cyan-500/30"></div>
                <div className="w-10 h-10 rounded-full border border-cyan-500/20"></div>
                <div className="w-6 h-6 rounded-full border border-cyan-500/20"></div>
              </div>

              {/* Rotating Sweep Line */}
              <div
                className="absolute w-7 h-[1.5px] bg-cyan-300 origin-left left-1/2 top-1/2 transition-transform duration-75 shadow-[0_0_5px_#00f0ff]"
                style={{ transform: `rotate(${azimuthSweep}deg)` }}
              ></div>

              <div className="radar-pulse-ring absolute w-14 h-14 rounded-full border border-cyan-400 pointer-events-none"></div>
              <span className="absolute bottom-0.5 left-1 text-[8px] text-gray-400 font-mono">0°</span>
              <span className="absolute bottom-0.5 right-1 text-[8px] text-gray-400 font-mono">180°</span>
            </div>
          </div>

          <p className="text-[9px] text-gray-300 font-mono mt-1.5 leading-tight">
            Continuous radar sweep using HC-SR04 ultrasonic sensor (15° – 165°).
          </p>
        </div>

        {/* Stage 2: DETECT */}
        <div
          onClick={() => handleCardClick(2)}
          className={`tech-panel p-2 rounded flex flex-col justify-between cursor-pointer transition select-none ${
            currentStage === 2
              ? 'border-cyan-400 bg-cyan-900/50 ring-1 ring-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.3)]'
              : 'border-cyan-500/30 bg-cyan-950/20 hover:bg-cyan-900/30'
          }`}
        >
          <div>
            <div className="flex items-center space-x-1.5 mb-1.5">
              <span
                className={`flex items-center justify-center w-5 h-5 rounded-full font-black text-xs ${
                  currentStage === 2 ? 'bg-cyan-400 text-black' : 'bg-cyan-700 text-white'
                }`}
              >
                2
              </span>
              <span className="text-xs font-bold text-white tracking-wider font-mono">DETECT</span>
            </div>

            <div className="relative w-full h-16 bg-black/60 rounded border border-cyan-500/30 flex items-center justify-center overflow-hidden">
              <div className="border border-red-500/80 p-1.5 rounded bg-red-950/40 shadow-[0_0_10px_rgba(255,51,68,0.5)]">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  ></path>
                </svg>
              </div>
              <span className="absolute top-1 right-1 text-[8px] text-red-400 font-mono font-bold animate-ping">
                ●
              </span>
            </div>
          </div>

          <p className="text-[9px] text-gray-300 font-mono mt-1.5 leading-tight">
            Object detected beyond international boundary line.
          </p>
        </div>

        {/* Stage 3: ANALYZE (5s) */}
        <div
          onClick={() => handleCardClick(3)}
          className={`tech-panel p-2 rounded flex flex-col justify-between cursor-pointer transition select-none ${
            currentStage === 3
              ? 'border-cyan-400 bg-cyan-900/50 ring-1 ring-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.3)]'
              : 'border-cyan-500/30 bg-cyan-950/20 hover:bg-cyan-900/30'
          }`}
        >
          <div>
            <div className="flex items-center space-x-1.5 mb-1.5">
              <span
                className={`flex items-center justify-center w-5 h-5 rounded-full font-black text-xs ${
                  currentStage === 3 ? 'bg-cyan-400 text-black' : 'bg-cyan-700 text-white'
                }`}
              >
                3
              </span>
              <span className="text-xs font-bold text-white tracking-wider font-mono">ANALYZE (5s)</span>
            </div>

            <div className="relative w-full h-16 bg-black/60 rounded border border-cyan-500/30 flex items-center justify-center">
              <div className="relative flex items-center justify-center">
                <svg className="w-12 h-12 transform -rotate-90">
                  <circle
                    className="text-cyan-950"
                    cx="24"
                    cy="24"
                    fill="transparent"
                    r="18"
                    stroke="currentColor"
                    strokeWidth="3"
                  ></circle>
                  <circle
                    className="text-cyan-400 transition-all duration-100"
                    cx="24"
                    cy="24"
                    fill="transparent"
                    r="18"
                    stroke="currentColor"
                    strokeDasharray="113.1"
                    strokeDashoffset={circleOffset}
                    strokeWidth="3"
                  ></circle>
                </svg>
                <span className="absolute font-bold text-white text-xs font-mono">
                  {Math.ceil(analyzeCountdown)}s
                </span>
              </div>
            </div>
          </div>

          <p className="text-[9px] text-gray-300 font-mono mt-1.5 leading-tight">
            System analyzes target (stability, distance, intent).
          </p>
        </div>

        {/* Stage 4: DECIDE */}
        <div
          onClick={() => handleCardClick(4)}
          className={`tech-panel p-2 rounded flex flex-col justify-between cursor-pointer transition select-none ${
            currentStage === 4
              ? 'border-cyan-400 bg-cyan-900/50 ring-1 ring-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.3)]'
              : 'border-cyan-500/30 bg-cyan-950/20 hover:bg-cyan-900/30'
          }`}
        >
          <div>
            <div className="flex items-center space-x-1.5 mb-1.5">
              <span
                className={`flex items-center justify-center w-5 h-5 rounded-full font-black text-xs ${
                  currentStage === 4 ? 'bg-cyan-400 text-black' : 'bg-cyan-700 text-white'
                }`}
              >
                4
              </span>
              <span className="text-xs font-bold text-white tracking-wider font-mono">DECIDE</span>
            </div>

            <div className="grid grid-cols-2 gap-1 h-16 font-mono text-[8px]">
              <div className="bg-black/60 border border-gray-700 rounded p-1 flex flex-col items-center justify-center text-center">
                <span className="text-red-400 font-bold">&lt; 3s</span>
                <span className="text-gray-400 leading-tight">NO FIRE</span>
                <span className="text-red-500 font-bold text-[10px]">✕</span>
              </div>
              <div className="bg-emerald-950/40 border border-emerald-500 rounded p-1 flex flex-col items-center justify-center text-center shadow-[0_0_8px_rgba(16,185,129,0.3)]">
                <span className="text-emerald-300 font-bold">≥ 5s</span>
                <span className="text-emerald-400 font-bold leading-tight">THREAT</span>
                <span className="text-emerald-400 font-bold text-[10px]">✓</span>
              </div>
            </div>
          </div>

          <p className="text-[9px] text-gray-300 font-mono mt-1.5 leading-tight">
            If target leaves within 3s → <span className="text-red-400 font-bold">NO FIRE</span>. If target
            remains for ≥ 5s → <span className="text-emerald-400 font-bold">VALID THREAT</span>.
          </p>
        </div>

        {/* Stage 5: LOCK & ALIGN */}
        <div
          onClick={() => handleCardClick(5)}
          className={`tech-panel p-2 rounded flex flex-col justify-between cursor-pointer transition select-none ${
            currentStage === 5
              ? 'border-cyan-400 bg-cyan-900/50 ring-1 ring-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.3)]'
              : 'border-cyan-500/30 bg-cyan-950/20 hover:bg-cyan-900/30'
          }`}
        >
          <div>
            <div className="flex items-center space-x-1.5 mb-1.5">
              <span
                className={`flex items-center justify-center w-5 h-5 rounded-full font-black text-xs ${
                  currentStage === 5 ? 'bg-cyan-400 text-black' : 'bg-cyan-700 text-white'
                }`}
              >
                5
              </span>
              <span className="text-xs font-bold text-white tracking-wider font-mono">LOCK &amp; ALIGN</span>
            </div>

            <div className="relative w-full h-16 bg-black/60 rounded border border-cyan-500/30 flex flex-col items-center justify-center p-1.5 font-mono text-[9px]">
              <div className="text-cyan-300 font-bold mb-1">AZIMUTH &amp; ELEV</div>
              <div className="w-full bg-black/80 h-2 rounded border border-cyan-600/40 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    currentStage >= 5 ? 'bg-cyan-400 w-full shadow-[0_0_8px_#00f0ff]' : 'bg-cyan-800 w-1/3'
                  }`}
                />
              </div>
              <span className="text-[8px] sm:text-[9px] text-emerald-400 mt-1 font-bold">
                SERVO: {currentStage >= 5 ? '100% ALIGNED' : 'TRACKING...'}
              </span>
            </div>
          </div>

          <p className="text-[9px] text-gray-300 font-mono mt-1.5 leading-tight">
            Launcher aligns with target (angle &amp; elevation). 180° horizontal rotation.
          </p>
        </div>

        {/* Stage 6: INTERCEPT */}
        <div
          onClick={() => handleCardClick(6)}
          className={`tech-panel p-2 rounded flex flex-col justify-between cursor-pointer transition select-none ${
            currentStage === 6
              ? 'border-red-400 bg-red-950/60 ring-1 ring-red-400 shadow-[0_0_15px_rgba(255,51,68,0.5)]'
              : 'border-cyan-500/30 bg-cyan-950/20 hover:bg-cyan-900/30'
          }`}
        >
          <div>
            <div className="flex items-center space-x-1.5 mb-1.5">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-red-600 text-white font-black text-xs">
                6
              </span>
              <span className="text-xs font-bold text-red-400 tracking-wider font-mono">INTERCEPT</span>
            </div>

            <div className="relative w-full h-16 bg-gradient-to-r from-red-950/50 to-amber-950/40 rounded border border-red-500/40 flex items-center justify-center overflow-hidden">
              <div className="flex items-center space-x-1 text-center">
                <svg className="w-4 h-4 text-amber-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  ></path>
                </svg>
                <span className="text-[9px] font-bold text-red-200 uppercase font-mono">KINETIC IMPACT</span>
              </div>
            </div>
          </div>

          <p className="text-[9px] text-gray-300 font-mono mt-1.5 leading-tight">
            Surface-to-air missile launched after autonomous confirmation.
          </p>
        </div>
      </div>
    </footer>
  );
};
