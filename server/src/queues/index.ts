import { Queue, JobsOptions } from 'bullmq';
import { createRedisConnection } from '../config/redis.js';

// ============================================================================
// 1. QUEUE NAMES & DEFINITIONS
// ============================================================================

export const QUEUE_NAMES = {
  WORKFLOW: 'shogun-workflow-queue',
  EMAIL: 'shogun-email-queue',
  SCHEDULED_JOBS: 'shogun-scheduled-jobs-queue',
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

export async function closeQueues(): Promise<void> {
  const closers = [];
  if (_workflowQueue) closers.push(_workflowQueue.close());
  if (_emailQueue) closers.push(_emailQueue.close());
  if (_scheduledJobsQueue) closers.push(_scheduledJobsQueue.close());
  await Promise.all(closers);
  _workflowQueue = null;
  _emailQueue = null;
  _scheduledJobsQueue = null;
}
