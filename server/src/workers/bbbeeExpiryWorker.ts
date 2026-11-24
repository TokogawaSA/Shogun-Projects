import { Worker, Queue, Job } from 'bullmq';
import { createRedisConnection } from '../config/redis.js';
import { prisma } from '../config/db.js';
import { QUEUE_NAMES, enqueueEmailJob } from '../queues/index.js';
import { withTenantTx } from '../utils/tenantTx.js';

export const BBBEE_ALERT_LEAD_DAYS = 30;

export interface BbbeeExpirySweepReport {
  tenantsProcessed: number;
  expiringAccountsDetected: number;
  ownerAlertsSent: number;
  renewalTasksCreated: number;
  alerts: Array<{
    tenantId: string;
    accountId: string;
    accountName: string;
    bbbeeLevel: number | null;
    bbbeeExpiryDate: string;
    daysUntilExpiry: number;
    ownerEmail: string | null;
  }>;
}

/**
 * Scan all active tenants for Accounts whose `bbbeeExpiryDate` lapses within the next 30 days
 * and alert the assigned Account Owner via email queue + CRM activity/task tracking.
 */
export async function runBbbeeExpiryAlertSweep(
  specificTenantId?: string,
  referenceDate: Date = new Date()
): Promise<BbbeeExpirySweepReport> {
  const report: BbbeeExpirySweepReport = {
    tenantsProcessed: 0,
    expiringAccountsDetected: 0,
    ownerAlertsSent: 0,
    renewalTasksCreated: 0,
    alerts: [],
  };

  const windowStart = referenceDate;
  const windowEnd = new Date(
    referenceDate.getTime() + BBBEE_ALERT_LEAD_DAYS * 24 * 60 * 60 * 1000
  );

  const tenants = specificTenantId
    ? await prisma.tenant.findMany({ where: { id: specificTenantId } })
    : await prisma.tenant.findMany();

  report.tenantsProcessed = tenants.length;

  for (const tenant of tenants) {
    const tenantId = tenant.id;

    await withTenantTx(tenantId, async (tx) => {
      const expiringAccounts = await tx.account.findMany({
        where: {
          tenantId,
          bbbeeExpiryDate: {
            gte: windowStart,
            lte: windowEnd,
          },
        },
        include: {
          assignedUser: {
            select: { id: true, email: true, displayName: true },
          },
          projects: {
            orderBy: { updatedAt: 'desc' },
            take: 1,
            select: { id: true },
          },
        },
      });

      for (const account of expiringAccounts) {
        if (!account.bbbeeExpiryDate) continue;
        report.expiringAccountsDetected += 1;

        const expiryIso = account.bbbeeExpiryDate.toISOString();
        const daysUntilExpiry = Math.max(
          0,
          Math.ceil(
            (account.bbbeeExpiryDate.getTime() - referenceDate.getTime()) /
              (24 * 60 * 60 * 1000)
          )
        );

        const ownerEmail = account.assignedUser?.email ?? null;
        const ownerId = account.assignedUser?.id ?? account.createdById;

        if (ownerEmail) {
          try {
            await enqueueEmailJob(
              {
                tenantId,
                to: ownerEmail,
                subject: `[B-BBEE Expiry Alert] ${account.accountName} certificate expires in ${daysUntilExpiry} day(s)`,
                bodyText: `South African B2B Compliance Notice: ${account.accountName} (${account.accountNumber}) holds B-BBEE Level ${account.bbbeeLevel ?? 'N/A'} expiring on ${expiryIso.slice(0, 10)} (${daysUntilExpiry} day(s) remaining). Please request an updated SANAS/CIPC B-BBEE affidavit or verification certificate to maintain preferential procurement compliance.`,
              },
              `bbbee-expiry-${account.id}-${expiryIso.slice(0, 10)}`
            );
            report.ownerAlertsSent += 1;
          } catch {
            // Redis may be offline in local dev; CRM activity log + task still persist inside PostgreSQL
          }
        }

        // Create deduplicated renewal task if a project exists for the account/tenant
        let targetProjectId: string | undefined = account.projects[0]?.id;
        if (!targetProjectId) {
          const fallbackProj = await tx.project.findFirst({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
            select: { id: true },
          });
          targetProjectId = fallbackProj?.id;
        }

        const resolvedProjectId = targetProjectId;
        if (resolvedProjectId) {
          const expectedTitle = `B-BBEE Certificate Renewal: ${account.accountName}`;
          const existingOpenTask = await tx.task.findFirst({
            where: {
              tenantId,
              relatedEntityType: 'account',
              relatedEntityId: account.id,
              title: expectedTitle,
              status: { notIn: ['done', 'completed'] },
            },
            select: { id: true },
          });

          if (!existingOpenTask) {
            await tx.task.create({
              data: {
                tenantId,
                projectId: resolvedProjectId,
                title: expectedTitle,
                description: `B-BBEE Level ${account.bbbeeLevel ?? 'N/A'} certificate for ${account.accountName} lapses on ${expiryIso.slice(0, 10)} (${daysUntilExpiry} days remaining). Obtain updated SANAS verification certificate or sworn affidavit.`,
                status: 'todo',
                priority: daysUntilExpiry <= 7 ? 'urgent' : 'high',
                category: 'Compliance',
                assignedAgent: 'Auditor',
                assigneeId: ownerId,
                creatorId: ownerId,
                dueDate: account.bbbeeExpiryDate,
                relatedEntityType: 'account',
                relatedEntityId: account.id,
              },
            });
            report.renewalTasksCreated += 1;
          }
        }

        await tx.entityActivityLog.create({
          data: {
            tenantId,
            moduleName: 'accounts',
            entityId: account.id,
            action: 'updated',
            userId: ownerId,
            description: `B-BBEE 30-Day Expiry Alert: Certificate expires on ${expiryIso.slice(0, 10)} (${daysUntilExpiry} days left).`,
            fieldChanges: {
              bbbeeLevel: account.bbbeeLevel,
              bbbeeExpiryDate: expiryIso,
              daysUntilExpiry,
            },
          },
        });

        report.alerts.push({
          tenantId,
          accountId: account.id,
          accountName: account.accountName,
          bbbeeLevel: account.bbbeeLevel,
          bbbeeExpiryDate: expiryIso,
          daysUntilExpiry,
          ownerEmail,
        });
      }
    });
  }

  return report;
}

