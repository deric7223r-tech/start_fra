import dotenv from 'dotenv';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { getDbPool, closeDbPool } from './db.js';
import { getRedis } from './redis.js';
import { DEV_JWT_SECRET, jwtSecret, hasDatabase } from './helpers.js';
import { DEV_REFRESH_SECRET, refreshSecret } from './types.js';
import { applyGlobalMiddleware, applyApiMiddleware } from './middleware.js';
import authRoutes from './routes/auth.js';
import assessmentRoutes from './routes/assessments.js';
import keypassRoutes from './routes/keypasses.js';
import paymentRoutes from './routes/payments.js';
import analyticsRoutes from './routes/analytics.js';
import s3Routes from './routes/s3.js';
import workshop from './workshop.js';
import budgetGuide from './budget-guide.js';

dotenv.config();

const app = new Hono();

// ── Global middleware (CORS, security headers, logging) ──────────
const allowedOrigins = applyGlobalMiddleware(app);

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

// ── API routes ──────────────────────────────────────────────────
const api = app.basePath('/api/v1');

// Apply API-level middleware (body-size, sanitization, CSRF, rate-limit)
applyApiMiddleware(api, allowedOrigins);

// Mount route modules
api.route('/', authRoutes);
api.route('/', assessmentRoutes);
api.route('/', keypassRoutes);
api.route('/', paymentRoutes);
api.route('/', analyticsRoutes);
api.route('/', s3Routes);
api.route('/workshop', workshop);
api.route('/budget-guide', budgetGuide);

// ── Server startup ──────────────────────────────────────────────
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
    const forceExitTimer = setTimeout(() => {
      console.error(JSON.stringify({ ts: new Date().toISOString(), level: 'error', message: 'Forced shutdown after timeout' }));
      process.exit(1);
    }, 10_000) as NodeJS.Timeout;
    forceExitTimer.unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

export default app;
