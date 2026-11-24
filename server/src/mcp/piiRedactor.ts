import crypto from 'node:crypto';
import { getRedisClient } from '../config/redis.js';

/**
 * Ephemeral Redis TTL for MCP PII redaction maps: 5 minutes (300 seconds).
 * Raw PII never leaves the South African Redis/Node memory boundary.
 */
export const MCP_REDACTION_TTL_SECONDS = 5 * 60; // 300 seconds

export interface RedactionRedisStore {
  set(key: string, value: string, mode: 'EX', ttlSeconds: number): Promise<unknown>;
  get(key: string): Promise<string | null>;
  del?(key: string): Promise<number>;
}

export type PiiTokenCategory =
  | 'SA_ID'
  | 'SA_PHONE'
  | 'EMAIL'
  | 'CIPC_REG'
  | 'SARS_TAX'
  | 'BANK_ACCT';

export interface RedactionVaultRecord {
  tenantId: string;
  requestId: string;
  createdAt: string;
  expiresAt: number;
  /** Map of placeholder token (e.g. `[SA_ID_1]`) -> raw PII string */
  tokenToRaw: Record<string, string>;
}

export interface SanitizeResult<T = unknown> {
  requestId: string;
  redisKey: string;
  ttlSeconds: number;
  sanitized: T;
  redactionCount: number;
  categoriesDetected: PiiTokenCategory[];
  countsByCategory: Partial<Record<PiiTokenCategory, number>>;
}

export interface PiiRedactorOptions {
  redisClient?: RedactionRedisStore | null;
  ttlSeconds?: number;
}

// Local SA process fallback cache with strict TTL enforcement when Redis daemon is offline in dev/CI
const localEphemeralVault = new Map<string, RedactionVaultRecord>();
let defaultRedisCircuitOpenUntil = 0;

function pruneExpiredLocalEntries(nowMs = Date.now()): void {
  for (const [key, entry] of localEphemeralVault.entries()) {
    if (entry.expiresAt <= nowMs) {
      localEphemeralVault.delete(key);
    }
  }
}

export function buildRedactionRedisKey(tenantId: string, requestId: string): string {
  const cleanTenant = (tenantId || '').trim();
  const cleanReq = (requestId || '').trim();
  if (!cleanTenant || !cleanReq) {
    throw new Error('Both tenantId and requestId are required for MCP PII redaction vault keys.');
  }
  return `tenant:${cleanTenant}:mcp:redact:${cleanReq}`;
}

/**
 * Validate standard mod-10 Luhn checksum across a numeric string.
 */
export function isValidLuhn(digits: string): boolean {
  if (!/^\d+$/.test(digits)) return false;

  let sum = 0;
  let shouldDouble = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = digits.charCodeAt(i) - 48;
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

/**
 * Validate a 13-digit South African Identity Number:
 * - Exactly 13 digits (`YYMMDD SSSS C A Z`)
 * - Valid `YYMMDD` calendar date (including leap-year February check)
 * - Citizenship indicator digit `C` (index 10) in `0 | 1 | 2`
 * - Valid 13-digit Luhn checksum
 */
export function isValidSouthAfricanId(rawCandidate: string): boolean {
  const digits = rawCandidate.replace(/[\s-]/g, '');
  if (!/^\d{13}$/.test(digits)) {
    return false;
  }

  const yy = Number.parseInt(digits.slice(0, 2), 10);
  const mm = Number.parseInt(digits.slice(2, 4), 10);
  const dd = Number.parseInt(digits.slice(4, 6), 10);

  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) {
    return false;
  }

  const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (dd > daysInMonth[mm - 1]) {
    return false;
  }

  // For Feb 29, check whether either 19YY or 20YY is a valid leap year
  if (mm === 2 && dd === 29) {
    const year19 = 1900 + yy;
    const year20 = 2000 + yy;
    const isLeap19 = (year19 % 4 === 0 && year19 % 100 !== 0) || year19 % 400 === 0;
    const isLeap20 = (year20 % 4 === 0 && year20 % 100 !== 0) || year20 % 400 === 0;
    if (!isLeap19 && !isLeap20) {
      return false;
    }
  }

  // Citizenship status digit (0 = SA citizen, 1 = permanent resident, 2 = refugee)
  const citizenshipDigit = digits[10];
  if (citizenshipDigit !== '0' && citizenshipDigit !== '1' && citizenshipDigit !== '2') {
    return false;
  }

  return isValidLuhn(digits);
}

class RedactionSession {
  private counters: Record<PiiTokenCategory, number> = {
    SA_ID: 0,
    SA_PHONE: 0,
    EMAIL: 0,
    CIPC_REG: 0,
    SARS_TAX: 0,
    BANK_ACCT: 0,
  };

  private rawToToken = new Map<string, string>();
  public readonly tokenToRaw: Record<string, string> = {};
  public readonly countsByCategory: Partial<Record<PiiTokenCategory, number>> = {};
  public redactionCount = 0;

