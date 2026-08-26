import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  DollarSign, 
  TrendingUp, 
  PieChart, 
  Calculator, 
  Receipt, 
  AlertTriangle, 
  CheckCircle2, 
  BarChart3, 
  FolderKanban, 
  RefreshCw,
  Loader2
} from 'lucide-react';
import { useFinancials } from '../hooks/useFinancials';

export const FinancialDashboard: React.FC = () => {
  const { summaries, portfolioTotals, loading, refresh } = useFinancials();

  const formatCurrency = (val: number, curr = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: curr || 'USD',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const projectSummaries = Object.values(summaries);

  // Compute category spend totals
  const totalCapex = portfolioTotals.totalCapex;
  const totalOpex = portfolioTotals.totalOpex;
  const totalLabor = portfolioTotals.totalLaborCost;
  const grandSpend = totalCapex + totalOpex + totalLabor || 1;

  const capexShare = Math.round((totalCapex / grandSpend) * 100);
  const opexShare = Math.round((totalOpex / grandSpend) * 100);
  const laborShare = Math.round((totalLabor / grandSpend) * 100);

  return (
    <div className="space-y-6">
      {/* Executive Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-emerald-600/20">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              Portfolio Financial & Budget Intelligence
            </h1>
            <p className="text-xs text-slate-400">
              Executive cost rollups, variance telemetry & enterprise multi-tier budget health
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <NavLink
            to="/ppm/financials/budget"
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-2"
          >
            <Calculator className="w-4 h-4 text-emerald-400" />
            Budget Allocator
          </NavLink>
          <NavLink
            to="/ppm/financials/expenses"
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all"
          >
            <Receipt className="w-4 h-4" />
            Expense Claims
          </NavLink>
          <button
            onClick={() => refresh()}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition-colors"
            title="Refresh Financials"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 className="w-7 h-7 animate-spin text-indigo-500" />
          <p className="text-xs">Aggregating portfolio financial microservice rollups...</p>
        </div>
      ) : (
        <>
          {/* Executive KPI Summary Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold">Total Portfolio Budget</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-white">
                {formatCurrency(portfolioTotals.totalAllocatedBudget)}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Allocated across {portfolioTotals.totalProjects} active projects
              </div>
            </div>

            <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold">Total Actual Spend</span>
                <TrendingUp className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-bold text-white">
                {formatCurrency(portfolioTotals.totalActualCost)}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                <span>Consumed:</span>
                <span className="font-mono text-slate-400">{portfolioTotals.overallUtilizationPercent}%</span>
              </div>
            </div>

            <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold">Net Portfolio Variance</span>
                {portfolioTotals.totalVariance < 0 ? (
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                )}
              </div>
              <div
                className={`text-2xl font-bold ${
                  portfolioTotals.totalVariance < 0 ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {formatCurrency(portfolioTotals.totalVariance)}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {portfolioTotals.overBudgetCount > 0 ? (
                  <span className="text-rose-400">{portfolioTotals.overBudgetCount} projects over budget</span>
                ) : (
                  <span className="text-emerald-400">All projects within allocation limits</span>
                )}
              </div>
            </div>

            <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold">Avg Portfolio Margin</span>
                <PieChart className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-emerald-400">
                {portfolioTotals.averageProfitMargin}%
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Net project delivery margin</div>
            </div>
          </div>

          {/* Visual Analytics & Breakdown Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cost Distribution Chart Card */}
            <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-indigo-400" />
                  Cost Distribution Matrix
                </h3>
                <span className="text-[10px] font-mono text-slate-500 uppercase">Actuals</span>
              </div>

              {/* Segmented Progress Bar */}
              <div className="space-y-2">
                <div className="w-full h-3.5 bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
                  <div
                    style={{ width: `${laborShare}%` }}
                    className="bg-emerald-500 h-full transition-all"
                    title={`Labor: ${laborShare}%`}
                  />
                  <div
                    style={{ width: `${opexShare}%` }}
                    className="bg-indigo-500 h-full transition-all"
                    title={`OpEx: ${opexShare}%`}
                  />
                  <div
                    style={{ width: `${capexShare}%` }}
                    className="bg-blue-500 h-full transition-all"
                    title={`CapEx: ${capexShare}%`}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Labor ({laborShare}%)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" /> OpEx ({opexShare}%)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500" /> CapEx ({capexShare}%)
                  </span>
                </div>
              </div>

              {/* Numerical Breakdown Rows */}
              <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Total Labor Incurred:</span>
                  <span className="text-xs font-bold text-white font-mono">
                    {formatCurrency(totalLabor)}
                  </span>
                </div>
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Total OpEx (SaaS/Travel):</span>
                  <span className="text-xs font-bold text-white font-mono">
                    {formatCurrency(totalOpex)}
                  </span>
                </div>
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Total CapEx (Hardware/Infra):</span>
                  <span className="text-xs font-bold text-white font-mono">
                    {formatCurrency(totalCapex)}
                  </span>
                </div>
              </div>
            </div>

            {/* Project Financial Breakdown Table */}
            <div className="lg:col-span-2 bg-slate-900/80 rounded-2xl border border-slate-800 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <FolderKanban className="w-4 h-4 text-emerald-400" />
                    Project Financial League Table
                  </h3>
                  <p className="text-xs text-slate-400">
                    Real-time budget utilization & variance across all cost centers
                  </p>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  {projectSummaries.length} Projects Tracked
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-semibold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Project Title</th>
                      <th className="px-4 py-3">Budget Cap</th>
                      <th className="px-4 py-3">Actual Cost</th>
                      <th className="px-4 py-3">Utilization</th>
                      <th className="px-4 py-3">Variance</th>
                      <th className="px-4 py-3 text-right">Margin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {projectSummaries.map((p) => {
                      const isOver = p.healthStatus === 'over_budget';
                      const isNear = p.healthStatus === 'near_budget';

                      return (
                        <tr key={p.projectId} className="hover:bg-slate-800/40 transition-colors">
                          <td className="px-4 py-3.5 font-semibold text-white">
                            <div className="flex items-center gap-2">
                              <span>{p.projectTitle}</span>
                              {isOver && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                  Over
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 font-mono text-slate-300">
                            {formatCurrency(p.totalAllocatedBudget, p.currency)}
                          </td>
                          <td className="px-4 py-3.5 font-mono font-semibold text-white">
                            {formatCurrency(p.totalActualCost, p.currency)}
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-slate-950 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    isOver
                                      ? 'bg-rose-500'
                                      : isNear
                                      ? 'bg-amber-500'
                                      : 'bg-emerald-500'
                                  }`}
                                  style={{ width: `${Math.min(100, p.utilizationPercent)}%` }}
                                />
                              </div>
                              <span
                                className={`text-[11px] font-mono font-semibold ${
                                  isOver
                                    ? 'text-rose-400'
                                    : isNear
                                    ? 'text-amber-400'
                                    : 'text-emerald-400'
                                }`}
                              >
                                {p.utilizationPercent}%
                              </span>
                            </div>
                          </td>
                          <td
                            className={`px-4 py-3.5 font-mono font-semibold ${
                              p.totalVariance < 0 ? 'text-rose-400' : 'text-emerald-400'
                            }`}
                          >
                            {formatCurrency(p.totalVariance, p.currency)}
                          </td>
                          <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-400">
                            {p.profitMarginPercent}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
