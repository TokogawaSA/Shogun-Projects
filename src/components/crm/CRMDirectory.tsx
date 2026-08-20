import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Building2, 
  UserPlus, 
  Plus, 
  Search, 
  Mail, 
  Phone, 
  Globe, 
  Briefcase, 
  Trash2, 
  X, 
  Loader2
} from 'lucide-react';
import clsx from 'clsx';
import { LeadStatus } from '../../types';
import { useFirestoreCRM } from '../../hooks/useFirestoreCRM';

type DirectoryTab = 'contacts' | 'leads' | 'organizations';

export const CRMDirectory: React.FC = () => {
  const {
    contacts,
    leads,
    organizations,
    loading,
    addContact,
    deleteContact,
    addLead,
    updateLead,
    deleteLead,
    addOrganization,
    deleteOrganization,
  } = useFirestoreCRM();

  const [activeTab, setActiveTab] = useState<DirectoryTab>('contacts');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal open states
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  const [isAddOrgModalOpen, setIsAddOrgModalOpen] = useState(false);

  // Add Contact Form State
  const [newContactFirstName, setNewContactFirstName] = useState('');
  const [newContactLastName, setNewContactLastName] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactOrgId, setNewContactOrgId] = useState('');

  // Add Lead Form State
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadEmail, setNewLeadEmail] = useState('');
  const [newLeadCompany, setNewLeadCompany] = useState('');
  const [newLeadSource, setNewLeadSource] = useState('Website Inbound');
  const [newLeadStatus, setNewLeadStatus] = useState<LeadStatus>('new');

  // Add Organization Form State
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgDomain, setNewOrgDomain] = useState('');
  const [newOrgIndustry, setNewOrgIndustry] = useState('Enterprise Cloud Solutions');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtered lists
  const filteredContacts = useMemo(() => {
    return contacts.filter((c) =>
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.phone && c.phone.includes(searchQuery))
    );
  }, [contacts, searchQuery]);

  const filteredLeads = useMemo(() => {
    return leads.filter((l) =>
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.company && l.company.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [leads, searchQuery]);

  const filteredOrgs = useMemo(() => {
    return organizations.filter((o) =>
      o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.domain && o.domain.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (o.industry && o.industry.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [organizations, searchQuery]);

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactFirstName.trim() || !newContactEmail.trim()) return;

    setIsSubmitting(true);
    await addContact({
      firstName: newContactFirstName.trim(),
      lastName: newContactLastName.trim(),
      email: newContactEmail.trim(),
      phone: newContactPhone.trim() || undefined,
      organizationId: newContactOrgId || undefined,
    });

    setNewContactFirstName('');
    setNewContactLastName('');
    setNewContactEmail('');
    setNewContactPhone('');
    setIsAddContactModalOpen(false);
    setIsSubmitting(false);
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadName.trim() || !newLeadEmail.trim()) return;

    setIsSubmitting(true);
    await addLead({
      name: newLeadName.trim(),
      email: newLeadEmail.trim(),
      company: newLeadCompany.trim() || undefined,
      source: newLeadSource.trim() || undefined,
      status: newLeadStatus,
    });

    setNewLeadName('');
    setNewLeadEmail('');
    setNewLeadCompany('');
    setIsAddLeadModalOpen(false);
    setIsSubmitting(false);
  };

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;

    setIsSubmitting(true);
    await addOrganization({
      name: newOrgName.trim(),
      domain: newOrgDomain.trim() || undefined,
      industry: newOrgIndustry.trim() || undefined,
    });

    setNewOrgName('');
    setNewOrgDomain('');
    setIsAddOrgModalOpen(false);
    setIsSubmitting(false);
  };

  const getLeadStatusBadge = (status: LeadStatus) => {
    switch (status) {
      case 'new':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'contacted':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'qualified':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'unqualified':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Directory Tab Navigation & Action Bar */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-wrap items-center justify-between gap-4 shadow-md">
        {/* Navigation Tabs */}
        <div className="flex items-center bg-slate-950/70 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('contacts')}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer',
              activeTab === 'contacts'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            )}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Contacts ({contacts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('leads')}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer',
              activeTab === 'leads'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            )}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Leads ({leads.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('organizations')}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer',
              activeTab === 'organizations'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            )}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Organizations ({organizations.length})</span>
          </button>
        </div>

        {/* Search & Add Button */}
        <div className="flex items-center gap-3 flex-1 min-w-[280px] max-w-md justify-end">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {activeTab === 'contacts' && (
            <button
              onClick={() => setIsAddContactModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 flex-shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Contact
            </button>
          )}

          {activeTab === 'leads' && (
            <button
              onClick={() => setIsAddLeadModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 flex-shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Lead
            </button>
          )}

          {activeTab === 'organizations' && (
            <button
              onClick={() => setIsAddOrgModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 flex-shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Organization
            </button>
          )}
        </div>
      </div>

      {/* Main Table / Directory View */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto" />
          <p className="text-xs text-slate-400 font-mono">Syncing CRM Directory records from Firestore...</p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
          {/* TAB 1: CONTACTS */}
          {activeTab === 'contacts' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/60 text-[11px] text-slate-400 uppercase font-mono border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Phone</th>
                    <th className="px-6 py-4">Organization</th>
                    <th className="px-6 py-4">Created Date</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredContacts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                        No contacts found. Click "Add Contact" to create your first client entry.
                      </td>
                    </tr>
                  ) : (
                    filteredContacts.map((contact) => {
                      const org = organizations.find((o) => o.id === contact.organizationId);

                      return (
                        <tr key={contact.id} className="hover:bg-slate-800/40 transition">
                          <td className="px-6 py-4 font-semibold text-white flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                              {contact.firstName.charAt(0)}{contact.lastName.charAt(0)}
                            </div>
                            <span>{contact.firstName} {contact.lastName}</span>
                          </td>
                          <td className="px-6 py-4 font-mono text-slate-300">
                            <span className="flex items-center gap-1.5">
                              <Mail className="w-3.5 h-3.5 text-slate-500" />
                              {contact.email}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-400 font-mono">
                            {contact.phone ? (
                              <span className="flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-slate-500" />
                                {contact.phone}
                              </span>
                            ) : (
                              <span className="text-slate-600 italic">None</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {org ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-[11px] text-slate-200">
                                <Building2 className="w-3 h-3 text-indigo-400" />
                                {org.name}
                              </span>
                            ) : (
                              <span className="text-slate-500 text-[11px]">Direct Client</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-slate-500 text-[11px]">
                            {new Date(contact.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => deleteContact(contact.id)}
                              className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition"
                              title="Delete contact"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 2: LEADS */}
          {activeTab === 'leads' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/60 text-[11px] text-slate-400 uppercase font-mono border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4">Lead Name</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Company</th>
                    <th className="px-6 py-4">Source</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredLeads.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                        No leads registered. Click "Add Lead" to log incoming client opportunities.
                      </td>
                    </tr>
                  ) : (
                    filteredLeads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-slate-800/40 transition">
                        <td className="px-6 py-4 font-semibold text-white">
                          {lead.name}
                        </td>
                        <td className="px-6 py-4 font-mono text-slate-300">
                          <span className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-slate-500" />
                            {lead.email}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-300">
                          {lead.company || <span className="text-slate-600 italic">Unspecified</span>}
                        </td>
                        <td className="px-6 py-4 text-slate-400 text-[11px]">
                          {lead.source || 'Direct'}
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={lead.status}
                            onChange={(e) => updateLead(lead.id, { status: e.target.value as LeadStatus })}
                            className={clsx(
                              'text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-md border focus:outline-none cursor-pointer',
                              getLeadStatusBadge(lead.status)
                            )}
                          >
                            <option value="new" className="bg-slate-900 text-blue-300">New</option>
                            <option value="contacted" className="bg-slate-900 text-amber-300">Contacted</option>
                            <option value="qualified" className="bg-slate-900 text-emerald-300">Qualified</option>
                            <option value="unqualified" className="bg-slate-900 text-rose-300">Unqualified</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => deleteLead(lead.id)}
                            className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition"
                            title="Delete lead"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: ORGANIZATIONS */}
          {activeTab === 'organizations' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/60 text-[11px] text-slate-400 uppercase font-mono border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4">Organization Name</th>
                    <th className="px-6 py-4">Domain</th>
                    <th className="px-6 py-4">Industry Sector</th>
                    <th className="px-6 py-4">Contacts Count</th>
                    <th className="px-6 py-4">Registered Date</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredOrgs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                        No organizations found. Click "Add Organization" to add client entities.
                      </td>
                    </tr>
                  ) : (
                    filteredOrgs.map((org) => {
                      const orgContactsCount = contacts.filter((c) => c.organizationId === org.id).length;

                      return (
                        <tr key={org.id} className="hover:bg-slate-800/40 transition">
                          <td className="px-6 py-4 font-bold text-white flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
                              <Building2 className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="leading-snug">{org.name}</p>
                              <p className="text-[10px] text-slate-500 font-mono">{org.id}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-300 font-mono">
                            {org.domain ? (
                              <span className="flex items-center gap-1 text-indigo-300">
                                <Globe className="w-3.5 h-3.5 text-slate-500" />
                                {org.domain}
                              </span>
                            ) : (
                              <span className="text-slate-600 italic">None</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-slate-300">
                            <span className="flex items-center gap-1.5">
                              <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                              {org.industry || 'General Industry'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[11px] font-mono">
                              {orgContactsCount} {orgContactsCount === 1 ? 'Contact' : 'Contacts'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-500 text-[11px]">
                            {new Date(org.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => deleteOrganization(org.id)}
                              className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition"
                              title="Delete organization"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

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
              <Users className="w-5 h-5 text-indigo-400" /> Add New Client Contact
            </h3>

            <form onSubmit={handleCreateContact} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">First Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Marcus"
                    value={newContactFirstName}
                    onChange={(e) => setNewContactFirstName(e.target.value)}
                    className="w-full mt-1.5 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Last Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Vance"
                    value={newContactLastName}
                    onChange={(e) => setNewContactLastName(e.target.value)}
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
                  value={newContactEmail}
                  onChange={(e) => setNewContactEmail(e.target.value)}
                  className="w-full mt-1.5 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+1 (415) 890-2341"
                    value={newContactPhone}
                    onChange={(e) => setNewContactPhone(e.target.value)}
                    className="w-full mt-1.5 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300">Organization</label>
                  <select
                    value={newContactOrgId}
                    onChange={(e) => setNewContactOrgId(e.target.value)}
                    className="w-full mt-1.5 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Direct Client (None)</option>
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                </div>
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

      {/* Add Lead Modal */}
      {isAddLeadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="glass-panel p-6 rounded-2xl border border-slate-700 bg-slate-900 w-full max-w-lg shadow-2xl relative">
            <button
              onClick={() => setIsAddLeadModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-indigo-400" /> Log Inbound Lead
            </h3>

            <form onSubmit={handleCreateLead} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300">Lead Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Aria Sterling"
                  value={newLeadName}
                  onChange={(e) => setNewLeadName(e.target.value)}
                  className="w-full mt-1.5 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="aria.sterling@apex.com"
                    value={newLeadEmail}
                    onChange={(e) => setNewLeadEmail(e.target.value)}
                    className="w-full mt-1.5 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Company Name</label>
                  <input
                    type="text"
                    placeholder="Apex Global Enterprises"
                    value={newLeadCompany}
                    onChange={(e) => setNewLeadCompany(e.target.value)}
                    className="w-full mt-1.5 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Lead Source</label>
                  <input
                    type="text"
                    placeholder="Website Inbound / Referral"
                    value={newLeadSource}
                    onChange={(e) => setNewLeadSource(e.target.value)}
                    className="w-full mt-1.5 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Lead Status</label>
                  <select
                    value={newLeadStatus}
                    onChange={(e) => setNewLeadStatus(e.target.value as LeadStatus)}
                    className="w-full mt-1.5 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="unqualified">Unqualified</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddLeadModalOpen(false)}
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
                  <span>{isSubmitting ? 'Saving...' : 'Add Lead'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Organization Modal */}
      {isAddOrgModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="glass-panel p-6 rounded-2xl border border-slate-700 bg-slate-900 w-full max-w-lg shadow-2xl relative">
            <button
              onClick={() => setIsAddOrgModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-400" /> Register Organization
            </h3>

            <form onSubmit={handleCreateOrganization} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300">Organization Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Hyperion Logistics Corp"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  className="w-full mt-1.5 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Primary Domain</label>
                  <input
                    type="text"
                    placeholder="hyperionlogistics.io"
                    value={newOrgDomain}
                    onChange={(e) => setNewOrgDomain(e.target.value)}
                    className="w-full mt-1.5 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Industry / Vertical</label>
                  <input
                    type="text"
                    placeholder="Supply Chain & IoT"
                    value={newOrgIndustry}
                    onChange={(e) => setNewOrgIndustry(e.target.value)}
                    className="w-full mt-1.5 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddOrgModalOpen(false)}
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
                  <span>{isSubmitting ? 'Saving...' : 'Add Organization'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CRMDirectory;
