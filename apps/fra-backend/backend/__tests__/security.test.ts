/// <reference types="jest" />

import { app, createAuthenticatedUser, authHeaders, seedPurchase } from './helpers';
import { accountLockouts } from '../src/stores';

async function signup() {
  return createAuthenticatedUser({ organisationName: 'Security Test Org' });
}

describe('Security hardening', () => {
  // ── Account lockout (in-memory fallback) ────────────────────

  describe('Account lockout without Redis', () => {
    const email = `lockout-${crypto.randomUUID()}@example.com`;
    const password = 'SecurePass123!';

    beforeAll(async () => {
      // Create the user first
      await app.request('http://localhost/api/v1/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name: 'Lockout User', organisationName: 'Lock Org' }),
      });
    });

    afterAll(() => {
      // Clean up lockout entries
      for (const key of accountLockouts.keys()) {
        if (key.includes(email.toLowerCase())) accountLockouts.delete(key);
      }
    });

    it('locks account after 5 failed attempts', async () => {
      // 5 failed login attempts with wrong password
      for (let i = 0; i < 5; i++) {
        const res = await app.request('http://localhost/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password: 'WrongPassword123!' }),
        });
        expect(res.status).toBe(401);
      }

      // 6th attempt (even with correct password) should still get 401
      const res = await app.request('http://localhost/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      expect(res.status).toBe(401);
    });

    it('allows login after lockout is cleared', async () => {
      // Manually clear lockout
      for (const key of accountLockouts.keys()) {
        if (key.includes(email.toLowerCase())) accountLockouts.delete(key);
      }

      const res = await app.request('http://localhost/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      expect(res.status).toBe(200);
    });
  });

  // ── Keypass double-use prevention ───────────────────────────

  describe('Keypass atomic claim', () => {
    it('rejects use of an already-used keypass', async () => {
      const { accessToken, organisationId, userId } = await signup();
      seedPurchase(organisationId, userId);

      // Generate a keypass
      const genRes = await app.request('http://localhost/api/v1/keypasses/generate', {
        method: 'POST',
        headers: authHeaders(accessToken),
        body: JSON.stringify({ quantity: 1, expiresInDays: 30 }),
      });
      const genJson = (await genRes.json()) as any;
      const code = genJson.data.codes[0];

      // First use — should succeed
      const use1 = await app.request('http://localhost/api/v1/keypasses/use', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      expect(use1.status).toBe(200);

      // Second use — should fail
      const use2 = await app.request('http://localhost/api/v1/keypasses/use', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      expect(use2.status).toBe(400);
      const json2 = (await use2.json()) as any;
      expect(json2.error.code).toBe('NOT_AVAILABLE');
    });
  });

  // ── Purchase double-spend prevention ────────────────────────

  describe('Purchase double-spend prevention', () => {
    it('rejects confirm when another purchase for same package already succeeded', async () => {
      const { accessToken, organisationId, userId } = await signup();

      // Seed a succeeded purchase for pkg_training
      seedPurchase(organisationId, userId, 'pkg_training');

      // Create a new purchase for the same package — should fail (duplicate)
      const createRes = await app.request('http://localhost/api/v1/purchases', {
        method: 'POST',
        headers: authHeaders(accessToken),
        body: JSON.stringify({ packageId: 'pkg_training' }),
      });
      expect(createRes.status).toBe(409);
      const createJson = (await createRes.json()) as any;
      expect(createJson.error.code).toBe('DUPLICATE_PURCHASE');
    });

    it('rejects confirm of requires_confirmation purchase when another already succeeded', async () => {
      const { accessToken, organisationId, userId } = await signup();

      // Create a purchase for pkg_basic (no existing succeeded purchase)
      const createRes = await app.request('http://localhost/api/v1/purchases', {
        method: 'POST',
        headers: authHeaders(accessToken),
        body: JSON.stringify({ packageId: 'pkg_basic' }),
      });
      expect(createRes.status).toBe(200);
      const createJson = (await createRes.json()) as any;
      const purchaseId = createJson.data.purchaseId;

      // Seed a succeeded purchase for the same package (simulating a race condition)
      seedPurchase(organisationId, userId, 'pkg_basic');

      // Now confirm the pending purchase — should be rejected
      const confirmRes = await app.request(`http://localhost/api/v1/purchases/${purchaseId}/confirm`, {
        method: 'POST',
        headers: authHeaders(accessToken),
        body: JSON.stringify({}),
      });
      expect(confirmRes.status).toBe(409);
      const confirmJson = (await confirmRes.json()) as any;
      expect(confirmJson.error.code).toBe('DUPLICATE_PURCHASE');
    });
  });

  // ── Assessment status transition validation ────────────────

  describe('Assessment status transitions', () => {
    it('allows valid transition: draft → in_progress', async () => {
      const { accessToken } = await signup();

      // Create assessment (starts as draft)
      const createRes = await app.request('http://localhost/api/v1/assessments', {
        method: 'POST',
        headers: authHeaders(accessToken),
        body: JSON.stringify({ title: 'Transition Test' }),
      });
      expect(createRes.status).toBe(201);
      const { data: assessment } = (await createRes.json()) as any;

      // draft → in_progress (valid)
      const patchRes = await app.request(`http://localhost/api/v1/assessments/${assessment.id}`, {
        method: 'PATCH',
        headers: authHeaders(accessToken),
        body: JSON.stringify({ status: 'in_progress' }),
      });
      expect(patchRes.status).toBe(200);
      const patchJson = (await patchRes.json()) as any;
      expect(patchJson.data.status).toBe('in_progress');
    });

    it('allows valid transition: draft → submitted', async () => {
      const { accessToken } = await signup();

      const createRes = await app.request('http://localhost/api/v1/assessments', {
        method: 'POST',
        headers: authHeaders(accessToken),
        body: JSON.stringify({ title: 'Skip Test' }),
      });
      const { data: assessment } = (await createRes.json()) as any;

      // draft → submitted (valid skip)
      const patchRes = await app.request(`http://localhost/api/v1/assessments/${assessment.id}`, {
        method: 'PATCH',
        headers: authHeaders(accessToken),
        body: JSON.stringify({ status: 'submitted' }),
      });
      expect(patchRes.status).toBe(200);
    });

    it('rejects invalid transition: draft → completed', async () => {
      const { accessToken } = await signup();

      const createRes = await app.request('http://localhost/api/v1/assessments', {
        method: 'POST',
        headers: authHeaders(accessToken),
        body: JSON.stringify({ title: 'Invalid Test' }),
      });
      const { data: assessment } = (await createRes.json()) as any;

      // draft → completed (invalid — must go through submitted first)
      const patchRes = await app.request(`http://localhost/api/v1/assessments/${assessment.id}`, {
        method: 'PATCH',
        headers: authHeaders(accessToken),
        body: JSON.stringify({ status: 'completed' }),
      });
      expect(patchRes.status).toBe(400);
      const json = (await patchRes.json()) as any;
      expect(json.error.code).toBe('INVALID_STATUS_TRANSITION');
    });

    it('rejects backward transition: submitted → draft', async () => {
      const { accessToken } = await signup();

      const createRes = await app.request('http://localhost/api/v1/assessments', {
        method: 'POST',
        headers: authHeaders(accessToken),
        body: JSON.stringify({ title: 'Backward Test' }),
      });
      const { data: assessment } = (await createRes.json()) as any;

      // Move to submitted first
      await app.request(`http://localhost/api/v1/assessments/${assessment.id}`, {
        method: 'PATCH',
        headers: authHeaders(accessToken),
        body: JSON.stringify({ status: 'submitted' }),
      });

      // submitted → draft (invalid backward transition)
      const patchRes = await app.request(`http://localhost/api/v1/assessments/${assessment.id}`, {
        method: 'PATCH',
        headers: authHeaders(accessToken),
        body: JSON.stringify({ status: 'draft' }),
      });
      expect(patchRes.status).toBe(400);
      const json = (await patchRes.json()) as any;
      expect(json.error.code).toBe('INVALID_STATUS_TRANSITION');
    });

    it('allows PATCH without status change (title-only update)', async () => {
      const { accessToken } = await signup();

      const createRes = await app.request('http://localhost/api/v1/assessments', {
        method: 'POST',
        headers: authHeaders(accessToken),
        body: JSON.stringify({ title: 'Title Only Test' }),
      });
      const { data: assessment } = (await createRes.json()) as any;

      // PATCH title only — no status field — should succeed
      const patchRes = await app.request(`http://localhost/api/v1/assessments/${assessment.id}`, {
        method: 'PATCH',
        headers: authHeaders(accessToken),
        body: JSON.stringify({ title: 'Updated Title' }),
      });
      expect(patchRes.status).toBe(200);
      const json = (await patchRes.json()) as any;
      expect(json.data.title).toBe('Updated Title');
      expect(json.data.status).toBe('draft');
    });
  });

  // ── Auth /me rate limiting ─────────────────────────────────

  describe('GET /auth/me', () => {
    it('requires authentication', async () => {
      const res = await app.request('http://localhost/api/v1/auth/me');
      expect(res.status).toBe(401);
    });

    it('returns user data with valid token', async () => {
      const { accessToken } = await signup();
      const res = await app.request('http://localhost/api/v1/auth/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      expect(res.status).toBe(200);
      const json = (await res.json()) as any;
      expect(json.success).toBe(true);
      expect(json.data.email).toBeTruthy();
    });
  });
});
