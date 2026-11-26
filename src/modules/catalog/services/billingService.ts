import { apiClient } from '../../../services/api';
import { formatCurrencyAmount } from '../../../context/CurrencyContext';
import {
  BusinessDetails,
  ClientBillingDetails,
  InvoicePaymentRecord,
  LineItem,
  PaymentTermsPreset,
  Project,
  Quote,
  SaTaxMode,
  TaxInvoice,
  TaxInvoiceStatus,
} from '../../../types';
import { Account, Contact, Deal } from '../../../types/crmEntities';

export const QUOTE_CURRENCIES = [
  { code: 'ZAR', symbol: 'R', defaultFxToZar: 1.0, label: 'ZAR (R) – South African Rand' },
  { code: 'USD', symbol: '$', defaultFxToZar: 18.5, label: 'USD ($) – US Dollar' },
  { code: 'EUR', symbol: '€', defaultFxToZar: 20.1, label: 'EUR (€) – Euro' },
  { code: 'GBP', symbol: '£', defaultFxToZar: 23.4, label: 'GBP (£) – British Pound' },
] as const;

export const VAT_MODES: Array<{ mode: SaTaxMode; label: string; badge: string }> = [
  { mode: 'EXCLUSIVE', label: 'Excl. 15% VAT', badge: '+15%' },
  { mode: 'INCLUSIVE', label: 'Incl. 15% VAT', badge: '÷1.15' },
  { mode: 'ZERO_RATED', label: 'Zero-Rated', badge: '0%' },
  { mode: 'EXEMPT', label: 'Exempt', badge: 'EXEMPT' },
];

export const PAYMENT_TERMS_PRESETS: Array<{
  value: PaymentTermsPreset;
  label: string;
  days: number | null;
}> = [
  { value: 'due_on_receipt', label: 'Due on Receipt', days: 0 },
  { value: 'net_7', label: 'Net 7 Days', days: 7 },
  { value: 'net_14', label: 'Net 14 Days', days: 14 },
  { value: 'net_30', label: 'Net 30 Days', days: 30 },
  { value: 'net_60', label: 'Net 60 Days', days: 60 },
  { value: 'custom', label: 'Custom Due Date', days: null },
];

export const DEFAULT_BUSINESS_DETAILS: BusinessDetails = {
  companyName: '',
  registrationNumber: '',
  vatNumber: '',
  email: '',
  phone: '',
  website: '',
  address: '',
  bankName: '',
  accountHolder: '',
  accountNumber: '',
  branchCode: '',
  swiftCode: '',
};

export const DEFAULT_CLIENT_DETAILS: ClientBillingDetails = {
  accountId: null,
  contactId: null,
  clientName: '',
  contactName: '',
  email: '',
  phone: '',
  vatNumber: '',
  registrationNumber: '',
  billingAddress: '',
};

export const DEFAULT_QUOTE_PAYMENT_TERMS = '';

export const DEFAULT_QUOTE_TERMS = '';

export const DEFAULT_INVOICE_PAYMENT_TERMS = '';

export const DEFAULT_INVOICE_TERMS = '';

/**
 * Deterministic Banker's Rounding (Round Half to Even) to 2 decimal places.
 */
export function bankersRound2(val: number): number {
  const num = Number.isFinite(val) ? val : 0;
  const scaled = num * 100;
  const floor = Math.floor(scaled);
  const diff = scaled - floor;
  const eps = 1e-9;

  if (Math.abs(diff - 0.5) < eps) {
    return (floor % 2 === 0 ? floor : floor + 1) / 100;
  }
  return Math.round(scaled) / 100;
}

export function formatSaQuoteCurrency(amount: number, currencyCode = 'ZAR'): string {
  if (currencyCode === 'ZAR') {
    const rounded = bankersRound2(amount);
    const neg = rounded < 0 ? '-' : '';
    const [intPart, decPart] = Math.abs(rounded).toFixed(2).split('.');
    return `${neg}R ${intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}.${decPart}`;
  }
  return formatCurrencyAmount(amount, currencyCode, { decimals: 2 });
}

export function computeLineAmounts(
  qty: number,
  unitPrice: number,
  discountAmount: number,
  mode: SaTaxMode
): { taxAmount: number; totalPrice: number } {
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
}

export interface FinancialRollup {
  rawLineGross: number;
  discountTotal: number;
  subtotalExclVat: number;
  vatAmount: number;
  totalInclVat: number;
  totalCost: number;
  marginAmount: number;
  marginPercent: number;
  erodedLinesCount: number;
}

