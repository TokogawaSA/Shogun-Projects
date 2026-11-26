import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/db.js';
import { withTenantTx } from '../utils/tenantTx.js';
import { enqueueAccountingSyncJob } from '../queues/index.js';
import {
  calculateSaVat,
  generateNextTaxInvoiceNumber,
  type SaTaxMode,
} from '../services/saTaxService.js';

// ============================================================================
// 1. PRODUCTS & SERVICES CRUD
// ============================================================================

function sendCatalogError(res: Response, errorMessage: string, err: any): void {
  res.status(500).json({
    error: errorMessage,
    ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
  });
}

export async function getProducts(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;
    const products = await prisma.productOrService.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(products);
  } catch (err: any) {
    sendCatalogError(res, 'Failed to fetch products/services.', err);
  }
}

export async function getProductById(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;

    const product = await prisma.productOrService.findFirst({
      where: { id, tenantId },
    });

    if (!product) {
      res.status(404).json({ error: 'Product or Service not found.' });
      return;
    }

    res.json(product);
  } catch (err: any) {
    sendCatalogError(res, 'Failed to fetch item.', err);
  }
}

export async function createProduct(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;
    const data = req.body;

    const product = await prisma.productOrService.create({
      data: {
        tenantId,
        type: data.type || 'product',
        sku: data.sku || `SKU-${Date.now().toString().slice(-6)}`,
        name: data.name,
        description: data.description,
        unitPrice: Number(data.unitPrice || 0),
        costPrice: Number(data.costPrice || 0),
        taxRatePercent: Number(data.taxRatePercent || 0),
        inventoryQty: data.inventoryQty !== undefined ? Number(data.inventoryQty) : 0,
        reorderLevel: data.reorderLevel !== undefined ? Number(data.reorderLevel) : 5,
        billingFrequency: data.billingFrequency || 'one_time',
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
        category: data.category,
      },
    });

    res.status(201).json(product);
  } catch (err: any) {
    sendCatalogError(res, 'Failed to create product.', err);
  }
}

export async function updateProduct(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;
    const data = req.body;

    const existing = await prisma.productOrService.findFirst({ where: { id, tenantId } });
    if (!existing) {
      res.status(404).json({ error: 'Product/Service not found.' });
      return;
    }

    const updated = await prisma.productOrService.update({
      where: { id },
      data: {
        type: data.type,
        sku: data.sku,
        name: data.name,
        description: data.description,
        unitPrice: data.unitPrice !== undefined ? Number(data.unitPrice) : undefined,
        costPrice: data.costPrice !== undefined ? Number(data.costPrice) : undefined,
        taxRatePercent: data.taxRatePercent !== undefined ? Number(data.taxRatePercent) : undefined,
        inventoryQty: data.inventoryQty !== undefined ? Number(data.inventoryQty) : undefined,
        reorderLevel: data.reorderLevel !== undefined ? Number(data.reorderLevel) : undefined,
        billingFrequency: data.billingFrequency,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : undefined,
        category: data.category,
      },
    });

    res.json(updated);
  } catch (err: any) {
    sendCatalogError(res, 'Failed to update product.', err);
  }
}

export async function deleteProduct(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;

    const existing = await prisma.productOrService.findFirst({ where: { id, tenantId } });
    if (!existing) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }

    await prisma.productOrService.delete({ where: { id } });
    res.json({ message: 'Product deleted successfully.', id });
  } catch (err: any) {
    sendCatalogError(res, 'Failed to delete product.', err);
  }
}

// ============================================================================
// 2. PRICE BOOKS CRUD
// ============================================================================

export async function getPriceBooks(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;
    const priceBooks = await prisma.priceBook.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(priceBooks);
  } catch (err: any) {
    sendCatalogError(res, 'Failed to fetch price books.', err);
  }
}

export async function createPriceBook(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;
    const data = req.body;

    const taxMode: SaTaxMode = data.taxMode || 'EXCLUSIVE';
    const vatCalc = calculateSaVat(data.subtotalExclVat ?? 0, taxMode, data.vatRate ?? '0.1500');

    const priceBook = await prisma.priceBook.create({
      data: {
        tenantId,
        name: data.name,
        description: data.description,
        pricingRules: data.pricingRules || {},
        isDefault: Boolean(data.isDefault),
        currency: data.currency || 'ZAR',
        exchangeRateToZar: new Prisma.Decimal(data.exchangeRateToZar ?? '1.000000'),
        rateLockedAt: data.rateLockedAt ? new Date(data.rateLockedAt) : null,
        taxMode,
        vatRate: vatCalc.decimals.vatRate,
        subtotalExclVat: vatCalc.decimals.subtotalExclVat,
        vatAmount: vatCalc.decimals.vatAmount,
        totalInclVat: vatCalc.decimals.totalInclVat,
      },
    });

    res.status(201).json(priceBook);
  } catch (err: any) {
    sendCatalogError(res, 'Failed to create price book.', err);
  }
}

