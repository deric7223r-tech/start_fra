import dotenv from 'dotenv';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { S3Client, PutObjectCommand, GetObjectCommand, CopyObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getDbPool, closeDbPool } from './db.js';
import { getRedis } from './redis.js';
import workshop from './workshop.js';

dotenv.config();

const app = new Hono();

type Role = 'employer' | 'employee' | 'admin';

type User = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: Role;
  organisationId: string;
  createdAt: string;
};

type AuthContext = {
  userId: string;
  email: string;
  role: Role;
  organisationId: string;
};

// In-memory fallbacks (used only when DATABASE_URL is not set, e.g. tests)
const usersByEmail = new Map<string, User>();
const refreshTokenAllowlist = new Set<string>();
const passwordResetTokens = new Map<
  string,
  {
    userId: string;
    expiresAt: number;
  }
>();

type AssessmentStatus = 'draft' | 'in_progress' | 'submitted' | 'completed';

type Assessment = {
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

const assessmentsById = new Map<string, Assessment>();

type Organisation = {
  id: string;
  name: string;
  createdByUserId: string;
  employeeCount?: string;
  region?: string;
  industry?: string;
  createdAt: string;
  updatedAt: string;
};

type Purchase = {
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

type Package = {
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

// In-memory fallbacks for entities without DB wiring (tests / no-db mode)
const organisationsById = new Map<string, Organisation>();
const purchasesById = new Map<string, Purchase>();

type DbAssessmentRow = {
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

async function dbInsertAssessment(assessment: Assessment): Promise<void> {
  const pool = getDbPool();
  await pool.query(
    'insert into public.assessments (id, organisation_id, created_by_user_id, title, status, answers, created_at, updated_at, submitted_at) values ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
    [
      assessment.id,
      assessment.organisationId,
      assessment.createdByUserId,
      assessment.title,
      assessment.status,
      assessment.answers,
      assessment.createdAt,
      assessment.updatedAt,
      assessment.submittedAt ?? null,
    ]
  );
}

async function dbGetAssessmentById(id: string): Promise<Assessment | null> {
  const pool = getDbPool();
  const res = await pool.query<DbAssessmentRow>(
    'select id, organisation_id, created_by_user_id, title, status, answers, created_at, updated_at, submitted_at from public.assessments where id = $1 limit 1',
    [id]
  );
  const row = res.rows[0];
  if (!row) return null;
  return {
    id: row.id,
    organisationId: row.organisation_id,
    createdByUserId: row.created_by_user_id,
    title: row.title,
    status: row.status,
    answers: row.answers ?? {},
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    submittedAt: row.submitted_at ? new Date(row.submitted_at).toISOString() : undefined,
  };
}

async function dbListAssessmentsByOrganisation(orgId: string): Promise<Assessment[]> {
  const pool = getDbPool();
  const res = await pool.query<DbAssessmentRow>(
    'select id, organisation_id, created_by_user_id, title, status, answers, created_at, updated_at, submitted_at from public.assessments where organisation_id = $1 order by created_at desc',
    [orgId]
  );
  return res.rows.map((row) => ({
    id: row.id,
    organisationId: row.organisation_id,
    createdByUserId: row.created_by_user_id,
    title: row.title,
    status: row.status,
    answers: row.answers ?? {},
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    submittedAt: row.submitted_at ? new Date(row.submitted_at).toISOString() : undefined,
  }));
}

async function dbUpdateAssessment(id: string, patch: Partial<Assessment>): Promise<Assessment | null> {
  const existing = await dbGetAssessmentById(id);
  if (!existing) return null;

  const next: Assessment = {
    ...existing,
    ...patch,
    id: existing.id,
    organisationId: existing.organisationId,
    createdByUserId: existing.createdByUserId,
  };

  const pool = getDbPool();
  await pool.query(
    'update public.assessments set title = $1, status = $2, answers = $3, updated_at = $4, submitted_at = $5 where id = $6',
    [
      next.title,
      next.status,
      next.answers,
      next.updatedAt,
      next.submittedAt ?? null,
      next.id,
    ]
  );

  return next;
}

type KeypassStatus = 'available' | 'used' | 'revoked' | 'expired';

type Keypass = {
  code: string;
  organisationId: string;
  status: KeypassStatus;
  createdAt: string;
  expiresAt: string;
  usedAt?: string;
};

const keypassesByCode = new Map<string, Keypass>();

const DEV_JWT_SECRET = 'dev_jwt_secret_change_me';
const DEV_REFRESH_SECRET = 'dev_refresh_secret_change_me';

const jwtSecret: jwt.Secret = process.env.JWT_SECRET ?? DEV_JWT_SECRET;
const refreshSecret: jwt.Secret = process.env.JWT_REFRESH_SECRET ?? DEV_REFRESH_SECRET;

// Security defaults (can be overridden by env vars)
const accessTokenExpiry = (process.env.JWT_EXPIRES_IN ?? '30m') as jwt.SignOptions['expiresIn'];
const refreshTokenExpiry = (process.env.JWT_REFRESH_EXPIRES_IN ?? '7d') as jwt.SignOptions['expiresIn'];

function hasDatabase(): boolean {
  return !!process.env.DATABASE_URL;
}

// ── Account lockout via Redis ────────────────────────────────────
const LOCKOUT_PREFIX = 'lockout:';
const LOCKOUT_MAX_ATTEMPTS = 5;
const LOCKOUT_WINDOW_SECONDS = 15 * 60; // 15 minutes

async function checkAccountLockout(email: string): Promise<{ locked: boolean; remaining: number }> {
  const redis = getRedis();
  if (!redis) return { locked: false, remaining: LOCKOUT_MAX_ATTEMPTS };

  const key = `${LOCKOUT_PREFIX}${email.toLowerCase()}`;
  const count = await redis.get<number>(key) ?? 0;
  if (count >= LOCKOUT_MAX_ATTEMPTS) {
    return { locked: true, remaining: 0 };
  }
  return { locked: false, remaining: LOCKOUT_MAX_ATTEMPTS - count };
}

async function recordFailedLogin(email: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  const key = `${LOCKOUT_PREFIX}${email.toLowerCase()}`;
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, LOCKOUT_WINDOW_SECONDS);
  }
}

async function clearFailedLogins(email: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  await redis.del(`${LOCKOUT_PREFIX}${email.toLowerCase()}`);
}

// ── UUID validation ─────────────────────────────────────────────
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(value: string): boolean {
  return UUID_REGEX.test(value);
}

function requireUUIDParam(c: Context, paramName: string): string | Response {
  const value = c.req.param(paramName);
  if (!isValidUUID(value)) {
    return jsonError(c, 400, 'INVALID_PARAM', `Invalid ${paramName} format`);
  }
  return value;
}

// ── Password strength ───────────────────────────────────────────
const passwordSchema = z.string().min(12).refine(
  (pw) => /[A-Z]/.test(pw) && /[a-z]/.test(pw) && /[0-9]/.test(pw),
  { message: 'Password must contain uppercase, lowercase, and a number' }
);

const signupSchema = z.object({
  email: z.string().email(),
  password: passwordSchema,
  name: z.string().min(1).max(200),
  organisationName: z.string().min(1).max(200).optional(),
  jobTitle: z.string().max(200).optional(),
  sector: z.enum(['public', 'charity', 'private']).optional(),
  workshopRole: z.enum(['facilitator', 'participant']).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1).optional(),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: passwordSchema,
});

const assessmentCreateSchema = z.object({
  title: z.string().min(1).default('Fraud Risk Assessment'),
  answers: z.record(z.string(), z.unknown()).optional(),
});

const assessmentPatchSchema = z.object({
  title: z.string().min(1).optional(),
  answers: z.record(z.string(), z.unknown()).optional(),
  status: z.enum(['draft', 'in_progress', 'submitted', 'completed']).optional(),
});

const keypassGenerateSchema = z.object({
  quantity: z.number().int().min(1).max(500).default(1),
  expiresInDays: z.number().int().min(1).max(365).default(30),
});

const keypassValidateSchema = z.object({
  code: z.string().min(6).max(64),
});

const keypassUseSchema = z.object({
  code: z.string().min(6).max(64),
  email: z.string().email().optional(),
  name: z.string().min(1).optional(),
});

const paymentCreateIntentSchema = z.object({
  packageId: z.string().min(1),
  currency: z.string().min(3).max(3).default('gbp'),
});

const purchasesCreateSchema = z.object({
  packageId: z.string().min(1),
});

const purchasesConfirmSchema = z.object({
  paymentIntentId: z.string().min(1).optional(),
});

const stripeWebhookSchema = z.object({
  type: z.string().min(1),
  data: z.unknown().optional(),
});

const s3PresignUploadSchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.string().min(1).max(255),
  sizeBytes: z.number().int().positive(),
});

const s3PresignDownloadSchema = z.object({
  key: z.string().min(1).max(1024),
});

const s3PromoteUploadSchema = z.object({
  sourceKey: z.string().min(1).max(1024),
  filename: z.string().min(1).max(255).optional(),
});

function jsonError(c: Context, status: ContentfulStatusCode, code: string, message: string) {
  return c.json({ success: false, error: { code, message } }, status);
}

