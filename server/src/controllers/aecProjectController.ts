import { Request, Response } from 'express';
import { prisma } from '../config/db.js';
import { calculateAvailableTeamCapacity, getIsoWeekBounds } from '../services/schedulingEngine.js';

/**
 * Controller: AEC Architectural Project Management Engine
 * Adheres to Architectural PM Builder Domain Specification:
 * - Phase-Gated Project Hierarchy (SD, DD, CD, CA)
 * - Financial Fee Burn & Net Multiplier Tracking
 * - Construction Administration: RFIs, Submittals, and Site Reports
 * - Drawing Revision Control with Bluebeam links
 * - Studio Resource Capacity Heatmaps
 */

// ==========================================
// 1. Project Phases & Milestone Gatekeeping
// ==========================================

function resolveTenantId(req: Request): string {
  const tenantId = (req.user || req.tenantContext)?.tenantId || req.tenantId;
  if (!tenantId) {
    throw new Error('Unauthorized: Missing tenant context.');
  }
  return tenantId;
}

export async function getProjectPhases(req: Request, res: Response): Promise<void> {
  const { projectId } = req.params;

  try {
    const tenantId = resolveTenantId(req);
    const phases = await prisma.projectPhase.findMany({
      where: { projectId, tenantId },
      include: {
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            discipline: true,
            requiredRole: true,
            isGatekeeper: true,
            prerequisiteTaskId: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json(phases);
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to retrieve project phases',
      ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {}),
    });
  }
}

export async function signOffProjectPhase(req: Request, res: Response): Promise<void> {
  const { projectId, phaseId } = req.params;
  const { signOffBy } = req.body;

  try {
    const tenantId = resolveTenantId(req);
    const existing = await prisma.projectPhase.findFirst({
      where: {
        id: phaseId,
        tenantId,
        ...(projectId ? { projectId } : {}),
      },
    });

    if (!existing) {
      res.status(404).json({ error: 'Project phase not found in active tenant.' });
      return;
    }

    const updated = await prisma.projectPhase.update({
      where: { id: existing.id },
      data: {
        isCompleted: true,
        signOffDate: new Date(),
        signOffBy: signOffBy || req.user?.email || 'Authorized Signatory',
      },
    });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to sign off phase',
      ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {}),
    });
  }
}

// ==========================================
// 2. Drawing Revision Control & Sheet Register
// ==========================================

export async function getDrawingSheets(req: Request, res: Response): Promise<void> {
  const { projectId } = req.params;

  try {
    const tenantId = resolveTenantId(req);
    const sheets = await prisma.drawingSheet.findMany({
      where: { projectId, tenantId },
      include: {
        versions: {
          orderBy: { issueDate: 'desc' },
        },
      },
      orderBy: { sheetNumber: 'asc' },
    });

    res.json(sheets);
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to retrieve drawing sheets',
      ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {}),
    });
  }
}

export async function createDrawingSheet(req: Request, res: Response): Promise<void> {
  const { projectId } = req.params;
  const { sheetNumber, title, discipline, currentRevision, issueStatus } = req.body;

  try {
    const tenantId = resolveTenantId(req);
    const project = await prisma.project.findFirst({ where: { id: projectId, tenantId } });
    if (!project) {
      res.status(404).json({ error: 'Project not found in active tenant.' });
      return;
    }

    const sheet = await prisma.drawingSheet.create({
      data: {
        projectId,
        tenantId,
        sheetNumber,
        title,
        discipline: discipline || 'Architectural',
        currentRevision: currentRevision || 'Rev 01',
        issueStatus: issueStatus || 'For Review',
      },
    });
    res.status(201).json(sheet);
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to create drawing sheet',
      ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {}),
    });
  }
}

// ==========================================
// 3. CA Hub: RFIs & Submittals with SLAs
// ==========================================

export async function getRfiLog(req: Request, res: Response): Promise<void> {
  const { projectId } = req.params;

  try {
    const tenantId = resolveTenantId(req);
    const rfis = await prisma.rfi.findMany({
      where: { projectId, tenantId },
      orderBy: { rfiNumber: 'desc' },
    });

    res.json(rfis);
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to retrieve RFIs',
      ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {}),
    });
  }
}

