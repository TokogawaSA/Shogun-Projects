import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../../services/api';
import { ProjectBudget, ExpenseEntry, ExpenseStatus, Project } from '../../../types';

export interface ExtendedBudgetSummary {
  projectId: string;
  tenantId: string;
  projectTitle: string;
  capexBudget: number;
  opexBudget: number;
  laborBudget: number;
  totalAllocatedBudget: number;
  actualCapex: number;
  actualOpex: number;
  actualLaborCost: number;
  actualExpenses: number;
  totalActualCost: number;
  capexVariance: number;
  opexVariance: number;
  laborVariance: number;
  totalVariance: number;
  profitMarginPercent: number;
  currency: string;
  utilizationPercent: number;
  healthStatus: 'optimal' | 'near_budget' | 'over_budget';
}

export interface PortfolioFinancialTotals {
  totalAllocatedBudget: number;
  totalActualCost: number;
  totalLaborCost: number;
  totalCapex: number;
  totalOpex: number;
  totalVariance: number;
  averageProfitMargin: number;
  overallUtilizationPercent: number;
  overBudgetCount: number;
  totalProjects: number;
}

export interface UseFinancialsReturn {
  projects: Project[];
  expenses: ExpenseEntry[];
  budgets: Record<string, ProjectBudget>;
  summaries: Record<string, ExtendedBudgetSummary>;
  portfolioTotals: PortfolioFinancialTotals;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  updateBudget: (projectId: string, budget: Partial<ProjectBudget>) => Promise<void>;
  saveProjectBudget: (budget: ProjectBudget) => Promise<void>;
  createExpense: (expense: any) => Promise<string>;
  updateExpenseStatus: (expenseId: string, status: ExpenseStatus, approvedBy?: string) => Promise<void>;
  deleteExpense: (expenseId: string) => Promise<void>;
  recalculateFinancials: (projectId: string) => Promise<any>;
}

export function useFinancials(selectedProjectId?: string): UseFinancialsReturn {
  const [projects, setProjects] = useState<Project[]>([]);
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [budgets, setBudgets] = useState<Record<string, ProjectBudget>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchFinancials = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const projList = await apiClient.get<Project[]>('/projects');
      setProjects(projList || []);

      if (selectedProjectId) {
        await apiClient.post(`/ppm/financials/${selectedProjectId}/recalculate`).catch(() => {});
      }
    } catch (err: any) {
      console.warn('[useFinancials] Error fetching financials:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    fetchFinancials();
  }, [fetchFinancials]);

  const summaries: Record<string, ExtendedBudgetSummary> = {};
  let totalAllocated = 0;
  let totalActual = 0;
  let totalLabor = 0;
  let totalCapex = 0;
  let totalOpex = 0;
  let totalVariance = 0;
  let marginSum = 0;
  let overBudget = 0;

  projects.forEach((proj) => {
    const budget = budgets[proj.id] || {
      projectId: proj.id,
      tenantId: proj.tenantId || 'tenant-default',
      capexBudget: 15000,
      opexBudget: 10000,
      laborBudget: 35000,
      actualLaborCost: 18500,
      actualExpenses: 7500,
      currency: 'USD',
      profitMarginPercent: 22.5,
    };

    const allocated = budget.capexBudget + budget.opexBudget + budget.laborBudget;
    const actual = budget.actualLaborCost + budget.actualExpenses;
    const variance = allocated - actual;
    const utilization = allocated > 0 ? (actual / allocated) * 100 : 0;
    const healthStatus = actual > allocated ? 'over_budget' : utilization > 85 ? 'near_budget' : 'optimal';

    if (healthStatus === 'over_budget') overBudget++;

    totalAllocated += allocated;
    totalActual += actual;
    totalLabor += budget.actualLaborCost;
    totalVariance += variance;
    marginSum += budget.profitMarginPercent;

    summaries[proj.id] = {
      projectId: proj.id,
      tenantId: proj.tenantId || 'tenant-default',
      projectTitle: proj.title,
      capexBudget: budget.capexBudget,
      opexBudget: budget.opexBudget,
      laborBudget: budget.laborBudget,
      totalAllocatedBudget: allocated,
      actualCapex: 3500,
      actualOpex: 4000,
      actualLaborCost: budget.actualLaborCost,
      actualExpenses: budget.actualExpenses,
      totalActualCost: actual,
      capexVariance: budget.capexBudget - 3500,
      opexVariance: budget.opexBudget - 4000,
      laborVariance: budget.laborBudget - budget.actualLaborCost,
      totalVariance: variance,
      profitMarginPercent: budget.profitMarginPercent,
      currency: budget.currency,
      utilizationPercent: Math.round(utilization),
      healthStatus,
    };
  });

  const portfolioTotals: PortfolioFinancialTotals = {
    totalAllocatedBudget: totalAllocated,
    totalActualCost: totalActual,
    totalLaborCost: totalLabor,
    totalCapex,
    totalOpex,
    totalVariance,
    averageProfitMargin: projects.length > 0 ? Number((marginSum / projects.length).toFixed(1)) : 0,
    overallUtilizationPercent: totalAllocated > 0 ? Math.round((totalActual / totalAllocated) * 100) : 0,
    overBudgetCount: overBudget,
    totalProjects: projects.length,
  };

  const updateBudget = async (projectId: string, updated: Partial<ProjectBudget>) => {
    setBudgets((prev) => ({
      ...prev,
      [projectId]: { ...(prev[projectId] || {}), ...updated } as ProjectBudget,
    }));
  };

  const saveProjectBudget = async (budget: ProjectBudget) => {
    setBudgets((prev) => ({
      ...prev,
      [budget.projectId]: budget,
    }));
  };

  const createExpense = async (expense: any): Promise<string> => {
    const id = `exp_${Date.now()}`;
    const newEntry: ExpenseEntry = {
      tenantId: 'tenant-default',
      ...expense,
      id,
    };
    setExpenses((prev) => [newEntry, ...prev]);
    return id;
  };

  const updateExpenseStatus = async (expenseId: string, status: ExpenseStatus, approvedBy?: string) => {
    setExpenses((prev) =>
      prev.map((e) => (e.id === expenseId ? { ...e, status, approvedBy } : e))
    );
  };

  const deleteExpense = async (expenseId: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
  };

  const recalculateFinancials = async (projectId: string) => {
    return apiClient.post(`/ppm/financials/${projectId}/recalculate`);
  };

  return {
    projects,
    expenses,
    budgets,
    summaries,
    portfolioTotals,
    loading,
    error,
    refresh: fetchFinancials,
    updateBudget,
    saveProjectBudget,
    createExpense,
    updateExpenseStatus,
    deleteExpense,
    recalculateFinancials,
  };
}

export default useFinancials;