export function computeFinancialRollup(
  lineItems: LineItem[],
  taxMode: SaTaxMode,
  targetMarginFloor = 25
): FinancialRollup {
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
    const lineExcl = taxMode === 'INCLUSIVE' ? bankersRound2(netLine / 1.15) : netLine;
    const lineMarginPct = lineExcl > 0 ? ((lineExcl - itemCostTotal) / lineExcl) * 100 : 0;
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
    subtotalExclVat > 0 ? Number(((marginAmount / subtotalExclVat) * 100).toFixed(1)) : 0;

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
}

export function todayIsoDate(): string {
  return new Date().toISOString().split('T')[0];
}

export function addDaysToIsoDate(isoDate: string, days: number): string {
  const base = isoDate ? new Date(`${isoDate.slice(0, 10)}T00:00:00Z`) : new Date();
  if (Number.isNaN(base.getTime())) {
    return new Date(Date.now() + days * 86400000).toISOString().split('T')[0];
  }
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString().split('T')[0];
}

export function computeDueDateFromPreset(
  issueDate: string,
  preset: PaymentTermsPreset,
  currentDueDate?: string
): string {
  const match = PAYMENT_TERMS_PRESETS.find((p) => p.value === preset);
  if (!match || match.days === null) {
    return currentDueDate ? currentDueDate.slice(0, 10) : addDaysToIsoDate(issueDate, 30);
  }
  return addDaysToIsoDate(issueDate, match.days);
}

export function isInvoiceOverdue(invoice: TaxInvoice): boolean {
  if (invoice.status === 'PAID' || invoice.status === 'VOID' || invoice.status === 'DRAFT') {
    return false;
  }
  const balance = Number(invoice.totalInclVat || 0) - Number(invoice.amountPaid || 0);
  if (balance <= 0.01) return false;
  if (!invoice.dueDate) return false;
  return invoice.dueDate.slice(0, 10) < todayIsoDate();
}

const BUSINESS_PROFILE_STORAGE_KEY = 'shogun_billing_business_profile';
const QUOTES_STORAGE_PREFIX = 'shogun_catalog_quotes_';
const INVOICES_STORAGE_PREFIX = 'shogun_catalog_invoices_';

function readStorageJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeStorageJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota issues
  }
}

export function saveDefaultBusinessDetails(details: BusinessDetails): void {
  writeStorageJson(BUSINESS_PROFILE_STORAGE_KEY, details);
}

export async function loadDefaultBusinessDetails(
  tenantName?: string
): Promise<BusinessDetails> {
  const stored = readStorageJson<Partial<BusinessDetails>>(BUSINESS_PROFILE_STORAGE_KEY);
  let companyFromSettings: Record<string, any> | null = null;
  try {
    const sys = await apiClient.get<any>('/settings/system').catch(() => null);
    companyFromSettings = sys?.companyDetails || null;
  } catch {
    companyFromSettings = null;
  }

  return {
    ...DEFAULT_BUSINESS_DETAILS,
    ...(companyFromSettings?.name ? { companyName: companyFromSettings.name } : {}),
    ...(companyFromSettings?.domain
      ? {
          website: companyFromSettings.domain.startsWith('http')
            ? companyFromSettings.domain
            : `https://${companyFromSettings.domain}`,
        }
      : {}),
    ...(tenantName && !companyFromSettings?.name ? { companyName: tenantName } : {}),
    ...(stored || {}),
  };
}

export interface CrmBillingDirectory {
  accounts: Account[];
  contacts: Contact[];
  deals: Deal[];
  projects: Project[];
}

export async function loadCrmBillingDirectory(): Promise<CrmBillingDirectory> {
  const [accountsRes, contactsRes, dealsRes, projectsRes] = await Promise.all([
    apiClient.get<Account[]>('/crm/accounts').catch(() => []),
    apiClient.get<Contact[]>('/crm/contacts').catch(() => []),
    apiClient.get<Deal[]>('/crm/deals').catch(() => []),
    apiClient.get<Project[]>('/projects').catch(() => []),
  ]);

  return {
    accounts: Array.isArray(accountsRes) ? accountsRes : [],
    contacts: Array.isArray(contactsRes) ? contactsRes : [],
    deals: Array.isArray(dealsRes) ? dealsRes : [],
    projects: Array.isArray(projectsRes) ? projectsRes : [],
  };
}

