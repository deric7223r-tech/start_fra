import { Hono } from 'hono';
import { hasDatabase, jsonError, requireAuth } from '../helpers.js';
import type { AssessmentStatus } from '../types.js';
import { assessmentsById } from '../stores.js';
import { dbListAssessmentsByOrganisation } from '../db/index.js';

const analytics = new Hono();

analytics.get('/analytics/overview', async (c) => {
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

analytics.get('/analytics/assessments', async (c) => {
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

analytics.get('/reports/generate', (c) => {
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

export default analytics;
