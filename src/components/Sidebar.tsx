import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FolderKanban,
  Kanban, 
  DollarSign, 
  Building2, 
  Users, 
  Target, 
  CalendarRange, 
  Cpu, 
  Settings, 
  Layers, 
  Sparkles,
  Award,
  Gauge,
  BarChart3,
  Calculator,
  Receipt,
  ShieldAlert,
  Network,
  ShieldCheck,
  Briefcase,
  FileText,
  Boxes,
  BookOpen,
  FileSpreadsheet
} from 'lucide-react';
import clsx from 'clsx';

export const Sidebar: React.FC = () => {
  const workspaceItems = [
    { to: '/', label: 'Overview', icon: LayoutDashboard },
    { to: '/projects', label: 'Projects', icon: FolderKanban },
    { to: '/board', label: 'Kanban Board', icon: Kanban },
  ];

  const ppmItems = [
    { to: '/ppm/portfolio', label: 'Executive Portfolios', icon: Briefcase },
    { to: '/ppm/portfolio/strategic', label: 'Strategic Alignment', icon: Target },
    { to: '/ppm/portfolio/audit', label: 'Audit Trail & Compliance', icon: FileText },
    { to: '/ppm/financials', label: 'Financial Overview', icon: BarChart3 },
    { to: '/ppm/financials/budget', label: 'Budget Controls', icon: Calculator },
    { to: '/ppm/financials/expenses', label: 'Expense Claims', icon: Receipt },
    { to: '/ppm/risks', label: 'Risk Matrix & Register', icon: ShieldAlert },
    { to: '/ppm/risks/dependencies', label: 'Dependency Matrix', icon: Network },
    { to: '/ppm/risks/mitigation', label: 'Mitigation Tracker', icon: ShieldCheck },
    { to: '/ppm/resources', label: 'Capacity & Workload', icon: Gauge },
    { to: '/ppm/resources/skills', label: 'Skill Matrix & Rates', icon: Award },
  ];

  const crmItems = [
    { to: '/crm/leads', label: 'Leads & Prospects', icon: Target },
    { to: '/crm/accounts', label: 'Client Accounts', icon: Building2 },
    { to: '/crm/contacts', label: 'Contacts Directory', icon: Users },
    { to: '/crm/deals', label: 'Deals & Revenue', icon: DollarSign },
  ];

  const catalogItems = [
    { to: '/catalog', label: 'Products & Services', icon: Boxes },
    { to: '/catalog/price-books', label: 'Price Books & Tiers', icon: BookOpen },
    { to: '/catalog/quotes', label: 'Quote Builder & Scopes', icon: FileSpreadsheet },
  ];

  const systemItems = [
    { to: '/gantt', label: 'Gantt Timeline', icon: CalendarRange },
    { to: '/mcp', label: 'MCP & Agents', icon: Cpu },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 h-screen bg-slate-900/95 border-r border-slate-700 flex flex-col flex-shrink-0 backdrop-blur-md">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-700">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
          <Layers className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight text-slate-100 flex items-center gap-1.5">
            Shogun Projects
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">2.0</span>
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
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-sm font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
                  )
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Enterprise PPM Subsystem */}
        <div className="space-y-1">
          <div className="px-3 pb-1 text-[10px] font-semibold text-emerald-600 uppercase tracking-wider font-mono flex items-center justify-between">
            <span>Portfolio & PPM</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">Enterprise</span>
          </div>
          {ppmItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150',
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-sm font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
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
          <div className="px-3 pb-1 text-[10px] font-semibold text-indigo-600 uppercase tracking-wider font-mono flex items-center justify-between">
            <span>CRM Subsystem</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">Modular</span>
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
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-sm font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
                  )
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Products & Services Catalog */}
        <div className="space-y-1">
          <div className="px-3 pb-1 text-[10px] font-semibold text-violet-700 uppercase tracking-wider font-mono flex items-center justify-between">
            <span>Catalog & Pricing</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-violet-50 text-violet-700 border border-violet-200">Commerce</span>
          </div>
          {catalogItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150',
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-sm font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
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
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-sm font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
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
      <div className="p-4 border-t border-slate-700 bg-slate-900/50">
        <div className="p-3 rounded-lg bg-indigo-50/70 border border-indigo-200/80 flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-indigo-600 flex-shrink-0 animate-pulse" />
          <div className="text-xs">
            <p className="font-semibold text-indigo-950">REST API Engine Live</p>
            <p className="text-[11px] text-slate-400">Gemini 3.7 Agent Active</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
