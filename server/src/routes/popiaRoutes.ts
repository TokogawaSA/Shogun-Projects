import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db.js';
import { withPopiaRlsTx } from '../utils/popiaTenantRls.js';
import {
  exportSubjectData,
  executeRightToErasure,
  getOrSeedPopiaRetentionPolicies,
} from '../services/popiaDsrService.js';
import {
  isOffshoreAiProcessingAllowed,
  setOffshoreAiProcessing,
} from '../utils/tenantConfig.js';
import { runPopiaRetentionSweep } from '../workers/popiaWorker.js';

export const popiaRouter = Router();

const INFORMATION_OFFICER_ROLES = new Set([
  'admin',
  'information_officer',
  'deputy_information_officer',
  'compliance_officer',
  'popia_officer',
]);

/**
 * Guard POPIA Governance routes to Tenant Administrators (`isTenantAdmin: true`)
 * or designated POPIA Information Officers.
 */
export async function requireInformationOfficerOrAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user || !req.user.tenantId) {
    res.status(401).json({ error: 'Unauthorized: Authentication required.' });
    return;
  }

  if (
    req.user.isTenantAdmin ||
    INFORMATION_OFFICER_ROLES.has((req.user.role || '').toLowerCase())
  ) {
    next();
    return;
  }

  // Also check custom RBAC Role / Profile names assigned in Shogun Role Hierarchy
  if (req.user.roleId || req.user.profileId) {
    try {
      const [dbRole, dbProfile] = await Promise.all([
        req.user.roleId
          ? prisma.role.findFirst({
              where: { id: req.user.roleId, tenantId: req.user.tenantId },
              select: { name: true },
            })
          : Promise.resolve(null),
        req.user.profileId
          ? prisma.profile.findFirst({
              where: { id: req.user.profileId, tenantId: req.user.tenantId },
              select: { name: true },
            })
          : Promise.resolve(null),
      ]);

      const roleName = (dbRole?.name || '').toLowerCase();
      const profileName = (dbProfile?.name || '').toLowerCase();
      if (
        roleName.includes('information officer') ||
        roleName.includes('compliance') ||
        profileName.includes('information officer') ||
        profileName.includes('compliance')
      ) {
        next();
        return;
      }
    } catch {
      // Fall through to 403
    }
  }

  res.status(403).json({
    error:
      'Forbidden: POPIA Governance access requires Tenant Administrator or Information Officer privileges.',
  });
}

popiaRouter.use(requireInformationOfficerOrAdmin);

const retentionPolicyItemSchema = z.object({
  moduleName: z.enum(['leads', 'contacts', 'accounts', 'deals', 'audit_logs']),
  retentionDays: z.coerce.number().int().min(1).max(36500),
  actionOnExpiry: z.enum(['anonymize', 'hard_delete']),
  isActive: z.boolean(),
});

const putPoliciesBodySchema = z.union([
  z.object({
    policies: z.array(retentionPolicyItemSchema).min(1),
  }),
  retentionPolicyItemSchema,
]);

const dsrExportSchema = z.object({
  subjectType: z.enum(['contact', 'lead', 'account', 'user']),
  subjectId: z.string().trim().min(1),
});

const dsrEraseSchema = z.object({
  subjectType: z.enum(['contact', 'lead', 'account', 'user']),
  subjectId: z.string().trim().min(1),
  reason: z.string().trim().max(500).optional(),
  preferHardDeleteWhenUnlinked: z.boolean().optional(),
});

const consentMutationSchema = z.object({
  subjectType: z.enum(['contact', 'lead', 'account', 'user']),
  subjectId: z.string().trim().min(1),
  purpose: z.enum([
    'crm_processing',
    'marketing',
    'ai_mcp_processing',
    'cross_border_sync',
  ]),
  lawfulBasis: z.enum([
    'consent',
    'contract',
    'legitimate_interest',
    'legal_obligation',
  ]),
  granted: z.boolean(),
  evidenceUrl: z.string().url().optional().or(z.literal('')),
});

function resolveClientIp(req: Request): string | null {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || null;
}

/**
 * GET /api/v1/compliance/popia/policies
 */
popiaRouter.get('/policies', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const policies = await getOrSeedPopiaRetentionPolicies(tenantId);
    res.json({ policies });
  } catch (err: any) {
    res.status(err.status || 500).json({
      error: err.message || 'Failed to load POPIA retention policies.',
    });
  }
});

/**
 * PUT /api/v1/compliance/popia/policies
 */
