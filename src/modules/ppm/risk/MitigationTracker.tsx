import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Search, 
  CheckCircle2, 
  Clock, 
  Sliders, 
  Save, 
  Edit3, 
  Flame, 
  RefreshCw, 
  Loader2
} from 'lucide-react';
import { useRiskManagement } from '../hooks/useRiskManagement';
import { RiskStatus, RiskItem } from '../../../types';

export const MitigationTracker: React.FC = () => {
  const { 
    risks, 
    projects, 
    totals, 
    updateRiskStatus, 
    updateMitigationPlan, 
    loading, 
    refresh 
  } = useRiskManagement();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');

  // Inline editing state
  const [editingRiskId, setEditingRiskId] = useState<string | null>(null);
  const [editPlanText, setEditPlanText] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const projectMap = new Map<string, string>();
  projects.forEach((p) => projectMap.set(p.id, p.title));

  const filteredRisks = risks.filter((r) => {
    const pTitle = projectMap.get(r.projectId) || '';
    const matchesSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.mitigationPlan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pTitle.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchesProject = projectFilter === 'all' || r.projectId === projectFilter;

    return matchesSearch && matchesStatus && matchesProject;
  });

  const handleStartEdit = (risk: RiskItem) => {
    setEditingRiskId(risk.id);
    setEditPlanText(risk.mitigationPlan);
  };

  const handleSavePlan = async (riskId: string) => {
    setIsSaving(true);
    try {
      await updateMitigationPlan(riskId, editPlanText);
      setEditingRiskId(null);
      setSuccessToast('Mitigation plan updated successfully.');
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusTransition = async (riskId: string, status: RiskStatus) => {
    try {
      await updateRiskStatus(riskId, status);
      setSuccessToast(`Risk status transitioned to "${status}".`);
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-emerald-600/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              Risk Mitigation & Action Plan Tracker
            </h1>
            <p className="text-xs text-slate-400">
              Manage active remediation workflows, assign mitigation owners & track closure gates
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refresh()}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition-colors"
            title="Refresh Mitigation Plans"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>

      {successToast && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* KPI Counters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Total Mitigation Plans</span>
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white">{totals.totalRisks}</div>
          <div className="text-[11px] text-slate-500 mt-1">Across all enterprise projects</div>
        </div>

        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Open Actions Pending</span>
            <Clock className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400">{totals.openCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Requires active intervention</div>
        </div>

        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">In Mitigation</span>
            <Sliders className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400">{totals.mitigatedCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Contingency protocol executing</div>
        </div>

        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Resolved & Closed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">{totals.closedCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Successfully decommissioned</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search mitigation strategy or risk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Mitigation Statuses</option>
              <option value="open">Open Threat</option>
              <option value="mitigated">In Mitigation</option>
              <option value="closed">Closed / Resolved</option>
            </select>
          </div>

          <div>
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Target Projects ({projects.length})</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Mitigation Action Plans List */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 className="w-7 h-7 animate-spin text-indigo-500" />
          <p className="text-xs">Loading mitigation action plans...</p>
        </div>
      ) : filteredRisks.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800 space-y-2">
          <ShieldCheck className="w-8 h-8 mx-auto text-slate-600 mb-1" />
          <p className="text-sm font-semibold text-slate-300">No mitigation plans match your filters</p>
          <p className="text-xs">Select a different filter or register a new risk.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRisks.map((risk) => {
            const isEditing = editingRiskId === risk.id;
            const isCrit = risk.riskScore >= 15;
            const pTitle = projectMap.get(risk.projectId) || 'Project';

            return (
              <div
                key={risk.id}
                className={`bg-slate-900/80 rounded-2xl border p-6 space-y-4 transition-all ${
                  isCrit && risk.status === 'open'
                    ? 'border-rose-500/40 bg-rose-950/10'
                    : risk.status === 'mitigated'
                    ? 'border-amber-500/30'
                    : 'border-slate-800'
                }`}
              >
                {/* Top Row: Title, Severity, Project */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">{risk.title}</h3>
                      {isCrit && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold flex items-center gap-0.5">
                          <Flame className="w-2.5 h-2.5" /> CRITICAL (Score: {risk.riskScore})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="font-mono text-indigo-300">{pTitle}</span>
                      <span>&bull;</span>
                      <span className="capitalize">Category: {risk.category}</span>
                      <span>&bull;</span>
                      <span>Probability: {risk.probability}/5</span>
                      <span>&bull;</span>
                      <span>Impact: {risk.impact}/5</span>
                    </div>
                  </div>

                  {/* Status Badges & Quick Action Controls */}
                  <div className="flex items-center gap-2">
                    {risk.status === 'open' && (
                      <button
                        onClick={() => handleStatusTransition(risk.id, 'mitigated')}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-all flex items-center gap-1.5"
                      >
                        <Sliders className="w-3.5 h-3.5" /> Begin Mitigation
                      </button>
                    )}
                    {risk.status === 'mitigated' && (
                      <button
                        onClick={() => handleStatusTransition(risk.id, 'closed')}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-all flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Resolve & Close
                      </button>
                    )}
                    {risk.status === 'closed' && (
                      <button
                        onClick={() => handleStatusTransition(risk.id, 'open')}
                        className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      >
                        Re-open Threat
                      </button>
                    )}
                  </div>
                </div>

                {/* Mitigation Action Plan Body */}
                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      Mitigation Strategy & Execution Plan:
                    </span>
                    {!isEditing && (
                      <button
                        onClick={() => handleStartEdit(risk)}
                        className="text-indigo-400 hover:text-indigo-300 text-[11px] font-mono flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" /> Edit Strategy
                      </button>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="space-y-3 pt-1">
                      <textarea
                        rows={3}
                        value={editPlanText}
                        onChange={(e) => setEditPlanText(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingRiskId(null)}
                          className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSavePlan(risk.id)}
                          disabled={isSaving}
                          className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 disabled:opacity-50"
                        >
                          {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                          Save Strategy
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-200 leading-relaxed">{risk.mitigationPlan}</p>
                  )}
                </div>

                {/* Dependencies & Footer */}
                <div className="flex items-center justify-between text-xs text-slate-400 pt-1 flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-slate-500 font-semibold text-[11px]">Dependencies:</span>
                    {risk.departmentDependencies?.map((dep) => (
                      <span
                        key={dep}
                        className="text-[10px] font-medium px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                      >
                        {dep}
                      </span>
                    ))}
                  </div>

                  <span className="text-[11px] font-mono text-slate-500">
                    Status: <strong className="uppercase text-slate-300">{risk.status}</strong>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
