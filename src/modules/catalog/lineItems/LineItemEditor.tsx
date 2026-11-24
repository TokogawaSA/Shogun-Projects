/**
 * Line Item Editor & SARS 15% VAT Multi-Currency Quote Builder Component
 * Multi-Tenant Antigravity 2.0 Ecosystem (South African Tax & FX Margin Protection)
 */

import React, { useState, useMemo } from 'react';
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
  Calendar,
  Lock,
  Unlock,
  ShieldAlert,
  RefreshCw,
  Scale,
} from 'lucide-react';
import clsx from 'clsx';
import { useCatalog } from '../hooks/useCatalog';
import { LineItem, Quote, QuoteStatus, SaTaxMode } from '../../../types';
import { QuoteToProjectModal } from './QuoteToProjectModal';
import { formatCurrencyAmount } from '../../../context/CurrencyContext';

export interface LineItemEditorProps {
  initialQuote?: Quote | null;
  attachedEntityType?: 'quote' | 'deal' | 'invoice' | 'project';
  attachedEntityId?: string;
  onSaveQuote?: (quote: Quote) => Promise<void>;
  readOnly?: boolean;
}

const QUOTE_CURRENCIES = [
  { code: 'ZAR', symbol: 'R', defaultFxToZar: 1.0, label: 'ZAR (R) – South African Rand' },
  { code: 'USD', symbol: '$', defaultFxToZar: 18.5, label: 'USD ($) – US Dollar' },
  { code: 'EUR', symbol: '€', defaultFxToZar: 20.1, label: 'EUR (€) – Euro' },
  { code: 'GBP', symbol: '£', defaultFxToZar: 23.4, label: 'GBP (£) – British Pound' },
] as const;

const VAT_MODES: Array<{ mode: SaTaxMode; label: string; badge: string }> = [
  { mode: 'EXCLUSIVE', label: 'Excl. 15% VAT', badge: '+15%' },
  { mode: 'INCLUSIVE', label: 'Incl. 15% VAT', badge: '÷1.15' },
  { mode: 'ZERO_RATED', label: 'Zero-Rated', badge: '0%' },
  { mode: 'EXEMPT', label: 'Exempt', badge: 'EXEMPT' },
];

/**
 * Deterministic Banker's Rounding (Round Half to Even) to 2 decimal places in client calculations.
 */
function bankersRound2(val: number): number {
  const scaled = val * 100;
  const floor = Math.floor(scaled);
  const diff = scaled - floor;
  const eps = 1e-9;

  if (Math.abs(diff - 0.5) < eps) {
    return (floor % 2 === 0 ? floor : floor + 1) / 100;
  }
  return Math.round(scaled) / 100;
}

export function formatSaQuoteCurrency(amount: number, currencyCode: string): string {
  if (currencyCode === 'ZAR') {
    const rounded = bankersRound2(amount);
    const neg = rounded < 0 ? '-' : '';
    const [intPart, decPart] = Math.abs(rounded).toFixed(2).split('.');
    return `${neg}R ${intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}.${decPart}`;
  }
  return formatCurrencyAmount(amount, currencyCode, { decimals: 2 });
}

