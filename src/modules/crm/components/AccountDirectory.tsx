import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Search, 
  Globe, 
  Plus, 
  Trash2, 
  X, 
  Loader2, 
  Eye
} from 'lucide-react';
import clsx from 'clsx';
import { Account, AccountStatus, AccountTier } from '../../../types/crm';
import { useAccounts } from '../hooks/useAccounts';
import { useContacts } from '../hooks/useContacts';
import { useDeals } from '../hooks/useDeals';
import { Account360Drawer } from './Account360Drawer';

export const AccountDirectory: React.FC = () => {
  const { accounts, loading, addAccount, deleteAccount } = useAccounts();
  const { contacts } = useContacts();
  const { deals } = useDeals();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedAccountFor360, setSelectedAccountFor360] = useState<Account | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Form State
  const [newName, setNewName] = useState('');
  const [newDomain, setNewDomain] = useState('');
  const [newIndustry, setNewIndustry] = useState('Enterprise Cloud Solutions');
  const [newTier, setNewTier] = useState<AccountTier>('growth');
  const [newStatus, setNewStatus] = useState<AccountStatus>('active_client');
  const [newCurrency, setNewCurrency] = useState('USD');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      if (statusFilter !== 'all' && acc.status !== statusFilter) return false;
      if (tierFilter !== 'all' && acc.tier !== tierFilter) return false;
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      return (
        acc.name.toLowerCase().includes(q) ||
        acc.domain.toLowerCase().includes(q) ||
        acc.industry.toLowerCase().includes(q)
      );
    });
  }, [accounts, statusFilter, tierFilter, searchQuery]);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setIsSubmitting(true);
    await addAccount({
      tenantId: 'tenant-default',
      name: newName.trim(),
      domain: newDomain.trim() || `${newName.toLowerCase().replace(/\s+/g, '')}.com`,
      industry: newIndustry.trim(),
      tier: newTier,
      status: newStatus,
      assignedOwnerId: 'usr-admin-master',
      billingDetails: { currency: newCurrency },
    });

    setIsSubmitting(false);
    setNewName('');
    setNewDomain('');
    setIsAddModalOpen(false);
  };

  const getStatusBadge = (status: AccountStatus) => {
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

  const getTierBadge = (tier: AccountTier) => {
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

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Search & Actions Bar */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-wrap items-center justify-between gap-4 shadow-md">
        <div className="relative flex-1 min-w-[260px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search accounts by name, domain, industry..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Client Statuses</option>
            <option value="active_client">Active Client</option>
            <option value="prospect">Prospect</option>
            <option value="churn_risk">Churn Risk</option>
            <option value="former_client">Former Client</option>
          </select>

          {/* Tier Filter */}
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Tiers</option>
            <option value="enterprise">Enterprise</option>
            <option value="growth">Growth</option>
            <option value="starter">Starter</option>
          </select>

          {/* Add Account Button */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Account
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto" />
          <p className="text-xs text-slate-400 font-mono">Syncing Client Accounts from Firestore...</p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-[11px] text-slate-400 uppercase font-mono border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Account Name</th>
                  <th className="px-6 py-4">Domain</th>
                  <th className="px-6 py-4">Industry Sector</th>
                  <th className="px-6 py-4">Tier & Health</th>
                  <th className="px-6 py-4">Linked Deals</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredAccounts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      No accounts match your query.
                    </td>
                  </tr>
                ) : (
                  filteredAccounts.map((acc) => {
                    const accDeals = deals.filter((d) => d.accountId === acc.id);
                    const accTotalValue = accDeals.reduce((sum, d) => sum + (d.value || d.amount || 0), 0);

                    return (
                      <tr key={acc.id} className="hover:bg-slate-800/40 transition">
                        <td className="px-6 py-4 font-bold text-white">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAccountFor360(acc);
                              setIsDrawerOpen(true);
                            }}
                            className="flex items-center gap-2.5 hover:text-indigo-300 transition text-left cursor-pointer"
                          >
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0">
                              <Building2 className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="leading-snug">{acc.name}</p>
                              <span className="text-[10px] text-slate-500 font-mono">{acc.id}</span>
                            </div>
                          </button>
                        </td>

                        <td className="px-6 py-4 text-indigo-300 font-mono">
                          {acc.domain ? (
                            <span className="flex items-center gap-1.5">
                              <Globe className="w-3.5 h-3.5 text-slate-500" />
                              {acc.domain}
                            </span>
                          ) : (
                            <span className="text-slate-600 italic">None</span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-slate-300">{acc.industry}</td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className={clsx('text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border', getTierBadge(acc.tier))}>
                              {acc.tier}
                            </span>
                            <span className={clsx('text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border', getStatusBadge(acc.status))}>
                              {acc.status.replace('_', ' ')}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="text-xs font-mono font-bold text-emerald-400">
                            ${accTotalValue.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            {accDeals.length} {accDeals.length === 1 ? 'deal' : 'deals'}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedAccountFor360(acc);
                                setIsDrawerOpen(true);
                              }}
                              className="p-1.5 rounded-lg bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600 hover:text-white transition"
                              title="Account 360 View"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteAccount(acc.id)}
                              className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition"
                              title="Delete Account"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

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

      {/* Add Account Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="glass-panel p-6 rounded-2xl border border-slate-700 bg-slate-900 w-full max-w-lg shadow-2xl relative">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-400" /> Create Client Account
            </h3>

            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300">Account / Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Hyperion Logistics Corp"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full mt-1.5 px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Primary Domain</label>
                  <input
                    type="text"
                    placeholder="hyperionlogistics.io"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    className="w-full mt-1.5 px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Industry</label>
                  <input
                    type="text"
                    value={newIndustry}
                    onChange={(e) => setNewIndustry(e.target.value)}
                    className="w-full mt-1.5 px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Tier</label>
                  <select
                    value={newTier}
                    onChange={(e) => setNewTier(e.target.value as AccountTier)}
                    className="w-full mt-1.5 px-2.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="starter">Starter</option>
                    <option value="growth">Growth</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as AccountStatus)}
                    className="w-full mt-1.5 px-2.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="active_client">Active Client</option>
                    <option value="prospect">Prospect</option>
                    <option value="churn_risk">Churn Risk</option>
                    <option value="former_client">Former Client</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Currency</label>
                  <input
                    type="text"
                    value={newCurrency}
                    onChange={(e) => setNewCurrency(e.target.value)}
                    className="w-full mt-1.5 px-2.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isSubmitting ? 'Saving...' : 'Add Account'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountDirectory;
