import dotenv from 'dotenv';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getDbPool } from './db.js';
import { getRedis } from './redis.js';

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

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12),
  name: z.string().min(1),
  organisationName: z.string().min(1).optional(),
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
  newPassword: z.string().min(12),
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

app.use('*', async (c, next) => {
  await next();
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
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

app.get('/health', (c) => c.json({ status: 'ok' }));

const api = app.basePath('/api/v1');

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

  if (hasDatabase()) {
    await dbInsertUser(user);
  } else {
    usersByEmail.set(user.email, user);
  }

  const { accessToken, refreshToken } = issueTokens(user);
  if (hasDatabase()) {
    await dbUpsertRefreshToken(refreshToken, user.id);
  }

  return c.json({
    success: true,
    data: {
      user: publicUser(user),
      organisation: { organisationId: user.organisationId, name: parsed.data.organisationName ?? 'Organisation' },
      accessToken,
      refreshToken,
    },
  });
});

api.post('/auth/login', async (c) => {
  const limited = await rateLimit('auth:login', { windowMs: 15 * 60 * 1000, max: 5 })(c);
  if (limited instanceof Response) return limited;

  const parsed = loginSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return jsonError(c, 400, 'VALIDATION_ERROR', 'Invalid login payload');

  const { email, password } = parsed.data;
  const emailLc = email.toLowerCase();
  const user = hasDatabase() ? await dbGetUserByEmail(emailLc) : usersByEmail.get(emailLc);
  if (!user) return jsonError(c, 401, 'INVALID_CREDENTIALS', 'Invalid email or password');

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return jsonError(c, 401, 'INVALID_CREDENTIALS', 'Invalid email or password');

  const { accessToken, refreshToken } = issueTokens(user);
  if (hasDatabase()) {
    await dbUpsertRefreshToken(refreshToken, user.id);
  }
  return c.json({
    success: true,
    data: {
      user: publicUser(user),
      organisation: { organisationId: user.organisationId, name: 'Organisation' },
      accessToken,
      refreshToken,
    },
  });
});

api.get('/auth/me', (c) => {
  const auth = requireAuth(c);
  if (auth instanceof Response) return auth;

  if (!hasDatabase()) {
    const user = usersByEmail.get(auth.email.toLowerCase());
    if (!user) return jsonError(c, 401, 'UNAUTHORIZED', 'User not found');
    return c.json({ success: true, data: publicUser(user) });
  }

  return (async () => {
    const user = await dbGetUserByEmail(auth.email.toLowerCase());
    if (!user) return jsonError(c, 401, 'UNAUTHORIZED', 'User not found');
    return c.json({ success: true, data: publicUser(user) });
  })();
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
    passwordResetTokens.set(token, { userId: user.id, expiresAt: Date.now() + 60 * 60 * 1000 });
    return c.json({ success: true, data: { resetToken: token } });
  }

  return c.json({ success: true });
});

