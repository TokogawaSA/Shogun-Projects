import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  GitBranch,
  Workflow,
  ExternalLink,
  Edit3,
  Trash2,
  FileSpreadsheet,
  Target,
  FolderKanban,
  DollarSign,
  CheckSquare,
  Search,
  Loader2,
} from 'lucide-react';
import { WebForm, TargetModuleType, FormRoutingRule } from '../../../types/form';
import { formService } from '../../../services/formService';
import { WebFormBuilderModal } from './WebFormBuilderModal';
import { FormSubmissionsModal } from './FormSubmissionsModal';

export const WebFormsManagementView: React.FC = () => {
  const [forms, setForms] = useState<WebForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState<string>('all');

  // Modals state
  const [builderForm, setBuilderForm] = useState<WebForm | null | 'new'>(null);
  const [submissionsForm, setSubmissionsForm] = useState<WebForm | null>(null);

  useEffect(() => {
    loadForms();
  }, []);

  const loadForms = async () => {
    setLoading(true);
    try {
      const data = await formService.getForms();
      setForms(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this web form?')) return;
    await formService.deleteForm(id);
    setForms((prev) => prev.filter((f) => f.id !== id));
  };

  const filteredForms = forms.filter((f) => {
    const matchesSearch =
      f.title.toLowerCase().includes(search.toLowerCase()) ||
      f.description.toLowerCase().includes(search.toLowerCase()) ||
      f.slug.toLowerCase().includes(search.toLowerCase());

    if (moduleFilter === 'all') return matchesSearch;
    const hasModule =
      f.routing.defaultRoute.targetModule === moduleFilter ||
      f.routing.conditionalRoutes.some((r: FormRoutingRule) => r.action.targetModule === moduleFilter);
    return matchesSearch && hasModule;
  });

  const totalSubmissions = forms.reduce((acc, f) => acc + (f.submissionsCount || 0), 0);
  const totalRules = forms.reduce((acc, f) => acc + (f.conditionalRules?.length || 0), 0);

  const getModuleIcon = (module: TargetModuleType) => {
    switch (module) {
      case 'projects':
        return <FolderKanban className="w-3.5 h-3.5 text-indigo-400" />;
      case 'deals':
        return <DollarSign className="w-3.5 h-3.5 text-emerald-400" />;
      case 'tasks':
        return <CheckSquare className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <Target className="w-3.5 h-3.5 text-sky-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            Web Forms & Conditional Module Routing
          </h2>
          <p className="text-xs text-slate-400">
            Design dynamic web forms with full conditional logic, cascading rules, and automated workflow routing to CRM and Projects.
          </p>
        </div>

        <button
          onClick={() => setBuilderForm('new')}
          className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30 flex items-center gap-2 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create Web Form</span>
        </button>
      </div>

      {/* KPI Overview Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">
            Published Web Forms
          </span>
          <div className="text-2xl font-bold text-slate-100 mt-1">{forms.length}</div>
          <span className="text-[11px] text-emerald-400 font-medium">100% Active Ingestion</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">
            Submissions Ingested
          </span>
          <div className="text-2xl font-bold text-slate-100 mt-1">{totalSubmissions}</div>
          <span className="text-[11px] text-indigo-400 font-medium">Audited & Routed</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">
            Conditional Rules Matrix
          </span>
          <div className="text-2xl font-bold text-slate-100 mt-1">{totalRules}</div>
          <span className="text-[11px] text-purple-400 font-medium">Real-Time Evaluation</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">
            Integrated Target Modules
          </span>
          <div className="text-2xl font-bold text-slate-100 mt-1">4 Modules</div>
          <span className="text-[11px] text-amber-400 font-medium">CRM + Projects + Tasks</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/40 border border-slate-800">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search forms, slugs, or scope..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-800/60 border border-slate-700/80 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Module Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
          {[
            { id: 'all', label: 'All Targets' },
            { id: 'leads', label: 'CRM Leads' },
            { id: 'projects', label: 'Projects' },
            { id: 'deals', label: 'CRM Deals' },
            { id: 'tasks', label: 'Tasks' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setModuleFilter(tab.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                moduleFilter === tab.id
                  ? 'bg-slate-800 text-slate-100 border border-slate-700 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Forms List Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <p className="text-xs font-mono">Loading Web Forms & Routing Rules...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredForms.map((form) => {
            const publicUrl = `/forms/${form.slug || form.id}`;

            return (
              <div
                key={form.id}
                className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-100">{form.title}</h3>
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                          {form.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{form.description}</p>
                    </div>
                  </div>

                  {/* Routing & Conditional Logic Badges */}
                  <div className="flex items-center flex-wrap gap-2 pt-2 border-t border-slate-800/80">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/80 text-[11px] text-slate-300 font-medium">
                      {getModuleIcon(form.routing.defaultRoute.targetModule)}
                      <span className="capitalize">
                        Routes to: {form.routing.defaultRoute.targetModule}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-[11px] text-purple-300 font-medium">
                      <GitBranch className="w-3 h-3 text-purple-400" />
                      <span>{form.conditionalRules?.length || 0} Dynamic Rules</span>
                    </div>

                    {form.routing.conditionalRoutes?.length > 0 && (
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-indigo-300 font-medium">
                        <Workflow className="w-3 h-3 text-indigo-400" />
                        <span>{form.routing.conditionalRoutes.length} Custom Branches</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
                  <button
                    onClick={() => setSubmissionsForm(form)}
                    className="text-slate-400 hover:text-slate-200 flex items-center gap-1.5 font-mono text-[11px]"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{form.submissionsCount || 0} Submissions</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <a
                      href={publicUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      title="Open Live Public Form"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    <button
                      onClick={() => setBuilderForm(form)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Studio</span>
                    </button>

                    <button
                      onClick={() => handleDelete(form.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                      title="Delete Form"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {builderForm && (
        <WebFormBuilderModal
          form={builderForm === 'new' ? null : builderForm}
          onClose={() => setBuilderForm(null)}
          onSave={(saved) => {
            setForms((prev) => {
              const idx = prev.findIndex((f) => f.id === saved.id);
              if (idx >= 0) {
                const next = [...prev];
                next[idx] = saved;
                return next;
              }
              return [saved, ...prev];
            });
          }}
        />
      )}

      {submissionsForm && (
        <FormSubmissionsModal
          form={submissionsForm}
          onClose={() => setSubmissionsForm(null)}
        />
      )}
    </div>
  );
};

export default WebFormsManagementView;