function mergeById<T extends { id: string }>(remote: T[], local: T[]): T[] {
  const map = new Map<string, T>();
  for (const item of local) {
    map.set(item.id, item);
  }
  for (const item of remote) {
    const prev = map.get(item.id);
    map.set(item.id, prev ? { ...prev, ...item } : item);
  }
  return Array.from(map.values());
}

export async function listQuotes(tenantId = 'tenant-default'): Promise<Quote[]> {
  const storageKey = `${QUOTES_STORAGE_PREFIX}${tenantId}`;
  const local = (readStorageJson<Quote[]>(storageKey) || []).filter(
    (q) => q.id !== 'qt-sample-1001'
  );
  try {
    const remote = await apiClient.get<Quote[]>('/catalog/quotes');
    if (Array.isArray(remote) && remote.length > 0) {
      const merged = mergeById(remote, local);
      writeStorageJson(storageKey, merged);
      return merged;
    }
  } catch {
    // Fallback to local cache
  }

  writeStorageJson(storageKey, local);
  return local;
}

export async function getQuote(
  id: string,
  tenantId = 'tenant-default'
): Promise<Quote | null> {
  try {
    const remote = await apiClient.get<Quote>(`/catalog/quotes/${encodeURIComponent(id)}`);
    if (remote && remote.id) return remote;
  } catch {
    // Fallback to list search
  }
  const all = await listQuotes(tenantId);
  return all.find((q) => q.id === id) || null;
}

export async function saveQuote(quote: Quote): Promise<Quote> {
  const tenantId = quote.tenantId || 'tenant-default';
  const storageKey = `${QUOTES_STORAGE_PREFIX}${tenantId}`;
  let saved = quote;

  try {
    const res = await apiClient.post<Quote>('/catalog/quotes', quote);
    if (res && res.id) {
      saved = { ...quote, ...res };
    }
  } catch {
    // Persist locally when offline / DB unavailable
  }

  const existing = readStorageJson<Quote[]>(storageKey) || [];
  const next = [saved, ...existing.filter((q) => q.id !== saved.id)];
  writeStorageJson(storageKey, next);
  return saved;
}

export async function deleteQuote(
  id: string,
  tenantId = 'tenant-default'
): Promise<void> {
  const storageKey = `${QUOTES_STORAGE_PREFIX}${tenantId}`;
  try {
    await apiClient.delete(`/catalog/quotes/${encodeURIComponent(id)}`);
  } catch {
    // Ignore API failure and update local cache
  }
  const existing = readStorageJson<Quote[]>(storageKey) || [];
  writeStorageJson(
    storageKey,
    existing.filter((q) => q.id !== id)
  );
}

export async function listInvoices(tenantId = 'tenant-default'): Promise<TaxInvoice[]> {
  const storageKey = `${INVOICES_STORAGE_PREFIX}${tenantId}`;
  const local = (readStorageJson<TaxInvoice[]>(storageKey) || []).filter(
    (inv) => inv.id !== 'inv-sample-0001'
  );

  try {
    const remote = await apiClient.get<TaxInvoice[]>('/catalog/tax-invoices');
    if (Array.isArray(remote) && remote.length > 0) {
      const merged = mergeById(remote, local);
      writeStorageJson(storageKey, merged);
      return merged;
    }
  } catch {
    // Fallback to local cache
  }

  writeStorageJson(storageKey, local);
  return local;
}

export async function getInvoice(
  id: string,
  tenantId = 'tenant-default'
): Promise<TaxInvoice | null> {
  try {
    const remote = await apiClient.get<TaxInvoice>(
      `/catalog/tax-invoices/${encodeURIComponent(id)}`
    );
    if (remote && remote.id) return remote;
  } catch {
    // Fallback to local list
  }
  const all = await listInvoices(tenantId);
  return all.find((inv) => inv.id === id) || null;
}

export async function saveInvoice(
  invoice: TaxInvoice,
  isNew = false
): Promise<TaxInvoice> {
  const tenantId = invoice.tenantId || 'tenant-default';
  const storageKey = `${INVOICES_STORAGE_PREFIX}${tenantId}`;
  let saved: TaxInvoice = {
    ...invoice,
    updatedAt: new Date().toISOString(),
  };

  try {
    const res = isNew
      ? await apiClient.post<TaxInvoice>('/catalog/tax-invoices', invoice)
      : await apiClient.put<TaxInvoice>(
          `/catalog/tax-invoices/${encodeURIComponent(invoice.id)}`,
          invoice
        );
    if (res && res.id) {
      saved = { ...saved, ...res };
    }
  } catch {
    if (!isNew) {
      try {
        const created = await apiClient.post<TaxInvoice>('/catalog/tax-invoices', invoice);
        if (created && created.id) {
          saved = { ...saved, ...created };
        }
      } catch {
        // Persist locally if backend unavailable
      }
    }
  }

  const existing = readStorageJson<TaxInvoice[]>(storageKey) || [];
  const next = [saved, ...existing.filter((inv) => inv.id !== saved.id)];
  writeStorageJson(storageKey, next);
  return saved;
}

