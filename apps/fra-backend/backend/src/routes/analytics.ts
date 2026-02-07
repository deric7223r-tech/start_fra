import { Hono } from 'hono';
import { hasDatabase, requireAuth } from '../helpers.js';
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

analytics.get('/reports/generate', async (c) => {
  const auth = requireAuth(c);
  if (auth instanceof Response) return auth;

  // Fetch the organisation's assessments
  const orgAssessments = hasDatabase()
    ? await dbListAssessmentsByOrganisation(auth.organisationId)
    : Array.from(assessmentsById.values()).filter((a) => a.organisationId === auth.organisationId);

  // Compute summary statistics
  const byStatus = orgAssessments.reduce<Record<AssessmentStatus, number>>(
    (acc, a) => {
      acc[a.status] = (acc[a.status] ?? 0) + 1;
      return acc;
    },
    { draft: 0, in_progress: 0, submitted: 0, completed: 0 }
  );

  const completedAssessments = orgAssessments.filter((a) => a.status === 'completed' || a.status === 'submitted');

  // Derive risk indicators from completed assessments
  const assessmentSummaries = completedAssessments.map((a) => {
    const answerCount = Object.keys(a.answers).length;
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (answerCount >= 15) riskLevel = 'high';
    else if (answerCount >= 5) riskLevel = 'medium';

    return {
      id: a.id,
      title: a.title,
      status: a.status,
      answerCount,
      riskLevel,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
      submittedAt: a.submittedAt ?? null,
    };
  });

  // Overall risk: highest risk found across assessments, or 'none' if no assessments
  const riskLevels = assessmentSummaries.map((s) => s.riskLevel);
  const overallRisk = riskLevels.includes('high')
    ? 'high'
    : riskLevels.includes('medium')
      ? 'medium'
      : completedAssessments.length > 0
        ? 'low'
        : 'none';

  const latestUpdatedAt = orgAssessments
    .map((a) => a.updatedAt)
    .sort()
    .at(-1);

  const reportId = `rpt_${crypto.randomUUID().replace(/-/g, '')}`;
  const generatedAt = new Date().toISOString();

  return c.json({
    success: true,
    data: {
      reportId,
      organisationId: auth.organisationId,
      status: 'generated',
      generatedAt,
      summary: {
        totalAssessments: orgAssessments.length,
        byStatus,
        completedCount: completedAssessments.length,
        overallRisk,
        latestActivity: latestUpdatedAt ?? null,
      },
      assessments: assessmentSummaries,
      // TODO: Integrate with S3 to persist the report and provide a real download URL
      downloadUrl: `/api/v1/reports/${reportId}.json`,
    },
  });
});

export default analytics;
