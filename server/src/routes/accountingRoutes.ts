import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireTenantAdmin } from '../middleware/auth.js';
import { withTenantTx } from '../utils/tenantTx.js';
import {
  encryptAccountingCredentials,
  decryptAccountingCredentials,
  maskAccountingCredentials,
  createAccountingAdapter,
  type AccountingProvider,
} from '../modules/accounting/index.js';
import {
  enqueueAccountingSyncJob,
  getAccountingSyncQueue,
  type AccountingDomainEventName,
} from '../queues/index.js';
import {
  executeAccountingDomainSync,
  getRecentAccountingSyncHistory,
} from '../workers/accountingSyncWorker.js';

export const accountingRouter = Router();

accountingRouter.use(requireTenantAdmin);

const upsertConnectionSchema = z.object({
  isActive: z.boolean().default(true),
  defaultSalesAccountCode: z.string().trim().min(1).default('200'),
  defaultVatTaxTypeId: z.string().trim().min(1).default('OUTPUT3'),
  credentials: z.record(z.any()).optional(),
});

const retrySyncSchema = z.object({
  eventType: z
    .enum(['invoice.issued', 'invoice.paid', 'expense.approved'])
    .default('invoice.issued'),
  taxInvoiceId: z.string().trim().optional(),
  projectId: z.string().trim().optional(),
  provider: z.enum(['SAGE_ZA', 'XERO']).optional(),
});

/**
 * GET /api/v1/accounting/connections
 */
accountingRouter.get('/connections', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const rows = await withTenantTx(tenantId, async (tx) => {
      return tx.tenantAccountingConnection.findMany({
        where: { tenantId },
        orderBy: { provider: 'asc' },
      });
    });

    const sanitized = rows.map((row) => {
      let maskedCredentials: Record<string, string> = {};
      try {
        const decrypted = decryptAccountingCredentials<Record<string, any>>(
          row.encryptedCredentials
        );
        maskedCredentials = maskAccountingCredentials(decrypted);
      } catch {
        maskedCredentials = {};
      }

      const { encryptedCredentials: _hidden, ...publicFields } = row;
      return {
        ...publicFields,
        maskedCredentials,
      };
    });

    res.json({ connections: sanitized });
  } catch (err: any) {
    res.status(500).json({
      error: err.message || 'Failed to load accounting connections.',
    });
  }
});

/**
 * PUT /api/v1/accounting/connections/:provider
 */
accountingRouter.put('/connections/:provider', async (req: Request, res: Response) => {
  try {
    const providerParam = String(req.params.provider || '').toUpperCase();
    if (providerParam !== 'SAGE_ZA' && providerParam !== 'XERO') {
      res.status(400).json({ error: 'Provider must be SAGE_ZA or XERO.' });
      return;
    }

    const parsed = upsertConnectionSchema.safeParse(req.body || {});
    if (!parsed.success) {
      res.status(400).json({
        error: 'Invalid accounting connection configuration.',
        details: parsed.error.flatten(),
      });
      return;
    }

    const tenantId = req.user!.tenantId;
    const provider = providerParam as AccountingProvider;

    const saved = await withTenantTx(tenantId, async (tx) => {
      const existing = await tx.tenantAccountingConnection.findUnique({
        where: { tenantId_provider: { tenantId, provider } },
      });

      let mergedCreds: Record<string, unknown> = {};
      if (existing) {
        try {
          mergedCreds = decryptAccountingCredentials<Record<string, unknown>>(
            existing.encryptedCredentials
          );
        } catch {
          mergedCreds = {};
        }
      }

      if (parsed.data.credentials) {
        for (const [k, v] of Object.entries(parsed.data.credentials)) {
          if (v !== undefined && v !== '' && !String(v).startsWith('••••')) {
            mergedCreds[k] = v;
          }
        }
      }

      const encryptedCredentials = encryptAccountingCredentials(mergedCreds);

      return tx.tenantAccountingConnection.upsert({
        where: { tenantId_provider: { tenantId, provider } },
        create: {
          tenantId,
          provider,
          isActive: parsed.data.isActive,
          encryptedCredentials,
          defaultSalesAccountCode: parsed.data.defaultSalesAccountCode,
          defaultVatTaxTypeId: parsed.data.defaultVatTaxTypeId,
          lastSyncStatus: 'IDLE',
        },
        update: {
          isActive: parsed.data.isActive,
          encryptedCredentials,
          defaultSalesAccountCode: parsed.data.defaultSalesAccountCode,
          defaultVatTaxTypeId: parsed.data.defaultVatTaxTypeId,
        },
      });
    });

    const { encryptedCredentials: _hidden, ...publicSaved } = saved;
    res.json({ success: true, connection: publicSaved });
  } catch (err: any) {
    res.status(500).json({
      error: err.message || 'Failed to save accounting connection.',
    });
  }
});

