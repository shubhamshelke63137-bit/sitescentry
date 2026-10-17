export type PpeStatus = 'COMPLIANT' | 'WARNING' | 'VIOLATION';
export type HazardLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface DetectedPerson {
  id: string;
  box2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax] 0-1000
  hasHelmet: boolean;
  hasVest: boolean;
  helmetBox?: [number, number, number, number] | null;
  vestBox?: [number, number, number, number] | null;
  confidence: number;
  status: PpeStatus;
  violations: string[];
  roleOrActivity?: string;
  notes?: string;
}

export interface DetectionResult {
  persons: DetectedPerson[];
  overallHazardLevel: HazardLevel;
  safetySummary: string;
  actionableAdvice?: string;
  timestamp: string;
  latencyMs: number;
  isRealAi: boolean;
  modelName: string;
}

export type AlertSeverity = 'CRITICAL' | 'WARNING' | 'INFO';

export interface SafetyAlert {
  id: string;
  timestamp: string;
  zone: string;
  severity: AlertSeverity;
  type: string;
  message: string;
  personId?: string;
  violations: string[];
  snapshotDataUrl?: string;
  acknowledged: boolean;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  isRealAi: boolean;
}

export interface SiteZone {
  id: string;
  name: string;
  code: string;
  category: 'high_risk' | 'medical' | 'entrance' | 'admin' | 'evacuation' | 'machinery';
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  coordinates: { x: number; y: number }; // percentage 0-100 on map
  description: string;
  requiredPpe: string[];
  assignedWorkers: number;
  activeBreaches: number;
  evacuationRouteTo: string;
}

export interface CriticalSituation {
  isActive: boolean;
  zone: string;
  reason: string;
  severity: 'CRITICAL_HAZARD' | 'MASS_PPE_BREACH' | 'FALL_RISK' | 'RESTRICTED_ZONE';
  timestamp: string;
  medicalDispatched: boolean;
  machineryHalted: boolean;
  evacuationActive: boolean;
}

export type ModelEngineMode = 'REAL_GEMINI' | 'CUSTOM_SERVER' | 'DEMO_SIMULATION';

export type InspectionMode = 'FULL_PPE' | 'HELMET_ONLY' | 'VEST_ONLY' | 'CUSTOM';

export interface PpeRequirements {
  requireHelmet: boolean;
  requireVest: boolean;
}

export type NavigationView =
  | 'dashboard'
  | 'camera'
  | 'sitemap'
  | 'alerts'
  | 'reports'
  | 'training'
  | 'settings'
  | 'phone';

export interface DetectionLogRecord {
  id: string;
  timestamp: string;
  zone: string;
  totalPeople: number;
  compliantCount: number;
  violationsCount: number;
  helmetComplianceRate: number;
  vestComplianceRate: number;
  hazardLevel: HazardLevel;
  source: 'Live Camera' | 'Laptop Webcam' | 'Uploaded Media' | 'Test Bench';
  isRealAi: boolean;
}

export interface AppSettings {
  confidenceThreshold: number; // 0.3 to 0.95
  preferredResolution: '480p' | '720p' | '1080p';
  sirenSoundEnabled: boolean;
  speechAlertsEnabled: boolean;
  desktopNotificationsEnabled: boolean;
  autoSnapshotOnViolation: boolean;
  customModelUrl: string;
  privacyLocalOnly: boolean;
  alertEmailOrWebhook: string;
  inspectionMode: InspectionMode;
}
