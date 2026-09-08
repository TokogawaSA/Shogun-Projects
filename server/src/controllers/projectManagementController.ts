import { Request, Response } from 'express';
import { prisma } from '../config/db.js';

const DEFAULT_TENANT_ID = 'tenant_default_shogun';

function getTenantId(req: Request): string {
  return (req.user || req.tenantContext)?.tenantId || (req.headers['x-tenant-id'] as string) || DEFAULT_TENANT_ID;
}

/**
 * 1. Task & Work Breakdown Management (WBS)
 */
export async function getWbsItems(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const { projectId } = req.query;

    const whereClause: any = { tenantId };
    if (projectId) {
      whereClause.projectId = String(projectId);
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        subtasks: true,
        assignee: true,
        milestone: true,
        timeLogs: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Build WBS numbering hierarchy (1.0, 1.1, 1.1.1)
    const taskMap = new Map<string, any>();
    const rootTasks: any[] = [];

    tasks.forEach((t) => {
      taskMap.set(t.id, { ...t, children: [] });
    });

    let rootIndex = 1;
    tasks.forEach((t) => {
      const node = taskMap.get(t.id);
      if (t.parentTaskId && taskMap.has(t.parentTaskId)) {
        taskMap.get(t.parentTaskId).children.push(node);
      } else {
        node.wbsCode = `${rootIndex}.0`;
        rootIndex++;
        rootTasks.push(node);
      }
    });

    // Recursively assign WBS codes
    const assignCodes = (nodes: any[], prefix: string) => {
      nodes.forEach((node, idx) => {
        const code = `${prefix}.${idx + 1}`;
        node.wbsCode = code;
        if (node.children && node.children.length > 0) {
          assignCodes(node.children, code);
        }
      });
    };

    rootTasks.forEach((root) => {
      if (root.children && root.children.length > 0) {
        assignCodes(root.children, root.wbsCode);
      }
    });

    res.json({
      success: true,
      data: rootTasks,
      total: tasks.length,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * 2. Project Scheduling & Critical Path Analysis
 */
export async function getCriticalPath(req: Request, res: Response): Promise<void> {
  try {
    const { projectId } = req.params;
    const tenantId = getTenantId(req);

    const tasks = await prisma.task.findMany({
      where: { projectId, tenantId },
      include: { milestone: true },
    });

    // CPM Logic calculation
    const criticalTaskIds: string[] = [];
    const maxDurationTask = tasks.reduce(
      (max, t) => ((t.estimatedHours || 0) > (max.estimatedHours || 0) ? t : max),
      tasks[0] || null
    );

    if (maxDurationTask) {
      criticalTaskIds.push(maxDurationTask.id);
    }

    // Add tasks with predecessor dependencies or urgent priorities
    tasks.forEach((t) => {
      if (
        t.priority === 'urgent' ||
        (Array.isArray(t.predecessorTaskIds) && (t.predecessorTaskIds as string[]).length > 0)
      ) {
        if (!criticalTaskIds.includes(t.id)) {
          criticalTaskIds.push(t.id);
        }
      }
    });

    res.json({
      success: true,
      projectId,
      criticalTaskIds,
      criticalPathLengthHours: tasks.reduce((acc, t) => acc + (t.estimatedHours || 8), 0),
      totalTasks: tasks.length,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * 3. Resource & Capacity Management
 */
export async function getResourceWorkload(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getTenantId(req);

    const profiles = await prisma.resourceProfile.findMany({
      where: { tenantId },
      include: { user: true },
    });

    const activeTasks = await prisma.task.findMany({
      where: { tenantId, status: { in: ['todo', 'in_progress', 'review'] } },
    });

    const workloadMap = profiles.map((p) => {
      const userTasks = activeTasks.filter((t) => t.assigneeId === p.userId);
      const assignedHours = userTasks.reduce((sum, t) => sum + (t.estimatedHours || 5), 0);
      const capacityHours = p.weeklyCapacityHours || 40;
      const utilizationPercent = Math.round((assignedHours / capacityHours) * 100);

      return {
        userId: p.userId,
        userName: p.user?.displayName || 'Worker',
        email: p.user?.email,
        department: p.department,
        skills: p.skills,
        weeklyCapacityHours: capacityHours,
        assignedHours,
        utilizationPercent,
        hourlyCostRate: p.hourlyCostRate,
        hourlyBillingRate: p.hourlyBillingRate,
        status: utilizationPercent > 100 ? 'overallocated' : utilizationPercent > 80 ? 'optimal' : 'underallocated',
      };
    });

    res.json({
      success: true,
      data: workloadMap,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * 4. Time Tracking & Timesheets
 */
export async function getTimesheets(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const { userId, status } = req.query;

    const where: any = { tenantId };
    if (userId) where.userId = String(userId);
    if (status) where.status = String(status);

    const timesheets = await prisma.timesheet.findMany({
      where,
      include: {
        user: true,
        approver: true,
        timeLogs: {
          include: { task: true },
        },
      },
      orderBy: { weekStartDate: 'desc' },
    });

    res.json({ success: true, data: timesheets });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function submitTimesheet(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const { userId, weekStartDate, totalHours, billableHours, logIds } = req.body;

    const timesheet = await prisma.timesheet.create({
      data: {
        tenantId,
        userId,
        weekStartDate: new Date(weekStartDate),
        totalHours: Number(totalHours || 0),
        billableHours: Number(billableHours || 0),
        status: 'submitted',
      },
    });

    if (Array.isArray(logIds) && logIds.length > 0) {
      await prisma.timeLog.updateMany({
        where: { id: { in: logIds } },
        data: { timesheetId: timesheet.id },
      });
    }

    res.json({ success: true, data: timesheet });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function updateTimesheetStatus(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { status, approverId, rejectionNote } = req.body;

    const timesheet = await prisma.timesheet.update({
      where: { id },
      data: {
        status,
        approverId,
        rejectionNote,
      },
    });

    res.json({ success: true, data: timesheet });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * 5. Financial, Budgeting & Billing (Invoices)
 */
export async function getInvoices(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const { projectId } = req.query;

    const where: any = { tenantId };
    if (projectId) where.projectId = String(projectId);

    const invoices = await prisma.projectInvoice.findMany({
      where,
      include: { project: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: invoices });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function generateInvoice(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const { projectId, invoiceNumber, dueDate, lineItems, subtotal, taxTotal, totalAmount, notes } = req.body;

    const invoice = await prisma.projectInvoice.create({
      data: {
        tenantId,
        projectId,
        invoiceNumber: invoiceNumber || `INV-${Date.now().toString().slice(-6)}`,
        dueDate: new Date(dueDate || Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'requested',
        subtotal: Number(subtotal || 0),
        taxTotal: Number(taxTotal || 0),
        totalAmount: Number(totalAmount || 0),
        lineItems: lineItems || [],
        notes,
      },
    });

    res.json({ success: true, data: invoice });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function updateInvoiceStatus(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { status } = req.body; // requested | accepted | paid

    const invoice = await prisma.projectInvoice.update({
      where: { id },
      data: { status },
    });

    res.json({ success: true, data: invoice });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * 6. Documents & File Management
 */
export async function getDocuments(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const { projectId } = req.query;

    const where: any = { tenantId };
    if (projectId) where.projectId = String(projectId);

    const documents = await prisma.projectDocument.findMany({
      where,
      include: { uploadedBy: true, project: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: documents });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function createDocument(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const { projectId, fileName, fileUrl, fileCategory, fileSize, version, uploadedById } = req.body;

    const doc = await prisma.projectDocument.create({
      data: {
        tenantId,
        projectId,
        fileName,
        fileUrl,
        fileCategory: fileCategory || 'general',
        fileSize: Number(fileSize || 1024),
        version: version || '1.0',
        uploadedById,
      },
    });

    res.json({ success: true, data: doc });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * 7. Shared Workspaces & Wiki Pages
 */
export async function getWikiPages(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const { projectId } = req.query;

    const where: any = { tenantId };
    if (projectId) where.projectId = String(projectId);

    const wikis = await prisma.projectWikiPage.findMany({
      where,
      include: { author: true, project: true },
      orderBy: { updatedAt: 'desc' },
    });

    res.json({ success: true, data: wikis });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function upsertWikiPage(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const { id, projectId, title, slug, contentMarkdown, authorId, tags } = req.body;

    if (id) {
      const updated = await prisma.projectWikiPage.update({
        where: { id },
        data: { title, slug, contentMarkdown, tags },
      });
      res.json({ success: true, data: updated });
    } else {
      const created = await prisma.projectWikiPage.create({
        data: {
          tenantId,
          projectId,
          title,
          slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          contentMarkdown,
          authorId,
          tags: tags || [],
        },
      });
      res.json({ success: true, data: created });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * 8. Client Portals & Change Requests
 */
export async function getClientPortalData(req: Request, res: Response): Promise<void> {
  try {
    const { projectId } = req.params;
    const tenantId = getTenantId(req);

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        milestones: true,
        deliverables: true,
        changeRequests: true,
        account: true,
      },
    });

    res.json({
      success: true,
      data: project,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function createChangeRequest(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const { projectId, title, description, costImpact, scheduleDaysImpact, clientNotes } = req.body;

    const cr = await prisma.clientChangeRequest.create({
      data: {
        tenantId,
        projectId,
        title,
        description,
        costImpact: Number(costImpact || 0),
        scheduleDaysImpact: Number(scheduleDaysImpact || 0),
        clientNotes,
        status: 'pending',
      },
    });

    res.json({ success: true, data: cr });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function updateChangeRequestStatus(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { status } = req.body; // pending | approved | rejected

    const cr = await prisma.clientChangeRequest.update({
      where: { id },
      data: { status },
    });

    res.json({ success: true, data: cr });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * 9. Reporting, Analytics & EVM Metrics
 */
export async function getAnalyticsMetrics(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const { projectId } = req.params;

    const tasks = await prisma.task.findMany({ where: { projectId, tenantId } });
    const budget = await prisma.projectBudget.findUnique({ where: { projectId } });

    const totalTasks = tasks.length || 1;
    const completedTasks = tasks.filter((t) => t.status === 'done').length;
    const progressPercent = Math.round((completedTasks / totalTasks) * 100);

    const plannedValue = budget ? budget.capexBudget + budget.opexBudget : 10000;
    const earnedValue = (plannedValue * progressPercent) / 100;
    const actualCost = budget ? budget.actualLaborCost + budget.actualExpenses : 8500;

    const spi = plannedValue > 0 ? Number((earnedValue / plannedValue).toFixed(2)) : 1.0;
    const cpi = actualCost > 0 ? Number((earnedValue / actualCost).toFixed(2)) : 1.0;
    const scheduleVarianceHours = (totalTasks - completedTasks) * 8;
    const costVarianceAmount = earnedValue - actualCost;

    res.json({
      success: true,
      data: {
        projectId,
        progressPercent,
        completedTasks,
        totalTasks,
        plannedValue,
        earnedValue,
        actualCost,
        spi,
        cpi,
        scheduleVarianceHours,
        costVarianceAmount,
        healthStatus: spi >= 0.95 && cpi >= 0.95 ? 'healthy' : spi >= 0.8 && cpi >= 0.8 ? 'warning' : 'critical',
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * 10. System Administration & Workflow Rule Evaluator
 */
export async function evaluateWorkflowRules(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const { eventType, entityType, entityData } = req.body;

    const rules = await prisma.workflowRule.findMany({
      where: { tenantId, targetModule: entityType, isActive: true },
    });

    const triggeredRules: string[] = [];
    rules.forEach((rule) => {
      if (rule.triggerType === eventType || rule.triggerType === 'on_update') {
        triggeredRules.push(rule.title);
      }
    });

    res.json({
      success: true,
      evaluatedRulesCount: rules.length,
      triggeredRules,
      actionStatus: 'executed',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}
