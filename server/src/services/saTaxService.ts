import { Prisma } from '@prisma/client';

export type SaTaxMode = 'EXCLUSIVE' | 'INCLUSIVE' | 'ZERO_RATED' | 'EXEMPT';
export type SupportedQuoteCurrency = 'ZAR' | 'USD' | 'EUR' | 'GBP';

export const SA_STANDARD_VAT_RATE = new Prisma.Decimal('0.1500');

export const DEFAULT_EXCHANGE_RATES_TO_ZAR: Record<SupportedQuoteCurrency, string> = {
  ZAR: '1.000000',
  USD: '18.500000',
  EUR: '20.100000',
  GBP: '23.400000',
};

const SA_VAT_REGEX = /^4\d{9}$/;
const CIPC_REG_REGEX = /^(?:19|20)\d{2}\/\d{6}\/\d{2}$/;
const CSD_SUPPLIER_REGEX = /^MAAA\d{7}$/;

/**
 * Deterministic Banker's Rounding (Round Half to Even) using arbitrary-precision Decimal arithmetic.
 */
export function bankersRound(
  value: number | string | Prisma.Decimal,
  decimalPlaces = 2
): Prisma.Decimal {
  return new Prisma.Decimal(value).toDecimalPlaces(
    decimalPlaces,
    Prisma.Decimal.ROUND_HALF_EVEN
  );
}

export interface SaVatCalculationResult {
  taxMode: SaTaxMode;
  vatRate: number;
  subtotalExclVat: number;
  vatAmount: number;
  totalInclVat: number;
  decimals: {
    vatRate: Prisma.Decimal;
    subtotalExclVat: Prisma.Decimal;
    vatAmount: Prisma.Decimal;
    totalInclVat: Prisma.Decimal;
  };
}

/**
 * Calculate South African SARS VAT breakdown using deterministic Banker's Rounding (2 decimal places):
 * - `EXCLUSIVE`: `vatAmount = round(subtotal * vatRate)`, `totalInclVat = subtotal + vatAmount`
 * - `INCLUSIVE`: `subtotalExclVat = round(total / (1 + vatRate))`, `vatAmount = total - subtotalExclVat`
 * - `ZERO_RATED` | `EXEMPT`: `vatAmount = 0.00`, `totalInclVat = subtotalExclVat`
 */
export function calculateSaVat(
  amount: number | string | Prisma.Decimal,
  taxMode: SaTaxMode = 'EXCLUSIVE',
  vatRateInput: number | string | Prisma.Decimal = SA_STANDARD_VAT_RATE
): SaVatCalculationResult {
  const baseAmount = bankersRound(amount, 2);
  const rawRate = new Prisma.Decimal(vatRateInput);

  if (baseAmount.isNegative()) {
    throw new Error('Taxable amount cannot be negative.');
  }
  if (rawRate.isNegative()) {
    throw new Error('VAT rate cannot be negative.');
  }

  let effectiveRate = rawRate;
  let subtotalExclVat: Prisma.Decimal;
  let vatAmount: Prisma.Decimal;
  let totalInclVat: Prisma.Decimal;

  if (taxMode === 'ZERO_RATED' || taxMode === 'EXEMPT') {
    effectiveRate = new Prisma.Decimal(0);
    subtotalExclVat = baseAmount;
    vatAmount = new Prisma.Decimal('0.00');
    totalInclVat = baseAmount;
  } else if (taxMode === 'INCLUSIVE') {
    totalInclVat = baseAmount;
    const divisor = new Prisma.Decimal(1).add(effectiveRate);
    subtotalExclVat = bankersRound(totalInclVat.div(divisor), 2);
    vatAmount = bankersRound(totalInclVat.sub(subtotalExclVat), 2);
  } else {
    // EXCLUSIVE (default)
    subtotalExclVat = baseAmount;
    vatAmount = bankersRound(subtotalExclVat.mul(effectiveRate), 2);
    totalInclVat = bankersRound(subtotalExclVat.add(vatAmount), 2);
  }

  return {
    taxMode,
    vatRate: Number(effectiveRate.toFixed(4)),
    subtotalExclVat: Number(subtotalExclVat.toFixed(2)),
    vatAmount: Number(vatAmount.toFixed(2)),
    totalInclVat: Number(totalInclVat.toFixed(2)),
    decimals: {
      vatRate: effectiveRate,
      subtotalExclVat,
      vatAmount,
      totalInclVat,
    },
  };
}

export interface ZarConversionMarginResult {
  convertedUnitPriceZar: number;
  convertedCostPriceZar: number;
  marginAmountZar: number;
  marginPercent: number;
  isBelowTargetMargin: boolean;
  recommendedUnitPriceZar: number;
}

/**
 * Convert foreign-denominated (USD/EUR/GBP) catalog item prices & costs into ZAR
 * using `exchangeRateToZar`, evaluating live profit margin erosion and computing
 * a margin-protected ZAR selling price when FX fluctuations compress margins.
 */
