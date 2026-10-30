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
