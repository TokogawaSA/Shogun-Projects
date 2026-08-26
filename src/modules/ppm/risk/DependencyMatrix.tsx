import React, { useState } from 'react';
import { 
  Network, 
  Flame, 
  Search, 
  Building2, 
  ChevronRight, 
  RefreshCw, 
  Loader2
} from 'lucide-react';
import { useRiskManagement } from '../hooks/useRiskManagement';

export const DependencyMatrix: React.FC = () => {
  const { risks, projects, departmentStats, loading, refresh } = useRiskManagement();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string | null>(null);

  const projectMap = new Map<string, string>();
  projects.forEach((p) => projectMap.set(p.id, p.title));

  const standardDepartments = [
    'Engineering & Architecture',
    'Backend',
    'DevOps',
    'Data Architecture',
    'Security & QA',
    'Product Management',
    'Operations',
    'Finance',
    'Legal & Compliance',
  ];

  // Merge discovered department stats with standard departments
  const allDeptNames = Array.from(
    new Set([...standardDepartments, ...Object.keys(departmentStats)])
  );

  // Filter departments
  const filteredDepts = allDeptNames.filter((d) =>
    d.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate critical path bottleneck count
  const criticalRisks = risks.filter((r) => r.riskScore >= 15 && r.status !== 'closed');
  const totalBottlenecks = criticalRisks.length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-600 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-amber-600/20">
            <Network className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              Cross-Departmental Dependency Matrix
            </h1>
            <p className="text-xs text-slate-400">
              Track inter-team bottlenecks, milestone dependencies & critical-path risk propagation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refresh()}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition-colors"
            title="Refresh Dependencies"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Critical Bottleneck Alert Banner */}
      {totalBottlenecks > 0 && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-400 flex-shrink-0">
              <Flame className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-rose-300 flex items-center gap-2">
                {totalBottlenecks} Critical-Path Bottlenecks Detected
              </h3>
              <p className="text-xs text-rose-300/80">
                High-impact risks (score &ge; 15) are currently impacting cross-departmental delivery schedules.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono uppercase px-3 py-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold flex-shrink-0">
            Sentinel Alert Active
          </span>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search department or functional unit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div className="text-xs text-slate-400 font-mono">
          {allDeptNames.length} Functional Departments Mapped
        </div>
      </div>

      {/* Dependency Matrix Grid */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 className="w-7 h-7 animate-spin text-indigo-500" />
          <p className="text-xs">Mapping cross-departmental dependency matrices...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDepts.map((deptName) => {
            const stats = departmentStats[deptName];
            const deptRisks = stats?.risks || [];
            const hasCritical = (stats?.criticalRisks || 0) > 0;
            const isSelected = selectedDept === deptName;

            return (
              <div
                key={deptName}
                onClick={() => setSelectedDept(isSelected ? null : deptName)}
                className={`bg-slate-900/80 rounded-2xl border transition-all cursor-pointer p-5 flex flex-col justify-between ${
                  hasCritical
                    ? 'border-rose-500/40 bg-rose-950/10 hover:border-rose-500/60'
                    : deptRisks.length > 0
                    ? 'border-amber-500/30 hover:border-amber-500/50'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-4">
                  {/* Department Card Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                          hasCritical
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                        }`}
                      >
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">{deptName}</h3>
                        <p className="text-[11px] text-slate-400">
                          {deptRisks.length} Linked Risk Dependencies
                        </p>
                      </div>
                    </div>

                    {hasCritical ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold flex items-center gap-1">
                        <Flame className="w-3 h-3 text-rose-400" /> Critical
                      </span>
                    ) : deptRisks.length > 0 ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                        Stable
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                        Clear
                      </span>
                    )}
                  </div>

                  {/* Impacted Projects & Threats */}
                  <div className="space-y-2 pt-2 border-t border-slate-800/80">
                    <span className="text-[11px] text-slate-400 font-semibold block">
                      Active Dependency Load:
                    </span>

                    {deptRisks.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No cross-project risks blocking this unit.</p>
                    ) : (
                      <div className="space-y-2">
                        {deptRisks.slice(0, 3).map((r) => {
                          const pTitle = projectMap.get(r.projectId) || 'Project';
                          return (
                            <div
                              key={r.id}
                              className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1"
                            >
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-white truncate max-w-[180px]">
                                  {r.title}
                                </span>
                                <span
                                  className={`font-mono font-bold text-[11px] ${
                                    r.riskScore >= 15
                                      ? 'text-rose-400'
                                      : r.riskScore >= 10
                                      ? 'text-amber-400'
                                      : 'text-emerald-400'
                                  }`}
                                >
                                  Score: {r.riskScore}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-[10px] text-slate-400">
                                <span>{pTitle}</span>
                                <span className="uppercase font-mono">{r.status}</span>
                              </div>
                            </div>
                          );
                        })}

                        {deptRisks.length > 3 && (
                          <p className="text-[11px] text-indigo-400 font-mono text-center">
                            + {deptRisks.length - 3} more dependencies
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 mt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                  <span>Inspection Status</span>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
