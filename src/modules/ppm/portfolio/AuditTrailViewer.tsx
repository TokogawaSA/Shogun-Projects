import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  ChevronRight, 
  ChevronDown, 
  Layers, 
  RefreshCw, 
  Loader2,
  ShieldCheck,
  Database
} from 'lucide-react';
import { usePortfolioEngine } from '../hooks/usePortfolioEngine';

export const AuditTrailViewer: React.FC = () => {
  const { auditLogs, loading, refresh } = usePortfolioEngine();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('all');
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const entityTypes = ['project', 'portfolio', 'budget', 'risk', 'resource'];

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.performedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entityId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entityType.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = entityTypeFilter === 'all' || log.entityType.toLowerCase() === entityTypeFilter.toLowerCase();
    return matchesSearch && matchesType;
  });

  const toggleRowExpand = (id: string) => {
    setExpandedRowId(expandedRowId === id ? null : id);
  };

  const getEntityBadgeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'portfolio':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
      case 'project':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'budget':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'risk':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'resource':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-600/20">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              Enterprise Governance & Audit Trail Engine
            </h1>
            <p className="text-xs text-slate-400">
              Immutable state mutations, field-level JSON state diffs & SOC 2 compliance verification
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refresh()}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition-colors"
            title="Refresh Audit Logs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Audit Stats Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Total Audit Events</span>
            <Database className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white">{auditLogs.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Append-only compliance log store</div>
        </div>

        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Monitored Entity Types</span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-indigo-400">{entityTypes.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Portfolios, Budgets, Risks & Resources</div>
        </div>

        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Compliance Gate Status</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">Verified Active</div>
          <div className="text-[11px] text-slate-500 mt-1">Multi-tenant isolation verified</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search action, user, or entity ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <select
              value={entityTypeFilter}
              onChange={(e) => setEntityTypeFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Entity Domains</option>
              {entityTypes.map((t) => (
                <option key={t} value={t}>
                  {t.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end text-xs text-slate-400 font-mono">
            Showing {filteredLogs.length} matching events
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-indigo-500" />
            <p className="text-xs">Loading immutable compliance audit log records...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <FileText className="w-8 h-8 mx-auto text-slate-600 mb-1" />
            <p className="text-sm font-semibold text-slate-300">No audit records found</p>
            <p className="text-xs">All changes made across PPM modules are recorded here in real time.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Timestamp</th>
                  <th className="px-6 py-3.5">Entity Type</th>
                  <th className="px-6 py-3.5">Action Executed</th>
                  <th className="px-6 py-3.5">Target Entity ID</th>
                  <th className="px-6 py-3.5">Performed By</th>
                  <th className="px-6 py-3.5 text-right">State Diff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredLogs.map((log) => {
                  const isExpanded = expandedRowId === log.id;
                  const hasStateDiff = Boolean(log.previousState || log.newState);

                  return (
                    <React.Fragment key={log.id}>
                      <tr
                        onClick={() => hasStateDiff && toggleRowExpand(log.id)}
                        className={`hover:bg-slate-800/40 transition-colors ${
                          hasStateDiff ? 'cursor-pointer' : ''
                        }`}
                      >
                        <td className="px-6 py-4 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                          {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Just now'}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`text-[10px] font-mono uppercase px-2.5 py-0.5 rounded border font-semibold ${getEntityBadgeColor(
                              log.entityType
                            )}`}
                          >
                            {log.entityType}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-white font-mono text-xs">
                          {log.action}
                        </td>
                        <td className="px-6 py-4 font-mono text-slate-400 text-[11px]">
                          {log.entityId}
                        </td>
                        <td className="px-6 py-4 text-slate-300">
                          {log.performedBy || 'System Sentinel'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {hasStateDiff ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleRowExpand(log.id);
                              }}
                              className="text-indigo-400 hover:text-indigo-300 text-xs font-mono inline-flex items-center gap-1"
                            >
                              {isExpanded ? (
                                <>
                                  Hide Diff <ChevronDown className="w-3.5 h-3.5" />
                                </>
                              ) : (
                                <>
                                  Inspect Diff <ChevronRight className="w-3.5 h-3.5" />
                                </>
                              )}
                            </button>
                          ) : (
                            <span className="text-slate-600 text-[11px]">No Diff</span>
                          )}
                        </td>
                      </tr>

                      {/* Expandable JSON State Diff Panel */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={6} className="p-0 bg-slate-950/80 border-y border-slate-800">
                            <div className="p-6 space-y-4 animate-fadeIn">
                              <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                                <span>Field-Level JSON Mutation Diff</span>
                                <span className="font-mono text-[10px] text-slate-500">
                                  Audit ID: {log.id}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                                {/* Previous State */}
                                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                                  <div className="flex items-center justify-between text-[11px] text-rose-400 font-bold border-b border-slate-800 pb-1.5">
                                    <span>[-] Previous State Snapshot</span>
                                  </div>
                                  <pre className="text-[11px] text-slate-300 overflow-x-auto max-h-56 p-1">
                                    {log.previousState
                                      ? JSON.stringify(log.previousState, null, 2)
                                      : '// Initial Creation (No Prior State)'}
                                  </pre>
                                </div>

                                {/* New State */}
                                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                                  <div className="flex items-center justify-between text-[11px] text-emerald-400 font-bold border-b border-slate-800 pb-1.5">
                                    <span>[+] New State Mutation</span>
                                  </div>
                                  <pre className="text-[11px] text-slate-300 overflow-x-auto max-h-56 p-1">
                                    {log.newState
                                      ? JSON.stringify(log.newState, null, 2)
                                      : '// Deletion (Record Removed)'}
                                  </pre>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
