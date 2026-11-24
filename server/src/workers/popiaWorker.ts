import { Prisma } from '@prisma/client';
import { Worker, Queue, Job } from 'bullmq';
import { createRedisConnection } from '../config/redis.js';
import { prisma } from '../config/db.js';
import { QUEUE_NAMES } from '../queues/index.js';
import { withTenantTx } from '../utils/tenantTx.js';
import { toTenantUuid, withPopiaRlsTx } from '../utils/popiaTenantRls.js';
import {
  SARS_STATUTORY_RETENTION_DAYS,
  scrubCustomFieldsPii,
} from '../services/popiaDsrService.js';

export interface PopiaRetentionSweepSummary {
  tenantsProcessed: number;
  policiesEvaluated: number;
  recordsAnonymized: number;
  recordsDeleted: number;
  auditLogsWritten: number;
  details: Array<{
    tenantId: string;
    moduleName: string;
    entityId: string;
    actionTaken: 'ANONYMIZE' | 'DELETE';
  }>;
}

const ACTIVE_DEAL_STAGES = ['prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won'];

/**
 * Automated Daily POPIA Retention Sweeper.
 * Iterates per active tenant inside `withTenantTx`, locates inactive records exceeding
 * `PopiaRetentionPolicy.retentionDays` where no active contract/project exists, scrubs PII
 * (or hard-deletes when permitted and outside SARS 5-year hold), and logs every action to `PopiaAuditLog`.
 */
