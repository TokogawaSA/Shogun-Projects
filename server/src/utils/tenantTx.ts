import { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '../config/db.js';

export type TenantTransactionCallback<T> = (
  tx: Prisma.TransactionClient,
  tenantId: string
) => Promise<T>;

/**
 * Execute database operations inside an isolated Prisma transaction.
 * Validates tenant existence and passes the transaction client to the callback.
 */
export async function withTenantTx<T>(
  tenantId: string,
  callback: TenantTransactionCallback<T>,
  options?: {
    maxWait?: number;
    timeout?: number;
    isolationLevel?: Prisma.TransactionIsolationLevel;
  }
): Promise<T> {
  if (!tenantId) {
    throw new Error('Tenant ID is required for multi-tenant database operations.');
  }

  return prisma.$transaction(
    async (tx) => {
      // 1. Verify tenant validity
      const tenant = await tx.tenant.findUnique({
        where: { id: tenantId },
        select: { id: true },
      });

      if (!tenant) {
        throw new Error(`Tenant with ID "${tenantId}" does not exist.`);
      }

      // 2. Execute callback within transaction boundary
      return callback(tx, tenantId);
    },
    {
      maxWait: options?.maxWait ?? 5000,
      timeout: options?.timeout ?? 15000,
      isolationLevel: options?.isolationLevel ?? Prisma.TransactionIsolationLevel.ReadCommitted,
    }
  );
}

export default withTenantTx;
