import crypto from 'node:crypto';
import {
  evaluateDataResidency,
  isApprovedSouthAfricanHost,
  isApprovedSouthAfricanS3Region,
  parseEnv,
} from '../config/env.js';

/**
 * POPIA Section 19 Safeguard: Pre-signed object storage URLs expire strictly within 15 minutes (900 seconds)
 * so files stream directly between client and local SA object storage without buffering in Node.js memory.
 */
export const PRESIGNED_URL_TTL_SECONDS = 15 * 60; // 900 seconds
export const MAX_PRESIGNED_URL_TTL_SECONDS = 15 * 60; // 900 seconds

const SAFE_SEGMENT_REGEX = /^[a-zA-Z0-9_-]+$/;
const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class TenantStorageIsolationError extends Error {
  public readonly code = 'TENANT_STORAGE_ISOLATION_VIOLATION';

  constructor(message: string) {
    super(message);
    this.name = 'TenantStorageIsolationError';
  }
}

export interface PresignedUploadRequest {
  tenantId: string;
  module: string;
  filename: string;
  contentType?: string;
  expiresInSeconds?: number;
  uuid?: string;
  key?: string;
}

export interface PresignedDownloadRequest {
  tenantId: string;
  key: string;
  expiresInSeconds?: number;
  responseContentDisposition?: 'inline' | 'attachment';
}

export interface PresignedUrlResult {
  url: string;
  key: string;
  bucket: string;
  region: string;
  method: 'PUT' | 'GET';
  expiresInSeconds: number;
  expiresAt: string;
  requiredHeaders?: Record<string, string>;
}

/**
 * Sanitize an untrusted user filename, stripping directory traversal components and unsafe characters.
 */
export function sanitizeFilename(rawFilename: string): string {
  if (!rawFilename || typeof rawFilename !== 'string') {
    throw new TenantStorageIsolationError('Filename is required for tenant storage key generation.');
  }

  if (rawFilename.includes('\0')) {
    throw new TenantStorageIsolationError('Null bytes are prohibited in storage filenames.');
  }

  // Strip any Unix or Windows directory prefixes
  const base = rawFilename.split(/[/\\]/).pop()?.trim() || '';
  if (!base || base === '.' || base === '..') {
    throw new TenantStorageIsolationError(`Invalid filename "${rawFilename}".`);
  }

  const sanitized = base
    .normalize('NFKD')
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/\.{2,}/g, '.')
    .replace(/-{2,}/g, '-')
    .replace(/-+\./g, '.')
    .replace(/\.+-/g, '.')
    .replace(/^[.-]+|[.-]+$/g, '')
    .slice(0, 180);

  if (!sanitized) {
    throw new TenantStorageIsolationError(`Filename "${rawFilename}" contains no valid safe characters.`);
  }

  return sanitized;
}

function assertSafeIdentifier(value: string, label: 'tenantId' | 'module'): string {
  const trimmed = (value || '').trim();
  if (!trimmed || !SAFE_SEGMENT_REGEX.test(trimmed)) {
    throw new TenantStorageIsolationError(
      `Invalid ${label} "${value}". Only alphanumeric characters, hyphens, and underscores are permitted.`
    );
  }
  return trimmed;
}

/**
 * Construct a strictly namespaced tenant object key:
 * `tenants/${tenantId}/${module}/${uuid}-${sanitizedFilename}`
 */
export function buildTenantStorageKey(
  tenantId: string,
  module: string,
  filename: string,
  customUuid?: string
): string {
  const safeTenantId = assertSafeIdentifier(tenantId, 'tenantId');
  const safeModule = assertSafeIdentifier(module, 'module');
  const safeFilename = sanitizeFilename(filename);
  const objectUuid = customUuid ?? crypto.randomUUID();

  if (!UUID_V4_REGEX.test(objectUuid)) {
    throw new TenantStorageIsolationError(`Invalid UUID "${objectUuid}" supplied for tenant storage key.`);
  }

  return `tenants/${safeTenantId}/${safeModule}/${objectUuid}-${safeFilename}`;
}

