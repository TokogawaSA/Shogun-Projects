import React, { useState, useEffect } from 'react';
import {
  Layers,
  Save,
  CheckCircle2,
  ToggleLeft,
  ToggleRight,
  FolderKanban,
  Kanban,
  Building2,
  Users,
  DollarSign,
  Loader2,
} from 'lucide-react';
import { apiClient } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { ActiveModules, SupportedModule } from '../../../types/settings';

export const ModuleManagerView: React.FC = () => {
  const { user } = useAuth();
  const tenantId = user?.tenantId || 'tenant-default';

  const [activeModules, setActiveModules] = useState<ActiveModules>({
    projects: true,
    tasks: true,
    accounts: true,
    contacts: true,
    deals: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const fetchSystemConfig = async () => {
      setLoading(true);
      try {
        const data = await apiClient.get<any>('/settings/system').catch(() => null);
        if (data && data.activeModules) {
          setActiveModules(data.activeModules as ActiveModules);
        }
      } catch (err) {
        console.warn('Using default active modules state:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSystemConfig();
  }, [tenantId]);

  const toggleModule = (mod: SupportedModule) => {
    setActiveModules((prev) => ({
      ...prev,
      [mod]: !prev[mod],
    }));
  };

  const handleSaveModules = async () => {
    setSaving(true);
    setSaveSuccess(false);

    try {
      await apiClient.post('/settings/system', {
        activeModules,
        updatedAt: new Date().toISOString(),
        updatedBy: user?.uid || 'system',
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save module configurations:', err);
    } finally {
      setSaving(false);
    }
  };

  const modulesMeta: {
    id: SupportedModule;
    name: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
  }[] = [
    {
      id: 'projects',
      name: 'Projects & Workspaces',
      description: 'Multi-agent project repository memberships and team collaboration directories.',
      icon: FolderKanban,
      accentColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    },
    {
      id: 'tasks',
      name: 'Kanban Tasks & Sprints',
      description: 'Interactive kanban boards, subtask checklists, and agent priority execution lanes.',
      icon: Kanban,
      accentColor: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    },
    {
      id: 'accounts',
      name: 'Client Accounts (CRM 360)',
      description: 'Account firmographics, SLA health monitoring, enterprise contracts and billing tiers.',
      icon: Building2,
      accentColor: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    },
    {
      id: 'contacts',
      name: 'Contacts & Stakeholders',
      description: 'Directory of client stakeholders, lifecycle stages, and direct communication logs.',
      icon: Users,
      accentColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      id: 'deals',
      name: 'Deals & Revenue Pipeline',
      description: 'Multi-stage sales pipelines, revenue forecasting, and automatic closed-won project conversions.',
      icon: DollarSign,
      accentColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            Module Manager
          </h2>
          <p className="text-xs text-slate-400">
            Dynamically toggle operational CRM and PM modules in this tenant's workspace system config.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="text-xs text-emerald-600 flex items-center gap-1 font-semibold">
              <CheckCircle2 className="w-4 h-4" /> Configuration Saved!
            </span>
          )}
          <button
            onClick={handleSaveModules}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>
      </div>

      {/* Module Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto mb-2" />
          <p className="text-xs">Loading module states...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {modulesMeta.map((mod) => {
            const isActive = activeModules[mod.id] ?? true;
            const Icon = mod.icon;

            return (
              <div
                key={mod.id}
                className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-4 backdrop-blur-md hover:border-slate-700 transition-all"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center border flex-shrink-0 ${mod.accentColor}`}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-100 truncate">{mod.name}</h3>
                      <span
                        className={`text-[10px] px-2 py-0.2 rounded-full font-mono font-semibold ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {isActive ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{mod.description}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => toggleModule(mod.id)}
                  className="p-1 text-slate-400 hover:text-white transition-colors flex-shrink-0"
                  title={isActive ? 'Disable Module' : 'Enable Module'}
                >
                  {isActive ? (
                    <ToggleRight className="w-8 h-8 text-indigo-400" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-slate-600" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ModuleManagerView;
