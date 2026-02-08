import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { TrainingProgress } from '@/types/training';
import { createLogger } from '@/utils/logger';
const logger = createLogger('TrainingContext');

const STORAGE_KEY = 'training_progress';
const TOTAL_SECTIONS = 7;

const defaultProgress: TrainingProgress = {
  completedSections: [],
  quizScores: {},
  scenarioChoices: {},
  actionPlanCommitments: {
    immediate: [],
    thirtyDays: [],
    ninetyDays: [],
  },
  currentSection: 0,
  completedAt: null,
  certificateNumber: null,
};

export const [TrainingProvider, useTraining] = createContextHook(() => {
  const [progress, setProgress] = useState<TrainingProgress>(defaultProgress);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setProgress(JSON.parse(stored));
      }
    } catch (error: unknown) {
      logger.error('Failed to load training progress', error);
    } finally {
      setIsLoading(false);
    }
  };

  const persistProgress = async (updated: TrainingProgress) => {
    setProgress(updated);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error: unknown) {
      logger.error('Failed to save training progress', error);
    }
  };

  const completeSection = useCallback(
    async (sectionId: number) => {
      if (progress.completedSections.includes(sectionId)) return;
      const updated: TrainingProgress = {
        ...progress,
        completedSections: [...progress.completedSections, sectionId],
      };
      await persistProgress(updated);
    },
    [progress]
  );

  const saveQuizScore = useCallback(
    async (sectionId: number, score: number) => {
      const updated: TrainingProgress = {
        ...progress,
        quizScores: { ...progress.quizScores, [sectionId]: score },
      };
      await persistProgress(updated);
    },
    [progress]
  );

  const saveScenarioChoice = useCallback(
    async (stepId: string, choiceId: string) => {
      const updated: TrainingProgress = {
        ...progress,
        scenarioChoices: { ...progress.scenarioChoices, [stepId]: choiceId },
      };
      await persistProgress(updated);
    },
    [progress]
  );

  const saveActionPlan = useCallback(
    async (commitments: { immediate: string[]; thirtyDays: string[]; ninetyDays: string[] }) => {
      const updated: TrainingProgress = {
        ...progress,
        actionPlanCommitments: commitments,
      };
      await persistProgress(updated);
    },
    [progress]
  );

  const setCurrentSection = useCallback(
    async (sectionId: number) => {
      const updated: TrainingProgress = {
        ...progress,
        currentSection: sectionId,
      };
      await persistProgress(updated);
    },
    [progress]
  );

  const completeCourse = useCallback(
    async (certificateNumber: string) => {
      const updated: TrainingProgress = {
        ...progress,
        completedAt: new Date().toISOString(),
        certificateNumber,
      };
      await persistProgress(updated);
    },
    [progress]
  );

  const resetProgress = useCallback(async () => {
    await persistProgress(defaultProgress);
  }, []);

  const isComplete = useMemo(
    () => progress.completedSections.length >= TOTAL_SECTIONS,
    [progress.completedSections]
  );

  return {
    ...progress,
    isLoading,
    isComplete,
    completeSection,
    saveQuizScore,
    saveScenarioChoice,
    saveActionPlan,
    setCurrentSection,
    completeCourse,
    resetProgress,
  };
});
