import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Building2, 
  Plus, 
  Trash2, 
  Link as LinkIcon, 
  Check, 
  X, 
  Loader2, 
  Briefcase
} from 'lucide-react';
import clsx from 'clsx';
import { Contact, ContactLifecycleStage, Account } from '../../../types/crm';
import { useContacts } from '../hooks/useContacts';
import { useAccounts } from '../hooks/useAccounts';
import { Account360Drawer } from './Account360Drawer';
import { useDeals } from '../hooks/useDeals';

const lifecycleBadges: Record<ContactLifecycleStage, { label: string; style: string }> = {
  lead: { label: 'Lead', style: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  mql: { label: 'MQL', style: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
  sql: { label: 'SQL', style: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  customer: { label: 'Customer', style: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  advocate: { label: 'Advocate', style: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
};

export const ContactDirectory: React.FC = () => {
  const {
    contacts,
    loading,
    searchQuery,
    setSearchQuery,
    selectedLifecycle,
    setSelectedLifecycle,
    addContact,
    updateContact,
    deleteContact,
  } = useContacts();

  const { accounts } = useAccounts();
  const { deals } = useDeals();

  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);
  const [selectedAccountFor360, setSelectedAccountFor360] = useState<Account | null>(null);
  const [isAccountDrawerOpen, setIsAccountDrawerOpen] = useState(false);

  // Link to Project notification toast
  const [linkedNotice, setLinkedNotice] = useState<string | null>(null);

  // Form State
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newJobTitle, setNewJobTitle] = useState('Stakeholder');
  const [newAccountId, setNewAccountId] = useState('');
  const [newLifecycle, setNewLifecycle] = useState<ContactLifecycleStage>('lead');
  const [newIsPrimary, setNewIsPrimary] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFirstName.trim() || !newEmail.trim()) return;

    setIsSubmitting(true);
    await addContact({
      tenantId: 'tenant-default',
      accountId: newAccountId || accounts[0]?.id || 'acc-shogun-root',
      firstName: newFirstName.trim(),
      lastName: newLastName.trim(),
      email: newEmail.trim(),
      phone: newPhone.trim() || undefined,
      jobTitle: newJobTitle.trim() || undefined,
      isPrimaryContact: newIsPrimary,
      lifecycleStage: newLifecycle,
      lastContactedAt: new Date().toISOString(),
    });

    setIsSubmitting(false);
    setNewFirstName('');
    setNewLastName('');
    setNewEmail('');
    setNewPhone('');
    setIsAddContactModalOpen(false);
  };

  const handleLinkToProject = (contact: Contact) => {
    const acc = accounts.find((a) => a.id === contact.accountId);
    setLinkedNotice(
      `Linked ${contact.firstName} ${contact.lastName} as primary contact for ${acc?.name || 'client'} delivery workflows.`
    );
    setTimeout(() => setLinkedNotice(null), 4000);
  };

  const handleInspectAccount = (accountId: string) => {
    const acc = accounts.find((a) => a.id === accountId);
    if (acc) {
      setSelectedAccountFor360(acc);
      setIsAccountDrawerOpen(true);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {linkedNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{linkedNotice}</span>
          </div>
          <button onClick={() => setLinkedNotice(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search & Actions Bar */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-wrap items-center justify-between gap-4 shadow-md">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[280px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search contacts by name, email, job title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Lifecycle Filter Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {(['all', 'lead', 'mql', 'sql', 'customer', 'advocate'] as const).map((stage) => (
            <button
              key={stage}
              onClick={() => setSelectedLifecycle(stage)}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer font-mono',
                selectedLifecycle === stage
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              )}
            >
              {stage}
            </button>
          ))}
        </div>

        {/* Add Contact Button */}
        <button
          onClick={() => setIsAddContactModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Add Contact
        </button>
      </div>

      {/* Contacts Table */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto" />
          <p className="text-xs text-slate-400 font-mono">Syncing Client Contacts from Firestore...</p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-[11px] text-slate-400 uppercase font-mono border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Title / Role</th>
                  <th className="px-6 py-4">Client Account</th>
                  <th className="px-6 py-4">Lifecycle Stage</th>
                  <th className="px-6 py-4">Last Interaction</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {contacts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      No contacts found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  contacts.map((contact) => {
                    const acc = accounts.find((a) => a.id === contact.accountId);
                    const badge = (contact.lifecycleStage && lifecycleBadges[contact.lifecycleStage]) || lifecycleBadges.lead;

                    return (
                      <tr key={contact.id} className="hover:bg-slate-800/40 transition">
                        <td className="px-6 py-4 font-semibold text-white">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0">
                              {contact.firstName.charAt(0)}{contact.lastName.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span>{contact.firstName} {contact.lastName}</span>
                                {contact.isPrimaryContact && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase font-mono">
                                    Primary
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] font-mono text-slate-400 block mt-0.5">
                                {contact.email}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-slate-300">
                          <span className="flex items-center gap-1.5">
                            <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                            {contact.jobTitle || 'Executive'}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          {acc ? (
                            <button
                              type="button"
                              onClick={() => handleInspectAccount(acc.id)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-[11px] text-indigo-300 hover:text-white hover:bg-slate-700 transition cursor-pointer"
                            >
                              <Building2 className="w-3 h-3 text-indigo-400" />
                              <span className="font-semibold">{acc.name}</span>
                            </button>
                          ) : (
                            <span className="text-slate-500 text-[11px]">Direct Client</span>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <select
                            value={contact.lifecycleStage}
                            onChange={(e) =>
                              updateContact(contact.id, {
                                lifecycleStage: e.target.value as ContactLifecycleStage,
                              })
                            }
                            className={clsx(
                              'text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border focus:outline-none cursor-pointer',
                              badge.style
                            )}
                          >
                            <option value="lead" className="bg-slate-900 text-blue-300">Lead</option>
                            <option value="mql" className="bg-slate-900 text-indigo-300">MQL</option>
                            <option value="sql" className="bg-slate-900 text-purple-300">SQL</option>
                            <option value="customer" className="bg-slate-900 text-emerald-300">Customer</option>
                            <option value="advocate" className="bg-slate-900 text-amber-300">Advocate</option>
                          </select>
                        </td>

                        <td className="px-6 py-4 text-slate-400 font-mono text-[11px]">
                          {contact.lastContactedAt
                            ? new Date(contact.lastContactedAt).toLocaleDateString()
                            : 'Pending'}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleLinkToProject(contact)}
                              className="p-1.5 rounded-lg bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600 hover:text-white transition"
                              title="Link to Project Tasks"
                            >
                              <LinkIcon className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteContact(contact.id)}
                              className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition"
                              title="Delete Contact"
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

      {/* Account 360 Drawer */}
      <Account360Drawer
        account={selectedAccountFor360}
        contacts={contacts}
        deals={deals}
        isOpen={isAccountDrawerOpen}
        onClose={() => {
          setIsAccountDrawerOpen(false);
          setSelectedAccountFor360(null);
        }}
      />

      {/* Add Contact Modal */}
      {isAddContactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="glass-panel p-6 rounded-2xl border border-slate-700 bg-slate-900 w-full max-w-lg shadow-2xl relative">
            <button
              onClick={() => setIsAddContactModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" /> Add Stakeholder Contact
            </h3>

            <form onSubmit={handleCreateContact} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">First Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Marcus"
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    className="w-full mt-1.5 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Last Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Vance"
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    className="w-full mt-1.5 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="marcus@hyperionlogistics.io"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full mt-1.5 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Job Title / Role</label>
                  <input
                    type="text"
                    placeholder="VP of Engineering"
                    value={newJobTitle}
                    onChange={(e) => setNewJobTitle(e.target.value)}
                    className="w-full mt-1.5 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Phone</label>
                  <input
                    type="text"
                    placeholder="+1 (415) 890-2341"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full mt-1.5 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Client Account</label>
                  <select
                    value={newAccountId}
                    onChange={(e) => setNewAccountId(e.target.value)}
                    className="w-full mt-1.5 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300">Lifecycle Stage</label>
                  <select
                    value={newLifecycle}
                    onChange={(e) => setNewLifecycle(e.target.value as ContactLifecycleStage)}
                    className="w-full mt-1.5 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="lead">Lead</option>
                    <option value="mql">MQL</option>
                    <option value="sql">SQL</option>
                    <option value="customer">Customer</option>
                    <option value="advocate">Advocate</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="primaryContactCheck"
                  checked={newIsPrimary}
                  onChange={(e) => setNewIsPrimary(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="primaryContactCheck" className="text-xs text-slate-300 cursor-pointer">
                  Designate as Primary Account Contact
                </label>
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddContactModalOpen(false)}
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
                  <span>{isSubmitting ? 'Saving...' : 'Add Contact'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactDirectory;
