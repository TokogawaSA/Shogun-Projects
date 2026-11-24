import { Prisma } from '@prisma/client';
import { withTenantTx } from '../../utils/tenantTx.js';
import { bankersRound, calculateSaVat, type SaTaxMode } from '../../services/saTaxService.js';
import {
  decryptAccountingCredentials,
  encryptAccountingCredentials,
} from './accountingCrypto.js';
import {
  resolveProviderVatTaxTypeId,
  type AccountingAdapter,
  type AccountingCustomerInput,
  type AccountingPaymentInput,
  type AccountingTaxInvoiceInput,
  type XeroCredentials,
} from './AccountingAdapter.js';

export const XERO_API_BASE_URL = 'https://api.xero.com/api.xro/2.0';
export const XERO_TOKEN_ENDPOINT = 'https://identity.xero.com/connect/token';

export interface XeroAdapterOptions {
  fetchImpl?: typeof fetch;
  apiBaseUrl?: string;
  tokenUrl?: string;
}

/**
 * Xero Accounting (`https://api.xero.com/api.xro/2.0`) Adapter.
 * - Implements concurrency-safe OAuth 2.0 refresh-token rotation using `withTenantTx` + PostgreSQL `FOR UPDATE` locking.
 * - Maps SARS `TaxInvoice` records to Xero `ACCREC` Invoices (`LineAmountTypes: 'Exclusive' | 'Inclusive' | 'NoTax'`,
 *   `TaxType: 'OUTPUT3'` for 15% SA Standard Rate VAT) without penny rounding drift.
 */
export class XeroAdapter implements AccountingAdapter {
  public readonly provider = 'XERO' as const;
  private readonly fetchFn: typeof fetch;
  private readonly apiBaseUrl: string;
  private readonly tokenUrl: string;

  constructor(options?: XeroAdapterOptions) {
    this.fetchFn = options?.fetchImpl ?? globalThis.fetch;
    this.apiBaseUrl = (options?.apiBaseUrl ?? XERO_API_BASE_URL).replace(/\/+$/, '');
    this.tokenUrl = options?.tokenUrl ?? XERO_TOKEN_ENDPOINT;
  }