popiaRouter.put('/policies', async (req: Request, res: Response) => {
  try {
    const parsed = putPoliciesBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Invalid POPIA retention policy payload.',
        details: parsed.error.flatten(),
      });
      return;
    }

    const tenantId = req.user!.tenantId;
    const items = 'policies' in parsed.data ? parsed.data.policies : [parsed.data];
    const ipAddress = resolveClientIp(req);

    const updatedPolicies = await withPopiaRlsTx(tenantId, async (tx, tenantUuid) => {
      const results = [];
      for (const item of items) {
        const upserted = await tx.popiaRetentionPolicy.upsert({
          where: {
            tenantId_moduleName: {
              tenantId: tenantUuid,
              moduleName: item.moduleName,
            },
          },
          update: {
            retentionDays: item.retentionDays,
            actionOnExpiry: item.actionOnExpiry,
            isActive: item.isActive,
          },
          create: {
            tenantId: tenantUuid,
            moduleName: item.moduleName,
            retentionDays: item.retentionDays,
            actionOnExpiry: item.actionOnExpiry,
            isActive: item.isActive,
          },
        });
        results.push(upserted);
      }

      await tx.popiaAuditLog.create({
        data: {
          tenantId: tenantUuid,
          actorUserId: req.user!.userId,
          actorAgent: 'human',
          action: 'CONSENT_CHANGE',
          entityType: 'popia_retention_policy',
          entityId: items.map((i) => i.moduleName).join(','),
          fieldsAccessed: {
            updatedModules: items,
          },
          ipAddress,
        },
      });

      return results;
    });

    res.json({
      success: true,
      policies: updatedPolicies,
    });
  } catch (err: any) {
    res.status(err.status || 500).json({
      error: err.message || 'Failed to update POPIA retention policies.',
    });
  }
});

/**
 * GET /api/v1/compliance/popia/audit-logs
 */
popiaRouter.get('/audit-logs', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const actionFilter = typeof req.query.action === 'string' ? req.query.action.trim() : '';
    const agentFilter = typeof req.query.actorAgent === 'string' ? req.query.actorAgent.trim() : '';
    const entityTypeFilter =
      typeof req.query.entityType === 'string' ? req.query.entityType.trim() : '';
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 500);
    const offset = Math.max(Number(req.query.offset) || 0, 0);

    const payload = await withPopiaRlsTx(tenantId, async (tx, tenantUuid) => {
      const whereClause: any = {
        tenantId: tenantUuid,
        ...(actionFilter ? { action: actionFilter } : {}),
        ...(agentFilter ? { actorAgent: agentFilter } : {}),
        ...(entityTypeFilter ? { entityType: entityTypeFilter } : {}),
        ...(search
          ? {
              OR: [
                { entityId: { contains: search, mode: 'insensitive' } },
                { entityType: { contains: search, mode: 'insensitive' } },
                { actorUserId: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      };

      const [logs, total] = await Promise.all([
        tx.popiaAuditLog.findMany({
          where: whereClause,
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        tx.popiaAuditLog.count({ where: whereClause }),
      ]);

      return { logs, total, limit, offset };
    });

    res.json(payload);
  } catch (err: any) {
    res.status(err.status || 500).json({
      error: err.message || 'Failed to fetch immutable POPIA audit logs.',
    });
  }
});

/**
 * POST /api/v1/compliance/popia/dsr/export
 */
popiaRouter.post('/dsr/export', async (req: Request, res: Response) => {
  try {
    const parsed = dsrExportSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Invalid Data Subject Export request.',
        details: parsed.error.flatten(),
      });
      return;
    }

    const result = await exportSubjectData(
      req.user!.tenantId,
      parsed.data.subjectType,
      parsed.data.subjectId,
      {
        actorUserId: req.user!.userId,
        actorAgent: 'human',
        ipAddress: resolveClientIp(req),
      }
    );

    res.json(result);
  } catch (err: any) {
    res.status(err.status || 500).json({
      error: err.message || 'Failed to execute POPIA Section 23 Data Subject Export.',
    });
  }
});

/**
 * POST /api/v1/compliance/popia/dsr/erase
 */
popiaRouter.post('/dsr/erase', async (req: Request, res: Response) => {
  try {
    const parsed = dsrEraseSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Invalid Data Subject Erasure request.',
        details: parsed.error.flatten(),
      });
      return;
    }

    const result = await executeRightToErasure(
      req.user!.tenantId,
      parsed.data.subjectType,
      parsed.data.subjectId,
      req.user!.userId,
      {
        actorAgent: 'human',
        ipAddress: resolveClientIp(req),
        reason: parsed.data.reason,
        preferHardDeleteWhenUnlinked: parsed.data.preferHardDeleteWhenUnlinked,
      }
    );

    res.json(result);
  } catch (err: any) {
    res.status(err.status || 500).json({
      error: err.message || 'Failed to execute POPIA Section 24 Right to Erasure.',
    });
  }
});

/**
 * GET /api/v1/compliance/popia/consents
 */
