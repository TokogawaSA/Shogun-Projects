import React from 'react';
import { Printer, FileCheck2, Landmark } from 'lucide-react';
import {
  BusinessDetails,
  ClientBillingDetails,
  LineItem,
  SaTaxMode,
} from '../../../types';
import {
  bankersRound2,
  formatSaQuoteCurrency,
} from '../services/billingService';

export interface DocumentPreviewCardProps {
  mode: 'quote' | 'invoice';
  documentNumber: string;
  title: string;
  status: string;
  currency: string;
  taxMode: SaTaxMode;
  issueDate?: string;
  dueDateOrValidUntil?: string;
  secondaryDateLabel?: string;
  secondaryDateValue?: string;
  referenceNumber?: string;
  sourceQuoteNumber?: string | null;
  scopeSummary?: string;
  businessDetails: BusinessDetails;
  clientDetails: ClientBillingDetails;
  lineItems: LineItem[];
  subtotalExclVat: number;
  discountTotal: number;
  vatAmount: number;
  totalInclVat: number;
  amountPaid?: number;
  paymentTerms?: string;
  termsAndConditions?: string;
  notes?: string;
}

export const DocumentPreviewCard: React.FC<DocumentPreviewCardProps> = ({
  mode,
  documentNumber,
  title,
  status,
  currency,
  taxMode,
  issueDate,
  dueDateOrValidUntil,
  secondaryDateLabel,
  secondaryDateValue,
  referenceNumber,
  sourceQuoteNumber,
  scopeSummary,
  businessDetails,
  clientDetails,
  lineItems,
  subtotalExclVat,
  discountTotal,
  vatAmount,
  totalInclVat,
  amountPaid = 0,
  paymentTerms,
  termsAndConditions,
  notes,
}) => {
  const balanceDue = Math.max(0, bankersRound2(totalInclVat - amountPaid));
  const isVatZero = taxMode === 'ZERO_RATED' || taxMode === 'EXEMPT';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <div className="text-xs text-slate-400 font-mono">
          Executive {mode === 'quote' ? 'Quotation' : 'SARS Tax Invoice'} Print Preview
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-md transition"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Save as PDF</span>
        </button>
      </div>

      <div className="bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 p-8 sm:p-10 space-y-8 print:shadow-none print:border-0 print:p-0">
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b border-slate-200 pb-6">
          <div className="space-y-1.5">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
              {businessDetails.companyName || 'Supplier Business Name'}
            </h2>
            {businessDetails.address && (
              <p className="text-xs text-slate-600 max-w-md">{businessDetails.address}</p>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-600 font-mono pt-1">
              {businessDetails.vatNumber && (
                <span>VAT #: {businessDetails.vatNumber}</span>
              )}
              {businessDetails.registrationNumber && (
                <span>Reg #: {businessDetails.registrationNumber}</span>
              )}
              {businessDetails.email && <span>{businessDetails.email}</span>}
              {businessDetails.phone && <span>{businessDetails.phone}</span>}
            </div>
          </div>

          <div className="sm:text-right space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-mono font-bold uppercase tracking-wider">
              {mode === 'quote' ? 'QUOTATION' : 'TAX INVOICE'}
            </div>
            <div className="text-xl font-black font-mono text-indigo-700">
              {documentNumber}
            </div>
            <div className="text-xs font-semibold text-slate-700">{title}</div>
            <div className="inline-block text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-100 border border-slate-300 text-slate-700 font-bold">
              Status: {status}
            </div>
          </div>
        </div>

        {/* Parties & Dates */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="text-[10px] font-mono uppercase font-bold text-slate-500">
              Bill To (Client Details)
            </div>
            <div className="text-sm font-bold text-slate-900">
              {clientDetails.clientName || 'Client Name Not Specified'}
            </div>
            {clientDetails.contactName && (
              <div className="text-xs text-slate-700">
                Attn: {clientDetails.contactName}
              </div>
            )}
            {clientDetails.billingAddress && (
              <div className="text-xs text-slate-600 whitespace-pre-line">
                {clientDetails.billingAddress}
              </div>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-600 font-mono pt-1">
              {clientDetails.email && <span>{clientDetails.email}</span>}
              {clientDetails.phone && <span>{clientDetails.phone}</span>}
              {clientDetails.vatNumber && <span>Client VAT #: {clientDetails.vatNumber}</span>}
              {clientDetails.registrationNumber && (
                <span>Reg #: {clientDetails.registrationNumber}</span>
              )}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-slate-500">Issue Date:</span>
              <span className="font-bold text-slate-900">{issueDate || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">
                {mode === 'quote' ? 'Valid Until:' : 'Due Date:'}
              </span>
              <span className="font-bold text-slate-900">
                {dueDateOrValidUntil || '—'}
              </span>
            </div>
            {secondaryDateLabel && secondaryDateValue && (
              <div className="flex justify-between">
                <span className="text-slate-500">{secondaryDateLabel}:</span>
                <span className="font-semibold text-slate-800">{secondaryDateValue}</span>
              </div>
            )}
            {referenceNumber && (
              <div className="flex justify-between">
                <span className="text-slate-500">
                  {mode === 'quote' ? 'Reference #:' : 'PO #:'}
                </span>
                <span className="font-semibold text-slate-800">{referenceNumber}</span>
              </div>
            )}
            {sourceQuoteNumber && (
              <div className="flex justify-between">
                <span className="text-slate-500">Source Quote:</span>
                <span className="font-semibold text-indigo-700">{sourceQuoteNumber}</span>
              </div>
            )}
            <div className="flex justify-between pt-1 border-t border-slate-200">
              <span className="text-slate-500">Currency / Tax:</span>
              <span className="font-bold text-slate-900">
                {currency} ({taxMode})
              </span>
            </div>
          </div>
        </div>

        {/* Scope Overview */}
        {scopeSummary && (
          <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-200/80">
            <div className="text-[10px] font-mono uppercase font-bold text-indigo-700 mb-1">
              Executive Scope Overview
            </div>
            <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-line">
              {scopeSummary}
            </p>
          </div>
        )}

        {/* Itemised Scope & Pricing */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-[10px] font-mono uppercase tracking-wider">
                <th className="py-3 px-3 w-10">#</th>
                <th className="py-3 px-3">Itemised Scope & Deliverable</th>
                <th className="py-3 px-3 text-center w-24">Qty / Unit</th>
                <th className="py-3 px-3 text-right w-28">Unit Price</th>
                <th className="py-3 px-3 text-right w-24">Discount</th>
                <th className="py-3 px-3 text-right w-24">VAT</th>
                <th className="py-3 px-3 text-right w-32">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {lineItems.map((item, idx) => (
                <tr key={item.id} className="align-top">
                  <td className="py-3 px-3 font-mono text-slate-500">{idx + 1}</td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900">{item.productName}</div>
                    {item.sku && (
                      <div className="text-[10px] font-mono text-slate-500">
                        SKU: {item.sku}
                      </div>
                    )}
                    {item.notes && (
                      <p className="text-[11px] text-slate-600 mt-1 whitespace-pre-line">
                        {item.notes}
                      </p>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-slate-800">
                    {item.quantity} {item.unitLabel || (item.type === 'service' ? 'hrs' : 'units')}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-800">
                    {formatSaQuoteCurrency(item.unitPrice, currency)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-600">
                    {item.discountAmount > 0
                      ? `-${formatSaQuoteCurrency(item.discountAmount, currency)}`
                      : '—'}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-600">
                    {isVatZero
                      ? '0%'
                      : formatSaQuoteCurrency(item.taxAmount || 0, currency)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                    {formatSaQuoteCurrency(item.totalPrice, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals & Banking Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Banking / Remittance */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <div className="text-[10px] font-mono uppercase font-bold text-slate-600 flex items-center gap-1.5">
              <Landmark className="w-3.5 h-3.5 text-emerald-600" />
              EFT / Banking Remittance Details
            </div>
            <div className="grid grid-cols-2 gap-y-1 text-[11px] font-mono">
              <span className="text-slate-500">Bank:</span>
              <span className="font-semibold text-slate-900">
                {businessDetails.bankName || '—'}
              </span>
              <span className="text-slate-500">Account Holder:</span>
              <span className="font-semibold text-slate-900">
                {businessDetails.accountHolder || businessDetails.companyName}
              </span>
              <span className="text-slate-500">Account Number:</span>
              <span className="font-semibold text-slate-900">
                {businessDetails.accountNumber || '—'}
              </span>
              <span className="text-slate-500">Branch / SWIFT:</span>
              <span className="font-semibold text-slate-900">
                {businessDetails.branchCode || '—'}
                {businessDetails.swiftCode ? ` / ${businessDetails.swiftCode}` : ''}
              </span>
            </div>
          </div>

          {/* Financial Totals */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs font-mono">
            {discountTotal > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Total Discounts:</span>
                <span>-{formatSaQuoteCurrency(discountTotal, currency)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-700">
              <span>Subtotal (Excl. VAT):</span>
              <span>{formatSaQuoteCurrency(subtotalExclVat, currency)}</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span>SARS VAT ({isVatZero ? '0%' : '15%'}):</span>
              <span>+{formatSaQuoteCurrency(vatAmount, currency)}</span>
            </div>
            <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-300">
              <span>Total (Incl. VAT):</span>
              <span>{formatSaQuoteCurrency(totalInclVat, currency)}</span>
            </div>
            {mode === 'invoice' && (
              <>
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Amount Paid:</span>
                  <span>-{formatSaQuoteCurrency(amountPaid, currency)}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-indigo-700 pt-2 border-t border-slate-300">
                  <span>Balance Due:</span>
                  <span>{formatSaQuoteCurrency(balanceDue, currency)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Terms & Acceptance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200 text-xs">
          <div className="space-y-2">
            <div className="text-[10px] font-mono uppercase font-bold text-slate-500">
              Payment Terms
            </div>
            <p className="text-slate-700 whitespace-pre-line">
              {paymentTerms || '—'}
            </p>
            {notes && (
              <>
                <div className="text-[10px] font-mono uppercase font-bold text-slate-500 pt-2">
                  Additional Notes
                </div>
                <p className="text-slate-700 whitespace-pre-line">{notes}</p>
              </>
            )}
          </div>

          <div className="space-y-2">
            <div className="text-[10px] font-mono uppercase font-bold text-slate-500">
              Terms & Conditions
            </div>
            <p className="text-[11px] text-slate-600 whitespace-pre-line leading-relaxed">
              {termsAndConditions || 'Standard commercial terms apply.'}
            </p>

            {mode === 'quote' && (
              <div className="pt-4 mt-4 border-t border-dashed border-slate-300 flex items-center justify-between text-[11px] text-slate-600">
                <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                  <FileCheck2 className="w-4 h-4 text-emerald-600" />
                  Client Acceptance Signature: ______________________
                </span>
                <span>Date: ____________</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentPreviewCard;
