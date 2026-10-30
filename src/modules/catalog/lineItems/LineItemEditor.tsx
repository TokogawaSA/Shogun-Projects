/**
 * Line Item Editor & Interactive Quote Builder Component
 * Multi-Tenant Antigravity 2.0 Ecosystem
 */

import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Package, 
  CheckCircle2, 
  Sparkles, 
  FileText, 
  BookOpen, 
  Save, 
  TrendingUp,
  Calendar
} from 'lucide-react';
import { useCatalog } from '../hooks/useCatalog';
import { LineItem, Quote, QuoteStatus } from '../../../types';
import { QuoteToProjectModal } from './QuoteToProjectModal';
import { useCurrency } from '../../../context/CurrencyContext';

interface LineItemEditorProps {
  initialQuote?: Quote | null;
  attachedEntityType?: 'quote' | 'deal' | 'invoice' | 'project';
  attachedEntityId?: string;
  onSaveQuote?: (quote: Quote) => Promise<void>;
  readOnly?: boolean;
}

export const LineItemEditor: React.FC<LineItemEditorProps> = ({
  initialQuote,
  attachedEntityType = 'quote',
  attachedEntityId,
  onSaveQuote,
  readOnly = false,
}) => {
  const { currencyCode, currencySymbol, formatCurrency } = useCurrency();
  const activeCurrency = initialQuote?.currency || currencyCode;
  const { items: catalogItems, priceBooks } = useCatalog();

  const [quoteNumber] = useState<string>(
    initialQuote?.quoteNumber || `QT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [title, setTitle] = useState<string>(initialQuote?.title || 'Enterprise Solution Proposal');
  const [status, setStatus] = useState<QuoteStatus>(initialQuote?.status || 'draft');
  const [selectedPriceBookId, setSelectedPriceBookId] = useState<string>(
    initialQuote?.priceBookId || priceBooks.find((pb) => pb.isDefault)?.id || 'pb-standard'
  );
  const [validUntil, setValidUntil] = useState<string>(
    initialQuote?.validUntil || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState<string>(
    initialQuote?.notes || 'Payment terms: Net 30 days upon deliverable acceptance.'
  );

  const [lineItems, setLineItems] = useState<LineItem[]>(
    initialQuote?.lineItems || [
      {
        id: 'li-1',
        productId: 'prod-blade-101',
        productName: 'Enterprise Edge Blade Server 1U',
        type: 'product',
        quantity: 2,
        unitPrice: 3200,
        costPrice: 1950,
        discountAmount: 200,
        taxAmount: 620,
        taxRatePercent: 10,
        totalPrice: 6820,
        notes: 'Rack mount kit included',
      },
      {
        id: 'li-2',
        productId: 'serv-arch-303',
        productName: 'Cloud Architecture & Multi-Agent Design',
        type: 'service',
        quantity: 20,
        unitPrice: 250,
        costPrice: 95,
        discountAmount: 0,
        taxAmount: 0,
        taxRatePercent: 0,
        totalPrice: 5000,
        notes: '20 hours engineering kickoff & discovery',
      },
    ]
  );

  const [isConvertModalOpen, setIsConvertModalOpen] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Active Price Book
  const activePriceBook = priceBooks.find((pb) => pb.id === selectedPriceBookId);

  // When PriceBook changes, re-price items that haven't been manually locked
  const handlePriceBookChange = (pbId: string) => {
    setSelectedPriceBookId(pbId);
    const pb = priceBooks.find((p) => p.id === pbId);

    if (pb?.pricingRules) {
      setLineItems((prev) =>
        prev.map((item) => {
          const rulePrice = pb.pricingRules[item.productId];
          if (rulePrice !== undefined) {
            const unitPrice = rulePrice;
            const gross = unitPrice * item.quantity;
            const net = Math.max(0, gross - (item.discountAmount || 0));
            const tax = Number(((net * (item.taxRatePercent || 0)) / 100).toFixed(2));
            const total = Number((net + tax).toFixed(2));
            return {
              ...item,
              unitPrice,
              taxAmount: tax,
              totalPrice: total,
            };
          }
          return item;
        })
      );
    }
  };

  // Add Item from Catalog
  const handleAddCatalogItem = (productId: string) => {
    const product = catalogItems.find((p) => p.id === productId);
    if (!product) return;

    let effectivePrice = product.unitPrice;
    if (activePriceBook?.pricingRules && activePriceBook.pricingRules[productId] !== undefined) {
      effectivePrice = activePriceBook.pricingRules[productId];
    }

    const qty = 1;
    const gross = effectivePrice * qty;
    const tax = Number(((gross * product.taxRatePercent) / 100).toFixed(2));
    const total = Number((gross + tax).toFixed(2));

    const newItem: LineItem = {
      id: `li-${Date.now().toString(36)}-${Math.floor(100 + Math.random() * 900)}`,
      productId: product.id,
      productName: product.name,
      type: product.type,
      quantity: qty,
      unitPrice: effectivePrice,
      costPrice: product.costPrice,
      discountAmount: 0,
      taxAmount: tax,
      taxRatePercent: product.taxRatePercent,
      totalPrice: total,
      notes: product.description || '',
    };

    setLineItems((prev) => [...prev, newItem]);
  };

  // Update Line Item Field
  const handleUpdateLine = (id: string, field: keyof LineItem, value: any) => {
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        const updated = { ...item, [field]: value };
        const qty = Math.max(1, Number(updated.quantity) || 1);
        const unit = Math.max(0, Number(updated.unitPrice) || 0);
        const discount = Math.max(0, Number(updated.discountAmount) || 0);
        const taxRate = Math.max(0, Number(updated.taxRatePercent) || 0);

        const gross = unit * qty;
        const net = Math.max(0, gross - discount);
        const tax = Number(((net * taxRate) / 100).toFixed(2));
        const total = Number((net + tax).toFixed(2));

        return {
          ...updated,
          quantity: qty,
          unitPrice: unit,
          discountAmount: discount,
          taxAmount: tax,
          totalPrice: total,
        };
      })
    );
  };

  // Remove Line Item
  const handleRemoveLine = (id: string) => {
    setLineItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Grand Totals Calculation
  let subtotal = 0;
  let discountTotal = 0;
  let taxTotal = 0;
  let totalCost = 0;

  lineItems.forEach((item) => {
    const gross = item.unitPrice * item.quantity;
    subtotal += gross;
    discountTotal += item.discountAmount || 0;
    taxTotal += item.taxAmount || 0;
    totalCost += (item.costPrice || 0) * item.quantity;
  });

  const grandTotal = Number((subtotal - discountTotal + taxTotal).toFixed(2));
  const netRevenue = subtotal - discountTotal;
  const marginAmount = Number((netRevenue - totalCost).toFixed(2));
  const marginPercent = netRevenue > 0 ? Number(((marginAmount / netRevenue) * 100).toFixed(1)) : 0;

  const handleSave = async () => {
    setIsSaving(true);
    const quotePayload: Quote = {
      id: initialQuote?.id || `qt-${Date.now().toString(36)}`,
      tenantId: initialQuote?.tenantId || 'tenant-default',
      quoteNumber,
      title,
      dealId: attachedEntityType === 'deal' ? attachedEntityId : initialQuote?.dealId || null,
      projectId: attachedEntityType === 'project' ? attachedEntityId : initialQuote?.projectId || null,
      priceBookId: selectedPriceBookId,
      status,
      lineItems,
      subtotal: Number(subtotal.toFixed(2)),
      discountTotal: Number(discountTotal.toFixed(2)),
      taxTotal: Number(taxTotal.toFixed(2)),
      grandTotal,
      totalCost: Number(totalCost.toFixed(2)),
      marginAmount,
      marginPercent,
      currency: activeCurrency,
      validUntil,
      notes,
      createdAt: initialQuote?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      if (onSaveQuote) {
        await onSaveQuote(quotePayload);
      }
      setSaveSuccessMsg('Quote and line items persisted successfully.');
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (e: any) {
      console.error('Error saving quote:', e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
              {quoteNumber}
            </span>
            <input
              type="text"
              value={title}
              disabled={readOnly}
              onChange={(e) => setTitle(e.target.value)}
              className="text-lg font-bold text-slate-100 bg-transparent border-b border-transparent hover:border-slate-700 focus:border-indigo-500 focus:outline-none transition px-1 py-0.5"
            />
          </div>
          <p className="text-xs text-slate-400">
            Configure line items, price tier rules, and tax parameters for deals and project deliverables
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Status Badge Selector */}
          <select
            value={status}
            disabled={readOnly}
            onChange={(e) => setStatus(e.target.value as QuoteStatus)}
            className={`text-xs font-bold font-mono px-3 py-1.5 rounded-xl border transition ${
              status === 'approved'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : status === 'presented'
                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                : status === 'converted'
                ? 'bg-violet-500/20 text-violet-300 border-violet-500/30'
                : status === 'rejected'
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            <option value="draft">Draft Proposal</option>
            <option value="presented">Presented to Client</option>
            <option value="approved">Client Approved</option>
            <option value="converted">Converted to Project</option>
            <option value="rejected">Rejected / Expired</option>
          </select>

          {/* Convert to Project Action */}
          {status === 'approved' && !readOnly && (
            <button
              onClick={() => setIsConvertModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-500/20 transition flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Convert to Project Scope
            </button>
          )}

          {/* Save Action */}
          {!readOnly && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-500/20 transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {isSaving ? 'Saving...' : 'Save Line Items'}
            </button>
          )}
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Configuration & Price Book Tier Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono mb-1.5 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-violet-400" />
            Applied Price Book Tier
          </label>
          <select
            value={selectedPriceBookId}
            disabled={readOnly}
            onChange={(e) => handlePriceBookChange(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500 font-mono"
          >
            {priceBooks.map((pb) => (
              <option key={pb.id} value={pb.id}>
                {pb.name} {pb.isDefault ? '(Default)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            Quote Validity Date
          </label>
          <input
            type="date"
            value={validUntil}
            disabled={readOnly}
            onChange={(e) => setValidUntil(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs font-mono focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono mb-1.5 flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            Quick Insert From Catalog
          </label>
          <select
            onChange={(e) => {
              if (e.target.value) {
                handleAddCatalogItem(e.target.value);
                e.target.value = '';
              }
            }}
            disabled={readOnly}
            defaultValue=""
            className="w-full px-3 py-2 rounded-xl bg-indigo-950/40 border border-indigo-800 text-indigo-200 text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
          >
            <option value="" disabled>
              + Select item from catalog to insert...
            </option>
            {catalogItems.map((item) => (
              <option key={item.id} value={item.id}>
                [{item.type.toUpperCase()}] {item.name} ({formatCurrency(item.unitPrice, activeCurrency)})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/95 text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
                <th className="py-3.5 px-4 w-1/3">Item Deliverable / Description</th>
                <th className="py-3.5 px-3 text-center">Type</th>
                <th className="py-3.5 px-3 text-center w-20">Qty</th>
                <th className="py-3.5 px-3 text-right w-32">Unit Price ({currencySymbol})</th>
                <th className="py-3.5 px-3 text-right w-28">Discount ({currencySymbol})</th>
                <th className="py-3.5 px-3 text-right w-24">Tax (%)</th>
                <th className="py-3.5 px-4 text-right w-32">Line Total</th>
                {!readOnly && <th className="py-3.5 px-3 w-10"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {lineItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-slate-500">
                    <Package className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                    <p className="font-semibold text-slate-400">No line items added to this quote yet</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Use the "Quick Insert From Catalog" dropdown above to add deliverables.</p>
                  </td>
                </tr>
              ) : (
                lineItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="font-bold text-slate-200">{item.productName}</div>
                        <input
                          type="text"
                          value={item.notes || ''}
                          disabled={readOnly}
                          onChange={(e) => handleUpdateLine(item.id, 'notes', e.target.value)}
                          placeholder="Scope notes, warranty terms, or deliverables..."
                          className="w-full text-[11px] text-slate-400 bg-transparent border-b border-transparent hover:border-slate-700 focus:border-indigo-500 focus:outline-none py-0.5"
                        />
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span
                        className={`text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded ${
                          item.type === 'product'
                            ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                            : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {item.type}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        disabled={readOnly}
                        onChange={(e) => handleUpdateLine(item.id, 'quantity', parseInt(e.target.value, 10))}
                        className="w-16 px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-center font-mono text-xs focus:ring-2 focus:ring-indigo-500"
                      />
                    </td>

                    <td className="py-3 px-3 text-right">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        disabled={readOnly}
                        onChange={(e) => handleUpdateLine(item.id, 'unitPrice', parseFloat(e.target.value))}
                        className="w-24 px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-right font-mono text-xs focus:ring-2 focus:ring-indigo-500"
                      />
                    </td>

                    <td className="py-3 px-3 text-right">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.discountAmount || 0}
                        disabled={readOnly}
                        onChange={(e) => handleUpdateLine(item.id, 'discountAmount', parseFloat(e.target.value))}
                        className="w-20 px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-right font-mono text-xs focus:ring-2 focus:ring-indigo-500"
                      />
                    </td>

                    <td className="py-3 px-3 text-right">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={item.taxRatePercent || 0}
                        disabled={readOnly}
                        onChange={(e) => handleUpdateLine(item.id, 'taxRatePercent', parseFloat(e.target.value))}
                        className="w-16 px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-right font-mono text-xs focus:ring-2 focus:ring-indigo-500"
                      />
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-100">
                      {formatCurrency(item.totalPrice, activeCurrency)}
                    </td>

                    {!readOnly && (
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handleRemoveLine(item.id)}
                          className="p-1.5 rounded-lg hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 transition"
                          title="Remove Line Item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Financial Breakdown & Profit Margins Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notes & Terms */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-md space-y-3">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            Terms, Scope Exclusions & Notes
          </label>
          <textarea
            value={notes}
            disabled={readOnly}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Specify payment milestones, deliverable acceptance criteria, or deployment constraints..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>

        {/* Financial Summary Card */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md space-y-3.5">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono border-b border-slate-800 pb-2 flex items-center justify-between">
            <span>Financial Rollup</span>
            <span className="text-[10px] text-slate-400 font-bold">{activeCurrency}</span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between text-slate-400">
              <span>Gross Subtotal:</span>
              <span className="text-slate-200">{formatCurrency(subtotal, activeCurrency)}</span>
            </div>

            <div className="flex items-center justify-between text-slate-400">
              <span>Total Discounts:</span>
              <span className="text-emerald-400">-{formatCurrency(discountTotal, activeCurrency)}</span>
            </div>

            <div className="flex items-center justify-between text-slate-400">
              <span>Sales Tax Total:</span>
              <span className="text-slate-200">+{formatCurrency(taxTotal, activeCurrency)}</span>
            </div>

            <div className="flex items-center justify-between text-sm font-bold text-slate-100 pt-2 border-t border-slate-800">
              <span>Net Grand Total:</span>
              <span className="text-indigo-400 text-base">{formatCurrency(grandTotal, activeCurrency)}</span>
            </div>
          </div>

          {/* Internal Profit Margin Indicator */}
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-400" />
                Est. Profit Margin:
              </span>
              <span className="font-bold text-emerald-400">
                {formatCurrency(marginAmount, activeCurrency)} ({marginPercent}%)
              </span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              Est. Supply & Labor Cost: {formatCurrency(totalCost, activeCurrency)}
            </div>
          </div>
        </div>
      </div>

      {/* Quote To Project Converter Modal */}
      <QuoteToProjectModal
        isOpen={isConvertModalOpen}
        onClose={() => setIsConvertModalOpen(false)}
        quote={{
          id: initialQuote?.id || 'qt-active',
          tenantId: initialQuote?.tenantId || 'tenant-default',
          quoteNumber,
          title,
          status,
          lineItems,
          subtotal,
          discountTotal,
          taxTotal,
          grandTotal,
          totalCost,
          marginAmount,
          marginPercent,
          validUntil,
          notes,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }}
        onConverted={() => {
          setStatus('converted');
        }}
      />
    </div>
  );
};
export default LineItemEditor;