/**
 * POST /api/v1/accounting/connections/:provider/test
 */
accountingRouter.post(
  '/connections/:provider/test',
  async (req: Request, res: Response) => {
    try {
      const providerParam = String(req.params.provider || '').toUpperCase();
      if (providerParam !== 'SAGE_ZA' && providerParam !== 'XERO') {
        res.status(400).json({ error: 'Provider must be SAGE_ZA or XERO.' });
        return;
      }

      const tenantId = req.user!.tenantId;
      const adapter = createAccountingAdapter(providerParam as AccountingProvider);
      const result = await adapter.testConnection(tenantId);

      await withTenantTx(tenantId, async (tx) => {
        await tx.tenantAccountingConnection.updateMany({
          where: { tenantId, provider: providerParam },
          data: { lastSyncStatus: 'SUCCEEDED', lastSyncError: null },
        });
      });

      res.json(result);
    } catch (err: any) {
      await withTenantTx(req.user!.tenantId, async (tx) => {
        await tx.tenantAccountingConnection.updateMany({
          where: { tenantId: req.user!.tenantId, provider: String(req.params.provider).toUpperCase() },
          data: { lastSyncStatus: 'FAILED', lastSyncError: err.message },
        });
      }).catch(() => {});

      res.status(400).json({
        ok: false,
        error: err.message || 'Connection test failed.',
      });
    }
  }
);

/**
 * GET /api/v1/accounting/queue-monitor
 */
accountingRouter.get('/queue-monitor', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;

    let queueCounts = { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 };
    try {
      const q = getAccountingSyncQueue();
      const counts = await Promise.race([
        q.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed'),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 350)),
      ]);
      if (counts) {
        queueCounts = {
          waiting: counts.waiting || 0,
          active: counts.active || 0,
          completed: counts.completed || 0,
          failed: counts.failed || 0,
          delayed: counts.delayed || 0,
        };
      }
    } catch {
      // Redis offline fallback
    }

    const invoices = await withTenantTx(tenantId, async (tx) => {
      return tx.taxInvoice.findMany({
        where: { tenantId },
        orderBy: { updatedAt: 'desc' },
        take: 25,
      });
    });

    const history = getRecentAccountingSyncHistory(tenantId, 30);

    res.json({
      rateLimiter: { maxPerMinute: 60, maxPerDaySageZa: 5000, retryAttempts: 5 },
      queueCounts,
      recentHistory: history,
      invoices,
    });
  } catch (err: any) {
    res.status(500).json({
      error: err.message || 'Failed to load accounting sync queue monitor.',
    });
  }
});

/**
 * POST /api/v1/accounting/sync/retry
 */
accountingRouter.post('/sync/retry', async (req: Request, res: Response) => {
  try {
    const parsed = retrySyncSchema.safeParse(req.body || {});
    if (!parsed.success) {
      res.status(400).json({
        error: 'Invalid sync retry payload.',
        details: parsed.error.flatten(),
      });
      return;
    }

    const tenantId = req.user!.tenantId;
    const payload = {
      eventType: parsed.data.eventType as AccountingDomainEventName,
      tenantId,
      taxInvoiceId: parsed.data.taxInvoiceId,
      projectId: parsed.data.projectId,
      provider: parsed.data.provider ?? null,
    };

    try {
      await enqueueAccountingSyncJob(payload, `manual-retry-${Date.now()}`);
    } catch {
      // Execute inline immediately if Redis queue is offline
      const directResult = await executeAccountingDomainSync(
        payload.eventType,
        payload
      );
      res.json({ success: true, mode: 'direct', ...directResult });
      return;
    }

    res.json({ success: true, mode: 'queued' });
  } catch (err: any) {
    res.status(400).json({
      error: err.message || 'Manual sync retry failed.',
    });
  }
});

export default accountingRouter;
