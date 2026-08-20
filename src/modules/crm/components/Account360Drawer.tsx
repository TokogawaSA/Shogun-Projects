import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, 
  Building2, 
  Globe, 
  Users, 
  DollarSign, 
  FolderKanban, 
  ArrowRight, 
  CreditCard, 
  Plus
} from 'lucide-react';
import clsx from 'clsx';
import { Account, Contact, Deal } from '../../../types/crm';
import { Project } from '../../../types';
import { useProject } from '../../../context/ProjectContext';

interface Account360DrawerProps {
  account: Account | null;
  contacts: Contact[];
  deals: Deal[];
  projects?: Project[];
  isOpen: boolean;
  onClose: () => void;
  onOpenCreateDeal?: (accountId: string) => void;
}

export const Account360Drawer: React.FC<Account360DrawerProps> = ({
  account,
  contacts,
  deals,
  isOpen,
  onClose,
  onOpenCreateDeal,
}) => {
  const navigate = useNavigate();
  const { projects, setCurrentProjectId } = useProject();

  if (!isOpen || !account) return null;

  const accountContacts = contacts.filter((c) => c.accountId === account.id);
  const accountDeals = deals.filter((d) => d.accountId === account.id);
  const accountProjects = projects.filter(
    (p) => p.accountId === account.id || p.organizationId === account.id
  );

  const totalDealValue = accountDeals.reduce((sum, d) => sum + (d.value || d.amount || 0), 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active_client':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'prospect':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'churn_risk':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'former_client':
      default:
        return 'bg-slate-700/40 text-slate-300 border-slate-600/30';
    }
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'enterprise':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'growth':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
      case 'starter':
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  const handleOpenProject = (projectId: string) => {
    setCurrentProjectId(projectId);
    onClose();
    navigate('/board');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="absolute inset-y-0 right-0 max-w-full flex pl-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-screen max-w-xl bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col justify-between overflow-y-auto">
          {/* Header */}
          <div className="p-6 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-10">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={clsx('text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border', getStatusBadge(account.status))}>
                      {account.status.replace('_', ' ')}
                    </span>
                    <span className={clsx('text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border', getTierBadge(account.tier))}>
                      {account.tier}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white tracking-tight mt-1">
                    {account.name}
                  </h2>
                </div>
              </div>

              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-meta */}
            <div className="flex items-center gap-4 mt-4 text-xs text-slate-400 font-mono">
              {account.domain && (
                <span className="flex items-center gap-1 text-indigo-300">
                  <Globe className="w-3.5 h-3.5" />
                  {account.domain}
                </span>
              )}
              <span>•</span>
              <span>{account.industry}</span>
              <span>•</span>
              <span className="text-emerald-400 font-bold">${totalDealValue.toLocaleString()} Pipeline</span>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-6 flex-1">
            {/* Firmographics & Billing Card */}
            <div className="glass-panel p-4 rounded-xl border border-slate-800 bg-slate-950/40 space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Firmographics & Account Details
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Account ID</span>
                  <span className="font-mono text-slate-300">{account.id}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Account Owner</span>
                  <span className="font-mono text-slate-300">{account.assignedOwnerId}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Currency</span>
                  <span className="font-mono text-slate-300 flex items-center gap-1">
                    <CreditCard className="w-3 h-3 text-indigo-400" />
                    {account.billingDetails?.currency || 'USD'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Created Date</span>
                  <span className="text-slate-300">{new Date(account.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Linked Projects Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                  <FolderKanban className="w-4 h-4 text-indigo-400" />
                  <span>Linked Projects ({accountProjects.length})</span>
                </h3>
              </div>

              {accountProjects.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-slate-800 bg-slate-950/20 text-slate-500 text-xs text-center">
                  No delivery projects linked yet. Convert a Closed-Won deal to launch a project.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {accountProjects.map((proj) => (
                    <div
                      key={proj.id}
                      onClick={() => handleOpenProject(proj.id)}
                      className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60 hover:border-indigo-500/50 transition flex items-center justify-between cursor-pointer group"
                    >
                      <div className="min-w-0 pr-2">
                        <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 transition truncate">
                          {proj.title}
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                          {proj.description}
                        </p>
                      </div>
                      <button className="px-2.5 py-1 rounded-lg bg-indigo-600/20 group-hover:bg-indigo-600 text-indigo-300 group-hover:text-white text-[11px] font-semibold flex items-center gap-1 transition flex-shrink-0">
                        <span>Board</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Deals Pipeline Opportunities */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span>Opportunities & Deals ({accountDeals.length})</span>
                </h3>
                {onOpenCreateDeal && (
                  <button
                    onClick={() => onOpenCreateDeal(account.id)}
                    className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> New Deal
                  </button>
                )}
              </div>

              {accountDeals.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-slate-800 bg-slate-950/20 text-slate-500 text-xs text-center">
                  No active pipeline deals for this account.
                </div>
              ) : (
                <div className="space-y-2">
                  {accountDeals.map((deal) => (
                    <div
                      key={deal.id}
                      className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="truncate pr-2">
                        <p className="font-semibold text-slate-200 truncate">{deal.title}</p>
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-900 text-indigo-300 border border-slate-700 inline-block mt-1">
                          {deal.pipelineStage}
                        </span>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-sm font-bold text-emerald-400 font-mono">
                          ${(deal.value || deal.amount || 0).toLocaleString()}
                        </span>
                        <p className="text-[10px] text-slate-500 font-mono">{deal.expectedCloseDate}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Key Contacts Section */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                <Users className="w-4 h-4 text-indigo-400" />
                <span>Associated Contacts ({accountContacts.length})</span>
              </h3>

              {accountContacts.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-slate-800 bg-slate-950/20 text-slate-500 text-xs text-center">
                  No individual contacts linked to this account yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {accountContacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div className="w-7 h-7 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                          {contact.firstName.charAt(0)}{contact.lastName.charAt(0)}
                        </div>
                        <div className="truncate">
                          <p className="font-semibold text-slate-200 truncate">
                            {contact.firstName} {contact.lastName}
                            {contact.isPrimaryContact && (
                              <span className="ml-1.5 text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                Primary
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">{contact.jobTitle || contact.email}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 flex-shrink-0">
                        {contact.lifecycleStage}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-mono">Account 360 View</span>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Account360Drawer;
