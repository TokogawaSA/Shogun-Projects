import { Prisma } from '@prisma/client';
import type { SaTaxMode } from '../../services/saTaxService.js';

export type AccountingProvider = 'SAGE_ZA' | 'XERO';

export interface SageZaCredentials {
  apiKey: string;
  companyId: string | number;
  username: string;
  password: string;
}

export interface XeroCredentials {
  accessToken: string;
  refreshToken: string;
  xeroTenantId: string;
  clientId?: string;
  clientSecret?: string;
  /** Epoch milliseconds when accessToken expires */
  expiresAt?: number;
}

export interface VatTaxTypeMapping {
  standard15: string;
  zeroRated: string;
  exempt: string;
}

export interface AccountingCustomerInput {
  id: string;
  accountNumber?: string | null;
  accountName: string;
  email?: string | null;
  primaryPhone?: string | null;
  cipcRegistrationNumber?: string | null;
  vatRegistrationNumber?: string | null;
  csdSupplierNumber?: string | null;
  billingStreet?: string | null;
  billingCity?: string | null;
  billingPostalCode?: string | null;
  billingCountry?: string | null;
}

export interface AccountingInvoiceLineInput {
  description: string;
  quantity: number;
  unitPrice: number | string | Prisma.Decimal;
  discountAmount?: number | string | Prisma.Decimal;
  taxRatePercent?: number;
}

export interface AccountingTaxInvoiceInput {
  id: string;
  invoiceNumber: string;
  currency: string;
  taxMode?: SaTaxMode;
  subtotalExclVat: number | string | Prisma.Decimal;
  vatAmount: number | string | Prisma.Decimal;
  totalInclVat: number | string | Prisma.Decimal;
  dueDate: Date | string;
  issueDate?: Date | string;
  externalAccountingId?: string | null;
  account?: AccountingCustomerInput | null;
  lineItems?: AccountingInvoiceLineInput[];
}

export interface AccountingPaymentInput {
  id: string;
  merchantTransactionId: string;
  amount: number | string | Prisma.Decimal;
  currency: string;
  paymentMethod?: string | null;
  settledAt?: Date | string | null;
}

/**
 * Pluggable Outbound Accounting Strategy Interface (Section 3.5 System Specification).
 */
export interface AccountingAdapter {
  readonly provider: AccountingProvider;

  /**
   * Upsert CRM Account by CIPC Registration #, SARS VAT #, or Name and return external Customer/Contact ID.
   */
  syncCustomer(tenantId: string, account: AccountingCustomerInput): Promise<string>;

  /**
   * Create or update a SARS-compliant 15% VAT Tax Invoice and return external Invoice ID.
   */
  pushTaxInvoice(tenantId: string, taxInvoice: AccountingTaxInvoiceInput): Promise<string>;

  /**
   * Record a Peach Payments ZAR settlement receipt against the external Tax Invoice.
   */
  recordInvoicePayment(
    tenantId: string,
    taxInvoice: AccountingTaxInvoiceInput,
    paymentTx: AccountingPaymentInput
  ): Promise<string>;

  /**
   * Sync approved project supplier bills / ExpenseEntry records.
   */
  pushApprovedExpenses(tenantId: string, projectId: string): Promise<void>;

  /**
   * Verify connectivity and credentials against the external accounting API.
   */
  testConnection(tenantId: string): Promise<{ ok: boolean; companyName?: string }>;
}

/**
 * Parse `defaultVatTaxTypeId` (either a single 15% standard tax code string or a JSON map
 * `{ standard15, zeroRated, exempt }`) and resolve the provider TaxType ID for a given SARS `SaTaxMode`.
 */
export function resolveProviderVatTaxTypeId(
  configuredValue: string | null | undefined,
  taxMode: SaTaxMode = 'EXCLUSIVE',
  provider: AccountingProvider
): string {
  const defaults: VatTaxTypeMapping =
    provider === 'SAGE_ZA'
      ? { standard15: '1', zeroRated: '2', exempt: '3' }
      : {
          standard15: 'OUTPUT3',
          zeroRated: 'ZERORATEDOUTPUT',
          exempt: 'EXEMPTOUTPUT',
        };

  let mapping = { ...defaults };
  const raw = (configuredValue || '').trim();

  if (raw.startsWith('{')) {
    try {
      const parsed = JSON.parse(raw) as Partial<VatTaxTypeMapping>;
      mapping = {
        standard15: parsed.standard15 || defaults.standard15,
        zeroRated: parsed.zeroRated || defaults.zeroRated,
        exempt: parsed.exempt || defaults.exempt,
      };
    } catch {
      // Fall back to defaults
    }
  } else if (raw) {
    mapping.standard15 = raw;
  }

  if (taxMode === 'ZERO_RATED') return mapping.zeroRated;
  if (taxMode === 'EXEMPT') return mapping.exempt;
  return mapping.standard15;
}
