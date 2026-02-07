import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import type { AssessmentData, AssessmentStatus, PackageType, PaymentStatus, FeedbackData, RiskRegisterItem, RiskPriority } from '@/types/assessment';
import { apiService } from '@/services/api.service';
import { API_CONFIG } from '@/constants/api';
import { debounce } from '@/utils/debounce';

const STORAGE_KEY = 'fra_assessment_draft';
const SYNC_QUEUE_KEY = 'fra_sync_queue';
const SYNC_DEBOUNCE_MS = 5000; // 5 seconds

interface SyncStatus {
  state: 'synced' | 'syncing' | 'pending' | 'error';
  lastSync: Date | null;
  errorMessage?: string;
}

interface SyncQueueItem {
  id: string;
  timestamp: string;
  data: Partial<AssessmentData>;
  retryCount: number;
}

function generateId(): string {
  return `fra-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function isLocalOnlyAssessmentId(id: string): boolean {
  return id.startsWith('fra-');
}

function createEmptyAssessment(): AssessmentData {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    status: 'draft' as AssessmentStatus,
    createdAt: now,
    updatedAt: now,
    userId: 'demo-user',
    organisationId: 'demo-org',
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

function calculateRiskScore(assessment: AssessmentData): RiskRegisterItem[] {
  const risks: RiskRegisterItem[] = [];
  let riskCounter = 1;

  const getControlReduction = (strength: string | null): number => {
    if (strength === 'very-strong' || strength === 'well-separated') return 0.4;
    if (strength === 'reasonably-strong' || strength === 'partly') return 0.2;
    return 0;
  };

  const getPriority = (score: number): RiskPriority => {
    if (score >= 15) return 'high';
    if (score >= 8) return 'medium';
    return 'low';
  };

  const addRisk = (
    title: string,
    area: string,
    description: string,
    impact: number,
    likelihood: number,
    controlReduction: number,
    owner: string
  ) => {
    const inherent = impact * likelihood;
    const residual = Math.round(inherent * (1 - controlReduction));
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

  const controlReduction = getControlReduction(assessment.fraudTriangle.controlStrength);

  if (assessment.procurement.q1 === 'rarely' || assessment.procurement.q1 === 'never' || assessment.procurement.q2 === 'rarely') {
    addRisk(
      'Supplier fraud',
      'Procurement',
      'Weak procurement controls may allow fraudulent supplier relationships or inflated invoicing.',
      4,
      4,
      controlReduction,
      'Head of Procurement'
    );
  }

  if (assessment.cashBanking.q1 === 'rarely' || assessment.cashBanking.q1 === 'never') {
    addRisk(
      'Cash misappropriation',
      'Cash & Banking',
      'Insufficient cash handling controls increase risk of theft or misappropriation.',
      4,
      3,
      controlReduction,
      'Finance Manager'
    );
  }

  if (assessment.payrollHR.q1 === 'rarely' || assessment.payrollHR.q1 === 'never') {
    addRisk(
      'Payroll fraud',
      'Payroll & HR',
      'Weak payroll controls may enable ghost employees or timesheet manipulation.',
      3,
      3,
      controlReduction,
      'HR Manager'
    );
  }

  if (assessment.revenue.q1 === 'rarely' || assessment.revenue.q1 === 'never') {
    addRisk(
      'Revenue leakage',
      'Revenue',
      'Poor revenue controls may lead to unrecorded income or fee manipulation.',
      4,
      3,
      controlReduction,
      'Finance Director'
    );
  }

  if (assessment.itSystems.q1 === 'rarely' || assessment.itSystems.q1 === 'never') {
    addRisk(
      'Cyber fraud',
      'IT Systems',
      'Weak IT access controls increase vulnerability to internal and external cyber fraud.',
      5,
      4,
      controlReduction,
      'IT Lead'
    );
  }

  if (assessment.peopleCulture.whistleblowing === 'no-formal') {
    addRisk(
      'Unreported fraud',
      'People & Culture',
      'Absence of whistleblowing mechanisms prevents detection of fraudulent activity.',
      3,
      4,
      controlReduction * 0.5,
      'HR Director'
    );
  }

  if (assessment.controlsTechnology.segregation === 'one-person' || assessment.controlsTechnology.segregation === 'not-sure') {
    addRisk(
      'Segregation of duties failure',
      'Controls',
      'Lack of segregation allows single individuals to execute and conceal fraudulent transactions.',
      5,
      4,
      0,
      'Chief Operating Officer'
    );
  }

  if (risks.length === 0) {
    addRisk(
      'General fraud risk',
      'Overall',
      'While specific indicators are limited, all organisations face some inherent fraud risk.',
      2,
      2,
      controlReduction,
      'Senior Management Team'
    );
  }

  return risks;
}

export const [AssessmentProvider, useAssessment] = createContextHook(() => {
  const [assessment, setAssessment] = useState<AssessmentData>(createEmptyAssessment());
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    state: 'synced',
    lastSync: null,
  });
  const [isOnline, setIsOnline] = useState(true);
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>([]);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const ensureRemoteAssessment = async (current: AssessmentData): Promise<AssessmentData> => {
    if (!apiService.isAuthenticated() || !isOnline) {
      return current;
    }

    if (!isLocalOnlyAssessmentId(current.id)) {
      return current;
    }

    const response = await apiService.post<any>(
      API_CONFIG.ENDPOINTS.ASSESSMENTS.CREATE,
      { title: 'Fraud Risk Assessment', answers: current as any },
      { requiresAuth: true }
    );

    if (response.success && response.data?.id) {
      const now = new Date().toISOString();
      const next = { ...current, id: response.data.id, updatedAt: now };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setAssessment(next);
      return next;
    }

    throw new Error(response.error?.message || 'Failed to create assessment');
  };

  // Network detection
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const wasOffline = !isOnline;
      const isNowOnline = state.isConnected === true;

      setIsOnline(isNowOnline);

      // If we just came back online, process sync queue
      if (wasOffline && isNowOnline) {
        console.log('Network restored, processing sync queue');
        processSyncQueue();
      }
    });

    return () => unsubscribe();
  }, [isOnline]);

  useEffect(() => {
    loadDraft();
    loadSyncQueue();
  }, []);

  // Load sync queue from storage
  const loadSyncQueue = async () => {
    try {
      const stored = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      if (stored) {
        const queue = JSON.parse(stored) as SyncQueueItem[];
        setSyncQueue(queue);
        if (queue.length > 0) {
          console.log(`Loaded ${queue.length} pending sync items`);
        }
      }
    } catch (error) {
      console.error('Failed to load sync queue:', error);
    }
  };

  // Save sync queue to storage
  const saveSyncQueue = async (queue: SyncQueueItem[]) => {
    try {
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
      setSyncQueue(queue);
    } catch (error) {
      console.error('Failed to save sync queue:', error);
    }
  };

  // Add item to sync queue
  const addToSyncQueue = async (data: Partial<AssessmentData>) => {
    const queueItem: SyncQueueItem = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      data,
      retryCount: 0,
    };

    const newQueue = [...syncQueue, queueItem];
    await saveSyncQueue(newQueue);
    console.log('Added to sync queue:', queueItem.id);
  };

  // Process sync queue
  const processSyncQueue = async () => {
    if (syncQueue.length === 0 || !isOnline || !apiService.isAuthenticated()) {
      return;
    }

    console.log(`Processing ${syncQueue.length} queued sync items`);
    const remainingQueue: SyncQueueItem[] = [];

    for (const item of syncQueue) {
      try {
        await syncToBackendImmediate(item.data);
        console.log('Successfully synced queued item:', item.id);
      } catch (error) {
        console.error('Failed to sync queued item:', item.id, error);

        // Retry logic: max 3 retries
        if (item.retryCount < 3) {
          remainingQueue.push({ ...item, retryCount: item.retryCount + 1 });
        } else {
          console.warn('Max retries reached for item:', item.id);
        }
      }
    }

    await saveSyncQueue(remainingQueue);
  };

  // Sync to backend (immediate, no debounce)
  const syncToBackendImmediate = async (data: Partial<AssessmentData>) => {
    if (!apiService.isAuthenticated()) {
      console.log('Not authenticated, skipping sync');
      return;
    }

    try {
      setSyncStatus({ state: 'syncing', lastSync: syncStatus.lastSync });

      const target = await ensureRemoteAssessment(assessment);

      const response = await apiService.patch(
        API_CONFIG.ENDPOINTS.ASSESSMENTS.UPDATE(target.id),
        data,
        { requiresAuth: true }
      );

      if (response.success) {
        setSyncStatus({
          state: 'synced',
          lastSync: new Date(),
          errorMessage: undefined,
        });
        console.log('Successfully synced to backend');
      } else {
        throw new Error(response.error?.message || 'Sync failed');
      }
    } catch (error: any) {
      console.error('Sync to backend failed:', error);
      setSyncStatus({
        state: 'error',
        lastSync: syncStatus.lastSync,
        errorMessage: error.message || 'Failed to sync',
      });
      throw error;
    }
  };

  // Debounced sync function
  const debouncedSync = useCallback(
    debounce(async (data: Partial<AssessmentData>) => {
      if (!isOnline) {
        console.log('Offline, adding to sync queue');
        await addToSyncQueue(data);
        setSyncStatus({ state: 'pending', lastSync: syncStatus.lastSync });
        return;
      }

      if (!apiService.isAuthenticated()) {
        console.log('Not authenticated, skipping sync');
        return;
      }

      try {
        await syncToBackendImmediate(data);
      } catch (error) {
        // Add to queue for retry
        await addToSyncQueue(data);
        setSyncStatus({ state: 'pending', lastSync: syncStatus.lastSync });
      }
    }, SYNC_DEBOUNCE_MS),
    [isOnline, syncQueue, syncStatus]
  );

  const loadDraft = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored && stored !== 'undefined' && stored !== 'null' && stored.trim().length > 0) {
        if (!stored.startsWith('{') && !stored.startsWith('[')) {
          console.warn('Invalid JSON format detected, clearing storage');
          await AsyncStorage.removeItem(STORAGE_KEY);
          setAssessment(createEmptyAssessment());
          return;
        }
        try {
          const parsed = JSON.parse(stored) as Partial<AssessmentData>;
          // Merge with defaults to ensure all fields exist (handles schema migrations)
          const defaults = createEmptyAssessment();
          const merged: AssessmentData = {
            ...defaults,
            ...parsed,
            organisation: { ...defaults.organisation, ...parsed.organisation },
            riskAppetite: { ...defaults.riskAppetite, ...parsed.riskAppetite },
            fraudTriangle: { ...defaults.fraudTriangle, ...parsed.fraudTriangle },
            procurement: { ...defaults.procurement, ...parsed.procurement },
            cashBanking: { ...defaults.cashBanking, ...parsed.cashBanking },
            payrollHR: { ...defaults.payrollHR, ...parsed.payrollHR },
            revenue: { ...defaults.revenue, ...parsed.revenue },
            itSystems: { ...defaults.itSystems, ...parsed.itSystems },
            peopleCulture: { ...defaults.peopleCulture, ...parsed.peopleCulture },
            controlsTechnology: { ...defaults.controlsTechnology, ...parsed.controlsTechnology },
            riskRegister: parsed.riskRegister ?? defaults.riskRegister,
            paymentsModule: { ...defaults.paymentsModule, ...parsed.paymentsModule, kpis: { ...defaults.paymentsModule.kpis, ...parsed.paymentsModule?.kpis } },
            trainingAwareness: { ...defaults.trainingAwareness, ...parsed.trainingAwareness },
            monitoringEvaluation: { ...defaults.monitoringEvaluation, ...parsed.monitoringEvaluation },
            complianceMapping: { ...defaults.complianceMapping, ...parsed.complianceMapping },
            fraudResponsePlan: { ...defaults.fraudResponsePlan, ...parsed.fraudResponsePlan },
            actionPlan: { ...defaults.actionPlan, ...parsed.actionPlan },
            documentControl: { ...defaults.documentControl, ...parsed.documentControl },
            payment: { ...defaults.payment, ...parsed.payment },
          };
          setAssessment(merged);
          console.log('Loaded draft assessment:', merged.id);
        } catch (parseError) {
          console.error('Failed to parse assessment data:', parseError, 'Stored value:', stored.substring(0, 100));
          await AsyncStorage.removeItem(STORAGE_KEY);
          setAssessment(createEmptyAssessment());
        }
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveDraft = useCallback(async (data: AssessmentData) => {
    try {
      const updated = { ...data, updatedAt: new Date().toISOString() };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setAssessment(updated);
      console.log('Saved draft assessment');
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  }, []);

  const updateAssessment = useCallback((updates: Partial<AssessmentData>) => {
    setAssessment((prev) => {
      const updated = { ...prev, ...updates, updatedAt: new Date().toISOString() };

      // Save to AsyncStorage immediately (offline-first)
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(console.error);

      // Trigger debounced sync to backend
      debouncedSync(updates);

      return updated;
    });
  }, [debouncedSync]);

  const startNewAssessment = useCallback(() => {
    const newAssessment = createEmptyAssessment();
    setAssessment(newAssessment);
    saveDraft(newAssessment);

    if (apiService.isAuthenticated() && isOnline) {
      ensureRemoteAssessment(newAssessment).catch(async () => {
        await addToSyncQueue(newAssessment);
        setSyncStatus({ state: 'pending', lastSync: syncStatus.lastSync });
      });
    }
  }, [saveDraft]);

  const submitAssessment = useCallback(() => {
    const riskRegister = calculateRiskScore(assessment);
    updateAssessment({
      status: 'submitted' as AssessmentStatus,
      riskRegister,
    });

    if (apiService.isAuthenticated() && isOnline) {
      ensureRemoteAssessment(assessment)
        .then((target) =>
          apiService.post(
            API_CONFIG.ENDPOINTS.ASSESSMENTS.SUBMIT(target.id),
            {},
            { requiresAuth: true }
          )
        )
        .catch(async () => {
          await addToSyncQueue({ status: 'submitted' as AssessmentStatus, riskRegister });
          setSyncStatus({ state: 'pending', lastSync: syncStatus.lastSync });
        });
    } else {
      addToSyncQueue({ status: 'submitted' as AssessmentStatus, riskRegister }).catch(console.error);
      setSyncStatus({ state: 'pending', lastSync: syncStatus.lastSync });
    }
  }, [assessment, updateAssessment, isOnline]);

  const validateAssessment = useCallback(() => {
    if (!assessment.signature) {
      return { valid: false, message: 'Assessment requires employer signature for validation' };
    }
    if (assessment.status !== 'signed') {
      return { valid: false, message: 'Assessment must be signed by an authorized signatory' };
    }
    return { valid: true, message: 'Assessment is validated' };
  }, [assessment]);

  const selectPackage = useCallback((packageType: PackageType, price: number) => {
    updateAssessment({
      payment: {
        ...assessment.payment,
        packageType,
        price,
      },
    });
  }, [assessment.payment, updateAssessment]);

  const processPayment = useCallback(async (cardDetails: { number: string; expiry: string; cvc: string; name: string }) => {
    console.log('Processing payment with card ending:', cardDetails.number.slice(-4));
    const packageType = assessment.payment.packageType;
    if (!packageType) {
      throw new Error('No package selected');
    }

    const packageId =
      packageType === 'health-check'
        ? 'pkg_basic'
        : packageType === 'with-awareness'
          ? 'pkg_training'
          : 'pkg_full';

    try {
      const purchase = await apiService.post<any>(
        API_CONFIG.ENDPOINTS.PURCHASES.CREATE,
        { packageId },
        { requiresAuth: true }
      );

      if (!purchase.success || !purchase.data?.purchaseId) {
        throw new Error(purchase.error?.message || 'Failed to create purchase');
      }

      const confirmed = await apiService.post<any>(
        API_CONFIG.ENDPOINTS.PURCHASES.CONFIRM(purchase.data.purchaseId),
        { paymentIntentId: purchase.data.paymentIntentId },
        { requiresAuth: true }
      );

      if (!confirmed.success) {
        throw new Error(confirmed.error?.message || 'Failed to confirm purchase');
      }

      const transactionId = purchase.data.purchaseId as string;
      updateAssessment({
        status: 'paid' as AssessmentStatus,
        payment: {
          ...assessment.payment,
          transactionId,
          status: 'success' as PaymentStatus,
          date: new Date().toISOString(),
        },
      });

      return { success: true, transactionId };
    } catch (error) {
      updateAssessment({
        payment: {
          ...assessment.payment,
          status: 'failed' as PaymentStatus,
        },
      });
      throw error;
    }
  }, [assessment.payment, updateAssessment]);

  const submitFeedback = useCallback((feedbackData: Omit<FeedbackData, 'id' | 'assessmentId' | 'date'>) => {
    const feedback: FeedbackData = {
      id: generateId(),
      assessmentId: assessment.id,
      date: new Date().toISOString(),
      ...feedbackData,
    };
    updateAssessment({ feedback });
    console.log('Feedback submitted:', feedback);
  }, [assessment.id, updateAssessment]);

  return {
    assessment,
    isLoading,
    updateAssessment,
    startNewAssessment,
    submitAssessment,
    selectPackage,
    processPayment,
    submitFeedback,
    saveDraft,
    validateAssessment,
    // Sync-related
    syncStatus,
    isOnline,
    syncQueue,
    processSyncQueue,
  };
});
