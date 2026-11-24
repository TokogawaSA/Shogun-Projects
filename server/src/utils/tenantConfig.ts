import { Prisma } from '@prisma/client';
import { prisma } from '../config/db.js';

/**
 * Retrieves the corporate base currency code for a given tenant,
 * as configured in Currency & Fiscal settings (systemConfig.companyDetails.currency).
 * Returns uppercase 3-letter code (e.g. 'USD', 'EUR', 'GBP', 'ZAR') or fallback 'USD'.
 */
export async function getTenantCurrency(tenantId: string, fallback: string = 'USD'): Promise<string> {
  if (!tenantId) return fallback;
  try {
    const config = await prisma.systemConfig.findFirst({
      where: { tenantId },
      select: { companyDetails: true },
    });
    const details = config?.companyDetails as any;
    if (details?.currency) {
      const match = String(details.currency).match(/^[A-Z]{3}/i);
      if (match) {
        return match[0].toUpperCase();
      }
      return String(details.currency).trim().split(/[\s(]/)[0].toUpperCase();
    }
  } catch (err) {
    console.warn(`[getTenantCurrency] Failed to fetch currency for tenant ${tenantId}:`, err);
  }
  return fallback;
}

/**
 * POPIA Section 72 Cross-Border AI Processing Check.
 * Returns `true` ONLY when `allowOffshoreAiProcessing` has been explicitly enabled
 * for the tenant by a Tenant Administrator or Information Officer. Defaults to `false`.
 */
export async function isOffshoreAiProcessingAllowed(tenantId: string): Promise<boolean> {
  if (!tenantId) return false;

  const config = await prisma.systemConfig.findUnique({
    where: { tenantId },
    select: { companyDetails: true, activeModules: true },
  });

  if (!config) {
    return false;
  }

  const companyDetails = (config.companyDetails as Record<string, unknown>) || {};
  const activeModules = (config.activeModules as Record<string, unknown>) || {};

  if (typeof companyDetails.allowOffshoreAiProcessing === 'boolean') {
    return companyDetails.allowOffshoreAiProcessing;
  }

  if (typeof activeModules.allowOffshoreAiProcessing === 'boolean') {
    return activeModules.allowOffshoreAiProcessing;
  }

  return false;
}

/**
 * Update the tenant's `allowOffshoreAiProcessing` setting in `SystemConfig`.
 */
export async function setOffshoreAiProcessing(
  tenantId: string,
  allowOffshoreAiProcessing: boolean,
  updatedBy?: string
): Promise<{ tenantId: string; allowOffshoreAiProcessing: boolean; updatedAt: Date }> {
  const existing = await prisma.systemConfig.findUnique({
    where: { tenantId },
  });

  const mergedCompanyDetails = {
    ...((existing?.companyDetails as Record<string, unknown>) || {
      name: 'Shogun SA Workspace',
      timezone: 'Africa/Johannesburg',
      currency: 'ZAR (R)',
      fiscalYearStart: 'March',
    }),
    allowOffshoreAiProcessing,
  };

  const mergedActiveModules = {
    ...((existing?.activeModules as Record<string, unknown>) || {
      projects: true,
      tasks: true,
      accounts: true,
      contacts: true,
      deals: true,
    }),
    allowOffshoreAiProcessing,
  };

  const mergedAutoNumbering = (existing?.autoNumbering as Record<string, unknown>) || {
    deals: { prefix: 'DEAL-', nextNumber: 1001, padZeroes: 5 },
    projects: { prefix: 'PRJ-', nextNumber: 2001, padZeroes: 4 },
    accounts: { prefix: 'ACC-', nextNumber: 5001, padZeroes: 4 },
    contacts: { prefix: 'CON-', nextNumber: 8001, padZeroes: 4 },
    tasks: { prefix: 'TSK-', nextNumber: 9001, padZeroes: 5 },
  };

  const saved = await prisma.systemConfig.upsert({
    where: { tenantId },
    create: {
      tenantId,
      companyDetails: mergedCompanyDetails as Prisma.InputJsonValue,
      activeModules: mergedActiveModules as Prisma.InputJsonValue,
      autoNumbering: mergedAutoNumbering as Prisma.InputJsonValue,
      updatedBy: updatedBy ?? 'information_officer',
    },
    update: {
      companyDetails: mergedCompanyDetails as Prisma.InputJsonValue,
      activeModules: mergedActiveModules as Prisma.InputJsonValue,
      updatedBy: updatedBy ?? 'information_officer',
    },
  });

  return {
    tenantId,
    allowOffshoreAiProcessing,
    updatedAt: saved.updatedAt,
  };
}