function getAuth(c: Context): AuthContext | null {
  const authHeader = c.req.header('authorization') ?? c.req.header('Authorization');
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;

  try {
    const payload = jwt.verify(match[1], jwtSecret) as jwt.JwtPayload;
    if (
      typeof payload.sub !== 'string' ||
      typeof payload.email !== 'string' ||
      typeof payload.role !== 'string' ||
      typeof payload.organisationId !== 'string'
    ) {
      return null;
    }

    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role as Role,
      organisationId: payload.organisationId,
    };
  } catch {
    return null;
  }
}

function requireAuth(c: Context): AuthContext | Response {
  const auth = getAuth(c);
  if (!auth) return jsonError(c, 401, 'UNAUTHORIZED', 'Missing or invalid access token');
  return auth;
}

function getClientIp(c: Context): string {
  const forwarded = c.req.header('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIp = c.req.header('x-real-ip');
  if (realIp) return realIp.trim();
  return 'unknown';
}

type RateLimitConfig = {
  windowMs: number;
  max: number;
};

const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

function rateLimit(keyPrefix: string, cfg: RateLimitConfig) {
  return async (c: Context) => {
    // Skip rate limiting in test environment
    if (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID) return;

    const ip = getClientIp(c);
    const key = `${keyPrefix}:${ip}`;

    const redis = getRedis();
    if (redis) {
      const count = await redis.incr(key);
      if (count === 1) {
        await redis.pexpire(key, cfg.windowMs);
      }

      if (count > cfg.max) {
        return jsonError(c, 429, 'RATE_LIMITED', 'Too many requests');
      }

      return;
    }

    const now = Date.now();
    const existing = rateLimitBuckets.get(key);
    if (!existing || existing.resetAt <= now) {
      rateLimitBuckets.set(key, { count: 1, resetAt: now + cfg.windowMs });
      return;
    }

    if (existing.count >= cfg.max) {
      return jsonError(c, 429, 'RATE_LIMITED', 'Too many requests');
    }

    existing.count += 1;
  };
}

// ── CORS ────────────────────────────────────────────────────────
const allowedOrigins = (process.env.CORS_ORIGINS ?? '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  '*',
  cors({
    origin: (origin) => {
      if (!origin) return '*'; // allow non-browser requests (curl, mobile)
      if (allowedOrigins.length === 0) return origin; // dev: allow all
      if (allowedOrigins.includes(origin)) return origin;
      // Allow Expo tunnel URLs in dev
      if (origin.endsWith('.exp.direct') || origin.endsWith('.ngrok.io') || origin.endsWith('.ngrok-free.app')) return origin;
      return ''; // deny
    },
    allowMethods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    exposeHeaders: ['X-Request-ID', 'X-Response-Time'],
    credentials: true,
    maxAge: 86400,
  })
);

// ── Request ID + Response Time + Security Headers + Logging ─────
app.use('*', async (c, next) => {
  const requestId = c.req.header('x-request-id') ?? crypto.randomUUID();
  c.set('requestId' as never, requestId);
  c.header('X-Request-ID', requestId);

  const start = performance.now();
  await next();
  const ms = (performance.now() - start).toFixed(1);
  c.header('X-Response-Time', `${ms}ms`);

  // Security headers (helmet-style)
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  c.header('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
  c.header('X-Permitted-Cross-Domain-Policies', 'none');
  c.header('X-Download-Options', 'noopen');
  c.header('Cross-Origin-Embedder-Policy', 'require-corp');
  c.header('Cross-Origin-Opener-Policy', 'same-origin');
  c.header('Cross-Origin-Resource-Policy', 'same-origin');
  c.header('X-XSS-Protection', '0'); // modern best practice: disable legacy XSS filter
  c.header('Cache-Control', 'no-store');
  c.header('Pragma', 'no-cache');
  if (process.env.NODE_ENV === 'production') {
    c.header('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  }

  // Structured request log (skip health checks to reduce noise)
  if (c.req.path !== '/health') {
    const logEntry = {
      ts: new Date().toISOString(),
      method: c.req.method,
      path: c.req.path,
      status: c.res.status,
      ms: Number(ms),
      ip: getClientIp(c),
      rid: requestId,
    };
    if (c.res.status >= 400) {
      console.error(JSON.stringify(logEntry));
    } else {
      console.log(JSON.stringify(logEntry));
    }
  }
});

const s3Bucket = process.env.S3_BUCKET;
const s3Region = process.env.S3_REGION ?? process.env.AWS_REGION;
const s3UploadPrefix = process.env.S3_UPLOAD_PREFIX ?? 'private/uploads';
const s3DownloadPrefix = process.env.S3_DOWNLOAD_PREFIX ?? s3UploadPrefix;
const s3UrlExpiresSeconds = Number(process.env.S3_URL_EXPIRES_SECONDS ?? 300);
const s3MaxUploadBytes = Number(process.env.S3_MAX_UPLOAD_BYTES ?? 10 * 1024 * 1024);
const s3AllowedContentTypes = (process.env.S3_ALLOWED_CONTENT_TYPES ?? 'application/pdf,image/png,image/jpeg')
  .split(',')
  .map((v) => v.trim())
  .filter(Boolean);

const s3Client = s3Bucket && s3Region ? new S3Client({ region: s3Region }) : null;

function requireS3(c: Context): S3Client | Response {
  if (!s3Client || !s3Bucket || !s3Region) {
    return jsonError(c, 501, 'S3_NOT_CONFIGURED', 'S3 is not configured');
  }
  return s3Client;
}

function sanitizeFilename(filename: string): string {
  const base = filename.split('/').pop() ?? filename;
  return base.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 255);
}

function s3KeyForUpload(auth: AuthContext, filename: string): string {
  const safe = sanitizeFilename(filename);
  const id = crypto.randomUUID();
  return `${s3UploadPrefix}/${auth.organisationId}/${auth.userId}/${id}_${safe}`;
}

function s3KeyForDownload(auth: AuthContext, filename: string): string {
  const safe = sanitizeFilename(filename);
  const id = crypto.randomUUID();
  return `${s3DownloadPrefix}/${auth.organisationId}/${id}_${safe}`;
}

function generateKeypassCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => alphabet[b % alphabet.length])
    .join('');
}

function issueTokens(user: User) {
  const accessToken = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      organisationId: user.organisationId,
    },
    jwtSecret,
    { expiresIn: accessTokenExpiry }
  );

  const refreshToken = jwt.sign(
    {
      sub: user.id,
      type: 'refresh',
    },
    refreshSecret,
    { expiresIn: refreshTokenExpiry }
  );

  if (!hasDatabase()) {
    refreshTokenAllowlist.add(refreshToken);
  }

  return { accessToken, refreshToken };
}

type DbUserRow = {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  role: Role;
  organisation_id: string;
  created_at: string;
};

