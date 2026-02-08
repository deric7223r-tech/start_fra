import crypto from 'node:crypto';
import { Hono } from 'hono';
import { getAuth, hasDatabase, jsonError, requireAuth } from '../helpers.js';
import { createLogger } from '../logger.js';
import {
  paymentCreateIntentSchema, purchasesCreateSchema, purchasesConfirmSchema,
  stripeWebhookSchema, FALLBACK_PACKAGES,
} from '../types.js';

const logger = createLogger('payments');
import type { Assessment, Purchase } from '../types.js';
import { assessmentsById, purchasesById } from '../stores.js';
import { getClientIp } from '../middleware.js';
import {
  dbInsertPurchase, dbGetPurchaseById, dbUpdatePurchaseStatus,
  dbListPurchasesByOrganisation, dbListPackages, dbGetPackageById,
  dbListAssessmentsByOrganisation,
  auditLog,
} from '../db/index.js';

const payments = new Hono();

payments.post('/payments/create-intent', async (c) => {
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

payments.get('/packages', async (c) => {
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

payments.get('/packages/recommended', async (c) => {
  const auth = getAuth(c);

  // No auth/org info available: recommend professional (most popular)
  if (!auth) {
    return c.json({ success: true, data: { packageId: 'pkg_training', reason: 'most_popular' } });
  }

  // Fetch the user's assessments
  const orgAssessments: Assessment[] = hasDatabase()
    ? await dbListAssessmentsByOrganisation(auth.organisationId)
    : Array.from(assessmentsById.values()).filter((a) => a.organisationId === auth.organisationId);

  // No assessments: recommend starter
  if (orgAssessments.length === 0) {
    return c.json({ success: true, data: { packageId: 'pkg_basic', reason: 'no_assessment' } });
  }

  // Check completed/submitted assessments for risk indicators
  const completedAssessments = orgAssessments.filter((a) => a.status === 'completed' || a.status === 'submitted');

  if (completedAssessments.length === 0) {
    // Has assessments but none completed yet: recommend starter
    return c.json({ success: true, data: { packageId: 'pkg_basic', reason: 'assessment_in_progress' } });
  }

  // Derive a simple risk score from the most recent completed assessment's answers.
  // Count the number of answered questions as a proxy for complexity/risk.
  const latest = completedAssessments.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  const answerCount = Object.keys(latest.answers).length;

  // Simple heuristic: more answers filled in suggests higher risk awareness needed
  // High risk (many answers / flags): recommend enterprise (pkg_full)
  // Medium risk: recommend professional (pkg_training)
  // Low risk: recommend starter (pkg_basic)
  if (answerCount >= 15) {
    return c.json({ success: true, data: { packageId: 'pkg_full', reason: 'high_risk_score' } });
  }
  if (answerCount >= 5) {
    return c.json({ success: true, data: { packageId: 'pkg_training', reason: 'medium_risk_score' } });
  }

  return c.json({ success: true, data: { packageId: 'pkg_basic', reason: 'low_risk_score' } });
});

payments.post('/purchases', async (c) => {
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

payments.post('/purchases/:id/confirm', async (c) => {
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

payments.get('/purchases/:id', async (c) => {
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

payments.get('/purchases/organisation/:orgId', async (c) => {
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

function verifyStripeSignature(payload: string, sigHeader: string, secret: string): boolean {
  const parts = sigHeader.split(',').reduce((acc, part) => {
    const [key, value] = part.split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  const timestamp = parts['t'];
  const signature = parts['v1'];

  if (!timestamp || !signature) return false;

  // Check timestamp is within 5 minutes
  const tolerance = 300; // 5 minutes
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp, 10)) > tolerance) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const expectedSig = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex');

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig));
}

payments.post('/webhooks/stripe', async (c) => {
  // Read the raw body text for signature verification before JSON parsing
  const rawBody = await c.req.text();

  // Stripe webhook signature verification
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (webhookSecret) {
    const sigHeader = c.req.header('stripe-signature');
    if (!sigHeader) {
      return jsonError(c, 400, 'SIGNATURE_MISSING', 'Missing stripe-signature header');
    }
    if (!verifyStripeSignature(rawBody, sigHeader, webhookSecret)) {
      return jsonError(c, 400, 'SIGNATURE_INVALID', 'Invalid Stripe webhook signature');
    }
  } else if (process.env.NODE_ENV === 'production') {
    logger.error('STRIPE_WEBHOOK_SECRET is not set — rejecting webhook in production');
    return jsonError(c, 500, 'CONFIGURATION_ERROR', 'Webhook signature verification is not configured');
  } else {
    logger.warn('STRIPE_WEBHOOK_SECRET is not set — skipping webhook signature verification');
  }

  let body: unknown;
  try { body = JSON.parse(rawBody); } catch { return jsonError(c, 400, 'VALIDATION_ERROR', 'Invalid JSON body'); }

  const parsed = stripeWebhookSchema.safeParse(body);
  if (!parsed.success) return jsonError(c, 400, 'VALIDATION_ERROR', 'Invalid stripe webhook payload');

  const eventType = parsed.data.type;
  const eventData = parsed.data.data as Record<string, unknown> | undefined;
  const now = new Date().toISOString();

  logger.info('Stripe webhook received', { type: eventType });

  switch (eventType) {
    case 'checkout.session.completed': {
      // Extract purchase/payment info from the session object
      const sessionObj = (eventData as Record<string, unknown> | undefined)?.object as Record<string, unknown> | undefined;
      const paymentIntentId = (sessionObj?.payment_intent as string) ?? null;
      const metadata = sessionObj?.metadata as Record<string, string> | undefined;
      const purchaseId = metadata?.purchaseId;

      if (purchaseId) {
        if (hasDatabase()) {
          await dbUpdatePurchaseStatus(purchaseId, 'succeeded', now);
        } else {
          const existing = purchasesById.get(purchaseId);
          if (existing) { existing.status = 'succeeded'; existing.confirmedAt = now; }
        }
        logger.info('Purchase status updated', { purchaseId, status: 'succeeded', paymentIntentId });
      }
      break;
    }

    case 'payment_intent.succeeded': {
      // Confirm payment for a purchase linked via paymentIntentId
      const intentObj = (eventData as Record<string, unknown> | undefined)?.object as Record<string, unknown> | undefined;
      const piId = (intentObj?.id as string) ?? null;

      if (piId) {
        // Search for the purchase with this paymentIntentId
        if (hasDatabase()) {
          // In DB mode, we rely on checkout.session.completed for status updates.
          // Log the confirmation for auditing purposes.
          logger.info('Payment intent confirmed', { paymentIntentId: piId });
        } else {
          const purchase = Array.from(purchasesById.values()).find((p) => p.paymentIntentId === piId);
          if (purchase && purchase.status !== 'succeeded') {
            purchase.status = 'succeeded';
            purchase.confirmedAt = now;
            logger.info('Purchase confirmed via intent', { purchaseId: purchase.id, paymentIntentId: piId });
          }
        }
      }
      break;
    }

    default: {
      // Acknowledge unhandled event types
      logger.info('Unhandled Stripe webhook event', { type: eventType });
      break;
    }
  }

  return c.json({ success: true, data: { received: true, type: eventType } });
});

export default payments;
