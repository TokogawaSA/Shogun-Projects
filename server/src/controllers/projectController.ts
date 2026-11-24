import { Request, Response } from 'express';
import { prisma } from '../config/db.js';
import { updateTaskWithEvents } from '../services/taskService.js';
import { cascadeProjectGanttTasks } from '../services/schedulingEngine.js';
import { getTenantCurrency } from '../utils/tenantConfig.js';

// ============================================================================
// 1. PROJECTS CRUD
// ============================================================================

export async function getProjects(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;
    const projects = await prisma.project.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
        owner: { select: { id: true, displayName: true, email: true } },
        account: { select: { id: true, accountName: true } },
        deal: { select: { id: true, dealName: true } },
        primaryContact: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { tasks: true, milestones: true, deliverables: true } },
      },
    });
    res.json(projects);
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to fetch projects.',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
  }
}

export async function getProjectById(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;

    const project = await prisma.project.findFirst({
      where: { id, tenantId },
      include: {
        owner: { select: { id: true, displayName: true, email: true } },
        account: true,
        deal: true,
        primaryContact: true,
        milestones: { orderBy: { dueDate: 'asc' } },
        tasks: {
          include: {
            assignee: { select: { id: true, displayName: true, email: true } },
            timeLogs: true,
            checklistSubtasks: true,
            subtasks: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        budget: true,
        expenses: true,
        risks: true,
        deliverables: true,
      },
    });

    if (!project) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }

    res.json(project);
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to fetch project.',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
  }
}

export async function createProject(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;
    const userId = req.user!.userId;
    const data = req.body;

    const project = await prisma.$transaction(async (tx) => {
      const newProj = await tx.project.create({
        data: {
          tenantId,
          title: data.title,
          description: data.description,
          organizationId: data.organizationId,
          ownerId: data.ownerId || userId,
          members: data.members || [userId],
          accountId: data.accountId || null,
          dealId: data.dealId || null,
          primaryContactId: data.primaryContactId || null,
          portfolioId: data.portfolioId || null,
        },
      });

      // Automatically initialize ProjectBudget
      await tx.projectBudget.create({
        data: {
          projectId: newProj.id,
          tenantId,
          capexBudget: data.capexBudget ? Number(data.capexBudget) : 0,
          opexBudget: data.opexBudget ? Number(data.opexBudget) : 0,
          laborBudget: data.laborBudget ? Number(data.laborBudget) : 0,
          currency: data.currency || await getTenantCurrency(tenantId),
          profitMarginPercent: data.profitMarginPercent ? Number(data.profitMarginPercent) : 20,
        },
      });

      return newProj;
    });

    res.status(201).json(project);
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to create project.',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
  }
}

export async function updateProject(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;
    const data = req.body;

    const existing = await prisma.project.findFirst({ where: { id, tenantId } });
    if (!existing) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }

    const updated = await prisma.project.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        organizationId: data.organizationId,
        ownerId: data.ownerId,
        members: data.members,
        accountId: data.accountId,
        dealId: data.dealId,
        primaryContactId: data.primaryContactId,
        portfolioId: data.portfolioId,
      },
    });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to update project.',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
  }
}

export async function deleteProject(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;

    const existing = await prisma.project.findFirst({ where: { id, tenantId } });
    if (!existing) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }

    await prisma.project.delete({ where: { id } });
    res.json({ message: 'Project deleted successfully.', id });
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to delete project.',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
  }
}

// ============================================================================
// 2. MILESTONES CRUD
// ============================================================================

export async function getMilestones(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;
    const { projectId } = req.params;

    const milestones = await prisma.projectMilestone.findMany({
      where: { tenantId, projectId },
      orderBy: { dueDate: 'asc' },
      include: {
        tasks: { select: { id: true, title: true, status: true } },
      },
    });
    res.json(milestones);
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to fetch milestones.',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
  }
}

