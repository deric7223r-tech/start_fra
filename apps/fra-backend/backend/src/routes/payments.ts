import { Hono } from 'hono';
import { hasDatabase, jsonError, requireAuth } from '../helpers.js';
import {
  paymentCreateIntentSchema, purchasesCreateSchema, purchasesConfirmSchema,
  stripeWebhookSchema, FALLBACK_PACKAGES,
} from '../types.js';
import type { Purchase } from '../types.js';
import { purchasesById } from '../stores.js';
import { getClientIp } from '../middleware.js';
import {
  dbInsertPurchase, dbGetPurchaseById, dbUpdatePurchaseStatus,
  dbListPurchasesByOrganisation, dbListPackages, dbGetPackageById,
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

payments.get('/packages/recommended', (c) => {
  return c.json({ success: true, data: { packageId: 'pkg_basic' } });
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

payments.post('/webhooks/stripe', async (c) => {
  const parsed = stripeWebhookSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return jsonError(c, 400, 'VALIDATION_ERROR', 'Invalid stripe webhook payload');

  return c.json({ success: true, data: { received: true, type: parsed.data.type } });
});

export default payments;
