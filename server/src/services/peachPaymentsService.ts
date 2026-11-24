import crypto from 'node:crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/db.js';
import { parseEnv } from '../config/env.js';
import { getRedisClient } from '../config/redis.js';
import { withTenantTx } from '../utils/tenantTx.js';
import { bankersRound } from './saTaxService.js';
import { broadcastToProject, broadcastToTenant } from '../socket.js';
import {
  enqueueAccountingSyncJob,
  type AccountingSyncJobPayload,
} from '../queues/index.js';

export const PEACH_OAUTH_REDIS_KEY = 'peach:oauth:token';

/**
 * Official Peach Payments / OPP success result codes (e.g. `000.000.000` live, `000.100.110` sandbox/test).
 */
const PEACH_SUCCESS_CODE_REGEX = /^(000\.000\.|000\.100\.1|000\.3|000\.6)/;
const PEACH_PENDING_CODE_REGEX = /^(000\.200\.|800\.400\.5)/;

export type PeachPaymentMethod = 'CARD' | 'PAYSHAP' | 'CAPITECPAY' | 'PAYBYBANK';

export interface PeachTokenRedisStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode: 'EX', ttlSeconds: number): Promise<unknown>;
}

export interface PeachCredentials {
  entityId: string;
  clientId: string;
  clientSecret: string;
  merchantId?: string;
  webhookSecret: string;
  env: 'sandbox' | 'live';
  publicAppUrl: string;
  publicApiUrl: string;
}

export interface CreatePeachCheckoutOptions {
  defaultPaymentMethod?: PeachPaymentMethod;
  /** Only `true` when client/tenant explicitly consented to card tokenization for recurring retainers */
  createRegistration?: boolean;
  /** Optional partial deposit amount in ZAR; defaults to full remaining TaxInvoice balance */
  amount?: number | string;
  shopperResultUrl?: string;
  notificationUrl?: string;
  fetchImpl?: typeof fetch;
  redisStore?: PeachTokenRedisStore | null;
}

export interface PeachCheckoutSessionResult {
  paymentTransactionId: string;
  checkoutId: string;
  checkoutUrl: string;
  merchantTransactionId: string;
  merchantInvoiceId: string;
  amount: string;
  currency: 'ZAR';
  paymentType: 'DB';
  nonce: string;
  defaultPaymentMethod: PeachPaymentMethod | null;
  createRegistration: boolean;
  shopperResultUrl: string;
  notificationUrl: string;
}

export class PeachWebhookSignatureError extends Error {
  public readonly status = 401;

  constructor(message = 'Invalid or missing Peach Payments webhook HMAC signature.') {
    super(message);
    this.name = 'PeachWebhookSignatureError';
  }
}

// Local SA process fallback token cache when Redis daemon is offline
const localOAuthTokenCache = new Map<string, { token: string; expiresAtMs: number }>();
let redisCircuitOpenUntil = 0;

function withShortTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('PEACH_REDIS_TIMEOUT')), ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      }
    );
  });
}

export function clearPeachLocalTokenCache(): void {
  localOAuthTokenCache.clear();
}

/**
 * Resolve tenant-specific Peach V2 credentials from `SystemConfig.companyDetails.peachPayments`,
 * falling back to platform-level environment variables (`PEACH_*`).
 */
