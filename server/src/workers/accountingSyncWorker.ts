import { Worker, Job } from 'bullmq';
import { createRedisConnection } from '../config/redis.js';
import {
  QUEUE_NAMES,
  type AccountingSyncJobPayload,
  type AccountingDomainEventName,
} from '../queues/index.js';
import { withTenantTx } from '../utils/tenantTx.js';
import {
  createAccountingAdapter,
  type AccountingProvider,
} from '../modules/accounting/index.js';

export interface AccountingSyncExecutionRecord {
  id: string;
  tenantId: string;
  eventType: AccountingDomainEventName;
  provider: AccountingProvider;
  targetId: string;
  externalAccountingId?: string;
  status: 'SUCCEEDED' | 'FAILED';
  error?: string;
  timestamp: string;
}

// Ring buffer of recent sync executions for live Admin UI queue telemetry
const recentSyncHistory: AccountingSyncExecutionRecord[] = [];

export function getRecentAccountingSyncHistory(
  tenantId: string,
  limit = 50
): AccountingSyncExecutionRecord[] {
  return recentSyncHistory
    .filter((r) => r.tenantId === tenantId)
    .slice(0, limit);
}

function pushSyncHistory(record: AccountingSyncExecutionRecord): void {
  recentSyncHistory.unshift(record);
  if (recentSyncHistory.length > 300) {
    recentSyncHistory.length = 300;
  }
}

/**
 * Execute an idempotent outbound accounting sync across `invoice.issued`, `invoice.paid`,
 * or `expense.approved` domain events, updating `TaxInvoice.externalAccountingId` and
 * `TenantAccountingConnection` sync status.
 */
export async function executeAccountingDomainSync(
  eventName: AccountingDomainEventName,
  payload: AccountingSyncJobPayload,
  fetchImpl?: typeof fetch
): Promise<{
  synced: boolean;
  provider: AccountingProvider;
  externalAccountingId?: string;
}> {
  const tenantId = payload.tenantId;

  // Resolve active TenantAccountingConnection (prefer explicit payload.provider, else first active connection)
  const activeConnection = await withTenantTx(tenantId, async (tx) => {
    if (payload.provider) {
      const exact = await tx.tenantAccountingConnection.findUnique({
        where: {
          tenantId_provider: {
            tenantId,
            provider: payload.provider,
          },
        },
      });
      if (exact && exact.isActive) return exact;
    }

    return tx.tenantAccountingConnection.findFirst({
      where: { tenantId, isActive: true },
      orderBy: { updatedAt: 'desc' },
    });
  });

  const provider: AccountingProvider =
    (activeConnection?.provider as AccountingProvider) ||
    payload.provider ||
    'SAGE_ZA';

  // Graceful staging fallback if tenant has not yet connected live Sage SA / Xero credentials
  if (!activeConnection) {
    if (payload.taxInvoiceId) {
      const stagedExternalId = `${provider.toLowerCase()}-staged-${(
        payload.merchantTransactionId || payload.taxInvoiceId
      ).toLowerCase()}`;
      await withTenantTx(tenantId, async (tx) => {
        await tx.taxInvoice.updateMany({
          where: { id: payload.taxInvoiceId, tenantId },
          data: {
            externalAccountingProvider: provider,
            externalAccountingId: stagedExternalId,
            lastSyncedAt: new Date(),
          },
        });
      });
      return { synced: true, provider, externalAccountingId: stagedExternalId };
    }
    return { synced: false, provider };
  }

  const adapter = createAccountingAdapter(provider, fetchImpl);

  try {
    await withTenantTx(tenantId, async (tx) => {
      await tx.tenantAccountingConnection.update({
        where: { id: activeConnection.id },
        data: { lastSyncStatus: 'SYNCING', lastSyncError: null },
      });
    });

    let externalAccountingId: string | undefined;

    if (eventName === 'expense.approved') {
      if (!payload.projectId) {
        throw new Error('expense.approved event requires projectId.');
      }
      await adapter.pushApprovedExpenses(tenantId, payload.projectId);
      externalAccountingId = `expenses-${payload.projectId}`;
    } else {
      if (!payload.taxInvoiceId) {
        throw new Error(`${eventName} event requires taxInvoiceId.`);
      }

      const invoiceData = await withTenantTx(tenantId, async (tx) => {
        return tx.taxInvoice.findFirst({
          where: { id: payload.taxInvoiceId, tenantId },
          include: {
            account: true,
            quote: { include: { lineItems: true } },
          },
        });
      });

      if (!invoiceData) {
        throw new Error(`TaxInvoice "${payload.taxInvoiceId}" not found.`);
      }

      const adapterInvoiceInput = {
        id: invoiceData.id,
        invoiceNumber: invoiceData.invoiceNumber,
        currency: invoiceData.currency,
        taxMode: (invoiceData.quote?.taxMode as any) || 'EXCLUSIVE',
        subtotalExclVat: invoiceData.subtotalExclVat,
        vatAmount: invoiceData.vatAmount,
        totalInclVat: invoiceData.totalInclVat,
        dueDate: invoiceData.dueDate,
        issueDate: invoiceData.createdAt,
        externalAccountingId: invoiceData.externalAccountingId,
        account: invoiceData.account,
        lineItems: invoiceData.quote?.lineItems.map((li) => ({
          description: li.productName,
          quantity: li.quantity,
          unitPrice: li.unitPrice,
          discountAmount: li.discountAmount,
          taxRatePercent: li.taxRatePercent,
        })),
      };

      // Idempotently ensure the TaxInvoice exists in Sage SA / Xero first
      let extInvId = invoiceData.externalAccountingId || undefined;
      if (!extInvId || eventName === 'invoice.issued') {
        extInvId = await adapter.pushTaxInvoice(tenantId, adapterInvoiceInput);
        adapterInvoiceInput.externalAccountingId = extInvId;
      }

      if (eventName === 'invoice.paid' || eventName === 'sync_invoice_payment') {
        const paymentTx = payload.paymentTransactionId
          ? await withTenantTx(tenantId, async (tx) =>
            tx.paymentTransaction.findFirst({
              where: { id: payload.paymentTransactionId, tenantId },
            })
          )
          : null;

        await adapter.recordInvoicePayment(tenantId, adapterInvoiceInput, {
          id: paymentTx?.id || `pmt-${Date.now()}`,
          merchantTransactionId:
            payload.merchantTransactionId ||
            paymentTx?.merchantTransactionId ||
            invoiceData.invoiceNumber,
          amount: paymentTx?.amount ?? payload.amountPaid ?? invoiceData.amountPaid,
          currency: paymentTx?.currency || invoiceData.currency,
          paymentMethod: paymentTx?.paymentMethod,
          settledAt: paymentTx?.settledAt || payload.settledAt || new Date(),
        });
      }

      externalAccountingId = extInvId;

      await withTenantTx(tenantId, async (tx) => {
        await tx.taxInvoice.update({
          where: { id: invoiceData.id },
          data: {
            externalAccountingProvider: provider,
            externalAccountingId: extInvId,
            lastSyncedAt: new Date(),
          },
        });
      });
    }

    await withTenantTx(tenantId, async (tx) => {
      await tx.tenantAccountingConnection.update({
        where: { id: activeConnection.id },
        data: {
          lastSyncStatus: 'SUCCEEDED',
          lastSyncError: null,
          lastSyncedAt: new Date(),
        },
      });
    });

    pushSyncHistory({
      id: `sync-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      tenantId,
      eventType: eventName,
      provider,
      targetId: payload.taxInvoiceId || payload.projectId || 'unknown',
      externalAccountingId,
      status: 'SUCCEEDED',
      timestamp: new Date().toISOString(),
    });

    return { synced: true, provider, externalAccountingId };
  } catch (err: any) {
    await withTenantTx(tenantId, async (tx) => {
      await tx.tenantAccountingConnection.update({
        where: { id: activeConnection.id },
        data: {
          lastSyncStatus: 'FAILED',
          lastSyncError: err.message || 'Unknown accounting sync error',
        },
      });
    });

    pushSyncHistory({
      id: `sync-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      tenantId,
      eventType: eventName,
      provider,
      targetId: payload.taxInvoiceId || payload.projectId || 'unknown',
      status: 'FAILED',
      error: err.message,
      timestamp: new Date().toISOString(),
    });

    throw err;
  }
}