let _bbbeeQueue: Queue | null = null;

export function getBbbeeExpiryQueue(): Queue {
  if (!_bbbeeQueue) {
    _bbbeeQueue = new Queue(QUEUE_NAMES.BBBEE_EXPIRY, {
      connection: createRedisConnection(),
    });
    _bbbeeQueue.on('error', (err) => {
      console.warn('[BbbeeExpiryQueue Warning]:', err.message);
    });
  }
  return _bbbeeQueue;
}

export async function scheduleDailyBbbeeExpiryCron(): Promise<void> {
  try {
    const queue = getBbbeeExpiryQueue();
    await queue.upsertJobScheduler(
      'daily-bbbee-expiry-reminder',
      {
        pattern: '0 7 * * *',
        tz: 'Africa/Johannesburg',
      },
      {
        name: 'bbbee.daily_expiry_check',
        data: { triggeredBy: 'cron' },
      }
    );
  } catch (err: any) {
    console.warn('[BbbeeExpiryWorker] Could not register repeatable cron job (Redis may be offline):', err.message);
  }
}

export function createBbbeeExpiryWorker(concurrency = 1): Worker {
  const worker = new Worker(
    QUEUE_NAMES.BBBEE_EXPIRY,
    async (job: Job<{ tenantId?: string }>) => {
      console.log(`[BbbeeExpiryWorker] Running 30-day B-BBEE expiry check job ${job.id}...`);
      return runBbbeeExpiryAlertSweep(job.data?.tenantId);
    },
    {
      connection: createRedisConnection(),
      concurrency,
    }
  );

  worker.on('completed', (job) => {
    console.log(`[BbbeeExpiryWorker] Job ${job.id} completed.`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[BbbeeExpiryWorker] Job ${job?.id} failed:`, err.message);
  });

  worker.on('error', (err) => {
    console.warn('[BbbeeExpiryWorker Warning] Redis connection issue:', err.message);
  });

  void scheduleDailyBbbeeExpiryCron();

  return worker;
}

export default createBbbeeExpiryWorker;
