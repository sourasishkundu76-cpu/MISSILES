import React from 'react';
import { TargetEntity } from '../types/simulator';
import { aresAudio } from '../audio/aresAudio';

interface TargetBracketsProps {
  targets: TargetEntity[];
  activeTargetIndex: number;
  onSelectTarget: (index: number) => void;
}

export const TargetBrackets: React.FC<TargetBracketsProps> = ({
  targets,
  activeTargetIndex,
  onSelectTarget,
}) => {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-20">
      {targets.map((tgt, idx) => {
        if (!tgt.alive || !tgt.screenCoords.visible) return null;

        const isActive = idx === activeTargetIndex;

        return (
          <div
            key={tgt.id}
            className="target-bracket select-none pointer-events-auto"
            style={{
              left: `${tgt.screenCoords.x}px`,
              top: `${tgt.screenCoords.y}px`,
            }}
            onClick={(e) => {
              e.stopPropagation();
              aresAudio.playClick(1300);
              onSelectTarget(idx);
            }}
          >
            <div
              className={`target-bracket-box p-1.5 w-36 sm:w-40 transition-all ${
                isActive
                  ? 'border-red-400 ring-2 ring-red-500 shadow-[0_0_20px_rgba(255,51,68,0.85)] scale-105'
                  : 'border-red-500/80 hover:border-red-300 hover:scale-102 opacity-90'
              }`}
            >
              {/* Corner Notches */}
              <div className="corner-tl"></div>
              <div className="corner-tr"></div>
              <div className="corner-bl"></div>
              <div className="corner-br"></div>

              {/* Title & Classification */}
              <div className="flex items-center justify-between text-[10px] font-bold text-red-400 border-b border-red-500/40 pb-0.5 font-mono">
                <span className="flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1 animate-ping"></span>
                  {tgt.code}
                </span>
                <span className="text-[8px] bg-red-950 px-1 rounded text-red-200 border border-red-800/60 uppercase truncate max-w-[80px]">
                  {tgt.classification}
                </span>
              </div>

              {/* Telemetry info */}
              <div className="text-[9px] text-gray-300 font-mono mt-1 space-y-0.5">
                <div className="flex justify-between">
                  <span className="text-gray-400">DIST:</span>
                  <span className="text-white font-bold">{tgt.dist} m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">BEARING:</span>
                  <span className="text-white font-bold">{tgt.bearing.toFixed(1)}°</span>
                </div>
                {tgt.location && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">LOC:</span>
                    <span className="text-cyan-300 font-bold">{tgt.location}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-0.5">
                  <span className="text-gray-400">STATUS:</span>
                  <span
                    className={`font-bold ${
                      tgt.status === 'LOCKED'
                        ? 'text-red-400 animate-pulse'
                        : tgt.status === 'ANALYZING'
                        ? 'text-amber-400'
                        : tgt.status === 'NEUTRALIZED'
                        ? 'text-gray-400 line-through'
                        : 'text-cyan-300'
                    }`}
                  >
                    {tgt.status}
                  </span>
                </div>
              </div>

              {/* Active Target Reticle indicator */}
              {isActive && (
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap bg-red-600 text-white text-[8px] font-mono px-1 rounded font-bold uppercase tracking-wider shadow">
                  FIRE LOCK ACTIVE
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
