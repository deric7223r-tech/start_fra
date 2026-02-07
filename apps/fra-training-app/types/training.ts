export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface CaseStudy {
  id: string;
  title: string;
  sector: string;
  scenario: string;
  questions: string[];
  learningPoints: string[];
}

export interface ScenarioOption {
  id: string;
  text: string;
  isCorrect: boolean;
  feedback: string;
}

export interface ScenarioStep {
  id: string;
  description: string;
  options: ScenarioOption[];
}

export interface ScenarioExercise {
  title: string;
  introduction: string;
  steps: ScenarioStep[];
}

export interface TrainingProgress {
  completedSections: number[];
  quizScores: Record<number, number>;
  scenarioChoices: Record<string, string>;
  actionPlanCommitments: {
    immediate: string[];
    thirtyDays: string[];
    ninetyDays: string[];
  };
  currentSection: number;
  completedAt: string | null;
  certificateNumber: string | null;
}

export interface SectionData {
  title: string;
  subtitle: string;
  keyPoints: string[];
  discussionPrompt: string;
}

export interface WorkshopSection {
  id: number;
  title: string;
  duration: string;
  icon: string;
}

export interface ActionPlanTemplates {
  immediate: string[];
  thirtyDays: string[];
  ninetyDays: string[];
}
