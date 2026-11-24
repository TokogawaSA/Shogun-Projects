import React, { useState } from 'react';
import {
  X,
  Zap,
  Building2,
  Smartphone,
  CreditCard,
  ShieldCheck,
  ExternalLink,
  Monitor,
  Loader2,
  AlertCircle,
  Lock,
} from 'lucide-react';
import clsx from 'clsx';
import { apiClient } from '../../services/api';
import { TaxInvoice } from '../../types';
import { formatSaQuoteCurrency } from '../catalog/lineItems/LineItemEditor';

export type SaPaymentRail = 'PAYSHAP' | 'PAYBYBANK' | 'CAPITECPAY' | 'CARD';

export interface InvoicePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: TaxInvoice;
  onCheckoutCreated?: (session: {
    checkoutUrl: string;
    checkoutId: string;
    merchantTransactionId: string;
  }) => void;
}

const SA_PAYMENT_RAILS: Array<{
  id: SaPaymentRail;
  name: string;
  subtitle: string;
  feeTag: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: 'PAYSHAP',
    name: 'PayShap Instant ZAR',
    subtitle: 'Real-time interbank settlement via ShapID or banking app',
    feeTag: 'Lowest Fee • Instant',
    icon: Zap,
  },
  {
    id: 'PAYBYBANK',
    name: 'Instant EFT / Pay by Bank',
    subtitle: 'Ozow / FNB, Standard Bank, ABSA, Nedbank & Investec',
    feeTag: 'Low EFT Fee • Zero Chargeback',
    icon: Building2,
  },
  {
    id: 'CAPITECPAY',
    name: 'Capitec Pay',
    subtitle: 'Biometric in-app approval with no card details required',
    feeTag: 'Direct API Rail',
    icon: Smartphone,
  },
  {
    id: 'CARD',
    name: 'ZAR Credit / Debit Card',
    subtitle: '3D Secure 2.0 Visa & Mastercard (supports recurring retainers)',
    feeTag: '3DS2 Protected',
    icon: CreditCard,
  },
];