// ============================================================================
// 3. INVENTORY DEDUCTION & DELIVERABLE FULFILLMENT
// ============================================================================

/**
 * POST /api/catalog/deliverables/:id/fulfill
 * Fulfills a deliverable, deducts inventory if physical product, and checks low stock triggers
 */
export async function fulfillDeliverable(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;
    const userId = req.user!.userId;
    const { id } = req.params;
    const { quantityFulfilled } = req.body;

    const deliverable = await prisma.projectDeliverable.findFirst({
      where: { id, tenantId },
      include: {
        product: true,
        lineItem: true,
      },
    });

    if (!deliverable) {
      res.status(404).json({ error: 'Deliverable not found.' });
      return;
    }

    const qty = quantityFulfilled ? Number(quantityFulfilled) : (deliverable.lineItem?.quantity || 1);

    const result = await prisma.$transaction(async (tx) => {
      let lowStockAlert = false;
      let remainingInventory: number | null = null;

      // 1. If linked to a physical product, deduct inventory
      if (deliverable.productId) {
        const product = await tx.productOrService.findFirst({
          where: { id: deliverable.productId, tenantId },
        });

        if (product && product.type === 'product') {
          const newQty = Math.max(0, product.inventoryQty - qty);
          remainingInventory = newQty;

          await tx.productOrService.update({
            where: { id: product.id },
            data: { inventoryQty: newQty },
          });

          // Check low-stock threshold
          if (newQty <= product.reorderLevel) {
            lowStockAlert = true;

            await tx.auditTrailEntry.create({
              data: {
                tenantId,
                entityType: 'ProductOrService',
                entityId: product.id,
                action: 'low_stock_warning',
                performedBy: userId,
                description: `Low stock threshold reached for "${product.name}" (${product.sku}). Current Qty: ${newQty}, Reorder Level: ${product.reorderLevel}`,
                previousState: { inventoryQty: product.inventoryQty },
                newState: { inventoryQty: newQty },
              },
            });
          }
        }
      }

      // 2. Mark deliverable as delivered/fulfilled
      const updatedDeliverable = await tx.projectDeliverable.update({
        where: { id },
        data: {
          status: 'delivered',
          fulfilledDate: new Date(),
        },
      });

      return {
        deliverable: updatedDeliverable,
        quantityDeducted: qty,
        remainingInventory,
        lowStockAlert,
      };
    });

    res.json({
      success: true,
      message: 'Deliverable fulfilled and inventory updated successfully.',
      ...result,
    });
  } catch (err: any) {
    console.error('[Fulfill Deliverable Error]:', err);
    sendCatalogError(res, 'Failed to fulfill deliverable.', err);
  }
}

// ============================================================================
// 4. MULTI-CURRENCY SARS VAT QUOTES & TAX INVOICES
// ============================================================================

const QUOTE_META_PREFIX = '__SHOGUN_QUOTE_META__:';

interface QuoteLineItemExtra {
  sku?: string;
  unitLabel?: string;
  sourceCurrency?: string;
  baseForeignUnitPrice?: number;
  baseForeignCostPrice?: number;
}

interface PackedQuoteMeta {
  issueDate?: string;
  deliveryDate?: string;
  referenceNumber?: string;
  scopeSummary?: string;
  businessDetails?: Record<string, any>;
  clientDetails?: Record<string, any>;
  paymentTerms?: string;
  termsAndConditions?: string;
  linkedInvoiceId?: string | null;
  linkedInvoiceNumber?: string | null;
  lineItemExtras?: QuoteLineItemExtra[];
  notes?: string;
}