export async function runPopiaRetentionSweep(
  specificTenantId?: string
): Promise<PopiaRetentionSweepSummary> {
  const summary: PopiaRetentionSweepSummary = {
    tenantsProcessed: 0,
    policiesEvaluated: 0,
    recordsAnonymized: 0,
    recordsDeleted: 0,
    auditLogsWritten: 0,
    details: [],
  };

  const tenants = specificTenantId
    ? await prisma.tenant.findMany({ where: { id: specificTenantId } })
    : await prisma.tenant.findMany();

  summary.tenantsProcessed = tenants.length;
  const now = new Date();
  const sarsCutoff = new Date(now.getTime() - SARS_STATUTORY_RETENTION_DAYS * 24 * 60 * 60 * 1000);

  for (const tenant of tenants) {
    const tenantId = tenant.id;
    const tenantUuid = toTenantUuid(tenantId);

    const activePolicies = await withPopiaRlsTx(tenantId, async (rlsTx, tUuid) => {
      return rlsTx.popiaRetentionPolicy.findMany({
        where: { tenantId: tUuid, isActive: true },
      });
    });

    if (activePolicies.length === 0) {
      continue;
    }

    summary.policiesEvaluated += activePolicies.length;

    const pendingAuditEntries: Array<{
      action: 'ANONYMIZE' | 'DELETE';
      entityType: string;
      entityId: string;
      fieldsAccessed: Record<string, unknown>;
    }> = [];

    await withTenantTx(tenantId, async (tx) => {
      for (const policy of activePolicies) {
        const cutoffDate = new Date(
          now.getTime() - policy.retentionDays * 24 * 60 * 60 * 1000
        );
        const isHardDelete = policy.actionOnExpiry === 'hard_delete';

        if (policy.moduleName === 'leads') {
          const expiredLeads = await tx.lead.findMany({
            where: {
              tenantId,
              isConverted: false,
              updatedAt: { lt: cutoffDate },
              NOT: { email: { endsWith: '@anonymized.local' } },
            },
          });

          for (const lead of expiredLeads) {
            if (isHardDelete) {
              await tx.lead.delete({ where: { id: lead.id } });
              summary.recordsDeleted += 1;
              summary.details.push({
                tenantId,
                moduleName: 'leads',
                entityId: lead.id,
                actionTaken: 'DELETE',
              });
              pendingAuditEntries.push({
                action: 'DELETE',
                entityType: 'lead',
                entityId: lead.id,
                fieldsAccessed: {
                  policyId: policy.id,
                  retentionDays: policy.retentionDays,
                  purgedFields: ['firstName', 'lastName', 'email', 'phone', 'mobile', 'customFields'],
                },
              });
            } else {
              await tx.lead.update({
                where: { id: lead.id },
                data: {
                  salutation: null,
                  firstName: 'Redacted',
                  lastName: 'Redacted',
                  company: 'Redacted',
                  title: null,
                  email: `redacted-${lead.id}@anonymized.local`,
                  secondaryEmail: null,
                  phone: null,
                  mobile: null,
                  street: null,
                  city: null,
                  state: null,
                  postalCode: null,
                  description: null,
                  customFields: scrubCustomFieldsPii(lead.customFields, {
                    popiaRetentionScrubbedAt: now.toISOString(),
                    policyId: policy.id,
                  }) as Prisma.InputJsonValue,
                },
              });
              summary.recordsAnonymized += 1;
              summary.details.push({
                tenantId,
                moduleName: 'leads',
                entityId: lead.id,
                actionTaken: 'ANONYMIZE',
              });
              pendingAuditEntries.push({
                action: 'ANONYMIZE',
                entityType: 'lead',
                entityId: lead.id,
                fieldsAccessed: {
                  policyId: policy.id,
                  retentionDays: policy.retentionDays,
                  scrubbedFields: ['firstName', 'lastName', 'email', 'phone', 'mobile', 'customFields'],
                },
              });
            }
          }
        } else if (policy.moduleName === 'contacts') {
          const expiredContacts = await tx.contact.findMany({
            where: {
              tenantId,
              updatedAt: { lt: cutoffDate },
              NOT: { email: { endsWith: '@anonymized.local' } },
              projects: { none: {} },
              deals: {
                none: {
                  stage: { in: ACTIVE_DEAL_STAGES },
                },
              },
            },
          });

          for (const contact of expiredContacts) {
            // Check SARS 5-year invoice legal hold via parent account projects
            const recentInvoiceCount = await tx.projectInvoice.count({
              where: {
                tenantId,
                issueDate: { gte: sarsCutoff },
                project: { accountId: contact.accountId },
              },
            });

            if (isHardDelete && recentInvoiceCount === 0) {
              await tx.contact.delete({ where: { id: contact.id } });
              summary.recordsDeleted += 1;
              summary.details.push({
                tenantId,
                moduleName: 'contacts',
                entityId: contact.id,
                actionTaken: 'DELETE',
              });
              pendingAuditEntries.push({
                action: 'DELETE',
                entityType: 'contact',
                entityId: contact.id,
                fieldsAccessed: {
                  policyId: policy.id,
                  retentionDays: policy.retentionDays,
                  purgedFields: ['firstName', 'lastName', 'email', 'phone', 'mobile', 'customFields'],
                },
              });
            } else {
              await tx.contact.update({
                where: { id: contact.id },
                data: {
                  salutation: null,
                  firstName: 'Redacted',
                  lastName: 'Redacted',
                  email: `redacted-${contact.id}@anonymized.local`,
                  secondaryEmail: null,
                  phone: null,
                  mobile: null,
                  jobTitle: null,
                  department: null,
                  mailingStreet: null,
                  mailingCity: null,
                  mailingState: null,
                  mailingPostalCode: null,
                  mailingCountry: null,
                  description: null,
                  customFields: scrubCustomFieldsPii(contact.customFields, {
                    popiaRetentionScrubbedAt: now.toISOString(),
                    policyId: policy.id,
                    sarsLegalHold: recentInvoiceCount > 0,
                  }) as Prisma.InputJsonValue,
                },
              });
              summary.recordsAnonymized += 1;
              summary.details.push({
                tenantId,
                moduleName: 'contacts',
                entityId: contact.id,
                actionTaken: 'ANONYMIZE',
              });
              pendingAuditEntries.push({
                action: 'ANONYMIZE',
                entityType: 'contact',
                entityId: contact.id,
                fieldsAccessed: {
                  policyId: policy.id,
                  retentionDays: policy.retentionDays,
                  sarsLegalHold: recentInvoiceCount > 0,
                  scrubbedFields: ['firstName', 'lastName', 'email', 'phone', 'mobile', 'customFields'],
                },
              });
            }
          }
        } else if (policy.moduleName === 'accounts') {
          const expiredAccounts = await tx.account.findMany({
            where: {
              tenantId,
              updatedAt: { lt: cutoffDate },
              projects: { none: {} },
              deals: {
                none: {
                  stage: { in: ACTIVE_DEAL_STAGES },
                },
              },
              OR: [
                { email: null, NOT: { accountName: { startsWith: 'Redacted' } } },
                { email: { not: { endsWith: '@anonymized.local' } } },
              ],
            },
          });

          for (const account of expiredAccounts) {
            if (isHardDelete) {
              await tx.account.delete({ where: { id: account.id } });
              summary.recordsDeleted += 1;
              summary.details.push({
                tenantId,
                moduleName: 'accounts',
                entityId: account.id,
                actionTaken: 'DELETE',
              });
              pendingAuditEntries.push({
                action: 'DELETE',
                entityType: 'account',
                entityId: account.id,
                fieldsAccessed: {
                  policyId: policy.id,
                  retentionDays: policy.retentionDays,
                },
              });
            } else {
              await tx.account.update({
                where: { id: account.id },
                data: {
                  accountName: `Redacted (${account.accountNumber})`,
                  email: `redacted-${account.id}@anonymized.local`,
                  primaryPhone: null,
                  secondaryPhone: null,
                  domain: null,
                  website: null,
                  billingStreet: null,
                  shippingStreet: null,
                  description: null,
                  customFields: scrubCustomFieldsPii(account.customFields, {
                    popiaRetentionScrubbedAt: now.toISOString(),
                    policyId: policy.id,
                  }) as Prisma.InputJsonValue,
                },
              });
              summary.recordsAnonymized += 1;
              summary.details.push({
                tenantId,
                moduleName: 'accounts',
                entityId: account.id,
                actionTaken: 'ANONYMIZE',
              });
              pendingAuditEntries.push({
                action: 'ANONYMIZE',
                entityType: 'account',
                entityId: account.id,
                fieldsAccessed: {
                  policyId: policy.id,
                  retentionDays: policy.retentionDays,
                  scrubbedFields: ['accountName', 'email', 'primaryPhone', 'secondaryPhone', 'customFields'],
                },
              });
            }
          }
        } else if (policy.moduleName === 'deals') {
          const expiredDeals = await tx.deal.findMany({
            where: {
              tenantId,
              updatedAt: { lt: cutoffDate },
              linkedProjectId: null,
              projects: { none: {} },
              stage: { notIn: ACTIVE_DEAL_STAGES },
              NOT: { dealName: { startsWith: 'Redacted Deal' } },
            },
          });

          for (const deal of expiredDeals) {
            if (isHardDelete) {
              await tx.deal.delete({ where: { id: deal.id } });
              summary.recordsDeleted += 1;
              summary.details.push({
                tenantId,
                moduleName: 'deals',
                entityId: deal.id,
                actionTaken: 'DELETE',
              });
              pendingAuditEntries.push({
                action: 'DELETE',
                entityType: 'deal',
                entityId: deal.id,
                fieldsAccessed: {
                  policyId: policy.id,
                  retentionDays: policy.retentionDays,
                  preservedFinancialAggregate: false,
                },
              });
            } else {
              await tx.deal.update({
                where: { id: deal.id },
                data: {
                  dealName: `Redacted Deal (${deal.dealNumber})`,
                  description: null,
                  contactId: null,
                  customFields: scrubCustomFieldsPii(deal.customFields, {
                    popiaRetentionScrubbedAt: now.toISOString(),
                    policyId: policy.id,
                  }) as Prisma.InputJsonValue,
                },
              });
              summary.recordsAnonymized += 1;
              summary.details.push({
                tenantId,
                moduleName: 'deals',
                entityId: deal.id,
                actionTaken: 'ANONYMIZE',
              });
              pendingAuditEntries.push({
                action: 'ANONYMIZE',
                entityType: 'deal',
                entityId: deal.id,
                fieldsAccessed: {
                  policyId: policy.id,
                  retentionDays: policy.retentionDays,
                  preservedFields: ['amount', 'currency', 'stage'],
                  scrubbedFields: ['dealName', 'description', 'contactId', 'customFields'],
                },
              });
            }
          }
        } else if (policy.moduleName === 'audit_logs') {
          // Scrub mutable system_audit_trail older than retentionDays (popia_audit_logs remains append-only immutable)
          const expiredTrail = await tx.auditTrailEntry.findMany({
            where: {
              tenantId,
              timestamp: { lt: cutoffDate },
              NOT: { performedBy: 'Redacted' },
            },
          });

          for (const entry of expiredTrail) {
            if (isHardDelete) {
              await tx.auditTrailEntry.delete({ where: { id: entry.id } });
              summary.recordsDeleted += 1;
              pendingAuditEntries.push({
                action: 'DELETE',
                entityType: 'system_audit_trail',
                entityId: entry.id,
                fieldsAccessed: { policyId: policy.id, retentionDays: policy.retentionDays },
              });
            } else {
              await tx.auditTrailEntry.update({
                where: { id: entry.id },
                data: {
                  performedBy: 'Redacted',
                  previousState: scrubCustomFieldsPii(entry.previousState) as Prisma.InputJsonValue,
                  newState: scrubCustomFieldsPii(entry.newState) as Prisma.InputJsonValue,
                },
              });
              summary.recordsAnonymized += 1;
              pendingAuditEntries.push({
                action: 'ANONYMIZE',
                entityType: 'system_audit_trail',
                entityId: entry.id,
                fieldsAccessed: {
                  policyId: policy.id,
                  retentionDays: policy.retentionDays,
                  scrubbedFields: ['performedBy', 'previousState', 'newState'],
                },
              });
            }
          }
        }
      }
    });

    if (pendingAuditEntries.length > 0) {
      await withPopiaRlsTx(tenantId, async (rlsTx) => {
        for (const audit of pendingAuditEntries) {
          await rlsTx.popiaAuditLog.create({
            data: {
              tenantId: tenantUuid,
              actorUserId: null,
              actorAgent: 'Worker',
              action: audit.action,
              entityType: audit.entityType,
              entityId: audit.entityId,
              fieldsAccessed: audit.fieldsAccessed as Prisma.InputJsonValue,
              ipAddress: null,
            },
          });
          summary.auditLogsWritten += 1;
        }
      });
    }
  }

  return summary;
}

