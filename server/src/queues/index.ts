import { Queue, JobsOptions } from 'bullmq';
import { createRedisConnection } from '../config/redis.js';

// ============================================================================
// 1. QUEUE NAMES & DEFINITIONS
// ============================================================================

export const QUEUE_NAMES = {
  WORKFLOW: 'shogun-workflow-queue',
  EMAIL: 'shogun-email-queue',
  SCHEDULED_JOBS: 'shogun-scheduled-jobs-queue',
  SOCIAL_ANALYSIS: 'shogun-social-analysis-queue',
  POPIA_RETENTION: 'shogun-popia-retention-queue',
  BBBEE_EXPIRY: 'shogun-bbbee-expiry-queue',
  ACCOUNTING_SYNC: 'shogun-accounting-sync-queue',
} as const;

// Default job options with exponential backoff & retention policies
const defaultJobOptions: JobsOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 1000, // 1s, 2s, 4s
  },
  removeOnComplete: {
    age: 3600 * 24, // Keep completed jobs for 24h
    count: 1000,
  },
  removeOnFail: {
    age: 3600 * 24 * 7, // Keep failed jobs for 7 days
  },
};

// ============================================================================
// 2. LAZY QUEUE FACTORIES
// ============================================================================

let _workflowQueue: Queue | null = null;
let _emailQueue: Queue | null = null;
let _scheduledJobsQueue: Queue | null = null;
let _socialAnalysisQueue: Queue | null = null;
let _accountingSyncQueue: Queue | null = null;

export function getWorkflowQueue(): Queue {
  if (!_workflowQueue) {
    _workflowQueue = new Queue(QUEUE_NAMES.WORKFLOW, {
      connection: createRedisConnection(),
      defaultJobOptions,
    });
    _workflowQueue.on('error', (err) => console.warn('[WorkflowQueue Warning]:', err.message));
  }
  return _workflowQueue;
}

export function getEmailQueue(): Queue {
  if (!_emailQueue) {
    _emailQueue = new Queue(QUEUE_NAMES.EMAIL, {
      connection: createRedisConnection(),
      defaultJobOptions,
    });
    _emailQueue.on('error', (err) => console.warn('[EmailQueue Warning]:', err.message));
  }
  return _emailQueue;
}

export function getScheduledJobsQueue(): Queue {
  if (!_scheduledJobsQueue) {
    _scheduledJobsQueue = new Queue(QUEUE_NAMES.SCHEDULED_JOBS, {
      connection: createRedisConnection(),
      defaultJobOptions,
    });
    _scheduledJobsQueue.on('error', (err) => console.warn('[ScheduledJobsQueue Warning]:', err.message));
  }
  return _scheduledJobsQueue;
}

export function getSocialAnalysisQueue(): Queue {
  if (!_socialAnalysisQueue) {
    _socialAnalysisQueue = new Queue(QUEUE_NAMES.SOCIAL_ANALYSIS, {
      connection: createRedisConnection(),
      defaultJobOptions,
    });
    _socialAnalysisQueue.on('error', (err) => console.warn('[SocialAnalysisQueue Warning]:', err.message));
  }
  return _socialAnalysisQueue;
}

