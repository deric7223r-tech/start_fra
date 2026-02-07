import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import jwt from 'jsonwebtoken';

export type AuthContext = {
  userId: string;
  email: string;
  role: string;
  organisationId: string;
};

export const DEV_JWT_SECRET = 'dev_jwt_secret_change_me';

function resolveJwtSecret(): jwt.Secret {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable must be set in production');
  }
  return DEV_JWT_SECRET;
}

export const jwtSecret: jwt.Secret = resolveJwtSecret();

export function hasDatabase(): boolean {
  return !!process.env.DATABASE_URL;
}

export function jsonError(c: Context, status: ContentfulStatusCode, code: string, message: string) {
  return c.json({ success: false, error: { code, message } }, status);
}

export function getAuth(c: Context): AuthContext | null {
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
      role: payload.role,
      organisationId: payload.organisationId,
    };
  } catch {
    return null;
  }
}

export function requireAuth(c: Context): AuthContext | Response {
  const auth = getAuth(c);
  if (!auth) return jsonError(c, 401, 'UNAUTHORIZED', 'Missing or invalid access token');
  return auth;
}
