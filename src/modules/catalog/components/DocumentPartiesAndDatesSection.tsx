import React, { useState } from 'react';
import {
  Building2,
  Calendar,
  ChevronDown,
  ChevronUp,
  Save,
  UserCheck,
} from 'lucide-react';
import {
  BusinessDetails,
  ClientBillingDetails,
  PaymentTermsPreset,
  Project,
} from '../../../types';
import { Account, Contact, Deal } from '../../../types/crmEntities';
import {
  computeDueDateFromPreset,
  PAYMENT_TERMS_PRESETS,
} from '../services/billingService';

export interface DocumentPartiesAndDatesSectionProps {
  mode: 'quote' | 'invoice';
  readOnly?: boolean;
  issueDate: string;
  onIssueDateChange: (val: string) => void;
  // Quote-specific dates
  validUntil?: string;
  onValidUntilChange?: (val: string) => void;
  deliveryDate?: string;
  onDeliveryDateChange?: (val: string) => void;
  // Invoice-specific dates
  dueDate?: string;
  onDueDateChange?: (val: string) => void;
  supplyDate?: string;
  onSupplyDateChange?: (val: string) => void;
  paymentTermsPreset?: PaymentTermsPreset;
  onPaymentTermsPresetChange?: (preset: PaymentTermsPreset) => void;
  // Reference / linkage
  referenceNumber: string;
  onReferenceNumberChange: (val: string) => void;
  projectId?: string | null;
  onProjectIdChange?: (id: string | null) => void;
  dealId?: string | null;
  onDealIdChange?: (id: string | null) => void;
  // Parties
  businessDetails: BusinessDetails;
  onBusinessDetailsChange: (next: BusinessDetails) => void;
  onSaveBusinessDefault?: () => void;
  businessSavedNotice?: boolean;
  clientDetails: ClientBillingDetails;
  onClientDetailsChange: (next: ClientBillingDetails) => void;
  // CRM lookup lists
  accounts: Account[];
  contacts: Contact[];
  deals?: Deal[];
  projects?: Project[];
}

export const DocumentPartiesAndDatesSection: React.FC<
  DocumentPartiesAndDatesSectionProps
