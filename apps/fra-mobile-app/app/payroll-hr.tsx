import React from 'react';
import { useAssessment } from '@/contexts/AssessmentContext';
import { AssessmentScreen, QuestionGroup, TextArea, QuestionOption } from '@/components/ui';
import type { Frequency } from '@/types/assessment';

export default function PayrollHRScreen() {
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
      title="Payroll and HR"
      nextRoute="/revenue"
      previousRoute="/cash-banking"
      hidePrevious={false}
      progress={{ current: 5, total: 13 }}
    >
      <QuestionGroup
        question="Are payroll changes reviewed and approved?"
        options={frequencyOptions}
        value={assessment.payrollHR.q1}
        onChange={(value) =>
          updateAssessment({ payrollHR: { ...assessment.payrollHR, q1: value } })
        }
      />

      <QuestionGroup
        question="Are leavers removed from payroll promptly?"
        options={frequencyOptions}
        value={assessment.payrollHR.q2}
        onChange={(value) =>
          updateAssessment({ payrollHR: { ...assessment.payrollHR, q2: value } })
        }
      />

      <TextArea
        label="Anything we should know about this area?"
        hint="Issues, incidents, or worries"
        value={assessment.payrollHR.notes}
        onChangeText={(text) =>
          updateAssessment({ payrollHR: { ...assessment.payrollHR, notes: text } })
        }
        placeholder="Optional – add any relevant details"
        numberOfLines={4}
      />
    </AssessmentScreen>
  );
}