export async function deleteInvoice(
  id: string,
  tenantId = 'tenant-default'
): Promise<void> {
  const storageKey = `${INVOICES_STORAGE_PREFIX}${tenantId}`;
  try {
    await apiClient.delete(`/catalog/tax-invoices/${encodeURIComponent(id)}`);
  } catch {
    // Ignore API failure and clean local cache
  }
  const existing = readStorageJson<TaxInvoice[]>(storageKey) || [];
  writeStorageJson(
    storageKey,
    existing.filter((inv) => inv.id !== id)
  );
}

export async function recordInvoicePayment(
  invoiceId: string,
  payment: Omit<InvoicePaymentRecord, 'id' | 'recordedAt'>,
  tenantId = 'tenant-default'
): Promise<TaxInvoice | null> {
  const storageKey = `${INVOICES_STORAGE_PREFIX}${tenantId}`;
  try {
    const remote = await apiClient.post<TaxInvoice>(
      `/catalog/tax-invoices/${encodeURIComponent(invoiceId)}/payments`,
      payment
    );
    if (remote && remote.id) {
      const existing = readStorageJson<TaxInvoice[]>(storageKey) || [];
      writeStorageJson(storageKey, [remote, ...existing.filter((i) => i.id !== remote.id)]);
      return remote;
    }
  } catch {
    // Fallback to local calculation
  }

  const current = await getInvoice(invoiceId, tenantId);
  if (!current) return null;

  const totalIncl = Number(current.totalInclVat || 0);
  const nextPaid = bankersRound2(
    Math.min(totalIncl, Number(current.amountPaid || 0) + Number(payment.amount || 0))
  );
  const nextStatus: TaxInvoiceStatus =
    nextPaid >= totalIncl - 0.01 ? 'PAID' : nextPaid > 0 ? 'PARTIALLY_PAID' : current.status;

  const newRecord: InvoicePaymentRecord = {
    id: `pay-${Date.now().toString(36)}`,
    amount: Number(payment.amount || 0),
    paymentDate: payment.paymentDate || todayIsoDate(),
    paymentMethod: payment.paymentMethod || 'EFT',
    reference: payment.reference || '',
    notes: payment.notes || '',
    recordedAt: new Date().toISOString(),
  };

  const updated: TaxInvoice = {
    ...current,
    amountPaid: nextPaid,
    status: nextStatus,
    payments: [newRecord, ...(current.payments || [])],
    updatedAt: new Date().toISOString(),
  };

  const existing = readStorageJson<TaxInvoice[]>(storageKey) || [];
  writeStorageJson(storageKey, [updated, ...existing.filter((i) => i.id !== updated.id)]);
  return updated;
}