> = ({
  mode,
  readOnly = false,
  issueDate,
  onIssueDateChange,
  validUntil = '',
  onValidUntilChange,
  dueDate = '',
  onDueDateChange,
  paymentTermsPreset = 'net_30',
  onPaymentTermsPresetChange,
  referenceNumber,
  onReferenceNumberChange,
  businessDetails,
  onBusinessDetailsChange,
  onSaveBusinessDefault,
  businessSavedNotice = false,
  clientDetails,
  onClientDetailsChange,
  accounts,
  contacts,
}) => {
    const [showExtraBusiness, setShowExtraBusiness] = useState<boolean>(false);
    const [showExtraClient, setShowExtraClient] = useState<boolean>(false);

    const handleSelectAccount = (accountId: string) => {
      if (!accountId) {
        onClientDetailsChange({ ...clientDetails, accountId: null });
        return;
      }
      const acc = accounts.find((a) => a.id === accountId);
      if (!acc) return;

      const primaryContact =
        contacts.find((c) => c.accountId === acc.id && c.isPrimaryContact) ||
        contacts.find((c) => c.accountId === acc.id);

      const addressParts = [
        acc.billingStreet,
        acc.billingCity,
        acc.billingState,
        acc.billingPostalCode,
        acc.billingCountry,
      ].filter(Boolean);

      onClientDetailsChange({
        ...clientDetails,
        accountId: acc.id,
        contactId: primaryContact?.id || clientDetails.contactId || null,
        clientName: acc.accountName || clientDetails.clientName,
        contactName: primaryContact
          ? `${primaryContact.firstName} ${primaryContact.lastName}`.trim()
          : clientDetails.contactName,
        email: primaryContact?.email || acc.email || clientDetails.email,
        phone: primaryContact?.phone || acc.primaryPhone || clientDetails.phone,
        vatNumber: acc.vatRegistrationNumber || clientDetails.vatNumber,
        registrationNumber: acc.cipcRegistrationNumber || clientDetails.registrationNumber,
        billingAddress:
          addressParts.length > 0 ? addressParts.join(', ') : clientDetails.billingAddress,
      });
    };

    const updateBusiness = (field: keyof BusinessDetails, value: string) => {
      onBusinessDetailsChange({ ...businessDetails, [field]: value });
    };

    const updateClient = (field: keyof ClientBillingDetails, value: string) => {
      onClientDetailsChange({ ...clientDetails, [field]: value });
    };

    return (
      <div className="space-y-4">
        {/* Dates Row */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-500" />
                Issue Date
              </label>
              <input
                type="date"
                value={issueDate}
                disabled={readOnly}
                onChange={(e) => {
                  const nextIssue = e.target.value;
                  onIssueDateChange(nextIssue);
                  if (
                    mode === 'invoice' &&
                    onDueDateChange &&
                    paymentTermsPreset !== 'custom'
                  ) {
                    onDueDateChange(
                      computeDueDateFromPreset(nextIssue, paymentTermsPreset, dueDate)
                    );
                  }
                }}
                className="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs"
              />
            </div>

            {mode === 'quote' ? (
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Valid Until
                </label>
                <input
                  type="date"
                  value={validUntil}
                  disabled={readOnly}
                  onChange={(e) => onValidUntilChange?.(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs"
                />
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Payment Terms
                  </label>
                  <select
                    value={paymentTermsPreset}
                    disabled={readOnly}
                    onChange={(e) => {
                      const preset = e.target.value as PaymentTermsPreset;
                      onPaymentTermsPresetChange?.(preset);
                      if (preset !== 'custom' && onDueDateChange) {
                        onDueDateChange(
                          computeDueDateFromPreset(issueDate, preset, dueDate)
                        );
                      }
                    }}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs"
                  >
                    {PAYMENT_TERMS_PRESETS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    disabled={readOnly}
                    onChange={(e) => {
                      onDueDateChange?.(e.target.value);
                      onPaymentTermsPresetChange?.('custom');
                    }}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                {mode === 'quote' ? 'Reference # (Optional)' : 'PO # (Optional)'}
              </label>
              <input
                type="text"
                value={referenceNumber}
                disabled={readOnly}
                onChange={(e) => onReferenceNumberChange(e.target.value)}
                placeholder={mode === 'quote' ? 'Reference number' : 'Purchase order #'}
                className="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Business & Client Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Business Details (From) */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                From (Business Details)
              </span>
              {onSaveBusinessDefault && !readOnly && (
                <button
                  type="button"
                  onClick={onSaveBusinessDefault}
                  className="text-[11px] text-indigo-300 hover:text-indigo-200 flex items-center gap-1"
                >
                  <Save className="w-3 h-3" />
                  <span>{businessSavedNotice ? 'Saved' : 'Save Default'}</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <input
                type="text"
                value={businessDetails.companyName}
                disabled={readOnly}
                onChange={(e) => updateBusiness('companyName', e.target.value)}
                placeholder="Business / Company Name"
                className="sm:col-span-2 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs"
              />
              <input
                type="email"
                value={businessDetails.email || ''}
                disabled={readOnly}
                onChange={(e) => updateBusiness('email', e.target.value)}
                placeholder="Business Email"
                className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs"
              />
              <input
                type="text"
                value={businessDetails.phone || ''}
                disabled={readOnly}
                onChange={(e) => updateBusiness('phone', e.target.value)}
                placeholder="Phone Number"
                className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs"
              />
              <input
                type="text"
                value={businessDetails.address || ''}
                disabled={readOnly}
                onChange={(e) => updateBusiness('address', e.target.value)}
                placeholder="Business Address"
                className="sm:col-span-2 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowExtraBusiness((prev) => !prev)}
              className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 pt-1"
            >
              {showExtraBusiness ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
              <span>VAT, Registration & Bank Details</span>
            </button>

            {showExtraBusiness && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-800">
                <input
                  type="text"
                  value={businessDetails.vatNumber || ''}
                  disabled={readOnly}
                  onChange={(e) => updateBusiness('vatNumber', e.target.value)}
                  placeholder="VAT Number"
                  className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs"
                />
                <input
                  type="text"
                  value={businessDetails.registrationNumber || ''}
                  disabled={readOnly}
                  onChange={(e) => updateBusiness('registrationNumber', e.target.value)}
                  placeholder="Company Reg #"
                  className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs"
                />
                <input
                  type="text"
                  value={businessDetails.bankName || ''}
                  disabled={readOnly}
                  onChange={(e) => updateBusiness('bankName', e.target.value)}
                  placeholder="Bank Name"
                  className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs"
                />
                <input
                  type="text"
                  value={businessDetails.accountNumber || ''}
                  disabled={readOnly}
                  onChange={(e) => updateBusiness('accountNumber', e.target.value)}
                  placeholder="Account Number"
                  className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs"
                />
                <input
                  type="text"
                  value={businessDetails.accountHolder || ''}
                  disabled={readOnly}
                  onChange={(e) => updateBusiness('accountHolder', e.target.value)}
                  placeholder="Account Holder"
                  className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs"
                />
                <input
                  type="text"
                  value={businessDetails.branchCode || ''}
                  disabled={readOnly}
                  onChange={(e) => updateBusiness('branchCode', e.target.value)}
                  placeholder="Branch Code"
                  className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs"
                />
              </div>
            )}
          </div>

          {/* Client Details (Bill To) */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                Bill To (Client Details)
              </span>

              {!readOnly && accounts.length > 0 && (
                <select
                  value={clientDetails.accountId || ''}
                  onChange={(e) => handleSelectAccount(e.target.value)}
                  className="px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-[11px]"
                >
                  <option value="">Select CRM Client...</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.accountName}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <input
                type="text"
                value={clientDetails.clientName}
                disabled={readOnly}
                onChange={(e) => updateClient('clientName', e.target.value)}
                placeholder="Client / Company Name"
                className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs"
              />
              <input
                type="text"
                value={clientDetails.contactName || ''}
                disabled={readOnly}
                onChange={(e) => updateClient('contactName', e.target.value)}
                placeholder="Contact Person"
                className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs"
              />
              <input
                type="email"
                value={clientDetails.email || ''}
                disabled={readOnly}
                onChange={(e) => updateClient('email', e.target.value)}
                placeholder="Client Email"
                className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs"
              />
              <input
                type="text"
                value={clientDetails.phone || ''}
                disabled={readOnly}
                onChange={(e) => updateClient('phone', e.target.value)}
                placeholder="Client Phone"
                className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs"
              />
              <input
                type="text"
                value={clientDetails.billingAddress || ''}
                disabled={readOnly}
                onChange={(e) => updateClient('billingAddress', e.target.value)}
                placeholder="Client Billing Address"
                className="sm:col-span-2 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowExtraClient((prev) => !prev)}
              className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 pt-1"
            >
              {showExtraClient ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
              <span>Client VAT & Registration</span>
            </button>

            {showExtraClient && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-800">
                <input
                  type="text"
                  value={clientDetails.vatNumber || ''}
                  disabled={readOnly}
                  onChange={(e) => updateClient('vatNumber', e.target.value)}
                  placeholder="Client VAT Number"
                  className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs"
                />
                <input
                  type="text"
                  value={clientDetails.registrationNumber || ''}
                  disabled={readOnly}
                  onChange={(e) => updateClient('registrationNumber', e.target.value)}
                  placeholder="Client Reg #"
                  className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

export default DocumentPartiesAndDatesSection;
