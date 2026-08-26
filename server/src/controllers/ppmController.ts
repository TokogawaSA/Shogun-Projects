import { Request, Response } from 'express';
import { prisma } from '../config/db.js';

// ============================================================================
// 1. PORTFOLIOS & STRATEGY
// ============================================================================

export async function getPortfolios(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;
    const portfolios = await prisma.portfolio.findMany({
      where: { tenantId },
      include: {
        owner: { select: { id: true, displayName: true, email: true } },
        projects: { select: { id: true, title: true, createdAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(portfolios);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch portfolios.', details: err.message });
  }
}

export async function createPortfolio(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;
    const userId = req.user!.userId;
    const data = req.body;

    const portfolio = await prisma.portfolio.create({
      data: {
        tenantId,
        name: data.name,
        description: data.description,
        strategicGoal: data.strategicGoal || 'Operational Excellence',
        budgetAllocated: data.budgetAllocated !== undefined ? Number(data.budgetAllocated) : 0,
        targetROI: data.targetROI !== undefined ? Number(data.targetROI) : null,
        ownerId: data.ownerId || userId,
      },
    });

    res.status(201).json(portfolio);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create portfolio.', details: err.message });
  }
}

// ============================================================================
// 2. RESOURCE PROFILES & SKILLS
// ============================================================================

export async function getResourceProfiles(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;
    const profiles = await prisma.resourceProfile.findMany({
      where: { tenantId },
      include: {
        user: { select: { id: true, displayName: true, email: true, role: true } },
      },
    });
    res.json(profiles);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch resource profiles.', details: err.message });
  }
}

export async function upsertResourceProfile(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;
    const data = req.body;
    const userId = data.userId || req.user!.userId;

    const profile = await prisma.resourceProfile.upsert({
      where: { userId },
      update: {
        department: data.department,
        skills: data.skills || [],
        weeklyCapacityHours: data.weeklyCapacityHours !== undefined ? Number(data.weeklyCapacityHours) : 40,
        hourlyCostRate: data.hourlyCostRate !== undefined ? Number(data.hourlyCostRate) : 0,
        hourlyBillingRate: data.hourlyBillingRate !== undefined ? Number(data.hourlyBillingRate) : 0,
        globalWorkloadHours: data.globalWorkloadHours || {},
      },
      create: {
        tenantId,
        userId,
        department: data.department || 'Engineering',
        skills: data.skills || [],
        weeklyCapacityHours: data.weeklyCapacityHours !== undefined ? Number(data.weeklyCapacityHours) : 40,
        hourlyCostRate: data.hourlyCostRate !== undefined ? Number(data.hourlyCostRate) : 0,
        hourlyBillingRate: data.hourlyBillingRate !== undefined ? Number(data.hourlyBillingRate) : 0,
        globalWorkloadHours: data.globalWorkloadHours || {},
      },
    });

    res.json(profile);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to save resource profile.', details: err.message });
  }
}

// ============================================================================
// 3. FINANCIALS RECALCULATION & VARIANCE ANALYSIS
// ============================================================================

/**
 * POST /api/ppm/financials/:projectId/recalculate
 * Recomputes labor costs from time logs, CapEx/OpEx from expenses, and budget variance.
 */
export async function recalculateFinancials(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;
    const { projectId } = req.params;

    // 1. Get project tasks and sum labor costs from TimeLogs
    const tasks = await prisma.task.findMany({
      where: { projectId, tenantId },
      select: { id: true },
    });
    const taskIds = tasks.map((t) => t.id);

    const timeLogs = await prisma.timeLog.findMany({
      where: { taskId: { in: taskIds } },
    });

    let totalLaborCost = 0;
    let totalLaborHours = 0;

    for (const log of timeLogs) {
      totalLaborHours += log.hoursLogged;
      const rate = log.hourlyRate || 50;
      totalLaborCost += log.hoursLogged * rate;
    }

    // 2. Sum expenses
    const expenses = await prisma.expenseEntry.findMany({
      where: { projectId, tenantId, status: { not: 'rejected' } },
    });

    let totalExpenses = 0;
    let capexActual = 0;
    let opexActual = 0;

    for (const exp of expenses) {
      totalExpenses += exp.amount;
      if (exp.category === 'hardware' || exp.category === 'software') {
        capexActual += exp.amount;
      } else {
        opexActual += exp.amount;
      }
    }

    // 3. Update or create ProjectBudget
    const budget = await prisma.projectBudget.upsert({
      where: { projectId },
      update: {
        actualLaborCost: totalLaborCost,
        actualExpenses: totalExpenses,
      },
      create: {
        projectId,
        tenantId,
        capexBudget: 0,
        opexBudget: 0,
        laborBudget: 0,
        actualLaborCost: totalLaborCost,
        actualExpenses: totalExpenses,
        currency: 'USD',
        profitMarginPercent: 20,
      },
    });

    const totalAllocatedBudget = budget.capexBudget + budget.opexBudget + budget.laborBudget;
    const totalActualSpend = totalLaborCost + totalExpenses;
    const variance = totalAllocatedBudget - totalActualSpend;
    const isOverBudget = totalActualSpend > totalAllocatedBudget && totalAllocatedBudget > 0;

    res.json({
      success: true,
      projectId,
      currency: budget.currency,
      allocatedBudget: {
        capex: budget.capexBudget,
        opex: budget.opexBudget,
        labor: budget.laborBudget,
        total: totalAllocatedBudget,
      },
      actuals: {
        laborHours: totalLaborHours,
        laborCost: totalLaborCost,
        expensesCost: totalExpenses,
        capexActual,
        opexActual,
        totalActualSpend,
      },
      financialHealth: {
        variance,
        isOverBudget,
        profitMarginPercent: budget.profitMarginPercent,
      },
    });
  } catch (err: any) {
    console.error('[Recalculate Financials Error]:', err);
    res.status(500).json({ error: 'Failed to recalculate financials.', details: err.message });
  }
}