export async function convertQuoteToInvoice(params: {
  quote: Quote;
  billingPercentage?: number;
  invoiceNumber?: string;
  title?: string;
  issueDate?: string;
  dueDate?: string;
  paymentTermsPreset?: PaymentTermsPreset;
  poNumber?: string;
  status?: TaxInvoiceStatus;
  paymentTerms?: string;
  termsAndConditions?: string;
  notes?: string;
}): Promise<TaxInvoice> {
  const {
    quote,
    billingPercentage = 100,
    invoiceNumber,
    title,
    issueDate = todayIsoDate(),
    dueDate,
    paymentTermsPreset = 'net_30',
    poNumber,
    status = 'ISSUED',
    paymentTerms,
    termsAndConditions,
    notes,
  } = params;

  const tenantId = quote.tenantId || 'tenant-default';
  const ratio = Math.min(1, Math.max(0.01, billingPercentage / 100));
  const resolvedDueDate =
    dueDate || computeDueDateFromPreset(issueDate, paymentTermsPreset);
  const taxMode: SaTaxMode = quote.taxMode || 'EXCLUSIVE';

  // Ensure quote exists remotely first before attempting backend conversion endpoint
  const persistedQuote = await saveQuote(quote);

  try {
    const converted = await apiClient.post<TaxInvoice>(
      `/catalog/quotes/${encodeURIComponent(persistedQuote.id)}/convert-to-invoice`,
      {
        billingPercentage,
        invoiceNumber,
        title,
        issueDate,
        supplyDate: issueDate,
        dueDate: resolvedDueDate,
        paymentTermsPreset,
        poNumber: poNumber ?? quote.referenceNumber,
        status,
        taxMode,
        vatRate: quote.vatRate ?? 0.15,
        businessDetails: quote.businessDetails,
        clientDetails: quote.clientDetails,
        paymentTerms: paymentTerms ?? quote.paymentTerms ?? DEFAULT_INVOICE_PAYMENT_TERMS,
        termsAndConditions:
          termsAndConditions ?? quote.termsAndConditions ?? DEFAULT_INVOICE_TERMS,
        notes: notes ?? quote.notes,
      }
    );

    if (converted && converted.id) {
      const invStorageKey = `${INVOICES_STORAGE_PREFIX}${tenantId}`;
      const existingInvs = readStorageJson<TaxInvoice[]>(invStorageKey) || [];
      writeStorageJson(invStorageKey, [
        converted,
        ...existingInvs.filter((i) => i.id !== converted.id),
      ]);

      await saveQuote({
        ...persistedQuote,
        status: 'invoiced',
        linkedInvoiceId: converted.id,
        linkedInvoiceNumber: converted.invoiceNumber,
      });

      return converted;
    }
  } catch {
    // Fallback to client-side construction + saveInvoice
  }

  const scaledLines: LineItem[] = (quote.lineItems || []).map((item, idx) => {
    const scaledUnit = bankersRound2(item.unitPrice * ratio);
    const scaledDiscount = bankersRound2((item.discountAmount || 0) * ratio);
    const calc = computeLineAmounts(item.quantity, scaledUnit, scaledDiscount, taxMode);
    return {
      ...item,
      id: `inv-li-${Date.now().toString(36)}-${idx}`,
      unitPrice: scaledUnit,
      costPrice: item.costPrice !== undefined ? bankersRound2(item.costPrice * ratio) : 0,
      discountAmount: scaledDiscount,
      taxAmount: calc.taxAmount,
      totalPrice: calc.totalPrice,
    };
  });

  const rollup = computeFinancialRollup(scaledLines, taxMode, 25);
  const existingInvoices = await listInvoices(tenantId);
  const generatedNumber =
    invoiceNumber ||
    `INV-${String(existingInvoices.length + 1).padStart(4, '0')}`;

  const draftInvoice: TaxInvoice = {
    id: `inv-${Date.now().toString(36)}`,
    tenantId,
    invoiceNumber: generatedNumber,
    title:
      title ||
      (ratio < 1
        ? `${quote.title} (${Math.round(ratio * 100)}% Deposit)`
        : quote.title),
    accountId: quote.accountId || quote.clientDetails?.accountId || null,
    projectId: quote.projectId || null,
    quoteId: persistedQuote.id,
    quoteNumber: persistedQuote.quoteNumber,
    poNumber: poNumber ?? quote.referenceNumber ?? '',
    status,
    currency: quote.currency || 'ZAR',
    taxMode,
    vatRate: taxMode === 'ZERO_RATED' || taxMode === 'EXEMPT' ? 0 : 0.15,
    exchangeRateToZar: quote.exchangeRateToZar ?? 1,
    discountTotal: rollup.discountTotal,
    subtotalExclVat: rollup.subtotalExclVat,
    vatAmount: rollup.vatAmount,
    totalInclVat: rollup.totalInclVat,
    amountPaid: 0,
    issueDate,
    supplyDate: issueDate,
    dueDate: resolvedDueDate,
    paymentTermsPreset,
    lineItems: scaledLines,
    scopeSummary: quote.scopeSummary || '',
    businessDetails: quote.businessDetails || { ...DEFAULT_BUSINESS_DETAILS },
    clientDetails: quote.clientDetails || { ...DEFAULT_CLIENT_DETAILS },
    paymentTerms: paymentTerms ?? quote.paymentTerms ?? DEFAULT_INVOICE_PAYMENT_TERMS,
    termsAndConditions:
      termsAndConditions ?? quote.termsAndConditions ?? DEFAULT_INVOICE_TERMS,
    notes: notes ?? quote.notes ?? '',
    payments: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const savedInv = await saveInvoice(draftInvoice, true);
  await saveQuote({
    ...persistedQuote,
    status: 'invoiced',
    linkedInvoiceId: savedInv.id,
    linkedInvoiceNumber: savedInv.invoiceNumber,
  });

  return savedInv;
}
