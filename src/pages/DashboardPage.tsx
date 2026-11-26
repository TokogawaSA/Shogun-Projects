import React, { useEffect, useState } from 'react';
import {
  FolderKanban,
  CheckSquare,
  Building2,
  Briefcase,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { apiClient } from '../services/api';

interface DashboardCounts {
  projects: number;
  tasks: number;
  accounts: number;
  deals: number;
}

interface ActivityItem {
  id: string;
  title: string;
  subtitle: string;
  timestamp: string;
}

export const DashboardPage: React.FC = () => {
  const [counts, setCounts] = useState<DashboardCounts>({
    projects: 0,
    tasks: 0,
    accounts: 0,
    deals: 0,
  });
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      setLoading(true);
      try {
        const [projectsRes, tasksRes, accountsRes, dealsRes] = await Promise.all([
          apiClient.get<any[]>('/projects').catch(() => []),
          apiClient.get<any[]>('/projects/tasks/all').catch(() => []),
          apiClient.get<any[]>('/crm/accounts').catch(() => []),
          apiClient.get<any[]>('/crm/deals').catch(() => []),
        ]);

        if (!mounted) return;

        const projects = Array.isArray(projectsRes) ? projectsRes : [];
        const tasks = Array.isArray(tasksRes) ? tasksRes : [];
        const accounts = Array.isArray(accountsRes) ? accountsRes : [];
        const deals = Array.isArray(dealsRes) ? dealsRes : [];

        setCounts({
          projects: projects.length,
          tasks: tasks.length,
          accounts: accounts.length,
          deals: deals.length,
        });

        const latestTasks: ActivityItem[] = tasks
          .slice(0, 6)
          .map((t: any) => ({
            id: t.id,
            title: t.title || 'Untitled Task',
            subtitle: `Status: ${t.status || 'todo'}`,
            timestamp: t.updatedAt
              ? new Date(t.updatedAt).toLocaleDateString()
              : '',
          }));

        setRecentActivity(latestTasks);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void loadDashboard();
    return () => {
      mounted = false;
    };
  }, []);

  const stats = [
    {
      label: 'Active Projects',
      value: loading ? '—' : String(counts.projects),
      change: 'Workspace Live',
      icon: FolderKanban,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50 border border-indigo-200/60',
    },
    {
      label: 'Tracked Tasks',
      value: loading ? '—' : String(counts.tasks),
      change: 'REST Live',
      icon: CheckSquare,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 border border-emerald-200/60',
    },
    {
      label: 'CRM Accounts',
      value: loading ? '—' : String(counts.accounts),
      change: 'Tenant Scoped',
      icon: Building2,
      color: 'text-amber-600',
      bg: 'bg-amber-50 border border-amber-200/60',
    },
    {
      label: 'Pipeline Deals',
      value: loading ? '—' : String(counts.deals),
      change: 'CRM Live',
      icon: Briefcase,
      color: 'text-violet-600',
      bg: 'bg-violet-50 border border-violet-200/60',
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="glass-card p-5 rounded-xl border border-slate-700 bg-slate-900 shadow-sm hover:border-indigo-300 transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{stat.label}</span>
                <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-slate-100 tracking-tight">{stat.value}</div>
                <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                  <span className="text-emerald-600 font-semibold">{stat.change}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Workspace Activity Log */}
      <div className="glass-panel p-6 rounded-xl border border-slate-700 bg-slate-900 shadow-sm">
        <h4 className="text-sm font-bold text-slate-100 mb-4 flex items-center justify-between">
          <span>Recent Workspace Activity</span>
          <span className="text-xs font-normal text-slate-400 font-mono">Live Data</span>
        </h4>
        {loading ? (
          <p className="text-xs text-slate-400 py-6 text-center">Loading workspace activity...</p>
        ) : recentActivity.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">
            No workspace activity recorded yet. Create a project or task to get started.
          </p>
        ) : (
          <div className="space-y-3">
            {recentActivity.map((evt) => (
              <div key={evt.id} className="p-3.5 rounded-lg bg-slate-800/70 border border-slate-700 flex items-center justify-between hover:bg-slate-800 transition">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-slate-100">{evt.title}</p>
                    <p className="text-xs text-slate-400">{evt.subtitle}</p>
                  </div>
                </div>
                {evt.timestamp && (
                  <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3" /> {evt.timestamp}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