let _popiaQueue: Queue | null = null;

export function getPopiaRetentionQueue(): Queue {
  if (!_popiaQueue) {
    _popiaQueue = new Queue(QUEUE_NAMES.POPIA_RETENTION, {
      connection: createRedisConnection(),
    });
    _popiaQueue.on('error', (err) => {
      console.warn('[PopiaRetentionQueue Warning]:', err.message);
    });
  }
  return _popiaQueue;
}

/**
 * Schedule the daily 02:00 SAST POPIA retention sweep repeatable BullMQ cron job.
 */
export async function scheduleDailyPopiaRetentionCron(): Promise<void> {
  try {
    const queue = getPopiaRetentionQueue();
    await queue.upsertJobScheduler(
      'daily-popia-retention-sweeper',
      {
        pattern: '0 2 * * *',
        tz: 'Africa/Johannesburg',
      },
      {
        name: 'popia.daily_retention_sweep',
        data: { triggeredBy: 'cron' },
      }
    );
  } catch (err: any) {
    console.warn('[PopiaRetentionWorker] Could not register repeatable cron job (Redis may be offline):', err.message);
  }
}

export function createPopiaRetentionWorker(concurrency = 1): Worker {
  const worker = new Worker(
    QUEUE_NAMES.POPIA_RETENTION,
    async (job: Job<{ tenantId?: string }>) => {
      console.log(`[PopiaRetentionWorker] Running POPIA retention sweep job ${job.id} (${job.name})...`);
      return runPopiaRetentionSweep(job.data?.tenantId);
    },
    {
      connection: createRedisConnection(),
      concurrency,
    }
  );

  worker.on('completed', (job) => {
    console.log(`[PopiaRetentionWorker] Job ${job.id} completed.`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[PopiaRetentionWorker] Job ${job?.id} failed:`, err.message);
  });

  worker.on('error', (err) => {
    console.warn('[PopiaRetentionWorker Warning] Redis connection issue:', err.message);
  });

  void scheduleDailyPopiaRetentionCron();

  return worker;
}

export default createPopiaRetentionWorker;