/**
 * Assert that an object storage path strictly resides under `tenants/${tenantId}/`
 * and contains no path traversal, encoded slashes, backslashes, or cross-tenant references.
 */
export function assertTenantKeyNamespace(tenantId: string, key: string): string {
  const safeTenantId = assertSafeIdentifier(tenantId, 'tenantId');

  if (!key || typeof key !== 'string') {
    throw new TenantStorageIsolationError('Storage object key must be a non-empty string.');
  }

  if (
    key.includes('\0') ||
    key.includes('\\') ||
    key.startsWith('/') ||
    /%2e|%2f|%5c/i.test(key)
  ) {
    throw new TenantStorageIsolationError(
      `Storage key "${key}" contains prohibited path characters or encoded traversal sequences.`
    );
  }

  const segments = key.split('/');
  if (segments.some((segment) => !segment || segment === '.' || segment === '..')) {
    throw new TenantStorageIsolationError(
      `Storage key "${key}" contains empty or relative path traversal segments.`
    );
  }

  const requiredPrefix = `tenants/${safeTenantId}/`;
  if (!key.startsWith(requiredPrefix)) {
    throw new TenantStorageIsolationError(
      `Access denied: Storage key "${key}" is missing required tenant prefix "${requiredPrefix}".`
    );
  }

  // Enforce `tenants/${tenantId}/${module}/${filename}` (minimum 4 path segments)
  if (segments.length < 4) {
    throw new TenantStorageIsolationError(
      `Storage key "${key}" must follow "tenants/${safeTenantId}/<module>/<uuid>-<filename>".`
    );
  }

  assertSafeIdentifier(segments[2], 'module');

  return key;
}

function validateTtlSeconds(expiresInSeconds?: number): number {
  const ttl = expiresInSeconds ?? PRESIGNED_URL_TTL_SECONDS;
  if (!Number.isInteger(ttl) || ttl <= 0 || ttl > MAX_PRESIGNED_URL_TTL_SECONDS) {
    throw new Error(
      `Pre-signed URL expiration (${ttl}s) must be a positive integer not exceeding ${MAX_PRESIGNED_URL_TTL_SECONDS} seconds (15 minutes).`
    );
  }
  return ttl;
}