export async function resolvePeachCredentials(
  tenantId?: string,
  rawEnv: NodeJS.ProcessEnv = process.env
): Promise<PeachCredentials> {
  const cfg = parseEnv(rawEnv);
  let tenantOverride: Record<string, any> = {};

  if (tenantId) {
    try {
      const sysConfig = await prisma.systemConfig.findUnique({
        where: { tenantId },
        select: { companyDetails: true },
      });
      const details = (sysConfig?.companyDetails as Record<string, any>) || {};
      if (details.peachPayments && typeof details.peachPayments === 'object') {
        tenantOverride = details.peachPayments;
      }
    } catch {
      // Fall back to platform env credentials
    }
  }

  return {
    entityId: String(tenantOverride.entityId || cfg.PEACH_ENTITY_ID || 'peach-sandbox-entity'),
    clientId: String(tenantOverride.clientId || cfg.PEACH_CLIENT_ID || 'peach-sandbox-client'),
    clientSecret: String(
      tenantOverride.clientSecret || cfg.PEACH_CLIENT_SECRET || 'peach-sandbox-secret'
    ),
    merchantId: String(tenantOverride.merchantId || cfg.PEACH_MERCHANT_ID || ''),
    webhookSecret: String(tenantOverride.webhookSecret ?? cfg.PEACH_WEBHOOK_SECRET ?? ''),
    env: tenantOverride.env === 'live' || cfg.PEACH_ENV === 'live' ? 'live' : 'sandbox',
    publicAppUrl: cfg.PUBLIC_APP_URL.replace(/\/+$/, ''),
    publicApiUrl: cfg.PUBLIC_API_URL.replace(/\/+$/, ''),
  };
}

function getPeachEndpoints(envMode: 'sandbox' | 'live') {
  if (envMode === 'live') {
    return {
      oauthUrl: 'https://dashboard.peachpayments.com/api/oauth/token',
      checkoutBaseUrl: 'https://secure.peachpayments.com',
    };
  }
  return {
    oauthUrl: 'https://sandbox-dashboard.peachpayments.com/api/oauth/token',
    checkoutBaseUrl: 'https://testsecure.peachpayments.com',
  };
}

/**
 * Obtain a Peach Payments V2 OAuth bearer token, caching in Redis under `peach:oauth:token`
 * with TTL strictly less than token expiry (`expires_in - 60s`).
 */
export async function getPeachOAuthToken(options?: {
  credentials?: PeachCredentials;
  fetchImpl?: typeof fetch;
  redisStore?: PeachTokenRedisStore | null;
}): Promise<string> {
  const creds = options?.credentials ?? (await resolvePeachCredentials());
  const fetchFn = options?.fetchImpl ?? globalThis.fetch;
  const cacheKey = PEACH_OAUTH_REDIS_KEY;

  const isDefaultRedis = options?.redisStore === undefined;
  const redisClient: PeachTokenRedisStore | null =
    isDefaultRedis && Date.now() >= redisCircuitOpenUntil
      ? getRedisClient()
      : isDefaultRedis
      ? null
      : options?.redisStore ?? null;

  // 1. Attempt Redis cache lookup
  if (redisClient) {
    try {
      const cached = await withShortTimeout(redisClient.get(cacheKey), 350);
      if (cached) {
        return cached;
      }
    } catch {
      if (isDefaultRedis) {
        redisCircuitOpenUntil = Date.now() + 30_000;
      }
    }
  }

  // Fallback local process TTL cache check
  const localHit = localOAuthTokenCache.get(cacheKey);
  if (localHit && localHit.expiresAtMs > Date.now()) {
    return localHit.token;
  }

  // 2. Request fresh OAuth token from Peach Authentication API
  const { oauthUrl } = getPeachEndpoints(creds.env);
  const response = await fetchFn(oauthUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientId: creds.clientId,
      clientSecret: creds.clientSecret,
      ...(creds.merchantId ? { merchantId: creds.merchantId } : {}),
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(
      `Peach OAuth token exchange failed (${response.status}): ${errText || response.statusText}`
    );
  }

  const tokenData = (await response.json()) as {
    access_token?: string;
    accessToken?: string;
    expires_in?: number;
    expiresIn?: number;
  };

  const accessToken = tokenData.access_token || tokenData.accessToken;
  if (!accessToken) {
    throw new Error('Peach OAuth response did not include an access_token.');
  }

  const rawExpiresIn = Number(tokenData.expires_in ?? tokenData.expiresIn ?? 3600);
  // Ensure Redis TTL is strictly less than OAuth token expiry
  const safeTtlSeconds =
    rawExpiresIn > 60
      ? rawExpiresIn - 60
      : Math.max(1, Math.floor(rawExpiresIn * 0.8));

  localOAuthTokenCache.set(cacheKey, {
    token: accessToken,
    expiresAtMs: Date.now() + safeTtlSeconds * 1000,
  });

  if (redisClient) {
    try {
      await withShortTimeout(
        redisClient.set(cacheKey, accessToken, 'EX', safeTtlSeconds),
        350
      );
    } catch {
      if (isDefaultRedis) {
        redisCircuitOpenUntil = Date.now() + 30_000;
      }
    }
  }

  return accessToken;
}

