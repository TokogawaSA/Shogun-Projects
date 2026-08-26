import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Layers,
  Zap,
  Mail,
  Sliders,
  UserCheck,
  Network,
  KeyRound,
  Share2,
  TableProperties,
  ListFilter,
  Hash,
  GitFork,
  Clock,
  Webhook,
  Send,
  FileCode2,
  Bell,
  Building,
  Coins,
  History,
  Search,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import clsx from 'clsx';

interface HubCardProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  bgGlow: string;
  borderColor: string;
  links: {
    to: string;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }[];
  activeFilter?: string;
}

const HubCard: React.FC<HubCardProps> = ({
  title,
  description,
  icon: Icon,
  accentColor,
  bgGlow,
  borderColor,
  links,
  activeFilter = '',
}) => {
  const filteredLinks = links.filter(
    (l) =>
      !activeFilter ||
      l.label.toLowerCase().includes(activeFilter.toLowerCase()) ||
      l.description.toLowerCase().includes(activeFilter.toLowerCase()) ||
      title.toLowerCase().includes(activeFilter.toLowerCase())
  );

  if (activeFilter && filteredLinks.length === 0) {
    return null;
  }

  return (
    <div
      className={clsx(
        'relative rounded-2xl border p-6 transition-all duration-300 group overflow-hidden bg-slate-900/60 backdrop-blur-md hover:shadow-2xl',
        borderColor
      )}
    >
      {/* Background Accent Glow */}
      <div
        className={clsx(
          'absolute -right-16 -top-16 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none transition-opacity duration-300 group-hover:opacity-40',
          bgGlow
        )}
      />

      {/* Card Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={clsx(
              'w-10 h-10 rounded-xl flex items-center justify-center border shadow-inner',
              accentColor
            )}
          >
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100 tracking-tight flex items-center gap-2">
              {title}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
          </div>
        </div>
      </div>

      {/* Sub-links Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
        {filteredLinks.map((link) => {
          const LinkIcon = link.icon;
          return (
            <Link
              key={link.to}
              to={link.to}
              className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 transition-all duration-150 group/item"
            >
              <div className="p-2 rounded-lg bg-slate-700/50 text-slate-300 group-hover/item:text-indigo-600 group-hover/item:bg-indigo-50 transition-colors">
                <LinkIcon className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-semibold text-slate-200 group-hover/item:text-indigo-600 truncate">
                    {link.label}
                  </span>
                  {link.badge && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {link.badge}
                    </span>
                  )}
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover/item:text-indigo-600 group-hover/item:translate-x-0.5 transition-all opacity-0 group-hover/item:opacity-100 flex-shrink-0" />
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                  {link.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export const SettingsHub: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const bentoSections = [
    {
      id: 'access',
      title: 'Users & Access Control',
      description: 'Manage tenant operators, hierarchical role trees, profile privileges & field-level visibility',
      icon: Users,
      accentColor: 'bg-gradient-to-tr from-sky-600 to-blue-500 border-sky-400/30',
      bgGlow: 'bg-sky-500',
      borderColor: 'border-sky-500/20 hover:border-sky-500/40',
      links: [
        {
          to: '/settings/access/users',
          label: 'User Management',
          description: 'Invite members, assign profiles & sync custom claims',
          icon: UserCheck,
          badge: 'Live',
        },
        {
          to: '/settings/access/roles',
          label: 'Role Hierarchy Tree',
          description: 'Parent-child reporting tree and organizational trees',
          icon: Network,
        },
        {
          to: '/settings/access/profiles',
          label: 'Profiles Matrix',
          description: 'Granular CRUD module & field-level security permissions',
          icon: KeyRound,
        },
        {
          to: '/settings/access/sharing',
          label: 'Data Sharing Rules',
          description: 'Public, private and custom exception record sharing policies',
          icon: Share2,
        },
      ],
    },
    {
      id: 'customization',
      title: 'Module Customization',
      description: 'Tailor CRM entities, custom fields, layout blocks, picklists and sequence number generation',
      icon: Layers,
      accentColor: 'bg-gradient-to-tr from-indigo-600 to-violet-500 border-indigo-400/30',
      bgGlow: 'bg-indigo-500',
      borderColor: 'border-indigo-500/20 hover:border-indigo-500/40',
      links: [
        {
          to: '/settings/customization/modules',
          label: 'Module Manager',
          description: 'Enable, disable or provision custom business modules',
          icon: Layers,
        },
        {
          to: '/settings/customization/layouts',
          label: 'Layout & Fields Editor',
          description: 'Drag-and-drop form block designer & custom schema fields',
          icon: TableProperties,
          badge: 'Editor',
        },
        {
          to: '/settings/customization/picklists',
          label: 'Picklist Manager',
          description: 'Dropdown options and dependency matrices for select fields',
          icon: ListFilter,
        },
        {
          to: '/settings/customization/numbering',
          label: 'Auto-Numbering',
          description: 'Configurable prefixes and auto-incrementing serial IDs',
          icon: Hash,
        },
      ],
    },
    {
      id: 'automation',
      title: 'Automation Engine',
      description: 'Event-driven triggers, conditional evaluation matrices, and serverless workflow actions',
      icon: Zap,
      accentColor: 'bg-gradient-to-tr from-amber-600 to-orange-500 border-amber-400/30',
      bgGlow: 'bg-amber-500',
      borderColor: 'border-amber-500/20 hover:border-amber-500/40',
      links: [
        {
          to: '/settings/automation/workflows',
          label: 'Workflow Rules',
          description: 'Multi-step condition engines (On Create, Update, Stage Change)',
          icon: GitFork,
          badge: 'Engine',
        },
        {
          to: '/settings/automation/cron',
          label: 'Scheduled Triggers',
          description: 'Time-based automated pipelines and recurring batch jobs',
          icon: Clock,
        },
        {
          to: '/settings/automation/webhooks',
          label: 'Webhooks Gateway',
          description: 'Inbound and outbound JSON webhooks with token auth',
          icon: Webhook,
        },
      ],
    },
    {
      id: 'communication',
      title: 'Communication Gateway',
      description: 'Configure transactional SMTP/SendGrid gateways, HTML email templates & notification queues',
      icon: Mail,
      accentColor: 'bg-gradient-to-tr from-emerald-600 to-teal-500 border-emerald-400/30',
      bgGlow: 'bg-emerald-500',
      borderColor: 'border-emerald-500/20 hover:border-emerald-500/40',
      links: [
        {
          to: '/settings/communication/email',
          label: 'Outgoing Email Server',
          description: 'SMTP credentials, SendGrid API keys & real-time connection tester',
          icon: Send,
          badge: 'SMTP',
        },
        {
          to: '/settings/communication/templates',
          label: 'Email Templates',
          description: 'Rich HTML notification templates with dynamic merge tokens',
          icon: FileCode2,
        },
        {
          to: '/settings/communication/notifications',
          label: 'Notification Dispatcher',
          description: 'In-app telemetry alerts and agent communication queues',
          icon: Bell,
        },
      ],
    },
    {
      id: 'system',
      title: 'System Configuration',
      description: 'Organization identity, global currencies, fiscal year definitions and audit logs',
      icon: Sliders,
      accentColor: 'bg-gradient-to-tr from-purple-600 to-pink-500 border-purple-400/30',
      bgGlow: 'bg-purple-500',
      borderColor: 'border-purple-500/20 hover:border-purple-500/40',
      links: [
        {
          to: '/settings/system/company',
          label: 'Company Branding',
          description: 'Brand identity, logos, domains, and global timezone',
          icon: Building,
        },
        {
          to: '/settings/system/fiscal',
          label: 'Currency & Fiscal',
          description: 'Base currency, exchange rates, and financial year start',
          icon: Coins,
        },
        {
          to: '/settings/system/audit',
          label: 'Audit Trail Logs',
          description: 'Comprehensive immutable logs of configuration mutations',
          icon: History,
        },
      ],
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Banner with Quick Search */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-gradient-to-r from-indigo-950/60 via-slate-900/80 to-slate-950 p-8 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                VTiger-Style Administration Hub
              </span>
              <span className="text-[10px] font-mono text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Tenant Isolated
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-100 tracking-tight">
              Platform & CRM Settings
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Configure organizational access hierarchy, dynamic field schemas, automated workflow engines, and email gateways across all Antigravity 2.0 modules.
            </p>
          </div>

          {/* Search Bar in Banner */}
          <div className="w-full md:w-80">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search settings modules..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-sans shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Quick Metric Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-sky-50 text-sky-700 border border-sky-200">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Access Control</p>
              <p className="text-sm font-bold text-slate-100 font-mono">RBAC + Field Security</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Active Modules</p>
              <p className="text-sm font-bold text-slate-100 font-mono">5 Core Modules</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Workflow Engine</p>
              <p className="text-sm font-bold text-slate-100 font-mono">Serverless Gen 2</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Email Gateway</p>
              <p className="text-sm font-bold text-slate-100 font-mono">SMTP / SendGrid</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {bentoSections.map((section) => (
          <HubCard
            key={section.id}
            title={section.title}
            description={section.description}
            icon={section.icon}
            accentColor={section.accentColor}
            bgGlow={section.bgGlow}
            borderColor={section.borderColor}
            links={section.links}
            activeFilter={searchQuery}
          />
        ))}
      </div>
    </div>
  );
};

export default SettingsHub;
