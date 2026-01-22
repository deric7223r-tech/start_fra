/**
 * Procurement Screen - Refactored
 *
 * BEFORE: 224 lines
 * AFTER: 69 lines
 * REDUCTION: 155 lines (69% reduction)
 */

import React from 'react';
import { useAssessment } from '@/contexts/AssessmentContext';
import { AssessmentScreen, QuestionGroup, TextArea, QuestionOption } from '@/components/ui';
import type { Frequency } from '@/types/assessment';

export default function ProcurementScreen() {
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
      title="Buying, paying, and suppliers"
      nextRoute="/cash-banking"
      previousRoute="/fraud-triangle"
      hidePrevious={false}
      progress={{ current: 3, total: 13 }}
    >
      <QuestionGroup
        question="Do you check suppliers before engaging them?"
        options={frequencyOptions}
        value={assessment.procurement.q1}
        onChange={(value) =>
          updateAssessment({ procurement: { ...assessment.procurement, q1: value } })
        }
      />

      <QuestionGroup
        question="Are purchase orders and invoices matched before payment?"
        options={frequencyOptions}
        value={assessment.procurement.q2}
        onChange={(value) =>
          updateAssessment({ procurement: { ...assessment.procurement, q2: value } })
        }
      />

      <QuestionGroup
        question="Do you review supplier contracts regularly?"
        options={frequencyOptions}
        value={(assessment.procurement.q3 as Frequency) ?? null}
        onChange={(value: Frequency) =>
          updateAssessment({ procurement: { ...assessment.procurement, q3: value } })
        }
      />

      <TextArea
        label="Anything we should know about this area?"
        hint="Issues, incidents, or worries"
        value={assessment.procurement.notes}
        onChangeText={(text) =>
          updateAssessment({ procurement: { ...assessment.procurement, notes: text } })
        }
        placeholder="Optional – add any relevant details"
        numberOfLines={4}
      />
    </AssessmentScreen>
  );
}
