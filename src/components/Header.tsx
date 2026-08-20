import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Terminal, 
  Bell, 
  FolderKanban, 
  Kanban, 
  DollarSign, 
  Users,
  Shield
} from 'lucide-react';
import clsx from 'clsx';

export const Header: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => {
  const location = useLocation();

  return (
    <header className="h-16 px-8 border-b border-slate-800 bg-slate-900/40 backdrop-blur-md flex items-center justify-between sticky top-0 z-20 gap-4">
      <div className="flex items-center gap-6">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">{title}</h2>
          {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
        </div>

        {/* Top Navigation Tabs */}
        <div className="hidden lg:flex items-center bg-slate-950/70 p-1 rounded-xl border border-slate-800/80 gap-0.5">
          <NavLink
            to="/projects"
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150',
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              )
            }
          >
            <FolderKanban className="w-3.5 h-3.5" />
            <span>Projects</span>
          </NavLink>

          <NavLink
            to="/board"
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150',
                isActive || location.pathname === '/tasks'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              )
            }
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>Kanban Board</span>
          </NavLink>

          <NavLink
            to="/crm/deals"
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150',
                isActive || location.pathname === '/deals'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              )
            }
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Deals</span>
          </NavLink>

          <NavLink
            to="/crm/accounts"
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150',
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              )
            }
          >
            <span>Accounts</span>
          </NavLink>

          <NavLink
            to="/crm/contacts"
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150',
                isActive || location.pathname === '/crm'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              )
            }
          >
            <Users className="w-3.5 h-3.5" />
            <span>Contacts</span>
          </NavLink>

          <NavLink
            to="/settings"
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150',
                isActive || location.pathname.startsWith('/settings')
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              )
            }
          >
            <Shield className="w-3.5 h-3.5 text-indigo-400" />
            <span>Settings</span>
          </NavLink>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
          <span>Antigravity 2.0 Engine: Online</span>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition">
            <Bell className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition">
            <Terminal className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