function packQuoteNotesMeta(data: Record<string, any>): string | null {
  const lineItemExtras: QuoteLineItemExtra[] = Array.isArray(data.lineItems)
    ? data.lineItems.map((item: any) => ({
        ...(item.sku ? { sku: String(item.sku) } : {}),
        ...(item.unitLabel ? { unitLabel: String(item.unitLabel) } : {}),
        ...(item.sourceCurrency ? { sourceCurrency: String(item.sourceCurrency) } : {}),
        ...(item.baseForeignUnitPrice !== undefined
          ? { baseForeignUnitPrice: Number(item.baseForeignUnitPrice) }
          : {}),
        ...(item.baseForeignCostPrice !== undefined
          ? { baseForeignCostPrice: Number(item.baseForeignCostPrice) }
          : {}),
      }))
    : [];

  const meta: PackedQuoteMeta = {
    ...(data.issueDate ? { issueDate: String(data.issueDate) } : {}),
    ...(data.deliveryDate ? { deliveryDate: String(data.deliveryDate) } : {}),
    ...(data.referenceNumber ? { referenceNumber: String(data.referenceNumber) } : {}),
    ...(data.scopeSummary ? { scopeSummary: String(data.scopeSummary) } : {}),
    ...(data.businessDetails ? { businessDetails: data.businessDetails } : {}),
    ...(data.clientDetails ? { clientDetails: data.clientDetails } : {}),
    ...(data.paymentTerms ? { paymentTerms: String(data.paymentTerms) } : {}),
    ...(data.termsAndConditions ? { termsAndConditions: String(data.termsAndConditions) } : {}),
    ...(data.linkedInvoiceId !== undefined ? { linkedInvoiceId: data.linkedInvoiceId } : {}),
    ...(data.linkedInvoiceNumber !== undefined
      ? { linkedInvoiceNumber: data.linkedInvoiceNumber }
      : {}),
    ...(lineItemExtras.some((e) => Object.keys(e).length > 0) ? { lineItemExtras } : {}),
    ...(data.notes ? { notes: String(data.notes) } : {}),
  };

  const hasStructuredFields = Object.keys(meta).some((k) => k !== 'notes');
  if (!hasStructuredFields) {
    return meta.notes || null;
  }

  return `${QUOTE_META_PREFIX}${JSON.stringify(meta)}`;
}

function unpackQuoteRecord(quote: any): any {
  if (!quote) return quote;
  const rawNotes = typeof quote.notes === 'string' ? quote.notes : '';
  let unpacked: PackedQuoteMeta = {};
  let plainNotes = rawNotes;

  if (rawNotes.startsWith(QUOTE_META_PREFIX)) {
    try {
      unpacked = JSON.parse(rawNotes.slice(QUOTE_META_PREFIX.length)) || {};
      plainNotes = unpacked.notes || '';
    } catch {
      plainNotes = rawNotes;
    }
  }

  const extras = Array.isArray(unpacked.lineItemExtras) ? unpacked.lineItemExtras : [];
  const hydratedLineItems = Array.isArray(quote.lineItems)
    ? quote.lineItems.map((li: any, idx: number) => ({
        ...li,
        ...(extras[idx] || {}),
      }))
    : [];

  return {
    ...quote,
    subtotalExclVat: Number(quote.subtotalExclVat ?? quote.subtotal ?? 0),
    vatAmount: Number(quote.vatAmount ?? quote.taxTotal ?? 0),
    totalInclVat: Number(quote.totalInclVat ?? quote.grandTotal ?? 0),
    exchangeRateToZar: Number(quote.exchangeRateToZar ?? 1),
    vatRate: Number(quote.vatRate ?? 0.15),
    issueDate: unpacked.issueDate || (quote.createdAt ? new Date(quote.createdAt).toISOString().split('T')[0] : undefined),
    deliveryDate: unpacked.deliveryDate,
    referenceNumber: unpacked.referenceNumber,
    scopeSummary: unpacked.scopeSummary,
    businessDetails: unpacked.businessDetails,
    clientDetails: unpacked.clientDetails,
    paymentTerms: unpacked.paymentTerms,
    termsAndConditions: unpacked.termsAndConditions,
    linkedInvoiceId: unpacked.linkedInvoiceId ?? null,
    linkedInvoiceNumber: unpacked.linkedInvoiceNumber ?? null,
    notes: plainNotes,
    lineItems: hydratedLineItems,
  };
}

