import { Hono } from 'hono';
import { hasDatabase, jsonError, requireAuth } from '../helpers.js';
import { requireUUIDParam, assessmentCreateSchema, assessmentPatchSchema } from '../types.js';
import type { Assessment } from '../types.js';
import { assessmentsById } from '../stores.js';
import {
  dbInsertAssessment, dbGetAssessmentById, dbListAssessmentsByOrganisation, dbUpdateAssessment,
} from '../db/index.js';

const assessments = new Hono();

assessments.get('/assessments', async (c) => {
  const auth = requireAuth(c);
  if (auth instanceof Response) return auth;

  if (!hasDatabase()) {
    const items = Array.from(assessmentsById.values()).filter((a) => a.organisationId === auth.organisationId);
    return c.json({ success: true, data: items });
  }

  const items = await dbListAssessmentsByOrganisation(auth.organisationId);
  return c.json({ success: true, data: items });
});

assessments.get('/assessments/organisation/:orgId', async (c) => {
  const auth = requireAuth(c);
  if (auth instanceof Response) return auth;

  const orgId = c.req.param('orgId');
  if (orgId !== auth.organisationId) return jsonError(c, 403, 'FORBIDDEN', 'Forbidden');

  if (!hasDatabase()) {
    const items = Array.from(assessmentsById.values()).filter((a) => a.organisationId === orgId);
    return c.json({ success: true, data: items });
  }

  const items = await dbListAssessmentsByOrganisation(orgId);
  return c.json({ success: true, data: items });
});

assessments.post('/assessments', async (c) => {
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

assessments.get('/assessments/:id', async (c) => {
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

  const assessment = await dbGetAssessmentById(id);
  if (!assessment || assessment.organisationId !== auth.organisationId) {
    return jsonError(c, 404, 'NOT_FOUND', 'Assessment not found');
  }
  return c.json({ success: true, data: assessment });
});

assessments.patch('/assessments/:id', async (c) => {
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

assessments.post('/assessments/:id/submit', async (c) => {
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
});

export default assessments;