  public issueToken(category: PiiTokenCategory, rawValue: string): string {
    const normalizedKey = `${category}:${rawValue}`;
    const existing = this.rawToToken.get(normalizedKey);
    if (existing) {
      this.redactionCount += 1;
      return existing;
    }

    this.counters[category] += 1;
    const index = this.counters[category];
    const token = `[${category}_${index}]`;

    this.rawToToken.set(normalizedKey, token);
    this.tokenToRaw[token] = rawValue;
    this.countsByCategory[category] = (this.countsByCategory[category] ?? 0) + 1;
    this.redactionCount += 1;

    return token;
  }

  public sanitizeText(input: string): string {
    if (!input) return input;
    let output = input;

    // 1. Email Addresses -> [EMAIL_n]
    output = output.replace(
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
      (match) => this.issueToken('EMAIL', match)
    );

    // 2. CIPC Company Registration Numbers (YYYY/NNNNNN/NN) -> [CIPC_REG_n]
    output = output.replace(
      /\b(?:19|20)\d{2}\/\d{6}\/\d{2}\b/g,
      (match) => this.issueToken('CIPC_REG', match)
    );

    // 3. 13-Digit South African ID Numbers (validated via YYMMDD + Luhn) -> [SA_ID_n]
    output = output.replace(
      /(?<!\d)(?:\d{13}|\d{6}[\s-]\d{4}[\s-]\d{3})(?!\d)/g,
      (match) => {
        if (isValidSouthAfricanId(match)) {
          return this.issueToken('SA_ID', match);
        }
        return match;
      }
    );

    // 4. Contextual SARS VAT / Income Tax / PAYE Numbers -> [SARS_TAX_n]
    output = output.replace(
      /(\b(?:SARS(?:\s+Tax)?|VAT(?:\s*(?:Reg(?:istration)?|No|Number|#))?|Tax\s*(?:Ref(?:erence)?|No|Number|#)|PAYE)\s*[:#-]?\s*)(\d{10})\b/gi,
      (_full, prefix: string, digits: string) => `${prefix}${this.issueToken('SARS_TAX', digits)}`
    );

    // 5. Contextual Bank Account Numbers (SA Major Banks & Explicit Labels) -> [BANK_ACCT_n]
    output = output.replace(
      /(\b(?:bank\s*account(?:\s*(?:no|number|#))?|acc(?:ount)?\s*(?:no|number|#)|fnb(?:\s*acc(?:ount)?)?|absa(?:\s*acc(?:ount)?)?|nedbank(?:\s*acc(?:ount)?)?|standard\s*bank(?:\s*acc(?:ount)?)?|capitec(?:\s*acc(?:ount)?)?|investec(?:\s*acc(?:ount)?)?|tyme\s*bank|discovery\s*bank)\s*[:#-]?\s*)(\d(?:[\d\s-]{7,14}\d))\b/gi,
      (full, prefix: string, acctRaw: string) => {
        const digitsOnly = acctRaw.replace(/[\s-]/g, '');
        if (digitsOnly.length >= 9 && digitsOnly.length <= 13) {
          return `${prefix}${this.issueToken('BANK_ACCT', acctRaw.trim())}`;
        }
        return full;
      }
    );

    // 6. South African Phone Numbers (+27..., 06x, 07x, 08x, 01x, 02x, 03x, 04x, 05x) -> [SA_PHONE_n]
    output = output.replace(
      /(?<!\w)(?:\+27[\s.-]?(?:\(0\)\s?)?[1-8]\d[\s.-]?\d{3}[\s.-]?\d{4}|\(?0[1-8]\d\)?[\s.-]?\d{3}[\s.-]?\d{4})(?!\d)/g,
      (match) => this.issueToken('SA_PHONE', match)
    );

    // 7. Standalone 10-digit SARS VAT Reference Numbers (4xxxxxxxxx) -> [SARS_TAX_n]
    output = output.replace(
      /(?<![\d+])\b(4\d{9})\b(?![\d])/g,
      (match) => this.issueToken('SARS_TAX', match)
    );

    // 8. Standalone 11-digit SA Bank Account Numbers (e.g. FNB 62/63xxxxxxxxx, Nedbank 10/11xxxxxxxxx, Capitec 12-16xxxxxxxxx) -> [BANK_ACCT_n]
    output = output.replace(
      /(?<![\d+])\b((?:62|63|10|11|12|13|14|15|16)\d{9})\b(?![\d])/g,
      (match) => this.issueToken('BANK_ACCT', match)
    );

    return output;
  }

  public sanitizeDeep<T>(value: T): T {
    if (typeof value === 'string') {
      return this.sanitizeText(value) as unknown as T;
    }
    if (Array.isArray(value)) {
      return value.map((item) => this.sanitizeDeep(item)) as unknown as T;
    }
    if (value && typeof value === 'object' && !(value instanceof Date)) {
      const cloned: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        cloned[k] = this.sanitizeDeep(v);
      }
      return cloned as T;
    }
    return value;
  }
}

function rehydrateTextWithMap(text: string, tokenToRaw: Record<string, string>): string {
  if (!text) return text;
  return text.replace(
    /\[(?:SA_ID|SA_PHONE|EMAIL|CIPC_REG|SARS_TAX|BANK_ACCT)_\d+\]/g,
    (placeholder) =>
      Object.prototype.hasOwnProperty.call(tokenToRaw, placeholder)
        ? tokenToRaw[placeholder]
        : placeholder
  );
}

function rehydrateDeep<T>(value: T, tokenToRaw: Record<string, string>): T {
  if (typeof value === 'string') {
    return rehydrateTextWithMap(value, tokenToRaw) as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => rehydrateDeep(item, tokenToRaw)) as unknown as T;
  }
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    const cloned: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      cloned[k] = rehydrateDeep(v, tokenToRaw);
    }
    return cloned as T;
  }
  return value;
}

function withFastTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('REDIS_VAULT_TIMEOUT')), ms);
    promise.then(
      (val) => {
        clearTimeout(timer);
        resolve(val);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

async function persistVaultRecord(
  redisKey: string,
  record: RedactionVaultRecord,
  ttlSeconds: number,
  customRedis?: RedactionRedisStore | null
): Promise<void> {
  pruneExpiredLocalEntries();
  localEphemeralVault.set(redisKey, record);

  const isDefaultClient = customRedis === undefined;
  if (isDefaultClient && Date.now() < defaultRedisCircuitOpenUntil) {
    return;
  }

  const client: RedactionRedisStore | null = isDefaultClient ? getRedisClient() : customRedis;
  if (client) {
    try {
      await withFastTimeout(
        client.set(redisKey, JSON.stringify(record), 'EX', ttlSeconds),
        350
      );
    } catch {
      if (isDefaultClient) {
        defaultRedisCircuitOpenUntil = Date.now() + 30_000;
      }
    }
  }
}

async function loadVaultRecord(
  redisKey: string,
  customRedis?: RedactionRedisStore | null
): Promise<RedactionVaultRecord | null> {
  const isDefaultClient = customRedis === undefined;
  const client: RedactionRedisStore | null =
    isDefaultClient && Date.now() >= defaultRedisCircuitOpenUntil
      ? getRedisClient()
      : isDefaultClient
      ? null
      : customRedis;
  if (client) {
    try {
      const raw = await withFastTimeout(client.get(redisKey), 350);
      if (raw) {
        return JSON.parse(raw) as RedactionVaultRecord;
      }
    } catch {
      if (isDefaultClient) {
        defaultRedisCircuitOpenUntil = Date.now() + 30_000;
      }
    }
  }

  pruneExpiredLocalEntries();
  return localEphemeralVault.get(redisKey) ?? null;
}

/**
 * Sanitize outbound LLM payloads by replacing South African PII with deterministic placeholders
 * and persisting the lookup map in Redis (`tenant:{tenantId}:mcp:redact:{requestId}`) with a 5-minute TTL.
 */
export async function sanitize<T>(
  tenantId: string,
  payload: T,
  requestId: string = crypto.randomUUID(),
  options?: PiiRedactorOptions
): Promise<SanitizeResult<T>> {
  const ttlSeconds = options?.ttlSeconds ?? MCP_REDACTION_TTL_SECONDS;
  const redisKey = buildRedactionRedisKey(tenantId, requestId);

  const session = new RedactionSession();
  const sanitized = session.sanitizeDeep(payload);

  const record: RedactionVaultRecord = {
    tenantId,
    requestId,
    createdAt: new Date().toISOString(),
    expiresAt: Date.now() + ttlSeconds * 1000,
    tokenToRaw: session.tokenToRaw,
  };

  await persistVaultRecord(redisKey, record, ttlSeconds, options?.redisClient);

  return {
    requestId,
    redisKey,
    ttlSeconds,
    sanitized,
    redactionCount: session.redactionCount,
    categoriesDetected: Object.keys(session.countsByCategory) as PiiTokenCategory[],
    countsByCategory: session.countsByCategory,
  };
}

/**
 * Re-hydrate placeholder tokens (`[SA_ID_1]`, `[SA_PHONE_1]`, `[EMAIL_1]`, `[CIPC_REG_1]`, `[SARS_TAX_1]`, `[BANK_ACCT_1]`)
 * back to original values locally inside the South African boundary using the tenant's Redis TTL vault.
 */
export async function rehydrate<T>(
  tenantId: string,
  payload: T,
  requestId: string,
  options?: PiiRedactorOptions
): Promise<T> {
  const redisKey = buildRedactionRedisKey(tenantId, requestId);
  const record = await loadVaultRecord(redisKey, options?.redisClient);

  if (!record || record.tenantId !== tenantId) {
    return payload;
  }

  return rehydrateDeep(payload, record.tokenToRaw);
}

export const piiRedactor = {
  MCP_REDACTION_TTL_SECONDS,
  isValidLuhn,
  isValidSouthAfricanId,
  buildRedactionRedisKey,
  sanitize,
  rehydrate,
};

export default piiRedactor;
