import crypto from 'node:crypto';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { Prisma } from '@prisma/client';
import app from '../src/app.js';
import { prisma } from '../src/config/db.js';
import { disconnectRedis } from '../src/config/redis.js';
import {
  PEACH_OAUTH_REDIS_KEY,
  createCheckoutSession,
  handlePeachWebhook,
  computePeachWebhookSignature,
  clearPeachLocalTokenCache,
} from '../src/services/peachPaymentsService.js';
import type { AccountingSyncJobPayload } from '../src/queues/index.js';

describe('Phase 2 – South African Payment Rails (Peach Payments Checkout V2 & PayShap/EFT)', () => {
  const tenantId = `tenant-peach-za-${crypto.randomUUID().slice(0, 8)}`;
  const webhookSecret = 'peach_test_webhook_secret_za_2026';
  let testInvoiceId = '';

  beforeAll(async () => {
    process.env.PEACH_ENV = 'sandbox';
    process.env.PEACH_ENTITY_ID = '8ac7a4ca7f91b201017f95c9e1234567';
    process.env.PEACH_CLIENT_ID = 'peach_client_za_001';
    process.env.PEACH_CLIENT_SECRET = 'peach_secret_za_001';
    process.env.PEACH_WEBHOOK_SECRET = webhookSecret;

    await prisma.tenant.create({
      data: {
        id: tenantId,
        name: 'Stellenbosch Civil & Structural (Pty) Ltd',
      },
    });

    const invoice = await prisma.taxInvoice.create({
      data: {
        tenantId,
        invoiceNumber: 'INV-0042',
        status: 'ISSUED',
        currency: 'ZAR',
        subtotalExclVat: new Prisma.Decimal('10000.00'),
        vatAmount: new Prisma.Decimal('1500.00'),
        totalInclVat: new Prisma.Decimal('11500.00'),
        amountPaid: new Prisma.Decimal('0.00'),
        dueDate: new Date(Date.now() + 30 * 86400000),
        externalAccountingProvider: 'XERO',
      },
    });
    testInvoiceId = invoice.id;
  });

  beforeEach(() => {
    clearPeachLocalTokenCache();
  });

  afterAll(async () => {
    try {
      await prisma.tenant.deleteMany({ where: { id: tenantId } });
    } finally {
      await disconnectRedis();
      await prisma.$disconnect();
    }
  });

  it('caches OAuth bearer token in Redis under peach:oauth:token with TTL < expiry and formats POST /v2/checkout payload with ZAR, UUID nonce, and merchantInvoiceId', async () => {
    const redisMap = new Map<string, { value: string; ttl: number }>();
    const mockRedis = {
      get: async (key: string) => redisMap.get(key)?.value ?? null,
      set: async (key: string, value: string, _mode: 'EX', ttl: number) => {
        redisMap.set(key, { value, ttl });
        return 'OK';
      },
    };

    const capturedRequests: Array<{ url: string; headers: any; body: any }> = [];

    const mockFetch: typeof fetch = async (input: any, init?: any) => {
      const url = String(input);
      const parsedBody = init?.body ? JSON.parse(String(init.body)) : null;
      capturedRequests.push({ url, headers: init?.headers, body: parsedBody });

      if (url.includes('/api/oauth/token')) {
        return new Response(
          JSON.stringify({
            access_token: 'mock_peach_bearer_jwt_za',
            expires_in: 3600,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (url.endsWith('/v2/checkout')) {
        return new Response(
          JSON.stringify({
            checkoutId: 'chk_peach_v2_998877',
            redirectUrl: 'https://testsecure.peachpayments.com/v2/checkout/chk_peach_v2_998877',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response('Not Found', { status: 404 });
    };

    const session = await createCheckoutSession(tenantId, testInvoiceId, {
      defaultPaymentMethod: 'PAYSHAP',
      createRegistration: true, // Should remain false because rail is PAYSHAP (not CARD)
      fetchImpl: mockFetch,
      redisStore: mockRedis,
    });

    // 1. Verify Redis OAuth token cache & TTL < 3600s expiry
    const cachedToken = redisMap.get(PEACH_OAUTH_REDIS_KEY);
    expect(cachedToken).toBeDefined();
    expect(cachedToken!.value).toBe('mock_peach_bearer_jwt_za');
    expect(cachedToken!.ttl).toBeLessThan(3600);
    expect(cachedToken!.ttl).toBe(3540);

    // 2. Verify outbound POST /v2/checkout payload formatting
    const checkoutCall = capturedRequests.find((r) => r.url.endsWith('/v2/checkout'));
    expect(checkoutCall).toBeDefined();
    expect(checkoutCall!.headers.Authorization).toBe('Bearer mock_peach_bearer_jwt_za');
    expect(checkoutCall!.body.authentication).toEqual({
      entityId: '8ac7a4ca7f91b201017f95c9e1234567',
    });
    expect(checkoutCall!.body.currency).toBe('ZAR');
    expect(checkoutCall!.body.amount).toBe('11500.00');
    expect(checkoutCall!.body.paymentType).toBe('DB');
    expect(checkoutCall!.body.merchantInvoiceId).toBe('INV-0042');
    expect(checkoutCall!.body.merchantTransactionId).toMatch(/^[A-Z0-9]{8,16}$/);
    expect(checkoutCall!.body.nonce).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
    expect(checkoutCall!.body.defaultPaymentMethod).toBe('PAYSHAP');
    expect(checkoutCall!.body.createRegistration).toBe(false);
    expect(checkoutCall!.body.notificationUrl).toContain('/api/v1/webhooks/peach-payments');

    // 3. Verify PaymentTransaction persisted as PENDING in PostgreSQL
    const persistedTx = await prisma.paymentTransaction.findUnique({
      where: { merchantTransactionId: session.merchantTransactionId },
    });
    expect(persistedTx).not.toBeNull();
    expect(persistedTx?.provider).toBe('PEACH_V2');
    expect(persistedTx?.status).toBe('PENDING');
    expect(Number(persistedTx?.amount)).toBe(11500.0);
  });

  it('enforces webhook HMAC verification and strict idempotency: firing SUCCEEDED webhook twice increments TaxInvoice.amountPaid only once', async () => {
    // Create a dedicated TaxInvoice & PENDING transaction for webhook settlement testing
    const invoice = await prisma.taxInvoice.create({
      data: {
        tenantId,
        invoiceNumber: 'INV-0043',
        status: 'ISSUED',
        currency: 'ZAR',
        subtotalExclVat: new Prisma.Decimal('5000.00'),
        vatAmount: new Prisma.Decimal('750.00'),
        totalInclVat: new Prisma.Decimal('5750.00'),
        amountPaid: new Prisma.Decimal('0.00'),
        dueDate: new Date(Date.now() + 30 * 86400000),
        externalAccountingProvider: 'SAGE_ZA',
      },
    });

    const merchantTransactionId = `PP${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
    await prisma.paymentTransaction.create({
      data: {
        tenantId,
        taxInvoiceId: invoice.id,
        provider: 'PEACH_V2',
        checkoutId: 'chk_idempotent_001',
        merchantTransactionId,
        amount: new Prisma.Decimal('5750.00'),
        currency: 'ZAR',
        paymentMethod: 'PAYSHAP',
        status: 'PENDING',
        rawResponse: {},
      },
    });

    const webhookPayload = {
      id: 'peachtx_001',
      checkoutId: 'chk_idempotent_001',
      merchantTransactionId,
      merchantInvoiceId: 'INV-0043',
      amount: '5750.00',
      currency: 'ZAR',
      paymentBrand: 'PAYSHAP',
      result: {
        code: '000.100.110',
        description: 'Request successfully processed in Merchant in Integrator Test Mode',
      },
    };

    const rawBody = JSON.stringify(webhookPayload);
    const validSignature = computePeachWebhookSignature(rawBody, webhookSecret);

    // 1. Reject tampered / invalid HMAC signature
    await expect(
      handlePeachWebhook(webhookPayload, 'deadbeef_invalid_sig', {
        rawBody,
        webhookSecretOverride: webhookSecret,
      })
    ).rejects.toThrow(/HMAC signature/i);

    const accountingSyncJobs: AccountingSyncJobPayload[] = [];

    // 2. First valid SUCCEEDED webhook -> increments amountPaid to 5750.00 and marks invoice PAID
    const firstResult = await handlePeachWebhook(webhookPayload, validSignature, {
      rawBody,
      webhookSecretOverride: webhookSecret,
      onEnqueueAccountingSync: async (job) => {
        accountingSyncJobs.push(job);
      },
    });

    expect(firstResult.ok).toBe(true);
    expect(firstResult.idempotentDuplicate).toBe(false);
    expect(firstResult.transactionStatus).toBe('SUCCEEDED');
    expect(firstResult.invoiceStatus).toBe('PAID');
    expect(firstResult.amountPaid).toBe(5750.0);
    expect(accountingSyncJobs).toHaveLength(1);

    // 3. Fire the EXACT SAME SUCCEEDED webhook a second time (also test via HTTP POST /api/v1/webhooks/peach-payments)
    const server = app.listen(0);
    try {
      const addr = server.address();
      const port = typeof addr === 'object' && addr ? addr.port : 0;

      const httpRes = await fetch(`http://127.0.0.1:${port}/api/v1/webhooks/peach-payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Peach-Signature': validSignature,
        },
        body: rawBody,
      });

      expect(httpRes.status).toBe(200);
      const secondResult = (await httpRes.json()) as any;
      expect(secondResult.ok).toBe(true);
      expect(secondResult.idempotentDuplicate).toBe(true);
      expect(secondResult.amountPaid).toBe(5750.0);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }

    // 4. Verify PostgreSQL TaxInvoice.amountPaid was ONLY incremented once (5750.00, NOT 11500.00!)
    const finalInvoice = await prisma.taxInvoice.findUniqueOrThrow({
      where: { id: invoice.id },
    });
    expect(Number(finalInvoice.amountPaid)).toBe(5750.0);
    expect(finalInvoice.status).toBe('PAID');
    expect(accountingSyncJobs).toHaveLength(1);
  });
});
