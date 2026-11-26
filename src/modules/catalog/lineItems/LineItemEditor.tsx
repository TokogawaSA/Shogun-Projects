/**
 * Simple Interactive Quote Builder & Line Item Editor
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Plus,
  Trash2,
  Package,
  CheckCircle2,
  Save,
  Receipt,
  Eye,
  Edit3,
  ExternalLink,
  ArrowLeft,
} from 'lucide-react';
import clsx from 'clsx';
import { useCatalog } from '../hooks/useCatalog';
import { useAuth } from '../../../context/AuthContext';
import {
  BusinessDetails,
  ClientBillingDetails,
  LineItem,
  Quote,
  QuoteStatus,
  SaTaxMode,
} from '../../../types';
import { Account, Contact } from '../../../types/crmEntities';
import { QuoteToInvoiceModal } from './QuoteToInvoiceModal';
import { DocumentPartiesAndDatesSection } from '../components/DocumentPartiesAndDatesSection';
import { DocumentPreviewCard } from '../components/DocumentPreviewCard';
import {
  addDaysToIsoDate,
  computeFinancialRollup,
  computeLineAmounts,
  DEFAULT_BUSINESS_DETAILS,
  DEFAULT_CLIENT_DETAILS,
  formatSaQuoteCurrency,
  listQuotes,
  loadCrmBillingDirectory,
  loadDefaultBusinessDetails,
  QUOTE_CURRENCIES,
  saveDefaultBusinessDetails,
  saveQuote as persistQuote,
  todayIsoDate,
  VAT_MODES,
} from '../services/billingService';

export { formatSaQuoteCurrency };

export interface LineItemEditorProps {
  initialQuote?: Quote | null;
  attachedEntityType?: 'quote' | 'deal' | 'invoice' | 'project' | 'account';
  attachedEntityId?: string;
  defaultAccountId?: string | null;
  defaultDealId?: string | null;
  defaultProjectId?: string | null;
  defaultClientDetails?: Partial<ClientBillingDetails>;
  onSaveQuote?: (quote: Quote) => Promise<void>;
  onCancel?: () => void;
  readOnly?: boolean;
}

export const LineItemEditor: React.FC<LineItemEditorProps> = ({
  initialQuote,
  attachedEntityType = 'quote',
  attachedEntityId,
  defaultAccountId,
  defaultDealId,
  defaultProjectId,
  defaultClientDetails,
  onSaveQuote,
  onCancel,
  readOnly = false,
}) => {
  const navigate = useNavigate();
  const { id: routeQuoteId } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const queryAccountId = searchParams.get('accountId');
  const queryDealId = searchParams.get('dealId');
  const queryProjectId = searchParams.get('projectId');

  const resolvedAccountId =
    defaultAccountId ??
    (attachedEntityType === 'account' ? attachedEntityId : null) ??
    initialQuote?.accountId ??
    queryAccountId ??
    null;
  const resolvedDealId =
    defaultDealId ??
    (attachedEntityType === 'deal' ? attachedEntityId : null) ??
    initialQuote?.dealId ??
    queryDealId ??
    null;
  const resolvedProjectId =
    defaultProjectId ??
    (attachedEntityType === 'project' ? attachedEntityId : null) ??
    initialQuote?.projectId ??
    queryProjectId ??
    null;

  const { user, tenant } = useAuth();
  const tenantId = user?.tenantId || initialQuote?.tenantId || 'tenant-default';
  const { items: catalogItems } = useCatalog();

  const [savedQuotes, setSavedQuotes] = useState<Quote[]>([]);
  const [activeQuoteId, setActiveQuoteId] = useState<string>(
    initialQuote?.id || routeQuoteId || `qt-${Date.now().toString(36)}`
  );
  const [viewMode, setViewMode] = useState<'editor' | 'preview'>('editor');

  // Header
  const [quoteNumber, setQuoteNumber] = useState<string>(
    initialQuote?.quoteNumber ||
    `QT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [title, setTitle] = useState<string>(initialQuote?.title || '');
  const [status, setStatus] = useState<QuoteStatus>(initialQuote?.status || 'draft');
  const [referenceNumber, setReferenceNumber] = useState<string>(
    initialQuote?.referenceNumber || ''
  );
  const [linkedInvoiceId, setLinkedInvoiceId] = useState<string | null>(
    initialQuote?.linkedInvoiceId || null
  );
  const [linkedInvoiceNumber, setLinkedInvoiceNumber] = useState<string | null>(
    initialQuote?.linkedInvoiceNumber || null
  );

  // Dates
  const [issueDate, setIssueDate] = useState<string>(
    initialQuote?.issueDate || todayIsoDate()
  );
  const [validUntil, setValidUntil] = useState<string>(
    initialQuote?.validUntil
      ? initialQuote.validUntil.slice(0, 10)
      : addDaysToIsoDate(todayIsoDate(), 30)
  );

  // Business & Client Details
  const [businessDetails, setBusinessDetails] = useState<BusinessDetails>(
    initialQuote?.businessDetails || { ...DEFAULT_BUSINESS_DETAILS }
  );
  const [businessSavedNotice, setBusinessSavedNotice] = useState<boolean>(false);
  const [clientDetails, setClientDetails] = useState<ClientBillingDetails>({
    ...DEFAULT_CLIENT_DETAILS,
    ...(resolvedAccountId ? { accountId: resolvedAccountId } : {}),
    ...(defaultClientDetails || {}),
    ...(initialQuote?.clientDetails || {}),
  });
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);

  // Currency & VAT
  const [quoteCurrency, setQuoteCurrency] = useState<string>(
    initialQuote?.currency || 'ZAR'
  );
  const [taxMode, setTaxMode] = useState<SaTaxMode>(
    initialQuote?.taxMode || 'EXCLUSIVE'
  );

  // Itemised Scope & Pricing (starts empty — no mock data)
  const [lineItems, setLineItems] = useState<LineItem[]>(
    initialQuote?.lineItems || []
  );

  // Terms
  const [paymentTerms, setPaymentTerms] = useState<string>(
    initialQuote?.paymentTerms || ''
  );
  const [termsAndConditions, setTermsAndConditions] = useState<string>(
    initialQuote?.termsAndConditions || ''
  );

  const [isConvertInvoiceModalOpen, setIsConvertInvoiceModalOpen] =
    useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const applyQuoteToEditor = useCallback((q: Quote) => {
    setActiveQuoteId(q.id);
    setQuoteNumber(q.quoteNumber);
    setTitle(q.title || '');
    setStatus(q.status);
    setReferenceNumber(q.referenceNumber || '');
    setLinkedInvoiceId(q.linkedInvoiceId || null);
    setLinkedInvoiceNumber(q.linkedInvoiceNumber || null);
    setIssueDate(q.issueDate || todayIsoDate());
    setValidUntil(
      q.validUntil ? q.validUntil.slice(0, 10) : addDaysToIsoDate(todayIsoDate(), 30)
    );
    if (q.businessDetails) setBusinessDetails(q.businessDetails);
    setClientDetails(q.clientDetails || { ...DEFAULT_CLIENT_DETAILS });
    setQuoteCurrency(q.currency || 'ZAR');
    setTaxMode(q.taxMode || 'EXCLUSIVE');
    setLineItems(Array.isArray(q.lineItems) ? q.lineItems : []);
    setPaymentTerms(q.paymentTerms || '');
    setTermsAndConditions(q.termsAndConditions || '');
  }, []);

  useEffect(() => {
    let mounted = true;
    loadDefaultBusinessDetails(tenant?.name).then((defaults) => {
      if (mounted && !initialQuote?.businessDetails) {
        setBusinessDetails(defaults);
      }
    });
    loadCrmBillingDirectory().then((dir) => {
      if (!mounted) return;
      setAccounts(dir.accounts);
      setContacts(dir.contacts);

      if (resolvedAccountId && !initialQuote?.clientDetails?.clientName && !defaultClientDetails?.clientName) {
        const acc = dir.accounts.find((a) => a.id === resolvedAccountId);
        if (acc) {
          const primaryContact =
            dir.contacts.find((c) => c.accountId === acc.id && c.isPrimaryContact) ||
            dir.contacts.find((c) => c.accountId === acc.id);
          const addressParts = [
            acc.billingStreet,
            acc.billingCity,
            acc.billingState,
            acc.billingPostalCode,
            acc.billingCountry,
          ].filter(Boolean);
          setClientDetails((prev) => ({
            ...prev,
            accountId: acc.id,
            contactId: primaryContact?.id || prev.contactId || null,
            clientName: acc.accountName || prev.clientName,
            contactName: primaryContact
              ? `${primaryContact.firstName} ${primaryContact.lastName}`.trim()
              : prev.contactName,
            email: primaryContact?.email || acc.email || prev.email,
            phone: primaryContact?.phone || acc.primaryPhone || prev.phone,
            vatNumber: acc.vatRegistrationNumber || prev.vatNumber,
            registrationNumber: acc.cipcRegistrationNumber || prev.registrationNumber,
            billingAddress: addressParts.length > 0 ? addressParts.join(', ') : prev.billingAddress,
          }));
        }
      }
    });

    if (!initialQuote && !readOnly && !onCancel) {
      listQuotes(tenantId).then((list) => {
        if (!mounted) return;
        setSavedQuotes(list);
        if (routeQuoteId) {
          const match = list.find((q) => q.id === routeQuoteId);
          if (match) applyQuoteToEditor(match);
        }
      });
    }

    return () => {
      mounted = false;
    };
  }, [
    tenantId,
    tenant?.name,
    initialQuote,
    routeQuoteId,
    readOnly,
    onCancel,
    resolvedAccountId,
    defaultClientDetails?.clientName,
    applyQuoteToEditor,
  ]);

  const activeCurrencyMeta =
    QUOTE_CURRENCIES.find((c) => c.code === quoteCurrency) || QUOTE_CURRENCIES[0];

  const effectiveVatRate =
    taxMode === 'ZERO_RATED' || taxMode === 'EXEMPT' ? 0 : 0.15;

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

  const handleAddCatalogItem = (productId: string) => {
    const product = catalogItems.find((p) => p.id === productId);
    if (!product) return;

    const calc = computeLineAmounts(1, product.unitPrice, 0, taxMode);
    const newItem: LineItem = {
      id: `li-${Date.now().toString(36)}-${Math.floor(100 + Math.random() * 900)}`,
      productId: product.id,
      sku: product.sku,
      productName: product.name,
      type: product.type,
      quantity: 1,
      unitPrice: product.unitPrice,
      costPrice: product.costPrice,
      discountAmount: 0,
      taxAmount: calc.taxAmount,
      taxRatePercent: effectiveVatRate * 100,
      totalPrice: calc.totalPrice,
      notes: product.description || '',
    };

    setLineItems((prev) => [...prev, newItem]);
  };

  const handleAddLineItem = () => {
    const newItem: LineItem = {
      id: `li-${Date.now().toString(36)}`,
      productId: `custom-${Date.now().toString(36)}`,
      productName: '',
      type: 'service',
      quantity: 1,
      unitPrice: 0,
      costPrice: 0,
      discountAmount: 0,
      taxAmount: 0,
      taxRatePercent: effectiveVatRate * 100,
      totalPrice: 0,
      notes: '',
    };
    setLineItems((prev) => [...prev, newItem]);
  };

  const handleUpdateLine = (id: string, field: keyof LineItem, value: any) => {
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        const qty = Math.max(0.01, Number(updated.quantity) || 1);
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

  const financialSummary = useMemo(
    () => computeFinancialRollup(lineItems, taxMode, 25),
    [lineItems, taxMode]
  );

  const buildCurrentQuotePayload = useCallback((): Quote => {
    return {
      id: activeQuoteId,
      tenantId,
      quoteNumber,
      title: title.trim() || `Quote ${quoteNumber}`,
      dealId: resolvedDealId,
      accountId: clientDetails.accountId || resolvedAccountId || null,
      contactId: clientDetails.contactId || initialQuote?.contactId || null,
      projectId: resolvedProjectId,
      status,
      lineItems,
      subtotal: financialSummary.subtotalExclVat,
      discountTotal: financialSummary.discountTotal,
      taxTotal: financialSummary.vatAmount,
      grandTotal: financialSummary.totalInclVat,
      currency: quoteCurrency,
      taxMode,
      vatRate: effectiveVatRate,
      subtotalExclVat: financialSummary.subtotalExclVat,
      vatAmount: financialSummary.vatAmount,
      totalInclVat: financialSummary.totalInclVat,
      issueDate,
      validUntil,
      referenceNumber,
      businessDetails,
      clientDetails,
      paymentTerms,
      termsAndConditions,
      linkedInvoiceId,
      linkedInvoiceNumber,
      createdAt: initialQuote?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }, [
    activeQuoteId,
    tenantId,
    quoteNumber,
    title,
    resolvedDealId,
    resolvedAccountId,
    resolvedProjectId,
    initialQuote,
    clientDetails,
    status,
    lineItems,
    financialSummary,
    quoteCurrency,
    taxMode,
    effectiveVatRate,
    issueDate,
    validUntil,
    referenceNumber,
    businessDetails,
    paymentTerms,
    termsAndConditions,
    linkedInvoiceId,
    linkedInvoiceNumber,
  ]);

  const handleCreateNewQuote = () => {
    const today = todayIsoDate();
    setActiveQuoteId(`qt-${Date.now().toString(36)}`);
    setQuoteNumber(
      `QT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
    );
    setTitle('');
    setStatus('draft');
    setReferenceNumber('');
    setLinkedInvoiceId(null);
    setLinkedInvoiceNumber(null);
    setIssueDate(today);
    setValidUntil(addDaysToIsoDate(today, 30));
    setClientDetails({ ...DEFAULT_CLIENT_DETAILS });
    setLineItems([]);
    setPaymentTerms('');
    setTermsAndConditions('');
    setViewMode('editor');
  };

  const handleSave = async () => {
    setIsSaving(true);
    const quotePayload = buildCurrentQuotePayload();

    try {
      const saved = await persistQuote(quotePayload);
      setSavedQuotes((prev) => [saved, ...prev.filter((q) => q.id !== saved.id)]);
      if (onSaveQuote) {
        await onSaveQuote(saved);
      }
      setSaveSuccessMsg('Quote saved.');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch (e: any) {
      console.error('Error saving quote:', e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveBusinessDefault = () => {
    saveDefaultBusinessDetails(businessDetails);
    setBusinessSavedNotice(true);
    setTimeout(() => setBusinessSavedNotice(false), 3000);
  };

  const currentQuote = buildCurrentQuotePayload();

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-12 animate-fade-in">
      {/* Compact Header */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                title="Back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <input
              type="text"
              value={quoteNumber}
              disabled={readOnly}
              onChange={(e) => setQuoteNumber(e.target.value)}
              className="w-32 text-xs font-mono px-2.5 py-1.5 rounded-xl bg-slate-800 text-indigo-300 border border-slate-700 font-bold"
            />
            <input
              type="text"
              value={title}
              disabled={readOnly}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Quote Title / Project Name..."
              className="flex-1 min-w-[220px] text-base font-bold text-slate-100 bg-transparent border-b border-slate-800 focus:border-indigo-500 focus:outline-none px-1 py-1"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={status}
              disabled={readOnly}
              onChange={(e) => setStatus(e.target.value as QuoteStatus)}
              className="text-xs font-medium px-3 py-1.5 rounded-xl border bg-slate-800 text-slate-200 border-slate-700"
            >
              <option value="draft">Draft</option>
              <option value="presented">Sent</option>
              <option value="approved">Approved</option>
              <option value="invoiced">Invoiced</option>
              <option value="rejected">Rejected</option>
            </select>

            <button
              type="button"
              onClick={() => setViewMode(viewMode === 'editor' ? 'preview' : 'editor')}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5"
            >
              {viewMode === 'editor' ? (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </>
              ) : (
                <>
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </>
              )}
            </button>

            {!readOnly && (
              <>
                <button
                  type="button"
                  onClick={() => setIsConvertInvoiceModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 flex items-center gap-1.5 transition"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Convert to Invoice</span>
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 flex items-center gap-1.5 disabled:opacity-50 transition"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving...' : 'Save'}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Saved quotes selector (only shown if quotes exist or linked invoice exists) */}
        {!initialQuote && !readOnly && (savedQuotes.length > 0 || linkedInvoiceId) && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800/80 text-xs">
            <div className="flex items-center gap-2">
              {savedQuotes.length > 0 && (
                <select
                  value={savedQuotes.some((q) => q.id === activeQuoteId) ? activeQuoteId : ''}
                  onChange={(e) => {
                    const match = savedQuotes.find((q) => q.id === e.target.value);
                    if (match) applyQuoteToEditor(match);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs"
                >
                  <option value="">Load Saved Quote...</option>
                  {savedQuotes.map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.quoteNumber} — {q.title || 'Untitled'}
                    </option>
                  ))}
                </select>
              )}
              <button
                type="button"
                onClick={handleCreateNewQuote}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>New Quote</span>
              </button>
            </div>

            {linkedInvoiceId && (
              <button
                type="button"
                onClick={() => navigate(`/catalog/invoices/${linkedInvoiceId}`)}
                className="text-xs font-mono text-emerald-300 hover:text-emerald-200 flex items-center gap-1"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Invoice {linkedInvoiceNumber || linkedInvoiceId}</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {saveSuccessMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {viewMode === 'preview' ? (
        <DocumentPreviewCard
          mode="quote"
          documentNumber={quoteNumber}
          title={title || `Quote ${quoteNumber}`}
          status={status}
          currency={quoteCurrency}
          taxMode={taxMode}
          issueDate={issueDate}
          dueDateOrValidUntil={validUntil}
          referenceNumber={referenceNumber}
          businessDetails={businessDetails}
          clientDetails={clientDetails}
          lineItems={lineItems}
          subtotalExclVat={financialSummary.subtotalExclVat}
          discountTotal={financialSummary.discountTotal}
          vatAmount={financialSummary.vatAmount}
          totalInclVat={financialSummary.totalInclVat}
          paymentTerms={paymentTerms}
          termsAndConditions={termsAndConditions}
        />
      ) : (
        <>
          {/* Dates, Business & Client Details */}
          <DocumentPartiesAndDatesSection
            mode="quote"
            readOnly={readOnly}
            issueDate={issueDate}
            onIssueDateChange={setIssueDate}
            validUntil={validUntil}
            onValidUntilChange={setValidUntil}
            referenceNumber={referenceNumber}
            onReferenceNumberChange={setReferenceNumber}
            businessDetails={businessDetails}
            onBusinessDetailsChange={setBusinessDetails}
            onSaveBusinessDefault={handleSaveBusinessDefault}
            businessSavedNotice={businessSavedNotice}
            clientDetails={clientDetails}
            onClientDetailsChange={setClientDetails}
            accounts={accounts}
            contacts={contacts}
          />

          {/* Itemised Scope & Pricing */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                Itemised Scope & Pricing
              </h3>

              {!readOnly && (
                <div className="flex flex-wrap items-center gap-2">
                  {catalogItems.length > 0 && (
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          handleAddCatalogItem(e.target.value);
                          e.target.value = '';
                        }
                      }}
                      defaultValue=""
                      className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs"
                    >
                      <option value="" disabled>
                        + From Catalog...
                      </option>
                      {catalogItems.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  )}

                  <button
                    type="button"
                    onClick={handleAddLineItem}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Line Item</span>
                  </button>
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-medium text-slate-400">
                    <th className="py-3 px-4">Item & Description</th>
                    <th className="py-3 px-3 text-center w-20">Qty</th>
                    <th className="py-3 px-3 text-right w-32">
                      Price ({activeCurrencyMeta.symbol})
                    </th>
                    <th className="py-3 px-3 text-right w-28">
                      Discount ({activeCurrencyMeta.symbol})
                    </th>
                    <th className="py-3 px-4 text-right w-32">Total</th>
                    {!readOnly && <th className="py-3 px-3 w-10"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {lineItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-10 text-center text-slate-500">
                        <Package className="w-7 h-7 mx-auto mb-2 text-slate-600" />
                        <p className="text-slate-400 font-medium">No items added yet</p>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Click &quot;Add Line Item&quot; to start building your quote.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    lineItems.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-800/30 transition-colors align-top"
                      >
                        <td className="py-3 px-4 space-y-1 min-w-[240px]">
                          <input
                            type="text"
                            value={item.productName}
                            disabled={readOnly}
                            onChange={(e) =>
                              handleUpdateLine(item.id, 'productName', e.target.value)
                            }
                            placeholder="Item or service name..."
                            className="w-full font-semibold text-slate-100 bg-transparent border-b border-transparent hover:border-slate-700 focus:border-indigo-500 focus:outline-none py-0.5"
                          />
                          <input
                            type="text"
                            value={item.notes || ''}
                            disabled={readOnly}
                            onChange={(e) =>
                              handleUpdateLine(item.id, 'notes', e.target.value)
                            }
                            placeholder="Scope description (optional)..."
                            className="w-full text-[11px] text-slate-400 bg-transparent border-b border-transparent hover:border-slate-700 focus:border-indigo-500 focus:outline-none py-0.5"
                          />
                        </td>

                        <td className="py-3 px-3 text-center">
                          <input
                            type="number"
                            min="0.01"
                            step="any"
                            value={item.quantity}
                            disabled={readOnly}
                            onChange={(e) =>
                              handleUpdateLine(
                                item.id,
                                'quantity',
                                parseFloat(e.target.value)
                              )
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
                              handleUpdateLine(
                                item.id,
                                'unitPrice',
                                parseFloat(e.target.value)
                              )
                            }
                            className="w-28 px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-right font-mono text-xs"
                          />
                        </td>

                        <td className="py-3 px-3 text-right">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.discountAmount || 0}
                            disabled={readOnly}
                            onChange={(e) =>
                              handleUpdateLine(
                                item.id,
                                'discountAmount',
                                parseFloat(e.target.value)
                              )
                            }
                            className="w-24 px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-right font-mono text-xs"
                          />
                        </td>

                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-100 whitespace-nowrap pt-4">
                          {formatSaQuoteCurrency(item.totalPrice, quoteCurrency)}
                        </td>

                        {!readOnly && (
                          <td className="py-3 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveLine(item.id)}
                              className="p-1.5 rounded-lg hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 transition"
                              title="Remove"
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

          {/* Terms & Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
              <div className="text-xs font-semibold text-slate-200">Terms</div>
              <input
                type="text"
                value={paymentTerms}
                disabled={readOnly}
                onChange={(e) => setPaymentTerms(e.target.value)}
                placeholder="Payment terms (e.g. 50% deposit, balance within 30 days)..."
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs"
              />
              <textarea
                value={termsAndConditions}
                disabled={readOnly}
                onChange={(e) => setTermsAndConditions(e.target.value)}
                rows={3}
                placeholder="Terms & conditions..."
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs resize-none"
              />
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                <select
                  value={quoteCurrency}
                  disabled={readOnly}
                  onChange={(e) => setQuoteCurrency(e.target.value)}
                  className="flex-1 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs font-mono"
                >
                  {QUOTE_CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} ({c.symbol})
                    </option>
                  ))}
                </select>
                <select
                  value={taxMode}
                  disabled={readOnly}
                  onChange={(e) => handleVatModeChange(e.target.value as SaTaxMode)}
                  className="flex-1 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs"
                >
                  {VAT_MODES.map((vm) => (
                    <option key={vm.mode} value={vm.mode}>
                      {vm.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 text-xs font-mono">
                {financialSummary.discountTotal > 0 && (
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Discount:</span>
                    <span className="text-emerald-400">
                      -{formatSaQuoteCurrency(financialSummary.discountTotal, quoteCurrency)}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-slate-400">
                  <span>Subtotal:</span>
                  <span className="text-slate-200">
                    {formatSaQuoteCurrency(financialSummary.subtotalExclVat, quoteCurrency)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-400">
                  <span>
                    VAT ({taxMode === 'ZERO_RATED' || taxMode === 'EXEMPT' ? '0%' : '15%'}):
                  </span>
                  <span className="text-slate-200">
                    {formatSaQuoteCurrency(financialSummary.vatAmount, quoteCurrency)}
                  </span>
                </div>

                <div
                  className={clsx(
                    'flex items-center justify-between text-sm font-bold text-slate-100 pt-2 border-t border-slate-800'
                  )}
                >
                  <span>Total:</span>
                  <span className="text-indigo-400 text-base">
                    {formatSaQuoteCurrency(financialSummary.totalInclVat, quoteCurrency)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <QuoteToInvoiceModal
        isOpen={isConvertInvoiceModalOpen}
        onClose={() => setIsConvertInvoiceModalOpen(false)}
        quote={currentQuote}
        onConverted={(createdInv) => {
          setStatus('invoiced');
          setLinkedInvoiceId(createdInv.id);
          setLinkedInvoiceNumber(createdInv.invoiceNumber);
        }}
      />
    </div>
  );
};

export default LineItemEditor;
