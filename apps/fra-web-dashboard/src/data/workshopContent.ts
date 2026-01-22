import { QuizQuestion, CaseStudy } from '@/types/workshop';

export const workshopSections = [
  {
    id: 0,
    title: 'Welcome & Introduction',
    duration: '2 min',
    icon: 'Presentation',
  },
  {
    id: 1,
    title: 'Regulatory Landscape',
    duration: '5 min',
    icon: 'Scale',
  },
  {
    id: 2,
    title: 'Types of Fraud Risks',
    duration: '5 min',
    icon: 'ShieldAlert',
  },
  {
    id: 3,
    title: 'Defense Strategies',
    duration: '5 min',
    icon: 'Shield',
  },
  {
    id: 4,
    title: 'Organisational Impact',
    duration: '5 min',
    icon: 'Building2',
  },
  {
    id: 5,
    title: 'Case Study & Scenarios',
    duration: '5 min',
    icon: 'FileText',
  },
  {
    id: 6,
    title: 'Action Planning',
    duration: '3 min',
    icon: 'Target',
  },
];

export const sectionContent: Record<number, {
  title: string;
  subtitle: string;
  keyPoints: string[];
  discussionPrompt: string;
}> = {
  0: {
    title: 'Welcome to Fraud Risk Awareness',
    subtitle: 'Building a Culture of Vigilance and Compliance',
    keyPoints: [
      'This 30-minute workshop is designed for Trustees, Executive Leadership, and Budget-Holders',
      'We will cover the current regulatory landscape and emerging fraud threats',
      'You will learn practical defense strategies and develop an action plan',
      'Interactive elements will help reinforce key concepts throughout',
    ],
    discussionPrompt: 'What fraud risks are you most concerned about in your organisation?',
  },
  1: {
    title: 'The Regulatory Landscape',
    subtitle: 'Understanding Your Compliance Obligations',
    keyPoints: [
      'The Economic Crime and Corporate Transparency Act 2023 introduces new "failure to prevent fraud" offence',
      'Organisations can be held liable for fraud committed by employees for the organisation\'s benefit',
      'The only defense is proving "reasonable procedures" were in place',
      'Regulators expect proactive fraud risk assessments and controls',
      'Senior leaders have personal accountability for fraud prevention culture',
    ],
    discussionPrompt: 'How prepared is your organisation for the new "failure to prevent fraud" legislation?',
  },
  2: {
    title: 'Types of Fraud Risks',
    subtitle: 'Recognising Common Fraud Schemes',
    keyPoints: [
      'Internal fraud: expense fraud, payroll fraud, procurement fraud, asset misappropriation',
      'External fraud: invoice fraud, CEO fraud, vendor impersonation, cyber fraud',
      'Financial statement fraud: revenue recognition manipulation, expense capitalisation',
      'Grant and funding fraud: misuse of restricted funds, false reporting',
      'Cyber-enabled fraud: phishing, business email compromise, ransomware',
    ],
    discussionPrompt: 'Which of these fraud types do you believe poses the greatest risk to your organisation?',
  },
  3: {
    title: 'Defense Strategies',
    subtitle: 'Building Robust Fraud Prevention Controls',
    keyPoints: [
      'Segregation of duties: No single person should control an entire transaction',
      'Authorisation limits: Clear approval thresholds and dual authorisation for high-value transactions',
      'Verification procedures: Independent confirmation of bank details, supplier changes',
      'Whistleblowing: Confidential reporting channels with anti-retaliation policies',
      'Regular audits: Surprise audits and continuous monitoring of high-risk areas',
    ],
    discussionPrompt: 'Which defense strategy would have the biggest impact if implemented in your area?',
  },
  4: {
    title: 'Organisational Impact',
    subtitle: 'The True Cost of Fraud',
    keyPoints: [
      'Financial losses: Average fraud loss is 5% of annual revenue (ACFE Report)',
      'Reputational damage: Loss of stakeholder trust, media scrutiny, donor withdrawal',
      'Legal consequences: Fines, prosecution, personal liability for directors',
      'Operational disruption: Investigation costs, staff time, service delivery impact',
      'Cultural impact: Decreased morale, increased turnover, damaged trust',
    ],
    discussionPrompt: 'Beyond financial loss, what impact would a fraud incident have on your organisation?',
  },
  5: {
    title: 'Case Study & Scenarios',
    subtitle: 'Learning from Real-World Examples',
    keyPoints: [
      'Analyse sector-specific case studies to identify red flags',
      'Practice responding to realistic fraud scenarios',
      'Understand the decision points that can prevent or enable fraud',
      'Learn from both failures and successful fraud prevention',
      'Apply lessons to your own organisational context',
    ],
    discussionPrompt: 'What early warning signs should we look for in our own organisation?',
  },
  6: {
    title: 'Your Action Plan',
    subtitle: 'Committing to Fraud Prevention',
    keyPoints: [
      'Complete the Fraud Risk Self-Assessment within 30 days',
      'Review and update authorisation limits and segregation of duties',
      'Ensure whistleblowing channels are accessible and promoted',
      'Schedule fraud awareness training for your teams',
      'Establish regular fraud risk reporting to governance bodies',
    ],
    discussionPrompt: 'What is the first action you will take after this workshop?',
  },
};

