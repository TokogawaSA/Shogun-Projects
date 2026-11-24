import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  FolderKanban,
  DollarSign,
  Building2,
  Users,
  Target,
  Cpu,
  Settings,
  Layers,
  Briefcase,
  Boxes,
  BookOpen,
  FileSpreadsheet,
  LogOut,
  Radio,
  Calendar,
} from 'lucide-react';
import clsx from 'clsx';

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const { user, tenant, logout } = useAuth();
  const workspaceItems = [
    { to: '/', label: 'Overview', icon: LayoutDashboard },
    { to: '/scheduler', label: 'Scheduler & Bookings', icon: Calendar },
    { to: '/social', label: 'Social Listening', icon: Radio },
  ];

  const projectPortfolioItems = [
    { to: '/projects', label: 'Projects Directory', icon: FolderKanban },
    { to: '/pm', label: 'Project Workspace', icon: Briefcase },
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
    { to: '/portal/invoices', label: 'Client Portal (ZAR Pay)', icon: DollarSign },
  ];

  const systemItems = [
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

        {/* Unified Projects & Portfolio Subsystem (Zoho Projects Model) */}
        <div className="space-y-1">
          <div className="px-3 pb-1 text-[10px] font-semibold text-indigo-400 uppercase tracking-wider font-mono flex items-center justify-between">
            <span>Projects & Portfolio</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">Zoho Model</span>
          </div>
          {projectPortfolioItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150',
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/30 font-semibold'
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

      {/* Footer / User Profile & Logout */}
      <div className="p-4 border-t border-slate-700 bg-slate-900/50 space-y-2">
        {user ? (
          <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-800/80 border border-slate-700">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                {user.displayName?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-100 truncate">{user.displayName || user.email}</p>
                <p className="text-[10px] text-slate-400 font-mono truncate">{tenant?.name || 'Workspace'}</p>
              </div>
            </div>
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-700 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <NavLink
              to="/login"
              className="flex-1 py-1.5 text-center text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition"
            >
              Sign In
            </NavLink>
            <NavLink
              to="/register"
              className="flex-1 py-1.5 text-center text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition border border-slate-700"
            >
              Register
            </NavLink>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
