import React from 'react';
import { useAssessment } from '@/contexts/AssessmentContext';
import { AssessmentScreen, QuestionGroup, QuestionOption } from '@/components/ui';
import type { Frequency, WhistleblowingRoute, LeadershipMessage } from '@/types/assessment';

export default function PeopleCultureScreen() {
  const { assessment, updateAssessment } = useAssessment();

  const frequencyOptions: QuestionOption<Frequency>[] = [
    { value: 'always', label: 'Always' },
    { value: 'usually', label: 'Usually' },
    { value: 'sometimes', label: 'Sometimes' },
    { value: 'rarely', label: 'Rarely' },
    { value: 'never', label: 'Never' },
  ];

  const whistleblowingOptions: QuestionOption<WhistleblowingRoute>[] = [
    { value: 'well-communicated', label: 'Well-communicated' },
    { value: 'exists-not-known', label: 'Exists but not well known' },
    { value: 'no-formal', label: 'No formal route' },
  ];

  const leadershipOptions: QuestionOption<LeadershipMessage>[] = [
    { value: 'very-clear', label: 'Very clear' },
    { value: 'quite-clear', label: 'Quite clear' },
    { value: 'occasionally', label: 'Occasionally mentioned' },
    { value: 'not-discussed', label: 'Not really discussed' },
  ];

  return (
    <AssessmentScreen
      title="People and culture"
      nextRoute="/controls-technology"
      previousRoute="/it-systems"
      hidePrevious={false}
      progress={{ current: 8, total: 13 }}
    >
      <QuestionGroup
        question="Basic checks on new staff and key contractors"
        options={frequencyOptions}
        value={assessment.peopleCulture.staffChecks}
        onChange={(value) =>
          updateAssessment({ peopleCulture: { ...assessment.peopleCulture, staffChecks: value } })
        }
      />

      <QuestionGroup
        question="Whistleblowing or speak-up route"
        options={whistleblowingOptions}
        value={assessment.peopleCulture.whistleblowing}
        onChange={(value) =>
          updateAssessment({ peopleCulture: { ...assessment.peopleCulture, whistleblowing: value } })
        }
      />

      <QuestionGroup
        question="Leadership message on fraud"
        options={leadershipOptions}
        value={assessment.peopleCulture.leadershipMessage}
        onChange={(value) =>
          updateAssessment({ peopleCulture: { ...assessment.peopleCulture, leadershipMessage: value } })
        }
      />
    </AssessmentScreen>
  );
}
