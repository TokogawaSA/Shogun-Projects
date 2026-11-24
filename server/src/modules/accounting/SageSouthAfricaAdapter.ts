import { Prisma } from '@prisma/client';
import { withTenantTx } from '../../utils/tenantTx.js';
import { bankersRound, calculateSaVat, type SaTaxMode } from '../../services/saTaxService.js';
import { decryptAccountingCredentials } from './accountingCrypto.js';
import {
  resolveProviderVatTaxTypeId,
  type AccountingAdapter,
  type AccountingCustomerInput,
  type AccountingPaymentInput,
  type AccountingTaxInvoiceInput,
  type SageZaCredentials,
} from './AccountingAdapter.js';

export const SAGE_ZA_API_BASE_URL = 'https://accounting.sageone.co.za/api/2.0.0';

export interface SageAdapterOptions {
  fetchImpl?: typeof fetch;
  baseUrl?: string;
}

/**
 * Sage Business Cloud Accounting South Africa (`https://accounting.sageone.co.za/api/2.0.0`) Adapter.
 * - Authenticates via HTTP Basic (`username:password` Base64) + `?apikey=...&companyid=...` query params.
 * - Enforces max 100 results/request pagination (`$top=100`).
 * - Maps `vatRegistrationNumber` -> `TaxReference` and `cipcRegistrationNumber` -> `TextField1` (UDF).
 */
export class SageSouthAfricaAdapter implements AccountingAdapter {
  public readonly provider = 'SAGE_ZA' as const;
  private readonly fetchFn: typeof fetch;
  private readonly baseUrl: string;

  constructor(options?: SageAdapterOptions) {
    this.fetchFn = options?.fetchImpl ?? globalThis.fetch;
    this.baseUrl = (options?.baseUrl ?? SAGE_ZA_API_BASE_URL).replace(/\/+$/, '');
  }

  private async loadConnection(tenantId: string) {
    const conn = await withTenantTx(tenantId, async (tx) => {
      return tx.tenantAccountingConnection.findUnique({
        where: {
          tenantId_provider: {
            tenantId,
            provider: 'SAGE_ZA',
          },
        },
      });
    });

    if (!conn || !conn.isActive) {
      throw new Error(`Active SAGE_ZA accounting connection not found for tenant "${tenantId}".`);
    }

    const creds = decryptAccountingCredentials<SageZaCredentials>(conn.encryptedCredentials);
    if (!creds.apiKey || creds.companyId === undefined || !creds.username || !creds.password) {
      throw new Error('Sage South Africa credentials require apiKey, companyId, username, and password.');
    }

    return { conn, creds };
  }

  public buildAuthenticatedUrl(
    endpointPath: string,
    creds: SageZaCredentials,
    extraParams?: Record<string, string | number>
  ): string {
    const normalizedPath = endpointPath.startsWith('/') ? endpointPath : `/${endpointPath}`;
    const url = new URL(`${this.baseUrl}${normalizedPath}`);
    url.searchParams.set('apikey', creds.apiKey);
    url.searchParams.set('companyid', String(creds.companyId));

    if (extraParams) {
      for (const [k, v] of Object.entries(extraParams)) {
        url.searchParams.set(k, String(v));
      }
    }

    return url.toString();
  }

  public buildAuthHeaders(creds: SageZaCredentials): Record<string, string> {
    const encodedBasic = Buffer.from(`${creds.username}:${creds.password}`, 'utf8').toString(
      'base64'
    );
    return {
      Authorization: `Basic ${encodedBasic}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };
  }

  private async sageRequest<T = any>(
    creds: SageZaCredentials,
    method: 'GET' | 'POST',
    endpointPath: string,
    body?: Record<string, unknown>,
    extraQuery?: Record<string, string | number>
  ): Promise<T> {
    const url = this.buildAuthenticatedUrl(endpointPath, creds, extraQuery);
    const headers = this.buildAuthHeaders(creds);

    const response = await this.fetchFn(url, {
      method,
      headers,
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(
        `Sage SA API ${method} ${endpointPath} failed (${response.status}): ${errText || response.statusText}`
      );
    }

    return (await response.json()) as T;
  }

  public async testConnection(
    tenantId: string
  ): Promise<{ ok: boolean; companyName?: string }> {
    const { creds } = await this.loadConnection(tenantId);
    const company = await this.sageRequest<any>(creds, 'GET', '/Company/Get');
    return {
      ok: true,
      companyName: company?.Name || `Sage ZA Company #${creds.companyId}`,
    };
  }

