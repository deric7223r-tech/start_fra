import React from 'react';
import { useAssessment } from '@/contexts/AssessmentContext';
import { AssessmentScreen, QuestionGroup, QuestionOption } from '@/components/ui';
import type { RiskTolerance, FraudSeriousness, ReputationImportance } from '@/types/assessment';

export default function RiskAppetiteScreen() {
  const { assessment, updateAssessment } = useAssessment();

  const toleranceOptions: QuestionOption<RiskTolerance>[] = [
    { value: 'low', label: 'Low – very little tolerance' },
    { value: 'medium', label: 'Medium – some risk, but strong controls expected' },
    { value: 'high', label: 'High – more risk accepted to stay flexible / low-cost' },
  ];

  const seriousnessOptions: QuestionOption<FraudSeriousness>[] = [
    { value: 'very-serious', label: 'Very serious' },
    { value: 'quite-serious', label: 'Quite serious' },
    { value: 'manageable', label: 'Manageable' },
    { value: 'not-serious', label: 'Not very serious' },
  ];

  const reputationOptions: QuestionOption<ReputationImportance>[] = [
    { value: 'critical', label: 'Critical' },
    { value: 'important', label: 'Important' },
    { value: 'somewhat', label: 'Somewhat important' },
    { value: 'low', label: 'Low priority' },
  ];

  return (
    <AssessmentScreen
      title="Help us understand your attitude to fraud risk"
      nextRoute="/fraud-triangle"
      progress={{ current: 1, total: 13 }}
    >
      <QuestionGroup
        question="Overall, how much fraud risk can you accept?"
        options={toleranceOptions}
        value={assessment.riskAppetite.tolerance}
        onChange={(value) =>
          updateAssessment({ riskAppetite: { ...assessment.riskAppetite, tolerance: value } })
        }
      />

      <QuestionGroup
        question="How serious would a moderate fraud loss be for you?"
        options={seriousnessOptions}
        value={assessment.riskAppetite.fraudSeriousness}
        onChange={(value) =>
          updateAssessment({ riskAppetite: { ...assessment.riskAppetite, fraudSeriousness: value } })
        }
      />

      <QuestionGroup
        question="How important is protecting your reputation?"
        options={reputationOptions}
        value={assessment.riskAppetite.reputationImportance}
        onChange={(value) =>
          updateAssessment({ riskAppetite: { ...assessment.riskAppetite, reputationImportance: value } })
        }
      />
    </AssessmentScreen>
  );
}