/**
 * Generate a unique 14-character (within 8–16 char Peach Checkout V2 limit) merchantTransactionId.
 */
export function generateMerchantTransactionId(): string {
  return `PP${crypto.randomBytes(6).toString('hex').toUpperCase()}`; // 14 chars
}

/**
 * Create a Peach Payments Checkout V2 session (`POST /v2/checkout`) for a ZAR `TaxInvoice`
 * and persist a `PENDING` `PaymentTransaction` record inside `withTenantTx`.
 */
export async function createCheckoutSession(
  tenantId: string,
  taxInvoiceId: string,
  options?: CreatePeachCheckoutOptions
): Promise<PeachCheckoutSessionResult> {
  if (!tenantId || !taxInvoiceId) {
    throw Object.assign(new Error('tenantId and taxInvoiceId are required.'), { status: 400 });
  }

  const creds = await resolvePeachCredentials(tenantId);
  const fetchFn = options?.fetchImpl ?? globalThis.fetch;

  // 1. Validate TaxInvoice & compute payable ZAR balance inside tenant context
  const invoice = await withTenantTx(tenantId, async (tx) => {
    return tx.taxInvoice.findFirst({
      where: { id: taxInvoiceId, tenantId },
    });
  });

  if (!invoice) {
    throw Object.assign(new Error(`TaxInvoice "${taxInvoiceId}" not found in tenant.`), {
      status: 404,
    });
  }

  if (invoice.status === 'PAID' || invoice.status === 'VOID') {
    throw Object.assign(
      new Error(`TaxInvoice "${invoice.invoiceNumber}" cannot be paid (status: ${invoice.status}).`),
      { status: 400 }
    );
  }

  const remainingZar = bankersRound(
    new Prisma.Decimal(invoice.totalInclVat).sub(invoice.amountPaid),
    2
  );

  const requestedAmount =
    options?.amount !== undefined ? bankersRound(options.amount, 2) : remainingZar;

  if (requestedAmount.lte(0) || requestedAmount.gt(remainingZar)) {
    throw Object.assign(
      new Error(
        `Invalid payment amount ${requestedAmount.toFixed(2)} ZAR (outstanding balance: ${remainingZar.toFixed(2)} ZAR).`
      ),
      { status: 400 }
    );
  }

  // 2. Acquire cached OAuth bearer token
  const bearerToken = await getPeachOAuthToken({
    credentials: creds,
    fetchImpl: fetchFn,
    redisStore: options?.redisStore,
  });

  const merchantTransactionId = generateMerchantTransactionId();
  const nonce = crypto.randomUUID();
  const amountFormatted = requestedAmount.toFixed(2);
  const defaultPaymentMethod = options?.defaultPaymentMethod ?? null;

  // Card tokenization (`createRegistration`) is strictly opt-in for CARD payments
  const createRegistration = Boolean(
    options?.createRegistration === true &&
      (defaultPaymentMethod === 'CARD' || defaultPaymentMethod === null)
  );

  const shopperResultUrl =
    options?.shopperResultUrl ||
    `${creds.publicAppUrl}/portal/invoices/${invoice.id}?merchantTransactionId=${merchantTransactionId}`;

  const notificationUrl =
    options?.notificationUrl || `${creds.publicApiUrl}/api/v1/webhooks/peach-payments`;

  const checkoutRequestBody: Record<string, unknown> = {
    authentication: {
      entityId: creds.entityId,
    },
    merchantTransactionId,
    merchantInvoiceId: invoice.invoiceNumber,
    amount: amountFormatted,
    currency: 'ZAR',
    paymentType: 'DB',
    nonce,
    ...(defaultPaymentMethod ? { defaultPaymentMethod } : {}),
    createRegistration,
    shopperResultUrl,
    notificationUrl,
  };

  const { checkoutBaseUrl } = getPeachEndpoints(creds.env);
  const checkoutEndpoint = `${checkoutBaseUrl}/v2/checkout`;

  const checkoutRes = await fetchFn(checkoutEndpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${bearerToken}`,
      'Content-Type': 'application/json',
      Origin: creds.publicAppUrl,
      Referer: `${creds.publicAppUrl}/`,
    },
    body: JSON.stringify(checkoutRequestBody),
  });

  if (!checkoutRes.ok) {
    const errText = await checkoutRes.text().catch(() => '');
    throw new Error(
      `Peach Checkout V2 session creation failed (${checkoutRes.status}): ${errText || checkoutRes.statusText}`
    );
  }

  const rawResponse = (await checkoutRes.json()) as Record<string, any>;
  const checkoutId = String(rawResponse.checkoutId || rawResponse.id || crypto.randomUUID());
  const checkoutUrl = String(
    rawResponse.redirectUrl ||
      rawResponse.checkoutUrl ||
      `${checkoutBaseUrl}/v2/checkout/${checkoutId}`
  );

  // 3. Persist PENDING PaymentTransaction record inside tenant-isolated transaction
  const createdTx = await withTenantTx(tenantId, async (tx) => {
    return tx.paymentTransaction.create({
      data: {
        tenantId,
        taxInvoiceId: invoice.id,
        provider: 'PEACH_V2',
        checkoutId,
        merchantTransactionId,
        amount: requestedAmount,
        currency: 'ZAR',
        paymentMethod: defaultPaymentMethod,
        status: 'PENDING',
        rawResponse: rawResponse as Prisma.InputJsonValue,
      },
    });
  });

  return {
    paymentTransactionId: createdTx.id,
    checkoutId,
    checkoutUrl,
    merchantTransactionId,
    merchantInvoiceId: invoice.invoiceNumber,
    amount: amountFormatted,
    currency: 'ZAR',
    paymentType: 'DB',
    nonce,
    defaultPaymentMethod,
    createRegistration,
    shopperResultUrl,
    notificationUrl,
  };
}

/**
 * Compute HMAC-SHA256 hex digest for Peach Payments V2 webhook signature verification.
 */
export function computePeachWebhookSignature(rawBody: string, webhookSecret: string): string {
  return crypto.createHmac('sha256', webhookSecret).update(rawBody, 'utf8').digest('hex');
}

export function verifyPeachWebhookSignature(
  rawBody: string,
  providedSignature: string | undefined,
  webhookSecret: string
): boolean {
  if (!providedSignature || !webhookSecret) {
    return false;
  }

  const normalizedSig = providedSignature.trim().replace(/^sha256=/i, '');
  const expectedHex = computePeachWebhookSignature(rawBody, webhookSecret);

  const sigBuf = Buffer.from(normalizedSig, 'utf8');
  const expBuf = Buffer.from(expectedHex, 'utf8');
  if (sigBuf.length !== expBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(sigBuf, expBuf);
}

export interface HandlePeachWebhookResult {
  ok: boolean;
  idempotentDuplicate: boolean;
  merchantTransactionId: string;
  transactionStatus: string;
  taxInvoiceId: string;
  invoiceStatus: string;
  amountPaid: number;
}

/**
 * Verify inbound Peach Payments V2 webhook HMAC signature, enforce strict idempotency on
 * `merchantTransactionId` via PostgreSQL `FOR UPDATE` row locking, update `PaymentTransaction`
 * and `TaxInvoice.amountPaid`/`status` inside `withTenantTx`, emit Socket.io `invoice:paid`,
 * and enqueue an `accountingSyncQueue` job for Sage ZA / Xero reconciliation.
 */
export async function handlePeachWebhook(
  payload: Record<string, any>,
  signature?: string,
  options?: {
    rawBody?: string;
    webhookSecretOverride?: string;
    onEnqueueAccountingSync?: (job: AccountingSyncJobPayload) => Promise<void>;
  }
): Promise<HandlePeachWebhookResult> {
  const merchantTransactionId = String(
    payload?.merchantTransactionId || payload?.['merchantTransactionId'] || ''
  ).trim();

  if (!merchantTransactionId) {
    throw Object.assign(new Error('Webhook payload missing merchantTransactionId.'), {
      status: 400,
    });
  }

  const existingTx = await prisma.paymentTransaction.findUnique({
    where: { merchantTransactionId },
  });

  if (!existingTx) {
    throw Object.assign(
      new Error(`PaymentTransaction with merchantTransactionId "${merchantTransactionId}" not found.`),
      { status: 404 }
    );
  }

  const creds = await resolvePeachCredentials(existingTx.tenantId);
  const effectiveSecret =
    options?.webhookSecretOverride !== undefined
      ? options.webhookSecretOverride
      : creds.webhookSecret;

  const isProd = (process.env.NODE_ENV || 'development') === 'production';
  if (isProd && !effectiveSecret) {
    throw new PeachWebhookSignatureError(
      'PEACH_WEBHOOK_SECRET must be configured in production.'
    );
  }

  if (effectiveSecret) {
    const rawPayload = options?.rawBody ?? JSON.stringify(payload);
    if (!verifyPeachWebhookSignature(rawPayload, signature, effectiveSecret)) {
      throw new PeachWebhookSignatureError();
    }
  }

  const resultCode = String(
    payload?.result?.code || payload?.['result.code'] || ''
  ).trim();
  const registrationId =
    payload?.registrationId || payload?.['registrationId']
      ? String(payload.registrationId || payload['registrationId'])
      : null;
  const paymentBrand =
    payload?.paymentBrand || payload?.['paymentBrand']
      ? String(payload.paymentBrand || payload['paymentBrand'])
      : existingTx.paymentMethod;

  const isSucceeded = PEACH_SUCCESS_CODE_REGEX.test(resultCode);
  const isPending = PEACH_PENDING_CODE_REGEX.test(resultCode);

  const txOutcome = await withTenantTx(existingTx.tenantId, async (tx) => {
    // Acquire row-level lock on PaymentTransaction to guarantee concurrency-safe idempotency
    const lockedRows = await tx.$queryRaw<Array<{ id: string; status: string }>>`
      SELECT "id", "status"
      FROM "payment_transactions"
      WHERE "merchantTransactionId" = ${merchantTransactionId}
      FOR UPDATE
    `;

    const currentStatus = lockedRows[0]?.status ?? existingTx.status;

    if (currentStatus === 'SUCCEEDED') {
      const currentInv = await tx.taxInvoice.findUniqueOrThrow({
        where: { id: existingTx.taxInvoiceId },
      });
      return {
        idempotentDuplicate: true,
        justSettled: false,
        transactionStatus: 'SUCCEEDED',
        invoice: currentInv,
        settledAt: existingTx.settledAt ?? new Date(),
      };
    }

    if (isSucceeded) {
      const settledAt = new Date();
      await tx.paymentTransaction.update({
        where: { id: existingTx.id },
        data: {
          status: 'SUCCEEDED',
          resultCode,
          registrationId,
          paymentMethod: paymentBrand,
          settledAt,
          rawResponse: payload as Prisma.InputJsonValue,
        },
      });

      const currentInv = await tx.taxInvoice.findUniqueOrThrow({
        where: { id: existingTx.taxInvoiceId },
      });

      const nextAmountPaid = bankersRound(
        new Prisma.Decimal(currentInv.amountPaid).add(existingTx.amount),
        2
      );
      const totalIncl = bankersRound(currentInv.totalInclVat, 2);
      const nextInvoiceStatus = nextAmountPaid.gte(totalIncl)
        ? 'PAID'
        : nextAmountPaid.gt(0)
        ? 'PARTIALLY_PAID'
        : currentInv.status;

      const updatedInv = await tx.taxInvoice.update({
        where: { id: currentInv.id },
        data: {
          amountPaid: nextAmountPaid,
          status: nextInvoiceStatus,
        },
      });

      return {
        idempotentDuplicate: false,
        justSettled: true,
        transactionStatus: 'SUCCEEDED',
        invoice: updatedInv,
        settledAt,
      };
    }

    const nextTxStatus = isPending ? 'PENDING' : 'FAILED';
    await tx.paymentTransaction.update({
      where: { id: existingTx.id },
      data: {
        status: nextTxStatus,
        resultCode,
        rawResponse: payload as Prisma.InputJsonValue,
      },
    });

    const unchangedInv = await tx.taxInvoice.findUniqueOrThrow({
      where: { id: existingTx.taxInvoiceId },
    });

    return {
      idempotentDuplicate: false,
      justSettled: false,
      transactionStatus: nextTxStatus,
      invoice: unchangedInv,
      settledAt: new Date(),
    };
  });

  const amountPaidNum = Number(new Prisma.Decimal(txOutcome.invoice.amountPaid).toFixed(2));

  // Emit real-time Socket.io event & enqueue Sage ZA / Xero accounting sync ONLY on first settlement
  if (txOutcome.justSettled) {
    const realtimePayload = {
      taxInvoiceId: txOutcome.invoice.id,
      invoiceNumber: txOutcome.invoice.invoiceNumber,
      status: txOutcome.invoice.status,
      amountSettled: Number(new Prisma.Decimal(existingTx.amount).toFixed(2)),
      amountPaid: amountPaidNum,
      totalInclVat: Number(new Prisma.Decimal(txOutcome.invoice.totalInclVat).toFixed(2)),
      currency: txOutcome.invoice.currency,
      merchantTransactionId,
      settledAt: txOutcome.settledAt.toISOString(),
    };

    if (txOutcome.invoice.projectId) {
      broadcastToProject(
        existingTx.tenantId,
        txOutcome.invoice.projectId,
        'invoice:paid',
        realtimePayload
      );
    }
    broadcastToTenant(existingTx.tenantId, 'invoice:paid', realtimePayload);

    const syncPayload: AccountingSyncJobPayload = {
      tenantId: existingTx.tenantId,
      taxInvoiceId: txOutcome.invoice.id,
      invoiceNumber: txOutcome.invoice.invoiceNumber,
      paymentTransactionId: existingTx.id,
      merchantTransactionId,
      amountPaid: Number(new Prisma.Decimal(existingTx.amount).toFixed(2)),
      currency: txOutcome.invoice.currency,
      provider:
        (txOutcome.invoice.externalAccountingProvider as 'SAGE_ZA' | 'XERO' | null) ??
        'SAGE_ZA',
      settledAt: txOutcome.settledAt.toISOString(),
    };

    if (options?.onEnqueueAccountingSync) {
      await options.onEnqueueAccountingSync(syncPayload);
    } else {
      try {
        await enqueueAccountingSyncJob(syncPayload);
      } catch {
        // Non-fatal when Redis daemon is offline in local dev
      }
    }
  }

  return {
    ok: true,
    idempotentDuplicate: txOutcome.idempotentDuplicate,
    merchantTransactionId,
    transactionStatus: txOutcome.transactionStatus,
    taxInvoiceId: txOutcome.invoice.id,
    invoiceStatus: txOutcome.invoice.status,
    amountPaid: amountPaidNum,
  };
}

export const peachPaymentsService = {
  PEACH_OAUTH_REDIS_KEY,
  resolvePeachCredentials,
  getPeachOAuthToken,
  createCheckoutSession,
  computePeachWebhookSignature,
  verifyPeachWebhookSignature,
  handlePeachWebhook,
  clearPeachLocalTokenCache,
};

export default peachPaymentsService;