export function calculateZarMarginProtection(params: {
  unitPrice: number | string | Prisma.Decimal;
  costPrice: number | string | Prisma.Decimal;
  sourceCurrency?: string;
  quoteCurrency?: string;
  exchangeRateToZar: number | string | Prisma.Decimal;
  targetMinMarginPercent?: number;
}): ZarConversionMarginResult {
  const fx = new Prisma.Decimal(params.exchangeRateToZar || 1);
  if (fx.lte(0)) {
    throw new Error('exchangeRateToZar must be greater than zero.');
  }

  const srcCurrency = (params.sourceCurrency || 'ZAR').toUpperCase();
  const dstCurrency = (params.quoteCurrency || 'ZAR').toUpperCase();
  const minMarginPct = new Prisma.Decimal(params.targetMinMarginPercent ?? 25);

  const rawUnit = new Prisma.Decimal(params.unitPrice || 0);
  const rawCost = new Prisma.Decimal(params.costPrice || 0);

  // Convert foreign catalog unit & cost into ZAR when quoting in ZAR from USD/EUR/GBP catalog items
  const multiplier = srcCurrency !== 'ZAR' && dstCurrency === 'ZAR' ? fx : new Prisma.Decimal(1);

  const convertedUnit = bankersRound(rawUnit.mul(multiplier), 2);
  const convertedCost = bankersRound(rawCost.mul(multiplier), 2);
  const marginAmt = bankersRound(convertedUnit.sub(convertedCost), 2);

  const marginPct = convertedUnit.gt(0)
    ? bankersRound(marginAmt.div(convertedUnit).mul(100), 2)
    : new Prisma.Decimal(0);

  // Margin-protected unit price: cost / (1 - targetMarginPct / 100)
  const denominator = new Prisma.Decimal(1).sub(minMarginPct.div(100));
  const recommendedUnit =
    denominator.gt(0) && convertedCost.gt(0)
      ? bankersRound(convertedCost.div(denominator), 2)
      : convertedUnit;

  return {
    convertedUnitPriceZar: Number(convertedUnit.toFixed(2)),
    convertedCostPriceZar: Number(convertedCost.toFixed(2)),
    marginAmountZar: Number(marginAmt.toFixed(2)),
    marginPercent: Number(marginPct.toFixed(2)),
    isBelowTargetMargin: marginPct.lt(minMarginPct),
    recommendedUnitPriceZar: Number(recommendedUnit.toFixed(2)),
  };
}

/**
 * Format an amount in South African Rand notation: `R 12 500.00`
 */
export function formatZarCurrency(amount: number | string | Prisma.Decimal): string {
  const rounded = bankersRound(amount, 2);
  const isNeg = rounded.isNegative();
  const absFixed = rounded.abs().toFixed(2);
  const [intPart, decPart] = absFixed.split('.');
  const spacedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${isNeg ? '-' : ''}R ${spacedInt}.${decPart}`;
}

/**
 * Validate a 10-digit South African SARS VAT registration number starting with `4`.
 */
export function validateSaVatNumber(vat: string): boolean {
  if (typeof vat !== 'string') return false;
  return SA_VAT_REGEX.test(vat.trim());
}

/**
 * Validate a South African CIPC Company Registration Number (`YYYY/NNNNNN/NN`).
 */
export function validateCipcNumber(reg: string): boolean {
  if (typeof reg !== 'string') return false;
  return CIPC_REG_REGEX.test(reg.trim());
}

/**
 * Validate a South African National Treasury Central Supplier Database (CSD) number (`MAAA` + 7 digits).
 */
export function validateCsdNumber(csd: string): boolean {
  if (typeof csd !== 'string') return false;
  return CSD_SUPPLIER_REGEX.test(csd.trim());
}

/**
 * Validate B-BBEE Contributor Status Level (`1..8`, or `0` for Non-Compliant).
 */
export function validateBbbeeLevel(level: unknown): boolean {
  if (typeof level !== 'number' || !Number.isInteger(level)) return false;
  return level >= 0 && level <= 8;
}

/**
 * Generate the next sequential tenant-scoped SARS TaxInvoice number (e.g. `INV-0001`).
 */
export async function generateNextTaxInvoiceNumber(
  tx: Prisma.TransactionClient,
  tenantId: string
): Promise<string> {
  const sysConfig = await tx.systemConfig.findUnique({
    where: { tenantId },
  });

  const numbering = ((sysConfig?.autoNumbering as Record<string, any>) || {});
  const invCfg = numbering.invoices || { prefix: 'INV-', nextNumber: 1, padZeroes: 4 };

  const existingCount = await tx.taxInvoice.count({ where: { tenantId } });
  const nextSeq = Math.max(Number(invCfg.nextNumber) || 1, existingCount + 1);
  const prefix = typeof invCfg.prefix === 'string' ? invCfg.prefix : 'INV-';
  const pad = Number(invCfg.padZeroes) || 4;
  const formatted = `${prefix}${String(nextSeq).padStart(pad, '0')}`;

  if (sysConfig) {
    await tx.systemConfig.update({
      where: { tenantId },
      data: {
        autoNumbering: {
          ...numbering,
          invoices: {
            prefix,
            nextNumber: nextSeq + 1,
            padZeroes: pad,
          },
        } as Prisma.InputJsonValue,
      },
    });
  }

  return formatted;
}

export const saTaxService = {
  SA_STANDARD_VAT_RATE,
  DEFAULT_EXCHANGE_RATES_TO_ZAR,
  bankersRound,
  calculateSaVat,
  calculateZarMarginProtection,
  formatZarCurrency,
  validateSaVatNumber,
  validateCipcNumber,
  validateCsdNumber,
  validateBbbeeLevel,
  generateNextTaxInvoiceNumber,
};

export default saTaxService;
