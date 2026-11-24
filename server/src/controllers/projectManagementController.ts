import { Request, Response } from 'express';
import { prisma } from '../config/db.js';
import {
  calculateAvailableTeamCapacity,
  cascadeProjectGanttTasks,
  computeProjectCpm,
  getIsoWeekBounds,
} from '../services/schedulingEngine.js';
import { addCalendarDaysUtc } from '../services/saCalendarService.js';

function getTenantId(req: Request): string {
  const tenantId = (req.user || req.tenantContext)?.tenantId || req.tenantId;
  if (!tenantId) {
    throw new Error('Unauthorized: Missing verified tenant context.');
  }
  return tenantId;
}

function sendControllerError(res: Response, fallbackMessage: string, error: any): void {
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? fallbackMessage : (error?.message || fallbackMessage),
  });
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
    sendControllerError(res, 'Failed to fetch WBS items.', error);
  }
}

/**
 * 2. Project Scheduling & Critical Path Analysis (SA Working Calendar & CPM)
 */
export async function getCriticalPath(req: Request, res: Response): Promise<void> {
  try {
    const { projectId } = req.params;
    const tenantId = getTenantId(req);

    const [project, tasks] = await Promise.all([
      prisma.project.findFirst({
        where: { id: projectId, tenantId },
        select: { id: true, calendarId: true, createdAt: true },
      }),
      prisma.task.findMany({
        where: { projectId, tenantId },
        include: { milestone: true },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    const cpm = await computeProjectCpm(
      tasks.map((t) => {
        const cf =
          typeof t.customFields === 'object' && t.customFields !== null
            ? (t.customFields as Record<string, any>)
            : {};
        return {
          id: t.id,
          title: t.title,
          startDate: cf.startDate || null,
          dueDate: t.dueDate,
          durationDays: typeof cf.durationDays === 'number' ? cf.durationDays : null,
          estimatedHours: t.estimatedHours,
          predecessorTaskIds: Array.isArray(t.predecessorTaskIds)
            ? (t.predecessorTaskIds as string[])
            : [],
          priority: t.priority,
          status: t.status,
        };
      }),
      {
        calendarId: project?.calendarId || (req.query.calendarId ? String(req.query.calendarId) : undefined),
        tenantId,
        projectStartDate: project?.createdAt,
      }
    );

    res.json({
      success: true,
      projectId,
      criticalTaskIds: cpm.criticalTaskIds,
      criticalPathLengthHours: cpm.criticalPathLengthHours,
      totalTasks: tasks.length,
      calendarId: cpm.calendarId,
      calendarName: cpm.calendarName,
      projectStartDate: cpm.projectStartDate,
      projectFinishDate: cpm.projectFinishDate,
      projectDurationWorkingDays: cpm.projectDurationWorkingDays,
      tasks: cpm.tasks,
      holidaysInSpan: cpm.holidaysInSpan,
    });
  } catch (error: any) {
    sendControllerError(res, 'Failed to compute critical path.', error);
  }
}

export async function cascadeProjectSchedule(req: Request, res: Response): Promise<void> {
  try {
    const { projectId } = req.params;
    const tenantId = getTenantId(req);
    const calendarId = req.body?.calendarId ? String(req.body.calendarId) : undefined;

    const cpm = await cascadeProjectGanttTasks(tenantId, projectId, calendarId);
    res.json({
      success: true,
      projectId,
      ...cpm,
    });
  } catch (error: any) {
    sendControllerError(res, 'Failed to cascade Finish-to-Start schedule.', error);
  }
}

/**
 * 3. Resource & Capacity Management (Adjusted for SA Public Holidays & Working Days)
 */
export async function getResourceWorkload(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const refDate = req.query.weekStart ? String(req.query.weekStart) : new Date();
    const { mondayIso, sundayIso, monday } = getIsoWeekBounds(refDate);
    const year = monday.getUTCFullYear();
    const monthIndex = monday.getUTCMonth();
    const monthStartIso = `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`;
    const monthEndIso = new Date(Date.UTC(year, monthIndex + 1, 0)).toISOString().slice(0, 10);

    const [profiles, activeTasks, baseWeekCap, monthCap, annualCap] = await Promise.all([
      prisma.resourceProfile.findMany({
        where: { tenantId },
        include: { user: true },
      }),
      prisma.task.findMany({
        where: { tenantId, status: { in: ['todo', 'in_progress', 'review'] } },
      }),
      calculateAvailableTeamCapacity({ startDate: mondayIso, endDate: sundayIso, tenantId }),
      calculateAvailableTeamCapacity({ startDate: monthStartIso, endDate: monthEndIso, tenantId }),
      calculateAvailableTeamCapacity({
        startDate: `${year}-01-01`,
        endDate: `${year}-12-31`,
        tenantId,
      }),
    ]);

    const workloadMap = profiles.map((p) => {
      const userTasks = activeTasks.filter((t) => t.assigneeId === p.userId);
      const assignedHours = userTasks.reduce((sum, t) => sum + (t.estimatedHours || 5), 0);
      const baseWeeklyHours = p.weeklyCapacityHours || 40;
      const dailyHours = baseWeeklyHours / 5;
      // Scale available capacity by actual SA working days in the week so public holidays
      // are never flagged as under-utilization
      const effectiveWeeklyCapacityHours = Number(
        (baseWeekCap.workingDays * dailyHours).toFixed(2)
      );
      const monthlyAvailableHours = Number((monthCap.workingDays * dailyHours).toFixed(2));
      const annualAvailableHours = Number((annualCap.workingDays * dailyHours).toFixed(2));

      const denom = effectiveWeeklyCapacityHours > 0 ? effectiveWeeklyCapacityHours : baseWeeklyHours;
      const utilizationPercent = denom > 0 ? Math.round((assignedHours / denom) * 100) : 0;

      return {
        userId: p.userId,
        userName: p.user?.displayName || 'Worker',
        email: p.user?.email,
        department: p.department,
        skills: p.skills,
        weeklyCapacityHours: effectiveWeeklyCapacityHours,
        nominalWeeklyCapacityHours: baseWeeklyHours,
        monthlyAvailableHours,
        annualAvailableHours,
        workingDaysInWeek: baseWeekCap.workingDays,
        workingDaysInMonth: monthCap.workingDays,
        workingDaysInYear: annualCap.workingDays,
        assignedHours,
        utilizationPercent,
        hourlyCostRate: p.hourlyCostRate,
        hourlyBillingRate: p.hourlyBillingRate,
        status:
          effectiveWeeklyCapacityHours === 0
            ? 'optimal'
            : utilizationPercent > 100
              ? 'overallocated'
              : utilizationPercent >= 75
                ? 'optimal'
                : 'underallocated',
      };
    });

    res.json({
      success: true,
      calendar: {
        id: baseWeekCap.calendarId,
        name: baseWeekCap.calendarName,
        weekStart: mondayIso,
        weekEnd: sundayIso,
        workingDaysInWeek: baseWeekCap.workingDays,
        workingDaysInMonth: monthCap.workingDays,
        workingDaysInYear: annualCap.workingDays,
        holidaysInWeek: baseWeekCap.holidaysInPeriod,
        holidaysInMonth: monthCap.holidaysInPeriod,
      },
      data: workloadMap,
    });
  } catch (error: any) {
    sendControllerError(res, 'Failed to fetch resource workload.', error);
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

    const enriched = await Promise.all(
      timesheets.map(async (ts) => {
        const weekEnd = addCalendarDaysUtc(ts.weekStartDate, 6);
        const cap = await calculateAvailableTeamCapacity({
          startDate: ts.weekStartDate,
          endDate: weekEnd,
          tenantId,
        });
        return {
          ...ts,
          expectedCapacityHours: cap.availableHoursPerMember,
          workingDaysInWeek: cap.workingDays,
          holidaysInWeek: cap.holidaysInPeriod,
        };
      })
    );

    res.json({ success: true, data: enriched });
  } catch (error: any) {
    sendControllerError(res, 'Failed to fetch timesheets.', error);
  }
}

export async function submitTimesheet(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const { userId, weekStartDate, totalHours, billableHours, logIds } = req.body;
    const resolvedUserId = userId || req.user?.userId;

    const timesheet = await prisma.timesheet.create({
      data: {
        tenantId,
        userId: resolvedUserId,
        weekStartDate: new Date(weekStartDate),
        totalHours: Number(totalHours || 0),
        billableHours: Number(billableHours || 0),
        status: 'submitted',
      },
    });

    if (Array.isArray(logIds) && logIds.length > 0) {
      await prisma.timeLog.updateMany({
        where: {
          id: { in: logIds },
          task: { tenantId },
        },
        data: { timesheetId: timesheet.id },
      });
    }

    res.json({ success: true, data: timesheet });
  } catch (error: any) {
    sendControllerError(res, 'Failed to submit timesheet.', error);
  }
}

export async function updateTimesheetStatus(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const { id } = req.params;
    const { status, approverId, rejectionNote } = req.body;

    const existing = await prisma.timesheet.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      res.status(404).json({ success: false, error: 'Timesheet not found in active tenant.' });
      return;
    }

    const timesheet = await prisma.timesheet.update({
      where: { id: existing.id },
      data: {
        status,
        approverId: approverId || req.user?.userId || null,
        rejectionNote,
      },
    });

    res.json({ success: true, data: timesheet });
  } catch (error: any) {
    sendControllerError(res, 'Failed to update timesheet status.', error);
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
    sendControllerError(res, 'Failed to fetch invoices.', error);
  }
}