function extractInvoiceMetaPayload(data: Record<string, any>): Record<string, any> {
  return {
    ...(data.title !== undefined ? { title: data.title } : {}),
    ...(data.quoteNumber !== undefined ? { quoteNumber: data.quoteNumber } : {}),
    ...(data.poNumber !== undefined ? { poNumber: data.poNumber } : {}),
    ...(data.issueDate !== undefined ? { issueDate: data.issueDate } : {}),
    ...(data.supplyDate !== undefined ? { supplyDate: data.supplyDate } : {}),
    ...(data.paymentTermsPreset !== undefined ? { paymentTermsPreset: data.paymentTermsPreset } : {}),
    ...(data.taxMode !== undefined ? { taxMode: data.taxMode } : {}),
    ...(data.vatRate !== undefined ? { vatRate: Number(data.vatRate) } : {}),
    ...(data.exchangeRateToZar !== undefined
      ? { exchangeRateToZar: Number(data.exchangeRateToZar) }
      : {}),
    ...(data.discountTotal !== undefined ? { discountTotal: Number(data.discountTotal) } : {}),
    ...(Array.isArray(data.lineItems) ? { lineItems: data.lineItems } : {}),
    ...(data.scopeSummary !== undefined ? { scopeSummary: data.scopeSummary } : {}),
    ...(data.businessDetails !== undefined ? { businessDetails: data.businessDetails } : {}),
    ...(data.clientDetails !== undefined ? { clientDetails: data.clientDetails } : {}),
    ...(data.paymentTerms !== undefined ? { paymentTerms: data.paymentTerms } : {}),
    ...(data.termsAndConditions !== undefined ? { termsAndConditions: data.termsAndConditions } : {}),
    ...(data.notes !== undefined ? { notes: data.notes } : {}),
    ...(Array.isArray(data.payments) ? { payments: data.payments } : {}),
  };
}

function hydrateTaxInvoiceRecord(invoice: any, meta: Record<string, any> | null | undefined): any {
  const safeMeta = meta && typeof meta === 'object' ? meta : {};
  return {
    ...invoice,
    subtotalExclVat: Number(invoice.subtotalExclVat ?? 0),
    vatAmount: Number(invoice.vatAmount ?? 0),
    totalInclVat: Number(invoice.totalInclVat ?? 0),
    amountPaid: Number(invoice.amountPaid ?? 0),
    ...safeMeta,
  };
}

async function getLatestTaxInvoiceMetaMap(
  tx: Prisma.TransactionClient,
  tenantId: string,
  invoiceIds: string[]
): Promise<Map<string, Record<string, any>>> {
  const map = new Map<string, Record<string, any>>();
  if (invoiceIds.length === 0) return map;

  const entries = await tx.auditTrailEntry.findMany({
    where: {
      tenantId,
      entityType: 'TaxInvoiceMeta',
      entityId: { in: invoiceIds },
    },
    orderBy: { timestamp: 'desc' },
  });

  for (const entry of entries) {
    if (!map.has(entry.entityId) && entry.newState && typeof entry.newState === 'object') {
      map.set(entry.entityId, entry.newState as Record<string, any>);
    }
  }
  return map;
}

export async function getQuotes(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;
    const quotes = await prisma.quote.findMany({
      where: { tenantId },
      include: { lineItems: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(quotes.map(unpackQuoteRecord));
  } catch (err: any) {
    sendCatalogError(res, 'Failed to fetch quotes.', err);
  }
}

export async function getQuoteById(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;
    const quote = await prisma.quote.findFirst({
      where: { id, tenantId },
      include: { lineItems: true },
    });
    if (!quote) {
      res.status(404).json({ error: 'Quote not found.' });
      return;
    }
    res.json(unpackQuoteRecord(quote));
  } catch (err: any) {
    sendCatalogError(res, 'Failed to fetch quote.', err);
  }
}

export async function deleteQuote(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;
    const existing = await prisma.quote.findFirst({ where: { id, tenantId } });
    if (!existing) {
      res.status(404).json({ error: 'Quote not found.' });
      return;
    }
    await prisma.quote.delete({ where: { id } });
    res.json({ success: true, id });
  } catch (err: any) {
    sendCatalogError(res, 'Failed to delete quote.', err);
  }
}