export async function createRfi(req: Request, res: Response): Promise<void> {
  const { projectId } = req.params;
  const { subject, disciplineTag, question, impactCost, impactSchedule, turnAroundDays } = req.body;

  try {
    const tenantId = resolveTenantId(req);
    const project = await prisma.project.findFirst({ where: { id: projectId, tenantId } });
    if (!project) {
      res.status(404).json({ error: 'Project not found in active tenant.' });
      return;
    }

    const count = await prisma.rfi.count({ where: { projectId, tenantId } });
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (turnAroundDays || 10)); // Default 10-day turnaround SLA

    const rfi = await prisma.rfi.create({
      data: {
        projectId,
        tenantId,
        rfiNumber: count + 1,
        subject,
        disciplineTag: disciplineTag || 'General',
        question,
        impactCost: Boolean(impactCost),
        impactSchedule: Boolean(impactSchedule),
        status: 'SUBMITTED',
        dueDate,
      },
    });
    res.status(201).json(rfi);
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to create RFI',
      ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {}),
    });
  }
}

export async function respondToRfi(req: Request, res: Response): Promise<void> {
  const { projectId, rfiId } = req.params;
  const { response, status } = req.body;

  try {
    const tenantId = resolveTenantId(req);
    const existing = await prisma.rfi.findFirst({
      where: {
        id: rfiId,
        tenantId,
        ...(projectId ? { projectId } : {}),
      },
    });

    if (!existing) {
      res.status(404).json({ error: 'RFI not found in active tenant.' });
      return;
    }

    const updated = await prisma.rfi.update({
      where: { id: existing.id },
      data: {
        response,
        status: status || 'RESPONDED',
        resolvedAt: status === 'CLOSED' || status === 'RESPONDED' ? new Date() : null,
      },
    });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to respond to RFI',
      ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {}),
    });
  }
}

export async function getSubmittalLog(req: Request, res: Response): Promise<void> {
  const { projectId } = req.params;

  try {
    const tenantId = resolveTenantId(req);
    const submittals = await prisma.submittal.findMany({
      where: { projectId, tenantId },
      orderBy: { submittalNumber: 'desc' },
    });

    res.json(submittals);
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to retrieve submittals',
      ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {}),
    });
  }
}

// ==========================================
// 4. Field Observation Logs & Site Reports
// ==========================================

export async function getSiteReports(req: Request, res: Response): Promise<void> {
  const { projectId } = req.params;

  try {
    const tenantId = resolveTenantId(req);
    const reports = await prisma.siteReport.findMany({
      where: { projectId, tenantId },
      orderBy: { reportNumber: 'desc' },
    });

    res.json(reports);
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to retrieve site reports',
      ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {}),
    });
  }
}

export async function createSiteReport(req: Request, res: Response): Promise<void> {
  const { projectId } = req.params;
  const { weather, attendees, observations, punchList, photos } = req.body;

  try {
    const tenantId = resolveTenantId(req);
    const project = await prisma.project.findFirst({ where: { id: projectId, tenantId } });
    if (!project) {
      res.status(404).json({ error: 'Project not found in active tenant.' });
      return;
    }

    const count = await prisma.siteReport.count({ where: { projectId, tenantId } });
    const report = await prisma.siteReport.create({
      data: {
        projectId,
        tenantId,
        reportNumber: count + 1,
        visitDate: new Date(),
        weather,
        attendees: attendees || [],
        observations,
        punchList: punchList || [],
        photos: photos || [],
      },
    });
    res.status(201).json(report);
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to create site report',
      ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {}),
    });
  }
}

// ==========================================
// 5. Studio Capacity & PPM Governance Rollups
// ==========================================