export function getAccountingSyncQueue(): Queue {
  if (!_accountingSyncQueue) {
    _accountingSyncQueue = new Queue(QUEUE_NAMES.ACCOUNTING_SYNC, {
      connection: createRedisConnection(),
      defaultJobOptions: {
        ...defaultJobOptions,
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    });
    _accountingSyncQueue.on('error', (err) => console.warn('[AccountingSyncQueue Warning]:', err.message));
  }
  return _accountingSyncQueue;
}

// Proxies for direct backward compatibility
export const workflowQueue = new Proxy({} as Queue, {
  get: (_target, prop) => (getWorkflowQueue() as any)[prop],
});

export const emailQueue = new Proxy({} as Queue, {
  get: (_target, prop) => (getEmailQueue() as any)[prop],
});

export const scheduledJobsQueue = new Proxy({} as Queue, {
  get: (_target, prop) => (getScheduledJobsQueue() as any)[prop],
});

export const socialAnalysisQueue = new Proxy({} as Queue, {
  get: (_target, prop) => (getSocialAnalysisQueue() as any)[prop],
});

export const accountingSyncQueue = new Proxy({} as Queue, {
  get: (_target, prop) => (getAccountingSyncQueue() as any)[prop],
});

export async function queueSocialInteraction(payload: any): Promise<void> {
  try {
    const queue = getSocialAnalysisQueue();
    await queue.add('social.inbound_interaction', payload, {
      priority: payload.urgency === 'critical' ? 1 : payload.urgency === 'high' ? 2 : 3,
    });
  } catch (err: any) {
    console.warn('[SocialQueue Warning] Failed to enqueue to Redis, fallback directly:', err.message);
  }
}

// ============================================================================
// 3. TYPED EVENT PAYLOADS
// ============================================================================

export interface DealStageUpdatedPayload {
  tenantId: string;
  dealId: string;
  previousStage?: string;
  newStage: string;
  userId?: string;
}

export interface TaskStatusChangedPayload {
  tenantId: string;
  taskId: string;
  projectId: string;
  previousStatus?: string;
  newStatus: string;
  userId?: string;
}

export interface EmailJobPayload {
  tenantId: string;
  to: string;
  subject: string;
  templateKey?: string;
  templateVariables?: Record<string, any>;
  bodyHtml?: string;
  bodyText?: string;
}

export interface ScheduledJobPayload {
  tenantId?: string;
  jobType: 'daily_client_health' | 'recurring_tasks_generation';
  triggeredAt: string;
}

export type AccountingDomainEventName =
  | 'invoice.issued'
  | 'invoice.paid'
  | 'expense.approved'
  | 'sync_invoice_payment';

export interface AccountingSyncJobPayload {
  eventType?: AccountingDomainEventName;
  tenantId: string;
  taxInvoiceId?: string;
  invoiceNumber?: string;
  paymentTransactionId?: string;
  merchantTransactionId?: string;
  projectId?: string;
  amountPaid?: number;
  currency?: string;
  provider?: 'SAGE_ZA' | 'XERO' | null;
  settledAt?: string;
}

// ============================================================================
// 4. DISPATCHER HELPERS (With Idempotency & Retry Options)
// ============================================================================

export async function enqueueWorkflowEvent(
  eventName: 'deal.stage_updated' | 'task.status_changed',
  payload: DealStageUpdatedPayload | TaskStatusChangedPayload,
  customJobId?: string
) {
  try {
    const queue = getWorkflowQueue();
    const jobId =
      customJobId ||
      (eventName === 'deal.stage_updated'
        ? `workflow-deal-${(payload as DealStageUpdatedPayload).dealId}-${(payload as DealStageUpdatedPayload).newStage}`
        : `workflow-task-${(payload as TaskStatusChangedPayload).taskId}-${(payload as TaskStatusChangedPayload).newStatus}-${Date.now()}`);

    return await queue.add(eventName, payload, { jobId });
  } catch (err: any) {
    console.error(`[WorkflowQueue] Failed to enqueue event ${eventName}:`, err.message);
    throw err;
  }
}

export async function enqueueEmailJob(
  payload: EmailJobPayload,
  customJobId?: string
) {
  try {
    const queue = getEmailQueue();
    const jobId = customJobId || `email-${payload.tenantId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    return await queue.add('send_email', payload, { jobId });
  } catch (err: any) {
    console.error('[EmailQueue] Failed to enqueue email job:', err.message);
    throw err;
  }
}

export async function enqueueScheduledJob(
  jobType: 'daily_client_health' | 'recurring_tasks_generation',
  payload: ScheduledJobPayload,
  customJobId?: string
) {
  try {
    const queue = getScheduledJobsQueue();
    const jobId = customJobId || `scheduled-${jobType}-${new Date().toISOString().split('T')[0]}`;
    return await queue.add(jobType, payload, { jobId });
  } catch (err: any) {
    console.error(`[ScheduledJobsQueue] Failed to enqueue job ${jobType}:`, err.message);
    throw err;
  }
}

export async function enqueueAccountingSyncJob(
  payload: AccountingSyncJobPayload,
  customJobId?: string
) {
  const queue = getAccountingSyncQueue();
  const eventName: AccountingDomainEventName = payload.eventType || 'invoice.paid';
  const jobId =
    customJobId ||
    `accounting-${eventName}-${
      payload.merchantTransactionId || payload.taxInvoiceId || payload.projectId || Date.now()
    }`;
  return await queue.add(
    eventName,
    { ...payload, eventType: eventName },
    {
      jobId,
      attempts: 5,
      backoff: { type: 'exponential', delay: 2000 },
    }
  );
}

export async function closeQueues(): Promise<void> {
  const closers = [];
  if (_workflowQueue) closers.push(_workflowQueue.close());
  if (_emailQueue) closers.push(_emailQueue.close());
  if (_scheduledJobsQueue) closers.push(_scheduledJobsQueue.close());
  if (_socialAnalysisQueue) closers.push(_socialAnalysisQueue.close());
  if (_accountingSyncQueue) closers.push(_accountingSyncQueue.close());
  await Promise.all(closers);
  _workflowQueue = null;
  _emailQueue = null;
  _scheduledJobsQueue = null;
  _socialAnalysisQueue = null;
  _accountingSyncQueue = null;
}