export async function upsertQuote(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;
    const data = req.body || {};
    const targetId = req.params.id || data.id;

    const taxMode: SaTaxMode = data.taxMode || 'EXCLUSIVE';
    const discountTotal = Number(data.discountTotal || 0);
    const hasExplicitExcl = data.subtotalExclVat !== undefined;
    const rawSubtotal = Number(data.subtotal || 0);
    const taxableInput = hasExplicitExcl
      ? taxMode === 'INCLUSIVE' && data.totalInclVat !== undefined
        ? Number(data.totalInclVat)
        : Number(data.subtotalExclVat)
      : Math.max(0, rawSubtotal - discountTotal);
    const vatCalc = calculateSaVat(Math.max(0, taxableInput), taxMode, data.vatRate ?? '0.1500');
    const packedNotes = packQuoteNotesMeta(data);

    const quote = await withTenantTx(tenantId, async (tx) => {
      const existing = targetId
        ? await tx.quote.findFirst({ where: { id: targetId, tenantId } })
        : null;

      const quotePayload = {
        tenantId,
        quoteNumber: data.quoteNumber || `QT-${Date.now().toString().slice(-6)}`,
        title: data.title || 'Commercial Proposal',
        dealId: data.dealId || null,
        accountId: data.accountId || data.clientDetails?.accountId || null,
        contactId: data.contactId || data.clientDetails?.contactId || null,
        projectId: data.projectId || null,
        priceBookId: data.priceBookId || null,
        status: data.status || 'draft',
        subtotal: vatCalc.subtotalExclVat + discountTotal,
        discountTotal,
        taxTotal: vatCalc.vatAmount,
        grandTotal: vatCalc.totalInclVat,
        totalCost: Number(data.totalCost || 0),
        marginAmount: Number(data.marginAmount || 0),
        marginPercent: Number(data.marginPercent || 0),
        currency: data.currency || 'ZAR',
        exchangeRateToZar: new Prisma.Decimal(data.exchangeRateToZar ?? '1.000000'),
        rateLockedAt: data.rateLockedAt ? new Date(data.rateLockedAt) : null,
        taxMode,
        vatRate: vatCalc.decimals.vatRate,
        subtotalExclVat: vatCalc.decimals.subtotalExclVat,
        vatAmount: vatCalc.decimals.vatAmount,
        totalInclVat: vatCalc.decimals.totalInclVat,
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
        notes: packedNotes,
      };

      const saved = existing
        ? await tx.quote.update({ where: { id: existing.id }, data: quotePayload })
        : await tx.quote.create({
            data: {
              ...(targetId ? { id: String(targetId) } : {}),
              ...quotePayload,
            },
          });

      if (Array.isArray(data.lineItems)) {
        await tx.lineItem.deleteMany({ where: { quoteId: saved.id } });
        for (const item of data.lineItems) {
          await tx.lineItem.create({
            data: {
              quoteId: saved.id,
              productId: item.productId && !String(item.productId).startsWith('custom-') ? item.productId : null,
              productName: item.productName || 'Line Item',
              type: item.type || 'product',
              quantity: Number(item.quantity || 1),
              unitPrice: Number(item.unitPrice || 0),
              costPrice: Number(item.costPrice || 0),
              discountAmount: Number(item.discountAmount || 0),
              taxAmount: Number(item.taxAmount || 0),
              taxRatePercent: Number(item.taxRatePercent || 0),
              totalPrice: Number(item.totalPrice || 0),
              notes: item.notes || null,
            },
          });
        }
      }

      return tx.quote.findUnique({
        where: { id: saved.id },
        include: { lineItems: true },
      });
    });

    res.status(201).json(unpackQuoteRecord(quote));
  } catch (err: any) {
    sendCatalogError(res, 'Failed to save SARS VAT quote.', err);
  }
}

export async function getTaxInvoices(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;
    const invoices = await withTenantTx(tenantId, async (tx) => {
      const rows = await tx.taxInvoice.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
      });
      const metaMap = await getLatestTaxInvoiceMetaMap(
        tx,
        tenantId,
        rows.map((r) => r.id)
      );
      return rows.map((row) => hydrateTaxInvoiceRecord(row, metaMap.get(row.id)));
    });
    res.json(invoices);
  } catch (err: any) {
    sendCatalogError(res, 'Failed to fetch SARS tax invoices.', err);
  }
}

export async function getTaxInvoiceById(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;
    const invoice = await withTenantTx(tenantId, async (tx) => {
      const row = await tx.taxInvoice.findFirst({ where: { id, tenantId } });
      if (!row) return null;
      const metaMap = await getLatestTaxInvoiceMetaMap(tx, tenantId, [row.id]);
      return hydrateTaxInvoiceRecord(row, metaMap.get(row.id));
    });

    if (!invoice) {
      res.status(404).json({ error: 'TaxInvoice not found.' });
      return;
    }

    res.json(invoice);
  } catch (err: any) {
    sendCatalogError(res, 'Failed to fetch SARS tax invoice.', err);
  }
}

