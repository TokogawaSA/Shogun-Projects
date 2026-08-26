import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Plus, 
  Search, 
  CheckCircle2, 
  Clock, 
  X, 
  Loader2, 
  RefreshCw, 
  Flame, 
  Sliders, 
  Trash2
} from 'lucide-react';
import { useRiskManagement } from '../hooks/useRiskManagement';
import { RiskCategory, RiskStatus } from '../../../types';

export const RiskRegister: React.FC = () => {
  const { 
    risks, 
    projects, 
    matrixGrid, 
    totals, 
    createRisk, 
    updateRiskStatus, 
    deleteRisk, 
    loading, 
    refresh 
  } = useRiskManagement();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCell, setSelectedCell] = useState<string | null>(null);

  // Log Risk Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('');
  const [newCategory, setNewCategory] = useState<RiskCategory>('technical');
  const [newProjectId, setNewProjectId] = useState<string>('');
  const [newProbability, setNewProbability] = useState<number>(3);
  const [newImpact, setNewImpact] = useState<number>(3);
  const [newMitigation, setNewMitigation] = useState<string>('');
  const [newDeps, setNewDeps] = useState<string>('Engineering & Architecture, Backend');

  const projectMap = new Map<string, string>();
  projects.forEach((p) => projectMap.set(p.id, p.title));

  const filteredRisks = risks.filter((r) => {
    const pTitle = projectMap.get(r.projectId) || '';
    const matchesSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.mitigationPlan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pTitle.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === 'all' || r.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchesCell = !selectedCell || `${r.probability}-${r.impact}` === selectedCell;

    return matchesSearch && matchesCategory && matchesStatus && matchesCell;
  });

  const handleOpenAddModal = () => {
    setNewTitle('');
    setNewDescription('');
    setNewCategory('technical');
    setNewProjectId(projects[0]?.id || '');
    setNewProbability(3);
    setNewImpact(3);
    setNewMitigation('');
    setNewDeps('Engineering & Architecture, Backend');
    setIsModalOpen(true);
  };

  const handleCreateRisk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newProjectId) return;

    setIsSubmitting(true);
    try {
      const depList = newDeps
        .split(',')
        .map((d) => d.trim())
        .filter(Boolean);

      await createRisk({
        projectId: newProjectId,
        title: newTitle.trim(),
        description: newDescription.trim(),
        category: newCategory,
        probability: Number(newProbability),
        impact: Number(newImpact),
        riskScore: Number(newProbability) * Number(newImpact),
        mitigationPlan: newMitigation.trim() || 'Mitigation strategy pending review.',
        departmentDependencies: depList.length > 0 ? depList : ['General Operations'],
        status: 'open',
        ownerId: 'usr-admin-master',
      });

      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (riskId: string, status: RiskStatus) => {
    try {
      await updateRiskStatus(riskId, status);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (riskId: string) => {
    if (window.confirm('Are you sure you want to remove this risk record?')) {
      try {
        await deleteRisk(riskId);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Helper for matrix cell color
  const getMatrixCellColor = (prob: number, imp: number, count: number, isSelected: boolean) => {
    const score = prob * imp;
    let baseBg = 'bg-slate-900/60 border-slate-800';
    let textColor = 'text-slate-400';

    if (score >= 15) {
      baseBg = count > 0 ? 'bg-rose-950/70 border-rose-500/50' : 'bg-rose-950/20 border-rose-900/40';
      textColor = 'text-rose-400';
    } else if (score >= 10) {
      baseBg = count > 0 ? 'bg-amber-950/60 border-amber-500/40' : 'bg-amber-950/20 border-amber-900/30';
      textColor = 'text-amber-400';
    } else if (score >= 5) {
      baseBg = count > 0 ? 'bg-yellow-950/40 border-yellow-500/30' : 'bg-yellow-950/10 border-yellow-900/20';
      textColor = 'text-yellow-400';
    } else {
      baseBg = count > 0 ? 'bg-emerald-950/40 border-emerald-500/30' : 'bg-emerald-950/10 border-emerald-900/20';
      textColor = 'text-emerald-400';
    }

    const ring = isSelected ? 'ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-950 scale-105' : '';

    return `${baseBg} ${textColor} ${ring}`;
  };

  const calculatedModalScore = newProbability * newImpact;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-rose-600/20">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              Enterprise Risk Register & Heatmap Matrix
            </h1>
            <p className="text-xs text-slate-400">
              5x5 Probability-Impact scoring, critical escalation gates & mitigation controls
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            Log New Risk
          </button>
          <button
            onClick={() => refresh()}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition-colors"
            title="Refresh Risks"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Critical Risks (Score ≥ 15)</span>
            <Flame className="w-4 h-4 text-rose-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold ${totals.criticalCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {totals.criticalCount}
            </span>
            <span className="text-xs text-slate-500 font-mono">active threats</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Triggers automated sentinel escalation</div>
        </div>

        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">High & Medium Risks</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400">
            {totals.highCount + totals.mediumCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {totals.highCount} high, {totals.mediumCount} medium priority
          </div>
        </div>

        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Mitigation Progress</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-400">{totals.mitigatedCount + totals.closedCount}</span>
            <span className="text-xs text-slate-400 font-mono">/ {totals.totalRisks}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {totals.openCount} remaining open actions
          </div>
        </div>

        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Average Risk Score</span>
            <Sliders className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {totals.averageRiskScore} <span className="text-xs text-slate-500 font-normal">/ 25</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Portfolio vulnerability benchmark</div>
        </div>
      </div>

      {/* 5x5 Matrix & Filter Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 5x5 Interactive Risk Heatmap */}
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">5x5 Risk Severity Heatmap</h3>
              <p className="text-xs text-slate-400">Click a cell to filter matching risks</p>
            </div>
            {selectedCell && (
              <button
                onClick={() => setSelectedCell(null)}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 font-mono underline"
              >
                Clear Cell Filter
              </button>
            )}
          </div>

          {/* Matrix Grid Container */}
          <div className="relative pt-4 pb-2">
            <div className="flex items-center gap-2">
              {/* Y-Axis Label */}
              <div className="w-8 text-[10px] uppercase font-mono text-slate-500 -rotate-90 tracking-widest text-center">
                Probability
              </div>

              {/* 5 Rows for Probability 5 down to 1 */}
              <div className="flex-1 space-y-1.5">
                {[5, 4, 3, 2, 1].map((prob) => (
                  <div key={prob} className="flex items-center gap-1.5">
                    <span className="w-4 text-[11px] font-mono text-slate-500 text-right">
                      {prob}
                    </span>
                    {[1, 2, 3, 4, 5].map((imp) => {
                      const cellKey = `${prob}-${imp}`;
                      const cellRisks = matrixGrid[cellKey] || [];
                      const count = cellRisks.length;
                      const isSelected = selectedCell === cellKey;

                      return (
                        <div
                          key={imp}
                          onClick={() => setSelectedCell(isSelected ? null : cellKey)}
                          className={`flex-1 h-11 rounded-xl border flex flex-col items-center justify-center cursor-pointer transition-all ${getMatrixCellColor(
                            prob,
                            imp,
                            count,
                            isSelected
                          )}`}
                          title={`Probability ${prob}, Impact ${imp} (Score: ${prob * imp}) - ${count} Risks`}
                        >
                          <span className="text-xs font-bold font-mono">{count > 0 ? count : '·'}</span>
                          <span className="text-[9px] opacity-70 font-mono">{prob * imp}</span>
                        </div>
                      );
                    })}
                  </div>
                ))}

                {/* X-Axis Numbers & Label */}
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="w-4" />
                  {[1, 2, 3, 4, 5].map((imp) => (
                    <div key={imp} className="flex-1 text-center text-[11px] font-mono text-slate-500">
                      {imp}
                    </div>
                  ))}
                </div>
                <div className="text-center text-[10px] uppercase font-mono text-slate-500 tracking-widest pt-1">
                  Impact Severity →
                </div>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-[10px] font-mono text-center">
            <div className="p-1.5 rounded bg-emerald-950/40 border border-emerald-500/30 text-emerald-300">
              Low (1-4)
            </div>
            <div className="p-1.5 rounded bg-yellow-950/40 border border-yellow-500/30 text-yellow-300">
              Med (5-9)
            </div>
            <div className="p-1.5 rounded bg-amber-950/60 border border-amber-500/40 text-amber-300">
              High (10-14)
            </div>
            <div className="p-1.5 rounded bg-rose-950/70 border border-rose-500/50 text-rose-300">
              Crit (15-25)
            </div>
          </div>
        </div>

        {/* Filter Controls & Category Breakdown */}
        <div className="lg:col-span-2 bg-slate-900/80 rounded-2xl border border-slate-800 p-6 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white mb-1">Filter & Slice Risk Register</h3>
            <p className="text-xs text-slate-400">
              Query specific risk domains, lifecycle statuses & multi-tenant projects
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search risk, title, plan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Risk Categories</option>
                <option value="technical">Technical Architecture</option>
                <option value="operational">Operational & Staffing</option>
                <option value="financial">Financial & Currency</option>
                <option value="schedule">Schedule & Logistics</option>
                <option value="compliance">Security & Compliance</option>
              </select>
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Risk Statuses</option>
                <option value="open">Open Threat</option>
                <option value="mitigated">Mitigation In-Progress</option>
                <option value="closed">Closed / Resolved</option>
              </select>
            </div>
          </div>

          {/* Quick Filter Badges */}
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center justify-between flex-wrap gap-2 text-xs">
            <span className="text-slate-400">Showing {filteredRisks.length} of {risks.length} recorded risks</span>
            {selectedCell && (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Filtered: P{selectedCell.split('-')[0]} × I{selectedCell.split('-')[1]}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Risk Table */}
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-indigo-500" />
            <p className="text-xs">Loading enterprise risk register...</p>
          </div>
        ) : filteredRisks.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <ShieldAlert className="w-8 h-8 mx-auto text-slate-600 mb-1" />
            <p className="text-sm font-semibold text-slate-300">No risks match the active criteria</p>
            <p className="text-xs">Log a new threat or reset your matrix filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Risk Item & Threat</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5">P × I Matrix</th>
                  <th className="px-6 py-3.5">Score</th>
                  <th className="px-6 py-3.5">Mitigation Plan & Dependencies</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredRisks.map((r) => {
                  const isCrit = r.riskScore >= 15;
                  const isHigh = r.riskScore >= 10 && r.riskScore < 15;
                  const pTitle = projectMap.get(r.projectId) || 'Project';

                  return (
                    <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4 max-w-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs block">{r.title}</span>
                          {isCrit && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-0.5">
                              <Flame className="w-2.5 h-2.5" /> CRITICAL
                            </span>
                          )}
                        </div>
                        {r.description && (
                          <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                            {r.description}
                          </p>
                        )}
                        <span className="text-[10px] font-mono text-slate-500 mt-1 block">
                          {pTitle}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {r.category}
                        </span>
                      </td>

                      <td className="px-6 py-4 font-mono text-xs">
                        <span className="text-slate-300">P:{r.probability}</span> &times;{' '}
                        <span className="text-slate-300">I:{r.impact}</span>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`font-bold font-mono text-sm ${
                            isCrit
                              ? 'text-rose-400'
                              : isHigh
                              ? 'text-amber-400'
                              : r.riskScore >= 5
                              ? 'text-yellow-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {r.riskScore}
                        </span>
                      </td>

                      <td className="px-6 py-4 max-w-sm">
                        <p className="text-xs text-slate-300 line-clamp-2">{r.mitigationPlan}</p>
                        <div className="flex items-center gap-1.5 flex-wrap mt-1">
                          {r.departmentDependencies?.map((d) => (
                            <span
                              key={d}
                              className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                            >
                              {d}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {r.status === 'open' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                            <Clock className="w-3.5 h-3.5" /> Open Threat
                          </span>
                        )}
                        {r.status === 'mitigated' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            <Sliders className="w-3.5 h-3.5" /> In Mitigation
                          </span>
                        )}
                        {r.status === 'closed' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Closed
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {r.status !== 'mitigated' && (
                            <button
                              onClick={() => handleStatusChange(r.id, 'mitigated')}
                              className="px-2 py-1 rounded-lg text-[10px] font-medium bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-colors"
                              title="Set Mitigating"
                            >
                              Mitigate
                            </button>
                          )}
                          {r.status !== 'closed' && (
                            <button
                              onClick={() => handleStatusChange(r.id, 'closed')}
                              className="px-2 py-1 rounded-lg text-[10px] font-medium bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-colors"
                              title="Resolve & Close"
                            >
                              Close
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(r.id)}
                            className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                            title="Delete Risk"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Log New Risk Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Log New Risk Item</h2>
                  <p className="text-xs text-slate-400">Record threat probability & impact matrix score</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRisk} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Risk Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cloud API rate limits during migration"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Target Project
                  </label>
                  <select
                    value={newProjectId}
                    onChange={(e) => setNewProjectId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Risk Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as RiskCategory)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="technical">Technical</option>
                    <option value="operational">Operational</option>
                    <option value="financial">Financial</option>
                    <option value="schedule">Schedule</option>
                    <option value="compliance">Compliance</option>
                  </select>
                </div>
              </div>

              {/* Dynamic P x I Scoring Controls */}
              <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">
                    Matrix Scoring (1 to 5)
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Computed Score:</span>
                    <span
                      className={`text-sm font-bold font-mono px-2 py-0.5 rounded ${
                        calculatedModalScore >= 15
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : calculatedModalScore >= 10
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {calculatedModalScore} / 25
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] text-slate-400 flex items-center justify-between mb-1">
                      <span>Probability:</span>
                      <strong className="text-white font-mono">{newProbability}</strong>
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={newProbability}
                      onChange={(e) => setNewProbability(Number(e.target.value))}
                      className="w-full accent-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 flex items-center justify-between mb-1">
                      <span>Impact:</span>
                      <strong className="text-white font-mono">{newImpact}</strong>
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={newImpact}
                      onChange={(e) => setNewImpact(Number(e.target.value))}
                      className="w-full accent-rose-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Mitigation Action Plan
                </label>
                <textarea
                  rows={2}
                  placeholder="Outline preventive measures or contingency protocols..."
                  value={newMitigation}
                  onChange={(e) => setNewMitigation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Department Dependencies (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. DevOps, Backend, Legal & Compliance"
                  value={newDeps}
                  onChange={(e) => setNewDeps(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newTitle.trim() || isSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Registering...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" /> Register Risk
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