export async function generateInvoice(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const { projectId, invoiceNumber, dueDate, lineItems, subtotal, taxTotal, totalAmount, notes } = req.body;

    const project = await prisma.project.findFirst({ where: { id: projectId, tenantId } });
    if (!project) {
      res.status(404).json({ success: false, error: 'Project not found in active tenant.' });
      return;
    }

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
    sendControllerError(res, 'Failed to generate invoice.', error);
  }
}

export async function updateInvoiceStatus(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const { id } = req.params;
    const { status } = req.body; // requested | accepted | paid

    const existing = await prisma.projectInvoice.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      res.status(404).json({ success: false, error: 'Invoice not found in active tenant.' });
      return;
    }

    const invoice = await prisma.projectInvoice.update({
      where: { id: existing.id },
      data: { status },
    });

    res.json({ success: true, data: invoice });
  } catch (error: any) {
    sendControllerError(res, 'Failed to update invoice status.', error);
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
    sendControllerError(res, 'Failed to fetch documents.', error);
  }
}

export async function createDocument(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const { projectId, fileName, fileUrl, fileCategory, fileSize, version, uploadedById } = req.body;

    const project = await prisma.project.findFirst({ where: { id: projectId, tenantId } });
    if (!project) {
      res.status(404).json({ success: false, error: 'Project not found in active tenant.' });
      return;
    }

    const doc = await prisma.projectDocument.create({
      data: {
        tenantId,
        projectId,
        fileName,
        fileUrl,
        fileCategory: fileCategory || 'general',
        fileSize: Number(fileSize || 1024),
        version: version || '1.0',
        uploadedById: uploadedById || req.user?.userId,
      },
    });

    res.json({ success: true, data: doc });
  } catch (error: any) {
    sendControllerError(res, 'Failed to create document.', error);
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
    sendControllerError(res, 'Failed to fetch wiki pages.', error);
  }
}

