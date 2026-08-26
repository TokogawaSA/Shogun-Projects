import React, { useState } from 'react';
import { 
  Target, 
  FolderKanban, 
  Briefcase, 
  RefreshCw, 
  Loader2
} from 'lucide-react';
import { usePortfolioEngine } from '../hooks/usePortfolioEngine';

export const StrategicAlignment: React.FC = () => {
  const { portfolios, projects, analytics, loading, refresh } = usePortfolioEngine();

  const [selectedGoal, setSelectedGoal] = useState<string>('all');

  const strategicGoals = [
    {
      id: 'AI & Machine Learning Innovation',
      title: 'AI & Machine Learning Innovation',
      description: 'Accelerate autonomous coding agents, Gemini multi-agent workflows, and MCP ecosystem integrations.',
      targetReturn: '45% ROI',
      priority: 'Tier 1 (High)',
      accentColor: 'indigo',
    },
    {
      id: 'Enterprise Security & Compliance',
      title: 'Enterprise Security & Compliance',
      description: 'SOC 2 verification, zero-trust tenant data isolation, and cryptographic nonce protection.',
      targetReturn: '28% ROI',
      priority: 'Tier 1 (High)',
      accentColor: 'rose',
    },
    {
      id: 'Operational Scale & Infrastructure',
      title: 'Operational Scale & Infrastructure',
      description: 'Multi-region serverless elasticity, BigQuery analytics pipelines, and automated CI/CD checkpoints.',
      targetReturn: '35% ROI',
      priority: 'Tier 2 (Medium)',
      accentColor: 'cyan',
    },
    {
      id: 'Global Revenue Expansion',
      title: 'Global Revenue Expansion',
      description: 'VTiger multi-tenant deal conversions, automated client onboarding, and CRM revenue pipelines.',
      targetReturn: '50% ROI',
      priority: 'Tier 1 (High)',
      accentColor: 'emerald',
    },
  ];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const projectMap = new Map<string, string>();
  projects.forEach((p) => projectMap.set(p.id, p.title));

  const totalCapitalAllocated = portfolios.reduce((a, p) => a + Number(p.budgetAllocated || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              Strategic Goal Alignment & ROI Mapping
            </h1>
            <p className="text-xs text-slate-400">
              Corporate pillar alignment, target ROI projections & milestone delivery tracking
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refresh()}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition-colors"
            title="Refresh Strategic Alignment"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 className="w-7 h-7 animate-spin text-indigo-500" />
          <p className="text-xs">Evaluating strategic alignment models and ROI trajectories...</p>
        </div>
      ) : (
        <>
          {/* Strategic Pillar Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {strategicGoals.map((goal) => {
              const matchedPortfolios = portfolios.filter(
                (p) => p.strategicGoal === goal.id || p.strategicGoal?.includes(goal.id.split(' ')[0])
              );
              const goalBudget = matchedPortfolios.reduce((a, p) => a + Number(p.budgetAllocated || 0), 0);
              const goalShare = totalCapitalAllocated > 0 ? Math.round((goalBudget / totalCapitalAllocated) * 100) : 0;

              return (
                <div
                  key={goal.id}
                  onClick={() => setSelectedGoal(selectedGoal === goal.id ? 'all' : goal.id)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                    selectedGoal === goal.id
                      ? 'bg-indigo-600/15 border-indigo-500 ring-2 ring-indigo-500/40 shadow-lg'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                        {goal.priority}
                      </span>
                      <span className="text-xs font-bold text-emerald-400 font-mono">
                        {goal.targetReturn}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white">{goal.title}</h3>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {goal.description}
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-800/80">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Capital Share:</span>
                      <span className="font-bold text-white font-mono">{formatCurrency(goalBudget)} ({goalShare}%)</span>
                    </div>
                    <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-500 h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, goalShare)}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {matchedPortfolios.length} active portfolios aligned
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Strategic Portfolio Alignment Deep-Dive */}
          <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-indigo-400" />
                  Portfolio Strategic Execution Pathways
                </h3>
                <p className="text-xs text-slate-400">
                  Detailed corporate alignment, milestone trajectory & ROI comparisons
                </p>
              </div>

              {selectedGoal !== 'all' && (
                <button
                  onClick={() => setSelectedGoal('all')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 underline font-mono"
                >
                  Show All Strategic Goals
                </button>
              )}
            </div>

            <div className="space-y-4">
              {portfolios
                .filter((p) => selectedGoal === 'all' || p.strategicGoal === selectedGoal || p.strategicGoal?.includes(selectedGoal.split(' ')[0]))
                .map((portfolio) => {
                  const summary = analytics[portfolio.id];
                  const completion = summary?.overallCompletionPercent || 60;
                  const targetROI = portfolio.targetROI || 30;
                  const projectedROI = summary?.portfolioROI || targetROI;

                  return (
                    <div
                      key={portfolio.id}
                      className="p-5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-4"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{portfolio.name}</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              {portfolio.strategicGoal}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400">{portfolio.description}</p>
                        </div>

                        <div className="flex items-center gap-6 text-right">
                          <div>
                            <span className="text-[10px] text-slate-500 block">Target ROI</span>
                            <span className="text-xs font-bold text-slate-300 font-mono">+{targetROI}%</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block">Projected Return</span>
                            <span className="text-sm font-bold text-emerald-400 font-mono">+{projectedROI}%</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block">Milestone Velocity</span>
                            <span className="text-sm font-bold text-indigo-300 font-mono">{completion}%</span>
                          </div>
                        </div>
                      </div>

                      {/* Milestone Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>Milestone Execution Progress</span>
                          <span className="font-mono text-slate-300">{completion}% Completed</span>
                        </div>
                        <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all"
                            style={{ width: `${completion}%` }}
                          />
                        </div>
                      </div>

                      {/* Associated Project Badges */}
                      <div className="flex items-center gap-2 flex-wrap pt-1 text-xs">
                        <span className="text-slate-500 text-[11px]">Executing Projects:</span>
                        {portfolio.projectIds?.map((pId) => (
                          <span
                            key={pId}
                            className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800 flex items-center gap-1"
                          >
                            <FolderKanban className="w-3 h-3 text-indigo-400" />
                            {projectMap.get(pId) || pId}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
