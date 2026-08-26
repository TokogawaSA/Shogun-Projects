import { Worker, Job } from 'bullmq';
import { createRedisConnection } from '../config/redis.js';
import { QUEUE_NAMES, ScheduledJobPayload } from '../queues/index.js';
import { prisma } from '../config/db.js';
import { withTenantTx } from '../utils/tenantTx.js';

export const INACTIVITY_THRESHOLD_DAYS = 45;

export interface ClientHealthReport {
  tenantsProcessed: number;
  accountsScanned: number;
  accountsAtRisk: number;
  retentionTasksCreated: number;
  details: Array<{
    tenantId: string;
    accountId: string;
    accountName: string;
    daysInactive: number;
    retentionTaskId?: string;
  }>;
}

/**
 * Scan active client accounts across tenants and flag churn risks (> 45 days inactive)
 */
export async function evaluateClientHealthAcrossTenants(specificTenantId?: string): Promise<ClientHealthReport> {
  console.log('[HealthCheckWorker] Starting daily client health and retention risk evaluation...');

  const report: ClientHealthReport = {
    tenantsProcessed: 0,
    accountsScanned: 0,
    accountsAtRisk: 0,
    retentionTasksCreated: 0,
    details: [],
  };

  const now = Date.now();
  const thresholdMs = INACTIVITY_THRESHOLD_DAYS * 24 * 60 * 60 * 1000;

  // 1. Fetch relevant tenants
  const tenants = specificTenantId
    ? await prisma.tenant.findMany({ where: { id: specificTenantId } })
    : await prisma.tenant.findMany();

  report.tenantsProcessed = tenants.length;

  for (const tenant of tenants) {
    const tenantId = tenant.id;

    await withTenantTx(tenantId, async (tx) => {
      // Find a default system user for task creation
      const defaultUser = await tx.user.findFirst({ where: { tenantId } });
      const systemUserId = defaultUser?.id || 'usr-system';

      // 2. Fetch all active accounts
      const activeAccounts = await tx.account.findMany({
        where: {
          tenantId,
          OR: [
            { customFields: { path: ['status'], equals: 'active_client' } },
            { customFields: { path: ['lifecycle_stage'], equals: 'customer' } },
            { rating: 'active' },
            { rating: 'hot' },
            { rating: 'warm' },
          ],
        },
        include: {
          projects: {
            orderBy: { updatedAt: 'desc' },
            take: 1,
            select: { id: true, title: true, updatedAt: true },
          },
          deals: {
            orderBy: { updatedAt: 'desc' },
            take: 1,
            select: { id: true, updatedAt: true },
          },
        },
      });

      report.accountsScanned += activeAccounts.length;

      for (const account of activeAccounts) {
        // Calculate last activity timestamp
        const accountUpdatedMs = new Date(account.updatedAt || account.createdAt).getTime();
        const projectUpdatedMs = account.projects[0] ? new Date(account.projects[0].updatedAt).getTime() : 0;
        const dealUpdatedMs = account.deals[0] ? new Date(account.deals[0].updatedAt).getTime() : 0;

        const mostRecentActivityMs = Math.max(accountUpdatedMs, projectUpdatedMs, dealUpdatedMs);
        const daysInactive = Math.floor((now - mostRecentActivityMs) / (24 * 60 * 60 * 1000));

        if (now - mostRecentActivityMs > thresholdMs) {
          report.accountsAtRisk += 1;
          console.warn(`[HealthCheckWorker] Account ${account.id} ("${account.accountName}") inactive for ${daysInactive} days. Escalating to churn_risk.`);

          // Update Account customFields / status to churn_risk
          const currentCustomFields = (account.customFields as Record<string, any>) || {};
          await tx.account.update({
            where: { id: account.id },
            data: {
              rating: 'cold',
              customFields: {
                ...currentCustomFields,
                status: 'churn_risk',
                last_health_check: new Date().toISOString(),
                churn_risk_flagged_at: new Date().toISOString(),
              },
            },
          });

          // Provision retention task in account's primary project if available
          let targetProjectId: string | undefined = account.projects[0]?.id;
          if (!targetProjectId) {
            // Find any active project in tenant
            const generalProject = await tx.project.findFirst({
              where: { tenantId },
              orderBy: { createdAt: 'desc' },
            });
            targetProjectId = generalProject?.id;
          }

          let createdTaskId: string | undefined;
          const assignedProjectId = targetProjectId;

          if (assignedProjectId) {
            const retentionTask = await tx.task.create({
              data: {
                tenantId,
                projectId: assignedProjectId,
                title: `Client Retention Review: ${account.accountName} (Churn Risk)`,
                description: `Account has shown 0 project or deal activity for ${daysInactive} days (> 45-day SLA ceiling). Schedule executive check-in and review accounts receivable.`,
                status: 'todo',
                priority: 'urgent',
                category: 'Client Interface',
                assignedAgent: 'Auditor',
                creatorId: systemUserId,
                dueDate: new Date(Date.now() + 48 * 3600 * 1000), // 48h SLA
                progress: 0,
                relatedEntityType: 'account',
                relatedEntityId: account.id,
                checklistSubtasks: {
                  create: [
                    { title: 'Audit last delivered milestones and open support tickets', completed: false },
                    { title: 'Schedule stakeholder check-in call with client owner', completed: false },
                  ],
                },
              },
            });
            createdTaskId = retentionTask.id;
            report.retentionTasksCreated += 1;
          }

          // Log Activity Entry
          await tx.entityActivityLog.create({
            data: {
              tenantId,
              moduleName: 'accounts',
              entityId: account.id,
              action: 'status_changed',
              userId: systemUserId,
              description: `Client Health Alert: Account flagged as Churn Risk (inactive for ${daysInactive} days)`,
              fieldChanges: {
                rating: { to: 'cold' },
                daysInactive,
                thresholdDays: INACTIVITY_THRESHOLD_DAYS,
                retentionTaskId: createdTaskId,
              },
            },
          });

          report.details.push({
            tenantId,
            accountId: account.id,
            accountName: account.accountName,
            daysInactive,
            retentionTaskId: createdTaskId,
          });
        }
      }
    });
  }

  console.log(`[HealthCheckWorker] Health evaluation completed. Scanned: ${report.accountsScanned}, At Risk: ${report.accountsAtRisk}`);
  return report;
}

/**
 * Initialize BullMQ Scheduled Jobs Worker
 */
export function createHealthCheckWorker(concurrency = 2): Worker {
  const worker = new Worker(
    QUEUE_NAMES.SCHEDULED_JOBS,
    async (job: Job) => {
      console.log(`[ScheduledJobsWorker] Processing job ${job.id} (${job.name})...`);

      switch (job.name) {
        case 'daily_client_health': {
          const payload = job.data as ScheduledJobPayload;
          return await evaluateClientHealthAcrossTenants(payload.tenantId);
        }
        default:
          console.warn(`[ScheduledJobsWorker] Unrecognized scheduled job name: ${job.name}`);
          return { skipped: true };
      }
    },
    {
      connection: createRedisConnection(),
      concurrency,
    }
  );

  worker.on('completed', (job) => {
    console.log(`[ScheduledJobsWorker] Job ${job.id} (${job.name}) completed successfully.`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[ScheduledJobsWorker] Job ${job?.id} (${job?.name}) failed:`, err.message);
  });

  worker.on('error', (err) => {
    // Suppress unhandled crash when Redis is offline
    console.warn('[ScheduledJobsWorker Warning] Redis connection issue:', err.message);
  });

  return worker;
}

export default createHealthCheckWorker;
