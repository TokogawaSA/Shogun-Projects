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

export async function getQuotes(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;
    const quotes = await prisma.quote.findMany({
      where: { tenantId },
      include: { lineItems: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(quotes);
  } catch (err: any) {
    sendCatalogError(res, 'Failed to fetch quotes.', err);
  }
}

export async function upsertQuote(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;
    const data = req.body || {};

    const taxMode: SaTaxMode = data.taxMode || 'EXCLUSIVE';
    const discountTotal = Number(data.discountTotal || 0);
    const rawSubtotal = Number(data.subtotal || 0);
    const netTaxableInput = Math.max(0, rawSubtotal - discountTotal);
    const vatCalc = calculateSaVat(netTaxableInput, taxMode, data.vatRate ?? '0.1500');

    const quote = await withTenantTx(tenantId, async (tx) => {
      const existing = data.id
        ? await tx.quote.findFirst({ where: { id: data.id, tenantId } })
        : null;

      const quotePayload = {
        tenantId,
        quoteNumber: data.quoteNumber || `QT-${Date.now().toString().slice(-6)}`,
        title: data.title || 'Commercial Proposal',
        dealId: data.dealId || null,
        accountId: data.accountId || null,
        contactId: data.contactId || null,
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
        notes: data.notes || null,
      };

      const saved = existing
        ? await tx.quote.update({ where: { id: existing.id }, data: quotePayload })
        : await tx.quote.create({ data: quotePayload });

      if (Array.isArray(data.lineItems)) {
        await tx.lineItem.deleteMany({ where: { quoteId: saved.id } });
        for (const item of data.lineItems) {
          await tx.lineItem.create({
            data: {
              quoteId: saved.id,
              productId: item.productId || null,
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

    res.status(201).json(quote);
  } catch (err: any) {
    sendCatalogError(res, 'Failed to save SARS VAT quote.', err);
  }
}

export async function getTaxInvoices(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;
    const invoices = await withTenantTx(tenantId, async (tx) => {
      return tx.taxInvoice.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
      });
    });
    res.json(invoices);
  } catch (err: any) {
    sendCatalogError(res, 'Failed to fetch SARS tax invoices.', err);
  }
}

export async function createTaxInvoice(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;
    const data = req.body || {};

    const taxMode: SaTaxMode = data.taxMode || 'EXCLUSIVE';
    const vatCalc = calculateSaVat(
      data.amount ?? data.subtotalExclVat ?? 0,
      taxMode,
      data.vatRate ?? '0.1500'
    );

    const invoice = await withTenantTx(tenantId, async (tx) => {
      const invoiceNumber =
        data.invoiceNumber || (await generateNextTaxInvoiceNumber(tx, tenantId));

      return tx.taxInvoice.create({
        data: {
          tenantId,
          invoiceNumber,
          accountId: data.accountId || null,
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