export const InvoicePaymentModal: React.FC<InvoicePaymentModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onCheckoutCreated,
}) => {
  const remainingBalance = Math.max(
    0,
    Number((Number(invoice.totalInclVat) - Number(invoice.amountPaid)).toFixed(2))
  );

  const [selectedRail, setSelectedRail] = useState<SaPaymentRail>('PAYSHAP');
  const [checkoutMode, setCheckoutMode] = useState<'embedded' | 'redirect'>('embedded');
  const [payDepositOnly, setPayDepositOnly] = useState<boolean>(false);
  const [customDepositAmount, setCustomDepositAmount] = useState<number>(() =>
    Number((remainingBalance * 0.5).toFixed(2))
  );
  const [consentTokenizeCard, setConsentTokenizeCard] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [embeddedSession, setEmbeddedSession] = useState<{
    checkoutUrl: string;
    checkoutId: string;
    merchantTransactionId: string;
  } | null>(null);

  if (!isOpen) return null;

  const payableAmount = payDepositOnly
    ? Math.min(remainingBalance, Math.max(1, Number(customDepositAmount) || 0))
    : remainingBalance;

  const handleLaunchCheckout = async () => {
    setLoading(true);
    setError(null);

    try {
      const shopperResultUrl = `${window.location.origin}/portal/invoices/${invoice.id}`;

      const session = await apiClient.post<{
        checkoutUrl: string;
        checkoutId: string;
        merchantTransactionId: string;
      }>(`/v1/portal/invoices/${invoice.id}/checkout`, {
        defaultPaymentMethod: selectedRail,
        createRegistration: selectedRail === 'CARD' ? consentTokenizeCard : false,
        amount: payableAmount,
        shopperResultUrl,
      });

      onCheckoutCreated?.(session);

      if (checkoutMode === 'redirect') {
        window.location.assign(session.checkoutUrl);
      } else {
        setEmbeddedSession(session);
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          'Unable to initialize Peach Payments Checkout V2.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                Peach Payments Checkout V2
              </span>
              <span className="text-xs font-mono text-slate-400">
                {invoice.invoiceNumber}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-100 mt-1">
              Pay South African Tax Invoice (ZAR)
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        {embeddedSession ? (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-emerald-300 font-mono">
                <Lock className="w-3.5 h-3.5" />
                <span>Ref: {embeddedSession.merchantTransactionId}</span>
              </div>
              <a
                href={embeddedSession.checkoutUrl}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-300 hover:text-indigo-200 inline-flex items-center gap-1 font-semibold"
              >
                <span>Open Hosted Checkout in New Tab</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="rounded-xl overflow-hidden border border-slate-700 bg-slate-950 h-[440px]">
              <iframe
                title="Peach Payments Embedded Checkout V2"
                src={embeddedSession.checkoutUrl}
                className="w-full h-full border-0"
                allow="payment *"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setEmbeddedSession(null)}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                ← Change Payment Rail
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Close Window
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Balance & Deposit Selector */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-mono uppercase text-slate-400">
                  Outstanding ZAR Balance (Incl. 15% VAT)
                </p>
                <p className="text-2xl font-extrabold font-mono text-emerald-400 mt-0.5">
                  {formatSaQuoteCurrency(payableAmount, 'ZAR')}
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={payDepositOnly}
                    onChange={(e) => setPayDepositOnly(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-emerald-500"
                  />
                  <span>Pay Partial Project Deposit</span>
                </label>
                {payDepositOnly && (
                  <input
                    type="number"
                    min={1}
                    max={remainingBalance}
                    step="0.01"
                    value={customDepositAmount}
                    onChange={(e) => setCustomDepositAmount(Number(e.target.value))}
                    className="w-40 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs font-mono text-slate-100"
                  />
                )}
              </div>
            </div>

            {/* SA Payment Rail Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-200">
                Select Preferred South African Payment Rail
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SA_PAYMENT_RAILS.map((rail) => {
                  const Icon = rail.icon;
                  const active = selectedRail === rail.id;
                  return (
                    <button
                      key={rail.id}
                      type="button"
                      onClick={() => setSelectedRail(rail.id)}
                      className={clsx(
                        'p-3.5 rounded-xl border text-left transition-all flex items-start gap-3',
                        active
                          ? 'bg-emerald-950/40 border-emerald-500/60 shadow-md shadow-emerald-500/10'
                          : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                      )}
                    >
                      <div
                        className={clsx(
                          'p-2 rounded-lg border shrink-0',
                          active
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        )}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold text-slate-100">
                            {rail.name}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                          {rail.subtitle}
                        </p>
                        <span className="inline-block mt-1.5 text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-emerald-300 border border-slate-700">
                          {rail.feeTag}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Card Tokenization Opt-In (POPIA Consent) */}
            {selectedRail === 'CARD' && (
              <label className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentTokenizeCard}
                  onChange={(e) => setConsentTokenizeCard(e.target.checked)}
                  className="mt-0.5 rounded border-slate-600 bg-slate-800 text-indigo-500"
                />
                <span className="text-[11px] text-slate-300 leading-relaxed">
                  <strong className="text-slate-100">
                    Tokenize card for recurring monthly project retainers
                  </strong>{' '}
                  — I consent to Peach Payments storing an encrypted PCI-DSS Level 1 card token (no raw PAN stored on Shogun servers).
                </span>
              </label>
            )}

            {/* Launch Mode & Submit */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800">
              <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setCheckoutMode('embedded')}
                  className={clsx(
                    'px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1',
                    checkoutMode === 'embedded'
                      ? 'bg-slate-800 text-slate-100'
                      : 'text-slate-400 hover:text-slate-200'
                  )}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Embedded Checkout</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCheckoutMode('redirect')}
                  className={clsx(
                    'px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1',
                    checkoutMode === 'redirect'
                      ? 'bg-slate-800 text-slate-100'
                      : 'text-slate-400 hover:text-slate-200'
                  )}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Hosted Redirect</span>
                </button>
              </div>

              <button
                type="button"
                disabled={loading || payableAmount <= 0}
                onClick={handleLaunchCheckout}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ShieldCheck className="w-4 h-4" />
                )}
                <span>
                  Pay {formatSaQuoteCurrency(payableAmount, 'ZAR')} via {selectedRail}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoicePaymentModal;
