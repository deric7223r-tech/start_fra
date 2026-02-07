import { Hono } from 'hono';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDbPool } from '../db.js';
import { hasDatabase, jsonError, requireAuth } from '../helpers.js';
import { getRedis } from '../redis.js';
import {
  signupSchema, loginSchema, refreshSchema, forgotPasswordSchema, resetPasswordSchema,
  refreshSecret,
  LOCKOUT_PREFIX, LOCKOUT_MAX_ATTEMPTS, LOCKOUT_WINDOW_SECONDS,
} from '../types.js';
import type { User, Organisation } from '../types.js';
import { usersByEmail, refreshTokenAllowlist, organisationsById } from '../stores.js';
import { getClientIp, rateLimit } from '../middleware.js';
import {
  dbGetUserByEmail, dbGetUserById, dbInsertUser, dbUpdateUserPasswordHash,
  dbUpsertRefreshToken, dbHasRefreshToken, dbDeleteRefreshToken, dbDeleteAllRefreshTokensForUser,
  dbInsertOrganisation, dbGetOrganisationById,
  auditLog,
  setPasswordResetToken, getPasswordResetUserId, deletePasswordResetToken,
} from '../db/index.js';
import { issueTokens, publicUser } from '../auth-utils.js';

// ── Auth helpers ────────────────────────────────────────────────

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

// ── Routes ──────────────────────────────────────────────────────

const auth = new Hono();

auth.post('/auth/signup', async (c) => {
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

auth.post('/auth/login', async (c) => {
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
    // Return the same generic error as invalid credentials to prevent
    // account enumeration via lockout timing differences.
    return jsonError(c, 401, 'INVALID_CREDENTIALS', 'Invalid email or password');
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

auth.get('/auth/me', async (c) => {
  const authCtx = requireAuth(c);
  if (authCtx instanceof Response) return authCtx;

  if (!hasDatabase()) {
    const user = usersByEmail.get(authCtx.email.toLowerCase());
    if (!user) return jsonError(c, 401, 'UNAUTHORIZED', 'User not found');
    return c.json({ success: true, data: { ...publicUser(user), profile: null, workshopRoles: [] } });
  }

  const user = await dbGetUserByEmail(authCtx.email.toLowerCase());
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

auth.post('/auth/logout', async (c) => {
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

auth.post('/auth/refresh', async (c) => {
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

auth.post('/auth/forgot-password', async (c) => {
  const limited = await rateLimit('auth:forgot', { windowMs: 15 * 60 * 1000, max: 5 })(c);
  if (limited instanceof Response) return limited;

  const parsed = forgotPasswordSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return jsonError(c, 400, 'VALIDATION_ERROR', 'Invalid forgot-password payload');

  const emailLc = parsed.data.email.toLowerCase();
  const user = hasDatabase() ? await dbGetUserByEmail(emailLc) : usersByEmail.get(emailLc);

  let resetToken: string | undefined;

  if (user) {
    resetToken = crypto.randomUUID();
    await setPasswordResetToken(resetToken, user.id);

    await auditLog({
      eventType: 'auth.forgot_password', actorEmail: emailLc,
      resourceType: 'user', resourceId: user.id, ipAddress: getClientIp(c),
    });
  }

  // Always return the same message to prevent email enumeration
  const response: Record<string, unknown> = {
    success: true,
    message: 'If an account with that email exists, a password reset link has been sent.',
  };

  // Only expose token in development for testing
  if (process.env.NODE_ENV !== 'production' && resetToken) {
    response.resetToken = resetToken;
  }

  return c.json(response);
});

auth.post('/auth/reset-password', async (c) => {
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

auth.get('/debug/db/ping', async (c) => {
  if (process.env.NODE_ENV === 'production') {
    return c.json({ error: 'Not found' }, 404);
  }

  const authCtx = requireAuth(c);
  if (authCtx instanceof Response) return authCtx;

  try {
    const pool = getDbPool();
    const result = await pool.query('select 1 as ok');
    return c.json({ success: true, data: { ok: result.rows?.[0]?.ok === 1 } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Database unavailable';
    return jsonError(c, 500, 'DB_UNAVAILABLE', message);
  }
});

export default auth;
