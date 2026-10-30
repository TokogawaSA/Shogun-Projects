import React, { useState, useEffect } from 'react';
import {
  Mail,
  Phone,
  Radio,
  MessageSquare,
  Loader2,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';
import { apiClient } from '../../../services/api';
import { SocialInteraction } from '../../../types/social';

interface ContactDetailViewProps {
  contactId: string;
  onBack?: () => void;
}

export const ContactDetailView: React.FC<ContactDetailViewProps> = ({
  contactId,
  onBack,
}) => {
  const [contact, setContact] = useState<any | null>(null);
  const [loadingContact, setLoadingContact] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'details' | 'social'>('social');
  const [socialInteractions, setSocialInteractions] = useState<SocialInteraction[]>([]);
  const [loadingSocial, setLoadingSocial] = useState<boolean>(false);

  useEffect(() => {
    if (!contactId) return;
    setLoadingContact(true);
    apiClient
      .get<any>(`/crm/contacts/${contactId}`)
      .then((data) => setContact(data))
      .catch((err) => console.warn('[ContactDetailView] Failed to load contact:', err))
      .finally(() => setLoadingContact(false));
  }, [contactId]);

  useEffect(() => {
    if (!contactId) return;
    setLoadingSocial(true);
    apiClient
      .get<any>('/v1/social/interactions', { params: { contactId } })
      .then((res) => {
        setSocialInteractions(res?.data || []);
      })
      .catch((err) => console.warn('[ContactDetailView] Failed to load social interactions:', err))
      .finally(() => setLoadingSocial(false));
  }, [contactId]);

  if (loadingContact) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2 text-indigo-500" />
        <span className="text-xs">Loading contact record...</span>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="p-8 text-center text-slate-400 text-xs">
        Contact not found.
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-6">
      {/* Header Profile */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition mr-1"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-base">
            {contact.firstName?.charAt(0)}
            {contact.lastName?.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">
                {contact.firstName} {contact.lastName}
              </h2>
              {contact.isPrimaryContact && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">
                  Primary Contact
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {contact.jobTitle || 'Stakeholder'} {contact.account?.accountName ? `at ${contact.account.accountName}` : ''}
            </p>
          </div>
        </div>

        {/* Quick Contact Info */}
        <div className="flex items-center gap-3 text-xs text-slate-400">
          {contact.email && (
            <span className="flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-slate-500" /> {contact.email}
            </span>
          )}
          {contact.phone && (
            <span className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-slate-500" /> {contact.phone}
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('details')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            activeTab === 'details'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          Contact Details
        </button>
        <button
          onClick={() => setActiveTab('social')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
            activeTab === 'social'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>Social Activity</span>
          {socialInteractions.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-900 text-indigo-200">
              {socialInteractions.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: Details */}
      {activeTab === 'details' && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-500">Contact Number</span>
            <p className="font-mono text-slate-200 font-semibold">{contact.contactNumber || contact.id}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-500">Department</span>
            <p className="text-slate-200 font-medium">{contact.department || 'Not specified'}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-500">Created At</span>
            <p className="font-mono text-slate-200">{new Date(contact.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      )}

      {/* Tab 2: Social Activity Tab */}
      {activeTab === 'social' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
              <Radio className="w-4 h-4 text-indigo-400" />
              <span>Social Activity & Mentions ({socialInteractions.length})</span>
            </h3>
          </div>

          {loadingSocial ? (
            <div className="flex items-center justify-center py-12 text-xs text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading linked social activity...
            </div>
          ) : socialInteractions.length === 0 ? (
            <div className="p-8 rounded-2xl border border-dashed border-slate-800 bg-slate-950/20 text-slate-500 text-xs text-center space-y-2">
              <MessageSquare className="w-6 h-6 mx-auto text-slate-600" />
              <p>No social interactions or mentions linked to this contact yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {socialInteractions.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">
                        {item.authorName} (@{item.authorHandle})
                      </span>
                      {item.isVerified && <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />}
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                        {item.platform}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${
                          item.sentiment === 'positive'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : item.sentiment === 'negative'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {item.sentiment}
                      </span>
                    </div>
                  </div>

                  <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">{item.content}</p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800/80">
                    <span className="capitalize">Intent: {item.intent.replace('_', ' ')}</span>
                    <span>
                      {new Date(item.publishedAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ContactDetailView;
