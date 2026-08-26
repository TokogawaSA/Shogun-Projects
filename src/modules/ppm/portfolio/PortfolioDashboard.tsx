import React, { useState } from 'react';
import { 
  Briefcase, 
  Plus, 
  Search, 
  TrendingUp, 
  DollarSign, 
  CheckCircle2, 
  Flame, 
  RefreshCw, 
  FolderKanban, 
  Trash2, 
  X, 
  Loader2
} from 'lucide-react';
import { usePortfolioEngine } from '../hooks/usePortfolioEngine';

export const PortfolioDashboard: React.FC = () => {
  const { 
    portfolios, 
    projects, 
    analytics, 
    createPortfolio, 
    deletePortfolio, 
    triggerPortfolioSync, 
    loading, 
    refresh 
  } = usePortfolioEngine();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedGoalFilter, setSelectedGoalFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [syncingPortId, setSyncingPortId] = useState<string | null>(null);

  // Form states for New Portfolio
  const [newName, setNewName] = useState<string>('');
  const [newDesc, setNewDesc] = useState<string>('');
  const [newGoal, setNewGoal] = useState<string>('AI & Machine Learning Innovation');
  const [newBudget, setNewBudget] = useState<number>(250000);
  const [newROI, setNewROI] = useState<number>(35);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const projectMap = new Map<string, string>();
  projects.forEach((p) => projectMap.set(p.id, p.title));

  const strategicGoals = [
    'AI & Machine Learning Innovation',
    'Enterprise Security & Compliance',
    'Operational Scale & Infrastructure',
    'Global Revenue Expansion',
    'Product Experience & Client Retention',
  ];

  const filteredPortfolios = portfolios.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.strategicGoal.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesGoal = selectedGoalFilter === 'all' || p.strategicGoal === selectedGoalFilter;
    return matchesSearch && matchesGoal;
  });

  const handleOpenAddModal = () => {
    setNewName('');
    setNewDesc('');
    setNewGoal(strategicGoals[0]);
    setNewBudget(250000);
    setNewROI(35);
    setSelectedProjectIds(projects.slice(0, 2).map((p) => p.id));
    setIsModalOpen(true);
  };

  const toggleProjectSelection = (projId: string) => {
    setSelectedProjectIds((prev) =>
      prev.includes(projId) ? prev.filter((id) => id !== projId) : [...prev, projId]
    );
  };

  const handleCreatePortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setIsSubmitting(true);
    try {
      await createPortfolio({
        name: newName.trim(),
        description: newDesc.trim(),
        strategicGoal: newGoal,
        projectIds: selectedProjectIds,
        budgetAllocated: Number(newBudget),
        targetROI: Number(newROI),
        ownerId: 'usr-executive-1',
      });
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSyncPortfolio = async (portfolioId: string) => {
    setSyncingPortId(portfolioId);
    try {
      await triggerPortfolioSync(portfolioId);
    } finally {
      setSyncingPortId(null);
    }
  };

  const handleDelete = async (portfolioId: string) => {
    if (window.confirm('Are you sure you want to delete this strategic portfolio?')) {
      try {
        await deletePortfolio(portfolioId);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  // High level aggregated portfolio metrics
  const totalAllocated = portfolios.reduce((a, p) => a + Number(p.budgetAllocated || 0), 0);
  const totalSpend = Object.values(analytics).reduce((a, s) => a + Number(s.totalActualExpenses || 0), 0);
  const avgCompletion =
    Object.values(analytics).length > 0
      ? Math.round(
          Object.values(analytics).reduce((a, s) => a + Number(s.overallCompletionPercent || 0), 0) /
            Object.values(analytics).length
        )
      : 0;
  const criticalThreats = Object.values(analytics).reduce((a, s) => a + Number(s.criticalRisksCount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              Executive Portfolio Aggregator & Command Center
            </h1>
            <p className="text-xs text-slate-400">
              High-level strategic portfolio umbrellas, cross-project budget rollups & ROI governance
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            Create Portfolio
          </button>
          <button
            onClick={() => refresh()}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition-colors"
            title="Refresh Portfolios"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Allocated Portfolio Capital</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">{formatCurrency(totalAllocated)}</div>
          <div className="text-[11px] text-slate-500 mt-1">Across {portfolios.length} strategic portfolios</div>
        </div>

        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Aggregated Spend</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white">{formatCurrency(totalSpend)}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            {totalAllocated > 0 ? Math.round((totalSpend / totalAllocated) * 100) : 0}% capital utilized
          </div>
        </div>

        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Avg Milestone Progress</span>
            <CheckCircle2 className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-indigo-400">{avgCompletion}%</div>
          <div className="text-[11px] text-slate-500 mt-1">Portfolio-wide delivery velocity</div>
        </div>

        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Critical Sentinel Alerts</span>
            <Flame className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400">{criticalThreats}</div>
          <div className="text-[11px] text-slate-500 mt-1">High-severity blockers identified</div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search strategic portfolio or goal..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedGoalFilter}
            onChange={(e) => setSelectedGoalFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Strategic Goals</option>
            {strategicGoals.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Portfolio Health Cards Grid */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 className="w-7 h-7 animate-spin text-indigo-500" />
          <p className="text-xs">Aggregating executive portfolio telemetry...</p>
        </div>
      ) : filteredPortfolios.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800 space-y-2">
          <Briefcase className="w-8 h-8 mx-auto text-slate-600 mb-1" />
          <p className="text-sm font-semibold text-slate-300">No portfolios found</p>
          <p className="text-xs">Create a new strategic portfolio to group active projects.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {filteredPortfolios.map((portfolio) => {
            const summary = analytics[portfolio.id];
            const isSyncing = syncingPortId === portfolio.id;
            const health = summary?.healthStatus || 'on_track';
            const allocated = portfolio.budgetAllocated || summary?.totalAllocatedBudget || 0;
            const spent = summary?.totalActualExpenses || 0;
            const utilization = allocated > 0 ? Math.round((spent / allocated) * 100) : 0;
            const completion = summary?.overallCompletionPercent || 0;
            const roi = portfolio.targetROI || summary?.portfolioROI || 0;

            return (
              <div
                key={portfolio.id}
                className={`bg-slate-900/80 rounded-2xl border p-6 flex flex-col justify-between space-y-5 transition-all ${
                  health === 'critical'
                    ? 'border-rose-500/40 bg-rose-950/10'
                    : health === 'at_risk'
                    ? 'border-amber-500/30'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-4">
                  {/* Top Bar: Title & Health Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-2 inline-block">
                        {portfolio.strategicGoal}
                      </span>
                      <h3 className="text-base font-bold text-white">{portfolio.name}</h3>
                    </div>

                    {health === 'critical' && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold flex items-center gap-1">
                        <Flame className="w-3 h-3 text-rose-400" /> Critical
                      </span>
                    )}
                    {health === 'at_risk' && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                        At Risk
                      </span>
                    )}
                    {health === 'on_track' && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                        On Track
                      </span>
                    )}
                  </div>

                  {portfolio.description && (
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {portfolio.description}
                    </p>
                  )}

                  {/* Financial & Delivery Metrics */}
                  <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Budget Allocated:</span>
                      <span className="font-bold text-white font-mono">{formatCurrency(allocated)}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Actual Spend:</span>
                      <span className="font-bold text-white font-mono">
                        {formatCurrency(spent)}{' '}
                        <span className="text-slate-500 font-normal">({utilization}%)</span>
                      </span>
                    </div>

                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className={`h-full rounded-full transition-all ${
                          utilization > 100
                            ? 'bg-rose-500'
                            : utilization >= 80
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, utilization)}%` }}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 text-xs border-t border-slate-800/60">
                      <div>
                        <span className="text-slate-500 text-[10px] block">Overall Completion:</span>
                        <span className="font-bold text-indigo-300 font-mono">{completion}%</span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-500 text-[10px] block">Target ROI:</span>
                        <span className="font-bold text-emerald-400 font-mono">+{roi}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Linked Projects Subcollection */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                      <span>Linked Projects ({portfolio.projectIds?.length || 0})</span>
                      <span className="text-[10px] text-slate-500">
                        {summary?.activeRisksCount || 0} active risks
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                      {portfolio.projectIds?.map((pId) => (
                        <span
                          key={pId}
                          className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800 flex items-center gap-1"
                        >
                          <FolderKanban className="w-2.5 h-2.5 text-indigo-400" />
                          {projectMap.get(pId) || pId}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                  <button
                    onClick={() => handleSyncPortfolio(portfolio.id)}
                    disabled={isSyncing}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 transition-all flex items-center gap-1.5"
                    title="Calculate Cloud Functions Gen 2 Aggregation Snapshot"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-indigo-400' : ''}`} />
                    {isSyncing ? 'Aggregating...' : 'Microservice Sync'}
                  </button>

                  <button
                    onClick={() => handleDelete(portfolio.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                    title="Delete Portfolio"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Strategic Portfolio Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
            <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Create Strategic Portfolio</h2>
                  <p className="text-xs text-slate-400">Group projects under a corporate investment program</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePortfolio} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Portfolio Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Next-Gen Autonomous AI Platform"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Strategic Corporate Goal
                </label>
                <select
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                >
                  {strategicGoals.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Allocated Budget Cap ($)
                  </label>
                  <input
                    type="number"
                    min={1000}
                    value={newBudget}
                    onChange={(e) => setNewBudget(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Target ROI (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={200}
                    value={newROI}
                    onChange={(e) => setNewROI(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Portfolio Scope & Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Define the strategic charter, scope boundaries, and executive sponsor targets..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Linked Projects Multi-Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Assign Projects to Portfolio ({selectedProjectIds.length} selected)</span>
                </label>
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 max-h-36 overflow-y-auto space-y-1.5">
                  {projects.map((p) => {
                    const isSelected = selectedProjectIds.includes(p.id);
                    return (
                      <div
                        key={p.id}
                        onClick={() => toggleProjectSelection(p.id)}
                        className={`p-2 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-indigo-600/20 text-white border border-indigo-500/40'
                            : 'bg-slate-900/60 text-slate-400 border border-slate-800/80 hover:bg-slate-800/40'
                        }`}
                      >
                        <span className="font-semibold">{p.title}</span>
                        <span className="text-[10px] font-mono">{p.id}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newName.trim() || isSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Provisioning...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" /> Provision Portfolio
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