async function dbGetUserByEmail(email: string): Promise<User | null> {
  const pool = getDbPool();
  const res = await pool.query<DbUserRow>(
    'select id, email, name, password_hash, role, organisation_id, created_at from public.users where email = $1 limit 1',
    [email.toLowerCase()]
  );
  const row = res.rows[0];
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    passwordHash: row.password_hash,
    role: row.role,
    organisationId: row.organisation_id,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

async function dbGetUserById(id: string): Promise<User | null> {
  const pool = getDbPool();
  const res = await pool.query<DbUserRow>(
    'select id, email, name, password_hash, role, organisation_id, created_at from public.users where id = $1 limit 1',
    [id]
  );
  const row = res.rows[0];
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    passwordHash: row.password_hash,
    role: row.role,
    organisationId: row.organisation_id,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

async function dbInsertUser(user: User): Promise<void> {
  const pool = getDbPool();
  await pool.query(
    'insert into public.users (id, email, name, password_hash, role, organisation_id, created_at) values ($1,$2,$3,$4,$5,$6,$7)',
    [
      user.id,
      user.email.toLowerCase(),
      user.name,
      user.passwordHash,
      user.role,
      user.organisationId,
      user.createdAt,
    ]
  );
}

async function dbUpsertRefreshToken(token: string, userId: string): Promise<void> {
  const pool = getDbPool();
  await pool.query(
    'insert into public.refresh_tokens (token, user_id) values ($1,$2) on conflict (token) do update set user_id = excluded.user_id',
    [token, userId]
  );
}

async function dbHasRefreshToken(token: string): Promise<boolean> {
  const pool = getDbPool();
  const res = await pool.query<{ token: string }>('select token from public.refresh_tokens where token = $1 limit 1', [token]);
  return !!res.rows[0];
}

async function dbDeleteRefreshToken(token: string): Promise<void> {
  const pool = getDbPool();
  await pool.query('delete from public.refresh_tokens where token = $1', [token]);
}

async function dbDeleteAllRefreshTokensForUser(userId: string): Promise<void> {
  const pool = getDbPool();
  await pool.query('delete from public.refresh_tokens where user_id = $1', [userId]);
}

async function dbUpdateUserPasswordHash(userId: string, passwordHash: string): Promise<void> {
  const pool = getDbPool();
  await pool.query('update public.users set password_hash = $1 where id = $2', [passwordHash, userId]);
}

// ── Organisation DB helpers ──────────────────────────────────────

async function dbInsertOrganisation(org: Organisation): Promise<void> {
  const pool = getDbPool();
  await pool.query(
    'insert into public.organisations (id, name, created_by_user_id, employee_count, region, industry, created_at, updated_at) values ($1,$2,$3,$4,$5,$6,$7,$8)',
    [org.id, org.name, org.createdByUserId, org.employeeCount ?? null, org.region ?? null, org.industry ?? null, org.createdAt, org.updatedAt]
  );
}

async function dbGetOrganisationById(id: string): Promise<Organisation | null> {
  const pool = getDbPool();
  const res = await pool.query<{
    id: string; name: string; created_by_user_id: string; employee_count: string | null;
    region: string | null; industry: string | null; created_at: string; updated_at: string;
  }>('select id, name, created_by_user_id, employee_count, region, industry, created_at, updated_at from public.organisations where id = $1 limit 1', [id]);
  const row = res.rows[0];
  if (!row) return null;
  return {
    id: row.id, name: row.name, createdByUserId: row.created_by_user_id,
    employeeCount: row.employee_count ?? undefined, region: row.region ?? undefined,
    industry: row.industry ?? undefined,
    createdAt: new Date(row.created_at).toISOString(), updatedAt: new Date(row.updated_at).toISOString(),
  };
}

// ── Keypass DB helpers ──────────────────────────────────────────

type DbKeypassRow = {
  code: string; organisation_id: string; status: string; created_at: string;
  expires_at: string; used_at: string | null; used_by_user_id: string | null;
};

function rowToKeypass(row: DbKeypassRow): Keypass {
  return {
    code: row.code, organisationId: row.organisation_id, status: row.status as KeypassStatus,
    createdAt: new Date(row.created_at).toISOString(), expiresAt: new Date(row.expires_at).toISOString(),
    usedAt: row.used_at ? new Date(row.used_at).toISOString() : undefined,
  };
}

async function dbInsertKeypass(kp: Keypass): Promise<void> {
  const pool = getDbPool();
  await pool.query(
    'insert into public.keypasses (code, organisation_id, status, created_at, expires_at, used_at) values ($1,$2,$3,$4,$5,$6)',
    [kp.code, kp.organisationId, kp.status, kp.createdAt, kp.expiresAt, kp.usedAt ?? null]
  );
}

async function dbGetKeypassByCode(code: string): Promise<Keypass | null> {
  const pool = getDbPool();
  const res = await pool.query<DbKeypassRow>(
    'select code, organisation_id, status, created_at, expires_at, used_at, used_by_user_id from public.keypasses where code = $1 limit 1',
    [code]
  );
  const row = res.rows[0];
  if (!row) return null;
  return rowToKeypass(row);
}

async function dbUpdateKeypassStatus(code: string, status: KeypassStatus, usedAt?: string, usedByUserId?: string): Promise<void> {
  const pool = getDbPool();
  await pool.query(
    'update public.keypasses set status = $1, used_at = $2, used_by_user_id = $3 where code = $4',
    [status, usedAt ?? null, usedByUserId ?? null, code]
  );
}

async function dbListKeypassesByOrganisation(orgId: string): Promise<Keypass[]> {
  const pool = getDbPool();
  const res = await pool.query<DbKeypassRow>(
    'select code, organisation_id, status, created_at, expires_at, used_at, used_by_user_id from public.keypasses where organisation_id = $1 order by created_at desc',
    [orgId]
  );
  return res.rows.map(rowToKeypass);
}

// ── Purchase DB helpers ─────────────────────────────────────────

async function dbInsertPurchase(p: Purchase): Promise<void> {
  const pool = getDbPool();
  await pool.query(
    'insert into public.purchases (id, organisation_id, user_id, package_id, status, payment_intent_id, client_secret, amount_cents, currency, created_at, confirmed_at) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)',
    [p.id, p.organisationId, p.userId, p.packageId, p.status, p.paymentIntentId ?? null, p.clientSecret ?? null, p.amountCents, p.currency, p.createdAt, p.confirmedAt ?? null]
  );
}

async function dbGetPurchaseById(id: string): Promise<Purchase | null> {
  const pool = getDbPool();
  const res = await pool.query<{
    id: string; organisation_id: string; user_id: string; package_id: string; status: string;
    payment_intent_id: string | null; client_secret: string | null; amount_cents: number;
    currency: string; created_at: string; confirmed_at: string | null;
  }>('select id, organisation_id, user_id, package_id, status, payment_intent_id, client_secret, amount_cents, currency, created_at, confirmed_at from public.purchases where id = $1 limit 1', [id]);
  const row = res.rows[0];
  if (!row) return null;
  return {
    id: row.id, organisationId: row.organisation_id, userId: row.user_id,
    packageId: row.package_id, status: row.status,
    paymentIntentId: row.payment_intent_id ?? undefined, clientSecret: row.client_secret ?? undefined,
    amountCents: row.amount_cents, currency: row.currency,
    createdAt: new Date(row.created_at).toISOString(),
    confirmedAt: row.confirmed_at ? new Date(row.confirmed_at).toISOString() : undefined,
  };
}

async function dbUpdatePurchaseStatus(id: string, status: string, confirmedAt?: string): Promise<void> {
  const pool = getDbPool();
  await pool.query('update public.purchases set status = $1, confirmed_at = $2 where id = $3', [status, confirmedAt ?? null, id]);
}

async function dbListPurchasesByOrganisation(orgId: string): Promise<Purchase[]> {
  const pool = getDbPool();
  const res = await pool.query<{
    id: string; organisation_id: string; user_id: string; package_id: string; status: string;
    payment_intent_id: string | null; client_secret: string | null; amount_cents: number;
    currency: string; created_at: string; confirmed_at: string | null;
  }>('select id, organisation_id, user_id, package_id, status, payment_intent_id, client_secret, amount_cents, currency, created_at, confirmed_at from public.purchases where organisation_id = $1 order by created_at desc', [orgId]);
  return res.rows.map((row) => ({
    id: row.id, organisationId: row.organisation_id, userId: row.user_id,
    packageId: row.package_id, status: row.status,
    paymentIntentId: row.payment_intent_id ?? undefined, clientSecret: row.client_secret ?? undefined,
    amountCents: row.amount_cents, currency: row.currency,
    createdAt: new Date(row.created_at).toISOString(),
    confirmedAt: row.confirmed_at ? new Date(row.confirmed_at).toISOString() : undefined,
  }));
}

// ── Package DB helpers ──────────────────────────────────────────

async function dbListPackages(): Promise<Package[]> {
  const pool = getDbPool();
  const res = await pool.query<{
    id: string; name: string; description: string | null; price_cents: number; currency: string;
    keypass_allowance: number; features: string[]; is_active: boolean; sort_order: number;
  }>('select id, name, description, price_cents, currency, keypass_allowance, features, is_active, sort_order from public.packages where is_active = true order by sort_order');
  return res.rows.map((row) => ({
    id: row.id, name: row.name, description: row.description ?? undefined,
    priceCents: row.price_cents, currency: row.currency,
    keypassAllowance: row.keypass_allowance, features: row.features ?? [],
    isActive: row.is_active, sortOrder: row.sort_order,
  }));
}

async function dbGetPackageById(id: string): Promise<Package | null> {
  const pool = getDbPool();
  const res = await pool.query<{
    id: string; name: string; description: string | null; price_cents: number; currency: string;
    keypass_allowance: number; features: string[]; is_active: boolean; sort_order: number;
  }>('select id, name, description, price_cents, currency, keypass_allowance, features, is_active, sort_order from public.packages where id = $1 limit 1', [id]);
  const row = res.rows[0];
  if (!row) return null;
  return {
    id: row.id, name: row.name, description: row.description ?? undefined,
    priceCents: row.price_cents, currency: row.currency,
    keypassAllowance: row.keypass_allowance, features: row.features ?? [],
    isActive: row.is_active, sortOrder: row.sort_order,
  };
}

// ── Password reset via Redis ────────────────────────────────────

const PASSWORD_RESET_PREFIX = 'pwreset:';
const PASSWORD_RESET_TTL_SECONDS = 3600; // 1 hour

async function setPasswordResetToken(token: string, userId: string): Promise<void> {
  const redis = getRedis();
  if (redis) {
    await redis.set(`${PASSWORD_RESET_PREFIX}${token}`, userId, { ex: PASSWORD_RESET_TTL_SECONDS });
  } else {
    passwordResetTokens.set(token, { userId, expiresAt: Date.now() + PASSWORD_RESET_TTL_SECONDS * 1000 });
  }
}

async function getPasswordResetUserId(token: string): Promise<string | null> {
  const redis = getRedis();
  if (redis) {
    const userId = await redis.get<string>(`${PASSWORD_RESET_PREFIX}${token}`);
    return userId ?? null;
  }
  const entry = passwordResetTokens.get(token);
  if (!entry || entry.expiresAt < Date.now()) {
    passwordResetTokens.delete(token);
    return null;
  }
  return entry.userId;
}

async function deletePasswordResetToken(token: string): Promise<void> {
  const redis = getRedis();
  if (redis) {
    await redis.del(`${PASSWORD_RESET_PREFIX}${token}`);
  } else {
    passwordResetTokens.delete(token);
  }
}

// ── Audit log helper ────────────────────────────────────────────

async function auditLog(event: {
  eventType: string;
  actorId?: string;
  actorEmail?: string;
  organisationId?: string;
  resourceType?: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  if (!hasDatabase()) return; // skip in test / no-db mode
  try {
    const pool = getDbPool();
    await pool.query(
      'insert into public.audit_logs (event_type, actor_id, actor_email, organisation_id, resource_type, resource_id, details, ip_address, user_agent) values ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
      [
        event.eventType,
        event.actorId ?? null, event.actorEmail ?? null, event.organisationId ?? null,
        event.resourceType ?? null, event.resourceId ?? null,
        event.details ?? {}, event.ipAddress ?? null, event.userAgent ?? null,
      ]
    );
  } catch {
    // Audit log failures must not break the request
  }
}

function publicUser(user: User) {
  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    organisationId: user.organisationId,
    createdAt: user.createdAt,
  };
}

// ── Global error handler ────────────────────────────────────────
app.onError((err, c) => {
  const requestId = (c.get('requestId' as never) as string) ?? 'unknown';
  console.error(JSON.stringify({
    ts: new Date().toISOString(),
    level: 'error',
    rid: requestId,
    method: c.req.method,
    path: c.req.path,
    error: err.message,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
  }));
  return c.json(
    { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
    500
  );
});

// ── 404 handler ─────────────────────────────────────────────────
app.notFound((c) => {
  return c.json(
    { success: false, error: { code: 'NOT_FOUND', message: `Route ${c.req.method} ${c.req.path} not found` } },
    404
  );
});

// ── Health check (verifies DB + Redis connectivity) ─────────────
app.get('/health', async (c) => {
  const checks: Record<string, string> = {};
  let healthy = true;

  // DB check
  if (hasDatabase()) {
    try {
      const pool = getDbPool();
      const result = await pool.query('select 1 as ok');
      checks.database = result.rows?.[0]?.ok === 1 ? 'ok' : 'error';
    } catch {
      checks.database = 'error';
      healthy = false;
    }
  } else {
    checks.database = 'not_configured';
  }

  // Redis check
  const redis = getRedis();
  if (redis) {
    try {
      await redis.ping();
      checks.redis = 'ok';
    } catch {
      checks.redis = 'error';
      healthy = false;
    }
  } else {
    checks.redis = 'not_configured';
  }

  const status = healthy ? 'ok' : 'degraded';
  return c.json({ status, checks, uptime: Math.floor(process.uptime()) }, healthy ? 200 : 503);
});

const api = app.basePath('/api/v1');

// ── Security helpers (defined before middleware) ────────────────
const MAX_BODY_BYTES = Number(process.env.MAX_BODY_BYTES ?? 1_048_576); // 1 MB default
const CSRF_SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function stripProtoPollution(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(stripProtoPollution);

  const cleaned: Record<string, unknown> = {};
  for (const key of Object.keys(obj as Record<string, unknown>)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
    cleaned[key] = stripProtoPollution((obj as Record<string, unknown>)[key]);
  }
  return cleaned;
}

function sanitizeString(value: string): string {
  return value
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, ''); // strip inline event handlers
}

function sanitizeObject(obj: unknown): unknown {
  if (typeof obj === 'string') return sanitizeString(obj);
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeObject);

  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
    result[key] = sanitizeObject(val);
  }
  return result;
}

