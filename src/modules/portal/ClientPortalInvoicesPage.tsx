import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import {
  Receipt,
  CheckCircle2,
  Clock,
  AlertCircle,
  CreditCard,
  RefreshCw,
  Plus,
  Loader2,
} from 'lucide-react';
import clsx from 'clsx';
import { apiClient, TOKEN_STORAGE_KEY } from '../../services/api';
import { TaxInvoice } from '../../types';
import { formatSaQuoteCurrency } from '../catalog/lineItems/LineItemEditor';
import { InvoicePaymentModal } from './InvoicePaymentModal';

export const ClientPortalInvoicesPage: React.FC = () => {
  const { id: routeInvoiceId } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const returnMerchantTxId = searchParams.get('merchantTransactionId');

  const [invoices, setInvoices] = useState<TaxInvoice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [creatingDemo, setCreatingDemo] = useState<boolean>(false);
  const [selectedInvoice, setSelectedInvoice] = useState<TaxInvoice | null>(null);
  const [activeTxStatus, setActiveTxStatus] = useState<{
    merchantTransactionId: string;
    status: string;
    amount: number;
    invoiceNumber?: string;
  } | null>(null);

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<{ invoices: TaxInvoice[] }>('/v1/portal/invoices');
      const list = res?.invoices || [];
      setInvoices(list);

      if (routeInvoiceId) {
        const match = list.find((inv) => inv.id === routeInvoiceId);
        if (match && match.status !== 'PAID' && match.status !== 'VOID' && !returnMerchantTxId) {
          setSelectedInvoice(match);
        }
      }
    } catch {
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, [routeInvoiceId, returnMerchantTxId]);

  useEffect(() => {
    void loadInvoices();
  }, [loadInvoices]);

  // Poll shopperResultUrl return transaction confirmation
  useEffect(() => {
    if (!returnMerchantTxId) return;

    let cancelled = false;
    const checkReturnStatus = async () => {
      try {
        const res = await apiClient.get<any>(
          `/v1/portal/payments/${encodeURIComponent(returnMerchantTxId)}/status`
        );
        if (!cancelled && res) {
          setActiveTxStatus({
            merchantTransactionId: res.merchantTransactionId,
            status: res.status,
            amount: res.amount,
            invoiceNumber: res.taxInvoice?.invoiceNumber,
          });
          if (res.status === 'SUCCEEDED') {
            void loadInvoices();
          }
        }
      } catch {
        // Ignore unknown reference
      }
    };

    void checkReturnStatus();
    const timer = setInterval(() => void checkReturnStatus(), 5000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [returnMerchantTxId, loadInvoices]);

  // Subscribe to real-time Socket.io `invoice:paid` broadcasts
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) return;

    const socket = io('/', {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socket.on('invoice:paid', (eventPayload: any) => {
      setActiveTxStatus({
        merchantTransactionId: eventPayload.merchantTransactionId,
        status: 'SUCCEEDED',
        amount: eventPayload.amountSettled,
        invoiceNumber: eventPayload.invoiceNumber,
      });
      void loadInvoices();
    });

    return () => {
      socket.disconnect();
    };
  }, [loadInvoices]);

  const handleIssueSampleTaxInvoice = async () => {
    setCreatingDemo(true);
    try {
      await apiClient.post('/catalog/tax-invoices', {
        amount: 12500,
        taxMode: 'EXCLUSIVE',
        currency: 'ZAR',
        status: 'ISSUED',
      });
      await loadInvoices();
    } finally {
      setCreatingDemo(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
        <div>
          <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            External Client Portal • ZAR Billing
          </span>
          <h2 className="text-xl font-bold text-slate-100 mt-1.5 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-400" />
            SARS Tax Invoices & Online ZAR Settlement
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Settle project deposits and SARS 15% VAT tax invoices instantly via PayShap, Instant EFT, Capitec Pay, or 3DS2 Card.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => void loadInvoices()}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700"
          >
            <RefreshCw className={clsx('w-3.5 h-3.5', loading && 'animate-spin')} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={handleIssueSampleTaxInvoice}
            disabled={creatingDemo}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5"
          >
            {creatingDemo ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
            <span>Issue ZAR Tax Invoice</span>
          </button>
        </div>
      </div>

      {/* Real-Time Shopper Result / Socket.io Confirmation Banner */}
      {activeTxStatus && (
        <div
          className={clsx(
            'p-4 rounded-2xl border flex items-center justify-between gap-4',
            activeTxStatus.status === 'SUCCEEDED'
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
              : activeTxStatus.status === 'PENDING'
              ? 'bg-amber-950/60 border-amber-500/40 text-amber-200'
              : 'bg-rose-950/60 border-rose-500/40 text-rose-200'
          )}
        >
          <div className="flex items-center gap-3 text-xs">
            {activeTxStatus.status === 'SUCCEEDED' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : activeTxStatus.status === 'PENDING' ? (
              <Clock className="w-5 h-5 text-amber-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <div>
              <p className="font-bold">
                {activeTxStatus.status === 'SUCCEEDED'
                  ? `Payment Confirmed (${formatSaQuoteCurrency(activeTxStatus.amount, 'ZAR')})`
                  : activeTxStatus.status === 'PENDING'
                  ? 'Awaiting Bank / PayShap Settlement Confirmation...'
                  : 'Payment Declined or Cancelled'}
              </p>
              <p className="font-mono text-[11px] opacity-80">
                Ref: {activeTxStatus.merchantTransactionId}
                {activeTxStatus.invoiceNumber
                  ? ` • Invoice ${activeTxStatus.invoiceNumber}`
                  : ''}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TaxInvoice List */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-mono uppercase text-slate-400">
                <th className="py-3.5 px-4">Invoice #</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Excl. VAT</th>
                <th className="py-3.5 px-4 text-right">15% VAT</th>
                <th className="py-3.5 px-4 text-right">Total (Incl. VAT)</th>
                <th className="py-3.5 px-4 text-right">Paid</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading client portal tax invoices...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No SARS Tax Invoices issued yet. Click "Issue ZAR Tax Invoice" above to stage one.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => {
                  const isPayable = inv.status !== 'PAID' && inv.status !== 'VOID';
                  return (
                    <tr key={inv.id} className="hover:bg-slate-800/40">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-100">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={clsx(
                            'px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold border',
                            inv.status === 'PAID'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : inv.status === 'PARTIALLY_PAID'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                          )}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                        {formatSaQuoteCurrency(Number(inv.subtotalExclVat), inv.currency)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                        {formatSaQuoteCurrency(Number(inv.vatAmount), inv.currency)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-100">
                        {formatSaQuoteCurrency(Number(inv.totalInclVat), inv.currency)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-emerald-400">
                        {formatSaQuoteCurrency(Number(inv.amountPaid), inv.currency)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {isPayable ? (
                          <button
                            type="button"
                            onClick={() => setSelectedInvoice(inv)}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Pay Now (ZAR)</span>
                          </button>
                        ) : (
                          <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                            Settled
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedInvoice && (
        <InvoicePaymentModal
          isOpen={Boolean(selectedInvoice)}
          onClose={() => setSelectedInvoice(null)}
          invoice={selectedInvoice}
          onCheckoutCreated={(session) => {
            setActiveTxStatus({
              merchantTransactionId: session.merchantTransactionId,
              status: 'PENDING',
              amount:
                Number(selectedInvoice.totalInclVat) - Number(selectedInvoice.amountPaid),
              invoiceNumber: selectedInvoice.invoiceNumber,
            });
          }}
        />
      )}
    </div>
  );
};

export default ClientPortalInvoicesPage;
