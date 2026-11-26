/**
 * VTiger-Style Lead Conversion Modal Component
 * Supports both B2B (Organization Account + Contact + Opportunity) and
 * B2C (Individual Consumer Account + Consumer Contact + Optional Direct Deal)
 * via Express REST endpoint `POST /api/crm/leads/:id/convert`.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../../services/api';
import { CustomerSegment } from '../../../types/crmEntities';
import { useCurrency } from '../../../context/CurrencyContext';
import { getRecordSegment } from '../utils/customerSegment';
import {
  X,
  UserCheck,
  Building2,
  Users,
  User,
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
  const { currencySymbol } = useCurrency();

  const initialSegment: CustomerSegment = getRecordSegment(lead);
  const [segment, setSegment] = useState<CustomerSegment>(initialSegment);
  const isB2C = segment === 'B2C';

  const fullName = `${lead.firstName || ''} ${lead.lastName || ''}`.trim();

  // Account Form State
  const [accountName, setAccountName] = useState<string>(
    initialSegment === 'B2C'
      ? fullName || 'Consumer Account'
      : lead.company || `${fullName} (Individual)`.trim() || 'New Account'
  );
  const [industry, setIndustry] = useState<string>(
    initialSegment === 'B2C' ? 'Consumer' : lead.industry || 'Technology'
  );
  const [annualRevenue, setAnnualRevenue] = useState<number>(lead.annualRevenue || 0);

  // Contact Form State
  const [salutation, setSalutation] = useState<string>(lead.salutation || 'Mr.');
  const [firstName, setFirstName] = useState<string>(lead.firstName || '');
  const [lastName, setLastName] = useState<string>(lead.lastName || '');
  const [email, setEmail] = useState<string>(lead.email || '');
  const [phone, setPhone] = useState<string>(lead.phone || lead.mobile || '');
  const [jobTitle, setJobTitle] = useState<string>(lead.title || '');

  // Deal Form State
  const [createDeal, setCreateDeal] = useState<boolean>(true);
  const [dealName, setDealName] = useState<string>(
    initialSegment === 'B2C'
      ? `${fullName || 'Consumer'} - Direct Purchase`
      : `${lead.company || lead.lastName || 'Account'} - Initial Opportunity`
  );
  const [dealAmount, setDealAmount] = useState<number>(
    lead.customFields?.estimatedBudget
      ? Number(lead.customFields.estimatedBudget)
      : lead.annualRevenue
        ? Math.round(lead.annualRevenue * 0.1)
        : 25000
  );
  const [dealStage, setDealStage] = useState<string>('qualification');
  const [closingDate, setClosingDate] = useState<string>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSegmentSwitch = (nextSegment: CustomerSegment) => {
    setSegment(nextSegment);
    if (nextSegment === 'B2C') {
      setAccountName(fullName || 'Consumer Account');
      setIndustry('Consumer');
      setDealName(`${fullName || 'Consumer'} - Direct Purchase`);
    } else {
      setAccountName(
        lead.company && lead.company.toLowerCase() !== 'individual'
          ? lead.company
          : fullName || 'New Account'
      );
      setIndustry(lead.industry || 'Technology');
      setDealName(`${lead.company || lead.lastName || 'Account'} - Initial Opportunity`);
    }
  };

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead.id) return;

    setIsSubmitting(true);
    setError(null);

    const payload = {
      createAccount: true,
      accountName: accountName.trim(),
      industry: isB2C ? 'Consumer' : industry,
      annualRevenue: isB2C ? 0 : Number(annualRevenue) || 0,
      createContact: true,
      salutation,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      jobTitle: isB2C ? undefined : jobTitle.trim(),
      department: isB2C ? 'Consumer' : 'Management',
      createDeal,
      dealName: createDeal ? dealName.trim() : undefined,
      dealAmount: createDeal ? Number(dealAmount) || 0 : undefined,
      dealStage: createDeal ? dealStage : undefined,
      dealClosingDate: createDeal ? closingDate : undefined,
    };

    try {
      const response = await apiClient.post<any>(`/crm/leads/${lead.id}/convert`, payload);
      const { accountId, contactId, dealId } = response;

      // Sync B2B / B2C segment & consumer customFields onto the newly created records
      const sharedCustomFields: Record<string, any> = {
        ...(lead.customFields || {}),
        customerSegment: segment,
      };

      const syncTasks: Promise<any>[] = [];
      if (accountId) {
        syncTasks.push(
          apiClient
            .put(`/crm/accounts/${accountId}`, {
              accountType: isB2C ? 'individual' : 'customer',
              customFields: sharedCustomFields,
            })
            .catch(() => { })
        );
      }
      if (contactId) {
        syncTasks.push(
          apiClient
            .put(`/crm/contacts/${contactId}`, {
              customFields: sharedCustomFields,
            })
            .catch(() => { })
        );
      }
      if (dealId) {
        syncTasks.push(
          apiClient
            .put(`/crm/deals/${dealId}`, {
              dealType: isB2C ? 'b2c_direct' : 'new_business',
              customFields: { customerSegment: segment },
            })
            .catch(() => { })
        );
      }

      if (syncTasks.length > 0) {
        await Promise.all(syncTasks);
      }

      setIsSubmitting(false);
      if (onConversionSuccess) {
        onConversionSuccess({ accountId, contactId, dealId });
      }
      onClose();
      if (isB2C && contactId) {
        navigate(`/crm/contacts/${contactId}`);
      } else if (accountId) {
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
                {isB2C
                  ? 'Convert into a B2C Consumer Profile, Contact, and optional Direct Deal.'
                  : 'Transform this prospect into a B2B Account, Contact, and Opportunity in one transaction.'}
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

          {/* B2B / B2C Conversion Mode Switcher */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleSegmentSwitch('B2B')}
              className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all ${!isB2C
                  ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-200 shadow-lg shadow-indigo-500/10'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
            >
              <div className={`p-2 rounded-xl ${!isB2C ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800 text-slate-400'}`}>
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold">B2B Organization</div>
                <div className="text-[11px] opacity-75">Company account + stakeholder</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleSegmentSwitch('B2C')}
              className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all ${isB2C
                  ? 'bg-teal-600/20 border-teal-500/50 text-teal-200 shadow-lg shadow-teal-500/10'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
            >
              <div className={`p-2 rounded-xl ${isB2C ? 'bg-teal-500/20 text-teal-300' : 'bg-slate-800 text-slate-400'}`}>
                <User className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold">B2C Individual</div>
                <div className="text-[11px] opacity-75">Consumer profile + direct buyer</div>
              </div>
            </button>
          </div>

          {/* Section 1: Account Creation */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/90 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300">
              {isB2C ? <User className="w-4 h-4 text-teal-400" /> : <Building2 className="w-4 h-4" />}
              <span>{isB2C ? '1. Consumer Account (Individual Profile)' : '1. Account Organization'}</span>
            </div>
            <div className={`grid grid-cols-1 ${isB2C ? 'sm:grid-cols-1' : 'sm:grid-cols-3'} gap-3 text-xs`}>
              <div>
                <label className="text-slate-400 block mb-1">
                  {isB2C ? 'Consumer Profile Name *' : 'Account Name *'}
                </label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
              {!isB2C && (
                <>
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
                    <label className="text-slate-400 block mb-1">Annual Revenue ({currencySymbol})</label>
                    <input
                      type="number"
                      value={annualRevenue}
                      onChange={(e) => setAnnualRevenue(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Section 2: Contact Creation */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/90 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300">
              <Users className="w-4 h-4" />
              <span>{isB2C ? '2. Consumer Contact Details' : '2. Primary Contact Person'}</span>
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

            <div className={`grid grid-cols-1 ${isB2C ? 'sm:grid-cols-2' : 'sm:grid-cols-3'} gap-3 text-xs pt-1`}>
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
                <label className="text-slate-400 block mb-1">Phone / Mobile</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
                />
              </div>
              {!isB2C && (
                <div>
                  <label className="text-slate-400 block mb-1">Job Title</label>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Optional Opportunity Creation */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/90 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300">
                <Briefcase className="w-4 h-4" />
                <span>{isB2C ? '3. Direct Consumer Deal / Order (Optional)' : '3. Opportunity / Deal (Optional)'}</span>
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
                  <label className="text-slate-400 block mb-1">Amount ({currencySymbol}) *</label>
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
                  Converting {segment} Lead...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Complete {segment} Conversion
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
