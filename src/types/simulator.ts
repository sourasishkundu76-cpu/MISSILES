export type ThreatStatus = 'ANALYZING' | 'TRACKING' | 'LOCKED' | 'NEUTRALIZED' | 'ESCAPED';

export interface TargetEntity {
  id: number;
  code: string;
  name: string;
  classification: string;
  dist: number; // in meters
  bearing: number; // in degrees (15 - 165)
  location: string;
  threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: ThreatStatus;
  alive: boolean;
  timeInZone: number; // seconds target has stayed
  screenCoords: { x: number; y: number; visible: boolean };
}

export type MissionStage = 1 | 2 | 3 | 4 | 5 | 6;

export type CameraPreset = 'command' | 'launcher' | 'tower' | 'tactical';

export type VisionMode = 'TACTICAL_3D' | 'FLIR_NIGHT' | 'THERMAL' | 'CONCEPT_BRIEFING';

export type ScenarioType = 'AIRBASE_GROUNDED' | 'GROUND_ARMOR' | 'DRONE_CONVOY';

export interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  level: 'SYS' | 'RADAR' | 'THREAT' | 'DECISION' | 'LAUNCH' | 'IMPACT' | 'WARN';
}

export interface TelemetryData {
  azimuthSweep: number;
  sweepDirection: number;
  sweepRange: string;
  sonicVelocity: number;
  echoTime: number;
  calculatedDist: number;
  servoStatus: string;
  targetCount: number;
}
