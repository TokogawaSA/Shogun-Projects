import React, { useState, useEffect } from 'react';
import {
  X,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Search,
  Workflow,
} from 'lucide-react';
import { WebForm, FormSubmissionRecord } from '../../../types/form';
import { formService } from '../../../services/formService';

interface FormSubmissionsModalProps {
  form: WebForm;
  onClose: () => void;
}

export const FormSubmissionsModal: React.FC<FormSubmissionsModalProps> = ({
  form,
  onClose,
}) => {
  const [submissions, setSubmissions] = useState<FormSubmissionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmissionRecord | null>(null);

  useEffect(() => {
    loadSubmissions();
  }, [form.id]);

  const loadSubmissions = async () => {
    setLoading(true);
    try {
      const data = await formService.getFormSubmissions(form.id);
      setSubmissions(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const filtered = submissions.filter((sub) => {
    if (!search) return true;
    const matchTerm = search.toLowerCase();
    const dataString = JSON.stringify(sub.data).toLowerCase();
    return (
      sub.id.toLowerCase().includes(matchTerm) ||
      sub.routedModule.toLowerCase().includes(matchTerm) ||
      dataString.includes(matchTerm)
    );
  });

  const getModuleBadgeColor = (module: string) => {
    switch (module) {
      case 'projects':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
      case 'deals':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'tasks':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      default:
        return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Submissions & Module Routing Log
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-normal">
                  {submissions.length} Total
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Audited inbound submissions for: <span className="text-indigo-400 font-medium">{form.title}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Actions Bar */}
        <div className="px-6 py-3 border-b border-slate-800 bg-slate-900/30 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by keyword, client email, or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-800/60 border border-slate-700/80 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="text-xs text-slate-400 font-mono">
            Form Route: <span className="text-slate-200 font-semibold">{form.routing.defaultRoute.targetModule.toUpperCase()}</span> (Default)
          </div>
        </div>

        {/* Content Body: Split View */}
        <div className="flex-1 min-h-0 flex overflow-hidden">
          {/* Submissions List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-4 space-y-2">
            {loading ? (
              <div className="py-12 text-center text-xs text-slate-500 font-mono">
                Loading submission records...
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500 font-mono">
                No submissions found matching criteria.
              </div>
            ) : (
              filtered.map((sub) => {
                const isSelected = selectedSubmission?.id === sub.id;
                return (
                  <div
                    key={sub.id}
                    onClick={() => setSelectedSubmission(sub)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600/10 border-indigo-500/50 shadow-sm'
                        : 'bg-slate-800/30 border-slate-800 hover:bg-slate-800/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-slate-400 font-semibold">
                          #{sub.id.substring(0, 12)}
                        </span>
                        <span
                          className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-full border font-bold ${getModuleBadgeColor(
                            sub.routedModule
                          )}`}
                        >
                          Routed: {sub.routedModule}
                        </span>
                        {sub.matchedRuleName && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30">
                            Rule: {sub.matchedRuleName}
                          </span>
                        )}
                        {sub.workflowExecuted && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1 font-mono">
                            <Workflow className="w-3 h-3" />
                            Workflow Triggered
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3" />
                        {new Date(sub.createdAt).toLocaleString()}
                      </span>
                    </div>

                    {/* Summary row */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500 text-[10px] block">Client / Contact:</span>
                        <span className="text-slate-200 font-medium truncate block">
                          {sub.data.client_name || sub.data.name || 'Anonymous'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">Email / Contact:</span>
                        <span className="text-slate-300 truncate block font-mono text-[11px]">
                          {sub.data.email || '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">Created Entities:</span>
                        <span className="text-emerald-400 font-medium truncate block">
                          {sub.createdEntityIds?.length || 1} Record(s) Generated
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Submission Details Drawer */}
          {selectedSubmission && (
            <div className="w-96 border-l border-slate-800 bg-slate-900/60 p-5 overflow-y-auto space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                  Submission Details
                </h3>
                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 font-bold">
                  <CheckCircle2 className="w-3 h-3" /> Processed
                </span>
              </div>

              {/* Routing Breakdown */}
              <div className="space-y-2">
                <label className="text-[11px] text-slate-400 font-semibold block">Destination Module</label>
                <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-100 uppercase">
                      {selectedSubmission.routedModule}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                      {selectedSubmission.matchedRuleId ? 'Conditional Rule' : 'Default Route'}
                    </span>
                  </div>
                  {selectedSubmission.matchedRuleName && (
                    <p className="text-[11px] text-purple-300 font-mono">
                      Matched: {selectedSubmission.matchedRuleName}
                    </p>
                  )}
                </div>
              </div>

              {/* Created Entities */}
              <div className="space-y-2">
                <label className="text-[11px] text-slate-400 font-semibold block">Generated Operations Records</label>
                <div className="space-y-1.5">
                  {(selectedSubmission.createdEntityIds || []).map((ent, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/60 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <span className="text-[10px] uppercase font-mono text-slate-400 block">
                          [{ent.module}]
                        </span>
                        <p className="text-xs font-semibold text-slate-200 truncate">{ent.title}</p>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                        Active
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Raw Payload Data */}
              <div className="space-y-2">
                <label className="text-[11px] text-slate-400 font-semibold block">Submitted Form Payload</label>
                <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 font-mono text-[11px] text-slate-300 max-h-56 overflow-y-auto space-y-1">
                  {Object.entries(selectedSubmission.data || {}).map(([key, val]) => (
                    <div key={key} className="flex flex-col border-b border-slate-900 pb-1">
                      <span className="text-indigo-400 text-[10px]">{key}:</span>
                      <span className="text-slate-300">{String(val)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