export async function createTaxInvoice(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;
    const userId = req.user?.userId || 'system';
    const data = req.body || {};

    const taxMode: SaTaxMode = data.taxMode || 'EXCLUSIVE';
    const calcInput =
      data.amount !== undefined
        ? Number(data.amount)
        : taxMode === 'INCLUSIVE' && data.totalInclVat !== undefined
          ? Number(data.totalInclVat)
          : Number(data.subtotalExclVat ?? 0);
    const vatCalc = calculateSaVat(Math.max(0, calcInput), taxMode, data.vatRate ?? '0.1500');
    const metaPayload = extractInvoiceMetaPayload(data);

    const invoice = await withTenantTx(tenantId, async (tx) => {
      const invoiceNumber =
        data.invoiceNumber || (await generateNextTaxInvoiceNumber(tx, tenantId));

      const created = await tx.taxInvoice.create({
        data: {
          ...(data.id ? { id: String(data.id) } : {}),
          tenantId,
          invoiceNumber,
          accountId: data.accountId || data.clientDetails?.accountId || null,
          projectId: data.projectId || null,
          quoteId: data.quoteId || null,
          status: data.status || 'DRAFT',
          currency: data.currency || 'ZAR',
          subtotalExclVat: vatCalc.decimals.subtotalExclVat,
          vatAmount: vatCalc.decimals.vatAmount,
          totalInclVat: vatCalc.decimals.totalInclVat,
          amountPaid: new Prisma.Decimal(data.amountPaid ?? 0),
          dueDate: data.dueDate
            ? new Date(data.dueDate)
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          externalAccountingProvider: data.externalAccountingProvider || null,
          externalAccountingId: data.externalAccountingId || null,
          lastSyncedAt: data.lastSyncedAt ? new Date(data.lastSyncedAt) : null,
        },
      });

      if (Object.keys(metaPayload).length > 0) {
        await tx.auditTrailEntry.create({
          data: {
            tenantId,
            entityType: 'TaxInvoiceMeta',
            entityId: created.id,
            action: 'upsert_meta',
            performedBy: userId,
            description: `Metadata for TaxInvoice ${created.invoiceNumber}`,
            newState: metaPayload as Prisma.InputJsonValue,
          },
        });
      }

      return hydrateTaxInvoiceRecord(created, metaPayload);
    });

    if (invoice.status === 'ISSUED') {
      try {
        await enqueueAccountingSyncJob({
          eventType: 'invoice.issued',
          tenantId,
          taxInvoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          provider: (invoice.externalAccountingProvider as 'SAGE_ZA' | 'XERO' | null) ?? null,
        });
      } catch {
        // Non-blocking if Redis queue is offline
      }
    }

    res.status(201).json(invoice);
  } catch (err: any) {
    sendCatalogError(res, 'Failed to create SARS tax invoice.', err);
  }
}

export async function updateTaxInvoice(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;
    const userId = req.user?.userId || 'system';
    const { id } = req.params;
    const data = req.body || {};

    const updated = await withTenantTx(tenantId, async (tx) => {
      const existing = await tx.taxInvoice.findFirst({ where: { id, tenantId } });
      if (!existing) return null;

      const metaMap = await getLatestTaxInvoiceMetaMap(tx, tenantId, [existing.id]);
      const prevMeta = metaMap.get(existing.id) || {};
      const nextMeta = { ...prevMeta, ...extractInvoiceMetaPayload(data) };

      const taxMode: SaTaxMode = (nextMeta.taxMode as SaTaxMode) || 'EXCLUSIVE';
      const calcInput =
        data.amount !== undefined
          ? Number(data.amount)
          : taxMode === 'INCLUSIVE' && data.totalInclVat !== undefined
            ? Number(data.totalInclVat)
            : Number(data.subtotalExclVat ?? existing.subtotalExclVat);
      const vatCalc = calculateSaVat(
        Math.max(0, calcInput),
        taxMode,
        data.vatRate ?? nextMeta.vatRate ?? '0.1500'
      );

      const saved = await tx.taxInvoice.update({
        where: { id: existing.id },
        data: {
          invoiceNumber: data.invoiceNumber ?? existing.invoiceNumber,
          accountId:
            data.accountId !== undefined
              ? data.accountId || data.clientDetails?.accountId || null
              : existing.accountId,
          projectId: data.projectId !== undefined ? data.projectId || null : existing.projectId,
          quoteId: data.quoteId !== undefined ? data.quoteId || null : existing.quoteId,
          status: data.status ?? existing.status,
          currency: data.currency ?? existing.currency,
          subtotalExclVat: vatCalc.decimals.subtotalExclVat,
          vatAmount: vatCalc.decimals.vatAmount,
          totalInclVat: vatCalc.decimals.totalInclVat,
          amountPaid:
            data.amountPaid !== undefined
              ? new Prisma.Decimal(data.amountPaid)
              : existing.amountPaid,
          dueDate: data.dueDate ? new Date(data.dueDate) : existing.dueDate,
        },
      });

      await tx.auditTrailEntry.create({
        data: {
          tenantId,
          entityType: 'TaxInvoiceMeta',
          entityId: saved.id,
          action: 'upsert_meta',
          performedBy: userId,
          description: `Updated metadata for TaxInvoice ${saved.invoiceNumber}`,
          newState: nextMeta as Prisma.InputJsonValue,
        },
      });

      return hydrateTaxInvoiceRecord(saved, nextMeta);
    });

    if (!updated) {
      res.status(404).json({ error: 'TaxInvoice not found.' });
      return;
    }

    res.json(updated);
  } catch (err: any) {
    sendCatalogError(res, 'Failed to update SARS tax invoice.', err);
  }
}