api.post('/auth/reset-password', async (c) => {
  const limited = await rateLimit('auth:reset', { windowMs: 15 * 60 * 1000, max: 5 })(c);
  if (limited instanceof Response) return limited;

  const parsed = resetPasswordSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return jsonError(c, 400, 'VALIDATION_ERROR', 'Invalid reset-password payload');

  const entry = passwordResetTokens.get(parsed.data.token);
  if (!entry || entry.expiresAt < Date.now()) {
    passwordResetTokens.delete(parsed.data.token);
    return jsonError(c, 400, 'INVALID_TOKEN', 'Invalid or expired reset token');
  }

  const user = hasDatabase() ? await dbGetUserById(entry.userId) : Array.from(usersByEmail.values()).find((u) => u.id === entry.userId) ?? null;
  if (!user) {
    passwordResetTokens.delete(parsed.data.token);
    return jsonError(c, 400, 'INVALID_TOKEN', 'Invalid or expired reset token');
  }

  const newHash = await bcrypt.hash(parsed.data.newPassword, 12);
  if (hasDatabase()) {
    await dbUpdateUserPasswordHash(user.id, newHash);
    await dbDeleteAllRefreshTokensForUser(user.id);
  } else {
    user.passwordHash = newHash;
  }
  passwordResetTokens.delete(parsed.data.token);

  if (!hasDatabase()) {
    for (const token of Array.from(refreshTokenAllowlist.values())) {
      try {
        const payload = jwt.decode(token) as jwt.JwtPayload | null;
        if (payload && payload.sub === user.id) refreshTokenAllowlist.delete(token);
      } catch {
        refreshTokenAllowlist.delete(token);
      }
    }
  }

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

  const id = c.req.param('id');

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

  const id = c.req.param('id');
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

  const id = c.req.param('id');

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

api.post('/keypasses/generate', async (c) => {
  const auth = requireAuth(c);
  if (auth instanceof Response) return auth;

  const parsed = keypassGenerateSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return jsonError(c, 400, 'VALIDATION_ERROR', 'Invalid keypass generate payload');

  const now = Date.now();
  const expiresAt = new Date(now + parsed.data.expiresInDays * 24 * 60 * 60 * 1000).toISOString();
  const createdAt = new Date(now).toISOString();

  const codes: string[] = [];
  for (let i = 0; i < parsed.data.quantity; i++) {
    let code = generateKeypassCode();
    while (keypassesByCode.has(code)) code = generateKeypassCode();

    keypassesByCode.set(code, {
      code,
      organisationId: auth.organisationId,
      status: 'available',
      createdAt,
      expiresAt,
    });

    codes.push(code);
  }

  return c.json({ success: true, data: { organisationId: auth.organisationId, expiresAt, codes } });
});

api.post('/keypasses/allocate', async (c) => {
  const auth = requireAuth(c);
  if (auth instanceof Response) return auth;

  const parsed = keypassGenerateSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return jsonError(c, 400, 'VALIDATION_ERROR', 'Invalid keypass allocate payload');

  const now = Date.now();
  const expiresAt = new Date(now + parsed.data.expiresInDays * 24 * 60 * 60 * 1000).toISOString();
  const createdAt = new Date(now).toISOString();

  const codes: string[] = [];
  for (let i = 0; i < parsed.data.quantity; i++) {
    let code = generateKeypassCode();
    while (keypassesByCode.has(code)) code = generateKeypassCode();

    keypassesByCode.set(code, {
      code,
      organisationId: auth.organisationId,
      status: 'available',
      createdAt,
      expiresAt,
    });

    codes.push(code);
  }

  return c.json({ success: true, data: { organisationId: auth.organisationId, expiresAt, codes } });
});

api.post('/keypasses/use', async (c) => {
  const limited = await rateLimit('keypass:use', { windowMs: 60 * 1000, max: 3 })(c);
  if (limited instanceof Response) return limited;

  const parsed = keypassUseSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return jsonError(c, 400, 'VALIDATION_ERROR', 'Invalid keypass use payload');

  const code = parsed.data.code.toUpperCase();
  const kp = keypassesByCode.get(code);
  if (!kp) return jsonError(c, 404, 'NOT_FOUND', 'Keypass not found');

  const now = new Date().toISOString();
  if (kp.status !== 'available') return jsonError(c, 400, 'NOT_AVAILABLE', 'Keypass is not available');
  if (new Date(kp.expiresAt).getTime() < Date.now()) {
    kp.status = 'expired';
    return jsonError(c, 400, 'EXPIRED', 'Keypass is expired');
  }

  kp.status = 'used';
  kp.usedAt = now;

  const email = (parsed.data.email ?? `employee+${kp.code.toLowerCase()}@example.com`).toLowerCase();
  const name = parsed.data.name ?? email.split('@')[0];

  let user = usersByEmail.get(email);
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
    usersByEmail.set(email, user);
  }

  const { accessToken, refreshToken } = issueTokens(user);
  return c.json({
    success: true,
    data: {
      user: publicUser(user),
      organisation: { organisationId: user.organisationId, name: 'Organisation' },
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
  const kp = keypassesByCode.get(code);
  if (!kp || kp.organisationId !== auth.organisationId) {
    return jsonError(c, 404, 'NOT_FOUND', 'Keypass not found');
  }

  kp.status = 'revoked';
  return c.json({ success: true });
});

api.get('/keypasses/organisation/:orgId', (c) => {
  const auth = requireAuth(c);
  if (auth instanceof Response) return auth;

  const orgId = c.req.param('orgId');
  if (orgId !== auth.organisationId) return jsonError(c, 403, 'FORBIDDEN', 'Forbidden');

  const items = Array.from(keypassesByCode.values()).filter((k) => k.organisationId === orgId);
  return c.json({ success: true, data: items });
});

api.get('/keypasses/organisation/:orgId/stats', (c) => {
  const auth = requireAuth(c);
  if (auth instanceof Response) return auth;

  const orgId = c.req.param('orgId');
  if (orgId !== auth.organisationId) return jsonError(c, 403, 'FORBIDDEN', 'Forbidden');

  const items = Array.from(keypassesByCode.values()).filter((k) => k.organisationId === orgId);
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
  const kp = keypassesByCode.get(code);
  if (!kp) return jsonError(c, 404, 'NOT_FOUND', 'Keypass not found');

  if (kp.status === 'revoked') return jsonError(c, 400, 'REVOKED', 'Keypass is revoked');
  if (kp.status === 'used') return jsonError(c, 400, 'USED', 'Keypass is already used');

  if (new Date(kp.expiresAt).getTime() < Date.now()) {
    kp.status = 'expired';
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

api.get('/packages', (c) => {
  return c.json({
    success: true,
    data: [
      { id: 'pkg_basic', name: 'Basic', price: 0, currency: 'gbp' },
      { id: 'pkg_training', name: 'Training', price: 4900, currency: 'gbp' },
      { id: 'pkg_full', name: 'Full', price: 14900, currency: 'gbp' },
    ],
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

  const paymentIntentId = `pi_${crypto.randomUUID().replace(/-/g, '')}`;
  const clientSecret = `${paymentIntentId}_secret_${crypto.randomUUID().replace(/-/g, '')}`;
  const purchaseId = crypto.randomUUID();

  return c.json({
    success: true,
    data: {
      purchaseId,
      packageId: parsed.data.packageId,
      organisationId: auth.organisationId,
      paymentIntentId,
      clientSecret,
      status: 'requires_confirmation',
    },
  });
});

api.post('/purchases/:id/confirm', async (c) => {
  const auth = requireAuth(c);
  if (auth instanceof Response) return auth;

  const parsed = purchasesConfirmSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return jsonError(c, 400, 'VALIDATION_ERROR', 'Invalid purchase confirmation payload');

  return c.json({
    success: true,
    data: {
      purchaseId: c.req.param('id'),
      organisationId: auth.organisationId,
      status: 'succeeded',
      paymentIntentId: parsed.data.paymentIntentId ?? null,
    },
  });
});

api.get('/purchases/:id', (c) => {
  const auth = requireAuth(c);
  if (auth instanceof Response) return auth;

  return c.json({
    success: true,
    data: {
      purchaseId: c.req.param('id'),
      organisationId: auth.organisationId,
      status: 'unknown',
    },
  });
});

api.get('/purchases/organisation/:orgId', (c) => {
  const auth = requireAuth(c);
  if (auth instanceof Response) return auth;

  const orgId = c.req.param('orgId');
  if (orgId !== auth.organisationId) return jsonError(c, 403, 'FORBIDDEN', 'Forbidden');
  return c.json({ success: true, data: [] });
});

api.post('/webhooks/stripe', async (c) => {
  const parsed = stripeWebhookSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return jsonError(c, 400, 'VALIDATION_ERROR', 'Invalid stripe webhook payload');

  return c.json({ success: true, data: { received: true, type: parsed.data.type } });
});

api.get('/analytics/overview', (c) => {
  const auth = requireAuth(c);
  if (auth instanceof Response) return auth;

  const orgAssessments = Array.from(assessmentsById.values()).filter(
    (a) => a.organisationId === auth.organisationId
  );

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

api.get('/analytics/assessments', (c) => {
  const auth = requireAuth(c);
  if (auth instanceof Response) return auth;

  const orgAssessments = Array.from(assessmentsById.values()).filter(
    (a) => a.organisationId === auth.organisationId
  );

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
  serve({ fetch: app.fetch, port, hostname });
}

export default app;