export const quizQuestions: Record<number, QuizQuestion> = {
  1: {
    question: 'Under the Economic Crime and Corporate Transparency Act 2023, what is the only defense against the "failure to prevent fraud" offence?',
    options: [
      'Showing that employees acted without authorisation',
      'Proving that "reasonable procedures" were in place',
      'Demonstrating that the fraud was committed by external parties',
      'Providing evidence of financial controls',
    ],
    correctAnswer: 1,
    explanation: 'The only defense is proving that "reasonable procedures" were in place to prevent fraud. This means organisations must proactively implement and document their fraud prevention measures.',
  },
  2: {
    question: 'Which type of fraud involves an attacker impersonating a senior executive to request urgent payments?',
    options: [
      'Payroll fraud',
      'Procurement fraud',
      'CEO fraud (Business Email Compromise)',
      'Grant fraud',
    ],
    correctAnswer: 2,
    explanation: 'CEO fraud, also known as Business Email Compromise (BEC), involves criminals impersonating senior executives to trick employees into making urgent payments or sharing sensitive information.',
  },
  3: {
    question: 'What is the primary purpose of segregation of duties as a fraud control?',
    options: [
      'To reduce workload for individual employees',
      'To ensure no single person controls an entire transaction',
      'To improve efficiency in processing transactions',
      'To comply with data protection regulations',
    ],
    correctAnswer: 1,
    explanation: 'Segregation of duties ensures that no single person has complete control over a transaction from start to finish, requiring collusion between multiple people to commit fraud.',
  },
  4: {
    question: 'According to the ACFE Report, what is the average fraud loss as a percentage of annual revenue?',
    options: [
      '1%',
      '3%',
      '5%',
      '10%',
    ],
    correctAnswer: 2,
    explanation: 'The Association of Certified Fraud Examiners (ACFE) reports that the typical organisation loses 5% of revenue to fraud annually, making fraud prevention a significant financial priority.',
  },
};

export const caseStudies: Record<string, CaseStudy> = {
  public: {
    id: 'public-sector-case',
    title: 'Council Procurement Fraud',
    sector: 'public',
    scenario: 'A senior procurement officer at a local council established a shell company and awarded it contracts worth £2.3 million over three years. The fraud was only discovered when a new finance director noticed unusual patterns in vendor payments.',
    questions: [
      'What controls could have prevented this fraud?',
      'What red flags were missed?',
      'How should the council respond now?',
    ],
    learningPoints: [
      'Vendor due diligence and verification of beneficial ownership',
      'Regular rotation of procurement responsibilities',
      'Independent review of contract awards above threshold',
      'Monitoring for conflicts of interest',
      'Whistleblowing culture and anonymous reporting',
    ],
  },
  charity: {
    id: 'charity-sector-case',
    title: 'Restricted Funds Misappropriation',
    sector: 'charity',
    scenario: 'A charity\'s finance manager transferred restricted grant funds to cover operational deficits, falsifying reports to donors showing the funds were properly applied. The fraud totalled £450,000 and was uncovered during a grant audit.',
    questions: [
      'What controls should protect restricted funds?',
      'How could trustees have detected this earlier?',
      'What are the regulatory and reputational consequences?',
    ],
    learningPoints: [
      'Separate bank accounts for restricted funds',
      'Regular trustee review of fund movements',
      'Independent reconciliation of grant spending',
      'Clear policies on fund borrowing and transfers',
      'Robust audit trail and documentation',
    ],
  },
  private: {
    id: 'private-sector-case',
    title: 'Invoice Fraud Scheme',
    sector: 'private',
    scenario: 'A medium-sized company received an email appearing to be from a long-standing supplier, requesting a change in bank details. The accounts team processed the change without verification, resulting in £180,000 paid to fraudsters over six weeks.',
    questions: [
      'What verification procedures should be in place?',
      'How did the fraudsters gain access to supplier information?',
      'What immediate actions should the company take?',
    ],
    learningPoints: [
      'Always verify bank detail changes via known contact numbers',
      'Implement dual authorisation for payment detail changes',
      'Train staff on email compromise red flags',
      'Regular review of vendor master file changes',
      'Cyber security measures and email authentication',
    ],
  },
};

