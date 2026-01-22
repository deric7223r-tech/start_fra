import React from 'react';
import { useAssessment } from '@/contexts/AssessmentContext';
import { AssessmentScreen, QuestionGroup, TextArea, QuestionOption } from '@/components/ui';
import type { Frequency } from '@/types/assessment';

export default function CashBankingScreen() {
  const { assessment, updateAssessment } = useAssessment();

  const frequencyOptions: QuestionOption<Frequency>[] = [
    { value: 'always', label: 'Always' },
    { value: 'usually', label: 'Usually' },
    { value: 'sometimes', label: 'Sometimes' },
    { value: 'rarely', label: 'Rarely' },
    { value: 'never', label: 'Never' },
  ];

  return (
    <AssessmentScreen
      title="Cash and banking"
      nextRoute="/payroll-hr"
      previousRoute="/procurement"
      hidePrevious={false}
      progress={{ current: 4, total: 13 }}
    >
      <QuestionGroup
        question="Are cash receipts recorded and banked promptly?"
        options={frequencyOptions}
        value={assessment.cashBanking.q1}
        onChange={(value) =>
          updateAssessment({ cashBanking: { ...assessment.cashBanking, q1: value } })
        }
      />

      <QuestionGroup
        question="Are bank reconciliations done regularly?"
        options={frequencyOptions}
        value={assessment.cashBanking.q2}
        onChange={(value) =>
          updateAssessment({ cashBanking: { ...assessment.cashBanking, q2: value } })
        }
      />

      <TextArea
        label="Anything we should know about this area?"
        hint="Issues, incidents, or worries"
        value={assessment.cashBanking.notes}
        onChangeText={(text) =>
          updateAssessment({ cashBanking: { ...assessment.cashBanking, notes: text } })
        }
        placeholder="Optional – add any relevant details"
        numberOfLines={4}
      />
    </AssessmentScreen>
  );
}
