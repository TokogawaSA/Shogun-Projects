import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Receipt,
  Plus,
  Search,
  ArrowLeft,
  Save,
  CreditCard,
  Eye,
  Edit3,
  Trash2,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../../../context/AuthContext';
import { useCatalog } from '../hooks/useCatalog';
import {
  BusinessDetails,
  ClientBillingDetails,
  InvoicePaymentRecord,
  LineItem,
  PaymentTermsPreset,
  Quote,
  SaTaxMode,
  TaxInvoice,
  TaxInvoiceStatus,
} from '../../../types';
import { Account, Contact } from '../../../types/crmEntities';
import { DocumentPartiesAndDatesSection } from '../components/DocumentPartiesAndDatesSection';
import { DocumentPreviewCard } from '../components/DocumentPreviewCard';
import { RecordPaymentModal } from './RecordPaymentModal';
import { QuoteToInvoiceModal } from '../lineItems/QuoteToInvoiceModal';
import {
  bankersRound2,
  computeDueDateFromPreset,
  computeFinancialRollup,
  computeLineAmounts,
  DEFAULT_BUSINESS_DETAILS,
  DEFAULT_CLIENT_DETAILS,
  deleteInvoice,
  formatSaQuoteCurrency,
  getInvoice,
  isInvoiceOverdue,
  listInvoices,
  listQuotes,
  loadCrmBillingDirectory,
  loadDefaultBusinessDetails,
  QUOTE_CURRENCIES,
  recordInvoicePayment,
  saveDefaultBusinessDetails,
  saveInvoice,
  todayIsoDate,
  VAT_MODES,
} from '../services/billingService';

type InvoiceStatusFilter =
  | 'ALL'
  | 'DRAFT'
  | 'ISSUED'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'OVERDUE'
  | 'VOID';

export interface InvoiceSystemViewProps {
  embeddedMode?: 'create';
  defaultAccountId?: string | null;
  defaultProjectId?: string | null;
  defaultClientDetails?: Partial<ClientBillingDetails>;
  onEmbeddedSaved?: (invoice: TaxInvoice) => void;
  onEmbeddedCancel?: () => void;
}