export const scenarioExercise = {
  title: 'The Suspicious Invoice',
  introduction: 'You are a budget-holder reviewing invoices for approval. You notice an invoice from a new supplier that was set up by your direct report last week.',
  steps: [
    {
      id: 'step1',
      description: 'The invoice is for £4,500 for "consultancy services" with minimal detail. Your approval limit is £5,000. What do you do?',
      options: [
        {
          id: 'approve',
          text: 'Approve it - it\'s within my limit and was processed by my team',
          isCorrect: false,
          feedback: 'Risk: This is exactly what a fraudster expects. The amount is deliberately below your limit to avoid additional scrutiny.',
        },
        {
          id: 'investigate',
          text: 'Request more information about the supplier and services before approving',
          isCorrect: true,
          feedback: 'Correct! Requesting supporting documentation and verifying new suppliers is essential, especially for vague descriptions.',
        },
        {
          id: 'delegate',
          text: 'Ask your direct report who set up the supplier to approve it instead',
          isCorrect: false,
          feedback: 'Risk: This bypasses segregation of duties. The person who set up the supplier should not also approve their invoices.',
        },
      ],
    },
    {
      id: 'step2',
      description: 'Upon investigation, you discover the supplier\'s registered address is a residential property and there is no online presence. Your direct report says they were recommended by a contact.',
      options: [
        {
          id: 'proceed',
          text: 'Proceed if your report can provide the contact\'s details',
          isCorrect: false,
          feedback: 'Risk: Red flags are mounting. A legitimate consultancy would have a professional presence. Personal recommendations can be fabricated.',
        },
        {
          id: 'escalate',
          text: 'Escalate to your line manager and/or finance team for further investigation',
          isCorrect: true,
          feedback: 'Correct! Multiple red flags warrant escalation. This protects both you and the organisation.',
        },
        {
          id: 'reject',
          text: 'Reject the invoice and close the matter',
          isCorrect: false,
          feedback: 'Partial: While rejecting is appropriate, closing without escalation means potential fraud goes uninvestigated.',
        },
      ],
    },
  ],
};

export const downloadableResources = [
  {
    id: 'checklist',
    title: 'Fraud Risk Self-Assessment Checklist',
    description: 'A comprehensive checklist to evaluate your organisation\'s fraud risk controls',
    icon: 'ClipboardCheck',
    filename: 'fraud-risk-self-assessment-checklist.pdf',
  },
  {
    id: 'guidance',
    title: 'Budget-Holder Guidance Document',
    description: 'Practical guidance for budget-holders on fraud prevention responsibilities',
    icon: 'FileText',
    filename: 'budget-holder-guidance.pdf',
  },
  {
    id: 'roadmap',
    title: '90-Day Implementation Roadmap',
    description: 'A structured plan for implementing fraud prevention measures',
    icon: 'Map',
    filename: '90-day-implementation-roadmap.pdf',
  },
];

export const actionPlanTemplates = {
  immediate: [
    'Review current authorisation limits and approval processes',
    'Verify whistleblowing channels are accessible and promoted',
    'Ensure all staff have completed fraud awareness training',
  ],
  thirtyDays: [
    'Complete the Fraud Risk Self-Assessment',
    'Document key fraud risks and existing controls',
    'Identify gaps in segregation of duties',
  ],
  ninetyDays: [
    'Implement priority control improvements',
    'Establish regular fraud risk reporting to governance',
    'Review and update fraud response plan',
  ],
};