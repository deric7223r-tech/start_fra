import type { Context } from 'hono';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { jsonError } from './helpers.js';

// ── Domain types ────────────────────────────────────────────────

export type Role = 'employer' | 'employee' | 'admin';

export type User = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: Role;
  organisationId: string;
  createdAt: string;
};

export type AssessmentStatus = 'draft' | 'in_progress' | 'submitted' | 'completed';

export type Assessment = {
  id: string;
  organisationId: string;
  createdByUserId: string;
  title: string;
  status: AssessmentStatus;
  answers: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
};

export type Organisation = {
  id: string;
  name: string;
  createdByUserId: string;
  employeeCount?: string;
  region?: string;
  industry?: string;
  createdAt: string;
  updatedAt: string;
};

export type Purchase = {
  id: string;
  organisationId: string;
  userId: string;
  packageId: string;
  status: string;
  paymentIntentId?: string;
  clientSecret?: string;
  amountCents: number;
  currency: string;
  createdAt: string;
  confirmedAt?: string;
};

export type Package = {
  id: string;
  name: string;
  description?: string;
  priceCents: number;
  currency: string;
  keypassAllowance: number;
  features: string[];
  isActive: boolean;
  sortOrder: number;
};

export type KeypassStatus = 'available' | 'used' | 'revoked' | 'expired';

export type Keypass = {
  code: string;
  organisationId: string;
  status: KeypassStatus;
  createdAt: string;
  expiresAt: string;
  usedAt?: string;
};

export type RateLimitConfig = {
  windowMs: number;
  max: number;
};

// ── DB row types ────────────────────────────────────────────────

export type DbAssessmentRow = {
  id: string;
  organisation_id: string;
  created_by_user_id: string;
  title: string;
  status: AssessmentStatus;
  answers: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
};

export type DbUserRow = {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  role: Role;
  organisation_id: string;
  created_at: string;
};

export type DbKeypassRow = {
  code: string;
  organisation_id: string;
  status: string;
  created_at: string;
  expires_at: string;
  used_at: string | null;
  used_by_user_id: string | null;
};

// ── JWT config ──────────────────────────────────────────────────

export const DEV_REFRESH_SECRET = 'dev_refresh_secret_change_me';
export const refreshSecret: jwt.Secret = process.env.JWT_REFRESH_SECRET ?? DEV_REFRESH_SECRET;
export const accessTokenExpiry = (process.env.JWT_EXPIRES_IN ?? '30m') as jwt.SignOptions['expiresIn'];
export const refreshTokenExpiry = (process.env.JWT_REFRESH_EXPIRES_IN ?? '7d') as jwt.SignOptions['expiresIn'];

// ── UUID validation ─────────────────────────────────────────────

export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUUID(value: string): boolean {
  return UUID_REGEX.test(value);
}

export function requireUUIDParam(c: Context, paramName: string): string | Response {
  const value = c.req.param(paramName);
  if (!isValidUUID(value)) {
    return jsonError(c, 400, 'INVALID_PARAM', `Invalid ${paramName} format`);
  }
  return value;
}

// ── Account lockout constants ───────────────────────────────────

export const LOCKOUT_PREFIX = 'lockout:';
export const LOCKOUT_MAX_ATTEMPTS = 5;
export const LOCKOUT_WINDOW_SECONDS = 15 * 60; // 15 minutes

// ── Security constants ──────────────────────────────────────────

export const MAX_BODY_BYTES = Number(process.env.MAX_BODY_BYTES ?? 1_048_576); // 1 MB default
export const CSRF_SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

// ── Password reset constants ────────────────────────────────────

export const PASSWORD_RESET_PREFIX = 'pwreset:';
export const PASSWORD_RESET_TTL_SECONDS = 3600; // 1 hour

// ── Fallback packages ───────────────────────────────────────────

export const FALLBACK_PACKAGES: Package[] = [
  { id: 'pkg_basic', name: 'Basic', description: 'Self-service fraud risk assessment', priceCents: 0, currency: 'gbp', keypassAllowance: 1, features: ['Single assessment', 'Basic risk report', 'PDF export'], isActive: true, sortOrder: 1 },
  { id: 'pkg_training', name: 'Training', description: 'Assessment with staff training key-passes', priceCents: 4900, currency: 'gbp', keypassAllowance: 10, features: ['Everything in Basic', '10 employee key-passes', 'Training modules', 'Compliance certificate'], isActive: true, sortOrder: 2 },
  { id: 'pkg_full', name: 'Full', description: 'Complete fraud risk management suite', priceCents: 14900, currency: 'gbp', keypassAllowance: 50, features: ['Everything in Training', '50 employee key-passes', 'Priority support', 'Custom action plan', 'Annual review'], isActive: true, sortOrder: 3 },
];

// ── Zod schemas ─────────────────────────────────────────────────

export const passwordSchema = z.string().min(12).refine(
  (pw) => /[A-Z]/.test(pw) && /[a-z]/.test(pw) && /[0-9]/.test(pw),
  { message: 'Password must contain uppercase, lowercase, and a number' }
);

export const signupSchema = z.object({
  email: z.string().email(),
  password: passwordSchema,
  name: z.string().min(1).max(200),
  organisationName: z.string().min(1).max(200).optional(),
  jobTitle: z.string().max(200).optional(),
  sector: z.enum(['public', 'charity', 'private']).optional(),
  workshopRole: z.enum(['facilitator', 'participant']).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1).optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: passwordSchema,
});

export const assessmentCreateSchema = z.object({
  title: z.string().min(1).default('Fraud Risk Assessment'),
  answers: z.record(z.string(), z.unknown()).optional(),
});

export const assessmentPatchSchema = z.object({
  title: z.string().min(1).optional(),
  answers: z.record(z.string(), z.unknown()).optional(),
  status: z.enum(['draft', 'in_progress', 'submitted', 'completed']).optional(),
});

export const keypassGenerateSchema = z.object({
  quantity: z.number().int().min(1).max(500).default(1),
  expiresInDays: z.number().int().min(1).max(365).default(30),
});

export const keypassValidateSchema = z.object({
  code: z.string().min(6).max(64),
});

export const keypassUseSchema = z.object({
  code: z.string().min(6).max(64),
  email: z.string().email().optional(),
  name: z.string().min(1).optional(),
});

export const paymentCreateIntentSchema = z.object({
  packageId: z.string().min(1),
  currency: z.string().min(3).max(3).default('gbp'),
});

export const purchasesCreateSchema = z.object({
  packageId: z.string().min(1),
});

export const purchasesConfirmSchema = z.object({
  paymentIntentId: z.string().min(1).optional(),
});

export const stripeWebhookSchema = z.object({
  type: z.string().min(1),
  data: z.unknown().optional(),
});

export const s3PresignUploadSchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.string().min(1).max(255),
  sizeBytes: z.number().int().positive(),
});

export const s3PresignDownloadSchema = z.object({
  key: z.string().min(1).max(1024),
});

export const s3PromoteUploadSchema = z.object({
  sourceKey: z.string().min(1).max(1024),
  filename: z.string().min(1).max(255).optional(),
});
