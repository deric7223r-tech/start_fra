import type { User, Assessment, Organisation, Purchase, Keypass } from './types.js';

// In-memory fallbacks (used only when DATABASE_URL is not set, e.g. tests)
export const usersByEmail = new Map<string, User>();
export const refreshTokenAllowlist = new Set<string>();
export const passwordResetTokens = new Map<
  string,
  {
    userId: string;
    expiresAt: number;
  }
>();

export const assessmentsById = new Map<string, Assessment>();
export const organisationsById = new Map<string, Organisation>();
export const purchasesById = new Map<string, Purchase>();
export const keypassesByCode = new Map<string, Keypass>();

export const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();