function encodeRfc3986(str: string): string {
  return encodeURIComponent(str).replace(
    /[!'()*]/g,
    (ch) => `%${ch.charCodeAt(0).toString(16).toUpperCase()}`
  );
}

function hmacSha256(key: Buffer | string, data: string): Buffer {
  return crypto.createHmac('sha256', key).update(data, 'utf8').digest();
}

function sha256Hex(data: string): string {
  return crypto.createHash('sha256').update(data, 'utf8').digest('hex');
}

function formatAmzDates(now: Date): { amzDate: string; dateStamp: string } {
  const iso = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  return {
    amzDate: iso,
    dateStamp: iso.slice(0, 8),
  };
}

interface ResolvedS3Target {
  endpointOrigin: string;
  hostHeader: string;
  canonicalUri: string;
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
}

function resolveSouthAfricanS3Target(
  objectKey: string,
  rawEnv: NodeJS.ProcessEnv = process.env
): ResolvedS3Target {
  const cfg = parseEnv(rawEnv);

  if (cfg.ENFORCE_LOCAL_RESIDENCY) {
    if (!isApprovedSouthAfricanS3Region(cfg.S3_REGION)) {
      throw new TenantStorageIsolationError(
        `POPIA Section 72 violation: S3_REGION "${cfg.S3_REGION}" is outside approved South African storage regions.`
      );
    }
    if (cfg.S3_ENDPOINT && !isApprovedSouthAfricanHost(cfg.S3_ENDPOINT)) {
      throw new TenantStorageIsolationError(
        `POPIA Section 72 violation: S3_ENDPOINT "${cfg.S3_ENDPOINT}" resolves outside approved South African infrastructure.`
      );
    }
  }

  const encodedKeyPath = objectKey.split('/').map(encodeRfc3986).join('/');
  const encodedBucket = encodeRfc3986(cfg.S3_BUCKET);

  let endpointUrl: URL;
  let canonicalUri: string;

  if (cfg.S3_ENDPOINT) {
    const base = new URL(cfg.S3_ENDPOINT);
    if (cfg.NODE_ENV === 'production' && base.protocol !== 'https:') {
      throw new Error('POPIA Section 19 violation: S3_ENDPOINT must use HTTPS in production.');
    }
    if (cfg.S3_FORCE_PATH_STYLE) {
      endpointUrl = new URL(base.origin);
      const basePath = base.pathname.replace(/\/+$/, '');
      canonicalUri = `${basePath}/${encodedBucket}/${encodedKeyPath}`;
    } else {
      endpointUrl = new URL(`${base.protocol}//${cfg.S3_BUCKET}.${base.host}`);
      const basePath = base.pathname.replace(/\/+$/, '');
      canonicalUri = `${basePath}/${encodedKeyPath}`;
    }
  } else {
    if (cfg.S3_FORCE_PATH_STYLE) {
      endpointUrl = new URL(`https://s3.${cfg.S3_REGION}.amazonaws.com`);
      canonicalUri = `/${encodedBucket}/${encodedKeyPath}`;
    } else {
      endpointUrl = new URL(`https://${cfg.S3_BUCKET}.s3.${cfg.S3_REGION}.amazonaws.com`);
      canonicalUri = `/${encodedKeyPath}`;
    }
  }

  const accessKeyId = cfg.S3_ACCESS_KEY_ID || 'sa-local-unconfigured-key';
  const secretAccessKey = cfg.S3_SECRET_ACCESS_KEY || 'sa-local-unconfigured-secret';

  return {
    endpointOrigin: endpointUrl.origin,
    hostHeader: endpointUrl.host,
    canonicalUri,
    bucket: cfg.S3_BUCKET,
    region: cfg.S3_REGION,
    accessKeyId,
    secretAccessKey,
  };
}

/**
 * Generate an AWS Signature Version 4 (AWS4-HMAC-SHA256) pre-signed URL for direct client <-> S3 streaming.
 */
function signS3PresignedUrl(params: {
  method: 'PUT' | 'GET';
  key: string;
  expiresInSeconds: number;
  extraQueryParams?: Record<string, string>;
  extraSignedHeaders?: Record<string, string>;
  rawEnv?: NodeJS.ProcessEnv;
  now?: Date;
}): PresignedUrlResult {
  const now = params.now ?? new Date();
  const target = resolveSouthAfricanS3Target(params.key, params.rawEnv);
  const { amzDate, dateStamp } = formatAmzDates(now);
  const credentialScope = `${dateStamp}/${target.region}/s3/aws4_request`;

  const headersToSign: Record<string, string> = {
    host: target.hostHeader,
  };

  if (params.extraSignedHeaders) {
    for (const [k, v] of Object.entries(params.extraSignedHeaders)) {
      headersToSign[k.toLowerCase().trim()] = v.trim();
    }
  }

  const sortedHeaderKeys = Object.keys(headersToSign).sort();
  const signedHeadersList = sortedHeaderKeys.join(';');
  const canonicalHeaders = sortedHeaderKeys.map((k) => `${k}:${headersToSign[k]}\n`).join('');

  const queryEntries: Array<[string, string]> = [
    ['X-Amz-Algorithm', 'AWS4-HMAC-SHA256'],
    ['X-Amz-Credential', `${target.accessKeyId}/${credentialScope}`],
    ['X-Amz-Date', amzDate],
    ['X-Amz-Expires', String(params.expiresInSeconds)],
    ['X-Amz-SignedHeaders', signedHeadersList],
  ];

  if (params.extraQueryParams) {
    for (const [qk, qv] of Object.entries(params.extraQueryParams)) {
      queryEntries.push([qk, qv]);
    }
  }

  queryEntries.sort(([aKey, aVal], [bKey, bVal]) => {
    const keyCmp = encodeRfc3986(aKey).localeCompare(encodeRfc3986(bKey));
    return keyCmp !== 0 ? keyCmp : encodeRfc3986(aVal).localeCompare(encodeRfc3986(bVal));
  });

  const canonicalQueryString = queryEntries
    .map(([k, v]) => `${encodeRfc3986(k)}=${encodeRfc3986(v)}`)
    .join('&');

  const canonicalRequest = [
    params.method,
    target.canonicalUri,
    canonicalQueryString,
    canonicalHeaders,
    signedHeadersList,
    'UNSIGNED-PAYLOAD',
  ].join('\n');

  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join('\n');

  const kDate = hmacSha256(`AWS4${target.secretAccessKey}`, dateStamp);
  const kRegion = hmacSha256(kDate, target.region);
  const kService = hmacSha256(kRegion, 's3');
  const kSigning = hmacSha256(kService, 'aws4_request');
  const signature = crypto.createHmac('sha256', kSigning).update(stringToSign, 'utf8').digest('hex');

  const finalUrl = `${target.endpointOrigin}${target.canonicalUri}?${canonicalQueryString}&X-Amz-Signature=${signature}`;
  const expiresAt = new Date(now.getTime() + params.expiresInSeconds * 1000).toISOString();

  return {
    url: finalUrl,
    key: params.key,
    bucket: target.bucket,
    region: target.region,
    method: params.method,
    expiresInSeconds: params.expiresInSeconds,
    expiresAt,
    ...(params.extraSignedHeaders ? { requiredHeaders: params.extraSignedHeaders } : {}),
  };
}

/**
 * Generate a short-lived (15-minute max) pre-signed PUT URL for direct browser/client upload to SA Object Storage.
 */
export async function createPresignedUploadUrl(
  request: PresignedUploadRequest,
  rawEnv: NodeJS.ProcessEnv = process.env
): Promise<PresignedUrlResult> {
  const expiresInSeconds = validateTtlSeconds(request.expiresInSeconds);

  const key = request.key
    ? assertTenantKeyNamespace(request.tenantId, request.key)
    : buildTenantStorageKey(request.tenantId, request.module, request.filename, request.uuid);

  // Double-verify generated or provided key against strict tenant prefix policy
  assertTenantKeyNamespace(request.tenantId, key);

  const extraSignedHeaders = request.contentType
    ? { 'content-type': request.contentType }
    : undefined;

  return signS3PresignedUrl({
    method: 'PUT',
    key,
    expiresInSeconds,
    extraSignedHeaders,
    rawEnv,
  });
}

/**
 * Generate a short-lived (15-minute max) pre-signed GET URL for direct download from SA Object Storage.
 * Strictly rejects any key missing the `tenants/${tenantId}/` prefix.
 */
export async function createPresignedDownloadUrl(
  request: PresignedDownloadRequest,
  rawEnv: NodeJS.ProcessEnv = process.env
): Promise<PresignedUrlResult> {
  const expiresInSeconds = validateTtlSeconds(request.expiresInSeconds);
  const validatedKey = assertTenantKeyNamespace(request.tenantId, request.key);

  const extraQueryParams = request.responseContentDisposition
    ? { 'response-content-disposition': request.responseContentDisposition }
    : undefined;

  return signS3PresignedUrl({
    method: 'GET',
    key: validatedKey,
    expiresInSeconds,
    extraQueryParams,
    rawEnv,
  });
}

export const storageService = {
  PRESIGNED_URL_TTL_SECONDS,
  MAX_PRESIGNED_URL_TTL_SECONDS,
  sanitizeFilename,
  buildTenantStorageKey,
  assertTenantKeyNamespace,
  validateTenantKey: assertTenantKeyNamespace,
  createPresignedUploadUrl,
  createPresignedDownloadUrl,
  getResidencyStatus: (rawEnv: NodeJS.ProcessEnv = process.env) =>
    evaluateDataResidency(rawEnv, { logWarnings: false }),
};

export default storageService;
