import React from 'react';
import { useAssessment } from '@/contexts/AssessmentContext';
import { AssessmentScreen, QuestionGroup, TextArea, QuestionOption } from '@/components/ui';
import type { Frequency } from '@/types/assessment';

export default function ITSystemsScreen() {
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
      title="IT systems and data"
      nextRoute="/people-culture"
      previousRoute="/revenue"
      hidePrevious={false}
      progress={{ current: 7, total: 13 }}
    >
      <QuestionGroup
        question="Are user access rights reviewed regularly?"
        options={frequencyOptions}
        value={assessment.itSystems.q1}
        onChange={(value) =>
          updateAssessment({ itSystems: { ...assessment.itSystems, q1: value } })
        }
      />

      <QuestionGroup
        question="Are system logs and activity monitored?"
        options={frequencyOptions}
        value={assessment.itSystems.q2}
        onChange={(value) =>
          updateAssessment({ itSystems: { ...assessment.itSystems, q2: value } })
        }
      />

      <TextArea
        label="Anything we should know about this area?"
        hint="Issues, incidents, or worries"
        value={assessment.itSystems.notes}
        onChangeText={(text) =>
          updateAssessment({ itSystems: { ...assessment.itSystems, notes: text } })
        }
        placeholder="Optional – add any relevant details"
        numberOfLines={4}
      />
    </AssessmentScreen>
  );
}