// ============================================================================
// 4. RISK SCORING & AUDIT (probability * impact)
// ============================================================================

export async function getRisks(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;
    const { projectId } = req.query;

    const risks = await prisma.riskItem.findMany({
      where: {
        tenantId,
        ...(projectId ? { projectId: String(projectId) } : {}),
      },
      include: {
        owner: { select: { id: true, displayName: true, email: true } },
        project: { select: { id: true, title: true } },
      },
      orderBy: { riskScore: 'desc' },
    });

    res.json(risks);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch risks.', details: err.message });
  }
}

/**
 * POST /api/ppm/risks
 * Automatically computes riskScore = probability * impact (1–25) and flags critical items (>= 15)
 */
export async function createRisk(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;
    const userId = req.user!.userId;
    const data = req.body;

    const probability = Math.min(5, Math.max(1, Number(data.probability || 1)));
    const impact = Math.min(5, Math.max(1, Number(data.impact || 1)));
    const riskScore = probability * impact;
    const isCritical = riskScore >= 15;

    const risk = await prisma.riskItem.create({
      data: {
        tenantId,
        projectId: data.projectId,
        title: data.title,
        description: data.description,
        category: data.category || 'operational',
        probability,
        impact,
        riskScore,
        mitigationPlan: data.mitigationPlan || '',
        departmentDependencies: data.departmentDependencies || [],
        status: data.status || 'open',
        ownerId: data.ownerId || userId,
      },
    });

    res.status(201).json({
      ...risk,
      isCritical,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create risk item.', details: err.message });
  }
}

export async function updateRisk(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;
    const data = req.body;

    const existing = await prisma.riskItem.findFirst({ where: { id, tenantId } });
    if (!existing) {
      res.status(404).json({ error: 'Risk item not found.' });
      return;
    }

    const probability = data.probability !== undefined ? Math.min(5, Math.max(1, Number(data.probability))) : existing.probability;
    const impact = data.impact !== undefined ? Math.min(5, Math.max(1, Number(data.impact))) : existing.impact;
    const riskScore = probability * impact;
    const isCritical = riskScore >= 15;

    const updated = await prisma.riskItem.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        probability,
        impact,
        riskScore,
        mitigationPlan: data.mitigationPlan,
        departmentDependencies: data.departmentDependencies,
        status: data.status,
        ownerId: data.ownerId,
      },
    });

    res.json({
      ...updated,
      isCritical,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update risk item.', details: err.message });
  }
}
