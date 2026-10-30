import React, { useState, useEffect } from 'react';
import { X, UserPlus, Search, UserCheck, Loader2, AlertCircle, Mail, Phone } from 'lucide-react';
import { apiClient } from '../../../services/api';
import { SocialInteraction } from '../../../types/social';

interface LinkContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  interaction: SocialInteraction | null;
  onLinkContact: (payload: {
    contactId?: string;
    newContact?: { firstName: string; lastName: string; email: string; phone?: string; accountId?: string };
  }) => Promise<void>;
}

export const LinkContactModal: React.FC<LinkContactModalProps> = ({
  isOpen,
  onClose,
  interaction,
  onLinkContact,
}) => {
  const [mode, setMode] = useState<'search' | 'create'>('search');
  const [contacts, setContacts] = useState<any[]>([]);
  const [loadingContacts, setLoadingContacts] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedContactId, setSelectedContactId] = useState<string>('');

  // Create Mode state
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Load existing contacts
  useEffect(() => {
    if (isOpen) {
      setLoadingContacts(true);
      setErrorMsg('');
      apiClient
        .get<any>('/crm/contacts')
        .then((res) => {
          const list = Array.isArray(res) ? res : res?.data || [];
          setContacts(list);
        })
        .catch((err) => {
          console.warn('[LinkContactModal] Failed to load contacts:', err);
        })
        .finally(() => setLoadingContacts(false));
    }
  }, [isOpen]);

  // Pre-fill creation form with interaction data
  useEffect(() => {
    if (interaction) {
      const parts = (interaction.authorName || '').trim().split(' ');
      setFirstName(parts[0] || interaction.authorHandle.replace('@', ''));
      setLastName(parts.slice(1).join(' ') || 'Contact');
      setEmail(`${interaction.authorHandle.replace('@', '').toLowerCase()}@social.customer`);
    }
  }, [interaction]);

  if (!isOpen || !interaction) return null;

  const filteredContacts = contacts.filter((c) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const fullName = `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase();
    const emailStr = (c.email || '').toLowerCase();
    return fullName.includes(query) || emailStr.includes(query);
  });

  const handleLinkExisting = async () => {
    if (!selectedContactId) {
      setErrorMsg('Please select a contact from the list.');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await onLinkContact({ contactId: selectedContactId });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to link contact.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !email) {
      setErrorMsg('First name and email are required to create a contact.');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await onLinkContact({
        newContact: {
          firstName: firstName.trim(),
          lastName: lastName.trim() || 'User',
          email: email.trim(),
          phone: phone.trim() || undefined,
        },
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create and link contact.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Link CRM Contact</h2>
              <p className="text-xs text-slate-400">
                Associate @{interaction.authorHandle} with your customer database
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Toggle: Search Existing vs Create New */}
        <div className="px-6 pt-4 flex gap-2 border-b border-slate-800/80">
          <button
            type="button"
            onClick={() => {
              setMode('search');
              setErrorMsg('');
            }}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition ${
              mode === 'search'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Match Existing Contact
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('create');
              setErrorMsg('');
            }}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition ${
              mode === 'create'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Create New Contact
          </button>
        </div>

        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Mode 1: Search Existing Contacts */}
        {mode === 'search' ? (
          <div className="p-6 space-y-4 overflow-y-auto flex-1">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search CRM contacts by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {loadingContacts ? (
                <div className="flex items-center justify-center py-8 text-xs text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading CRM contacts...
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                  No matching contacts found. Switch to "Create New Contact" to register this author.
                </div>
              ) : (
                filteredContacts.map((c) => {
                  const isSelected = selectedContactId === c.id;
                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedContactId(c.id)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between ${
                        isSelected
                          ? 'bg-indigo-600/20 border-indigo-500/40 text-white shadow-sm'
                          : 'bg-slate-950/40 border-slate-800/80 text-slate-300 hover:bg-slate-800/40'
                      }`}
                    >
                      <div>
                        <p className="font-semibold text-slate-200">
                          {c.firstName} {c.lastName}
                        </p>
                        <p className="text-[11px] text-slate-400">{c.email || 'No email specified'}</p>
                      </div>
                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center">
                          <UserCheck className="w-3 h-3" />
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-mono">Select</span>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLinkExisting}
                disabled={isSubmitting || !selectedContactId}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
                Bind Contact
              </button>
            </div>
          </div>
        ) : (
          /* Mode 2: Quick Create New Contact */
          <form onSubmit={handleCreateNew} className="p-6 space-y-4 overflow-y-auto flex-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">First Name *</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Email Address *</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Phone (Optional)</label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400">
              This will create a new CRM Contact record pre-populated with social author metadata and bind it to this interaction.
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                Create & Link
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default LinkContactModal;
