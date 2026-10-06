import React from 'react';
import { X, CheckCircle, Shield, Radio, Crosshair, Cpu, AlertTriangle } from 'lucide-react';
import { aresAudio } from '../audio/aresAudio';

interface ConceptBriefingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartDemo: () => void;
}

export const ConceptBriefingModal: React.FC<ConceptBriefingModalProps> = ({
  isOpen,
  onClose,
  onStartDemo,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md">
      <div className="tech-panel w-full max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded border border-cyan-400 text-cyan-200 font-mono shadow-[0_0_30px_rgba(0,240,255,0.25)]">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-cyan-500/40 pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-wider">
                ARES MK-IV SYSTEM SPECIFICATION &amp; DOCTRINE
              </h2>
            </div>
            <p className="text-xs text-cyan-400 tracking-widest mt-0.5">
              AUTONOMOUS RADAR-ENABLED TRACKING &amp; INTERCEPTION ARCHITECTURE
            </p>
          </div>
          <button
            onClick={() => {
              aresAudio.playClick(800);
              onClose();
            }}
            className="p-1 rounded bg-black/50 border border-cyan-500/40 hover:border-cyan-300 text-gray-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="space-y-4 my-4 text-xs">
          {/* Executive Doctrine Overview */}
          <div className="bg-black/60 p-3.5 rounded border border-cyan-900/60 leading-relaxed text-gray-300">
            <span className="text-cyan-300 font-bold block mb-1">TACTICAL SYSTEM MISSION:</span>
            ARES (Autonomous Radar-Enabled Tracking &amp; Interception Simulator) operates as an autonomous
            border defense and interdiction node. Utilizing an ultrasonic HC-SR04 scanning transducer operating
            across a 180° front-facing azimuth, the platform detects perimeter boundary breaches, assesses
            target dwell time stability, computes Cartesian firing solutions, and executes automated kinetic
            surface-to-air missile interception against verified threats.
          </div>

          {/* 6-Stage Core Workflow Grid */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2 flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>SIX-STAGE AUTONOMOUS ENGAGEMENT PIPELINE</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              <div className="bg-cyan-950/30 p-2.5 rounded border border-cyan-500/40">
                <div className="flex items-center space-x-2 text-cyan-300 font-bold mb-1">
                  <span className="w-5 h-5 rounded-full bg-cyan-500 text-black flex items-center justify-center text-xs font-black">
                    1
                  </span>
                  <span>CONTINUOUS SCAN</span>
                </div>
                <p className="text-[11px] text-gray-300">
                  Continuous 15° to 165° horizontal sweep utilizing high-precision ultrasonic acoustic telemetry.
                  Pulses evaluate distance via sonic echo delay at 343.2 m/s.
                </p>
              </div>

              <div className="bg-cyan-950/30 p-2.5 rounded border border-cyan-500/40">
                <div className="flex items-center space-x-2 text-cyan-300 font-bold mb-1">
                  <span className="w-5 h-5 rounded-full bg-cyan-700 text-white flex items-center justify-center text-xs font-black">
                    2
                  </span>
                  <span>BOUNDARY DETECTION</span>
                </div>
                <p className="text-[11px] text-gray-300">
                  Transgression recognition triggers when return echo signals pinpoint an active vehicle or grounded
                  aircraft beyond the international border wall demarcation.
                </p>
              </div>

              <div className="bg-cyan-950/30 p-2.5 rounded border border-cyan-500/40">
                <div className="flex items-center space-x-2 text-cyan-300 font-bold mb-1">
                  <span className="w-5 h-5 rounded-full bg-cyan-700 text-white flex items-center justify-center text-xs font-black">
                    3
                  </span>
                  <span>5-SECOND ANALYSIS</span>
                </div>
                <p className="text-[11px] text-gray-300">
                  System locks acoustic dwell filter for 5.0 seconds. Verifies range stability, Doppler variance,
                  radar cross-section, and tactical intent before issuing fire permit.
                </p>
              </div>

              <div className="bg-cyan-950/30 p-2.5 rounded border border-cyan-500/40">
                <div className="flex items-center space-x-2 text-cyan-300 font-bold mb-1">
                  <span className="w-5 h-5 rounded-full bg-cyan-700 text-white flex items-center justify-center text-xs font-black">
                    4
                  </span>
                  <span>DECISION ENGINE</span>
                </div>
                <p className="text-[11px] text-gray-300">
                  Strict autonomous engagement logic: If contact departs or evades within &lt; 3.0s → <span className="text-red-400 font-bold">NO FIRE</span>.
                  If contact remains stationary for ≥ 5.0s → <span className="text-emerald-400 font-bold">VALID THREAT</span>.
                </p>
              </div>

              <div className="bg-cyan-950/30 p-2.5 rounded border border-cyan-500/40">
                <div className="flex items-center space-x-2 text-cyan-300 font-bold mb-1">
                  <span className="w-5 h-5 rounded-full bg-cyan-700 text-white flex items-center justify-center text-xs font-black">
                    5
                  </span>
                  <span>LOCK &amp; GIMBAL SLEW</span>
                </div>
                <p className="text-[11px] text-gray-300">
                  Dual-axis servo mechanism slews launcher carriage to exact target azimuth and pitch elevation. Optical
                  laser targeting confirms coordinate lock with 100% servo alignment.
                </p>
              </div>

              <div className="bg-cyan-950/30 p-2.5 rounded border border-cyan-500/40">
                <div className="flex items-center space-x-2 text-red-400 font-bold mb-1">
                  <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-black">
                    6
                  </span>
                  <span>KINETIC INTERCEPT</span>
                </div>
                <p className="text-[11px] text-gray-300">
                  Surface-to-air kinetic interceptor missile launches along a parabolic ballistic vector. Direct
                  high-explosive impact neutralizes the hostile vehicle or grounded airfield asset.
                </p>
              </div>
            </div>
          </div>

          {/* Mathematical & Ballistics Model Breakdown */}
          <div className="bg-black/60 p-3.5 rounded border border-cyan-900/60 font-mono">
            <h4 className="text-xs font-bold text-cyan-300 uppercase mb-2">BALLISTICS &amp; TELEMETRY EQUATIONS:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
              <div className="space-y-1">
                <div>
                  <span className="text-gray-400">Sonic Time-of-Flight:</span>{' '}
                  <span className="text-white font-bold">d = (v_sound × t_echo) / 2</span>
                </div>
                <div>
                  <span className="text-gray-400">Cartesian X Coordinate:</span>{' '}
                  <span className="text-cyan-300 font-bold">X = R · cos(θ)</span>
                </div>
                <div>
                  <span className="text-gray-400">Cartesian Y Coordinate:</span>{' '}
                  <span className="text-cyan-300 font-bold">Y = R · sin(θ)</span>
                </div>
              </div>

              <div className="space-y-1">
                <div>
                  <span className="text-gray-400">Interceptor Flight Time:</span>{' '}
                  <span className="text-amber-300 font-bold">TOF = R / v_missile</span>
                </div>
                <div>
                  <span className="text-gray-400">Azimuth Sector Span:</span>{' '}
                  <span className="text-white font-bold">θ ∈ [15.0°, 165.0°] (180° baseline)</span>
                </div>
                <div>
                  <span className="text-gray-400">Kill Probability (Pk):</span>{' '}
                  <span className="text-emerald-400 font-bold">Pk = 98.7% - 99.1%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between border-t border-cyan-500/40 pt-3">
          <span className="text-[10px] text-gray-400 hidden sm:inline">
            ARES MK-IV SYSTEM CERTIFIED // INDIAN DEFENSE SIMULATION MATRIX
          </span>
          <div className="flex space-x-2 ml-auto">
            <button
              onClick={() => {
                aresAudio.playClick(900);
                onClose();
              }}
              className="px-4 py-1.5 bg-black/60 border border-gray-600 hover:border-cyan-400 text-gray-300 rounded text-xs uppercase"
            >
              CLOSE
            </button>
            <button
              onClick={() => {
                aresAudio.playClick(1400);
                onClose();
                onStartDemo();
              }}
              className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-black font-black rounded text-xs uppercase shadow-[0_0_15px_rgba(0,240,255,0.6)] flex items-center space-x-1.5"
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>RUN AUTOMATED WORKFLOW DEMO</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