  /**
   * Ensure a valid Xero OAuth 2.0 `accessToken` is available, refreshing inside a `withTenantTx`
   * PostgreSQL `FOR UPDATE` row lock to prevent concurrent refresh-token race conditions.
   */
  public async getValidSession(tenantId: string): Promise<{
    accessToken: string;
    xeroTenantId: string;
    defaultSalesAccountCode: string;
    defaultVatTaxTypeId: string;
  }> {
    return withTenantTx(tenantId, async (tx) => {
      // Lock the tenant's XERO connection row to serialize concurrent OAuth2 token refreshes
      const locked = await tx.$queryRaw<
        Array<{
          id: string;
          isActive: boolean;
          encryptedCredentials: string;
          defaultSalesAccountCode: string;
          defaultVatTaxTypeId: string;
        }>
      >`
        SELECT "id", "isActive", "encryptedCredentials", "defaultSalesAccountCode", "defaultVatTaxTypeId"
        FROM "tenant_accounting_connections"
        WHERE "tenantId" = ${tenantId} AND "provider" = 'XERO'
        FOR UPDATE
      `;

      const row = locked[0];
      if (!row || !row.isActive) {
        throw new Error(`Active XERO accounting connection not found for tenant "${tenantId}".`);
      }

      const creds = decryptAccountingCredentials<XeroCredentials>(row.encryptedCredentials);
      if (!creds.xeroTenantId) {
        throw new Error('Xero credentials missing required xeroTenantId.');
      }

      const nowMs = Date.now();
      const needsRefresh =
        !creds.accessToken ||
        (typeof creds.expiresAt === 'number' && creds.expiresAt <= nowMs + 60_000);

      if (!needsRefresh) {
        return {
          accessToken: creds.accessToken,
          xeroTenantId: creds.xeroTenantId,
          defaultSalesAccountCode: row.defaultSalesAccountCode,
          defaultVatTaxTypeId: row.defaultVatTaxTypeId,
        };
      }

      if (!creds.refreshToken) {
        throw new Error('Xero accessToken expired and no refreshToken is available.');
      }

      const clientId = creds.clientId || process.env.XERO_CLIENT_ID || '';
      const clientSecret = creds.clientSecret || process.env.XERO_CLIENT_SECRET || '';

      const headers: Record<string, string> = {
        'Content-Type': 'application/x-www-form-urlencoded',
      };
      if (clientId && clientSecret) {
        const basic = Buffer.from(`${clientId}:${clientSecret}`, 'utf8').toString('base64');
        headers.Authorization = `Basic ${basic}`;
      }

      const form = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: creds.refreshToken,
        ...(clientId && !clientSecret ? { client_id: clientId } : {}),
      });

      const tokenRes = await this.fetchFn(this.tokenUrl, {
        method: 'POST',
        headers,
        body: form.toString(),
      });

      if (!tokenRes.ok) {
        const errBody = await tokenRes.text().catch(() => '');
        throw new Error(
          `Xero OAuth 2.0 token refresh failed (${tokenRes.status}): ${errBody || tokenRes.statusText}`
        );
      }

      const tokenJson = (await tokenRes.json()) as {
        access_token: string;
        refresh_token?: string;
        expires_in?: number;
      };

      if (!tokenJson.access_token) {
        throw new Error('Xero OAuth 2.0 refresh response missing access_token.');
      }

      const expiresInSec = Number(tokenJson.expires_in ?? 1800);
      const updatedCreds: XeroCredentials = {
        ...creds,
        accessToken: tokenJson.access_token,
        refreshToken: tokenJson.refresh_token || creds.refreshToken,
        expiresAt: Date.now() + expiresInSec * 1000,
      };

      const reEncrypted = encryptAccountingCredentials(
        updatedCreds as unknown as Record<string, unknown>
      );

      await tx.tenantAccountingConnection.update({
        where: { id: row.id },
        data: {
          encryptedCredentials: reEncrypted,
        },
      });

      return {
        accessToken: updatedCreds.accessToken,
        xeroTenantId: updatedCreds.xeroTenantId,
        defaultSalesAccountCode: row.defaultSalesAccountCode,
        defaultVatTaxTypeId: row.defaultVatTaxTypeId,
      };
    });
  }

  private async xeroRequest<T = any>(
    tenantId: string,
    method: 'GET' | 'POST',
    endpointPath: string,
    body?: Record<string, unknown>
  ): Promise<{ data: T; session: Awaited<ReturnType<XeroAdapter['getValidSession']>> }> {
    const session = await this.getValidSession(tenantId);
    const normalizedPath = endpointPath.startsWith('/') ? endpointPath : `/${endpointPath}`;
    const url = `${this.apiBaseUrl}${normalizedPath}`;

    const res = await this.fetchFn(url, {
      method,
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        'Xero-tenant-id': session.xeroTenantId,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(
        `Xero API ${method} ${endpointPath} failed (${res.status}): ${errText || res.statusText}`
      );
    }

    const data = (await res.json()) as T;
    return { data, session };
  }

  public async testConnection(
    tenantId: string
  ): Promise<{ ok: boolean; companyName?: string }> {
    const { data } = await this.xeroRequest<any>(tenantId, 'GET', '/Organisations');
    const orgName = data?.Organisations?.[0]?.Name || 'Xero South Africa Organisation';
    return { ok: true, companyName: orgName };
  }

  public async syncCustomer(
    tenantId: string,
    account: AccountingCustomerInput
  ): Promise<string> {
    const { data } = await this.xeroRequest<{ Contacts?: Array<{ ContactID: string }> }>(
      tenantId,
      'POST',
      '/Contacts',
      {
        Contacts: [
          {
            Name: account.accountName,
            AccountNumber: account.accountNumber || undefined,
            EmailAddress: account.email || undefined,
            TaxNumber: account.vatRegistrationNumber || undefined,
            CompanyNumber: account.cipcRegistrationNumber || undefined,
            Phones: account.primaryPhone
              ? [{ PhoneType: 'DEFAULT', PhoneNumber: account.primaryPhone }]
              : undefined,
          },
        ],
      }
    );

    const contactId = data?.Contacts?.[0]?.ContactID;
    if (!contactId) {
      throw new Error('Xero /Contacts response did not return a ContactID.');
    }
    return contactId;
  }

  public async pushTaxInvoice(
    tenantId: string,
    taxInvoice: AccountingTaxInvoiceInput
  ): Promise<string> {
    let contactId: string | undefined;
    if (taxInvoice.account) {
      contactId = await this.syncCustomer(tenantId, taxInvoice.account);
    }

    const session = await this.getValidSession(tenantId);
    const taxMode: SaTaxMode = taxInvoice.taxMode || 'EXCLUSIVE';
    const xeroTaxType = resolveProviderVatTaxTypeId(
      session.defaultVatTaxTypeId,
      taxMode,
      'XERO'
    );
    const salesAccountCode = session.defaultSalesAccountCode || '200';

    const lineAmountTypes: 'Exclusive' | 'Inclusive' | 'NoTax' =
      taxMode === 'INCLUSIVE'
        ? 'Inclusive'
        : taxMode === 'EXEMPT'
        ? 'NoTax'
        : 'Exclusive';

    const subtotalExcl = bankersRound(taxInvoice.subtotalExclVat, 2);
    const vatAmt = bankersRound(taxInvoice.vatAmount, 2);
    const totalIncl = bankersRound(taxInvoice.totalInclVat, 2);

    const xeroLineItems =
      taxInvoice.lineItems && taxInvoice.lineItems.length > 0
        ? taxInvoice.lineItems.map((li) => {
            const qty = new Prisma.Decimal(li.quantity || 1);
            const rawNet = bankersRound(
              new Prisma.Decimal(li.unitPrice).mul(qty).sub(li.discountAmount || 0),
              2
            );
            const lineVat = calculateSaVat(rawNet, taxMode);
            const unitAmt =
              lineAmountTypes === 'Inclusive'
                ? qty.gt(0)
                  ? bankersRound(lineVat.decimals.totalInclVat.div(qty), 2)
                  : lineVat.decimals.totalInclVat
                : qty.gt(0)
                ? bankersRound(lineVat.decimals.subtotalExclVat.div(qty), 2)
                : lineVat.decimals.subtotalExclVat;

            const lineAmount =
              lineAmountTypes === 'Inclusive'
                ? lineVat.totalInclVat
                : lineVat.subtotalExclVat;

            return {
              Description: li.description,
              Quantity: Number(qty.toFixed(2)),
              UnitAmount: Number(unitAmt.toFixed(2)),
              LineAmount: lineAmount,
              TaxAmount: lineVat.vatAmount,
              AccountCode: salesAccountCode,
              TaxType: xeroTaxType,
            };
          })
        : [
            {
              Description: `SARS Tax Invoice ${taxInvoice.invoiceNumber}`,
              Quantity: 1,
              UnitAmount:
                lineAmountTypes === 'Inclusive'
                  ? Number(totalIncl.toFixed(2))
                  : Number(subtotalExcl.toFixed(2)),
              LineAmount:
                lineAmountTypes === 'Inclusive'
                  ? Number(totalIncl.toFixed(2))
                  : Number(subtotalExcl.toFixed(2)),
              TaxAmount: Number(vatAmt.toFixed(2)),
              AccountCode: salesAccountCode,
              TaxType: xeroTaxType,
            },
          ];

    const issueDateIso = (
      taxInvoice.issueDate ? new Date(taxInvoice.issueDate) : new Date()
    )
      .toISOString()
      .slice(0, 10);
    const dueDateIso = new Date(taxInvoice.dueDate).toISOString().slice(0, 10);

    const { data } = await this.xeroRequest<{ Invoices?: Array<{ InvoiceID: string }> }>(
      tenantId,
      'POST',
      '/Invoices',
      {
        Invoices: [
          {
            ...(taxInvoice.externalAccountingId
              ? { InvoiceID: taxInvoice.externalAccountingId }
              : {}),
            Type: 'ACCREC',
            InvoiceNumber: taxInvoice.invoiceNumber,
            Contact: contactId
              ? { ContactID: contactId }
              : { Name: taxInvoice.account?.accountName || 'South African Client' },
            Date: issueDateIso,
            DueDate: dueDateIso,
            CurrencyCode: (taxInvoice.currency || 'ZAR').toUpperCase(),
            LineAmountTypes: lineAmountTypes,
            SubTotal: Number(subtotalExcl.toFixed(2)),
            TotalTax: Number(vatAmt.toFixed(2)),
            Total: Number(totalIncl.toFixed(2)),
            Status: 'AUTHORISED',
            LineItems: xeroLineItems,
          },
        ],
      }
    );

    const invoiceId = data?.Invoices?.[0]?.InvoiceID;
    if (!invoiceId) {
      throw new Error('Xero /Invoices response did not return an InvoiceID.');
    }
    return invoiceId;
  }

  public async recordInvoicePayment(
    tenantId: string,
    taxInvoice: AccountingTaxInvoiceInput,
    paymentTx: AccountingPaymentInput
  ): Promise<string> {
    const externalInvoiceId =
      taxInvoice.externalAccountingId || (await this.pushTaxInvoice(tenantId, taxInvoice));

    const settledIso = (
      paymentTx.settledAt ? new Date(paymentTx.settledAt) : new Date()
    )
      .toISOString()
      .slice(0, 10);
    const paidDec = bankersRound(paymentTx.amount, 2);

    const { data } = await this.xeroRequest<{ Payments?: Array<{ PaymentID: string }> }>(
      tenantId,
      'POST',
      '/Payments',
      {
        Payments: [
          {
            Invoice: { InvoiceID: externalInvoiceId },
            Account: { Code: '090' },
            Date: settledIso,
            Amount: Number(paidDec.toFixed(2)),
            Reference: paymentTx.merchantTransactionId,
          },
        ],
      }
    );

    return data?.Payments?.[0]?.PaymentID || `xero-pmt-${paymentTx.merchantTransactionId}`;
  }

  public async pushApprovedExpenses(tenantId: string, projectId: string): Promise<void> {
    const approvedExpenses = await withTenantTx(tenantId, async (tx) => {
      return tx.expenseEntry.findMany({
        where: {
          tenantId,
          projectId,
          status: 'approved',
        },
      });
    });

    if (approvedExpenses.length === 0) return;

    await this.xeroRequest(tenantId, 'POST', '/Invoices', {
      Invoices: approvedExpenses.map((exp) => {
        const vatCalc = calculateSaVat(exp.amount, 'INCLUSIVE');
        return {
          Type: 'ACCPAY',
          InvoiceNumber: `EXP-${exp.id.slice(0, 10)}`,
          Contact: { Name: 'Approved Project Expense Supplier' },
          Date: exp.incurredDate.toISOString().slice(0, 10),
          DueDate: exp.incurredDate.toISOString().slice(0, 10),
          LineAmountTypes: 'Inclusive',
          Status: 'AUTHORISED',
          LineItems: [
            {
              Description: `Project ${projectId} Approved Expense (${exp.category})`,
              Quantity: 1,
              UnitAmount: vatCalc.totalInclVat,
              TaxAmount: vatCalc.vatAmount,
              AccountCode: '400',
              TaxType: 'INPUT3',
            },
          ],
        };
      }),
    });
  }
}

export default XeroAdapter;
