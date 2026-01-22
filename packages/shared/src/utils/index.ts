import { RISK_SCORES, CONTROL_REDUCTIONS } from '../constants';

/**
 * Calculate inherent risk score (impact × likelihood)
 */
export function calculateInherentRisk(impact: number, likelihood: number): number {
  return Math.min(25, Math.max(1, impact * likelihood));
}

/**
 * Calculate residual risk score after control adjustment
 */
export function calculateResidualRisk(
  inherentRisk: number,
  controlStrength: keyof typeof CONTROL_REDUCTIONS
): number {
  const reduction = CONTROL_REDUCTIONS[controlStrength];
  return Math.round(inherentRisk * (1 - reduction));
}

/**
 * Get risk priority band from score
 */
export function getRiskPriority(score: number): 'HIGH' | 'MEDIUM' | 'LOW' {
  if (score >= RISK_SCORES.HIGH.min) return 'HIGH';
  if (score >= RISK_SCORES.MEDIUM.min) return 'MEDIUM';
  return 'LOW';
}

/**
 * Format date to UK format (DD/MM/YYYY)
 */
export function formatDateUK(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-GB');
}

/**
 * Generate unique key-pass code
 */
export function generateKeyPassCode(prefix = 'FRA'): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Calculate assessment completion percentage
 */
export function calculateCompletionPercentage(
  completedModules: string[],
  totalModules: number
): number {
  if (totalModules === 0) return 0;
  return Math.round((completedModules.length / totalModules) * 100);
}

/**
 * Sanitize string for safe display
 */
export function sanitizeString(str: string): string {
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}
