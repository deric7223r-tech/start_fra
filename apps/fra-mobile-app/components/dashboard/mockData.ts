import type { AssessmentData } from '@/types/assessment';
import type { EmployeeData, CompletionByDepartment, CompletionTrend } from './types';

export const mockEmployeeData: EmployeeData[] = [
  { userId: 'emp-1', userName: 'Sarah Johnson', email: 'sarah.j@company.com', department: 'Finance', status: 'completed', startedAt: '2024-01-15T09:00:00Z', completedAt: '2024-01-15T10:30:00Z', overallRiskLevel: 'medium' },
  { userId: 'emp-2', userName: 'Michael Brown', email: 'michael.b@company.com', department: 'Operations', status: 'in-progress', startedAt: '2024-01-16T14:00:00Z', completedAt: null, overallRiskLevel: null },
  { userId: 'emp-3', userName: 'Emma Davis', email: 'emma.d@company.com', department: 'HR', status: 'not-started', startedAt: null, completedAt: null, overallRiskLevel: null },
  { userId: 'emp-4', userName: 'James Wilson', email: 'james.w@company.com', department: 'Finance', status: 'completed', startedAt: '2024-01-10T08:00:00Z', completedAt: '2024-01-10T09:15:00Z', overallRiskLevel: 'low' },
  { userId: 'emp-5', userName: 'Olivia Taylor', email: 'olivia.t@company.com', department: 'IT', status: 'completed', startedAt: '2024-01-12T11:00:00Z', completedAt: '2024-01-12T12:00:00Z', overallRiskLevel: 'high' },
  { userId: 'emp-6', userName: 'Daniel Martinez', email: 'daniel.m@company.com', department: 'Operations', status: 'in-progress', startedAt: '2024-01-18T10:00:00Z', completedAt: null, overallRiskLevel: null },
];

export const completionByDepartment: CompletionByDepartment[] = [
  { department: 'Finance', completed: 2, total: 2 },
  { department: 'Operations', completed: 0, total: 2 },
  { department: 'HR', completed: 0, total: 1 },
  { department: 'IT', completed: 1, total: 1 },
];

export const completionTrend: CompletionTrend[] = [
  { date: 'Week 1', completed: 0 },
  { date: 'Week 2', completed: 2 },
  { date: 'Week 3', completed: 3 },
  { date: 'Week 4', completed: 3 },
];

