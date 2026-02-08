import crypto from 'node:crypto';
import { Hono } from 'hono';
import { hasDatabase, hasPackageEntitlement, jsonError, requireAuth } from '../helpers.js';
import { RISK_THRESHOLDS, RATE_LIMITS, parsePagination, paginate } from '../types.js';
import type { AssessmentStatus } from '../types.js';
import { assessmentsById, purchasesById, keypassesByCode } from '../stores.js';
import { dbListAssessmentsByOrganisation, dbListPurchasesByOrganisation, dbListKeypassesByOrganisation, auditLog } from '../db/index.js';
import { rateLimit, getClientIp } from '../middleware.js';

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

  const { page, pageSize } = parsePagination(c.req.query());
  const result = paginate(timeline, page, pageSize);

  return c.json({
    success: true,
    data: {
      organisationId: auth.organisationId,
      items: result.items,
    },
    pagination: { page: result.page, pageSize: result.pageSize, total: result.total, totalPages: result.totalPages },
  });
});

analytics.get('/reports/generate', async (c) => {
  const limited = await rateLimit('reports:generate', { windowMs: RATE_LIMITS.REPORT_WINDOW_MS, max: RATE_LIMITS.REPORT_MAX })(c);
  if (limited instanceof Response) return limited;

  const auth = requireAuth(c);
  if (auth instanceof Response) return auth;

  // Require at least pkg_training to generate reports
  const orgPurchases = hasDatabase()
    ? await dbListPurchasesByOrganisation(auth.organisationId)
    : Array.from(purchasesById.values()).filter((p) => p.organisationId === auth.organisationId);

  if (!hasPackageEntitlement(orgPurchases, 'pkg_training')) {
    return jsonError(c, 403, 'PACKAGE_REQUIRED', 'Report generation requires a Training or Full package');
  }

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
    if (answerCount >= RISK_THRESHOLDS.HIGH_ANSWER_COUNT) riskLevel = 'high';
    else if (answerCount >= RISK_THRESHOLDS.MEDIUM_ANSWER_COUNT) riskLevel = 'medium';

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

  await auditLog({
    eventType: 'report.generated', actorId: auth.userId, actorEmail: auth.email,
    organisationId: auth.organisationId, resourceType: 'report', resourceId: reportId,
    details: { assessmentCount: completedAssessments.length, overallRisk },
    ipAddress: getClientIp(c),
    userAgent: c.req.header('user-agent'),
  });

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
    },
  });
});

analytics.get('/analytics/dashboard', async (c) => {
  const auth = requireAuth(c);
  if (auth instanceof Response) return auth;

  // Require pkg_full for the aggregated dashboard
  const orgPurchases = hasDatabase()
    ? await dbListPurchasesByOrganisation(auth.organisationId)
    : Array.from(purchasesById.values()).filter((p) => p.organisationId === auth.organisationId);

  if (!hasPackageEntitlement(orgPurchases, 'pkg_full')) {
    return jsonError(c, 403, 'PACKAGE_REQUIRED', 'Dashboard requires the Full package');
  }

  const orgAssessments = hasDatabase()
    ? await dbListAssessmentsByOrganisation(auth.organisationId)
    : Array.from(assessmentsById.values()).filter((a) => a.organisationId === auth.organisationId);

  const orgKeypasses = hasDatabase()
    ? await dbListKeypassesByOrganisation(auth.organisationId)
    : Array.from(keypassesByCode.values()).filter((k) => k.organisationId === auth.organisationId);

  const assessmentsByStatus = orgAssessments.reduce<Record<string, number>>(
    (acc, a) => { acc[a.status] = (acc[a.status] ?? 0) + 1; return acc; },
    { draft: 0, in_progress: 0, submitted: 0, completed: 0 }
  );

  const keypassesByStatus = orgKeypasses.reduce<Record<string, number>>(
    (acc, k) => { acc[k.status] = (acc[k.status] ?? 0) + 1; return acc; },
    { available: 0, used: 0, revoked: 0, expired: 0 }
  );

  const activePurchases = orgPurchases.filter((p) => p.status === 'succeeded');
  const totalSpent = activePurchases.reduce((sum, p) => sum + p.amountCents, 0);

  return c.json({
    success: true,
    data: {
      organisationId: auth.organisationId,
      assessments: {
        total: orgAssessments.length,
        byStatus: assessmentsByStatus,
      },
      keypasses: {
        total: orgKeypasses.length,
        byStatus: keypassesByStatus,
      },
      purchases: {
        total: orgPurchases.length,
        active: activePurchases.length,
        totalSpentCents: totalSpent,
      },
    },
  });
});

export default analytics;
