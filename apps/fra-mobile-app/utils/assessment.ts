/**
 * Assessment Utility Functions
 *
 * Pure functions extracted from AssessmentContext for testability and reuse.
 * These handle ID generation, empty assessment creation, and risk scoring.
 */

import type {
  AssessmentData,
  AssessmentStatus,
  PaymentStatus,
  RiskRegisterItem,
  RiskPriority,
} from '@/types/assessment';

/**
 * Generate a unique local assessment ID.
 * Format: fra-{timestamp}-{random alphanumeric}
 */
export function generateId(): string {
  return `fra-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Check whether an assessment ID is a locally-generated one (not yet synced
 * to the backend). Local IDs always start with 'fra-'.
 */
export function isLocalOnlyAssessmentId(id: string): boolean {
  return id.startsWith('fra-');
}

/**
 * Return a complete blank AssessmentData object with every field initialised
 * to its default value.
 */
export function createEmptyAssessment(
  userId: string = '',
  organisationId: string = '',
): AssessmentData {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    status: 'draft' as AssessmentStatus,
    createdAt: now,
    updatedAt: now,
    userId,
    organisationId,
    organisation: {
      name: '',
      type: null,
      employeeCount: null,
      region: '',
      activities: '',
    },
    riskAppetite: {
      tolerance: null,
      fraudSeriousness: null,
      reputationImportance: null,
    },
    fraudTriangle: {
      pressure: null,
      controlStrength: null,
      speakUpCulture: null,
    },
    procurement: { q1: null, q2: null, q3: null, notes: '' },
    cashBanking: { q1: null, q2: null, q3: null, notes: '' },
    payrollHR: { q1: null, q2: null, q3: null, notes: '' },
    revenue: { q1: null, q2: null, q3: null, notes: '' },
    itSystems: { q1: null, q2: null, q3: null, notes: '' },
    peopleCulture: {
      staffChecks: null,
      whistleblowing: null,
      leadershipMessage: null,
    },
    controlsTechnology: {
      segregation: null,
      accessManagement: null,
      monitoring: null,
    },
    priorities: '',
    riskRegister: [],
    paymentsModule: {
      risks: [],
      controls: [],
      monitoringRules: [],
      kpis: {
        duplicatePayments: 0,
        manualOverrides: 0,
        supplierVerificationRate: 0,
        payrollChangeApprovals: 0,
      },
      notes: '',
    },
    trainingAwareness: {
      mandatoryTraining: [],
      specialistTraining: [],
      boardTraining: [],
      overallCompletionRate: 0,
      notes: '',
    },
    monitoringEvaluation: {
      kpis: [],
      reviewFrequency: 'quarterly',
      lastReviewDate: null,
      nextReviewDate: null,
      responsiblePerson: '',
      notes: '',
    },
    complianceMapping: {
      govS013: {
        status: 'not-assessed',
        gaps: [],
        actions: [],
      },
      fraudPreventionStandard: {
        status: 'not-assessed',
        gaps: [],
        actions: [],
      },
      eccta2023: {
        status: 'not-assessed',
        gaps: [],
        actions: [],
      },
      notes: '',
    },
    fraudResponsePlan: {
      reportingTimelines: {
        logIncident: 24,
        initialAssessment: 48,
        investigationStart: 72,
      },
      investigationLifecycle: {
        triage: 2,
        investigation: 10,
        findings: 3,
        closure: 5,
      },
      disciplinaryMeasures: ['Verbal Warning', 'Written Warning', 'Suspension', 'Dismissal', 'Prosecution'],
      externalReporting: 'Regulatory reporting within 7 days where legally required',
      notes: '',
    },
    actionPlan: {
      highPriority: [],
      mediumPriority: [],
      lowPriority: [],
    },
    documentControl: {
      version: '2.0',
      lastUpdated: now,
      reviewedBy: '',
      approvedBy: '',
      retentionPeriod: '7 years',
      classification: 'Internal',
    },
    payment: {
      packageType: null,
      price: 0,
      transactionId: null,
      status: 'pending' as PaymentStatus,
      date: null,
    },
    signature: null,
    feedback: null,
  };
}

/**
 * Risk scoring engine.
 *
 * Evaluates an assessment's answers and returns a list of identified risks
 * with inherent / residual scores, priorities, and suggested owners.
 */
export function calculateRiskScore(assessment: AssessmentData): RiskRegisterItem[] {
  const risks: RiskRegisterItem[] = [];
  let riskCounter = 1;

  const getControlReduction = (strength: string | null): number => {
    if (strength === 'very-strong' || strength === 'well-separated') return 0.4;
    if (strength === 'reasonably-strong' || strength === 'partly') return 0.2;
    if (strength === 'some-gaps') return 0.1;
    return 0;
  };

  // Higher pressure increases likelihood across all risk areas
  const getPressureMultiplier = (pressure: string | null): number => {
    if (pressure === 'very-high') return 1.3;
    if (pressure === 'high') return 1.15;
    return 1.0;
  };

  // Low risk tolerance means the same residual score feels more critical
  const getToleranceMultiplier = (tolerance: string | null): number => {
    if (tolerance === 'low') return 1.2;
    if (tolerance === 'high') return 0.85;
    return 1.0;
  };

  const isWeak = (answer: string | null) => answer === 'rarely' || answer === 'never';
  const isModerate = (answer: string | null) => answer === 'sometimes';

  const getPriority = (score: number): RiskPriority => {
    if (score >= 15) return 'high';
    if (score >= 8) return 'medium';
    return 'low';
  };

  const pressureMultiplier = getPressureMultiplier(assessment.fraudTriangle.pressure);
  const toleranceMultiplier = getToleranceMultiplier(assessment.riskAppetite.tolerance);
  const controlReduction = getControlReduction(assessment.fraudTriangle.controlStrength);

  const addRisk = (
    title: string,
    area: string,
    description: string,
    impact: number,
    likelihood: number,
    areaControlReduction: number,
    owner: string
  ) => {
    const adjustedLikelihood = Math.min(5, Math.round(likelihood * pressureMultiplier));
    const inherent = impact * adjustedLikelihood;
    const rawResidual = Math.round(inherent * (1 - areaControlReduction));
    const residual = Math.min(25, Math.round(rawResidual * toleranceMultiplier));
    risks.push({
      id: `FRA-${String(riskCounter).padStart(3, '0')}`,
      title,
      area,
      description,
      inherentScore: inherent,
      residualScore: residual,
      priority: getPriority(residual),
      suggestedOwner: owner,
    });
    riskCounter++;
  };

  // ── Procurement ──────────────────────────────────────────────────
  if (isWeak(assessment.procurement.q1) || isWeak(assessment.procurement.q2)) {
    addRisk(
      'Supplier fraud',
      'Procurement',
      'Weak procurement controls may allow fraudulent supplier relationships or inflated invoicing.',
      4, 4, controlReduction, 'Head of Procurement'
    );
  } else if (isModerate(assessment.procurement.q1) || isModerate(assessment.procurement.q2)) {
    addRisk(
      'Supplier verification gaps',
      'Procurement',
      'Inconsistent supplier checks may leave gaps for fictitious or inflated invoices.',
      3, 3, controlReduction, 'Head of Procurement'
    );
  }
  if (isWeak(assessment.procurement.q3)) {
    addRisk(
      'Contract management weakness',
      'Procurement',
      'Supplier contracts are not reviewed regularly, risking unfavourable terms and undetected fraud.',
      3, 3, controlReduction, 'Head of Procurement'
    );
  }

  // ── Cash & Banking ───────────────────────────────────────────────
  if (isWeak(assessment.cashBanking.q1)) {
    addRisk(
      'Cash misappropriation',
      'Cash & Banking',
      'Insufficient cash handling controls increase risk of theft or misappropriation.',
      4, 3, controlReduction, 'Finance Manager'
    );
  } else if (isModerate(assessment.cashBanking.q1)) {
    addRisk(
      'Cash handling inconsistency',
      'Cash & Banking',
      'Cash receipts are not always recorded promptly, creating opportunities for misappropriation.',
      3, 2, controlReduction, 'Finance Manager'
    );
  }
  if (isWeak(assessment.cashBanking.q2)) {
    addRisk(
      'Bank reconciliation failure',
      'Cash & Banking',
      'Irregular bank reconciliations may delay detection of unauthorised transactions.',
      4, 3, controlReduction, 'Finance Manager'
    );
  }

  // ── Payroll & HR ─────────────────────────────────────────────────
  if (isWeak(assessment.payrollHR.q1)) {
    addRisk(
      'Payroll fraud',
      'Payroll & HR',
      'Weak payroll controls may enable ghost employees or timesheet manipulation.',
      3, 3, controlReduction, 'HR Manager'
    );
  } else if (isModerate(assessment.payrollHR.q1)) {
    addRisk(
      'Payroll change control gaps',
      'Payroll & HR',
      'Payroll changes are not consistently reviewed, risking unauthorised amendments.',
      3, 2, controlReduction, 'HR Manager'
    );
  }
  if (isWeak(assessment.payrollHR.q2)) {
    addRisk(
      'Ghost employee risk',
      'Payroll & HR',
      'Leavers are not promptly removed from payroll, enabling continued payments to non-existent employees.',
      3, 3, controlReduction, 'HR Manager'
    );
  }

  // ── Revenue ──────────────────────────────────────────────────────
  if (isWeak(assessment.revenue.q1)) {
    addRisk(
      'Revenue leakage',
      'Revenue',
      'Poor revenue controls may lead to unrecorded income or fee manipulation.',
      4, 3, controlReduction, 'Finance Director'
    );
  } else if (isModerate(assessment.revenue.q1)) {
    addRisk(
      'Revenue recording gaps',
      'Revenue',
      'Revenue is not always recorded promptly, risking undisclosed income or misstatement.',
      3, 2, controlReduction, 'Finance Director'
    );
  }

  // ── IT Systems ───────────────────────────────────────────────────
  if (isWeak(assessment.itSystems.q1)) {
    addRisk(
      'Cyber fraud',
      'IT Systems',
      'Weak IT access controls increase vulnerability to internal and external cyber fraud.',
      5, 4, controlReduction, 'IT Lead'
    );
  } else if (isModerate(assessment.itSystems.q1)) {
    addRisk(
      'IT access control gaps',
      'IT Systems',
      'Access rights are not consistently reviewed, creating potential for unauthorised system use.',
      4, 3, controlReduction, 'IT Lead'
    );
  }
  if (isWeak(assessment.itSystems.q2)) {
    addRisk(
      'Insufficient system monitoring',
      'IT Systems',
      'System activity is not adequately monitored, limiting the ability to detect suspicious behaviour.',
      4, 3, controlReduction, 'IT Lead'
    );
  }

  // ── People & Culture ─────────────────────────────────────────────
  if (assessment.peopleCulture.whistleblowing === 'no-formal') {
    addRisk(
      'Unreported fraud',
      'People & Culture',
      'Absence of whistleblowing mechanisms prevents detection of fraudulent activity.',
      3, 4, controlReduction * 0.5, 'HR Director'
    );
  } else if (assessment.peopleCulture.whistleblowing === 'exists-not-known') {
    addRisk(
      'Ineffective whistleblowing',
      'People & Culture',
      'Whistleblowing route exists but is not well communicated, reducing staff willingness to report concerns.',
      2, 3, controlReduction * 0.5, 'HR Director'
    );
  }

  if (assessment.peopleCulture.leadershipMessage === 'not-discussed' || assessment.peopleCulture.leadershipMessage === 'occasionally') {
    addRisk(
      'Weak anti-fraud culture',
      'People & Culture',
      'Leadership does not consistently communicate the importance of fraud prevention, undermining organisational vigilance.',
      3, 3, controlReduction * 0.5, 'CEO / Board Chair'
    );
  }

  if (isWeak(assessment.peopleCulture.staffChecks)) {
    addRisk(
      'Inadequate staff vetting',
      'People & Culture',
      'Basic checks on new staff and contractors are not conducted, increasing insider threat risk.',
      3, 3, controlReduction, 'HR Director'
    );
  }

  // ── Controls & Technology ────────────────────────────────────────
  if (assessment.controlsTechnology.segregation === 'one-person' || assessment.controlsTechnology.segregation === 'not-sure') {
    addRisk(
      'Segregation of duties failure',
      'Controls',
      'Lack of segregation allows single individuals to execute and conceal fraudulent transactions.',
      5, 4, 0, 'Chief Operating Officer'
    );
  }

  if (assessment.controlsTechnology.accessManagement === 'not-confident' || assessment.controlsTechnology.accessManagement === 'some-gaps') {
    addRisk(
      'Weak system access controls',
      'Controls',
      'Inadequate system access management increases risk of unauthorised transactions or data manipulation.',
      4, 3, controlReduction, 'IT Lead'
    );
  }

  if (assessment.controlsTechnology.monitoring === 'none' || assessment.controlsTechnology.monitoring === 'very-limited') {
    addRisk(
      'Insufficient monitoring controls',
      'Controls',
      'Limited or no monitoring of transactions and data increases the risk of fraud going undetected.',
      4, 4, 0, 'Finance Director'
    );
  }

  // ── Fallback ─────────────────────────────────────────────────────
  if (risks.length === 0) {
    addRisk(
      'General fraud risk',
      'Overall',
      'While specific indicators are limited, all organisations face some inherent fraud risk.',
      2, 2, controlReduction, 'Senior Management Team'
    );
  }

  // Sort by residual score descending so highest risks appear first
  risks.sort((a, b) => b.residualScore - a.residualScore);

  return risks;
}
