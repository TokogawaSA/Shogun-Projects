import React, { useEffect, useState } from 'react';
import { X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { InvoicePaymentRecord, TaxInvoice } from '../../../types';
import {
  bankersRound2,
  formatSaQuoteCurrency,
  todayIsoDate,
} from '../services/billingService';

export interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: TaxInvoice;
  onSubmitPayment: (
    payment: Omit<InvoicePaymentRecord, 'id' | 'recordedAt'>
  ) => Promise<void>;
}

const PAYMENT_METHODS = [
  { value: 'EFT', label: 'Bank Transfer (EFT)' },
  { value: 'CARD', label: 'Card' },
  { value: 'CASH', label: 'Cash' },
  { value: 'OTHER', label: 'Other' },
] as const;

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onSubmitPayment,
}) => {
  const balanceDue = Math.max(
    0,
    bankersRound2(Number(invoice.totalInclVat || 0) - Number(invoice.amountPaid || 0))
  );

  const [amount, setAmount] = useState<number>(balanceDue);
  const [paymentDate, setPaymentDate] = useState<string>(todayIsoDate());
  const [paymentMethod, setPaymentMethod] = useState<string>('EFT');
  const [reference, setReference] = useState<string>(invoice.invoiceNumber || '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setAmount(balanceDue);
    setPaymentDate(todayIsoDate());
    setPaymentMethod('EFT');
    setReference(invoice.invoiceNumber || '');
    setErrorMsg(null);
  }, [isOpen, balanceDue, invoice.invoiceNumber]);

  if (!isOpen) return null;

  const currency = invoice.currency || 'ZAR';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      setErrorMsg('Amount must be greater than zero.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onSubmitPayment({
        amount: bankersRound2(amount),
        paymentDate,
        paymentMethod,
        reference: reference.trim(),
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to record payment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-100">Record Payment</h3>
            <p className="text-[11px] font-mono text-slate-400">
              {invoice.invoiceNumber} • Balance:{' '}
              {formatSaQuoteCurrency(balanceDue, currency)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] text-slate-400">Amount ({currency})</label>
              <button
                type="button"
                onClick={() => setAmount(balanceDue)}
                className="text-[11px] text-emerald-400 hover:text-emerald-300"
              >
                Full Balance
              </button>
            </div>
            <input
              type="number"
              min="0.01"
              max={Math.max(balanceDue, 0.01)}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              required
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-sm font-mono font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Date</label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
                className="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">
              Reference (Optional)
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Payment reference"
              className="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || balanceDue <= 0}
              className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              <span>Save Payment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecordPaymentModal;
