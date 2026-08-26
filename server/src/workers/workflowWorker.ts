import { Worker, Job } from 'bullmq';
import { createRedisConnection } from '../config/redis.js';
import { QUEUE_NAMES, DealStageUpdatedPayload, TaskStatusChangedPayload } from '../queues/index.js';
import { withTenantTx } from '../utils/tenantTx.js';
import { prisma } from '../config/db.js';

/**
 * Handle `deal.stage_updated` event:
 * When transitioned to 'closed_won', idempotently provision a Project, Milestones, Handover Task, and AuditLog.
 */
export async function processDealStageUpdated(payload: DealStageUpdatedPayload): Promise<{
  success: boolean;
  actionTaken: 'created_project' | 'skipped_idempotent' | 'skipped_not_won';
  projectId?: string;
}> {
  const { tenantId, dealId, newStage, userId } = payload;

  if (newStage !== 'closed_won') {
    return { success: true, actionTaken: 'skipped_not_won' };
  }

  return withTenantTx(tenantId, async (tx) => {
    // 1. Fetch existing deal
    const deal = await tx.deal.findFirst({
      where: { id: dealId, tenantId },
      include: { account: true, contact: true },
    });

    if (!deal) {
      throw new Error(`Deal ${dealId} not found in tenant ${tenantId}`);
    }

    // Idempotency check: If deal already has a linked project or a project already exists for this deal
    if (deal.linkedProjectId) {
      console.log(`[WorkflowWorker] Deal ${dealId} already linked to project ${deal.linkedProjectId}. Skipping duplicate project creation.`);
      return { success: true, actionTaken: 'skipped_idempotent', projectId: deal.linkedProjectId };
    }

    const existingProject = await tx.project.findFirst({
      where: { dealId, tenantId },
    });

    if (existingProject) {
      // Re-link deal to existing project if reference was missing
      await tx.deal.update({
        where: { id: dealId },
        data: { linkedProjectId: existingProject.id },
      });
      return { success: true, actionTaken: 'skipped_idempotent', projectId: existingProject.id };
    }

    const accountName = deal.account?.accountName || 'Client';
    const projectTitle = `${accountName} - ${deal.dealName}`;
    
    // Resolve valid user ID for owner & creator
    let ownerId = deal.assignedUserId || userId;
    if (!ownerId) {
      const defaultUser = await tx.user.findFirst({ where: { tenantId } });
      ownerId = defaultUser?.id || 'usr-system';
    }

    // 2. Create Project
    const project = await tx.project.create({
      data: {
        tenantId,
        title: projectTitle,
        description: `Project provisioned automatically from Closed-Won deal "${deal.dealName}" (Amount: ${deal.amount || 0} ${deal.currency || 'USD'}).`,
        accountId: deal.accountId,
        dealId: deal.id,
        primaryContactId: deal.contactId,
        ownerId,
      },
    });

    // 3. Create Default Delivery Milestone Phases
    const defaultMilestones = [
      { title: 'Architecture Kickoff & Scope Validation', targetDate: new Date(Date.now() + 7 * 86400000) },
      { title: 'Core Implementation & Subagent Orchestration', targetDate: new Date(Date.now() + 21 * 86400000) },
      { title: 'QA Verification, Nonce & Security Audit', targetDate: new Date(Date.now() + 35 * 86400000) },
      { title: 'Client Sign-off & Production Deployment', targetDate: new Date(Date.now() + 45 * 86400000) },
    ];

    const createdMilestones = await Promise.all(
      defaultMilestones.map((m) =>
        tx.projectMilestone.create({
          data: {
            tenantId,
            projectId: project.id,
            title: m.title,
            status: 'pending',
            completionPercentage: 0,
            dueDate: m.targetDate,
          },
        })
      )
    );

    // 4. Create Initial Handover Task
    const kickoffTask = await tx.task.create({
      data: {
        tenantId,
        projectId: project.id,
        milestoneId: createdMilestones[0]?.id,
        title: `Sales-to-Delivery Handover: ${deal.dealName}`,
        description: `Perform client discovery review, establish communication channels, and assign Sentinel subagents.`,
        status: 'todo',
        priority: 'urgent',
        category: 'Client Interface',
        assignedAgent: 'Sentinel',
        assigneeId: ownerId,
        creatorId: ownerId,
        progress: 0,
        relatedEntityType: 'deal',
        relatedEntityId: deal.id,
        checklistSubtasks: {
          create: [
            { title: 'Review deal handover scope and budget specs', completed: false },
            { title: 'Schedule technical discovery sync with client lead', completed: false },
            { title: 'Provision multi-tenant environment tokens', completed: false },
          ],
        },
      },
    });

    // 5. Update Deal with linkedProjectId
    await tx.deal.update({
      where: { id: dealId },
      data: { linkedProjectId: project.id },
    });

    // 6. Write Activity & Audit Log
    await tx.entityActivityLog.create({
      data: {
        tenantId,
        moduleName: 'deals',
        entityId: dealId,
        action: 'converted',
        userId: ownerId,
        description: `Deal Closed-Won: Provisioned Project "${project.title}" (ID: ${project.id}) with ${createdMilestones.length} milestones and Kickoff Task (ID: ${kickoffTask.id})`,
        fieldChanges: {
          stage: { from: deal.stage, to: 'closed_won' },
          linkedProjectId: { from: null, to: project.id },
        },
      },
    });

    console.log(`[WorkflowWorker] Successfully provisioned Project ${project.id} for Deal ${dealId}`);
    return { success: true, actionTaken: 'created_project', projectId: project.id };
  });
}

