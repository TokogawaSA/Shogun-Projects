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
    { label: 'Active Agent Workers', value: '4 Sentinel / 2 Workers', change: '+2 active', icon: Bot, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { label: 'Firestore Collections', value: '12 Synced', change: 'WebSockets Live', icon: Database, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'MCP Pipelines', value: '5 Tools Exposed', change: 'Firebase MCP OK', icon: Workflow, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Cloud Functions Gen 2', value: '8 Endpoints', change: 'Node 22 / TS', icon: Server, color: 'text-violet-400', bg: 'bg-violet-500/10' },
  ];

  const recentEvents = [
    { title: 'Firestore onSnapshot Listener Connected', time: '2 mins ago', status: 'success', agent: 'Sentinel Subagent' },
    { title: 'Firebase MCP Server Initialized (firebase-tools@latest)', time: '8 mins ago', status: 'success', agent: 'Antigravity IDE' },
    { title: 'React 19 + Vite Multi-Page Scaffold Built', time: '14 mins ago', status: 'success', agent: 'Worker Subagent' },
    { title: 'Global Rule Verification & Security Audit Pass', time: '22 mins ago', status: 'info', agent: 'Auditor Subagent' },
  ];

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="glass-card p-5 rounded-xl border border-slate-800 bg-slate-900/50 hover:border-slate-700 transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">{stat.label}</span>
                <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-white tracking-tight">{stat.value}</div>
                <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                  <span className="text-emerald-400 font-medium">{stat.change}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dual Architecture Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-slate-900/80 border border-indigo-500/20 glass-panel">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
            Antigravity 2.0 Dual-Wield Architecture
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">
            High-Velocity Parallel Multi-Agent Orchestration & Clean React 19 Frontend
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            Developers dual-wield the standalone Antigravity 2.0 Desktop app for background sweeps and automated tests while actively authoring in the Antigravity IDE. Real-time changes synchronize across Firestore and Firebase MCP endpoints.
          </p>
        </div>
      </div>

      {/* Live System Log & Agent Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel p-6 rounded-xl border border-slate-800 bg-slate-900/40">
          <h4 className="text-sm font-bold text-white mb-4 flex items-center justify-between">
            <span>Agentic Orchestration Activity Log</span>
            <span className="text-xs font-normal text-slate-400">Live Telemetry</span>
          </h4>
          <div className="space-y-3">
            {recentEvents.map((evt, idx) => (
              <div key={idx} className="p-3.5 rounded-lg bg-slate-800/40 border border-slate-800 flex items-center justify-between hover:bg-slate-800/70 transition">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-slate-200">{evt.title}</p>
                    <p className="text-xs text-slate-400">Triggered by: <span className="text-indigo-400 font-mono">{evt.agent}</span></p>
                  </div>
                </div>
                <span className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3" /> {evt.time}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel p-6 rounded-xl border border-slate-800 bg-slate-900/40 space-y-4">
          <h4 className="text-sm font-bold text-white">Subagent Matrix</h4>
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/50">
              <div className="flex justify-between items-center text-xs font-semibold text-indigo-300">
                <span>Sentinel Subagent</span>
                <span className="text-emerald-400">Active</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Evaluates form structures, logic flows, and database schemas.</p>
            </div>

            <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/50">
              <div className="flex justify-between items-center text-xs font-semibold text-indigo-300">
                <span>Worker Subagent</span>
                <span className="text-emerald-400">Active</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Generates namespaced PHP/TS files, custom REST paths, and React components.</p>
            </div>

            <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/50">
              <div className="flex justify-between items-center text-xs font-semibold text-indigo-300">
                <span>Auditor Subagent</span>
                <span className="text-emerald-400">Active</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Inspects security layers, nonces, sanitizations, and MCP policies.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
