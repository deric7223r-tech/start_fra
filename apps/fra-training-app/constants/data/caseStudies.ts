import { CaseStudy } from '@/types/training';

export const caseStudies: Record<string, CaseStudy> = {
  public: {
    id: 'public-sector-case',
    title: 'Council Procurement Fraud',
    sector: 'public',
    scenario: 'A senior procurement officer at a local council established a shell company and awarded it contracts worth \u00a32.3 million over three years. The fraud was only discovered when a new finance director noticed unusual patterns in vendor payments.',
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
    scenario: 'A charity\'s finance manager transferred restricted grant funds to cover operational deficits, falsifying reports to donors showing the funds were properly applied. The fraud totalled \u00a3450,000 and was uncovered during a grant audit.',
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
    scenario: 'A medium-sized company received an email appearing to be from a long-standing supplier, requesting a change in bank details. The accounts team processed the change without verification, resulting in \u00a3180,000 paid to fraudsters over six weeks.',
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
