import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FolderKanban,
  Kanban, 
  DollarSign,
  Building2,
  Users,
  CalendarRange, 
  Cpu, 
  Settings, 
  Layers, 
  Sparkles 
} from 'lucide-react';
import clsx from 'clsx';

export const Sidebar: React.FC = () => {
  const workspaceItems = [
    { to: '/', label: 'Overview', icon: LayoutDashboard },
    { to: '/projects', label: 'Projects', icon: FolderKanban },
    { to: '/board', label: 'Kanban Board', icon: Kanban },
  ];

  const crmItems = [
    { to: '/crm/deals', label: 'Deals Pipeline', icon: DollarSign },
    { to: '/crm/accounts', label: 'Client Accounts', icon: Building2 },
    { to: '/crm/contacts', label: 'Contacts Directory', icon: Users },
  ];

  const systemItems = [
    { to: '/gantt', label: 'Gantt Timeline', icon: CalendarRange },
    { to: '/mcp', label: 'MCP & Agents', icon: Cpu },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 h-screen bg-slate-900/80 border-r border-slate-800 flex flex-col flex-shrink-0 backdrop-blur-md">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-800/80">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Layers className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
            Shogun Projects
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">2.0</span>
          </h1>
          <p className="text-[11px] text-slate-400">Antigravity Multi-Agent Hub</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
        {/* Workspace */}
        <div className="space-y-1">
          <div className="px-3 pb-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-mono">Workspace</div>
          {workspaceItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150',
                    isActive
                      ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  )
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        {/* CRM Subsystem */}
        <div className="space-y-1">
          <div className="px-3 pb-1 text-[10px] font-semibold text-indigo-400 uppercase tracking-wider font-mono flex items-center justify-between">
            <span>CRM Subsystem</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">Modular</span>
          </div>
          {crmItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150',
                    isActive
                      ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  )
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        {/* System & Tools */}
        <div className="space-y-1">
          <div className="px-3 pb-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-mono">Platform</div>
          {systemItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150',
                    isActive
                      ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  )
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Footer / Status */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="p-3 rounded-lg bg-indigo-950/30 border border-indigo-500/20 flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-indigo-400 flex-shrink-0 animate-pulse" />
          <div className="text-xs">
            <p className="font-semibold text-indigo-200">Firebase MCP Live</p>
            <p className="text-[11px] text-slate-400">Gemini 3.7 Agent Active</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