// ── Request body size limit ──────────────────────────────────────
api.use('*', async (c, next) => {
  const contentLength = c.req.header('content-length');
  if (contentLength && Number(contentLength) > MAX_BODY_BYTES) {
    return jsonError(c, 413, 'PAYLOAD_TOO_LARGE', `Request body exceeds ${MAX_BODY_BYTES} bytes`);
  }
  return next();
});

// ── JSON sanitisation (proto pollution + XSS) ────────────────────
api.use('*', async (c, next) => {
  const ct = c.req.header('content-type') ?? '';
  if (ct.includes('application/json') && !CSRF_SAFE_METHODS.has(c.req.method)) {
    const originalJson = c.req.json.bind(c.req);
    (c.req as unknown as Record<string, unknown>).json = async () => {
      const body = await originalJson();
      return sanitizeObject(stripProtoPollution(body));
    };
  }
  return next();
});

// ── CSRF protection (Origin / Referer validation) ───────────────
// JWT Bearer tokens are inherently CSRF-safe, but we add Origin validation
// as defence-in-depth for any future cookie-based auth or browser clients.

api.use('*', async (c, next) => {
  if (CSRF_SAFE_METHODS.has(c.req.method)) return next();

  // Non-browser clients (mobile apps, curl) typically omit Origin
  const origin = c.req.header('origin');
  const referer = c.req.header('referer');
  if (!origin && !referer) return next(); // allow non-browser clients

  // In production, validate Origin/Referer against allowed origins
  if (process.env.NODE_ENV === 'production' && allowedOrigins.length > 0) {
    const requestOrigin = origin ?? (referer ? new URL(referer).origin : null);
    if (requestOrigin && !allowedOrigins.includes(requestOrigin)) {
      return jsonError(c, 403, 'CSRF_REJECTED', 'Origin not allowed');
    }
  }

  return next();
});

// ── Global API rate limit (per IP) ──────────────────────────────
const GLOBAL_RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000);
const GLOBAL_RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX ?? 100);

api.use('*', async (c, next) => {
  const limited = await rateLimit('global', { windowMs: GLOBAL_RATE_LIMIT_WINDOW_MS, max: GLOBAL_RATE_LIMIT_MAX })(c);
  if (limited instanceof Response) return limited;
  return next();
});

api.post('/auth/signup', async (c) => {
  const limited = await rateLimit('auth:signup', { windowMs: 15 * 60 * 1000, max: 10 })(c);
  if (limited instanceof Response) return limited;

  const parsed = signupSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return jsonError(c, 400, 'VALIDATION_ERROR', 'Invalid signup payload');

  const { email, password, name } = parsed.data;
  const emailLc = email.toLowerCase();
  const existing = hasDatabase() ? await dbGetUserByEmail(emailLc) : usersByEmail.get(emailLc);
  if (existing) return jsonError(c, 409, 'EMAIL_EXISTS', 'Email already registered');

  const passwordHash = await bcrypt.hash(password, 12);
  const now = new Date().toISOString();
  const user: User = {
    id: crypto.randomUUID(),
    email: emailLc,
    name,
    passwordHash,
    role: 'employer',
    organisationId: crypto.randomUUID(),
    createdAt: now,
  };

  const orgName = parsed.data.organisationName ?? 'Organisation';

  if (hasDatabase()) {
    await dbInsertUser(user);
    const org: Organisation = {
      id: user.organisationId, name: orgName, createdByUserId: user.id,
      createdAt: now, updatedAt: now,
    };
    await dbInsertOrganisation(org);
  } else {
    usersByEmail.set(user.email, user);
    organisationsById.set(user.organisationId, {
      id: user.organisationId, name: orgName, createdByUserId: user.id,
      createdAt: now, updatedAt: now,
    });
  }

  // Create workshop profile and role if database is available
  let workshopProfile = null;
  const workshopRoles: string[] = [];
  if (hasDatabase()) {
    const fullName = parsed.data.name;
    const sector = parsed.data.sector ?? 'private';
    const jobTitle = parsed.data.jobTitle ?? null;

    const profileRes = await getDbPool().query(
      `INSERT INTO workshop_profiles (user_id, full_name, organization_name, sector, job_title)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id) DO NOTHING
       RETURNING *`,
      [user.id, fullName, orgName, sector, jobTitle]
    );
    workshopProfile = profileRes.rows[0] ?? null;

    const role = parsed.data.workshopRole ?? 'participant';
    await getDbPool().query(
      'INSERT INTO workshop_roles (user_id, role) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [user.id, role]
    );
    workshopRoles.push(role);
  }

  const { accessToken, refreshToken } = issueTokens(user);
  if (hasDatabase()) {
    await dbUpsertRefreshToken(refreshToken, user.id);
  }

  await auditLog({
    eventType: 'auth.signup', actorId: user.id, actorEmail: user.email,
    organisationId: user.organisationId, resourceType: 'user', resourceId: user.id,
    ipAddress: getClientIp(c),
  });

  return c.json({
    success: true,
    data: {
      user: publicUser(user),
      organisation: { organisationId: user.organisationId, name: orgName },
      accessToken,
      refreshToken,
      profile: workshopProfile,
      workshopRoles,
    },
  });
});

