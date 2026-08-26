import React from 'react';
import { 
  Server, 
  Database, 
  Workflow, 
  CheckCircle2, 
  Clock, 
  Bot
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const stats = [
    { label: 'Active Agent Workers', value: '4 Sentinel / 2 Workers', change: '+2 active', icon: Bot, color: 'text-indigo-600', bg: 'bg-indigo-50 border border-indigo-200/60' },
    { label: 'Database Entities', value: '14 Synced', change: 'REST Live', icon: Database, color: 'text-emerald-600', bg: 'bg-emerald-50 border border-emerald-200/60' },
    { label: 'MCP Pipelines', value: '5 Tools Exposed', change: 'MCP OK', icon: Workflow, color: 'text-amber-600', bg: 'bg-amber-50 border border-amber-200/60' },
    { label: 'API Services', value: '12 Endpoints', change: 'Node 22 / Express', icon: Server, color: 'text-violet-600', bg: 'bg-violet-50 border border-violet-200/60' },
  ];

  const recentEvents = [
    { title: 'REST API Client Connected', time: '2 mins ago', status: 'success', agent: 'Sentinel Subagent' },
    { title: 'Antigravity MCP Server Initialized', time: '8 mins ago', status: 'success', agent: 'Antigravity IDE' },
    { title: 'React 19 + Vite Multi-Page Scaffold Built', time: '14 mins ago', status: 'success', agent: 'Worker Subagent' },
    { title: 'Global Rule Verification & Security Audit Pass', time: '22 mins ago', status: 'info', agent: 'Auditor Subagent' },
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

      {/* Dual Architecture Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-50 via-white to-violet-50/50 border border-indigo-200/80 shadow-sm glass-panel">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-indigo-100 text-indigo-700 text-xs font-semibold uppercase tracking-wider border border-indigo-200">
            Antigravity 2.0 Dual-Wield Architecture
          </div>
          <h3 className="text-xl font-bold text-slate-100 tracking-tight">
            High-Velocity Parallel Multi-Agent Orchestration & Clean React 19 Frontend
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            Developers dual-wield the standalone Antigravity 2.0 Desktop app for background sweeps and automated tests while actively authoring in the Antigravity IDE. Real-time changes synchronize across REST and MCP endpoints.
          </p>
        </div>
      </div>

      {/* Live System Log & Agent Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel p-6 rounded-xl border border-slate-700 bg-slate-900 shadow-sm">
          <h4 className="text-sm font-bold text-slate-100 mb-4 flex items-center justify-between">
            <span>Agentic Orchestration Activity Log</span>
            <span className="text-xs font-normal text-slate-400 font-mono">Live Telemetry</span>
          </h4>
          <div className="space-y-3">
            {recentEvents.map((evt, idx) => (
              <div key={idx} className="p-3.5 rounded-lg bg-slate-800/70 border border-slate-700 flex items-center justify-between hover:bg-slate-800 transition">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-slate-100">{evt.title}</p>
                    <p className="text-xs text-slate-400">Triggered by: <span className="text-indigo-600 font-mono font-medium">{evt.agent}</span></p>
                  </div>
                </div>
                <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3" /> {evt.time}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel p-6 rounded-xl border border-slate-700 bg-slate-900 shadow-sm space-y-4">
          <h4 className="text-sm font-bold text-slate-100">Subagent Matrix</h4>
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-slate-800/70 border border-slate-700">
              <div className="flex justify-between items-center text-xs font-semibold text-indigo-700">
                <span>Sentinel Subagent</span>
                <span className="text-emerald-600 font-medium">Active</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1">Evaluates form structures, logic flows, and database schemas.</p>
            </div>

            <div className="p-3 rounded-lg bg-slate-800/70 border border-slate-700">
              <div className="flex justify-between items-center text-xs font-semibold text-indigo-700">
                <span>Worker Subagent</span>
                <span className="text-emerald-600 font-medium">Active</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1">Generates namespaced PHP/TS files, custom REST paths, and React components.</p>
            </div>

            <div className="p-3 rounded-lg bg-slate-800/70 border border-slate-700">
              <div className="flex justify-between items-center text-xs font-semibold text-indigo-700">
                <span>Auditor Subagent</span>
                <span className="text-emerald-600 font-medium">Active</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1">Inspects security layers, nonces, sanitizations, and MCP policies.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