export async function deleteTaxInvoice(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;

    const deleted = await withTenantTx(tenantId, async (tx) => {
      const existing = await tx.taxInvoice.findFirst({ where: { id, tenantId } });
      if (!existing) return null;
      await tx.taxInvoice.delete({ where: { id: existing.id } });
      await tx.auditTrailEntry.deleteMany({
        where: { tenantId, entityType: 'TaxInvoiceMeta', entityId: existing.id },
      });
      return existing;
    });

    if (!deleted) {
      res.status(404).json({ error: 'TaxInvoice not found.' });
      return;
    }

    res.json({ success: true, id });
  } catch (err: any) {
    sendCatalogError(res, 'Failed to delete SARS tax invoice.', err);
  }
}

export async function recordTaxInvoicePayment(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;
    const userId = req.user?.userId || 'system';
    const { id } = req.params;
    const { amount, paymentDate, paymentMethod, reference, notes } = req.body || {};

    const parsedAmount = Number(amount || 0);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      res.status(400).json({ error: 'Payment amount must be greater than zero.' });
      return;
    }

    const result = await withTenantTx(tenantId, async (tx) => {
      const existing = await tx.taxInvoice.findFirst({ where: { id, tenantId } });
      if (!existing) return null;

      const totalIncl = Number(existing.totalInclVat);
      const nextAmountPaid = Math.min(totalIncl, Number(existing.amountPaid) + parsedAmount);
      const nextStatus =
        nextAmountPaid >= totalIncl - 0.01
          ? 'PAID'
          : nextAmountPaid > 0
            ? 'PARTIALLY_PAID'
            : existing.status;

      const metaMap = await getLatestTaxInvoiceMetaMap(tx, tenantId, [existing.id]);
      const prevMeta = metaMap.get(existing.id) || {};
      const prevPayments = Array.isArray(prevMeta.payments) ? prevMeta.payments : [];

      const paymentRecord = {
        id: `pay-${Date.now().toString(36)}`,
        amount: parsedAmount,
        paymentDate: paymentDate || new Date().toISOString().split('T')[0],
        paymentMethod: paymentMethod || 'EFT',
        reference: reference || '',
        notes: notes || '',
        recordedAt: new Date().toISOString(),
      };

      const nextMeta = {
        ...prevMeta,
        payments: [paymentRecord, ...prevPayments],
      };

      const saved = await tx.taxInvoice.update({
        where: { id: existing.id },
        data: {
          amountPaid: new Prisma.Decimal(nextAmountPaid.toFixed(2)),
          status: nextStatus,
        },
      });

      await tx.paymentTransaction.create({
        data: {
          tenantId,
          taxInvoiceId: saved.id,
          provider: 'MANUAL_LEDGER',
          merchantTransactionId: `MAN-${Date.now().toString(36).toUpperCase()}`,
          amount: new Prisma.Decimal(parsedAmount.toFixed(2)),
          currency: saved.currency,
          paymentMethod: paymentRecord.paymentMethod,
          status: 'SUCCEEDED',
          rawResponse: paymentRecord as Prisma.InputJsonValue,
          settledAt: new Date(),
        },
      });

      await tx.auditTrailEntry.create({
        data: {
          tenantId,
          entityType: 'TaxInvoiceMeta',
          entityId: saved.id,
          action: 'upsert_meta',
          performedBy: userId,
          description: `Recorded payment on TaxInvoice ${saved.invoiceNumber}`,
          newState: nextMeta as Prisma.InputJsonValue,
        },
      });

      return hydrateTaxInvoiceRecord(saved, nextMeta);
    });

    if (!result) {
      res.status(404).json({ error: 'TaxInvoice not found.' });
      return;
    }

    res.json(result);
  } catch (err: any) {
    sendCatalogError(res, 'Failed to record tax invoice payment.', err);
  }
}

