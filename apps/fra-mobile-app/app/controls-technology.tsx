import React from 'react';
import { useAssessment } from '@/contexts/AssessmentContext';
import { AssessmentScreen, QuestionGroup, QuestionOption } from '@/components/ui';
import type { SegregationLevel, ConfidenceLevel, MonitoringLevel } from '@/types/assessment';

export default function ControlsTechnologyScreen() {
  const { assessment, updateAssessment } = useAssessment();

  const segregationOptions: QuestionOption<SegregationLevel>[] = [
    { value: 'well-separated', label: 'Yes – well separated' },
    { value: 'partly', label: 'Partly' },
    { value: 'one-person', label: 'No – one person can do several steps' },
    { value: 'not-sure', label: 'Not sure' },
  ];

  const confidenceOptions: QuestionOption<ConfidenceLevel>[] = [
    { value: 'very-confident', label: 'Very confident' },
    { value: 'quite-confident', label: 'Quite confident' },
    { value: 'some-gaps', label: 'Some gaps' },
    { value: 'not-confident', label: 'Not confident' },
  ];

  const monitoringOptions: QuestionOption<MonitoringLevel>[] = [
    { value: 'regularly', label: 'Yes – regularly' },
    { value: 'some-basic', label: 'Some basic checks' },
    { value: 'very-limited', label: 'Very limited' },
    { value: 'none', label: 'None' },
  ];

  return (
    <AssessmentScreen
      title="Controls and systems"
      nextRoute="/priorities"
      previousRoute="/people-culture"
      hidePrevious={false}
      progress={{ current: 9, total: 13 }}
    >
      <QuestionGroup
        question="Segregation of duties"
        options={segregationOptions}
        value={assessment.controlsTechnology.segregation}
        onChange={(value) =>
          updateAssessment({ controlsTechnology: { ...assessment.controlsTechnology, segregation: value } })
        }
      />

      <QuestionGroup
        question="System access management"
        options={confidenceOptions}
        value={assessment.controlsTechnology.accessManagement}
        onChange={(value) =>
          updateAssessment({ controlsTechnology: { ...assessment.controlsTechnology, accessManagement: value } })
        }
      />

      <QuestionGroup
        question="Monitoring and data checks"
        options={monitoringOptions}
        value={assessment.controlsTechnology.monitoring}
        onChange={(value) =>
          updateAssessment({ controlsTechnology: { ...assessment.controlsTechnology, monitoring: value } })
        }
      />
    </AssessmentScreen>
  );
}
