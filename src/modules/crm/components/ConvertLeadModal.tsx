/**
 * VTiger-Style Lead Conversion Modal Component
 * Converts an existing Lead into Account, Contact, and optional Deal via
 * Express REST endpoint `POST /api/crm/leads/:id/convert`.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../../services/api';
import {
  X,
  UserCheck,
  Building2,
  Users,
  Briefcase,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export interface ConvertLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Record<string, any>;
  onConversionSuccess?: (result: { accountId: string; contactId: string; dealId?: string }) => void;
}

export const ConvertLeadModal: React.FC<ConvertLeadModalProps> = ({
  isOpen,
  onClose,
  lead,
  onConversionSuccess,
}) => {
  const navigate = useNavigate();

  // Account Form State
  const [accountName, setAccountName] = useState<string>(
    lead.company || `${lead.firstName || ''} ${lead.lastName || ''} (Individual)`.trim() || 'New Account'
  );
  const [industry, setIndustry] = useState<string>(lead.industry || 'Technology');
  const [annualRevenue, setAnnualRevenue] = useState<number>(lead.annualRevenue || 0);

  // Contact Form State
  const [salutation, setSalutation] = useState<string>(lead.salutation || 'Mr.');
  const [firstName, setFirstName] = useState<string>(lead.firstName || '');
  const [lastName, setLastName] = useState<string>(lead.lastName || '');
  const [email, setEmail] = useState<string>(lead.email || '');
  const [phone, setPhone] = useState<string>(lead.phone || '');
  const [jobTitle, setJobTitle] = useState<string>(lead.title || '');

  // Deal Form State
  const [createDeal, setCreateDeal] = useState<boolean>(true);
  const [dealName, setDealName] = useState<string>(
    `${lead.company || lead.lastName || 'Account'} - Initial Opportunity`
  );
  const [dealAmount, setDealAmount] = useState<number>(
    lead.annualRevenue ? Math.round(lead.annualRevenue * 0.1) : 25000
  );
  const [dealStage, setDealStage] = useState<string>('qualification');
  const [closingDate, setClosingDate] = useState<string>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead.id) return;

    setIsSubmitting(true);
    setError(null);

    const payload = {
      createAccount: true,
      accountName: accountName.trim(),
      industry,
      annualRevenue: Number(annualRevenue) || 0,
      createContact: true,
      salutation,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      jobTitle: jobTitle.trim(),
      createDeal,
      dealName: createDeal ? dealName.trim() : undefined,
      dealAmount: createDeal ? Number(dealAmount) || 0 : undefined,
      dealStage: createDeal ? dealStage : undefined,
      dealClosingDate: createDeal ? closingDate : undefined,
    };

    try {
      const response = await apiClient.post<any>(`/crm/leads/${lead.id}/convert`, payload);
      const { accountId, contactId, dealId } = response;

      setIsSubmitting(false);
      if (onConversionSuccess) {
        onConversionSuccess({ accountId, contactId, dealId });
      }
      onClose();
      if (accountId) {
        navigate(`/crm/accounts/${accountId}`);
      }
    } catch (err: any) {
      console.error('[ConvertLeadModal Error]:', err);
      setIsSubmitting(false);
      setError(err?.response?.data?.error || err.message || 'Conversion failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-emerald-600/20 to-teal-600/20 border border-emerald-500/30 text-emerald-400">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Convert Lead: {lead.firstName} {lead.lastName}
                <Sparkles className="w-4 h-4 text-emerald-400" />
              </h2>
              <p className="text-xs text-slate-400">
                Transform this prospect into an Account, Contact, and Opportunity in one relational transaction.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleConvert} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Account Creation */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/90 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300">
              <Building2 className="w-4 h-4" />
              <span>1. Account Organization</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Account Name *</label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Industry</label>
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Annual Revenue ($)</label>
                <input
                  type="number"
                  value={annualRevenue}
                  onChange={(e) => setAnnualRevenue(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Contact Creation */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/90 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300">
              <Users className="w-4 h-4" />
              <span>2. Primary Contact Person</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Salutation</label>
                <select
                  value={salutation}
                  onChange={(e) => setSalutation(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
                >
                  <option value="Mr.">Mr.</option>
                  <option value="Ms.">Ms.</option>
                  <option value="Mrs.">Mrs.</option>
                  <option value="Dr.">Dr.</option>
                  <option value="Prof.">Prof.</option>
                </select>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">First Name *</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Last Name *</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
              <div>
                <label className="text-slate-400 block mb-1">Email *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Job Title</label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Optional Opportunity Creation */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/90 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300">
                <Briefcase className="w-4 h-4" />
                <span>3. Opportunity / Deal (Optional)</span>
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={createDeal}
                  onChange={(e) => setCreateDeal(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                Create Opportunity
              </label>
            </div>

            {createDeal && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                <div>
                  <label className="text-slate-400 block mb-1">Deal Name *</label>
                  <input
                    type="text"
                    value={dealName}
                    onChange={(e) => setDealName(e.target.value)}
                    required={createDeal}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Amount ($) *</label>
                  <input
                    type="number"
                    value={dealAmount}
                    onChange={(e) => setDealAmount(Number(e.target.value))}
                    required={createDeal}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Sales Stage</label>
                  <select
                    value={dealStage}
                    onChange={(e) => setDealStage(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 capitalize"
                  >
                    <option value="prospecting">Prospecting</option>
                    <option value="qualification">Qualification</option>
                    <option value="needs_analysis">Needs Analysis</option>
                    <option value="value_proposition">Value Proposition</option>
                    <option value="proposal_price_quote">Proposal / Price Quote</option>
                    <option value="negotiation_review">Negotiation / Review</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Expected Close Date</label>
                  <input
                    type="date"
                    value={closingDate}
                    onChange={(e) => setClosingDate(e.target.value)}
                    required={createDeal}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Converting Lead...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Complete Conversion
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConvertLeadModal;
