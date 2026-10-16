/**
 * Products & Services Catalog, Price Books & Inventory Management Hook
 * Express REST API Multi-Tenant Integration
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiClient } from '../../../services/api';
import { ProductOrService, PriceBook } from '../../../types';

export interface CatalogStats {
  totalItems: number;
  totalProducts: number;
  totalServices: number;
  lowStockCount: number;
  totalInventoryValuation: number;
  averageMarginPercent: number;
}

export interface UseCatalogReturn {
  items: ProductOrService[];
  priceBooks: PriceBook[];
  stats: CatalogStats;
  loading: boolean;
  error: Error | null;
  createItem: (item: Omit<ProductOrService, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateItem: (id: string, updates: Partial<ProductOrService>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  bulkUpdateStatus: (ids: string[], isActive: boolean) => Promise<void>;
  bulkDelete: (ids: string[]) => Promise<void>;
  createPriceBook: (pb: Omit<PriceBook, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updatePriceBook: (id: string, updates: Partial<PriceBook>) => Promise<void>;
  deletePriceBook: (id: string) => Promise<void>;
  setDefaultPriceBook: (id: string) => Promise<void>;
  fulfillDeliverable: (deliverableId: string, quantity?: number) => Promise<any>;
  refresh: () => Promise<void>;
}

export function useCatalog(): UseCatalogReturn {
  const [items, setItems] = useState<ProductOrService[]>([]);
  const [priceBooks, setPriceBooks] = useState<PriceBook[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCatalogData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [productsData, pbData] = await Promise.all([
        apiClient.get<ProductOrService[]>('/catalog/products').catch(() => []),
        apiClient.get<PriceBook[]>('/catalog/price-books').catch(() => []),
      ]);

      setItems(Array.isArray(productsData) ? productsData : []);
      setPriceBooks(Array.isArray(pbData) ? pbData : []);
    } catch (err: any) {
      console.warn('[useCatalog] REST fetch failed:', err);
      setItems([]);
      setPriceBooks([]);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCatalogData();
  }, [fetchCatalogData]);

  // Derived Stats memoized to prevent re-computation on unrelated renders
  const stats: CatalogStats = useMemo(() => {
    let totalProducts = 0;
    let totalServices = 0;
    let lowStockCount = 0;
    let totalInventoryValuation = 0;
    let totalMarginSum = 0;

    items.forEach((item) => {
      if (item.type === 'product') {
        totalProducts++;
        const qty = item.inventoryQty || 0;
        const reorder = item.reorderLevel || 0;
        if (qty <= reorder) {
          lowStockCount++;
        }
        totalInventoryValuation += qty * item.unitPrice;
      } else {
        totalServices++;
      }

      const margin = item.unitPrice > 0 ? ((item.unitPrice - item.costPrice) / item.unitPrice) * 100 : 0;
      totalMarginSum += margin;
    });

    const averageMarginPercent = items.length > 0 ? Number((totalMarginSum / items.length).toFixed(1)) : 0;

    return {
      totalItems: items.length,
      totalProducts,
      totalServices,
      lowStockCount,
      totalInventoryValuation,
      averageMarginPercent,
    };
  }, [items]);

  // Item Operations
  const createItem = useCallback(
    async (itemData: Omit<ProductOrService, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
      const created = await apiClient.post<ProductOrService>('/catalog/products', itemData);
      setItems((prev) => [created, ...prev]);
      return created.id;
    },
    []
  );

  const updateItem = useCallback(async (id: string, updates: Partial<ProductOrService>): Promise<void> => {
    await apiClient.put(`/catalog/products/${id}`, updates);
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item))
    );
  }, []);

  const deleteItem = useCallback(async (id: string): Promise<void> => {
    await apiClient.delete(`/catalog/products/${id}`);
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // Parallelized bulk operations via Promise.all
  const bulkUpdateStatus = useCallback(async (ids: string[], isActive: boolean): Promise<void> => {
    await Promise.all(ids.map((id) => apiClient.put(`/catalog/products/${id}`, { isActive })));
    setItems((prev) =>
      prev.map((item) => (ids.includes(item.id) ? { ...item, isActive, updatedAt: new Date().toISOString() } : item))
    );
  }, []);

  const bulkDelete = useCallback(async (ids: string[]): Promise<void> => {
    await Promise.all(ids.map((id) => apiClient.delete(`/catalog/products/${id}`)));
    setItems((prev) => prev.filter((item) => !ids.includes(item.id)));
  }, []);

  // Price Book Operations
  const createPriceBook = useCallback(
    async (pbData: Omit<PriceBook, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
      const created = await apiClient.post<PriceBook>('/catalog/price-books', pbData);
      setPriceBooks((prev) => [...prev, created]);
      return created.id;
    },
    []
  );

  const updatePriceBook = useCallback(async (id: string, updates: Partial<PriceBook>): Promise<void> => {
    setPriceBooks((prev) =>
      prev.map((pb) => (pb.id === id ? { ...pb, ...updates, updatedAt: new Date().toISOString() } : pb))
    );
  }, []);

  const deletePriceBook = useCallback(async (id: string): Promise<void> => {
    setPriceBooks((prev) => prev.filter((pb) => pb.id !== id));
  }, []);

  const setDefaultPriceBook = useCallback(async (id: string): Promise<void> => {
    setPriceBooks((prev) =>
      prev.map((pb) => ({
        ...pb,
        isDefault: pb.id === id,
        updatedAt: new Date().toISOString(),
      }))
    );
  }, []);

  const fulfillDeliverable = useCallback(
    async (deliverableId: string, quantity?: number): Promise<any> => {
      const res = await apiClient.post(`/catalog/deliverables/${deliverableId}/fulfill`, {
        quantityFulfilled: quantity,
      });
      await fetchCatalogData();
      return res;
    },
    [fetchCatalogData]
  );

  return {
    items,
    priceBooks,
    stats,
    loading,
    error,
    createItem,
    updateItem,
    deleteItem,
    bulkUpdateStatus,
    bulkDelete,
    createPriceBook,
    updatePriceBook,
    deletePriceBook,
    setDefaultPriceBook,
    fulfillDeliverable,
    refresh: fetchCatalogData,
  };
}

export default useCatalog;
