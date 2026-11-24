import crypto from 'node:crypto';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../src/config/db.js';
import { disconnectRedis } from '../src/config/redis.js';
import {
  calculateSaVat,
  calculateZarMarginProtection,
  formatZarCurrency,
  validateSaVatNumber,
  validateCipcNumber,
  validateCsdNumber,
  validateBbbeeLevel,
  bankersRound,
} from '../src/services/saTaxService.js';
import { runBbbeeExpiryAlertSweep } from '../src/workers/bbbeeExpiryWorker.js';

describe('Stage 4 – SARS 15% VAT Engine, ZAR Multi-Currency & SA B2B Firmographics', () => {
  const tenantAId = `tenant-sa-vat-a-${crypto.randomUUID().slice(0, 8)}`;
  const tenantBId = `tenant-sa-vat-b-${crypto.randomUUID().slice(0, 8)}`;
  let ownerUserId = '';
  let expiringAccountId = '';

  beforeAll(async () => {
    await prisma.tenant.createMany({
      data: [
        { id: tenantAId, name: 'Gauteng Engineering Supply (Pty) Ltd' },
        { id: tenantBId, name: 'Durban Maritime Logistics (Pty) Ltd' },
      ],
    });

    const owner = await prisma.user.create({
      data: {
        tenantId: tenantAId,
        email: `sales.lead.${tenantAId}@shogun.co.za`,
        passwordHash: 'hashed_pw',
        displayName: 'Bongani Khumalo',
        role: 'admin',
        isTenantAdmin: true,
      },
    });
    ownerUserId = owner.id;

    const twentyDaysAhead = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000);
    const acc = await prisma.account.create({
      data: {
        tenantId: tenantAId,
        accountNumber: 'ACC-JHB-701',
        accountName: 'Midrand Precision Steel (Pty) Ltd',
        cipcRegistrationNumber: '2021/123456/07',
        vatRegistrationNumber: '4123456789',
        bbbeeLevel: 1,
        bbbeeExpiryDate: twentyDaysAhead,
        csdSupplierNumber: 'MAAA0123456',
        assignedUserId: ownerUserId,
        createdById: ownerUserId,
      },
    });
    expiringAccountId = acc.id;

    await prisma.project.create({
      data: {
        tenantId: tenantAId,
        title: 'Midrand Structural Fabrication',
        ownerId: ownerUserId,
        accountId: expiringAccountId,
      },
    });
  });

  afterAll(async () => {
    try {
      await prisma.tenant.deleteMany({
        where: { id: { in: [tenantAId, tenantBId] } },
      });
    } finally {
      await disconnectRedis();
      await prisma.$disconnect();
    }
  });

  describe('SARS 15% VAT Calculation & Deterministic Banker’s Rounding (saTaxService.ts)', () => {
    it('applies exact Banker’s Rounding (half-to-even) at 2 decimal places', () => {
      // 2.345 -> 2.34 (4 is even), 2.355 -> 2.36 (6 is even)
      expect(Number(bankersRound('2.345', 2).toFixed(2))).toBe(2.34);
      expect(Number(bankersRound('2.355', 2).toFixed(2))).toBe(2.36);
    });

    it('calculates EXCLUSIVE 15% VAT accurately with penny-exact totals', () => {
      const std = calculateSaVat('12500.00', 'EXCLUSIVE');
      expect(std.subtotalExclVat).toBe(12500.0);
      expect(std.vatAmount).toBe(1875.0);
      expect(std.totalInclVat).toBe(14375.0);

      // Banker's rounding check: 10.50 * 0.15 = 1.575 -> rounds half-to-even to 1.58
      const halfEvenUp = calculateSaVat('10.50', 'EXCLUSIVE');
      expect(halfEvenUp.vatAmount).toBe(1.58);
      expect(halfEvenUp.totalInclVat).toBe(12.08);

      // Banker's rounding check: 10.30 * 0.15 = 1.545 -> rounds half-to-even to 1.54
      const halfEvenDown = calculateSaVat('10.30', 'EXCLUSIVE');
      expect(halfEvenDown.vatAmount).toBe(1.54);
      expect(halfEvenDown.totalInclVat).toBe(11.84);
    });

    it('calculates INCLUSIVE 15% VAT accurately and preserves subtotalExclVat + vatAmount === totalInclVat', () => {
      const incl = calculateSaVat('11500.00', 'INCLUSIVE');
      expect(incl.subtotalExclVat).toBe(10000.0);
      expect(incl.vatAmount).toBe(1500.0);
      expect(incl.totalInclVat).toBe(11500.0);

      // Non-terminating division 100.00 / 1.15 = 86.9565217... -> 86.96 excl, 13.04 VAT
      const tricky = calculateSaVat('100.00', 'INCLUSIVE');
      expect(tricky.subtotalExclVat).toBe(86.96);
      expect(tricky.vatAmount).toBe(13.04);
      expect(Number((tricky.subtotalExclVat + tricky.vatAmount).toFixed(2))).toBe(100.0);

      const oddCents = calculateSaVat('99.99', 'INCLUSIVE');
      expect(oddCents.subtotalExclVat).toBe(86.95);
      expect(oddCents.vatAmount).toBe(13.04);
      expect(Number((oddCents.subtotalExclVat + oddCents.vatAmount).toFixed(2))).toBe(99.99);
    });

    it('sets vatAmount to 0.00 for ZERO_RATED and EXEMPT supplies', () => {
      const zeroRated = calculateSaVat('25000.00', 'ZERO_RATED');
      expect(zeroRated.vatRate).toBe(0);
      expect(zeroRated.vatAmount).toBe(0);
      expect(zeroRated.subtotalExclVat).toBe(25000.0);
      expect(zeroRated.totalInclVat).toBe(25000.0);

      const exempt = calculateSaVat('8400.50', 'EXEMPT');
      expect(exempt.vatRate).toBe(0);
      expect(exempt.vatAmount).toBe(0);
      expect(exempt.totalInclVat).toBe(8400.5);
    });

    it('formats ZAR currency values as R 12 500.00 and computes USD-to-ZAR margin protection', () => {
      expect(formatZarCurrency(12500)).toBe('R 12 500.00');
      expect(formatZarCurrency('1450250.5')).toBe('R 1 450 250.50');

      const marginCheck = calculateZarMarginProtection({
        unitPrice: 100, // USD
        costPrice: 85,  // USD (15% margin < 25% target floor)
        sourceCurrency: 'USD',
        quoteCurrency: 'ZAR',
        exchangeRateToZar: '18.50',
        targetMinMarginPercent: 25,
      });

      expect(marginCheck.convertedUnitPriceZar).toBe(1850.0);
      expect(marginCheck.convertedCostPriceZar).toBe(1572.5);
      expect(marginCheck.marginPercent).toBe(15.0);
      expect(marginCheck.isBelowTargetMargin).toBe(true);
      expect(marginCheck.recommendedUnitPriceZar).toBe(2096.67);
    });
  });

  describe('South African B2B Procurement Regex Validators (CIPC, SARS VAT, CSD, B-BBEE)', () => {
    it('validates 10-digit SARS VAT numbers starting with 4', () => {
      expect(validateSaVatNumber('4123456789')).toBe(true);
      expect(validateSaVatNumber('4987654321')).toBe(true);
      expect(validateSaVatNumber('5123456789')).toBe(false); // Must start with 4
      expect(validateSaVatNumber('412345678')).toBe(false);  // Only 9 digits
      expect(validateSaVatNumber('41234567890')).toBe(false); // 11 digits
      expect(validateSaVatNumber('41234ABC89')).toBe(false);
    });

    it('validates CIPC company registration numbers (YYYY/NNNNNN/NN)', () => {
      expect(validateCipcNumber('2021/123456/07')).toBe(true);
      expect(validateCipcNumber('1998/004321/23')).toBe(true);
      expect(validateCipcNumber('21/123456/07')).toBe(false);
      expect(validateCipcNumber('2021-123456-07')).toBe(false);
      expect(validateCipcNumber('2021/12345/07')).toBe(false);
      expect(validateCipcNumber('1899/123456/07')).toBe(false);
    });

    it('validates National Treasury CSD supplier numbers (MAAA + 7 digits) and B-BBEE levels', () => {
      expect(validateCsdNumber('MAAA0123456')).toBe(true);
      expect(validateCsdNumber('MAAA9999999')).toBe(true);
      expect(validateCsdNumber('MAAA123456')).toBe(false);
      expect(validateCsdNumber('CSD01234567')).toBe(false);

      expect(validateBbbeeLevel(1)).toBe(true);
      expect(validateBbbeeLevel(8)).toBe(true);
      expect(validateBbbeeLevel(0)).toBe(true);
      expect(validateBbbeeLevel(9)).toBe(false);
      expect(validateBbbeeLevel(-1)).toBe(false);
    });
  });

  describe('TaxInvoice PostgreSQL FORCE RLS & 30-Day B-BBEE Expiry Reminder Worker', () => {
    it('enforces PostgreSQL FORCE RLS tenant isolation on tax_invoices', async () => {
      const vatCalc = calculateSaVat('10000.00', 'EXCLUSIVE');

      const invA = await prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantAId}, true)`;
        await tx.$executeRawUnsafe('SET LOCAL ROLE shogun_rls_enforced');
        return tx.taxInvoice.create({
          data: {
            tenantId: tenantAId,
            invoiceNumber: 'INV-0001',
            accountId: expiringAccountId,
            status: 'ISSUED',
            currency: 'ZAR',
            subtotalExclVat: vatCalc.decimals.subtotalExclVat,
            vatAmount: vatCalc.decimals.vatAmount,
            totalInclVat: vatCalc.decimals.totalInclVat,
            dueDate: new Date(Date.now() + 30 * 86400000),
            externalAccountingProvider: 'XERO',
          },
        });
      });

      // Query tax_invoices as Tenant B -> must NOT see Tenant A's TaxInvoice
      const visibleToTenantB = await prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantBId}, true)`;
        await tx.$executeRawUnsafe('SET LOCAL ROLE shogun_rls_enforced');
        return tx.taxInvoice.findMany();
      });

      expect(visibleToTenantB.some((i) => i.id === invA.id)).toBe(false);
    });

    it('detects accounts with B-BBEE certificates expiring within 30 days and creates owner renewal alerts', async () => {
      const sweep = await runBbbeeExpiryAlertSweep(tenantAId);
      expect(sweep.expiringAccountsDetected).toBe(1);
      expect(sweep.renewalTasksCreated).toBe(1);
      expect(sweep.alerts[0]?.accountId).toBe(expiringAccountId);
      expect(sweep.alerts[0]?.bbbeeLevel).toBe(1);
    });
  });
});