  public async syncCustomer(
    tenantId: string,
    account: AccountingCustomerInput
  ): Promise<string> {
    const { creds } = await this.loadConnection(tenantId);

    // Query up to 100 customers per Sage SA rate/page limit
    const existingListRes = await this.sageRequest<{ Results?: Array<Record<string, any>> }>(
      creds,
      'GET',
      '/Customer/Get',
      undefined,
      { $top: 100 }
    );

    const results = Array.isArray(existingListRes?.Results) ? existingListRes.Results : [];
    const matched = results.find(
      (c) =>
        (account.vatRegistrationNumber &&
          c.TaxReference &&
          String(c.TaxReference).trim() === account.vatRegistrationNumber.trim()) ||
        (account.cipcRegistrationNumber &&
          c.TextField1 &&
          String(c.TextField1).trim() === account.cipcRegistrationNumber.trim()) ||
        (c.Name && String(c.Name).toLowerCase() === account.accountName.toLowerCase())
    );

    const customerPayload: Record<string, unknown> = {
      ...(matched?.ID ? { ID: matched.ID } : {}),
      Name: account.accountName,
      TaxReference: account.vatRegistrationNumber || '',
      // Sage SA User-Defined Fields storing CIPC Registration & National Treasury CSD #
      TextField1: account.cipcRegistrationNumber || '',
      TextField2: account.csdSupplierNumber || '',
      Email: account.email || '',
      Telephone: account.primaryPhone || '',
      PostalAddress01: account.billingStreet || '',
      PostalAddress02: account.billingCity || '',
      PostalAddress05: account.billingPostalCode || '',
      Active: true,
    };

    const saved = await this.sageRequest<{ ID: number | string }>(
      creds,
      'POST',
      '/Customer/Save',
      customerPayload
    );

    return String(saved.ID);
  }

  public async pushTaxInvoice(
    tenantId: string,
    taxInvoice: AccountingTaxInvoiceInput
  ): Promise<string> {
    const { conn, creds } = await this.loadConnection(tenantId);
    const taxMode: SaTaxMode = taxInvoice.taxMode || 'EXCLUSIVE';
    const taxTypeIdNum = Number(
      resolveProviderVatTaxTypeId(conn.defaultVatTaxTypeId, taxMode, 'SAGE_ZA')
    ) || 1;
    const salesCategoryId = Number(conn.defaultSalesAccountCode) || 1;

    let customerId = 1;
    if (taxInvoice.account) {
      const extCustId = await this.syncCustomer(tenantId, taxInvoice.account);
      customerId = Number(extCustId) || 1;
    }

    const subtotalExcl = bankersRound(taxInvoice.subtotalExclVat, 2);
    const vatTotal = bankersRound(taxInvoice.vatAmount, 2);
    const grandTotal = bankersRound(taxInvoice.totalInclVat, 2);
    const taxPercentage = taxMode === 'ZERO_RATED' || taxMode === 'EXEMPT' ? 0 : 15;

    const lines =
      taxInvoice.lineItems && taxInvoice.lineItems.length > 0
        ? taxInvoice.lineItems.map((li) => {
            const qty = new Prisma.Decimal(li.quantity || 1);
            const rawLineGross = bankersRound(
              new Prisma.Decimal(li.unitPrice).mul(qty).sub(li.discountAmount || 0),
              2
            );
            const lineVat = calculateSaVat(rawLineGross, taxMode);
            const unitExcl = qty.gt(0)
              ? bankersRound(lineVat.decimals.subtotalExclVat.div(qty), 2)
              : lineVat.decimals.subtotalExclVat;

            return {
              SelectionId: salesCategoryId,
              TaxTypeId: taxTypeIdNum,
              Description: li.description,
              Quantity: Number(qty.toFixed(2)),
              UnitPriceExclusive: Number(unitExcl.toFixed(2)),
              TaxPercentage: taxPercentage,
              Exclusive: lineVat.subtotalExclVat,
              Tax: lineVat.vatAmount,
              Total: lineVat.totalInclVat,
            };
          })
        : [
            {
              SelectionId: salesCategoryId,
              TaxTypeId: taxTypeIdNum,
              Description: `SARS Tax Invoice ${taxInvoice.invoiceNumber}`,
              Quantity: 1,
              UnitPriceExclusive: Number(subtotalExcl.toFixed(2)),
              TaxPercentage: taxPercentage,
              Exclusive: Number(subtotalExcl.toFixed(2)),
              Tax: Number(vatTotal.toFixed(2)),
              Total: Number(grandTotal.toFixed(2)),
            },
          ];

    const issueDateIso = (
      taxInvoice.issueDate ? new Date(taxInvoice.issueDate) : new Date()
    )
      .toISOString()
      .slice(0, 10);
    const dueDateIso = new Date(taxInvoice.dueDate).toISOString().slice(0, 10);

    const invoicePayload: Record<string, unknown> = {
      ...(taxInvoice.externalAccountingId && /^\d+$/.test(taxInvoice.externalAccountingId)
        ? { ID: Number(taxInvoice.externalAccountingId) }
        : {}),
      CustomerId: customerId,
      DocumentNumber: taxInvoice.invoiceNumber,
      Date: issueDateIso,
      DueDate: dueDateIso,
      Inclusive: taxMode === 'INCLUSIVE',
      Exclusive: Number(subtotalExcl.toFixed(2)),
      Tax: Number(vatTotal.toFixed(2)),
      Total: Number(grandTotal.toFixed(2)),
      Lines: lines,
    };

    const saved = await this.sageRequest<{ ID: number | string }>(
      creds,
      'POST',
      '/TaxInvoice/Save',
      invoicePayload
    );

    return String(saved.ID);
  }

