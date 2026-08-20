import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  ChevronRight, 
  Search, 
  ShieldCheck, 
  LayoutGrid, 
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

interface SettingsHeaderProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  title?: string;
  subtitle?: string;
}

export const SettingsHeader: React.FC<SettingsHeaderProps> = ({
  searchQuery = '',
  onSearchChange,
  title,
  subtitle,
}) => {
  const location = useLocation();
  const { user } = useAuth();

  const getBreadcrumbs = () => {
    const pathParts = location.pathname.split('/').filter(Boolean);
    const crumbs = [{ label: 'Settings', path: '/settings' }];

    if (pathParts.length > 1) {
      const category = pathParts[1];
      const categoryLabels: Record<string, string> = {
        access: 'Users & Access Control',
        customization: 'Module Customization',
        automation: 'Automation Engine',
        communication: 'Communication Gateway',
        system: 'System Configuration',
      };

      crumbs.push({
        label: categoryLabels[category] || category.charAt(0).toUpperCase() + category.slice(1),
        path: `/settings/${category}`,
      });

      if (pathParts.length > 2) {
        const sub = pathParts[2];
        const subLabels: Record<string, string> = {
          users: 'User Management',
          roles: 'Role Hierarchy Tree',
          profiles: 'Profiles Matrix',
          sharing: 'Data Sharing Rules',
          modules: 'Module Manager',
          layouts: 'Layout & Fields Editor',
          picklists: 'Picklist Manager',
          numbering: 'Auto-Numbering Sequences',
          workflows: 'Workflow Rules',
          cron: 'Scheduled Triggers',
          webhooks: 'Webhooks',
          email: 'Outgoing Email Server',
          templates: 'Email Templates',
          notifications: 'Notification Dispatcher',
          company: 'Company Branding',
          fiscal: 'Currency & Fiscal Settings',
          audit: 'Audit Trail Logs',
        };

        crumbs.push({
          label: subLabels[sub] || sub.charAt(0).toUpperCase() + sub.slice(1),
          path: location.pathname,
        });
      }
    }

    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();
  const isHubLanding = location.pathname === '/settings';

  return (
    <div className="bg-slate-900/90 border-b border-slate-800/80 px-6 py-4 backdrop-blur-md sticky top-0 z-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Breadcrumbs & Titles */}
        <div className="space-y-1">
          <nav className="flex items-center gap-1.5 text-xs text-slate-400">
            <Link
              to="/settings"
              className="flex items-center gap-1 hover:text-indigo-300 transition-colors font-medium"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-indigo-400" />
              <span>Settings Hub</span>
            </Link>
            {breadcrumbs.slice(1).map((crumb, idx) => (
              <React.Fragment key={crumb.path}>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                {idx === breadcrumbs.length - 2 ? (
                  <span className="text-indigo-400 font-semibold">{crumb.label}</span>
                ) : (
                  <Link
                    to={crumb.path}
                    className="hover:text-indigo-300 transition-colors"
                  >
                    {crumb.label}
                  </Link>
                )}
              </React.Fragment>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              {title || (isHubLanding ? 'Settings & Administration Hub' : breadcrumbs[breadcrumbs.length - 1].label)}
            </h2>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] text-emerald-400 font-mono">
              <ShieldCheck className="w-3 h-3" />
              <span>{user?.isTenantAdmin ? 'Tenant Admin' : 'Admin Mode'}</span>
            </div>
          </div>
          {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
        </div>

        {/* Right: Quick Search & Navigation Shortcut */}
        <div className="flex items-center gap-3">
          {onSearchChange && (
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search settings, fields, workflows..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-800/80 border border-slate-700/80 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-sans"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-white bg-slate-700/50 px-1.5 py-0.5 rounded"
                >
                  Clear
                </button>
              )}
            </div>
          )}

          {!isHubLanding && (
            <Link
              to="/settings"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs font-medium text-slate-200 transition-all hover:text-white"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-indigo-400" />
              <span>All Settings</span>
            </Link>
          )}

          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-950/40 border border-indigo-500/20 text-indigo-300 text-[11px] font-mono">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>VTiger Core 2.0</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsHeader;
