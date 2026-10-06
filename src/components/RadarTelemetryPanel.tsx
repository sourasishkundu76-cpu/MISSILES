import React from 'react';
import { CameraPreset, ScenarioType, TelemetryData } from '../types/simulator';
import { aresAudio } from '../audio/aresAudio';
import { Layers } from 'lucide-react';

interface RadarTelemetryPanelProps {
  telemetry: TelemetryData;
  cameraPreset: CameraPreset;
  onCameraChange: (preset: CameraPreset) => void;
  scenario: ScenarioType;
  onScenarioChange: (scenario: ScenarioType) => void;
}

export const RadarTelemetryPanel: React.FC<RadarTelemetryPanelProps> = ({
  telemetry,
  cameraPreset,
  onCameraChange,
  scenario,
  onScenarioChange,
}) => {
  const angleBarPercent = Math.max(0, Math.min(100, ((telemetry.azimuthSweep - 15) / 150) * 100));

  const handleCameraClick = (preset: CameraPreset) => {
    aresAudio.playClick(1100);
    onCameraChange(preset);
  };

  const handleScenarioChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    aresAudio.playClick(900);
    onScenarioChange(e.target.value as ScenarioType);
  };

  return (
    <aside className="tech-panel interactive-element w-64 sm:w-72 p-3 rounded flex flex-col space-y-2.5 text-xs pointer-events-auto">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-cyan-500/30 pb-1.5">
        <div className="flex items-center space-x-1.5">
          <svg className="w-3.5 h-3.5 text-cyan-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" d="M4 12a8 8 0 018-8v8H4z" fill="currentColor"></path>
          </svg>
          <span className="font-bold text-cyan-200 uppercase tracking-wider text-[11px]">RADAR TELEMETRY</span>
        </div>
        <span className="text-[9px] bg-cyan-900/60 text-cyan-300 px-1 py-0.5 rounded font-mono border border-cyan-500/30">
          HC-SR04
        </span>
      </div>

      {/* Numerical Telemetry Data */}
      <div className="space-y-1.5 font-mono text-[11px]">
        <div className="flex justify-between items-center">
          <span className="text-gray-400">AZIMUTH SWEEP:</span>
          <span className="text-white font-bold">{telemetry.azimuthSweep.toFixed(1)}°</span>
        </div>

        <div className="w-full bg-black/60 h-1.5 rounded overflow-hidden border border-cyan-950">
          <div
            className="h-full bg-cyan-400 transition-all duration-75 shadow-[0_0_8px_#00f0ff]"
            style={{ width: `${angleBarPercent}%` }}
          />
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">SWEEP RANGE:</span>
          <span className="text-cyan-300">15° – 165° (180°)</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">SONIC VELOCITY:</span>
          <span className="text-cyan-300">{telemetry.sonicVelocity.toFixed(1)} m/s</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">ECHO TIME:</span>
          <span className="text-amber-300 font-bold">{telemetry.echoTime.toFixed(1)} µs</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">CALCULATED DIST:</span>
          <span className="text-emerald-400 font-bold">{telemetry.calculatedDist.toFixed(1)} m</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">SERVO STATUS:</span>
          <span className="text-emerald-400 uppercase">{telemetry.servoStatus}</span>
        </div>
      </div>

      {/* Tactical Camera Switcher */}
      <div className="pt-2 border-t border-cyan-500/20">
        <label className="text-[10px] text-gray-400 uppercase tracking-wider mb-1 block font-mono">
          TACTICAL CAMERA VIEW
        </label>
        <div className="grid grid-cols-2 gap-1.5 font-mono text-[10px]">
          <button
            onClick={() => handleCameraClick('command')}
            className={`px-2 py-1 rounded transition ${
              cameraPreset === 'command'
                ? 'bg-cyan-950 border border-cyan-400 text-cyan-200 shadow-[0_0_8px_rgba(0,240,255,0.4)] font-bold'
                : 'bg-black/50 border border-cyan-800/80 text-gray-300 hover:bg-cyan-900'
            }`}
          >
            COMMAND [1]
          </button>
          <button
            onClick={() => handleCameraClick('launcher')}
            className={`px-2 py-1 rounded transition ${
              cameraPreset === 'launcher'
                ? 'bg-cyan-950 border border-cyan-400 text-cyan-200 shadow-[0_0_8px_rgba(0,240,255,0.4)] font-bold'
                : 'bg-black/50 border border-cyan-800/80 text-gray-300 hover:bg-cyan-900'
            }`}
          >
            LAUNCHER [2]
          </button>
          <button
            onClick={() => handleCameraClick('tower')}
            className={`px-2 py-1 rounded transition ${
              cameraPreset === 'tower'
                ? 'bg-cyan-950 border border-cyan-400 text-cyan-200 shadow-[0_0_8px_rgba(0,240,255,0.4)] font-bold'
                : 'bg-black/50 border border-cyan-800/80 text-gray-300 hover:bg-cyan-900'
            }`}
          >
            TOWER [3]
          </button>
          <button
            onClick={() => handleCameraClick('tactical')}
            className={`px-2 py-1 rounded transition ${
              cameraPreset === 'tactical'
                ? 'bg-cyan-950 border border-cyan-400 text-cyan-200 shadow-[0_0_8px_rgba(0,240,255,0.4)] font-bold'
                : 'bg-black/50 border border-cyan-800/80 text-gray-300 hover:bg-cyan-900'
            }`}
          >
            ORBIT [4]
          </button>
        </div>
      </div>

      {/* Target Scenario Switcher */}
      <div className="pt-2 border-t border-cyan-500/20">
        <label className="text-[10px] text-gray-400 uppercase tracking-wider mb-1 flex items-center justify-between font-mono">
          <span className="flex items-center space-x-1">
            <Layers className="w-3 h-3 text-cyan-400" />
            <span>OPERATIONAL SCENARIO</span>
          </span>
        </label>
        <select
          value={scenario}
          onChange={handleScenarioChange}
          className="w-full bg-black/60 border border-cyan-500/40 rounded px-2 py-1 text-[10px] font-mono text-cyan-200 outline-none focus:border-cyan-300 cursor-pointer"
        >
          <option value="GROUND_ARMOR" className="bg-[#050b14] text-cyan-200">
            SCENARIO 1: GROUND RECON &amp; ARMOR
          </option>
          <option value="AIRBASE_GROUNDED" className="bg-[#050b14] text-cyan-200">
            SCENARIO 2: OPPONENT AIRBASE JETS
          </option>
        </select>
      </div>

      {/* Audio Status Switch */}
      <div className="flex justify-between items-center pt-1 border-t border-cyan-500/20 text-[10px] font-mono">
        <span className="text-gray-400">AUDIO SYNTH:</span>
        <span className="text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded">
          SYNTH: ACTIVE
        </span>
      </div>
    </aside>
  );
};
