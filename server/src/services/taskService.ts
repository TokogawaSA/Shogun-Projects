import { prisma } from '../config/db.js';
import { withTenantTx } from '../utils/tenantTx.js';
import { enqueueWorkflowEvent } from '../queues/index.js';

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  status?: string;
  priority?: string;
  category?: string | null;
  assignedAgent?: string | null;
  progress?: number;
  assigneeId?: string | null;
  dueDate?: Date | null;
  parentTaskId?: string | null;
  milestoneId?: string | null;
  lineItemId?: string | null;
  estimatedHours?: number;
  actualHours?: number;
  isRecurring?: boolean;
  recurrenceRule?: string | null;
  predecessorTaskIds?: any;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
  customFields?: any;
  attachments?: any;
}

export async function updateTaskWithEvents(
  tenantId: string,
  taskId: string,
  input: UpdateTaskInput,
  userId?: string
) {
  return withTenantTx(tenantId, async (tx) => {
    // 1. Fetch current task state
    const existing = await tx.task.findFirst({
      where: { id: taskId, tenantId },
      select: { id: true, status: true, projectId: true },
    });

    if (!existing) {
      throw new Error(`Task ${taskId} not found.`);
    }

    const prevStatus = existing.status;
    const isStatusChanging = input.status && input.status !== prevStatus;

    // 2. Update task
    const updated = await tx.task.update({
      where: { id: taskId },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.status !== undefined && { status: input.status }),
        ...(input.priority !== undefined && { priority: input.priority }),
        ...(input.category !== undefined && { category: input.category }),
        ...(input.assignedAgent !== undefined && { assignedAgent: input.assignedAgent }),
        ...(input.progress !== undefined && { progress: input.progress }),
        ...(input.assigneeId !== undefined && { assigneeId: input.assigneeId }),
        ...(input.dueDate !== undefined && { dueDate: input.dueDate }),
        ...(input.parentTaskId !== undefined && { parentTaskId: input.parentTaskId }),
        ...(input.milestoneId !== undefined && { milestoneId: input.milestoneId }),
        ...(input.lineItemId !== undefined && { lineItemId: input.lineItemId }),
        ...(input.estimatedHours !== undefined && { estimatedHours: input.estimatedHours }),
        ...(input.actualHours !== undefined && { actualHours: input.actualHours }),
        ...(input.isRecurring !== undefined && { isRecurring: input.isRecurring }),
        ...(input.recurrenceRule !== undefined && { recurrenceRule: input.recurrenceRule }),
        ...(input.predecessorTaskIds !== undefined && { predecessorTaskIds: input.predecessorTaskIds }),
        ...(input.relatedEntityType !== undefined && { relatedEntityType: input.relatedEntityType }),
        ...(input.relatedEntityId !== undefined && { relatedEntityId: input.relatedEntityId }),
        ...(input.customFields !== undefined && { customFields: input.customFields }),
        ...(input.attachments !== undefined && { attachments: input.attachments }),
      },
    });

    // 3. If status changed, enqueue domain event to BullMQ
    if (isStatusChanging && input.status) {
      try {
        await enqueueWorkflowEvent(
          'task.status_changed',
          {
            tenantId,
            taskId,
            projectId: existing.projectId,
            previousStatus: prevStatus,
            newStatus: input.status,
            userId,
          },
          `workflow-task-${taskId}-${input.status}-${Date.now()}`
        );
      } catch (err: any) {
        console.warn(`[taskService] Could not enqueue task.status_changed event to Redis:`, err.message);
      }
    }

    return updated;
  });
}
