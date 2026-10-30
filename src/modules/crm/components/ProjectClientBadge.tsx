import React, { useState } from 'react';
import { 
  Building2, 
  User 
} from 'lucide-react';
import clsx from 'clsx';
import { Project } from '../../../types';
import { useAccounts } from '../hooks/useAccounts';
import { useContacts } from '../hooks/useContacts';
import { useDeals } from '../hooks/useDeals';
import { Account360Drawer } from './Account360Drawer';
import { Account } from '../../../types/crm';
import { useCurrency } from '../../../context/CurrencyContext';

interface ProjectClientBadgeProps {
  project: Project | null;
  className?: string;
}

export const ProjectClientBadge: React.FC<ProjectClientBadgeProps> = ({ project, className }) => {
  const { formatCurrency } = useCurrency();
  const { accounts } = useAccounts();
  const { contacts } = useContacts();
  const { deals } = useDeals();

  const [selectedAccountFor360, setSelectedAccountFor360] = useState<Account | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  if (!project) return null;

  const targetAccountId = project.accountId || project.organizationId;
  const account = accounts.find((a) => a.id === targetAccountId);
  const contact = contacts.find((c) => c.id === project.primaryContactId || (account && c.accountId === account.id && c.isPrimaryContact));
  const deal = deals.find((d) => d.id === project.dealId || d.linkedProjectId === project.id);

  if (!account && !deal && !contact) return null;

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

  return (
    <>
      <div
        className={clsx(
          'inline-flex items-center gap-3 p-2 px-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs shadow-md backdrop-blur-md',
          className
        )}
      >
        {/* Account Info */}
        {account && (
          <button
            type="button"
            onClick={() => {
              setSelectedAccountFor360(account);
              setIsDrawerOpen(true);
            }}
            className="flex items-center gap-1.5 text-slate-200 hover:text-indigo-300 transition cursor-pointer"
          >
            <Building2 className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-bold">{account.name}</span>
            <span className={clsx('text-[9px] uppercase font-mono px-1.5 py-0.2 rounded border font-semibold ml-1', getStatusBadge(account.status))}>
              {account.status.replace('_', ' ')}
            </span>
          </button>
        )}

        {/* Primary Contact */}
        {contact && (
          <div className="hidden sm:flex items-center gap-1.5 text-slate-400 border-l border-slate-800 pl-3">
            <User className="w-3 h-3 text-slate-500" />
            <span className="truncate max-w-[120px]">{contact.firstName} {contact.lastName}</span>
          </div>
        )}

        {/* Budget / Deal Link */}
        {deal && (
          <div className="flex items-center gap-1 text-emerald-400 font-mono font-bold border-l border-slate-800 pl-3">
            <span>{formatCurrency(deal.value || deal.amount || 0)}</span>
          </div>
        )}
      </div>

      {/* Account 360 Flyout */}
      <Account360Drawer
        account={selectedAccountFor360}
        contacts={contacts}
        deals={deals}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedAccountFor360(null);
        }}
      />
    </>
  );
};

export default ProjectClientBadge;