export async function getStudioCapacityHeatmap(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = resolveTenantId(req);
    const refDate = req.query.weekStart ? String(req.query.weekStart) : new Date();
    const { mondayIso, sundayIso, monday } = getIsoWeekBounds(refDate);
    const year = monday.getUTCFullYear();
    const monthIdx = monday.getUTCMonth();
    const monthStartIso = `${year}-${String(monthIdx + 1).padStart(2, '0')}-01`;
    const monthEndIso = new Date(Date.UTC(year, monthIdx + 1, 0)).toISOString().slice(0, 10);

    const [profiles, activeTasks, weekCap, monthCap, annualCap] = await Promise.all([
      prisma.resourceProfile.findMany({
        where: { tenantId },
        include: { user: { select: { id: true, displayName: true, email: true, role: true } } },
      }),
      prisma.task.findMany({
        where: { tenantId, status: { in: ['todo', 'in_progress', 'review'] } },
        select: { id: true, assigneeId: true, estimatedHours: true, discipline: true },
      }),
      calculateAvailableTeamCapacity({ startDate: mondayIso, endDate: sundayIso, tenantId }),
      calculateAvailableTeamCapacity({ startDate: monthStartIso, endDate: monthEndIso, tenantId }),
      calculateAvailableTeamCapacity({
        startDate: `${year}-01-01`,
        endDate: `${year}-12-31`,
        tenantId,
      }),
    ]);

    const studioCapacityData = profiles.map((p) => {
      const assigned = activeTasks
        .filter((t) => t.assigneeId === p.userId)
        .reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
      const baseWeekly = p.weeklyCapacityHours || 40;
      const dailyHours = baseWeekly / 5;
      const effectiveWeeklyCapacityHours = Number((weekCap.workingDays * dailyHours).toFixed(2));
      const monthlyAvailableHours = Number((monthCap.workingDays * dailyHours).toFixed(2));
      const denom = effectiveWeeklyCapacityHours > 0 ? effectiveWeeklyCapacityHours : baseWeekly;

      return {
        userId: p.userId,
        displayName: p.user?.displayName || 'Studio Member',
        department: p.department,
        weeklyCapacityHours: effectiveWeeklyCapacityHours,
        nominalWeeklyCapacityHours: baseWeekly,
        monthlyAvailableHours,
        workingDaysInWeek: weekCap.workingDays,
        workingDaysInMonth: monthCap.workingDays,
        workingDaysInYear: annualCap.workingDays,
        assignedHours: assigned,
        utilizationPercent: denom > 0 ? Math.round((assigned / denom) * 100) : 0,
      };
    });

    const totalStudioWeeklyCapacityHours = studioCapacityData.reduce(
      (sum, p) => sum + p.weeklyCapacityHours,
      0
    );

    res.json({
      studioCapacityData,
      overallocationThresholdHours: weekCap.availableHoursPerMember || 40,
      activeDisciplines: ['Architectural', 'Structural', 'MEP', 'BIM / Computational', 'Civil'],
      totalStudioWeeklyCapacityHours,
      workingCalendar: {
        calendarId: weekCap.calendarId,
        calendarName: weekCap.calendarName,
        workingDaysInWeek: weekCap.workingDays,
        workingDaysInMonth: monthCap.workingDays,
        workingDaysInYear: annualCap.workingDays,
        holidaysInWeek: weekCap.holidaysInPeriod,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to retrieve studio capacity heatmap',
      ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {}),
    });
  }
}

export async function getStudioNetMultiplier(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = resolveTenantId(req);
    const [invoices, subConsultants, budgets] = await Promise.all([
      prisma.projectInvoice.findMany({ where: { tenantId } }),
      prisma.subConsultantLedger.findMany({ where: { tenantId } }),
      prisma.projectBudget.findMany({
        where: { tenantId },
        include: { project: { select: { id: true, title: true, targetMultiplier: true } } },
      }),
    ]);

    const grossInvoicedFees = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
    const subConsultantPassThroughs = subConsultants.reduce(
      (sum, sc) => sum + Number(sc.invoicedAmount || 0),
      0
    );
    const netRevenue = Math.max(0, grossInvoicedFees - subConsultantPassThroughs);
    const directLaborCost = budgets.reduce((sum, b) => sum + (b.actualLaborCost || 0), 0);
    const currentMultiplier =
      directLaborCost > 0 ? Number((netRevenue / directLaborCost).toFixed(2)) : 3.0;

    const healthStatus =
      currentMultiplier >= 2.8
        ? 'HEALTHY_ON_TARGET'
        : currentMultiplier >= 2.2
          ? 'WARNING_BELOW_BENCHMARK'
          : 'CRITICAL_FEE_EROSION';

    res.json({
      grossInvoicedFees,
      subConsultantPassThroughs,
      netRevenue,
      directLaborCost,
      currentMultiplier,
      targetBenchmarkRange: { min: 2.8, max: 3.2 },
      healthStatus,
      unbilledScopeHours: 0,
      unbilledScopeCostRisk: 0,
      projectBreakdown: budgets.map((b) => ({
        projectId: b.projectId,
        projectTitle: b.project?.title,
        actualLaborCost: b.actualLaborCost,
        actualExpenses: b.actualExpenses,
      })),
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to calculate studio net multiplier',
      ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {}),
    });
  }
}

export async function getSubConsultantLedger(req: Request, res: Response): Promise<void> {
  const { projectId } = req.params;

  try {
    const tenantId = resolveTenantId(req);
    const ledgers = await prisma.subConsultantLedger.findMany({
      where: { projectId, tenantId },
      orderBy: { createdAt: 'asc' },
    });

    res.json(ledgers);
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to retrieve sub-consultant ledgers',
      ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {}),
    });
  }
}