export const mockAssessmentDetails: Record<string, Partial<AssessmentData>> = {
  'emp-1': {
    id: 'emp-1-assessment',
    organisation: { name: 'Acme Corp', type: 'private-sme', employeeCount: '51-100', region: 'London', activities: 'Financial services and consulting' },
    riskAppetite: { tolerance: 'low', fraudSeriousness: 'very-serious', reputationImportance: 'critical' },
    fraudTriangle: { pressure: 'moderate', controlStrength: 'reasonably-strong', speakUpCulture: 'quite-confident' },
    procurement: { q1: 'usually', q2: 'always', q3: 'usually', notes: 'Strong procurement controls in place with regular audits' },
    cashBanking: { q1: 'always', q2: 'usually', q3: 'always', notes: 'Dual authorization required for all transactions over £5,000' },
    payrollHR: { q1: 'usually', q2: 'usually', q3: 'always', notes: 'HR reviews payroll changes monthly' },
    revenue: { q1: 'always', q2: 'usually', q3: 'usually', notes: 'Revenue recognition follows IFRS 15 standards' },
    itSystems: { q1: 'usually', q2: 'sometimes', q3: 'usually', notes: 'IT security training conducted quarterly' },
    peopleCulture: { staffChecks: 'always', whistleblowing: 'well-communicated', leadershipMessage: 'very-clear' },
    controlsTechnology: { segregation: 'well-separated', accessManagement: 'very-confident', monitoring: 'regularly' },
    priorities: 'Focus on supplier due diligence and payment controls. Enhance monitoring of high-value transactions.',
    riskRegister: [
      { id: 'r1', title: 'Supplier Fraud', area: 'Procurement', description: 'Risk of fictitious suppliers or invoice manipulation', inherentScore: 15, residualScore: 8, priority: 'medium', suggestedOwner: 'Procurement Manager' },
      { id: 'r2', title: 'Payroll Ghost Employees', area: 'HR', description: 'Risk of unauthorized employees in payroll system', inherentScore: 12, residualScore: 6, priority: 'low', suggestedOwner: 'HR Director' }
    ],
  },
  'emp-4': {
    id: 'emp-4-assessment',
    organisation: { name: 'Acme Corp', type: 'private-sme', employeeCount: '51-100', region: 'Manchester', activities: 'Manufacturing and distribution' },
    riskAppetite: { tolerance: 'low', fraudSeriousness: 'quite-serious', reputationImportance: 'important' },
    fraudTriangle: { pressure: 'low', controlStrength: 'very-strong', speakUpCulture: 'very-confident' },
    procurement: { q1: 'always', q2: 'always', q3: 'always', notes: 'Excellent procurement processes with automated controls' },
    cashBanking: { q1: 'always', q2: 'always', q3: 'always', notes: 'Full segregation of duties maintained' },
    payrollHR: { q1: 'always', q2: 'always', q3: 'always', notes: 'Automated payroll reconciliation' },
    revenue: { q1: 'always', q2: 'always', q3: 'always', notes: 'Strong revenue controls with regular audits' },
    itSystems: { q1: 'always', q2: 'usually', q3: 'always', notes: 'Comprehensive IT security measures' },
    peopleCulture: { staffChecks: 'always', whistleblowing: 'well-communicated', leadershipMessage: 'very-clear' },
    controlsTechnology: { segregation: 'well-separated', accessManagement: 'very-confident', monitoring: 'regularly' },
    priorities: 'Maintain current control environment. Continue regular monitoring and training.',
    riskRegister: [
      { id: 'r3', title: 'Inventory Theft', area: 'Operations', description: 'Risk of inventory misappropriation', inherentScore: 10, residualScore: 5, priority: 'low', suggestedOwner: 'Operations Manager' }
    ],
  },
  'emp-5': {
    id: 'emp-5-assessment',
    organisation: { name: 'Acme Corp', type: 'private-sme', employeeCount: '51-100', region: 'Birmingham', activities: 'Technology and software development' },
    riskAppetite: { tolerance: 'medium', fraudSeriousness: 'very-serious', reputationImportance: 'critical' },
    fraudTriangle: { pressure: 'high', controlStrength: 'some-gaps', speakUpCulture: 'not-sure' },
    procurement: { q1: 'sometimes', q2: 'sometimes', q3: 'rarely', notes: 'Procurement controls need strengthening - manual processes with gaps' },
    cashBanking: { q1: 'usually', q2: 'sometimes', q3: 'sometimes', notes: 'Limited segregation of duties in some areas' },
    payrollHR: { q1: 'sometimes', q2: 'rarely', q3: 'usually', notes: 'Payroll reviews are inconsistent' },
    revenue: { q1: 'usually', q2: 'sometimes', q3: 'sometimes', notes: 'Revenue recognition practices need improvement' },
    itSystems: { q1: 'sometimes', q2: 'rarely', q3: 'sometimes', notes: 'IT access controls have significant gaps' },
    peopleCulture: { staffChecks: 'sometimes', whistleblowing: 'exists-not-known', leadershipMessage: 'occasionally' },
    controlsTechnology: { segregation: 'partly', accessManagement: 'some-gaps', monitoring: 'some-basic' },
    priorities: 'URGENT: Strengthen procurement controls, improve segregation of duties, enhance whistleblowing communication, implement regular monitoring.',
    riskRegister: [
      { id: 'r4', title: 'Procurement Fraud', area: 'Procurement', description: 'High risk of supplier collusion and kickbacks', inherentScore: 20, residualScore: 16, priority: 'high', suggestedOwner: 'CFO' },
      { id: 'r5', title: 'IT Access Abuse', area: 'IT Systems', description: 'Excessive system access with weak monitoring', inherentScore: 18, residualScore: 14, priority: 'high', suggestedOwner: 'CTO' },
      { id: 'r6', title: 'Payment Fraud', area: 'Finance', description: 'Weak payment authorization controls', inherentScore: 16, residualScore: 13, priority: 'high', suggestedOwner: 'Finance Manager' }
    ],
  },
};
