import crypto from 'node:crypto';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Prisma } from '@prisma/client';
import { prisma } from '../src/config/db.js';
import { disconnectRedis } from '../src/config/redis.js';
import {
  encryptAccountingCredentials,
  decryptAccountingCredentials,
  SageSouthAfricaAdapter,
  XeroAdapter,
} from '../src/modules/accounting/index.js';
import { executeAccountingDomainSync } from '../src/workers/accountingSyncWorker.js';

describe('Phase 3 – Outbound Accounting Integration (Sage South Africa v2.0.0 & Xero)', () => {
  const tenantId = `tenant-acct-za-${crypto.randomUUID().slice(0, 8)}`;
  let testUserId = '';
  let testAccountId = '';
  let testInvoiceId = '';

  beforeAll(async () => {
    process.env.ACCOUNTING_ENCRYPTION_KEY = 'test-aes-256-gcm-master-key-south-africa';

    await prisma.tenant.create({
      data: {
        id: tenantId,
        name: 'Umhlanga Quantity Surveyors (Pty) Ltd',
      },
    });

    const user = await prisma.user.create({
      data: {
        tenantId,
        email: `fin.admin.${tenantId}@shogun.co.za`,
        passwordHash: 'hashed_pw',
        displayName: 'Thandiwe Zulu',
        role: 'admin',
        isTenantAdmin: true,
      },
    });
    testUserId = user.id;

    const account = await prisma.account.create({
      data: {
        tenantId,
        accountNumber: 'ACC-DBN-001',
        accountName: 'KZN Harbour Infrastructure (Pty) Ltd',
        email: 'ap@kznharbour.co.za',
        primaryPhone: '+27 31 555 0199',
        cipcRegistrationNumber: '2020/654321/07',
        vatRegistrationNumber: '4918273645',
        csdSupplierNumber: 'MAAA7654321',
        assignedUserId: testUserId,
        createdById: testUserId,
      },
    });
    testAccountId = account.id;

    const invoice = await prisma.taxInvoice.create({
      data: {
        tenantId,
        invoiceNumber: 'INV-0108',
        accountId: testAccountId,
        status: 'ISSUED',
        currency: 'ZAR',
        subtotalExclVat: new Prisma.Decimal('86.96'),
        vatAmount: new Prisma.Decimal('13.04'),
        totalInclVat: new Prisma.Decimal('100.00'),
        amountPaid: new Prisma.Decimal('0.00'),
        dueDate: new Date('2026-12-24T00:00:00.000Z'),
      },
    });
    testInvoiceId = invoice.id;
  });

  afterAll(async () => {
    try {
      await prisma.tenant.deleteMany({ where: { id: tenantId } });
    } finally {
      await disconnectRedis();
      await prisma.$disconnect();
    }
  });

  it('encrypts and decrypts TenantAccountingConnection credentials using AES-256-GCM', () => {
    const rawCreds = {
      apiKey: '{9F2A1B3C-SAGE-ZA-KEY}',
      companyId: 88219,
      username: 'billing@umhlangaqs.co.za',
      password: 'StrongSagePassword!2026',
    };

    const ciphertext = encryptAccountingCredentials(rawCreds);
    expect(ciphertext.startsWith('aes256gcm:v1:')).toBe(true);
    expect(ciphertext).not.toContain('StrongSagePassword!2026');
    expect(ciphertext).not.toContain('{9F2A1B3C-SAGE-ZA-KEY}');

    const decrypted = decryptAccountingCredentials<typeof rawCreds>(ciphertext);
    expect(decrypted).toEqual(rawCreds);
  });

  it('formats SageSouthAfricaAdapter Basic auth headers, apikey & companyid query params, CIPC/VAT fields, and 15% VAT line items', async () => {
    await prisma.tenantAccountingConnection.upsert({
      where: {
        tenantId_provider: { tenantId, provider: 'SAGE_ZA' },
      },
      create: {
        tenantId,
        provider: 'SAGE_ZA',
        isActive: true,
        encryptedCredentials: encryptAccountingCredentials({
          apiKey: '{SAGE-ZA-API-KEY-777}',
          companyId: 55102,
          username: 'sageuser@umhlangaqs.co.za',
          password: 'SageSecretPassword99!',
        }),
        defaultSalesAccountCode: '14',
        defaultVatTaxTypeId: JSON.stringify({
          standard15: '1',
          zeroRated: '2',
          exempt: '3',
        }),
      },
      update: {},
    });

    const capturedCalls: Array<{ url: string; method: string; headers: any; body: any }> = [];

    const mockSageFetch: typeof fetch = async (input: any, init?: any) => {
      const url = String(input);
      const body = init?.body ? JSON.parse(String(init.body)) : null;
      capturedCalls.push({
        url,
        method: init?.method || 'GET',
        headers: init?.headers || {},
        body,
      });

      if (url.includes('/Customer/Get')) {
        return new Response(JSON.stringify({ Results: [] }), { status: 200 });
      }
      if (url.includes('/Customer/Save')) {
        return new Response(JSON.stringify({ ID: 9012 }), { status: 200 });
      }
      if (url.includes('/TaxInvoice/Save')) {
        return new Response(JSON.stringify({ ID: 77401 }), { status: 200 });
      }
      return new Response('{}', { status: 200 });
    };

    const sageAdapter = new SageSouthAfricaAdapter({ fetchImpl: mockSageFetch });
    const account = await prisma.account.findUniqueOrThrow({ where: { id: testAccountId } });

    const externalInvId = await sageAdapter.pushTaxInvoice(tenantId, {
      id: testInvoiceId,
      invoiceNumber: 'INV-0108',
      currency: 'ZAR',
      taxMode: 'EXCLUSIVE',
      subtotalExclVat: '12500.00',
      vatAmount: '1875.00',
      totalInclVat: '14375.00',
      dueDate: '2026-12-24T00:00:00.000Z',
      account,
      lineItems: [
        {
          description: 'Structural Steel Bill of Quantities Review',
          quantity: 5,
          unitPrice: 2500,
          discountAmount: 0,
        },
      ],
    });

    expect(externalInvId).toBe('77401');

    // 1. Verify Basic Auth header + apikey & companyid query params
    const expectedBasic = Buffer.from(
      'sageuser@umhlangaqs.co.za:SageSecretPassword99!',
      'utf8'
    ).toString('base64');

    const customerSaveCall = capturedCalls.find((c) => c.url.includes('/Customer/Save'));
    expect(customerSaveCall).toBeDefined();
    expect(customerSaveCall!.url).toContain('https://accounting.sageone.co.za/api/2.0.0/Customer/Save?');
    expect(customerSaveCall!.url).toContain('apikey=%7BSAGE-ZA-API-KEY-777%7D');
    expect(customerSaveCall!.url).toContain('companyid=55102');
    expect(customerSaveCall!.headers.Authorization).toBe(`Basic ${expectedBasic}`);

    // Verify SARS VAT -> TaxReference & CIPC -> TextField1 UDF mapping
    expect(customerSaveCall!.body.TaxReference).toBe('4918273645');
    expect(customerSaveCall!.body.TextField1).toBe('2020/654321/07');
    expect(customerSaveCall!.body.TextField2).toBe('MAAA7654321');

    // 2. Verify 15% VAT line items mapping on /TaxInvoice/Save
    const invoiceSaveCall = capturedCalls.find((c) => c.url.includes('/TaxInvoice/Save'));
    expect(invoiceSaveCall).toBeDefined();
    expect(invoiceSaveCall!.body.DocumentNumber).toBe('INV-0108');
    expect(invoiceSaveCall!.body.CustomerId).toBe(9012);
    expect(invoiceSaveCall!.body.Exclusive).toBe(12500);
    expect(invoiceSaveCall!.body.Tax).toBe(1875);
    expect(invoiceSaveCall!.body.Total).toBe(14375);
    expect(invoiceSaveCall!.body.Lines[0]).toMatchObject({
      SelectionId: 14,
      TaxTypeId: 1,
      TaxPercentage: 15,
      Quantity: 5,
      UnitPriceExclusive: 2500,
      Exclusive: 12500,
      Tax: 1875,
      Total: 14375,
    });
  });

  it('refreshes expired Xero OAuth 2.0 tokens safely inside a transaction lock and maps ACCREC 15% SA VAT line items without rounding drift', async () => {
    await prisma.tenantAccountingConnection.upsert({
      where: {
        tenantId_provider: { tenantId, provider: 'XERO' },
      },
      create: {
        tenantId,
        provider: 'XERO',
        isActive: true,
        encryptedCredentials: encryptAccountingCredentials({
          accessToken: 'expired_xero_access_token',
          refreshToken: 'valid_xero_refresh_token_001',
          xeroTenantId: 'xero-org-za-9988',
          clientId: 'xero_client_id_za',
          clientSecret: 'xero_client_secret_za',
          expiresAt: Date.now() - 120_000, // Already expired 2 minutes ago
        }),
        defaultSalesAccountCode: '200',
        defaultVatTaxTypeId: 'OUTPUT3',
      },
      update: {},
    });

    let tokenRefreshCalls = 0;
    const xeroApiCalls: Array<{ url: string; headers: any; body: any }> = [];

    const mockXeroFetch: typeof fetch = async (input: any, init?: any) => {
      const url = String(input);

      if (url.includes('identity.xero.com/connect/token')) {
        tokenRefreshCalls += 1;
        return new Response(
          JSON.stringify({
            access_token: 'fresh_xero_access_token_2026',
            refresh_token: 'rotated_xero_refresh_token_002',
            expires_in: 1800,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const body = init?.body ? JSON.parse(String(init.body)) : null;
      xeroApiCalls.push({ url, headers: init?.headers || {}, body });

      if (url.endsWith('/Contacts')) {
        return new Response(
          JSON.stringify({ Contacts: [{ ContactID: 'xero-contact-za-01' }] }),
          { status: 200 }
        );
      }

      if (url.endsWith('/Invoices')) {
        return new Response(
          JSON.stringify({ Invoices: [{ InvoiceID: 'xero-inv-accrec-555' }] }),
          { status: 200 }
        );
      }

      return new Response('{}', { status: 200 });
    };

    const xeroAdapter = new XeroAdapter({ fetchImpl: mockXeroFetch });

    // Trigger two concurrent session requests -> FOR UPDATE lock ensures only ONE refresh call hits Xero!
    const [sess1, sess2] = await Promise.all([
      xeroAdapter.getValidSession(tenantId),
      xeroAdapter.getValidSession(tenantId),
    ]);

    expect(tokenRefreshCalls).toBe(1);
    expect(sess1.accessToken).toBe('fresh_xero_access_token_2026');
    expect(sess2.accessToken).toBe('fresh_xero_access_token_2026');

    // Sync invoice.issued via BullMQ worker execution engine targeting XERO (R 100.00 Inclusive -> 86.96 + 13.04 = 100.00 exact!)
    const syncOutcome = await executeAccountingDomainSync(
      'invoice.issued',
      {
        eventType: 'invoice.issued',
        tenantId,
        taxInvoiceId: testInvoiceId,
        provider: 'XERO',
      },
      mockXeroFetch
    );

    expect(syncOutcome.synced).toBe(true);
    expect(syncOutcome.externalAccountingId).toBe('xero-inv-accrec-555');

    const xeroInvCall = xeroApiCalls.find((c) => c.url.endsWith('/Invoices'));
    expect(xeroInvCall).toBeDefined();
    expect(xeroInvCall!.headers.Authorization).toBe('Bearer fresh_xero_access_token_2026');
    expect(xeroInvCall!.headers['Xero-tenant-id']).toBe('xero-org-za-9988');

    const sentInvoice = xeroInvCall!.body.Invoices[0];
    expect(sentInvoice.Type).toBe('ACCREC');
    expect(sentInvoice.CurrencyCode).toBe('ZAR');
    expect(sentInvoice.SubTotal).toBe(86.96);
    expect(sentInvoice.TotalTax).toBe(13.04);
    expect(sentInvoice.Total).toBe(100.0);
    expect(Number((sentInvoice.SubTotal + sentInvoice.TotalTax).toFixed(2))).toBe(
      sentInvoice.Total
    );
    expect(sentInvoice.LineItems[0].TaxType).toBe('OUTPUT3');
    expect(sentInvoice.LineItems[0].AccountCode).toBe('200');

    // Verify TaxInvoice.externalAccountingId was written back to PostgreSQL
    const updatedInvoice = await prisma.taxInvoice.findUniqueOrThrow({
      where: { id: testInvoiceId },
    });
    expect(updatedInvoice.externalAccountingProvider).toBe('XERO');
    expect(updatedInvoice.externalAccountingId).toBe('xero-inv-accrec-555');
    expect(updatedInvoice.lastSyncedAt).not.toBeNull();
  });
});
