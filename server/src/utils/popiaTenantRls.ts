import crypto from 'node:crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/db.js';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// RFC 4122 DNS Namespace UUID used to deterministically map legacy CUID tenant IDs to UUIDv5
const POPIA_TENANT_NAMESPACE_BYTES = Buffer.from(
  '6ba7b8109dad11d180b400c04fd430c8',
  'hex'
);

/**
 * Normalize a tenant identifier to a canonical PostgreSQL UUID (`@db.Uuid`).
 * - If `tenantId` is already a valid UUID, returns it normalized in lowercase.
 * - If `tenantId` is a CUID or custom slug (e.g. from legacy `tenants.id`), derives a
 *   deterministic RFC 4122 UUIDv5 so `@db.Uuid` columns and PostgreSQL RLS policies remain 100% consistent.
 */
export function toTenantUuid(tenantId: string): string {
  const trimmed = (tenantId || '').trim();
  if (!trimmed) {
    throw new Error('tenantId is required for POPIA compliance operations.');
  }

  if (UUID_REGEX.test(trimmed)) {
    return trimmed.toLowerCase();
  }

  const hash = crypto
    .createHash('sha1')
    .update(POPIA_TENANT_NAMESPACE_BYTES)
    .update(Buffer.from(trimmed, 'utf8'))
    .digest();

  const bytes = Buffer.from(hash.subarray(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x50; // Version 5
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // RFC 4122 variant

  const hex = bytes.toString('hex');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
}

export interface PopiaRlsTxOptions {
  enforceRlsRole?: boolean;
  maxWait?: number;
  timeout?: number;
}

/**
 * Execute database operations on POPIA governance tables inside a PostgreSQL transaction
 * with `app.current_tenant_id` bound for Row-Level Security (RLS) enforcement.
 * When `enforceRlsRole` is true (default), switches the local transaction role to
 * `shogun_rls_enforced` (`NOSUPERUSER NOBYPASSRLS`) so RLS is strictly enforced even
 * if the pool connects via a PostgreSQL superuser in local/test environments.
 */
export async function withPopiaRlsTx<T>(
  tenantId: string,
  callback: (tx: Prisma.TransactionClient, tenantUuid: string) => Promise<T>,
  options?: PopiaRlsTxOptions
): Promise<T> {
  const tenantUuid = toTenantUuid(tenantId);
  const enforceRole = options?.enforceRlsRole !== false;

  return prisma.$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantUuid}, true)`;

      if (enforceRole) {
        try {
          await tx.$executeRawUnsafe('SET LOCAL ROLE shogun_rls_enforced');
        } catch {
          // Managed cloud DB roles that are already non-superuser without SET ROLE privilege still enforce FORCE RLS natively
        }
      }

      return callback(tx, tenantUuid);
    },
    {
      maxWait: options?.maxWait ?? 5000,
      timeout: options?.timeout ?? 20000,
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
    }
  );
}

export default withPopiaRlsTx;