  public async recordInvoicePayment(
    tenantId: string,
    taxInvoice: AccountingTaxInvoiceInput,
    paymentTx: AccountingPaymentInput
  ): Promise<string> {
    const { creds } = await this.loadConnection(tenantId);
    const settledIso = (
      paymentTx.settledAt ? new Date(paymentTx.settledAt) : new Date()
    )
      .toISOString()
      .slice(0, 10);
    const amountDec = bankersRound(paymentTx.amount, 2);

    const receiptPayload: Record<string, unknown> = {
      Reference: paymentTx.merchantTransactionId,
      Description: `Peach Payments (${paymentTx.paymentMethod || 'ZAR'}) for ${taxInvoice.invoiceNumber}`,
      Date: settledIso,
      Total: Number(amountDec.toFixed(2)),
      TaxInvoiceId: taxInvoice.externalAccountingId
        ? Number(taxInvoice.externalAccountingId) || undefined
        : undefined,
    };

    const saved = await this.sageRequest<{ ID: number | string }>(
      creds,
      'POST',
      '/CustomerReceipt/Save',
      receiptPayload
    );

    return String(saved.ID);
  }

  public async pushApprovedExpenses(tenantId: string, projectId: string): Promise<void> {
    const { conn, creds } = await this.loadConnection(tenantId);
    const taxTypeIdNum = Number(
      resolveProviderVatTaxTypeId(conn.defaultVatTaxTypeId, 'EXCLUSIVE', 'SAGE_ZA')
    ) || 1;

    const approvedExpenses = await withTenantTx(tenantId, async (tx) => {
      return tx.expenseEntry.findMany({
        where: {
          tenantId,
          projectId,
          status: 'approved',
        },
      });
    });

    for (const expense of approvedExpenses) {
      const vatCalc = calculateSaVat(expense.amount, 'INCLUSIVE');
      await this.sageRequest(creds, 'POST', '/SupplierInvoice/Save', {
        Reference: `EXP-${expense.id.slice(0, 10)}`,
        Date: expense.incurredDate.toISOString().slice(0, 10),
        DueDate: expense.incurredDate.toISOString().slice(0, 10),
        Inclusive: true,
        Exclusive: vatCalc.subtotalExclVat,
        Tax: vatCalc.vatAmount,
        Total: vatCalc.totalInclVat,
        Lines: [
          {
            Description: `Project ${projectId} Expense (${expense.category})`,
            Quantity: 1,
            UnitPriceExclusive: vatCalc.subtotalExclVat,
            TaxTypeId: taxTypeIdNum,
            TaxPercentage: 15,
            Exclusive: vatCalc.subtotalExclVat,
            Tax: vatCalc.vatAmount,
            Total: vatCalc.totalInclVat,
          },
        ],
      });
    }
  }
}

export default SageSouthAfricaAdapter;
