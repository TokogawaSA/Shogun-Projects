import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileSpreadsheet,
  Receipt,
  Plus,
  CreditCard,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../../../context/AuthContext';
import {
  ClientBillingDetails,
  InvoicePaymentRecord,
  Quote,
  TaxInvoice,
} from '../../../types';
import { QuoteBuilder } from '../QuoteBuilder';
import { InvoiceSystemView } from '../invoices/InvoiceSystemView';
import { QuoteToInvoiceModal } from '../lineItems/QuoteToInvoiceModal';
import { RecordPaymentModal } from '../invoices/RecordPaymentModal';
import {
  bankersRound2,
  deleteInvoice,
  deleteQuote,
  formatSaQuoteCurrency,
  isInvoiceOverdue,
  listInvoices,
  listQuotes,
  recordInvoicePayment,
} from '../services/billingService';

export interface ContextualBillingPanelProps {
  accountId?: string;
  dealId?: string;
  projectId?: string;
  defaultClientDetails?: Partial<ClientBillingDetails>;
  title?: string;
  initialAction?: 'new_quote' | 'new_invoice' | null;
  onActionHandled?: () => void;
}

export const ContextualBillingPanel: React.FC<ContextualBillingPanelProps> = ({
  accountId,
  dealId,
  projectId,
  defaultClientDetails,
  title = 'Quotes & Invoices',
  initialAction = null,
  onActionHandled,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const tenantId = user?.tenantId || 'tenant-default';

  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [invoices, setInvoices] = useState<TaxInvoice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeCreator, setActiveCreator] = useState<'none' | 'quote' | 'invoice'>('none');
  const [quoteToConvert, setQuoteToConvert] = useState<Quote | null>(null);
  const [paymentTargetInvoice, setPaymentTargetInvoice] = useState<TaxInvoice | null>(null);

  useEffect(() => {
    if (initialAction === 'new_quote') {
      setActiveCreator('quote');
      onActionHandled?.();
    } else if (initialAction === 'new_invoice') {
      setActiveCreator('invoice');
      onActionHandled?.();
    }
  }, [initialAction, onActionHandled]);

  const loadBilling = useCallback(async () => {
    setLoading(true);
    try {
      const [allQuotes, allInvoices] = await Promise.all([
        listQuotes(tenantId),
        listInvoices(tenantId),
      ]);

      const matchingQuotes = allQuotes.filter((q) => {
        if (projectId && q.projectId === projectId) return true;
        if (dealId && q.dealId === dealId) return true;
        if (accountId && (q.accountId === accountId || q.clientDetails?.accountId === accountId)) {
          return true;
        }
        return false;
      });

      const matchingQuoteIds = new Set(matchingQuotes.map((q) => q.id));

      const matchingInvoices = allInvoices.filter((inv) => {
        if (projectId && inv.projectId === projectId) return true;
        if (inv.quoteId && matchingQuoteIds.has(inv.quoteId)) return true;
        if (
          accountId &&
          (inv.accountId === accountId || inv.clientDetails?.accountId === accountId)
        ) {
          return true;
        }
        return false;
      });

      setQuotes(matchingQuotes);
      setInvoices(matchingInvoices);
    } finally {
      setLoading(false);
    }
  }, [tenantId, accountId, dealId, projectId]);

  useEffect(() => {
    void loadBilling();
  }, [loadBilling]);

  const totals = useMemo(() => {
    const quoted = quotes.reduce(
      (sum, q) => bankersRound2(sum + Number(q.totalInclVat ?? q.grandTotal ?? 0)),
      0
    );
    const invoiced = invoices
      .filter((i) => i.status !== 'VOID')
      .reduce((sum, i) => bankersRound2(sum + Number(i.totalInclVat || 0)), 0);
    const outstanding = invoices
      .filter((i) => i.status !== 'VOID')
      .reduce(
        (sum, i) =>
          bankersRound2(
            sum + Math.max(0, Number(i.totalInclVat || 0) - Number(i.amountPaid || 0))
          ),
        0
      );
    return { quoted, invoiced, outstanding };
  }, [quotes, invoices]);

  const handleRecordPayment = async (
    payment: Omit<InvoicePaymentRecord, 'id' | 'recordedAt'>
  ) => {
    if (!paymentTargetInvoice) return;
    const updated = await recordInvoicePayment(paymentTargetInvoice.id, payment, tenantId);
    if (updated) {
      setInvoices((prev) =>
        prev.map((inv) => (inv.id === updated.id ? updated : inv))
      );
    }
  };

  if (activeCreator === 'quote') {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 animate-fadeIn">
        <QuoteBuilder
          defaultAccountId={accountId || null}
          defaultDealId={dealId || null}
          defaultProjectId={projectId || null}
          defaultClientDetails={defaultClientDetails}
          onCancel={() => setActiveCreator('none')}
          onSaveQuote={async () => {
            await loadBilling();
            setActiveCreator('none');
          }}
        />
      </div>
    );
  }

  if (activeCreator === 'invoice') {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 animate-fadeIn">
        <InvoiceSystemView
          embeddedMode="create"
          defaultAccountId={accountId || null}
          defaultProjectId={projectId || null}
          defaultClientDetails={defaultClientDetails}
          onEmbeddedCancel={() => setActiveCreator('none')}
          onEmbeddedSaved={() => {
            void loadBilling();
            setActiveCreator('none');
          }}
        />
      </div>
    );
  }

  return (
    <div className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-5 space-y-5 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
          <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-slate-400 mt-1">
            <span>
              Quoted:{' '}
              <strong className="text-slate-200">
                {formatSaQuoteCurrency(totals.quoted, 'ZAR')}
              </strong>
            </span>
            <span>
              Invoiced:{' '}
              <strong className="text-slate-200">
                {formatSaQuoteCurrency(totals.invoiced, 'ZAR')}
              </strong>
            </span>
            <span>
              Outstanding:{' '}
              <strong className="text-amber-300">
                {formatSaQuoteCurrency(totals.outstanding, 'ZAR')}
              </strong>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveCreator('quote')}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Quote</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCreator('invoice')}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Invoice</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-8 text-center text-xs text-slate-500">
          Loading quotes and invoices...
        </div>
      ) : (
        <div className="space-y-5">
          {/* Quotes List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-400" />
                Quotes ({quotes.length})
              </span>
            </div>

            {quotes.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/80 text-xs text-slate-500 text-center">
                No quotes linked yet. Click &quot;New Quote&quot; to create one.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] text-slate-400">
                    <tr>
                      <th className="py-2.5 px-3">Quote #</th>
                      <th className="py-2.5 px-3">Title</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {quotes.map((q) => (
                      <tr key={q.id} className="hover:bg-slate-800/30">
                        <td className="py-2.5 px-3 font-mono font-bold text-indigo-300">
                          <button
                            type="button"
                            onClick={() => navigate(`/catalog/quotes/${q.id}`)}
                            className="hover:underline"
                          >
                            {q.quoteNumber}
                          </button>
                        </td>
                        <td className="py-2.5 px-3 text-slate-200">{q.title}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-slate-800 text-slate-300 border border-slate-700">
                            {q.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-200">
                          {formatSaQuoteCurrency(
                            Number(q.totalInclVat ?? q.grandTotal ?? 0),
                            q.currency || 'ZAR'
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setQuoteToConvert(q)}
                              className="px-2 py-0.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold"
                            >
                              To Invoice
                            </button>
                            <button
                              type="button"
                              onClick={() => navigate(`/catalog/quotes/${q.id}`)}
                              className="text-slate-400 hover:text-indigo-300"
                              title="Open Quote"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                if (!window.confirm(`Delete Quote ${q.quoteNumber}?`)) return;
                                await deleteQuote(q.id, tenantId);
                                setQuotes((prev) => prev.filter((item) => item.id !== q.id));
                              }}
                              className="text-slate-500 hover:text-rose-400"
                              title="Delete Quote"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Invoices List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                Invoices ({invoices.length})
              </span>
            </div>

            {invoices.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/80 text-xs text-slate-500 text-center">
                No invoices linked yet. Click &quot;New Invoice&quot; or convert a quote above.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] text-slate-400">
                    <tr>
                      <th className="py-2.5 px-3">Invoice #</th>
                      <th className="py-2.5 px-3">Due Date</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                      <th className="py-2.5 px-3 text-right">Balance</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {invoices.map((inv) => {
                      const overdue = isInvoiceOverdue(inv);
                      const balance = Math.max(
                        0,
                        bankersRound2(
                          Number(inv.totalInclVat || 0) - Number(inv.amountPaid || 0)
                        )
                      );
                      const canPay =
                        inv.status !== 'PAID' && inv.status !== 'VOID' && balance > 0;

                      return (
                        <tr key={inv.id} className="hover:bg-slate-800/30">
                          <td className="py-2.5 px-3 font-mono font-bold text-emerald-300">
                            <button
                              type="button"
                              onClick={() => navigate(`/catalog/invoices/${inv.id}`)}
                              className="hover:underline"
                            >
                              {inv.invoiceNumber}
                            </button>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px]">
                            <span className={overdue ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                              {inv.dueDate?.slice(0, 10) || '—'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={clsx(
                                'px-2 py-0.5 rounded-full text-[10px] font-mono border',
                                inv.status === 'PAID'
                                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                  : overdue
                                    ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                                    : 'bg-slate-800 text-slate-300 border-slate-700'
                              )}
                            >
                              {overdue && inv.status !== 'PAID' ? 'OVERDUE' : inv.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-200">
                            {formatSaQuoteCurrency(Number(inv.totalInclVat || 0), inv.currency)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-300">
                            {formatSaQuoteCurrency(balance, inv.currency)}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {canPay && (
                                <button
                                  type="button"
                                  onClick={() => setPaymentTargetInvoice(inv)}
                                  className="px-2 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold flex items-center gap-1"
                                >
                                  <CreditCard className="w-3 h-3" />
                                  <span>Pay</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => navigate(`/catalog/invoices/${inv.id}`)}
                                className="text-slate-400 hover:text-indigo-300"
                                title="Open Invoice"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  if (!window.confirm(`Delete Invoice ${inv.invoiceNumber}?`)) return;
                                  await deleteInvoice(inv.id, tenantId);
                                  setInvoices((prev) => prev.filter((item) => item.id !== inv.id));
                                }}
                                className="text-slate-500 hover:text-rose-400"
                                title="Delete Invoice"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {quoteToConvert && (
        <QuoteToInvoiceModal
          isOpen={Boolean(quoteToConvert)}
          onClose={() => setQuoteToConvert(null)}
          quote={quoteToConvert}
          onConverted={() => {
            void loadBilling();
          }}
        />
      )}

      {paymentTargetInvoice && (
        <RecordPaymentModal
          isOpen={Boolean(paymentTargetInvoice)}
          onClose={() => setPaymentTargetInvoice(null)}
          invoice={paymentTargetInvoice}
          onSubmitPayment={handleRecordPayment}
        />
      )}
    </div>
  );
};

export default ContextualBillingPanel;