export async function createMilestone(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;
    const { projectId } = req.params;
    const data = req.body;

    const project = await prisma.project.findFirst({ where: { id: projectId, tenantId } });
    if (!project) {
      res.status(404).json({ error: 'Project not found in active tenant.' });
      return;
    }

    const milestone = await prisma.projectMilestone.create({
      data: {
        projectId,
        tenantId,
        title: data.title,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        status: data.status || 'pending',
        completionPercentage: data.completionPercentage !== undefined ? Number(data.completionPercentage) : 0,
        description: data.description,
      },
    });

    res.status(201).json(milestone);
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to create milestone.',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
  }
}

export async function updateMilestone(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;
    const data = req.body;

    const existing = await prisma.projectMilestone.findFirst({ where: { id, tenantId } });
    if (!existing) {
      res.status(404).json({ error: 'Milestone not found.' });
      return;
    }

    const updated = await prisma.projectMilestone.update({
      where: { id: existing.id },
      data: {
        title: data.title,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        status: data.status,
        completionPercentage: data.completionPercentage !== undefined ? Number(data.completionPercentage) : undefined,
        description: data.description,
      },
    });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to update milestone.',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
  }
}

export async function deleteMilestone(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;

    const existing = await prisma.projectMilestone.findFirst({ where: { id, tenantId } });
    if (!existing) {
      res.status(404).json({ error: 'Milestone not found.' });
      return;
    }

    await prisma.projectMilestone.delete({ where: { id: existing.id } });
    res.json({ message: 'Milestone deleted successfully.', id });
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to delete milestone.',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
  }
}

// ============================================================================
// 3. TASKS CRUD
// ============================================================================