/**
 * Handle `task.status_changed` event:
 * Recalculates milestone completion and evaluates task dependencies.
 */
export async function processTaskStatusChanged(payload: TaskStatusChangedPayload): Promise<{
  success: boolean;
  milestoneUpdated?: boolean;
  completionPercentage?: number;
}> {
  const { tenantId, taskId, projectId, newStatus, userId } = payload;

  return withTenantTx(tenantId, async (tx) => {
    // 1. Fetch task details
    const task = await tx.task.findFirst({
      where: { id: taskId, tenantId },
      select: { id: true, title: true, milestoneId: true, creatorId: true },
    });

    // 2. Fetch all project tasks to recompute milestone completion
    const allTasks = await tx.task.findMany({
      where: { projectId, tenantId },
      select: { id: true, status: true, milestoneId: true },
    });

    // 3. Update Milestone Progress if task is linked to a milestone
    let milestoneUpdated = false;
    let milestoneProgress = 0;
    if (task?.milestoneId) {
      const milestoneTasks = allTasks.filter((t) => t.milestoneId === task.milestoneId);
      const milestoneTotal = milestoneTasks.length;
      const milestoneDone = milestoneTasks.filter((t) => t.status === 'done' || t.status === 'completed').length;
      milestoneProgress = milestoneTotal > 0 ? Math.round((milestoneDone / milestoneTotal) * 100) : 0;

      await tx.projectMilestone.update({
        where: { id: task.milestoneId },
        data: {
          completionPercentage: milestoneProgress,
          status: milestoneProgress === 100 ? 'completed' : milestoneProgress > 0 ? 'in_progress' : 'pending',
        },
      });
      milestoneUpdated = true;
    }

    const performerId = userId || task?.creatorId || 'usr-system';

    // 4. Log Activity
    await tx.entityActivityLog.create({
      data: {
        tenantId,
        moduleName: 'tasks',
        entityId: taskId,
        action: 'status_changed',
        userId: performerId,
        description: `Task status changed to ${newStatus} in project ${projectId}`,
        fieldChanges: {
          status: { to: newStatus },
          milestoneCompletion: milestoneUpdated ? { milestoneId: task?.milestoneId, percentage: milestoneProgress } : undefined,
        },
      },
    });

    console.log(`[WorkflowWorker] Task ${taskId} status changed to ${newStatus} in project ${projectId}.`);
    return { success: true, milestoneUpdated, completionPercentage: milestoneProgress };
  });
}

/**
 * Initialize BullMQ Workflow Worker
 */
export function createWorkflowWorker(concurrency = 5): Worker {
  const worker = new Worker(
    QUEUE_NAMES.WORKFLOW,
    async (job: Job) => {
      console.log(`[WorkflowWorker] Processing job ${job.id} (${job.name})...`);

      switch (job.name) {
        case 'deal.stage_updated':
          return processDealStageUpdated(job.data as DealStageUpdatedPayload);
        case 'task.status_changed':
          return processTaskStatusChanged(job.data as TaskStatusChangedPayload);
        default:
          console.warn(`[WorkflowWorker] Unrecognized job name: ${job.name}`);
          return { skipped: true, reason: 'unknown_job' };
      }
    },
    {
      connection: createRedisConnection(),
      concurrency,
    }
  );

  worker.on('completed', (job) => {
    console.log(`[WorkflowWorker] Job ${job.id} (${job.name}) completed successfully.`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[WorkflowWorker] Job ${job?.id} (${job?.name}) failed:`, err.message);
  });

  worker.on('error', (err) => {
    // Suppress unhandled crash when Redis is offline
    console.warn('[WorkflowWorker Warning] Redis connection issue:', err.message);
  });

  return worker;
}

export default createWorkflowWorker;
