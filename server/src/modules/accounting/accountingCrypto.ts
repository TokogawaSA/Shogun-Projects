import crypto from 'node:crypto';

const CIPHER_ALGO = 'aes-256-gcm';
const IV_BYTES = 12;
const VERSION_PREFIX = 'aes256gcm:v1';

function resolveEncryptionKey(overrideSecret?: string): Buffer {
  const rawMaterial =
    overrideSecret ||
    process.env.ACCOUNTING_ENCRYPTION_KEY ||
    process.env.JWT_SECRET ||
    'shogun-sa-accounting-aes256gcm-fallback-key-2026';

  return crypto.createHash('sha256').update(rawMaterial, 'utf8').digest();
}

/**
 * Encrypt accounting API credentials (Sage SA Basic Auth + API key or Xero OAuth 2.0 tokens)
 * using authenticated AES-256-GCM before persisting to PostgreSQL.
 */
export function encryptAccountingCredentials<T extends Record<string, unknown>>(
  credentials: T,
  overrideSecret?: string
): string {
  const key = resolveEncryptionKey(overrideSecret);
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(CIPHER_ALGO, key, iv);

  const plaintext = JSON.stringify(credentials);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${VERSION_PREFIX}:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypt and authenticate AES-256-GCM encrypted accounting credentials.
 */
export function decryptAccountingCredentials<T = Record<string, any>>(
  encryptedPayload: string,
  overrideSecret?: string
): T {
  if (!encryptedPayload || !encryptedPayload.startsWith(`${VERSION_PREFIX}:`)) {
    throw new Error('Malformed or unsupported encrypted accounting credentials payload.');
  }

  const parts = encryptedPayload.split(':');
  if (parts.length !== 5) {
    throw new Error('Invalid AES-256-GCM credential envelope structure.');
  }

  const [, , ivHex, tagHex, cipherHex] = parts;
  const key = resolveEncryptionKey(overrideSecret);
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(tagHex, 'hex');
  const ciphertext = Buffer.from(cipherHex, 'hex');

  const decipher = crypto.createDecipheriv(CIPHER_ALGO, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString(
    'utf8'
  );
  return JSON.parse(decrypted) as T;
}

/**
 * Produce a safe redacted summary of stored credentials for Admin UI display.
 */
export function maskAccountingCredentials(raw: Record<string, any>): Record<string, string> {
  const masked: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (v === undefined || v === null || v === '') continue;
    const str = String(v);
    if (/password|secret|token|apikey/i.test(k)) {
      masked[k] = str.length > 4 ? `••••••••${str.slice(-4)}` : '••••••••';
    } else {
      masked[k] = str;
    }
  }
  return masked;
}
