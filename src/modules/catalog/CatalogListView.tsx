/**
 * Products & Services Catalog Management View
 * Multi-Tenant Antigravity 2.0 Ecosystem
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  Wrench, 
  Search, 
  Plus, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  DollarSign, 
  BookOpen, 
  TrendingUp, 
  RefreshCw, 
  Edit3, 
  Clock,
  Boxes
} from 'lucide-react';
import { useCatalog } from './hooks/useCatalog';
import { ProductModal } from './ProductModal';
import { ProductOrService } from '../../types';
import { useCurrency } from '../../context/CurrencyContext';

export const CatalogListView: React.FC = () => {
  const navigate = useNavigate();
  const { formatCurrency } = useCurrency();
  const { 
    items, 
    stats, 
    loading, 
    createItem, 
    updateItem, 
    deleteItem, 
    bulkUpdateStatus, 
    bulkDelete, 
    refresh 
  } = useCatalog();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'product' | 'service' | 'subscription' | 'low_stock'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<ProductOrService | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Extract unique categories for filter dropdown
  const categories = Array.from(new Set(items.map((i) => i.category || 'General')));

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description || '').toLowerCase().includes(searchQuery.toLowerCase());

    let matchesType = true;
    if (typeFilter === 'product') {
      matchesType = item.type === 'product';
    } else if (typeFilter === 'service') {
      matchesType = item.type === 'service';
    } else if (typeFilter === 'subscription') {
      matchesType = item.type === 'service' && item.billingFrequency !== 'one_time';
    } else if (typeFilter === 'low_stock') {
      matchesType = item.type === 'product' && (item.inventoryQty || 0) <= (item.reorderLevel || 0);
    }

    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;

    return matchesSearch && matchesType && matchesCategory;
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItemIds(filteredItems.map((i) => i.id));
    } else {
      setSelectedItemIds([]);
    }
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedItemIds((prev) => [...prev, id]);
    } else {
      setSelectedItemIds((prev) => prev.filter((i) => i !== id));
    }
  };

  const handleBulkActivate = async () => {
    if (selectedItemIds.length === 0) return;
    await bulkUpdateStatus(selectedItemIds, true);
    setSelectedItemIds([]);
    showSuccess(`Activated ${selectedItemIds.length} catalog items`);
  };

  const handleBulkDeactivate = async () => {
    if (selectedItemIds.length === 0) return;
    await bulkUpdateStatus(selectedItemIds, false);
    setSelectedItemIds([]);
    showSuccess(`Deactivated ${selectedItemIds.length} catalog items`);
  };

  const handleBulkDelete = async () => {
    if (selectedItemIds.length === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedItemIds.length} selected items?`)) {
      await bulkDelete(selectedItemIds);
      setSelectedItemIds([]);
      showSuccess(`Deleted ${selectedItemIds.length} catalog items`);
    }
  };

  const showSuccess = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  const handleSaveModal = async (
    itemData: Omit<ProductOrService, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    if (editingItem) {
      await updateItem(editingItem.id, itemData);
      showSuccess(`Updated ${itemData.name}`);
    } else {
      await createItem(itemData);
      showSuccess(`Created ${itemData.name}`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2.5">
            <Boxes className="w-6 h-6 text-indigo-400" />
            Products & Services Catalog
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage billable services, recurring SLA retainers, physical SKUs, and inventory stock thresholds
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/catalog/price-books')}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 transition flex items-center gap-2 shadow-sm"
          >
            <BookOpen className="w-4 h-4 text-violet-400" />
            Price Books Tier Engine
          </button>

          <button
            onClick={() => {
              setEditingItem(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-md shadow-indigo-500/20 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Catalog Item
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {actionSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
        </div>
      )}

      {/* Telemetry & KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg relative overflow-hidden backdrop-blur-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">Catalog Items</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-100 font-mono tracking-tight">{stats.totalItems}</div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2 font-mono">
            <span className="text-indigo-400 font-semibold">{stats.totalProducts} Products</span>
            <span>•</span>
            <span className="text-emerald-400 font-semibold">{stats.totalServices} Services</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg relative overflow-hidden backdrop-blur-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">Inventory Valuation</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-100 font-mono tracking-tight">
            {formatCurrency(stats.totalInventoryValuation)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5 font-mono">
            <span>On-hand physical asset value</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg relative overflow-hidden backdrop-blur-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">Average Margin</span>
            <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-100 font-mono tracking-tight">
            {stats.averageMarginPercent}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono text-emerald-400 flex items-center gap-1">
            <span>Standard catalog profitability</span>
          </div>
        </div>

        <div className={`p-4 rounded-2xl border shadow-lg relative overflow-hidden backdrop-blur-md ${stats.lowStockCount > 0 ? 'bg-amber-950/20 border-amber-800/40 text-amber-300' : 'bg-slate-900/80 border-slate-800 text-slate-300'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider font-mono">Stock Alerts</span>
            <div className={`p-2 rounded-xl border ${stats.lowStockCount > 0 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono tracking-tight">{stats.lowStockCount}</div>
          <div className="text-[11px] mt-1 font-mono">
            {stats.lowStockCount > 0 ? 'Items below reorder threshold' : 'All product stock levels healthy'}
          </div>
        </div>
      </div>

      {/* Filter Pills & Search Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3.5 backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by SKU, item name, category, or specifications..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-slate-500"
            />
          </div>

          {/* Category Dropdown & Refresh */}
          <div className="flex items-center gap-2.5">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <button
              onClick={refresh}
              className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-slate-300 transition"
              title="Refresh Catalog"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/80">
          <span className="text-[11px] font-semibold text-slate-400 font-mono mr-1">Filter:</span>
          {[
            { id: 'all', label: 'All Items', count: items.length },
            { id: 'product', label: 'Physical Products', count: stats.totalProducts },
            { id: 'service', label: 'Billable Services', count: stats.totalServices },
            { id: 'subscription', label: 'Recurring Subscriptions', count: items.filter((i) => i.type === 'service' && i.billingFrequency !== 'one_time').length },
            { id: 'low_stock', label: 'Low Stock Alerts', count: stats.lowStockCount },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTypeFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 font-mono ${
                typeFilter === tab.id
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-semibold shadow-sm'
                  : 'bg-slate-800/60 text-slate-400 border border-slate-700/70 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900/60 text-slate-300">
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Bulk Selection Actions Bar (Visible when items selected) */}
      {selectedItemIds.length > 0 && (
        <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-800/50 flex flex-wrap items-center justify-between gap-3 animate-fade-in">
          <div className="text-xs font-semibold text-indigo-200 flex items-center gap-2 font-mono">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
            <span>{selectedItemIds.length} item{selectedItemIds.length > 1 ? 's' : ''} selected</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkActivate}
              className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30 text-xs font-semibold transition flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Activate
            </button>

            <button
              onClick={handleBulkDeactivate}
              className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 text-xs font-semibold transition flex items-center gap-1.5"
            >
              <XCircle className="w-3.5 h-3.5" />
              Deactivate
            </button>

            <button
              onClick={handleBulkDelete}
              className="px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30 text-xs font-semibold transition flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Catalog Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/95 text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
                <th className="p-4 w-10">
                  <input
                    type="checkbox"
                    checked={filteredItems.length > 0 && selectedItemIds.length === filteredItems.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
                <th className="py-4 px-3">Item / SKU</th>
                <th className="py-4 px-3">Type & Frequency</th>
                <th className="py-4 px-3">Category</th>
                <th className="py-4 px-3 text-right">Unit Price</th>
                <th className="py-4 px-3 text-right">Cost Price</th>
                <th className="py-4 px-3 text-right">Margin %</th>
                <th className="py-4 px-3 text-center">Stock Level</th>
                <th className="py-4 px-3 text-center">Status</th>
                <th className="py-4 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-12 text-center text-slate-500">
                    <Package className="w-10 h-10 mx-auto mb-3 text-slate-600" />
                    <p className="font-semibold text-slate-400">No catalog items found</p>
                    <p className="text-xs text-slate-500 mt-1">Try adjusting your filters or click "Add Catalog Item" above.</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isSelected = selectedItemIds.includes(item.id);
                  const marginAmount = item.unitPrice - item.costPrice;
                  const marginPercent = item.unitPrice > 0 ? ((marginAmount / item.unitPrice) * 100).toFixed(1) : '0.0';
                  const isLowStock = item.type === 'product' && (item.inventoryQty || 0) <= (item.reorderLevel || 0);

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-800/40 transition-colors ${isSelected ? 'bg-indigo-950/20' : ''}`}
                    >
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleSelectItem(item.id, e.target.checked)}
                          className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                        />
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              item.type === 'product'
                                ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}
                          >
                            {item.type === 'product' ? <Package className="w-4 h-4" /> : <Wrench className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="font-bold text-slate-200 hover:text-indigo-400 cursor-pointer transition" onClick={() => { setEditingItem(item); setIsModalOpen(true); }}>
                              {item.name}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                              <span>{item.sku}</span>
                              {item.taxRatePercent > 0 && (
                                <span className="text-[10px] text-slate-500">({item.taxRatePercent}% tax)</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="flex flex-col gap-1 items-start">
                          <span
                            className={`text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded ${
                              item.type === 'product'
                                ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                                : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            }`}
                          >
                            {item.type}
                          </span>
                          {item.type === 'service' && item.billingFrequency && (
                            <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-500" />
                              {item.billingFrequency.replace('_', ' ')}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] font-mono border border-slate-700/80">
                          {item.category || 'General'}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-100">
                        {formatCurrency(item.unitPrice)}
                      </td>

                      <td className="py-3.5 px-3 text-right font-mono text-slate-400">
                        {formatCurrency(item.costPrice)}
                      </td>

                      <td className="py-3.5 px-3 text-right font-mono">
                        <span
                          className={`font-semibold ${
                            Number(marginPercent) >= 40
                              ? 'text-emerald-400'
                              : Number(marginPercent) > 15
                              ? 'text-indigo-300'
                              : 'text-amber-400'
                          }`}
                        >
                          {marginPercent}%
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        {item.type === 'product' ? (
                          <div className="flex flex-col items-center">
                            <span
                              className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                                isLowStock
                                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse'
                                  : 'bg-slate-800 text-slate-200 border border-slate-700'
                              }`}
                            >
                              {item.inventoryQty ?? 0} units
                            </span>
                            {isLowStock && (
                              <span className="text-[9px] text-rose-400 font-mono mt-0.5 flex items-center gap-0.5">
                                <AlertTriangle className="w-2.5 h-2.5" /> reorder ≤ {item.reorderLevel}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[11px] font-mono italic">Infinite / On-Demand</span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded ${
                            item.isActive !== false
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {item.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setEditingItem(item);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
                            title="Edit Item"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={async () => {
                              if (window.confirm(`Delete ${item.name}?`)) {
                                await deleteItem(item.id);
                                showSuccess(`Deleted ${item.name}`);
                              }
                            }}
                            className="p-1.5 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition"
                            title="Delete Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Creation/Edit Modal */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveModal}
        editingItem={editingItem}
      />
    </div>
  );
};
export default CatalogListView;