export async function convertQuoteToTaxInvoice(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;
    const userId = req.user?.userId || 'system';
    const { id } = req.params;
    const body = req.body || {};

    const ratio = Math.min(1, Math.max(0.01, Number(body.billingPercentage ?? 100) / 100));

    const createdInvoice = await withTenantTx(tenantId, async (tx) => {
      const rawQuote = await tx.quote.findFirst({
        where: { id, tenantId },
        include: { lineItems: true },
      });
      if (!rawQuote) return null;

      const quote = unpackQuoteRecord(rawQuote);
      const taxMode: SaTaxMode = (body.taxMode || quote.taxMode || 'EXCLUSIVE') as SaTaxMode;
      const vatRate = Number(body.vatRate ?? quote.vatRate ?? 0.15);

      const scaledLines = (quote.lineItems || []).map((item: any, idx: number) => {
        const unitPrice = Number((Number(item.unitPrice || 0) * ratio).toFixed(2));
        const discountAmount = Number((Number(item.discountAmount || 0) * ratio).toFixed(2));
        const qty = Number(item.quantity || 1);
        const net = Math.max(0, Number((qty * unitPrice - discountAmount).toFixed(2)));
        const taxAmount =
          taxMode === 'ZERO_RATED' || taxMode === 'EXEMPT'
            ? 0
            : taxMode === 'INCLUSIVE'
              ? Number((net - net / (1 + vatRate)).toFixed(2))
              : Number((net * vatRate).toFixed(2));
        const totalPrice =
          taxMode === 'EXCLUSIVE' ? Number((net + taxAmount).toFixed(2)) : net;

        return {
          ...item,
          id: `inv-li-${Date.now().toString(36)}-${idx}`,
          unitPrice,
          discountAmount,
          taxAmount,
          totalPrice,
        };
      });

      const subtotalExclVat = Number((Number(quote.subtotalExclVat || 0) * ratio).toFixed(2));
      const totalInclVat = Number((Number(quote.totalInclVat || 0) * ratio).toFixed(2));
      const vatCalc = calculateSaVat(
        taxMode === 'INCLUSIVE' ? totalInclVat : subtotalExclVat,
        taxMode,
        vatRate
      );

      const invoiceNumber =
        body.invoiceNumber || (await generateNextTaxInvoiceNumber(tx, tenantId));

      const created = await tx.taxInvoice.create({
        data: {
          tenantId,
          invoiceNumber,
          accountId: quote.accountId || null,
          projectId: quote.projectId || null,
          quoteId: quote.id,
          status: body.status || 'ISSUED',
          currency: quote.currency || 'ZAR',
          subtotalExclVat: vatCalc.decimals.subtotalExclVat,
          vatAmount: vatCalc.decimals.vatAmount,
          totalInclVat: vatCalc.decimals.totalInclVat,
          amountPaid: new Prisma.Decimal(0),
          dueDate: body.dueDate
            ? new Date(body.dueDate)
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      const metaPayload = {
        title:
          body.title ||
          (ratio < 1
            ? `${quote.title} (${Math.round(ratio * 100)}% Deposit)`
            : quote.title),
        quoteNumber: quote.quoteNumber,
        poNumber: body.poNumber || quote.referenceNumber || '',
        issueDate: body.issueDate || new Date().toISOString().split('T')[0],
        supplyDate: body.supplyDate || body.issueDate || new Date().toISOString().split('T')[0],
        paymentTermsPreset: body.paymentTermsPreset || 'net_30',
        taxMode,
        vatRate,
        exchangeRateToZar: quote.exchangeRateToZar || 1,
        discountTotal: Number((Number(quote.discountTotal || 0) * ratio).toFixed(2)),
        lineItems: scaledLines,
        scopeSummary: quote.scopeSummary || '',
        businessDetails: body.businessDetails || quote.businessDetails,
        clientDetails: body.clientDetails || quote.clientDetails,
        paymentTerms: body.paymentTerms || quote.paymentTerms || '',
        termsAndConditions: body.termsAndConditions || quote.termsAndConditions || '',
        notes: body.notes || quote.notes || '',
        payments: [],
      };

      await tx.auditTrailEntry.create({
        data: {
          tenantId,
          entityType: 'TaxInvoiceMeta',
          entityId: created.id,
          action: 'upsert_meta',
          performedBy: userId,
          description: `Converted Quote ${quote.quoteNumber} to TaxInvoice ${created.invoiceNumber}`,
          newState: metaPayload as Prisma.InputJsonValue,
        },
      });

      const updatedNotes = packQuoteNotesMeta({
        ...quote,
        linkedInvoiceId: created.id,
        linkedInvoiceNumber: created.invoiceNumber,
      });

      await tx.quote.update({
        where: { id: quote.id },
        data: {
          status: 'invoiced',
          notes: updatedNotes,
        },
      });

      return hydrateTaxInvoiceRecord(created, metaPayload);
    });

    if (!createdInvoice) {
      res.status(404).json({ error: 'Source quote not found.' });
      return;
    }

    res.status(201).json(createdInvoice);
  } catch (err: any) {
    sendCatalogError(res, 'Failed to convert quote to tax invoice.', err);
  }
}
