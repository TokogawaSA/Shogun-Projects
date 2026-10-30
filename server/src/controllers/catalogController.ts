import { Request, Response } from 'express';
import { prisma } from '../config/db.js';

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

    const priceBook = await prisma.priceBook.create({
      data: {
        tenantId,
        name: data.name,
        description: data.description,
        pricingRules: data.pricingRules || {},
        isDefault: Boolean(data.isDefault),
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