export const LineItemEditor: React.FC<LineItemEditorProps> = ({
  initialQuote,
  attachedEntityType = 'quote',
  attachedEntityId,
  onSaveQuote,
  readOnly = false,
}) => {
  const { items: catalogItems, priceBooks } = useCatalog();

  const [quoteCurrency, setQuoteCurrency] = useState<string>(
    initialQuote?.currency || 'ZAR'
  );
  const [exchangeRateToZar, setExchangeRateToZar] = useState<number>(
    initialQuote?.exchangeRateToZar ?? 18.5
  );
  const [rateLockedAt, setRateLockedAt] = useState<string | null>(
    initialQuote?.rateLockedAt || null
  );
  const [taxMode, setTaxMode] = useState<SaTaxMode>(
    initialQuote?.taxMode || 'EXCLUSIVE'
  );
  const [targetMarginFloor, setTargetMarginFloor] = useState<number>(25);

  const [quoteNumber] = useState<string>(
    initialQuote?.quoteNumber ||
      `QT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [title, setTitle] = useState<string>(
    initialQuote?.title || 'Enterprise Solution Proposal (SARS Tax Compliant)'
  );
  const [status, setStatus] = useState<QuoteStatus>(initialQuote?.status || 'draft');
  const [selectedPriceBookId, setSelectedPriceBookId] = useState<string>(
    initialQuote?.priceBookId ||
      priceBooks.find((pb) => pb.isDefault)?.id ||
      'pb-standard'
  );
  const [validUntil, setValidUntil] = useState<string>(
    initialQuote?.validUntil ||
      new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState<string>(
    initialQuote?.notes ||
      'Payment terms: EFT in ZAR within 30 days of SARS Tax Invoice issuance.'
  );

  const [lineItems, setLineItems] = useState<LineItem[]>(
    initialQuote?.lineItems || [
      {
        id: 'li-1',
        productId: 'prod-blade-101',
        productName: 'Enterprise Edge Blade Server 1U (Imported USD SKU)',
        type: 'product',
        quantity: 2,
        sourceCurrency: 'USD',
        baseForeignUnitPrice: 3200,
        baseForeignCostPrice: 2450,
        unitPrice: 59200,
        costPrice: 45325,
        discountAmount: 0,
        taxAmount: 17760,
        taxRatePercent: 15,
        totalPrice: 136160,
        notes: 'Rack mount kit included (USD catalog item converted to ZAR)',
      },
      {
        id: 'li-2',
        productId: 'serv-arch-303',
        productName: 'Local SA Cloud Architecture & POPIA Engineering',
        type: 'service',
        quantity: 20,
        sourceCurrency: 'ZAR',
        unitPrice: 1450,
        costPrice: 650,
        discountAmount: 500,
        taxAmount: 4275,
        taxRatePercent: 15,
        totalPrice: 32775,
        notes: '20 hours engineering kickoff & discovery (Johannesburg)',
      },
    ]
  );

  const [isConvertModalOpen, setIsConvertModalOpen] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const activeCurrencyMeta =
    QUOTE_CURRENCIES.find((c) => c.code === quoteCurrency) || QUOTE_CURRENCIES[0];
  const activePriceBook = priceBooks.find((pb) => pb.id === selectedPriceBookId);

  const effectiveVatRate =
    taxMode === 'ZERO_RATED' || taxMode === 'EXEMPT' ? 0 : 0.15;

  const computeLineAmounts = (
    qty: number,
    unitPrice: number,
    discountAmount: number,
    mode: SaTaxMode
  ) => {
    const gross = bankersRound2(qty * unitPrice);
    const netLine = Math.max(0, bankersRound2(gross - discountAmount));

    if (mode === 'ZERO_RATED' || mode === 'EXEMPT') {
      return { taxAmount: 0, totalPrice: netLine };
    }
    if (mode === 'INCLUSIVE') {
      const excl = bankersRound2(netLine / 1.15);
      const vat = bankersRound2(netLine - excl);
      return { taxAmount: vat, totalPrice: netLine };
    }
    const vat = bankersRound2(netLine * 0.15);
    return { taxAmount: vat, totalPrice: bankersRound2(netLine + vat) };
  };

  const handleVatModeChange = (nextMode: SaTaxMode) => {
    setTaxMode(nextMode);
    setLineItems((prev) =>
      prev.map((item) => {
        const calc = computeLineAmounts(
          item.quantity,
          item.unitPrice,
          item.discountAmount || 0,
          nextMode
        );
        return {
          ...item,
          taxRatePercent: nextMode === 'ZERO_RATED' || nextMode === 'EXEMPT' ? 0 : 15,
          taxAmount: calc.taxAmount,
          totalPrice: calc.totalPrice,
        };
      })
    );
  };

  const handleFxRateChange = (nextRate: number) => {
    if (rateLockedAt || nextRate <= 0) return;
    setExchangeRateToZar(nextRate);

    // Recompute ZAR landed cost on foreign USD/EUR catalog items so margin erosion is detected live!
    if (quoteCurrency === 'ZAR') {
      setLineItems((prev) =>
        prev.map((item) => {
          if (
            item.sourceCurrency &&
            item.sourceCurrency !== 'ZAR' &&
            item.baseForeignCostPrice !== undefined
          ) {
            return {
              ...item,
              costPrice: bankersRound2(item.baseForeignCostPrice * nextRate),
            };
          }
          return item;
        })
      );
    }
  };

  const handleProtectForeignMargins = () => {
    const floorFraction = Math.min(0.9, Math.max(0.05, targetMarginFloor / 100));
    setLineItems((prev) =>
      prev.map((item) => {
        const cost = item.costPrice || 0;
        if (cost <= 0) return item;

        const exclUnit =
          taxMode === 'INCLUSIVE' ? bankersRound2(item.unitPrice / 1.15) : item.unitPrice;
        const currentMarginPct = exclUnit > 0 ? ((exclUnit - cost) / exclUnit) * 100 : 0;

        if (currentMarginPct >= targetMarginFloor) {
          return item;
        }

        const requiredExclUnit = bankersRound2(cost / (1 - floorFraction));
        const protectedUnit =
          taxMode === 'INCLUSIVE'
            ? bankersRound2(requiredExclUnit * 1.15)
            : requiredExclUnit;
        const calc = computeLineAmounts(
          item.quantity,
          protectedUnit,
          item.discountAmount || 0,
          taxMode
        );

        return {
          ...item,
          unitPrice: protectedUnit,
          taxAmount: calc.taxAmount,
          totalPrice: calc.totalPrice,
        };
      })
    );
  };

  const handlePriceBookChange = (pbId: string) => {
    setSelectedPriceBookId(pbId);
    const pb = priceBooks.find((p) => p.id === pbId);

    if (pb?.pricingRules) {
      setLineItems((prev) =>
        prev.map((item) => {
          const rulePrice = pb.pricingRules[item.productId];
          if (rulePrice !== undefined) {
            const calc = computeLineAmounts(
              item.quantity,
              rulePrice,
              item.discountAmount || 0,
              taxMode
            );
            return {
              ...item,
              unitPrice: rulePrice,
              taxAmount: calc.taxAmount,
              totalPrice: calc.totalPrice,
            };
          }
          return item;
        })
      );
    }
  };

  const handleAddCatalogItem = (productId: string) => {
    const product = catalogItems.find((p) => p.id === productId);
    if (!product) return;

    let baseUnit = product.unitPrice;
    if (activePriceBook?.pricingRules?.[productId] !== undefined) {
      baseUnit = activePriceBook.pricingRules[productId];
    }

    // Assume catalog items default to USD if corporate catalog is foreign, converting into ZAR when quoting in ZAR
    const itemSourceCurrency = quoteCurrency === 'ZAR' ? 'USD' : quoteCurrency;
    const fxMultiplier =
      itemSourceCurrency !== 'ZAR' && quoteCurrency === 'ZAR' ? exchangeRateToZar : 1;

    const convertedUnit = bankersRound2(baseUnit * fxMultiplier);
    const convertedCost = bankersRound2((product.costPrice || 0) * fxMultiplier);
    const calc = computeLineAmounts(1, convertedUnit, 0, taxMode);

    const newItem: LineItem = {
      id: `li-${Date.now().toString(36)}-${Math.floor(100 + Math.random() * 900)}`,
      productId: product.id,
      productName: product.name,
      type: product.type,
      quantity: 1,
      sourceCurrency: itemSourceCurrency,
      baseForeignUnitPrice: baseUnit,
      baseForeignCostPrice: product.costPrice,
      unitPrice: convertedUnit,
      costPrice: convertedCost,
      discountAmount: 0,
      taxAmount: calc.taxAmount,
      taxRatePercent: effectiveVatRate * 100,
      totalPrice: calc.totalPrice,
      notes: product.description || '',
    };

    setLineItems((prev) => [...prev, newItem]);
  };

  const handleUpdateLine = (id: string, field: keyof LineItem, value: any) => {
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        const qty = Math.max(1, Number(updated.quantity) || 1);
        const unit = Math.max(0, Number(updated.unitPrice) || 0);
        const discount = Math.max(0, Number(updated.discountAmount) || 0);
        const calc = computeLineAmounts(qty, unit, discount, taxMode);

        return {
          ...updated,
          quantity: qty,
          unitPrice: unit,
          discountAmount: discount,
          taxRatePercent: effectiveVatRate * 100,
          taxAmount: calc.taxAmount,
          totalPrice: calc.totalPrice,
        };
      })
    );
  };

  const handleRemoveLine = (id: string) => {
    setLineItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Deterministic SARS 15% VAT & Margin Rollup
  const financialSummary = useMemo(() => {
    let rawLineGross = 0;
    let discountTotal = 0;
    let totalCost = 0;
    let erodedLinesCount = 0;

    for (const item of lineItems) {
      const gross = bankersRound2(item.unitPrice * item.quantity);
      rawLineGross = bankersRound2(rawLineGross + gross);
      discountTotal = bankersRound2(discountTotal + (item.discountAmount || 0));
      const itemCostTotal = bankersRound2((item.costPrice || 0) * item.quantity);
      totalCost = bankersRound2(totalCost + itemCostTotal);

      const netLine = Math.max(0, gross - (item.discountAmount || 0));
      const lineExcl =
        taxMode === 'INCLUSIVE' ? bankersRound2(netLine / 1.15) : netLine;
      const lineMarginPct =
        lineExcl > 0 ? ((lineExcl - itemCostTotal) / lineExcl) * 100 : 0;
      if (itemCostTotal > 0 && lineMarginPct < targetMarginFloor) {
        erodedLinesCount += 1;
      }
    }

    const netAfterDiscount = Math.max(0, bankersRound2(rawLineGross - discountTotal));

    let subtotalExclVat: number;
    let vatAmount: number;
    let totalInclVat: number;

    if (taxMode === 'ZERO_RATED' || taxMode === 'EXEMPT') {
      subtotalExclVat = netAfterDiscount;
      vatAmount = 0;
      totalInclVat = netAfterDiscount;
    } else if (taxMode === 'INCLUSIVE') {
      totalInclVat = netAfterDiscount;
      subtotalExclVat = bankersRound2(totalInclVat / 1.15);
      vatAmount = bankersRound2(totalInclVat - subtotalExclVat);
    } else {
      subtotalExclVat = netAfterDiscount;
      vatAmount = bankersRound2(subtotalExclVat * 0.15);
      totalInclVat = bankersRound2(subtotalExclVat + vatAmount);
    }

    const marginAmount = bankersRound2(subtotalExclVat - totalCost);
    const marginPercent =
      subtotalExclVat > 0
        ? Number(((marginAmount / subtotalExclVat) * 100).toFixed(1))
        : 0;

    return {
      rawLineGross,
      discountTotal,
      subtotalExclVat,
      vatAmount,
      totalInclVat,
      totalCost,
      marginAmount,
      marginPercent,
      erodedLinesCount,
    };
  }, [lineItems, taxMode, targetMarginFloor]);

  const handleSave = async () => {
    setIsSaving(true);
    const quotePayload: Quote = {
      id: initialQuote?.id || `qt-${Date.now().toString(36)}`,
      tenantId: initialQuote?.tenantId || 'tenant-default',
      quoteNumber,
      title,
      dealId: attachedEntityType === 'deal' ? attachedEntityId : initialQuote?.dealId || null,
      projectId:
        attachedEntityType === 'project' ? attachedEntityId : initialQuote?.projectId || null,
      priceBookId: selectedPriceBookId,
      status,
      lineItems,
      subtotal: financialSummary.subtotalExclVat,
      discountTotal: financialSummary.discountTotal,
      taxTotal: financialSummary.vatAmount,
      grandTotal: financialSummary.totalInclVat,
      totalCost: financialSummary.totalCost,
      marginAmount: financialSummary.marginAmount,
      marginPercent: financialSummary.marginPercent,
      currency: quoteCurrency,
      exchangeRateToZar: quoteCurrency === 'ZAR' ? exchangeRateToZar : exchangeRateToZar,
      rateLockedAt,
      taxMode,
      vatRate: effectiveVatRate,
      subtotalExclVat: financialSummary.subtotalExclVat,
      vatAmount: financialSummary.vatAmount,
      totalInclVat: financialSummary.totalInclVat,
      validUntil,
      notes,
      createdAt: initialQuote?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      if (onSaveQuote) {
        await onSaveQuote(quotePayload);
      }
      setSaveSuccessMsg('SARS 15% VAT Quote and multi-currency line items saved.');
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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
              {quoteNumber}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              SARS VAT 15% ENGINE
            </span>
            <input
              type="text"
              value={title}
              disabled={readOnly}
              onChange={(e) => setTitle(e.target.value)}
              className="text-lg font-bold text-slate-100 bg-transparent border-b border-transparent hover:border-slate-700 focus:border-indigo-500 focus:outline-none transition px-1 py-0.5 min-w-[260px]"
            />
          </div>
          <p className="text-xs text-slate-400">
            South African multi-currency quote builder with SARS 15% VAT modes and live USD/EUR-to-ZAR margin protection
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* VAT Mode Segmented Toggle */}
          <div className="flex items-center bg-slate-950/90 p-1 rounded-xl border border-slate-800">
            {VAT_MODES.map((vm) => (
              <button
                key={vm.mode}
                type="button"
                disabled={readOnly}
                onClick={() => handleVatModeChange(vm.mode)}
                className={clsx(
                  'px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1',
                  taxMode === vm.mode
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                )}
              >
                <span>{vm.label}</span>
              </button>
            ))}
          </div>

          <select
            value={status}
            disabled={readOnly}
            onChange={(e) => setStatus(e.target.value as QuoteStatus)}
            className="text-xs font-bold font-mono px-3 py-1.5 rounded-xl border bg-slate-800 text-slate-200 border-slate-700"
          >
            <option value="draft">Draft Proposal</option>
            <option value="presented">Presented to Client</option>
            <option value="approved">Client Approved</option>
            <option value="converted">Converted to Project</option>
            <option value="rejected">Rejected / Expired</option>
          </select>

          {status === 'approved' && !readOnly && (
            <button
              onClick={() => setIsConvertModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md transition flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Convert to Project
            </button>
          )}

          {!readOnly && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {isSaving ? 'Saving...' : 'Save Quote'}
            </button>
          )}
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Multi-Currency FX & Margin Protection Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono mb-1.5">
            Quote Currency
          </label>
          <select
            value={quoteCurrency}
            disabled={readOnly}
            onChange={(e) => {
              const code = e.target.value;
              setQuoteCurrency(code);
              const found = QUOTE_CURRENCIES.find((c) => c.code === code);
              if (found && code !== 'ZAR' && !rateLockedAt) {
                setExchangeRateToZar(found.defaultFxToZar);
              }
            }}
            className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs font-mono"
          >
            {QUOTE_CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono mb-1.5 flex items-center justify-between">
            <span>FX Rate (1 Foreign → ZAR)</span>
            <button
              type="button"
              disabled={readOnly}
              onClick={() =>
                setRateLockedAt((prev) => (prev ? null : new Date().toISOString()))
              }
              className="text-[10px] text-indigo-300 hover:text-indigo-200 flex items-center gap-1"
            >
              {rateLockedAt ? (
                <>
                  <Lock className="w-3 h-3 text-amber-400" /> Locked
                </>
              ) : (
                <>
                  <Unlock className="w-3 h-3" /> Lock FX
                </>
              )}
            </button>
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={exchangeRateToZar}
            disabled={readOnly || Boolean(rateLockedAt)}
            onChange={(e) => handleFxRateChange(Number(e.target.value) || 1)}
            className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs font-mono disabled:opacity-60"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono mb-1.5 flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-emerald-400" />
            Min Margin Floor (%)
          </label>
          <input
            type="number"
            min={5}
            max={85}
            value={targetMarginFloor}
            disabled={readOnly}
            onChange={(e) => setTargetMarginFloor(Math.max(0, Number(e.target.value) || 0))}
            className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs font-mono"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono mb-1.5 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-violet-400" />
            Price Book Tier
          </label>
          <select
            value={selectedPriceBookId}
            disabled={readOnly}
            onChange={(e) => handlePriceBookChange(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs font-mono"
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
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            Insert Catalog SKU
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
            className="w-full px-3 py-2 rounded-xl bg-indigo-950/40 border border-indigo-800 text-indigo-200 text-xs font-semibold"
          >
            <option value="" disabled>
              + Select item...
            </option>
            {catalogItems.map((item) => (
              <option key={item.id} value={item.id}>
                [{item.type.toUpperCase()}] {item.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Live FX Margin Erosion Protection Alert */}
      {financialSummary.erodedLinesCount > 0 && (
        <div className="p-4 rounded-2xl bg-amber-950/50 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5 text-xs text-amber-200">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">
                FX Margin Erosion Warning ({financialSummary.erodedLinesCount} item
                {financialSummary.erodedLinesCount > 1 ? 's' : ''} below {targetMarginFloor}% target margin)
              </p>
              <p className="text-[11px] text-amber-200/80">
                ZAR exchange rate movement ({formatSaQuoteCurrency(exchangeRateToZar, 'ZAR')} per foreign unit) compressed landed margin on imported USD/EUR catalog items.
              </p>
            </div>
          </div>
          {!readOnly && (
            <button
              type="button"
              onClick={handleProtectForeignMargins}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shrink-0 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Re-Price to {targetMarginFloor}% Margin</span>
            </button>
          )}
        </div>
      )}

      {/* Line Items Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/95 text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
                <th className="py-3.5 px-4">Deliverable / SKU</th>
                <th className="py-3.5 px-3 text-center">Origin</th>
                <th className="py-3.5 px-3 text-center w-20">Qty</th>
                <th className="py-3.5 px-3 text-right w-32">
                  Unit ({activeCurrencyMeta.symbol})
                </th>
                <th className="py-3.5 px-3 text-right w-28">
                  Landed Cost ({activeCurrencyMeta.symbol})
                </th>
                <th className="py-3.5 px-3 text-right w-24">
                  Disc ({activeCurrencyMeta.symbol})
                </th>
                <th className="py-3.5 px-3 text-right w-24">Margin</th>
                <th className="py-3.5 px-4 text-right w-36">
                  Line Total ({taxMode === 'INCLUSIVE' ? 'Incl.' : taxMode === 'EXCLUSIVE' ? 'Incl. 15%' : '0% VAT'})
                </th>
                {!readOnly && <th className="py-3.5 px-3 w-10"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {lineItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-10 text-center text-slate-500">
                    <Package className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                    <p className="font-semibold text-slate-400">No line items in quote</p>
                  </td>
                </tr>
              ) : (
                lineItems.map((item) => {
                  const gross = bankersRound2(item.unitPrice * item.quantity);
                  const netLine = Math.max(0, gross - (item.discountAmount || 0));
                  const exclRev =
                    taxMode === 'INCLUSIVE' ? bankersRound2(netLine / 1.15) : netLine;
                  const lineCost = bankersRound2((item.costPrice || 0) * item.quantity);
                  const lineMarginPct =
                    exclRev > 0
                      ? Number((((exclRev - lineCost) / exclRev) * 100).toFixed(1))
                      : 0;
                  const isEroded = lineCost > 0 && lineMarginPct < targetMarginFloor;

                  return (
                    <tr
                      key={item.id}
                      className={clsx(
                        'transition-colors',
                        isEroded ? 'bg-amber-950/20 hover:bg-amber-950/30' : 'hover:bg-slate-800/30'
                      )}
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-200">{item.productName}</div>
                        <input
                          type="text"
                          value={item.notes || ''}
                          disabled={readOnly}
                          onChange={(e) => handleUpdateLine(item.id, 'notes', e.target.value)}
                          placeholder="Scope notes..."
                          className="w-full text-[11px] text-slate-400 bg-transparent border-b border-transparent hover:border-slate-700 focus:border-indigo-500 focus:outline-none py-0.5"
                        />
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                          {item.sourceCurrency || quoteCurrency}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          disabled={readOnly}
                          onChange={(e) =>
                            handleUpdateLine(item.id, 'quantity', parseInt(e.target.value, 10))
                          }
                          className="w-16 px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-center font-mono text-xs"
                        />
                      </td>

                      <td className="py-3 px-3 text-right">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          disabled={readOnly}
                          onChange={(e) =>
                            handleUpdateLine(item.id, 'unitPrice', parseFloat(e.target.value))
                          }
                          className="w-28 px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-right font-mono text-xs"
                        />
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-slate-400">
                        {formatSaQuoteCurrency(item.costPrice || 0, quoteCurrency)}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.discountAmount || 0}
                          disabled={readOnly}
                          onChange={(e) =>
                            handleUpdateLine(item.id, 'discountAmount', parseFloat(e.target.value))
                          }
                          className="w-20 px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-right font-mono text-xs"
                        />
                      </td>

                      <td className="py-3 px-3 text-right font-mono">
                        <span
                          className={clsx(
                            'px-2 py-0.5 rounded text-[11px] font-bold',
                            isEroded
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-emerald-500/15 text-emerald-300'
                          )}
                        >
                          {lineMarginPct}%
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-100 whitespace-nowrap">
                        {formatSaQuoteCurrency(item.totalPrice, quoteCurrency)}
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Notes + SARS 15% VAT Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              SARS Tax Quote Terms & Validity
            </label>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <Calendar className="w-3.5 h-3.5" />
              <span>Valid Until:</span>
              <input
                type="date"
                value={validUntil}
                disabled={readOnly}
                onChange={(e) => setValidUntil(e.target.value)}
                className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-200 text-xs"
              />
            </div>
          </div>
          <textarea
            value={notes}
            disabled={readOnly}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-100 text-xs resize-none"
          />
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3.5">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono border-b border-slate-800 pb-2 flex items-center justify-between">
            <span>SARS VAT Summary ({taxMode})</span>
            <span className="text-[10px] text-emerald-400 font-bold">{quoteCurrency}</span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            {financialSummary.discountTotal > 0 && (
              <div className="flex items-center justify-between text-slate-400">
                <span>Total Discounts:</span>
                <span className="text-emerald-400">
                  -{formatSaQuoteCurrency(financialSummary.discountTotal, quoteCurrency)}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between text-slate-400">
              <span>Subtotal (Excl. VAT):</span>
              <span className="text-slate-200">
                {formatSaQuoteCurrency(financialSummary.subtotalExclVat, quoteCurrency)}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-400">
              <span>
                SARS VAT ({taxMode === 'ZERO_RATED' || taxMode === 'EXEMPT' ? '0%' : '15%'}):
              </span>
              <span className="text-slate-200">
                +{formatSaQuoteCurrency(financialSummary.vatAmount, quoteCurrency)}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm font-bold text-slate-100 pt-2 border-t border-slate-800">
              <span>Total (Incl. VAT):</span>
              <span className="text-indigo-400 text-base">
                {formatSaQuoteCurrency(financialSummary.totalInclVat, quoteCurrency)}
              </span>
            </div>

            {quoteCurrency !== 'ZAR' && (
              <div className="flex items-center justify-between text-[11px] text-amber-300 pt-1">
                <span>ZAR Equivalent (@ {exchangeRateToZar}):</span>
                <span>
                  {formatSaQuoteCurrency(
                    bankersRound2(financialSummary.totalInclVat * exchangeRateToZar),
                    'ZAR'
                  )}
                </span>
              </div>
            )}
          </div>

          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-400" />
                Net Excl-VAT Margin:
              </span>
              <span
                className={clsx(
                  'font-bold',
                  financialSummary.marginPercent < targetMarginFloor
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                )}
              >
                {formatSaQuoteCurrency(financialSummary.marginAmount, quoteCurrency)} (
                {financialSummary.marginPercent}%)
              </span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              Landed Supply Cost: {formatSaQuoteCurrency(financialSummary.totalCost, quoteCurrency)}
            </div>
          </div>
        </div>
      </div>

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
          subtotal: financialSummary.subtotalExclVat,
          discountTotal: financialSummary.discountTotal,
          taxTotal: financialSummary.vatAmount,
          grandTotal: financialSummary.totalInclVat,
          totalCost: financialSummary.totalCost,
          marginAmount: financialSummary.marginAmount,
          marginPercent: financialSummary.marginPercent,
          currency: quoteCurrency,
          exchangeRateToZar,
          taxMode,
          subtotalExclVat: financialSummary.subtotalExclVat,
          vatAmount: financialSummary.vatAmount,
          totalInclVat: financialSummary.totalInclVat,
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