popiaRouter.get('/consents', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const subjectId = typeof req.query.subjectId === 'string' ? req.query.subjectId.trim() : '';

    const consents = await withPopiaRlsTx(tenantId, async (tx, tenantUuid) => {
      return tx.popiaConsentRecord.findMany({
        where: {
          tenantId: tenantUuid,
          ...(subjectId ? { subjectId } : {}),
        },
        orderBy: { capturedAt: 'desc' },
        take: 100,
      });
    });

    res.json({ consents });
  } catch (err: any) {
    res.status(err.status || 500).json({
      error: err.message || 'Failed to query POPIA consent records.',
    });
  }
});

/**
 * POST /api/v1/compliance/popia/consents
 */
popiaRouter.post('/consents', async (req: Request, res: Response) => {
  try {
    const parsed = consentMutationSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Invalid consent record payload.',
        details: parsed.error.flatten(),
      });
      return;
    }

    const tenantId = req.user!.tenantId;
    const ipAddress = resolveClientIp(req);
    const now = new Date();

    const consent = await withPopiaRlsTx(tenantId, async (tx, tenantUuid) => {
      const created = await tx.popiaConsentRecord.create({
        data: {
          tenantId: tenantUuid,
          subjectType: parsed.data.subjectType,
          subjectId: parsed.data.subjectId,
          purpose: parsed.data.purpose,
          lawfulBasis: parsed.data.lawfulBasis,
          granted: parsed.data.granted,
          capturedAt: now,
          withdrawnAt: parsed.data.granted ? null : now,
          sourceIp: ipAddress,
          evidenceUrl: parsed.data.evidenceUrl || null,
        },
      });

      await tx.popiaAuditLog.create({
        data: {
          tenantId: tenantUuid,
          actorUserId: req.user!.userId,
          actorAgent: 'human',
          action: 'CONSENT_CHANGE',
          entityType: parsed.data.subjectType,
          entityId: parsed.data.subjectId,
          fieldsAccessed: {
            purpose: parsed.data.purpose,
            lawfulBasis: parsed.data.lawfulBasis,
            granted: parsed.data.granted,
          },
          ipAddress,
        },
      });

      return created;
    });

    res.status(201).json({ consent });
  } catch (err: any) {
    res.status(err.status || 500).json({
      error: err.message || 'Failed to record POPIA consent.',
    });
  }
});

/**
 * POST /api/v1/compliance/popia/retention/sweep
 * Manually trigger an immediate tenant-scoped POPIA retention sweep.
 */
popiaRouter.post('/retention/sweep', async (req: Request, res: Response) => {
  try {
    const summary = await runPopiaRetentionSweep(req.user!.tenantId);
    res.json({ success: true, summary });
  } catch (err: any) {
    res.status(err.status || 500).json({
      error: err.message || 'Failed to execute POPIA retention sweep.',
    });
  }
});

/**
 * GET /api/v1/compliance/popia/ai-governance
 * Retrieve tenant's POPIA Section 72 offshore AI / MCP processing toggle.
 */
popiaRouter.get('/ai-governance', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const allowOffshoreAiProcessing = await isOffshoreAiProcessingAllowed(tenantId);
    res.json({ tenantId, allowOffshoreAiProcessing });
  } catch (err: any) {
    res.status(500).json({
      error: err.message || 'Failed to load POPIA Section 72 AI governance settings.',
    });
  }
});

/**
 * PUT /api/v1/compliance/popia/ai-governance
 * Enable or disable cross-border MCP AI processing (`allowOffshoreAiProcessing`).
 */
popiaRouter.put('/ai-governance', async (req: Request, res: Response) => {
  try {
    const parsed = z
      .object({ allowOffshoreAiProcessing: z.boolean() })
      .safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: 'allowOffshoreAiProcessing boolean is required.' });
      return;
    }

    const tenantId = req.user!.tenantId;
    const updated = await setOffshoreAiProcessing(
      tenantId,
      parsed.data.allowOffshoreAiProcessing,
      req.user!.userId
    );

    await withPopiaRlsTx(tenantId, async (tx, tenantUuid) => {
      await tx.popiaAuditLog.create({
        data: {
          tenantId: tenantUuid,
          actorUserId: req.user!.userId,
          actorAgent: 'Auditor',
          action: 'CONSENT_CHANGE',
          entityType: 'mcp_ai_governance',
          entityId: tenantId,
          fieldsAccessed: {
            allowOffshoreAiProcessing: parsed.data.allowOffshoreAiProcessing,
            popiaSection: 'Section 72',
          },
          ipAddress: resolveClientIp(req),
        },
      });
    });

    res.json({ success: true, ...updated });
  } catch (err: any) {
    res.status(500).json({
      error: err.message || 'Failed to update POPIA Section 72 AI governance settings.',
    });
  }
});

export default popiaRouter;