export async function upsertWikiPage(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const { id, projectId, title, slug, contentMarkdown, authorId, tags } = req.body;

    if (id) {
      const existing = await prisma.projectWikiPage.findFirst({
        where: { id, tenantId },
      });

      if (!existing) {
        res.status(404).json({ success: false, error: 'Wiki page not found in active tenant.' });
        return;
      }

      const updated = await prisma.projectWikiPage.update({
        where: { id: existing.id },
        data: { title, slug, contentMarkdown, tags },
      });
      res.json({ success: true, data: updated });
    } else {
      const project = await prisma.project.findFirst({ where: { id: projectId, tenantId } });
      if (!project) {
        res.status(404).json({ success: false, error: 'Project not found in active tenant.' });
        return;
      }

      const created = await prisma.projectWikiPage.create({
        data: {
          tenantId,
          projectId,
          title,
          slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          contentMarkdown,
          authorId: authorId || req.user?.userId,
          tags: tags || [],
        },
      });
      res.json({ success: true, data: created });
    }
  } catch (error: any) {
    sendControllerError(res, 'Failed to save wiki page.', error);
  }
}

/**
 * 8. Client Portals & Change Requests
 */
export async function getClientPortalData(req: Request, res: Response): Promise<void> {
  try {
    const { projectId } = req.params;
    const tenantId = getTenantId(req);

    const project = await prisma.project.findFirst({
      where: { id: projectId, tenantId },
      include: {
        milestones: true,
        deliverables: true,
        changeRequests: true,
        account: true,
      },
    });

    if (!project) {
      res.status(404).json({ success: false, error: 'Project not found in active tenant.' });
      return;
    }

    res.json({
      success: true,
      data: project,
    });
  } catch (error: any) {
    sendControllerError(res, 'Failed to fetch client portal data.', error);
  }
}

export async function createChangeRequest(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const { projectId, title, description, costImpact, scheduleDaysImpact, clientNotes } = req.body;

    const project = await prisma.project.findFirst({ where: { id: projectId, tenantId } });
    if (!project) {
      res.status(404).json({ success: false, error: 'Project not found in active tenant.' });
      return;
    }

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
    sendControllerError(res, 'Failed to create change request.', error);
  }
}

export async function updateChangeRequestStatus(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const { id } = req.params;
    const { status } = req.body; // pending | approved | rejected

    const existing = await prisma.clientChangeRequest.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      res.status(404).json({ success: false, error: 'Change request not found in active tenant.' });
      return;
    }

    const cr = await prisma.clientChangeRequest.update({
      where: { id: existing.id },
      data: { status },
    });

    res.json({ success: true, data: cr });
  } catch (error: any) {
    sendControllerError(res, 'Failed to update change request status.', error);
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
    const budget = await prisma.projectBudget.findFirst({ where: { projectId, tenantId } });

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
    sendControllerError(res, 'Failed to compute analytics metrics.', error);
  }
}

/**
 * 10. System Administration & Workflow Rule Evaluator
 */
export async function evaluateWorkflowRules(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const { eventType, entityType } = req.body;

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
    sendControllerError(res, 'Failed to evaluate workflow rules.', error);
  }
}
