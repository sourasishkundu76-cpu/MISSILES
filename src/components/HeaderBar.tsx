import React, { useState, useEffect } from 'react';
import { VisionMode } from '../types/simulator';
import { aresAudio } from '../audio/aresAudio';
import { Volume2, VolumeX, Eye, BookOpen, ShieldAlert } from 'lucide-react';

interface HeaderBarProps {
  visionMode: VisionMode;
  onVisionModeChange: (mode: VisionMode) => void;
  onOpenConceptModal: () => void;
  defcon: number;
  onDefconChange: (defcon: number) => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  visionMode,
  onVisionModeChange,
  onOpenConceptModal,
  defcon,
  onDefconChange,
}) => {
  const [missionClock, setMissionClock] = useState('00:00:00:00');
  const [audioActive, setAudioActive] = useState(aresAudio.enabled);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      const ms = Math.floor(now.getMilliseconds() / 10).toString().padStart(2, '0');
      setMissionClock(`${timeStr}:${ms}`);
    }, 40);
    return () => clearInterval(timer);
  }, []);

  const toggleAudio = () => {
    aresAudio.enabled = !aresAudio.enabled;
    setAudioActive(aresAudio.enabled);
    if (aresAudio.enabled) {
      aresAudio.init();
      aresAudio.playClick(1000);
    }
  };

  return (
    <header className="tech-panel interactive-element flex items-center justify-between px-4 py-2 rounded shadow-lg z-30 pointer-events-auto">
      {/* Title & Pipeline Badge */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        <div className="flex flex-col">
          <div className="flex items-center space-x-2">
            <span className="inline-block w-3 h-3 bg-red-500 rounded-full tactical-pulse shadow-[0_0_8px_#ff3344]"></span>
            <h1 className="text-xl sm:text-2xl font-black tracking-wider text-white drop-shadow-[0_0_10px_rgba(0,240,255,0.8)]">
              ARES
            </h1>
            <span className="text-[10px] sm:text-xs bg-cyan-950 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded font-mono font-bold tracking-widest">
              MK-IV SIMULATOR
            </span>
          </div>
          <p className="text-[9px] sm:text-[10px] tracking-widest text-cyan-300 font-bold uppercase truncate max-w-[260px] sm:max-w-none">
            AUTONOMOUS RADAR-ENABLED TRACKING &amp; INTERCEPTION SIMULATOR
          </p>
        </div>

        {/* Pipeline tags */}
        <div className="hidden xl:flex items-center space-x-2.5 text-[11px] font-mono border-l border-cyan-800/80 pl-4 text-cyan-400/80">
          <span className="text-cyan-200">DETECT</span>
          <span className="text-cyan-800">|</span>
          <span className="text-cyan-200">ANALYZE</span>
          <span className="text-cyan-800">|</span>
          <span className="text-cyan-200">TRACK</span>
          <span className="text-cyan-800">|</span>
          <span className="text-cyan-200">DECIDE</span>
          <span className="text-cyan-800">|</span>
          <span className="text-cyan-200">INTERCEPT</span>
        </div>
      </div>

      {/* Vision Mode & System Telemetry */}
      <div className="flex items-center space-x-2 sm:space-x-4 text-xs font-mono">
        {/* Vision mode switch */}
        <div className="hidden md:flex items-center space-x-1 bg-black/50 border border-cyan-500/30 p-0.5 rounded">
          <button
            onClick={() => onVisionModeChange('TACTICAL_3D')}
            className={`px-2 py-1 rounded text-[10px] uppercase transition ${
              visionMode === 'TACTICAL_3D' ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400' : 'text-gray-400 hover:text-white'
            }`}
          >
            3D TACTICAL
          </button>
          <button
            onClick={() => onVisionModeChange('FLIR_NIGHT')}
            className={`px-2 py-1 rounded text-[10px] uppercase transition ${
              visionMode === 'FLIR_NIGHT' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400' : 'text-gray-400 hover:text-white'
            }`}
          >
            FLIR NIGHT
          </button>
          <button
            onClick={() => onVisionModeChange('THERMAL')}
            className={`px-2 py-1 rounded text-[10px] uppercase transition ${
              visionMode === 'THERMAL' ? 'bg-amber-500/20 text-amber-300 border border-amber-400' : 'text-gray-400 hover:text-white'
            }`}
          >
            THERMAL
          </button>
        </div>

        {/* Concept Briefing button */}
        <button
          onClick={onOpenConceptModal}
          className="flex items-center space-x-1.5 px-2.5 py-1 bg-cyan-950/80 border border-cyan-400/80 hover:bg-cyan-800 text-cyan-200 rounded text-[10px] sm:text-[11px] transition shadow-[0_0_10px_rgba(0,240,255,0.2)]"
        >
          <BookOpen className="w-3.5 h-3.5 text-cyan-300" />
          <span className="font-bold">SYSTEM BRIEFING</span>
        </button>

        {/* DEFCON Badge */}
        <div className="hidden sm:flex flex-col text-right">
          <span className="text-[9px] text-gray-400">DEFENSE CONDITION</span>
          <div className="flex items-center space-x-1 justify-end">
            <select
              value={defcon}
              onChange={(e) => onDefconChange(Number(e.target.value))}
              className="bg-transparent text-amber-400 font-bold tracking-widest text-[11px] border-none outline-none cursor-pointer"
            >
              <option value={1} className="bg-black text-red-500">DEFCON 1 // IMMINENT</option>
              <option value={2} className="bg-black text-amber-400">DEFCON 2 // ARMED</option>
              <option value={3} className="bg-black text-yellow-300">DEFCON 3 // ELEVATED</option>
              <option value={4} className="bg-black text-blue-300">DEFCON 4 // GUARDED</option>
              <option value={5} className="bg-black text-emerald-400">DEFCON 5 // NORMAL</option>
            </select>
          </div>
        </div>

        {/* Mission Zulu Clock */}
        <div className="flex flex-col text-right">
          <span className="text-[9px] text-gray-400">MISSION CLOCK (ZULU)</span>
          <span className="text-cyan-300 font-bold font-mono text-[11px] sm:text-xs">
            {missionClock}
          </span>
        </div>

        {/* Ping / Audio mute */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={toggleAudio}
            title={audioActive ? 'Mute synthesized sound effects' : 'Enable synthesized sound effects'}
            className="p-1.5 bg-black/50 border border-cyan-500/30 rounded hover:border-cyan-300 text-cyan-300"
          >
            {audioActive ? <Volume2 className="w-3.5 h-3.5 text-cyan-300" /> : <VolumeX className="w-3.5 h-3.5 text-red-400" />}
          </button>
          <div className="hidden lg:flex items-center space-x-1.5 bg-black/40 border border-cyan-500/30 px-2 py-1 rounded">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-[9px] text-emerald-400 uppercase">PING: 4ms</span>
          </div>
        </div>
      </div>
    </header>
  );
};