api.post('/auth/login', async (c) => {
  const limited = await rateLimit('auth:login', { windowMs: 15 * 60 * 1000, max: 20 })(c);
  if (limited instanceof Response) return limited;

  const parsed = loginSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return jsonError(c, 400, 'VALIDATION_ERROR', 'Invalid login payload');

  const { email, password } = parsed.data;
  const emailLc = email.toLowerCase();

  // Account lockout check
  const lockout = await checkAccountLockout(emailLc);
  if (lockout.locked) {
    await auditLog({
      eventType: 'auth.lockout', actorEmail: emailLc,
      details: { reason: 'Too many failed login attempts' }, ipAddress: getClientIp(c),
    });
    return jsonError(c, 429, 'ACCOUNT_LOCKED', 'Account temporarily locked due to too many failed attempts. Try again in 15 minutes.');
  }

  const user = hasDatabase() ? await dbGetUserByEmail(emailLc) : usersByEmail.get(emailLc);
  if (!user) {
    await recordFailedLogin(emailLc);
    return jsonError(c, 401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    await recordFailedLogin(emailLc);
    await auditLog({
      eventType: 'auth.failed_login', actorEmail: emailLc,
      details: { remaining: lockout.remaining - 1 }, ipAddress: getClientIp(c),
    });
    return jsonError(c, 401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  // Successful login - clear lockout counter
  await clearFailedLogins(emailLc);

  const { accessToken, refreshToken } = issueTokens(user);
  if (hasDatabase()) {
    await dbUpsertRefreshToken(refreshToken, user.id);
  }

  let orgName = 'Organisation';
  if (hasDatabase()) {
    const org = await dbGetOrganisationById(user.organisationId);
    if (org) orgName = org.name;
  } else {
    const org = organisationsById.get(user.organisationId);
    if (org) orgName = org.name;
  }

  await auditLog({
    eventType: 'auth.login', actorId: user.id, actorEmail: user.email,
    organisationId: user.organisationId, resourceType: 'user', resourceId: user.id,
    ipAddress: getClientIp(c),
  });

  return c.json({
    success: true,
    data: {
      user: publicUser(user),
      organisation: { organisationId: user.organisationId, name: orgName },
      accessToken,
      refreshToken,
    },
  });
});

api.get('/auth/me', async (c) => {
  const auth = requireAuth(c);
  if (auth instanceof Response) return auth;

  if (!hasDatabase()) {
    const user = usersByEmail.get(auth.email.toLowerCase());
    if (!user) return jsonError(c, 401, 'UNAUTHORIZED', 'User not found');
    return c.json({ success: true, data: { ...publicUser(user), profile: null, workshopRoles: [] } });
  }

  const user = await dbGetUserByEmail(auth.email.toLowerCase());
  if (!user) return jsonError(c, 401, 'UNAUTHORIZED', 'User not found');

  const pool = getDbPool();
  const [profileRes, rolesRes] = await Promise.all([
    pool.query('SELECT * FROM workshop_profiles WHERE user_id = $1 LIMIT 1', [user.id]),
    pool.query('SELECT role FROM workshop_roles WHERE user_id = $1', [user.id]),
  ]);

  return c.json({
    success: true,
    data: {
      ...publicUser(user),
      profile: profileRes.rows[0] ?? null,
      workshopRoles: rolesRes.rows.map((r: { role: string }) => r.role),
    },
  });
});

api.post('/uploads/presign', async (c) => {
  const auth = requireAuth(c);
  if (auth instanceof Response) return auth;

  const s3 = requireS3(c);
  if (s3 instanceof Response) return s3;

  const parsed = s3PresignUploadSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return jsonError(c, 400, 'VALIDATION_ERROR', 'Invalid upload payload');

  const { filename, contentType, sizeBytes } = parsed.data;

  if (!Number.isFinite(s3UrlExpiresSeconds) || s3UrlExpiresSeconds <= 0 || s3UrlExpiresSeconds > 3600) {
    return jsonError(c, 500, 'S3_CONFIG_ERROR', 'Invalid S3_URL_EXPIRES_SECONDS');
  }

  if (!Number.isFinite(s3MaxUploadBytes) || s3MaxUploadBytes <= 0) {
    return jsonError(c, 500, 'S3_CONFIG_ERROR', 'Invalid S3_MAX_UPLOAD_BYTES');
  }

  if (sizeBytes > s3MaxUploadBytes) {
    return jsonError(c, 413, 'PAYLOAD_TOO_LARGE', 'File too large');
  }

  if (s3AllowedContentTypes.length > 0 && !s3AllowedContentTypes.includes(contentType)) {
    return jsonError(c, 415, 'UNSUPPORTED_MEDIA_TYPE', 'Unsupported content type');
  }

  const key = s3KeyForUpload(auth, filename);
  const cmd = new PutObjectCommand({
    Bucket: s3Bucket,
    Key: key,
    ContentType: contentType,
    ContentLength: sizeBytes,
  });

  const uploadUrl = await getSignedUrl(s3, cmd, { expiresIn: s3UrlExpiresSeconds });
  return c.json({
    success: true,
    data: {
      bucket: s3Bucket,
      region: s3Region,
      key,
      uploadUrl,
      expiresIn: s3UrlExpiresSeconds,
    },
  });
});

api.post('/uploads/promote', async (c) => {
  const auth = requireAuth(c);
  if (auth instanceof Response) return auth;

  const s3 = requireS3(c);
  if (s3 instanceof Response) return s3;

  const parsed = s3PromoteUploadSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return jsonError(c, 400, 'VALIDATION_ERROR', 'Invalid promote payload');

  const { sourceKey, filename } = parsed.data;

  const allowedSourcePrefix = `${s3UploadPrefix}/${auth.organisationId}/`;
  if (!sourceKey.startsWith(allowedSourcePrefix)) {
    return jsonError(c, 403, 'FORBIDDEN', 'Not allowed to promote this object');
  }

  const inferredFilename = sourceKey.split('/').pop() ?? 'file';
  const destKey = s3KeyForDownload(auth, filename ?? inferredFilename);

  const copySource = encodeURIComponent(`${s3Bucket}/${sourceKey}`);
  await s3.send(
    new CopyObjectCommand({
      Bucket: s3Bucket,
      Key: destKey,
      CopySource: copySource,
    })
  );

  return c.json({
    success: true,
    data: {
      bucket: s3Bucket,
      region: s3Region,
      sourceKey,
      key: destKey,
    },
  });
});

api.post('/downloads/presign', async (c) => {
  const auth = requireAuth(c);
  if (auth instanceof Response) return auth;

  const s3 = requireS3(c);
  if (s3 instanceof Response) return s3;

  const parsed = s3PresignDownloadSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return jsonError(c, 400, 'VALIDATION_ERROR', 'Invalid download payload');

  const { key } = parsed.data;
  const allowedPrefix = `${s3DownloadPrefix}/${auth.organisationId}/`;
  if (!key.startsWith(allowedPrefix)) {
    return jsonError(c, 403, 'FORBIDDEN', 'Not allowed to access this object');
  }

  const cmd = new GetObjectCommand({ Bucket: s3Bucket, Key: key });
  const downloadUrl = await getSignedUrl(s3, cmd, { expiresIn: s3UrlExpiresSeconds });
  return c.json({
    success: true,
    data: {
      bucket: s3Bucket,
      region: s3Region,
      key,
      downloadUrl,
      expiresIn: s3UrlExpiresSeconds,
    },
  });
});

api.post('/auth/logout', async (c) => {
  const parsed = refreshSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return jsonError(c, 400, 'VALIDATION_ERROR', 'Invalid logout payload');

  if (parsed.data.refreshToken) {
    if (hasDatabase()) {
      await dbDeleteRefreshToken(parsed.data.refreshToken);
    } else {
      refreshTokenAllowlist.delete(parsed.data.refreshToken);
    }
  }
  return c.json({ success: true });
});

api.get('/debug/db/ping', async (c) => {
  const auth = requireAuth(c);
  if (auth instanceof Response) return auth;

  try {
    const pool = getDbPool();
    const result = await pool.query('select 1 as ok');
    return c.json({ success: true, data: { ok: result.rows?.[0]?.ok === 1 } });
  } catch (error: any) {
    return jsonError(c, 500, 'DB_UNAVAILABLE', error?.message || 'Database unavailable');
  }
});

api.post('/auth/refresh', async (c) => {
  const parsed = refreshSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success || !parsed.data.refreshToken) {
    return jsonError(c, 400, 'VALIDATION_ERROR', 'Invalid refresh payload');
  }

  const { refreshToken } = parsed.data;
  if (hasDatabase()) {
    const exists = await dbHasRefreshToken(refreshToken);
    if (!exists) return jsonError(c, 401, 'REFRESH_REVOKED', 'Refresh token is revoked');
  } else {
    if (!refreshTokenAllowlist.has(refreshToken)) {
      return jsonError(c, 401, 'REFRESH_REVOKED', 'Refresh token is revoked');
    }
  }

  try {
    const payload = jwt.verify(refreshToken, refreshSecret) as jwt.JwtPayload;
    if (payload.type !== 'refresh' || typeof payload.sub !== 'string') {
      return jsonError(c, 401, 'INVALID_REFRESH', 'Invalid refresh token');
    }

    const user = hasDatabase() ? await dbGetUserById(payload.sub) : Array.from(usersByEmail.values()).find((u) => u.id === payload.sub) ?? null;
    if (!user) return jsonError(c, 401, 'INVALID_REFRESH', 'Invalid refresh token');

    if (hasDatabase()) {
      await dbDeleteRefreshToken(refreshToken);
    } else {
      refreshTokenAllowlist.delete(refreshToken);
    }
    const tokens = issueTokens(user);
    if (hasDatabase()) {
      await dbUpsertRefreshToken(tokens.refreshToken, user.id);
    }

    return c.json({
      success: true,
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });
  } catch {
    if (hasDatabase()) {
      await dbDeleteRefreshToken(refreshToken).catch(() => undefined);
    } else {
      refreshTokenAllowlist.delete(refreshToken);
    }
    return jsonError(c, 401, 'INVALID_REFRESH', 'Invalid refresh token');
  }
});

api.post('/auth/forgot-password', async (c) => {
  const limited = await rateLimit('auth:forgot', { windowMs: 15 * 60 * 1000, max: 5 })(c);
  if (limited instanceof Response) return limited;

  const parsed = forgotPasswordSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return jsonError(c, 400, 'VALIDATION_ERROR', 'Invalid forgot-password payload');

  const emailLc = parsed.data.email.toLowerCase();
  const user = hasDatabase() ? await dbGetUserByEmail(emailLc) : usersByEmail.get(emailLc);
  if (user) {
    const token = crypto.randomUUID();
    await setPasswordResetToken(token, user.id);

    await auditLog({
      eventType: 'auth.forgot_password', actorEmail: emailLc,
      resourceType: 'user', resourceId: user.id, ipAddress: getClientIp(c),
    });

    return c.json({ success: true, data: { resetToken: token } });
  }

  // Return success even if email not found (prevent enumeration)
  return c.json({ success: true });
});

api.post('/auth/reset-password', async (c) => {
  const limited = await rateLimit('auth:reset', { windowMs: 15 * 60 * 1000, max: 5 })(c);
  if (limited instanceof Response) return limited;

  const parsed = resetPasswordSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return jsonError(c, 400, 'VALIDATION_ERROR', 'Invalid reset-password payload');

  const userId = await getPasswordResetUserId(parsed.data.token);
  if (!userId) {
    return jsonError(c, 400, 'INVALID_TOKEN', 'Invalid or expired reset token');
  }

  const user = hasDatabase() ? await dbGetUserById(userId) : Array.from(usersByEmail.values()).find((u) => u.id === userId) ?? null;
  if (!user) {
    await deletePasswordResetToken(parsed.data.token);
    return jsonError(c, 400, 'INVALID_TOKEN', 'Invalid or expired reset token');
  }

  const newHash = await bcrypt.hash(parsed.data.newPassword, 12);
  if (hasDatabase()) {
    await dbUpdateUserPasswordHash(user.id, newHash);
    await dbDeleteAllRefreshTokensForUser(user.id);
  } else {
    user.passwordHash = newHash;
    for (const token of Array.from(refreshTokenAllowlist.values())) {
      try {
        const payload = jwt.decode(token) as jwt.JwtPayload | null;
        if (payload && payload.sub === user.id) refreshTokenAllowlist.delete(token);
      } catch {
        refreshTokenAllowlist.delete(token);
      }
    }
  }
  await deletePasswordResetToken(parsed.data.token);

  await auditLog({
    eventType: 'auth.reset_password', actorId: user.id, actorEmail: user.email,
    resourceType: 'user', resourceId: user.id, ipAddress: getClientIp(c),
  });

  return c.json({ success: true });
});

api.get('/assessments', (c) => {
  const auth = requireAuth(c);
  if (auth instanceof Response) return auth;

  if (!hasDatabase()) {
    const items = Array.from(assessmentsById.values()).filter((a) => a.organisationId === auth.organisationId);
    return c.json({ success: true, data: items });
  }

  return (async () => {
    const items = await dbListAssessmentsByOrganisation(auth.organisationId);
    return c.json({ success: true, data: items });
  })();
});

api.post('/assessments', async (c) => {
  const auth = requireAuth(c);
  if (auth instanceof Response) return auth;

  const parsed = assessmentCreateSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return jsonError(c, 400, 'VALIDATION_ERROR', 'Invalid assessment payload');

  const now = new Date().toISOString();
  const assessment: Assessment = {
    id: crypto.randomUUID(),
    organisationId: auth.organisationId,
    createdByUserId: auth.userId,
    title: parsed.data.title,
    status: 'draft',
    answers: parsed.data.answers ?? {},
    createdAt: now,
    updatedAt: now,
  };

  if (hasDatabase()) {
    await dbInsertAssessment(assessment);
  } else {
    assessmentsById.set(assessment.id, assessment);
  }

  return c.json({ success: true, data: assessment }, 201);
});

api.get('/assessments/:id', (c) => {
  const auth = requireAuth(c);
  if (auth instanceof Response) return auth;

  const id = requireUUIDParam(c, 'id');
  if (id instanceof Response) return id;

  if (!hasDatabase()) {
    const assessment = assessmentsById.get(id);
    if (!assessment || assessment.organisationId !== auth.organisationId) {
      return jsonError(c, 404, 'NOT_FOUND', 'Assessment not found');
    }
    return c.json({ success: true, data: assessment });
  }

  return (async () => {
    const assessment = await dbGetAssessmentById(id);
    if (!assessment || assessment.organisationId !== auth.organisationId) {
      return jsonError(c, 404, 'NOT_FOUND', 'Assessment not found');
    }
    return c.json({ success: true, data: assessment });
  })();
});

api.patch('/assessments/:id', async (c) => {
  const auth = requireAuth(c);
  if (auth instanceof Response) return auth;

  const id = requireUUIDParam(c, 'id');
  if (id instanceof Response) return id;
  const parsed = assessmentPatchSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return jsonError(c, 400, 'VALIDATION_ERROR', 'Invalid assessment patch payload');

  if (!hasDatabase()) {
    const assessment = assessmentsById.get(id);
    if (!assessment || assessment.organisationId !== auth.organisationId) {
      return jsonError(c, 404, 'NOT_FOUND', 'Assessment not found');
    }

    const now = new Date().toISOString();
    const updated: Assessment = {
      ...assessment,
      title: parsed.data.title ?? assessment.title,
      status: parsed.data.status ?? assessment.status,
      answers: parsed.data.answers ?? assessment.answers,
      updatedAt: now,
    };

    assessmentsById.set(id, updated);
    return c.json({ success: true, data: updated });
  }

  const existing = await dbGetAssessmentById(id);
  if (!existing || existing.organisationId !== auth.organisationId) {
    return jsonError(c, 404, 'NOT_FOUND', 'Assessment not found');
  }

  const now = new Date().toISOString();
  const updated = await dbUpdateAssessment(id, {
    title: parsed.data.title ?? existing.title,
    status: parsed.data.status ?? existing.status,
    answers: parsed.data.answers ?? existing.answers,
    updatedAt: now,
  });

  if (!updated) return jsonError(c, 404, 'NOT_FOUND', 'Assessment not found');
  return c.json({ success: true, data: updated });
});

api.post('/assessments/:id/submit', (c) => {
  const auth = requireAuth(c);
  if (auth instanceof Response) return auth;

  const id = requireUUIDParam(c, 'id');
  if (id instanceof Response) return id;

  if (!hasDatabase()) {
    const assessment = assessmentsById.get(id);
    if (!assessment || assessment.organisationId !== auth.organisationId) {
      return jsonError(c, 404, 'NOT_FOUND', 'Assessment not found');
    }

    const now = new Date().toISOString();
    const updated: Assessment = {
      ...assessment,
      status: 'submitted',
      submittedAt: now,
      updatedAt: now,
    };
    assessmentsById.set(id, updated);
    return c.json({ success: true, data: updated });
  }

  return (async () => {
    const existing = await dbGetAssessmentById(id);
    if (!existing || existing.organisationId !== auth.organisationId) {
      return jsonError(c, 404, 'NOT_FOUND', 'Assessment not found');
    }

    const now = new Date().toISOString();
    const updated = await dbUpdateAssessment(id, {
      status: 'submitted',
      submittedAt: now,
      updatedAt: now,
    });

    if (!updated) return jsonError(c, 404, 'NOT_FOUND', 'Assessment not found');
    return c.json({ success: true, data: updated });
  })();
});

async function createKeypasses(orgId: string, quantity: number, expiresInDays: number): Promise<{ codes: string[]; expiresAt: string }> {
  const now = Date.now();
  const expiresAt = new Date(now + expiresInDays * 24 * 60 * 60 * 1000).toISOString();
  const createdAt = new Date(now).toISOString();

  const codes: string[] = [];
  for (let i = 0; i < quantity; i++) {
    let code = generateKeypassCode();
    // Ensure uniqueness (check both in-memory and DB)
    if (hasDatabase()) {
      while (await dbGetKeypassByCode(code)) code = generateKeypassCode();
    } else {
      while (keypassesByCode.has(code)) code = generateKeypassCode();
    }

    const kp: Keypass = { code, organisationId: orgId, status: 'available', createdAt, expiresAt };

    if (hasDatabase()) {
      await dbInsertKeypass(kp);
    } else {
      keypassesByCode.set(code, kp);
    }

    codes.push(code);
  }

  return { codes, expiresAt };
}

api.post('/keypasses/generate', async (c) => {
  const auth = requireAuth(c);
  if (auth instanceof Response) return auth;

  const parsed = keypassGenerateSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return jsonError(c, 400, 'VALIDATION_ERROR', 'Invalid keypass generate payload');

  const { codes, expiresAt } = await createKeypasses(auth.organisationId, parsed.data.quantity, parsed.data.expiresInDays);

  await auditLog({
    eventType: 'keypass.generate', actorId: auth.userId, actorEmail: auth.email,
    organisationId: auth.organisationId, resourceType: 'keypass',
    details: { quantity: parsed.data.quantity }, ipAddress: getClientIp(c),
  });

  return c.json({ success: true, data: { organisationId: auth.organisationId, expiresAt, codes } });
});

api.post('/keypasses/allocate', async (c) => {
  const auth = requireAuth(c);
  if (auth instanceof Response) return auth;

  const parsed = keypassGenerateSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return jsonError(c, 400, 'VALIDATION_ERROR', 'Invalid keypass allocate payload');

  const { codes, expiresAt } = await createKeypasses(auth.organisationId, parsed.data.quantity, parsed.data.expiresInDays);

  await auditLog({
    eventType: 'keypass.allocate', actorId: auth.userId, actorEmail: auth.email,
    organisationId: auth.organisationId, resourceType: 'keypass',
    details: { quantity: parsed.data.quantity }, ipAddress: getClientIp(c),
  });

  return c.json({ success: true, data: { organisationId: auth.organisationId, expiresAt, codes } });
});

api.post('/keypasses/use', async (c) => {
  const limited = await rateLimit('keypass:use', { windowMs: 60 * 1000, max: 3 })(c);
  if (limited instanceof Response) return limited;

  const parsed = keypassUseSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return jsonError(c, 400, 'VALIDATION_ERROR', 'Invalid keypass use payload');

  const code = parsed.data.code.toUpperCase();
  const kp = hasDatabase() ? await dbGetKeypassByCode(code) : keypassesByCode.get(code);
  if (!kp) return jsonError(c, 404, 'NOT_FOUND', 'Keypass not found');

  const now = new Date().toISOString();
  if (kp.status !== 'available') return jsonError(c, 400, 'NOT_AVAILABLE', 'Keypass is not available');
  if (new Date(kp.expiresAt).getTime() < Date.now()) {
    if (hasDatabase()) {
      await dbUpdateKeypassStatus(code, 'expired');
    } else {
      kp.status = 'expired';
    }
    return jsonError(c, 400, 'EXPIRED', 'Keypass is expired');
  }

  const email = (parsed.data.email ?? `employee+${kp.code.toLowerCase()}@example.com`).toLowerCase();
  const name = parsed.data.name ?? email.split('@')[0];

  let user: User | null | undefined;
  if (hasDatabase()) {
    user = await dbGetUserByEmail(email);
  } else {
    user = usersByEmail.get(email);
  }

  if (!user) {
    user = {
      id: crypto.randomUUID(),
      email,
      name,
      passwordHash: await bcrypt.hash(crypto.randomUUID(), 12),
      role: 'employee',
      organisationId: kp.organisationId,
      createdAt: now,
    };
    if (hasDatabase()) {
      await dbInsertUser(user);
    } else {
      usersByEmail.set(email, user);
    }
  }

  if (hasDatabase()) {
    await dbUpdateKeypassStatus(code, 'used', now, user.id);
  } else {
    kp.status = 'used';
    kp.usedAt = now;
  }

  const { accessToken, refreshToken } = issueTokens(user);
  if (hasDatabase()) {
    await dbUpsertRefreshToken(refreshToken, user.id);
  }

  let orgName = 'Organisation';
  if (hasDatabase()) {
    const org = await dbGetOrganisationById(user.organisationId);
    if (org) orgName = org.name;
  } else {
    const org = organisationsById.get(user.organisationId);
    if (org) orgName = org.name;
  }

  await auditLog({
    eventType: 'keypass.use', actorId: user.id, actorEmail: user.email,
    organisationId: user.organisationId, resourceType: 'keypass', resourceId: code,
    ipAddress: getClientIp(c),
  });

  return c.json({
    success: true,
    data: {
      user: publicUser(user),
      organisation: { organisationId: user.organisationId, name: orgName },
      accessToken,
      refreshToken,
      keypass: { code: kp.code, usedAt: now },
    },
  });
});

api.post('/keypasses/revoke', async (c) => {
  const auth = requireAuth(c);
  if (auth instanceof Response) return auth;

  const parsed = keypassValidateSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return jsonError(c, 400, 'VALIDATION_ERROR', 'Invalid keypass revoke payload');

  const code = parsed.data.code.toUpperCase();
  const kp = hasDatabase() ? await dbGetKeypassByCode(code) : keypassesByCode.get(code);
  if (!kp || kp.organisationId !== auth.organisationId) {
    return jsonError(c, 404, 'NOT_FOUND', 'Keypass not found');
  }

  if (hasDatabase()) {
    await dbUpdateKeypassStatus(code, 'revoked');
  } else {
    kp.status = 'revoked';
  }

  await auditLog({
    eventType: 'keypass.revoke', actorId: auth.userId, actorEmail: auth.email,
    organisationId: auth.organisationId, resourceType: 'keypass', resourceId: code,
    ipAddress: getClientIp(c),
  });

  return c.json({ success: true });
});

api.get('/keypasses/organisation/:orgId', async (c) => {
  const auth = requireAuth(c);
  if (auth instanceof Response) return auth;

  const orgId = c.req.param('orgId');
  if (orgId !== auth.organisationId) return jsonError(c, 403, 'FORBIDDEN', 'Forbidden');

  const items = hasDatabase()
    ? await dbListKeypassesByOrganisation(orgId)
    : Array.from(keypassesByCode.values()).filter((k) => k.organisationId === orgId);

  return c.json({ success: true, data: items });
});

api.get('/keypasses/organisation/:orgId/stats', async (c) => {
  const auth = requireAuth(c);
  if (auth instanceof Response) return auth;

  const orgId = c.req.param('orgId');
  if (orgId !== auth.organisationId) return jsonError(c, 403, 'FORBIDDEN', 'Forbidden');

  const items = hasDatabase()
    ? await dbListKeypassesByOrganisation(orgId)
    : Array.from(keypassesByCode.values()).filter((k) => k.organisationId === orgId);

  const stats = items.reduce<Record<KeypassStatus, number>>(
    (acc, k) => {
      acc[k.status] = (acc[k.status] ?? 0) + 1;
      return acc;
    },
    { available: 0, used: 0, revoked: 0, expired: 0 }
  );

  return c.json({ success: true, data: { organisationId: orgId, totals: items.length, byStatus: stats } });
});

api.post('/keypasses/validate', async (c) => {
  const limited = await rateLimit('keypass:validate', { windowMs: 60 * 1000, max: 3 })(c);
  if (limited instanceof Response) return limited;

  const parsed = keypassValidateSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return jsonError(c, 400, 'VALIDATION_ERROR', 'Invalid keypass validate payload');

  const code = parsed.data.code.toUpperCase();
  const kp = hasDatabase() ? await dbGetKeypassByCode(code) : keypassesByCode.get(code);
  if (!kp) return jsonError(c, 404, 'NOT_FOUND', 'Keypass not found');

  if (kp.status === 'revoked') return jsonError(c, 400, 'REVOKED', 'Keypass is revoked');
  if (kp.status === 'used') return jsonError(c, 400, 'USED', 'Keypass is already used');

  if (new Date(kp.expiresAt).getTime() < Date.now()) {
    if (hasDatabase()) {
      await dbUpdateKeypassStatus(code, 'expired');
    } else {
      kp.status = 'expired';
    }
    return jsonError(c, 400, 'EXPIRED', 'Keypass is expired');
  }

  return c.json({ success: true, data: { valid: true, organisationId: kp.organisationId, expiresAt: kp.expiresAt } });
});

api.post('/payments/create-intent', async (c) => {
  const auth = requireAuth(c);
  if (auth instanceof Response) return auth;

  const parsed = paymentCreateIntentSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return jsonError(c, 400, 'VALIDATION_ERROR', 'Invalid payment intent payload');

  const paymentIntentId = `pi_${crypto.randomUUID().replace(/-/g, '')}`;
  const clientSecret = `${paymentIntentId}_secret_${crypto.randomUUID().replace(/-/g, '')}`;

  return c.json({
    success: true,
    data: {
      paymentIntentId,
      clientSecret,
      currency: parsed.data.currency,
      packageId: parsed.data.packageId,
      organisationId: auth.organisationId,
    },
  });
});

// Hardcoded fallback for when packages table isn't available
const FALLBACK_PACKAGES: Package[] = [
  { id: 'pkg_basic', name: 'Basic', description: 'Self-service fraud risk assessment', priceCents: 0, currency: 'gbp', keypassAllowance: 1, features: ['Single assessment', 'Basic risk report', 'PDF export'], isActive: true, sortOrder: 1 },
  { id: 'pkg_training', name: 'Training', description: 'Assessment with staff training key-passes', priceCents: 4900, currency: 'gbp', keypassAllowance: 10, features: ['Everything in Basic', '10 employee key-passes', 'Training modules', 'Compliance certificate'], isActive: true, sortOrder: 2 },
  { id: 'pkg_full', name: 'Full', description: 'Complete fraud risk management suite', priceCents: 14900, currency: 'gbp', keypassAllowance: 50, features: ['Everything in Training', '50 employee key-passes', 'Priority support', 'Custom action plan', 'Annual review'], isActive: true, sortOrder: 3 },
];

api.get('/packages', async (c) => {
  if (hasDatabase()) {
    const packages = await dbListPackages();
    const data = packages.map((p) => ({
      id: p.id, name: p.name, description: p.description, price: p.priceCents,
      currency: p.currency, keypassAllowance: p.keypassAllowance, features: p.features,
    }));
    return c.json({ success: true, data });
  }

  return c.json({
    success: true,
    data: FALLBACK_PACKAGES.map((p) => ({
      id: p.id, name: p.name, description: p.description, price: p.priceCents,
      currency: p.currency, keypassAllowance: p.keypassAllowance, features: p.features,
    })),
  });
});

api.get('/packages/recommended', (c) => {
  return c.json({ success: true, data: { packageId: 'pkg_basic' } });
});

api.post('/purchases', async (c) => {
  const auth = requireAuth(c);
  if (auth instanceof Response) return auth;

  const parsed = purchasesCreateSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return jsonError(c, 400, 'VALIDATION_ERROR', 'Invalid purchase payload');

  // Look up the package to get price
  let amountCents = 0;
  let currency = 'gbp';
  if (hasDatabase()) {
    const pkg = await dbGetPackageById(parsed.data.packageId);
    if (pkg) { amountCents = pkg.priceCents; currency = pkg.currency; }
  } else {
    const pkg = FALLBACK_PACKAGES.find((p) => p.id === parsed.data.packageId);
    if (pkg) { amountCents = pkg.priceCents; currency = pkg.currency; }
  }

  const paymentIntentId = `pi_${crypto.randomUUID().replace(/-/g, '')}`;
  const clientSecret = `${paymentIntentId}_secret_${crypto.randomUUID().replace(/-/g, '')}`;
  const purchaseId = crypto.randomUUID();
  const now = new Date().toISOString();

  const purchase: Purchase = {
    id: purchaseId, organisationId: auth.organisationId, userId: auth.userId,
    packageId: parsed.data.packageId, status: 'requires_confirmation',
    paymentIntentId, clientSecret, amountCents, currency, createdAt: now,
  };

  if (hasDatabase()) {
    await dbInsertPurchase(purchase);
  } else {
    purchasesById.set(purchaseId, purchase);
  }

  await auditLog({
    eventType: 'purchase.created', actorId: auth.userId, actorEmail: auth.email,
    organisationId: auth.organisationId, resourceType: 'purchase', resourceId: purchaseId,
    details: { packageId: parsed.data.packageId, amountCents }, ipAddress: getClientIp(c),
  });

  return c.json({
    success: true,
    data: {
      purchaseId, packageId: parsed.data.packageId,
      organisationId: auth.organisationId,
      paymentIntentId, clientSecret, status: 'requires_confirmation',
    },
  });
});

api.post('/purchases/:id/confirm', async (c) => {
  const auth = requireAuth(c);
  if (auth instanceof Response) return auth;

  const parsed = purchasesConfirmSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return jsonError(c, 400, 'VALIDATION_ERROR', 'Invalid purchase confirmation payload');

  const purchaseId = c.req.param('id');
  const now = new Date().toISOString();

  if (hasDatabase()) {
    await dbUpdatePurchaseStatus(purchaseId, 'succeeded', now);
  } else {
    const existing = purchasesById.get(purchaseId);
    if (existing) { existing.status = 'succeeded'; existing.confirmedAt = now; }
  }

  await auditLog({
    eventType: 'purchase.confirmed', actorId: auth.userId, actorEmail: auth.email,
    organisationId: auth.organisationId, resourceType: 'purchase', resourceId: purchaseId,
    ipAddress: getClientIp(c),
  });

  return c.json({
    success: true,
    data: {
      purchaseId, organisationId: auth.organisationId,
      status: 'succeeded', paymentIntentId: parsed.data.paymentIntentId ?? null,
    },
  });
});

api.get('/purchases/:id', async (c) => {
  const auth = requireAuth(c);
  if (auth instanceof Response) return auth;

  const purchaseId = c.req.param('id');

  if (hasDatabase()) {
    const purchase = await dbGetPurchaseById(purchaseId);
    if (!purchase || purchase.organisationId !== auth.organisationId) {
      return jsonError(c, 404, 'NOT_FOUND', 'Purchase not found');
    }
    return c.json({ success: true, data: purchase });
  }

  const purchase = purchasesById.get(purchaseId);
  if (!purchase || purchase.organisationId !== auth.organisationId) {
    return jsonError(c, 404, 'NOT_FOUND', 'Purchase not found');
  }
  return c.json({ success: true, data: purchase });
});

api.get('/purchases/organisation/:orgId', async (c) => {
  const auth = requireAuth(c);
  if (auth instanceof Response) return auth;

  const orgId = c.req.param('orgId');
  if (orgId !== auth.organisationId) return jsonError(c, 403, 'FORBIDDEN', 'Forbidden');

  if (hasDatabase()) {
    const purchases = await dbListPurchasesByOrganisation(orgId);
    return c.json({ success: true, data: purchases });
  }

  const purchases = Array.from(purchasesById.values()).filter((p) => p.organisationId === orgId);
  return c.json({ success: true, data: purchases });
});

api.post('/webhooks/stripe', async (c) => {
  const parsed = stripeWebhookSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return jsonError(c, 400, 'VALIDATION_ERROR', 'Invalid stripe webhook payload');

  return c.json({ success: true, data: { received: true, type: parsed.data.type } });
});

api.get('/analytics/overview', async (c) => {
  const auth = requireAuth(c);
  if (auth instanceof Response) return auth;

  const orgAssessments = hasDatabase()
    ? await dbListAssessmentsByOrganisation(auth.organisationId)
    : Array.from(assessmentsById.values()).filter((a) => a.organisationId === auth.organisationId);

  const byStatus = orgAssessments.reduce<Record<AssessmentStatus, number>>(
    (acc, a) => {
      acc[a.status] = (acc[a.status] ?? 0) + 1;
      return acc;
    },
    { draft: 0, in_progress: 0, submitted: 0, completed: 0 }
  );

  const latestUpdatedAt = orgAssessments
    .map((a) => a.updatedAt)
    .sort()
    .at(-1);

  return c.json({
    success: true,
    data: {
      organisationId: auth.organisationId,
      totals: {
        assessments: orgAssessments.length,
      },
      byStatus,
      latestUpdatedAt: latestUpdatedAt ?? null,
    },
  });
});

api.get('/analytics/assessments', async (c) => {
  const auth = requireAuth(c);
  if (auth instanceof Response) return auth;

  const orgAssessments = hasDatabase()
    ? await dbListAssessmentsByOrganisation(auth.organisationId)
    : Array.from(assessmentsById.values()).filter((a) => a.organisationId === auth.organisationId);

  const timeline = orgAssessments
    .slice()
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((a) => ({
      id: a.id,
      createdAt: a.createdAt,
      status: a.status,
      submittedAt: a.submittedAt ?? null,
    }));

  return c.json({
    success: true,
    data: {
      organisationId: auth.organisationId,
      items: timeline,
    },
  });
});

api.get('/reports/generate', (c) => {
  const auth = requireAuth(c);
  if (auth instanceof Response) return auth;

  const reportId = `rpt_${crypto.randomUUID().replace(/-/g, '')}`;
  return c.json({
    success: true,
    data: {
      reportId,
      organisationId: auth.organisationId,
      status: 'generated',
      generatedAt: new Date().toISOString(),
      downloadUrl: `/api/v1/reports/${reportId}.json`,
    },
  });
});

// ── Mount workshop routes ────────────────────────────────────
api.route('/workshop', workshop);

const port = Number(process.env.PORT ?? 3000);
const hostname =
  process.env.HOST ?? (process.env.NODE_ENV === 'production' ? '127.0.0.1' : undefined);

if (!process.env.JEST_WORKER_ID && process.env.NODE_ENV !== 'test') {
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL must be set via environment variables in production');
    }
    if (jwtSecret === DEV_JWT_SECRET || refreshSecret === DEV_REFRESH_SECRET) {
      throw new Error('JWT secrets must be set via environment variables in production');
    }
  }
  const server = serve({ fetch: app.fetch, port, hostname });

  const shutdown = async (signal: string) => {
    console.log(JSON.stringify({ ts: new Date().toISOString(), level: 'info', message: `${signal} received, shutting down gracefully` }));
    server.close(async () => {
      await closeDbPool();
      console.log(JSON.stringify({ ts: new Date().toISOString(), level: 'info', message: 'Shutdown complete' }));
      process.exit(0);
    });
    // Force exit after 10s if graceful shutdown stalls
    setTimeout(() => {
      console.error(JSON.stringify({ ts: new Date().toISOString(), level: 'error', message: 'Forced shutdown after timeout' }));
      process.exit(1);
    }, 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

export default app;
