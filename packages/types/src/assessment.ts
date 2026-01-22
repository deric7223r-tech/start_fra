export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export type ControlStrength =
  | 'VERY_STRONG'
  | 'REASONABLY_STRONG'
  | 'SOME_GAPS'
  | 'WEAK';

export type AssessmentModule =
  | 'risk-appetite'
  | 'fraud-triangle'
  | 'people-culture'
  | 'controls-technology'
  | 'procurement'
  | 'payroll-hr'
  | 'revenue'
  | 'cash-banking'
  | 'it-systems'
  | 'monitoring-evaluation'
  | 'fraud-response'
  | 'training-awareness'
  | 'compliance-mapping';

export type AssessmentStatus =
  | 'draft'
  | 'in_progress'
  | 'submitted'
  | 'completed';

export interface RiskRegisterItem {
  id: string;
  assessmentId: string;
  module: AssessmentModule;
  riskDescription: string;
  impact: number;
  likelihood: number;
  inherentRiskScore: number;
  controlStrength: ControlStrength;
  residualRiskScore: number;
  priority: RiskLevel;
  mitigationAction?: string;
  owner?: string;
  targetDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentAnswer {
  id: string;
  assessmentId: string;
  module: AssessmentModule;
  questionId: string;
  answer: string | number | boolean | string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Assessment {
  id: string;
  organisationId: string;
  userId: string;
  packageId: number;
  status: AssessmentStatus;
  startedAt: string;
  completedAt?: string;
  signedAt?: string;
  signatureUrl?: string;
  overallRiskScore?: number;
  overallRiskLevel?: RiskLevel;
  reportUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentProgress {
  assessmentId: string;
  completedModules: AssessmentModule[];
  currentModule?: AssessmentModule;
  percentComplete: number;
}
