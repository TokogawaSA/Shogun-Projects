import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Receipt,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Percent,
  Building2,
  UserCheck,
  Loader2,
} from 'lucide-react';
import {
  PaymentTermsPreset,
  Quote,
  TaxInvoice,
  TaxInvoiceStatus,
} from '../../../types';
import {
  bankersRound2,
  computeDueDateFromPreset,
  convertQuoteToInvoice,
  DEFAULT_INVOICE_PAYMENT_TERMS,
  DEFAULT_INVOICE_TERMS,
  formatSaQuoteCurrency,
  listInvoices,
  PAYMENT_TERMS_PRESETS,
  todayIsoDate,
} from '../services/billingService';

export interface QuoteToInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  quote: Quote;
  onConverted?: (invoice: TaxInvoice) => void;
}

export const QuoteToInvoiceModal: React.FC<QuoteToInvoiceModalProps> = ({
  isOpen,
  onClose,
  quote,
  onConverted,
}) => {
  const navigate = useNavigate();
  const [billingMode, setBillingMode] = useState<'full' | 'percentage'>('full');
  const [billingPercentage, setBillingPercentage] = useState<number>(50);
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [invoiceTitle, setInvoiceTitle] = useState<string>(quote.title || '');
  const [issueDate, setIssueDate] = useState<string>(todayIsoDate());
  const [paymentTermsPreset, setPaymentTermsPreset] =
    useState<PaymentTermsPreset>('net_30');
  const [dueDate, setDueDate] = useState<string>(() =>
    computeDueDateFromPreset(todayIsoDate(), 'net_30')
  );
  const [poNumber, setPoNumber] = useState<string>(quote.referenceNumber || '');
  const [initialStatus, setInitialStatus] = useState<TaxInvoiceStatus>('ISSUED');
  const [paymentTerms, setPaymentTerms] = useState<string>(
    quote.paymentTerms || DEFAULT_INVOICE_PAYMENT_TERMS
  );
  const [termsAndConditions, setTermsAndConditions] = useState<string>(
    quote.termsAndConditions || DEFAULT_INVOICE_TERMS
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const today = todayIsoDate();
    setIssueDate(today);
    setPaymentTermsPreset('net_30');
    setDueDate(computeDueDateFromPreset(today, 'net_30'));
    setInvoiceTitle(quote.title || `Invoice for ${quote.quoteNumber}`);
    setPoNumber(quote.referenceNumber || '');
    setPaymentTerms(quote.paymentTerms || DEFAULT_INVOICE_PAYMENT_TERMS);
    setTermsAndConditions(quote.termsAndConditions || DEFAULT_INVOICE_TERMS);
    setErrorMsg(null);

    listInvoices(quote.tenantId || 'tenant-default')
      .then((list) => {
        setInvoiceNumber(`INV-${String(list.length + 1).padStart(4, '0')}`);
      })
      .catch(() => {
        setInvoiceNumber(`INV-${Math.floor(1000 + Math.random() * 9000)}`);
      });
  }, [isOpen, quote]);

  const effectivePercent = billingMode === 'full' ? 100 : Math.min(100, Math.max(1, billingPercentage));
  const previewAmounts = useMemo(() => {
    const ratio = effectivePercent / 100;
    const excl = bankersRound2((quote.subtotalExclVat ?? quote.subtotal ?? 0) * ratio);
    const vat = bankersRound2((quote.vatAmount ?? quote.taxTotal ?? 0) * ratio);
    const total = bankersRound2((quote.totalInclVat ?? quote.grandTotal ?? 0) * ratio);
    return { excl, vat, total };
  }, [effectivePercent, quote]);

  if (!isOpen) return null;

  const currency = quote.currency || 'ZAR';

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quote.lineItems.length === 0) {
      setErrorMsg('Cannot convert an empty quote. Add at least one line item first.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const created = await convertQuoteToInvoice({
        quote,
        billingPercentage: effectivePercent,
        invoiceNumber: invoiceNumber.trim() || undefined,
        title:
          billingMode === 'percentage' && effectivePercent < 100
            ? `${invoiceTitle.trim() || quote.title} (${effectivePercent}% Deposit)`
            : invoiceTitle.trim() || quote.title,
        issueDate,
        dueDate,
        paymentTermsPreset,
        poNumber: poNumber.trim(),
        status: initialStatus,
        paymentTerms,
        termsAndConditions,
        notes: quote.notes,
      });

      onConverted?.(created);
      onClose();
      navigate(`/catalog/invoices/${created.id}`);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to convert quote into a Tax Invoice.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-500 flex items-center justify-center text-white shadow-md">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Convert Quote to Tax Invoice
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Source: {quote.quoteNumber} • {quote.lineItems.length} line item(s) • {currency}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-2 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleConvert} className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Billing Scope Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setBillingMode('full')}
              className={`p-3.5 rounded-xl border text-left transition flex items-start gap-3 ${
                billingMode === 'full'
                  ? 'bg-emerald-500/15 border-emerald-500 text-emerald-200'
                  : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" />
              <div>
                <div className="text-xs font-bold text-slate-100">Full Scope Invoice (100%)</div>
                <div className="text-[11px] text-slate-400">
                  Carry over 100% of quoted line items, scope & pricing
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setBillingMode('percentage')}
              className={`p-3.5 rounded-xl border text-left transition flex items-start gap-3 ${
                billingMode === 'percentage'
                  ? 'bg-indigo-500/15 border-indigo-500 text-indigo-200'
                  : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <Percent className="w-5 h-5 shrink-0 mt-0.5 text-indigo-400" />
              <div>
                <div className="text-xs font-bold text-slate-100">Deposit / Milestone Billing</div>
                <div className="text-[11px] text-slate-400">
                  Bill a percentage (e.g. 50% deposit) of all quoted items
                </div>
              </div>
            </button>
          </div>

          {billingMode === 'percentage' && (
            <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 flex items-center justify-between gap-4">
              <div>
                <label className="text-xs font-bold text-indigo-200 block">
                  Deposit / Milestone Percentage (%)
                </label>
                <span className="text-[11px] text-slate-400">
                  Scales unit prices and discounts proportionally across the invoice
                </span>
              </div>
              <div className="flex items-center gap-2">
                {[25, 50, 75].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setBillingPercentage(pct)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border ${
                      billingPercentage === pct
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={billingPercentage}
                  onChange={(e) => setBillingPercentage(Number(e.target.value) || 50)}
                  className="w-16 px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-xs font-mono text-center"
                />
              </div>
            </div>
          )}

          {/* Header & Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                Tax Invoice Number
              </label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                Initial Invoice Status
              </label>
              <select
                value={initialStatus}
                onChange={(e) => setInitialStatus(e.target.value as TaxInvoiceStatus)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs font-mono"
              >
                <option value="ISSUED">ISSUED (Ready for Client)</option>
                <option value="DRAFT">DRAFT (Internal Review)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                Invoice Title / Subject
              </label>
              <input
                type="text"
                value={invoiceTitle}
                onChange={(e) => setInvoiceTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Issue Date
              </label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => {
                  const nextIssue = e.target.value;
                  setIssueDate(nextIssue);
                  if (paymentTermsPreset !== 'custom') {
                    setDueDate(computeDueDateFromPreset(nextIssue, paymentTermsPreset, dueDate));
                  }
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                Payment Terms Preset
              </label>
              <select
                value={paymentTermsPreset}
                onChange={(e) => {
                  const preset = e.target.value as PaymentTermsPreset;
                  setPaymentTermsPreset(preset);
                  if (preset !== 'custom') {
                    setDueDate(computeDueDateFromPreset(issueDate, preset, dueDate));
                  }
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs font-mono"
              >
                {PAYMENT_TERMS_PRESETS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => {
                  setDueDate(e.target.value);
                  setPaymentTermsPreset('custom');
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                Client PO / Reference #
              </label>
              <input
                type="text"
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                placeholder="Optional client PO #"
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs font-mono"
              />
            </div>
          </div>

          {/* Parties & Financial Carry-Over Summary */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-start gap-2">
                <Building2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-[10px] font-mono uppercase text-slate-400">From</div>
                  <div className="font-semibold text-slate-200">
                    {quote.businessDetails?.companyName || 'Supplier Business Profile'}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <UserCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-[10px] font-mono uppercase text-slate-400">Bill To</div>
                  <div className="font-semibold text-slate-200">
                    {quote.clientDetails?.clientName || 'Client Not Specified'}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <span className="text-slate-400">
                Excl. VAT: <strong className="text-slate-200">{formatSaQuoteCurrency(previewAmounts.excl, currency)}</strong>
              </span>
              <span className="text-slate-400">
                VAT: <strong className="text-slate-200">{formatSaQuoteCurrency(previewAmounts.vat, currency)}</strong>
              </span>
              <span className="text-emerald-300 font-bold">
                Invoice Total ({effectivePercent}%): {formatSaQuoteCurrency(previewAmounts.total, currency)}
              </span>
            </div>
          </div>

          {/* Terms */}
          <div className="space-y-2">
            <label className="block text-[11px] font-mono uppercase text-slate-400">
              Invoice Payment Terms
            </label>
            <input
              type="text"
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleConvert}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 shadow-lg flex items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Receipt className="w-4 h-4" />
            )}
            <span>
              {isSubmitting ? 'Generating Tax Invoice...' : 'Generate Tax Invoice'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuoteToInvoiceModal;