export const InvoiceSystemView: React.FC<InvoiceSystemViewProps> = ({
  embeddedMode,
  defaultAccountId,
  defaultProjectId,
  defaultClientDetails,
  onEmbeddedSaved,
  onEmbeddedCancel,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: routeInvoiceId } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const { user, tenant } = useAuth();
  const tenantId = user?.tenantId || 'tenant-default';
  const { items: catalogItems } = useCatalog();

  const queryAccountId = searchParams.get('accountId');
  const queryProjectId = searchParams.get('projectId');
  const resolvedDefaultAccountId = defaultAccountId ?? queryAccountId ?? null;
  const resolvedDefaultProjectId = defaultProjectId ?? queryProjectId ?? null;

  const isEmbeddedCreate = embeddedMode === 'create';
  const isNewMode = isEmbeddedCreate || location.pathname.endsWith('/invoices/new');
  const isEditorView = isNewMode || Boolean(routeInvoiceId);

  // List state
  const [invoices, setInvoices] = useState<TaxInvoice[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loadingList, setLoadingList] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatusFilter>('ALL');
  const [quoteToConvert, setQuoteToConvert] = useState<Quote | null>(null);
  const [paymentTargetInvoice, setPaymentTargetInvoice] = useState<TaxInvoice | null>(null);

  // CRM & Business Profile
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [businessSavedNotice, setBusinessSavedNotice] = useState<boolean>(false);

  // Editor state
  const [viewMode, setViewMode] = useState<'editor' | 'preview'>(
    searchParams.get('preview') === '1' ? 'preview' : 'editor'
  );
  const [activeInvoiceId, setActiveInvoiceId] = useState<string>('');
  const [invoiceNumber, setInvoiceNumber] = useState<string>('INV-0001');
  const [title, setTitle] = useState<string>('');
  const [status, setStatus] = useState<TaxInvoiceStatus>('DRAFT');
  const [quoteId, setQuoteId] = useState<string | null>(null);
  const [quoteNumber, setQuoteNumber] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(resolvedDefaultProjectId);
  const [poNumber, setPoNumber] = useState<string>('');
  const [currency, setCurrency] = useState<string>('ZAR');
  const [taxMode, setTaxMode] = useState<SaTaxMode>('EXCLUSIVE');
  const [issueDate, setIssueDate] = useState<string>(todayIsoDate());
  const [paymentTermsPreset, setPaymentTermsPreset] =
    useState<PaymentTermsPreset>('net_30');
  const [dueDate, setDueDate] = useState<string>(() =>
    computeDueDateFromPreset(todayIsoDate(), 'net_30')
  );
  const [businessDetails, setBusinessDetails] = useState<BusinessDetails>({
    ...DEFAULT_BUSINESS_DETAILS,
  });
  const [clientDetails, setClientDetails] = useState<ClientBillingDetails>({
    ...DEFAULT_CLIENT_DETAILS,
  });
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [payments, setPayments] = useState<InvoicePaymentRecord[]>([]);
  const [paymentTerms, setPaymentTerms] = useState<string>('');
  const [termsAndConditions, setTermsAndConditions] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [bannerMsg, setBannerMsg] = useState<string | null>(null);

  const showBanner = useCallback((msg: string) => {
    setBannerMsg(msg);
    setTimeout(() => setBannerMsg(null), 3000);
  }, []);

  const hydrateEditorFromInvoice = useCallback((inv: TaxInvoice) => {
    setActiveInvoiceId(inv.id);
    setInvoiceNumber(inv.invoiceNumber);
    setTitle(inv.title || '');
    setStatus(inv.status || 'DRAFT');
    setQuoteId(inv.quoteId || null);
    setQuoteNumber(inv.quoteNumber || null);
    setProjectId(inv.projectId || null);
    setPoNumber(inv.poNumber || '');
    setCurrency(inv.currency || 'ZAR');
    setTaxMode(inv.taxMode || 'EXCLUSIVE');
    const resolvedIssue = inv.issueDate || inv.createdAt?.slice(0, 10) || todayIsoDate();
    setIssueDate(resolvedIssue);
    setPaymentTermsPreset(inv.paymentTermsPreset || 'net_30');
    setDueDate(
      inv.dueDate
        ? inv.dueDate.slice(0, 10)
        : computeDueDateFromPreset(resolvedIssue, 'net_30')
    );
    if (inv.businessDetails) setBusinessDetails(inv.businessDetails);
    setClientDetails(inv.clientDetails || { ...DEFAULT_CLIENT_DETAILS });
    setLineItems(Array.isArray(inv.lineItems) ? inv.lineItems : []);
    setAmountPaid(Number(inv.amountPaid || 0));
    setPayments(Array.isArray(inv.payments) ? inv.payments : []);
    setPaymentTerms(inv.paymentTerms || '');
    setTermsAndConditions(inv.termsAndConditions || '');
  }, []);

  const loadData = useCallback(async () => {
    setLoadingList(true);
    try {
      const [invList, quoteList, dir, defaultBiz] = await Promise.all([
        listInvoices(tenantId),
        listQuotes(tenantId),
        loadCrmBillingDirectory(),
        loadDefaultBusinessDetails(tenant?.name),
      ]);

      setInvoices(invList);
      setQuotes(quoteList);
      setAccounts(dir.accounts);
      setContacts(dir.contacts);

      if (isNewMode) {
        const today = todayIsoDate();
        setActiveInvoiceId(`inv-${Date.now().toString(36)}`);
        setInvoiceNumber(`INV-${String(invList.length + 1).padStart(4, '0')}`);
        setTitle('');
        setStatus('DRAFT');
        setQuoteId(null);
        setQuoteNumber(null);
        setProjectId(resolvedDefaultProjectId);
        setPoNumber('');
        setCurrency('ZAR');
        setTaxMode('EXCLUSIVE');
        setIssueDate(today);
        setPaymentTermsPreset('net_30');
        setDueDate(computeDueDateFromPreset(today, 'net_30'));
        setBusinessDetails(defaultBiz);

        let initialClient: ClientBillingDetails = {
          ...DEFAULT_CLIENT_DETAILS,
          ...(resolvedDefaultAccountId ? { accountId: resolvedDefaultAccountId } : {}),
          ...(defaultClientDetails || {}),
        };
        if (resolvedDefaultAccountId && !defaultClientDetails?.clientName) {
          const acc = dir.accounts.find((a) => a.id === resolvedDefaultAccountId);
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
            initialClient = {
              ...initialClient,
              accountId: acc.id,
              contactId: primaryContact?.id || null,
              clientName: acc.accountName || '',
              contactName: primaryContact
                ? `${primaryContact.firstName} ${primaryContact.lastName}`.trim()
                : '',
              email: primaryContact?.email || acc.email || '',
              phone: primaryContact?.phone || acc.primaryPhone || '',
              vatNumber: acc.vatRegistrationNumber || '',
              registrationNumber: acc.cipcRegistrationNumber || '',
              billingAddress: addressParts.join(', '),
            };
          }
        }
        setClientDetails(initialClient);
        setLineItems([]);
        setAmountPaid(0);
        setPayments([]);
        setPaymentTerms('');
        setTermsAndConditions('');
        setViewMode('editor');
      } else if (routeInvoiceId) {
        const match =
          invList.find((i) => i.id === routeInvoiceId) ||
          (await getInvoice(routeInvoiceId, tenantId));
        if (match) {
          if (!match.businessDetails) {
            match.businessDetails = defaultBiz;
          }
          hydrateEditorFromInvoice(match);
          setViewMode(searchParams.get('preview') === '1' ? 'preview' : 'editor');
        }
      }
    } finally {
      setLoadingList(false);
    }
  }, [
    tenantId,
    tenant?.name,
    isNewMode,
    routeInvoiceId,
    searchParams,
    resolvedDefaultAccountId,
    resolvedDefaultProjectId,
    defaultClientDetails,
    hydrateEditorFromInvoice,
  ]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const financialSummary = useMemo(
    () => computeFinancialRollup(lineItems, taxMode, 25),
    [lineItems, taxMode]
  );

  const effectiveVatRate =
    taxMode === 'ZERO_RATED' || taxMode === 'EXEMPT' ? 0 : 0.15;

  const activeCurrencyMeta =
    QUOTE_CURRENCIES.find((c) => c.code === currency) || QUOTE_CURRENCIES[0];

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
    const nextItem: LineItem = {
      id: `inv-li-${Date.now().toString(36)}-${Math.floor(100 + Math.random() * 900)}`,
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
    setLineItems((prev) => [...prev, nextItem]);
  };

  const handleAddLineItem = () => {
    const nextItem: LineItem = {
      id: `inv-li-${Date.now().toString(36)}`,
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
    setLineItems((prev) => [...prev, nextItem]);
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

  const buildInvoicePayload = (): TaxInvoice => ({
    id: activeInvoiceId || `inv-${Date.now().toString(36)}`,
    tenantId,
    invoiceNumber: invoiceNumber.trim() || 'INV-0001',
    title: title.trim() || `Invoice ${invoiceNumber}`,
    accountId: clientDetails.accountId || resolvedDefaultAccountId || null,
    projectId: projectId || resolvedDefaultProjectId || null,
    quoteId,
    quoteNumber,
    poNumber: poNumber.trim(),
    status,
    currency,
    taxMode,
    vatRate: effectiveVatRate,
    discountTotal: financialSummary.discountTotal,
    subtotalExclVat: financialSummary.subtotalExclVat,
    vatAmount: financialSummary.vatAmount,
    totalInclVat: financialSummary.totalInclVat,
    amountPaid,
    issueDate,
    dueDate,
    paymentTermsPreset,
    lineItems,
    businessDetails,
    clientDetails,
    paymentTerms,
    termsAndConditions,
    payments,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const handleSaveInvoice = async () => {
    setIsSaving(true);
    try {
      const payload = buildInvoicePayload();
      const saved = await saveInvoice(payload, isNewMode);
      setStatus(saved.status);
      setInvoices((prev) => [saved, ...prev.filter((i) => i.id !== saved.id)]);
      showBanner(`Invoice ${saved.invoiceNumber} saved.`);
      if (isEmbeddedCreate && onEmbeddedSaved) {
        onEmbeddedSaved(saved);
      } else if (isNewMode) {
        navigate(`/catalog/invoices/${saved.id}`, { replace: true });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleRecordPayment = async (
    payment: Omit<InvoicePaymentRecord, 'id' | 'recordedAt'>
  ) => {
    const target = paymentTargetInvoice || buildInvoicePayload();
    if (isNewMode) {
      await saveInvoice(target, true);
    }
    const updated = await recordInvoicePayment(target.id, payment, tenantId);
    if (updated) {
      setInvoices((prev) => [updated, ...prev.filter((i) => i.id !== updated.id)]);
      if (isEditorView && updated.id === activeInvoiceId) {
        hydrateEditorFromInvoice(updated);
      }
      showBanner(
        `Recorded ${formatSaQuoteCurrency(payment.amount, updated.currency)} payment.`
      );
    }
  };

  const handleDeleteRow = async (inv: TaxInvoice) => {
    if (!window.confirm(`Delete Invoice ${inv.invoiceNumber}?`)) return;
    await deleteInvoice(inv.id, tenantId);
    setInvoices((prev) => prev.filter((row) => row.id !== inv.id));
    showBanner(`Deleted ${inv.invoiceNumber}.`);
  };

  const summary = useMemo(() => {
    let billed = 0;
    let paid = 0;
    let outstanding = 0;
    for (const inv of invoices) {
      if (inv.status === 'VOID') continue;
      const total = Number(inv.totalInclVat || 0);
      const settled = Number(inv.amountPaid || 0);
      billed = bankersRound2(billed + total);
      paid = bankersRound2(paid + settled);
      outstanding = bankersRound2(outstanding + Math.max(0, total - settled));
    }
    return { billed, paid, outstanding };
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        inv.invoiceNumber.toLowerCase().includes(q) ||
        (inv.title || '').toLowerCase().includes(q) ||
        (inv.clientDetails?.clientName || '').toLowerCase().includes(q);

      if (statusFilter === 'OVERDUE') return matchesSearch && isInvoiceOverdue(inv);
      if (statusFilter !== 'ALL') return matchesSearch && inv.status === statusFilter;
      return matchesSearch;
    });
  }, [invoices, searchQuery, statusFilter]);

  const balanceDue = Math.max(
    0,
    bankersRound2(financialSummary.totalInclVat - amountPaid)
  );

  // =========================================================================
  // RENDER: SIMPLE INVOICE EDITOR / PREVIEW
  // =========================================================================
  if (isEditorView) {
    return (
      <div className="space-y-4 max-w-6xl mx-auto pb-12 animate-fade-in">
        {/* Compact Header */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              <button
                type="button"
                onClick={() =>
                  isEmbeddedCreate && onEmbeddedCancel
                    ? onEmbeddedCancel()
                    : navigate('/catalog/invoices')
                }
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                title="Back to Invoices"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-28 text-xs font-mono px-2.5 py-1.5 rounded-xl bg-slate-800 text-emerald-300 border border-slate-700 font-bold"
              />
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Invoice Title..."
                className="flex-1 min-w-[200px] text-base font-bold text-slate-100 bg-transparent border-b border-slate-800 focus:border-indigo-500 focus:outline-none px-1 py-1"
              />
              {quoteId && (
                <button
                  type="button"
                  onClick={() => navigate(`/catalog/quotes/${quoteId}`)}
                  className="text-[11px] font-mono text-indigo-300 hover:text-indigo-200 flex items-center gap-1"
                >
                  <span>Quote {quoteNumber || quoteId}</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaxInvoiceStatus)}
                className="text-xs font-medium px-3 py-1.5 rounded-xl border bg-slate-800 text-slate-200 border-slate-700"
              >
                <option value="DRAFT">Draft</option>
                <option value="ISSUED">Issued</option>
                <option value="PARTIALLY_PAID">Partially Paid</option>
                <option value="PAID">Paid</option>
                <option value="VOID">Void</option>
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

              {status !== 'PAID' && status !== 'VOID' && balanceDue > 0 && (
                <button
                  type="button"
                  onClick={() => setPaymentTargetInvoice(buildInvoicePayload())}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 flex items-center gap-1.5 transition"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Record Payment</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => void handleSaveInvoice()}
                disabled={isSaving}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 flex items-center gap-1.5 disabled:opacity-50 transition"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving...' : 'Save'}</span>
              </button>
            </div>
          </div>
        </div>

        {bannerMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{bannerMsg}</span>
          </div>
        )}

        {viewMode === 'preview' ? (
          <DocumentPreviewCard
            mode="invoice"
            documentNumber={invoiceNumber}
            title={title || `Invoice ${invoiceNumber}`}
            status={status}
            currency={currency}
            taxMode={taxMode}
            issueDate={issueDate}
            dueDateOrValidUntil={dueDate}
            referenceNumber={poNumber}
            sourceQuoteNumber={quoteNumber}
            businessDetails={businessDetails}
            clientDetails={clientDetails}
            lineItems={lineItems}
            subtotalExclVat={financialSummary.subtotalExclVat}
            discountTotal={financialSummary.discountTotal}
            vatAmount={financialSummary.vatAmount}
            totalInclVat={financialSummary.totalInclVat}
            amountPaid={amountPaid}
            paymentTerms={paymentTerms}
            termsAndConditions={termsAndConditions}
          />
        ) : (
          <>
            {/* Dates, Business & Client Details */}
            <DocumentPartiesAndDatesSection
              mode="invoice"
              issueDate={issueDate}
              onIssueDateChange={setIssueDate}
              dueDate={dueDate}
              onDueDateChange={setDueDate}
              paymentTermsPreset={paymentTermsPreset}
              onPaymentTermsPresetChange={setPaymentTermsPreset}
              referenceNumber={poNumber}
              onReferenceNumberChange={setPoNumber}
              businessDetails={businessDetails}
              onBusinessDetailsChange={setBusinessDetails}
              onSaveBusinessDefault={() => {
                saveDefaultBusinessDetails(businessDetails);
                setBusinessSavedNotice(true);
                setTimeout(() => setBusinessSavedNotice(false), 3000);
              }}
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
                      <th className="py-3 px-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs">
                    {lineItems.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-10 text-center text-slate-500">
                          <Receipt className="w-7 h-7 mx-auto mb-2 text-slate-600" />
                          <p className="text-slate-400 font-medium">No items added yet</p>
                          <p className="text-[11px] text-slate-500 mt-1">
                            Click &quot;Add Line Item&quot; to add billable items.
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
                              onChange={(e) =>
                                handleUpdateLine(item.id, 'productName', e.target.value)
                              }
                              placeholder="Item or service name..."
                              className="w-full font-semibold text-slate-100 bg-transparent border-b border-transparent hover:border-slate-700 focus:border-indigo-500 focus:outline-none py-0.5"
                            />
                            <input
                              type="text"
                              value={item.notes || ''}
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
                            {formatSaQuoteCurrency(item.totalPrice, currency)}
                          </td>

                          <td className="py-3 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveLine(item.id)}
                              className="p-1.5 rounded-lg hover:bg-rose-500/10 text-slate-500 hover:text-rose-400"
                              title="Remove"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Terms, Recorded Payments & Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 space-y-4">
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                  <div className="text-xs font-semibold text-slate-200">Terms</div>
                  <input
                    type="text"
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    placeholder="Payment terms (e.g. EFT within 30 days)..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs"
                  />
                  <textarea
                    value={termsAndConditions}
                    onChange={(e) => setTermsAndConditions(e.target.value)}
                    rows={3}
                    placeholder="Terms & conditions..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs resize-none"
                  />
                </div>

                {payments.length > 0 && (
                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
                    <div className="text-xs font-semibold text-slate-200">
                      Recorded Payments ({payments.length})
                    </div>
                    {payments.map((pay) => (
                      <div
                        key={pay.id}
                        className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div className="text-slate-300">
                          {pay.paymentDate} • {pay.paymentMethod}
                          {pay.reference ? ` (${pay.reference})` : ''}
                        </div>
                        <span className="font-mono font-bold text-emerald-400">
                          +{formatSaQuoteCurrency(pay.amount, currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 h-fit">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
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
                        -{formatSaQuoteCurrency(financialSummary.discountTotal, currency)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Subtotal:</span>
                    <span className="text-slate-200">
                      {formatSaQuoteCurrency(financialSummary.subtotalExclVat, currency)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>
                      VAT ({taxMode === 'ZERO_RATED' || taxMode === 'EXEMPT' ? '0%' : '15%'}):
                    </span>
                    <span className="text-slate-200">
                      {formatSaQuoteCurrency(financialSummary.vatAmount, currency)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-bold text-slate-100 pt-2 border-t border-slate-800">
                    <span>Total:</span>
                    <span className="text-indigo-400 text-base">
                      {formatSaQuoteCurrency(financialSummary.totalInclVat, currency)}
                    </span>
                  </div>
                  {amountPaid > 0 && (
                    <div className="flex items-center justify-between text-emerald-400">
                      <span>Paid:</span>
                      <span>-{formatSaQuoteCurrency(amountPaid, currency)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm font-bold text-amber-300 pt-2 border-t border-slate-800">
                    <span>Balance Due:</span>
                    <span>{formatSaQuoteCurrency(balanceDue, currency)}</span>
                  </div>
                </div>
              </div>
            </div>
          </>
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
  }

  // =========================================================================
  // RENDER: SIMPLE INVOICES LIST
  // =========================================================================
  return (
    <div className="space-y-5 max-w-6xl mx-auto pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <Receipt className="w-5 h-5 text-emerald-400" />
          Invoices
        </h1>

        <div className="flex flex-wrap items-center gap-2">
          {quotes.length > 0 && (
            <select
              defaultValue=""
              onChange={(e) => {
                const match = quotes.find((q) => q.id === e.target.value);
                if (match) {
                  setQuoteToConvert(match);
                  e.target.value = '';
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs"
            >
              <option value="" disabled>
                From Quote...
              </option>
              {quotes.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.quoteNumber} — {q.title || 'Untitled'}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={() => navigate('/catalog/invoices/new')}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 flex items-center gap-1.5 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Invoice</span>
          </button>
        </div>
      </div>

      {bannerMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{bannerMsg}</span>
        </div>
      )}

      {/* Simple Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">Total Billed</span>
          <span className="text-sm font-bold font-mono text-slate-100">
            {formatSaQuoteCurrency(summary.billed, 'ZAR')}
          </span>
        </div>
        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">Paid</span>
          <span className="text-sm font-bold font-mono text-emerald-400">
            {formatSaQuoteCurrency(summary.paid, 'ZAR')}
          </span>
        </div>
        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">Outstanding</span>
          <span className="text-sm font-bold font-mono text-amber-300">
            {formatSaQuoteCurrency(summary.outstanding, 'ZAR')}
          </span>
        </div>
      </div>

      {/* Search & Status Filter */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search invoices..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as InvoiceStatusFilter)}
          className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs"
        >
          <option value="ALL">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="ISSUED">Issued</option>
          <option value="PARTIALLY_PAID">Partially Paid</option>
          <option value="PAID">Paid</option>
          <option value="OVERDUE">Overdue</option>
          <option value="VOID">Void</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-medium text-slate-400">
                <th className="py-3 px-4">Invoice</th>
                <th className="py-3 px-3">Client</th>
                <th className="py-3 px-3">Due Date</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Total</th>
                <th className="py-3 px-3 text-right">Balance</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-xs">
              {loadingList ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    Loading...
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-500">
                    No invoices yet. Click &quot;New Invoice&quot; to create one.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const overdue = isInvoiceOverdue(inv);
                  const rowBalance = Math.max(
                    0,
                    bankersRound2(
                      Number(inv.totalInclVat || 0) - Number(inv.amountPaid || 0)
                    )
                  );
                  const canPay =
                    inv.status !== 'PAID' && inv.status !== 'VOID' && rowBalance > 0;

                  return (
                    <tr key={inv.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => navigate(`/catalog/invoices/${inv.id}`)}
                          className="font-mono font-bold text-indigo-300 hover:text-indigo-200 block text-left"
                        >
                          {inv.invoiceNumber}
                        </button>
                        {inv.title && (
                          <div className="text-[11px] text-slate-400">{inv.title}</div>
                        )}
                      </td>

                      <td className="py-3 px-3 text-slate-200">
                        {inv.clientDetails?.clientName || '—'}
                      </td>

                      <td className="py-3 px-3 font-mono text-[11px]">
                        <span className={overdue ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                          {inv.dueDate?.slice(0, 10) || '—'}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={clsx(
                            'px-2 py-0.5 rounded-full font-mono text-[10px] font-semibold border',
                            inv.status === 'PAID'
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : inv.status === 'PARTIALLY_PAID'
                                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                : inv.status === 'VOID'
                                  ? 'bg-slate-800 text-slate-400 border-slate-700'
                                  : overdue
                                    ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                                    : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                          )}
                        >
                          {overdue && inv.status !== 'PAID' ? 'OVERDUE' : inv.status}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-slate-200">
                        {formatSaQuoteCurrency(Number(inv.totalInclVat || 0), inv.currency)}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-amber-300">
                        {formatSaQuoteCurrency(rowBalance, inv.currency)}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => navigate(`/catalog/invoices/${inv.id}`)}
                            className="text-xs text-indigo-300 hover:text-indigo-200 font-medium"
                          >
                            Open
                          </button>
                          {canPay && (
                            <button
                              type="button"
                              onClick={() => setPaymentTargetInvoice(inv)}
                              className="px-2 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold"
                            >
                              Pay
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => void handleDeleteRow(inv)}
                            className="p-1 rounded-lg hover:bg-rose-500/10 text-slate-500 hover:text-rose-400"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {paymentTargetInvoice && (
        <RecordPaymentModal
          isOpen={Boolean(paymentTargetInvoice)}
          onClose={() => setPaymentTargetInvoice(null)}
          invoice={paymentTargetInvoice}
          onSubmitPayment={handleRecordPayment}
        />
      )}

      {quoteToConvert && (
        <QuoteToInvoiceModal
          isOpen={Boolean(quoteToConvert)}
          onClose={() => setQuoteToConvert(null)}
          quote={quoteToConvert}
          onConverted={(createdInv) => {
            setInvoices((prev) => [
              createdInv,
              ...prev.filter((i) => i.id !== createdInv.id),
            ]);
          }}
        />
      )}
    </div>
  );
};

export default InvoiceSystemView;
