import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Users,
  Shield,
  Layers,
  Zap,
  Mail,
  Sliders,
  ChevronDown,
  ChevronRight,
  UserCheck,
  Network,
  KeyRound,
  Share2,
  SlidersHorizontal,
  TableProperties,
  ListFilter,
  Hash,
  GitFork,
  Clock,
  Webhook,
  FileText,
  Send,
  FileCode2,
  Bell,
  Building,
  Coins,
  History,
  Calendar,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import clsx from 'clsx';

interface SettingsCategory {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  items: {
    to: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }[];
}

export const SETTINGS_CATEGORIES: SettingsCategory[] = [
  {
    id: 'access',
    title: 'Users & Access Control',
    icon: Users,
    color: 'text-sky-400',
    items: [
      { to: '/settings/access/users', label: 'User Management', icon: UserCheck },
      { to: '/settings/access/roles', label: 'Role Hierarchy Tree', icon: Network },
      { to: '/settings/access/profiles', label: 'Profiles Matrix', icon: KeyRound },
      { to: '/settings/access/sharing', label: 'Data Sharing Rules', icon: Share2 },
    ],
  },
  {
    id: 'customization',
    title: 'Module Customization',
    icon: SlidersHorizontal,
    color: 'text-indigo-400',
    items: [
      { to: '/settings/customization/modules', label: 'Module Manager', icon: Layers },
      { to: '/settings/customization/layouts', label: 'Layout & Fields Editor', icon: TableProperties },
      { to: '/settings/customization/picklists', label: 'Picklist Manager', icon: ListFilter },
      { to: '/settings/customization/numbering', label: 'Auto-Numbering', icon: Hash },
    ],
  },
  {
    id: 'automation',
    title: 'Automation Engine',
    icon: Zap,
    color: 'text-amber-400',
    items: [
      { to: '/settings/automation/workflows', label: 'Workflow Rules', icon: GitFork },
      { to: '/settings/automation/forms', label: 'Web Forms & Routing', icon: FileText, badge: 'Logic' },
      { to: '/settings/automation/cron', label: 'Scheduled Triggers', icon: Clock },
      { to: '/settings/automation/webhooks', label: 'Webhooks Gateway', icon: Webhook },
    ],
  },
  {
    id: 'communication',
    title: 'Communication Gateway',
    icon: Mail,
    color: 'text-emerald-400',
    items: [
      { to: '/settings/communication/email', label: 'Outgoing Email Server', icon: Send },
      { to: '/settings/communication/templates', label: 'Email Templates', icon: FileCode2 },
      { to: '/settings/communication/notifications', label: 'Notification Dispatcher', icon: Bell },
    ],
  },
  {
    id: 'system',
    title: 'System Configuration',
    icon: Sliders,
    color: 'text-purple-400',
    items: [
      { to: '/settings/system/company', label: 'Company Branding', icon: Building },
      { to: '/settings/system/fiscal', label: 'Currency & Fiscal', icon: Coins },
      { to: '/settings/system/audit', label: 'Audit Trail Logs', icon: History },
      { to: '/settings/system/popia', label: 'POPIA Governance', icon: Shield, badge: 'POPIA' },
      { to: '/settings/system/accounting', label: 'Accounting (Sage SA & Xero)', icon: Coins, badge: 'GL' },
      { to: '/settings/system/calendars', label: 'Working Calendars & Shutdown', icon: Calendar, badge: 'SAST' },
    ],
  },
];

export const SettingsSidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    access: true,
    customization: true,
    automation: true,
    communication: true,
    system: true,
  });

  const toggleCategory = (id: string) => {
    setOpenCategories((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <aside
      className={clsx(
        'h-full bg-slate-900/60 border-r border-slate-800/80 flex flex-col transition-all duration-200 backdrop-blur-sm relative z-10 flex-shrink-0',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header / Collapse Toggle */}
      <div className="h-12 px-4 flex items-center justify-between border-b border-slate-800/60">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
              Admin Categories
            </span>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors mx-auto"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="w-4 h-4 text-indigo-400" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {SETTINGS_CATEGORIES.map((cat) => {
          const isOpen = openCategories[cat.id] ?? true;
          const CategoryIcon = cat.icon;

          return (
            <div key={cat.id} className="space-y-1">
              {!isCollapsed ? (
                <button
                  onClick={() => toggleCategory(cat.id)}
                  className="w-full flex items-center justify-between px-2.5 py-1 text-[11px] font-semibold text-slate-400 hover:text-slate-200 transition-colors group"
                >
                  <span className="flex items-center gap-2">
                    <CategoryIcon className={clsx('w-3.5 h-3.5', cat.color)} />
                    <span>{cat.title}</span>
                  </span>
                  {isOpen ? (
                    <ChevronDown className="w-3 h-3 text-slate-500 group-hover:text-slate-300" />
                  ) : (
                    <ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-slate-300" />
                  )}
                </button>
              ) : (
                <div className="flex justify-center py-1 text-slate-400" title={cat.title}>
                  <CategoryIcon className={clsx('w-4 h-4', cat.color)} />
                </div>
              )}

              {/* Child Links */}
              {(!isCollapsed ? isOpen : true) && (
                <div className="space-y-0.5 pl-1">
                  {cat.items.map((item) => {
                    const ItemIcon = item.icon;
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        title={isCollapsed ? item.label : undefined}
                        className={({ isActive }) =>
                          clsx(
                            'flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150',
                            isActive
                              ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-sm font-semibold'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60',
                            isCollapsed && 'justify-center px-0'
                          )
                        }
                      >
                        <ItemIcon className="w-3.5 h-3.5 flex-shrink-0" />
                        {!isCollapsed && <span className="truncate">{item.label}</span>}
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
};

export default SettingsSidebar;