/**
 * Backward-compatible helper invoked by Peach webhook flow.
 */
export async function processAccountingPaymentSync(payload: AccountingSyncJobPayload) {
  const res = await executeAccountingDomainSync('invoice.paid', payload);
  return {
    synced: res.synced,
    externalAccountingId: res.externalAccountingId || '',
  };
}

/**
 * BullMQ Accounting Sync Worker with Sage SA rate-limiting (`max: 60, duration: 60000`)
 * and 5-attempt exponential backoff.
 */
export function createAccountingSyncWorker(concurrency = 2): Worker {
  const worker = new Worker(
    QUEUE_NAMES.ACCOUNTING_SYNC,
    async (job: Job<AccountingSyncJobPayload>) => {
      const eventName = (job.data.eventType || job.name || 'invoice.paid') as AccountingDomainEventName;
      console.log(
        `[AccountingSyncWorker] Processing ${eventName} for tenant ${job.data.tenantId} (attempt ${job.attemptsMade + 1}/5)...`
      );
      return executeAccountingDomainSync(eventName, job.data);
    },
    {
      connection: createRedisConnection(),
      concurrency,
      // Respect Sage South Africa API ceiling (max 100 req/min, max 5,000 req/day)
      limiter: {
        max: 60,
        duration: 60_000,
      },
    }
  );

  worker.on('completed', (job) => {
    console.log(`[AccountingSyncWorker] Job ${job.id} (${job.name}) completed.`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[AccountingSyncWorker] Job ${job?.id} (${job?.name}) failed:`, err.message);
  });

  worker.on('error', (err) => {
    console.warn('[AccountingSyncWorker Warning] Redis connection issue:', err.message);
  });

  return worker;
}

export default createAccountingSyncWorker;
