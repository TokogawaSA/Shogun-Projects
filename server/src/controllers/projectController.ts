import { Request, Response } from 'express';
import { prisma } from '../config/db.js';
import { updateTaskWithEvents } from '../services/taskService.js';

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
    res.status(500).json({ error: 'Failed to fetch projects.', details: err.message });
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
    res.status(500).json({ error: 'Failed to fetch project.', details: err.message });
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
          currency: data.currency || 'USD',
          profitMarginPercent: data.profitMarginPercent ? Number(data.profitMarginPercent) : 20,
        },
      });

      return newProj;
    });

    res.status(201).json(project);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create project.', details: err.message });
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
    res.status(500).json({ error: 'Failed to update project.', details: err.message });
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
    res.status(500).json({ error: 'Failed to delete project.', details: err.message });
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
    res.status(500).json({ error: 'Failed to fetch milestones.', details: err.message });
  }
}

export async function createMilestone(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;
    const { projectId } = req.params;
    const data = req.body;

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
    res.status(500).json({ error: 'Failed to create milestone.', details: err.message });
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
      where: { id },
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
    res.status(500).json({ error: 'Failed to update milestone.', details: err.message });
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

    await prisma.projectMilestone.delete({ where: { id } });
    res.json({ message: 'Milestone deleted successfully.', id });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete milestone.', details: err.message });
  }
}

// ============================================================================
// 3. TASKS CRUD
// ============================================================================

export async function getTasks(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;
    const { projectId } = req.query;

    const tasks = await prisma.task.findMany({
      where: {
        tenantId,
        ...(projectId ? { projectId: String(projectId) } : {}),
      },
      include: {
        assignee: { select: { id: true, displayName: true, email: true } },
        checklistSubtasks: true,
        subtasks: { select: { id: true, title: true, status: true, actualHours: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    res.json(tasks);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch tasks.', details: err.message });
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
        checklistSubtasks: true,
        timeLogs: { orderBy: { date: 'desc' } },
      },
    });

    if (!task) {
      res.status(404).json({ error: 'Task not found.' });
      return;
    }

    res.json(task);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch task.', details: err.message });
  }
}

export async function createTask(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;
    const userId = req.user!.userId;
    const data = req.body;

    const task = await prisma.task.create({
      data: {
        tenantId,
        projectId: data.projectId,
        title: data.title,
        description: data.description,
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
      },
    });

    res.status(201).json(task);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create task.', details: err.message });
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
      },
      userId
    );

    res.json(updated);
  } catch (err: any) {
    if (err.message?.includes('not found')) {
      res.status(404).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: 'Failed to update task.', details: err.message });
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
    res.status(500).json({ error: 'Failed to delete task.', details: err.message });
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
    res.status(500).json({ error: 'Failed to record time log.', details: err.message });
  }
}