export async function getTasks(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;
    const { projectId } = req.query;

    const rawTasks = await prisma.task.findMany({
      where: {
        tenantId,
        ...(projectId ? { projectId: String(projectId) } : {}),
      },
      include: {
        assignee: { select: { id: true, displayName: true, email: true } },
        creator: { select: { id: true, displayName: true, email: true } },
        checklistSubtasks: { orderBy: { createdAt: 'asc' } },
        subtasks: { select: { id: true, title: true, status: true, actualHours: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const tasks = rawTasks.map((t) => ({
      ...t,
      // Map checklistSubtasks to subtasks for frontend uniformity
      subtasks: t.checklistSubtasks.length > 0
        ? t.checklistSubtasks.map((st) => ({
            id: st.id,
            taskId: st.taskId,
            title: st.title,
            description: st.description || '',
            completed: st.completed,
            assigneeId: st.assigneeId,
            dueDate: st.dueDate ? st.dueDate.toISOString() : undefined,
            priority: st.priority || 'medium',
            attachments: st.attachments || [],
            customFields: st.customFields || {},
            createdAt: st.createdAt.toISOString(),
            updatedAt: st.updatedAt.toISOString(),
          }))
        : [],
    }));

    res.json(tasks);
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to fetch tasks.',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
  }
}

export async function getTaskById(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;

    const task = await prisma.task.findFirst({
      where: { id, tenantId },
      include: {
        assignee: { select: { id: true, displayName: true, email: true } },
        creator: { select: { id: true, displayName: true, email: true } },
        parentTask: true,
        subtasks: true,
        milestone: true,
        lineItem: true,
        checklistSubtasks: { orderBy: { createdAt: 'asc' } },
        timeLogs: { orderBy: { date: 'desc' } },
      },
    });

    if (!task) {
      res.status(404).json({ error: 'Task not found.' });
      return;
    }

    const formattedTask = {
      ...task,
      subtasks: task.checklistSubtasks.length > 0
        ? task.checklistSubtasks.map((st) => ({
            id: st.id,
            taskId: st.taskId,
            title: st.title,
            description: st.description || '',
            completed: st.completed,
            assigneeId: st.assigneeId,
            dueDate: st.dueDate ? st.dueDate.toISOString() : undefined,
            priority: st.priority || 'medium',
            attachments: st.attachments || [],
            customFields: st.customFields || {},
            createdAt: st.createdAt.toISOString(),
            updatedAt: st.updatedAt.toISOString(),
          }))
        : [],
    };

    res.json(formattedTask);
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to fetch task.',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
  }
}

export async function createTask(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;
    const userId = req.user!.userId;
    const data = req.body;

    let targetProjectId = data.projectId;

    if (targetProjectId) {
      const proj = await prisma.project.findFirst({ where: { id: targetProjectId, tenantId } });
      if (!proj) {
        // Look for any project in tenant, or provision default tenant project
        const anyProj = await prisma.project.findFirst({ where: { tenantId } });
        if (anyProj) {
          targetProjectId = anyProj.id;
        } else {
          const newDefaultProj = await prisma.project.create({
            data: {
              id: targetProjectId,
              tenantId,
              title: 'Core Engineering',
              description: 'Default project workspace for active tenant.',
              ownerId: userId,
              members: [userId],
            },
          });
          targetProjectId = newDefaultProj.id;
        }
      }
    } else {
      const anyProj = await prisma.project.findFirst({ where: { tenantId } });
      if (anyProj) {
        targetProjectId = anyProj.id;
      }
    }

    if (data.milestoneId) {
      const ms = await prisma.projectMilestone.findFirst({ where: { id: data.milestoneId, tenantId } });
      if (!ms) {
        res.status(404).json({ error: 'Associated milestone not found in active tenant.' });
        return;
      }
    }

    if (data.parentTaskId) {
      const parent = await prisma.task.findFirst({ where: { id: data.parentTaskId, tenantId } });
      if (!parent) {
        res.status(404).json({ error: 'Associated parent task not found in active tenant.' });
        return;
      }
    }

    const task = await prisma.task.create({
      data: {
        tenantId,
        projectId: targetProjectId,
        title: data.title,
        description: data.description || '',
        status: data.status || 'todo',
        priority: data.priority || 'medium',
        category: data.category,
        assignedAgent: data.assignedAgent,
        progress: data.progress !== undefined ? Number(data.progress) : 0,
        assigneeId: data.assigneeId || null,
        creatorId: userId,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        parentTaskId: data.parentTaskId || null,
        milestoneId: data.milestoneId || null,
        lineItemId: data.lineItemId || null,
        estimatedHours: data.estimatedHours !== undefined ? Number(data.estimatedHours) : 0,
        actualHours: 0,
        isRecurring: Boolean(data.isRecurring),
        recurrenceRule: data.recurrenceRule,
        predecessorTaskIds: data.predecessorTaskIds || [],
        relatedEntityType: data.relatedEntityType || null,
        relatedEntityId: data.relatedEntityId || null,
        customFields: data.customFields || {},
        attachments: data.attachments || [],
      },
    });

    // If initial subtasks are provided, create them
    if (Array.isArray(data.subtasks) && data.subtasks.length > 0) {
      await prisma.subTask.createMany({
        data: data.subtasks.map((st: any) => ({
          taskId: task.id,
          title: st.title || 'Untitled Subtask',
          description: st.description || '',
          completed: Boolean(st.completed),
          assigneeId: st.assigneeId || null,
          dueDate: st.dueDate ? new Date(st.dueDate) : null,
          priority: st.priority || 'medium',
          attachments: st.attachments || [],
          customFields: st.customFields || {},
        })),
      });
    }

    const fetched = await prisma.task.findUnique({
      where: { id: task.id },
      include: { checklistSubtasks: true },
    });

    res.status(201).json({
      ...fetched,
      subtasks: fetched?.checklistSubtasks || [],
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to create task.',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
  }
}

export async function updateTask(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;
    const userId = req.user!.userId;
    const { id } = req.params;
    const data = req.body;

    const updated = await updateTaskWithEvents(
      tenantId,
      id,
      {
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        category: data.category,
        assignedAgent: data.assignedAgent,
        progress: data.progress !== undefined ? Number(data.progress) : undefined,
        assigneeId: data.assigneeId,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        parentTaskId: data.parentTaskId,
        milestoneId: data.milestoneId,
        lineItemId: data.lineItemId,
        estimatedHours: data.estimatedHours !== undefined ? Number(data.estimatedHours) : undefined,
        actualHours: data.actualHours !== undefined ? Number(data.actualHours) : undefined,
        isRecurring: data.isRecurring !== undefined ? Boolean(data.isRecurring) : undefined,
        recurrenceRule: data.recurrenceRule,
        predecessorTaskIds: data.predecessorTaskIds,
        relatedEntityType: data.relatedEntityType,
        relatedEntityId: data.relatedEntityId,
        customFields: data.customFields,
        attachments: data.attachments,
      },
      userId
    );

    // Cascade Finish-to-Start Gantt dependencies across SA weekends & public holidays
    // when schedule-impacting fields change
    if (
      data.dueDate !== undefined ||
      data.estimatedHours !== undefined ||
      data.predecessorTaskIds !== undefined ||
      data.customFields?.startDate !== undefined
    ) {
      try {
        await cascadeProjectGanttTasks(tenantId, updated.projectId);
      } catch (cascadeErr: any) {
        console.warn('[Gantt Cascade Notice]:', cascadeErr?.message || cascadeErr);
      }
    }

    // Sync subtasks if provided
    if (Array.isArray(data.subtasks)) {
      await prisma.subTask.deleteMany({ where: { taskId: id } });
      if (data.subtasks.length > 0) {
        await prisma.subTask.createMany({
          data: data.subtasks.map((st: any) => ({
            taskId: id,
            title: st.title || 'Untitled Subtask',
            description: st.description || '',
            completed: Boolean(st.completed),
            assigneeId: st.assigneeId || null,
            dueDate: st.dueDate ? new Date(st.dueDate) : null,
            priority: st.priority || 'medium',
            attachments: st.attachments || [],
            customFields: st.customFields || {},
          })),
        });
      }
    }

    const refetchedSubtasks = await prisma.subTask.findMany({
      where: { taskId: id },
      orderBy: { createdAt: 'asc' },
    });

    res.json({
      ...updated,
      subtasks: refetchedSubtasks.map((st) => ({
        id: st.id,
        taskId: st.taskId,
        title: st.title,
        description: st.description || '',
        completed: st.completed,
        assigneeId: st.assigneeId,
        dueDate: st.dueDate ? st.dueDate.toISOString() : undefined,
        priority: st.priority || 'medium',
        attachments: st.attachments || [],
        customFields: st.customFields || {},
        createdAt: st.createdAt.toISOString(),
        updatedAt: st.updatedAt.toISOString(),
      })),
    });
  } catch (err: any) {
    if (err.message?.includes('not found')) {
      res.status(404).json({ error: err.message });
      return;
    }
    res.status(500).json({
      error: 'Failed to update task.',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
  }
}

export async function deleteTask(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;

    const existing = await prisma.task.findFirst({ where: { id, tenantId } });
    if (!existing) {
      res.status(404).json({ error: 'Task not found.' });
      return;
    }

    await prisma.task.delete({ where: { id } });
    res.json({ message: 'Task deleted successfully.', id });
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to delete task.',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
  }
}

// ============================================================================
// 4. TIME LOGGING & RECURSIVE ACTUAL HOURS ROLLUP
// ============================================================================

/**
 * Recursively climb parent task tree and recalculate actualHours on all ancestors
 */
async function rollupParentHours(taskId: string, tenantId: string, tx: any): Promise<void> {
  const currentTask = await tx.task.findFirst({
    where: { id: taskId, tenantId },
    select: { id: true, parentTaskId: true },
  });

  if (!currentTask || !currentTask.parentTaskId) {
    return;
  }

  const parentId = currentTask.parentTaskId;

  // Sum direct time logs of the parent
  const parentDirectLogs = await tx.timeLog.aggregate({
    where: { taskId: parentId },
    _sum: { hoursLogged: true },
  });
  const directHours = parentDirectLogs._sum.hoursLogged || 0;

  // Sum actualHours of all child subtasks of the parent
  const childSubtasks = await tx.task.aggregate({
    where: { parentTaskId: parentId, tenantId },
    _sum: { actualHours: true },
  });
  const subtaskHours = childSubtasks._sum.actualHours || 0;

  const totalParentHours = directHours + subtaskHours;

  await tx.task.update({
    where: { id: parentId },
    data: { actualHours: totalParentHours },
  });

  // Climb up to the next parent level recursively
  await rollupParentHours(parentId, tenantId, tx);
}

/**
 * POST /api/projects/:projectId/tasks/:taskId/time-logs
 * Inserts time log and recursively rolls up actual hours to parents & project budget
 */
export async function addTimeLog(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;
    const userId = req.user!.userId;
    const { projectId, taskId } = req.params;
    const { hoursLogged, date, description, isBillable, hourlyRate } = req.body;

    if (!hoursLogged || Number(hoursLogged) <= 0) {
      res.status(400).json({ error: 'hoursLogged must be a positive number.' });
      return;
    }

    const task = await prisma.task.findFirst({
      where: { id: taskId, projectId, tenantId },
    });

    if (!task) {
      res.status(404).json({ error: 'Task not found in specified project.' });
      return;
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create TimeLog entry
      const timeLog = await tx.timeLog.create({
        data: {
          taskId,
          userId,
          userName: req.user!.email,
          hoursLogged: Number(hoursLogged),
          date: date ? new Date(date) : new Date(),
          description: description || null,
          isBillable: isBillable !== undefined ? Boolean(isBillable) : true,
          hourlyRate: hourlyRate ? Number(hourlyRate) : null,
        },
      });

      // 2. Aggregate direct time logs for this specific task
      const taskDirectSum = await tx.timeLog.aggregate({
        where: { taskId },
        _sum: { hoursLogged: true },
      });
      const directHours = taskDirectSum._sum.hoursLogged || 0;

      // 3. Aggregate any child subtask hours
      const childSum = await tx.task.aggregate({
        where: { parentTaskId: taskId, tenantId },
        _sum: { actualHours: true },
      });
      const childHours = childSum._sum.actualHours || 0;

      const totalTaskHours = directHours + childHours;

      // 4. Update task's actualHours
      const updatedTask = await tx.task.update({
        where: { id: taskId },
        data: { actualHours: totalTaskHours },
      });

      // 5. Recursively roll up hours to ancestor parent tasks
      if (task.parentTaskId) {
        await rollupParentHours(taskId, tenantId, tx);
      }

      // 6. Recalculate Project Labor Cost in ProjectBudget
      const allProjectTasks = await tx.task.findMany({
        where: { projectId, tenantId },
        select: { id: true },
      });
      const taskIds = allProjectTasks.map((t: { id: string }) => t.id);

      const allLogs = await tx.timeLog.findMany({
        where: { taskId: { in: taskIds } },
      });

      let totalProjectLaborCost = 0;
      let totalProjectHours = 0;

      for (const log of allLogs) {
        totalProjectHours += log.hoursLogged;
        const rate = log.hourlyRate || 50; // Fallback default rate
        totalProjectLaborCost += log.hoursLogged * rate;
      }

      // Update ProjectBudget if it exists
      await tx.projectBudget.updateMany({
        where: { projectId, tenantId },
        data: {
          actualLaborCost: totalProjectLaborCost,
        },
      });

      return {
        timeLog,
        task: updatedTask,
        totalProjectHours,
        totalProjectLaborCost,
      };
    });

    res.status(201).json({
      success: true,
      message: 'Time logged and hours rolled up successfully.',
      ...result,
    });
  } catch (err: any) {
    console.error('[Add Time Log Error]:', err);
    res.status(500).json({
      error: 'Failed to record time log.',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
  }
}
