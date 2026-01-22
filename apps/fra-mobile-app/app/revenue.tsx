import React from 'react';
import { useAssessment } from '@/contexts/AssessmentContext';
import { AssessmentScreen, QuestionGroup, TextArea, QuestionOption } from '@/components/ui';
import type { Frequency } from '@/types/assessment';

export default function RevenueScreen() {
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
      title="Revenue and income"
      nextRoute="/it-systems"
      previousRoute="/payroll-hr"
      hidePrevious={false}
      progress={{ current: 6, total: 13 }}
    >
      <QuestionGroup
        question="Are invoices raised promptly and accurately?"
        options={frequencyOptions}
        value={assessment.revenue.q1}
        onChange={(value) =>
          updateAssessment({ revenue: { ...assessment.revenue, q1: value } })
        }
      />

      <QuestionGroup
        question="Are debts and receivables monitored?"
        options={frequencyOptions}
        value={assessment.revenue.q2}
        onChange={(value) =>
          updateAssessment({ revenue: { ...assessment.revenue, q2: value } })
        }
      />

      <TextArea
        label="Anything we should know about this area?"
        hint="Issues, incidents, or worries"
        value={assessment.revenue.notes}
        onChangeText={(text) =>
          updateAssessment({ revenue: { ...assessment.revenue, notes: text } })
        }
        placeholder="Optional – add any relevant details"
        numberOfLines={4}
      />
    </AssessmentScreen>
  );
}
