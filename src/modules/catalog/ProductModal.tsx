/**
 * Product & Service Creation / Edit Modal
 * Multi-Tenant Antigravity 2.0 Ecosystem
 */

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Package, 
  Wrench, 
  DollarSign, 
  Percent, 
  Layers, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  Barcode
} from 'lucide-react';
import { ProductOrService, ProductOrServiceType, BillingFrequency } from '../../types';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Omit<ProductOrService, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  editingItem?: ProductOrService | null;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingItem,
}) => {
  const [type, setType] = useState<ProductOrServiceType>('product');
  const [sku, setSku] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<string>('General');
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [costPrice, setCostPrice] = useState<number>(0);
  const [taxRatePercent, setTaxRatePercent] = useState<number>(0);
  const [inventoryQty, setInventoryQty] = useState<number>(10);
  const [reorderLevel, setReorderLevel] = useState<number>(5);
  const [billingFrequency, setBillingFrequency] = useState<BillingFrequency>('one_time');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (editingItem) {
      setType(editingItem.type);
      setSku(editingItem.sku || '');
      setName(editingItem.name || '');
      setDescription(editingItem.description || '');
      setCategory(editingItem.category || 'General');
      setUnitPrice(editingItem.unitPrice || 0);
      setCostPrice(editingItem.costPrice || 0);
      setTaxRatePercent(editingItem.taxRatePercent || 0);
      setInventoryQty(editingItem.inventoryQty ?? 10);
      setReorderLevel(editingItem.reorderLevel ?? 5);
      setBillingFrequency(editingItem.billingFrequency || 'one_time');
      setIsActive(editingItem.isActive !== false);
    } else {
      setType('product');
      setSku(`SKU-${Date.now().toString(36).toUpperCase()}`);
      setName('');
      setDescription('');
      setCategory('General');
      setUnitPrice(0);
      setCostPrice(0);
      setTaxRatePercent(0);
      setInventoryQty(10);
      setReorderLevel(5);
      setBillingFrequency('one_time');
      setIsActive(true);
    }
    setErrorMsg(null);
  }, [editingItem, isOpen]);

  if (!isOpen) return null;

  const marginAmount = unitPrice - costPrice;
  const marginPercent = unitPrice > 0 ? ((marginAmount / unitPrice) * 100).toFixed(1) : '0.0';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Item name is required.');
      return;
    }
    if (type === 'product' && !sku.trim()) {
      setErrorMsg('Product SKU identifier is required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await onSave({
        tenantId: editingItem?.tenantId || 'tenant-default',
        type,
        sku: type === 'product' ? sku.trim() : (sku.trim() || `SVC-${name.replace(/\s+/g, '-').toUpperCase()}`),
        name: name.trim(),
        description: description.trim(),
        category: category.trim() || 'General',
        unitPrice: Number(unitPrice),
        costPrice: Number(costPrice),
        taxRatePercent: Number(taxRatePercent),
        inventoryQty: type === 'product' ? Number(inventoryQty) : undefined,
        reorderLevel: type === 'product' ? Number(reorderLevel) : undefined,
        billingFrequency: type === 'service' ? billingFrequency : 'one_time',
        isActive,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save catalog item.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${type === 'product' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
              {type === 'product' ? <Package className="w-5 h-5" /> : <Wrench className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                {editingItem ? 'Edit Catalog Item' : 'New Product or Service'}
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {type}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {type === 'product' ? 'Configure physical good, inventory thresholds, and supply pricing' : 'Configure billable consulting, recurring SLA subscription, or advisory service'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-2 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Type Selector (Product vs Service) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 font-mono">
              Item Classification
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('product')}
                className={`p-3.5 rounded-xl border flex items-center gap-3 transition text-left ${type === 'product' ? 'bg-indigo-500/15 border-indigo-500 text-indigo-300 shadow-sm' : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'}`}
              >
                <Package className="w-5 h-5 flex-shrink-0" />
                <div>
                  <div className="text-xs font-bold text-slate-100">Physical Product</div>
                  <div className="text-[11px] text-slate-400">Inventory tracked goods, hardware, SKUs</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setType('service')}
                className={`p-3.5 rounded-xl border flex items-center gap-3 transition text-left ${type === 'service' ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 shadow-sm' : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'}`}
              >
                <Wrench className="w-5 h-5 flex-shrink-0" />
                <div>
                  <div className="text-xs font-bold text-slate-100">Billable Service</div>
                  <div className="text-[11px] text-slate-400">Hourly consulting, retainers, subscriptions</div>
                </div>
              </button>
            </div>
          </div>

          {/* General Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {type === 'product' && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                  <Barcode className="w-3.5 h-3.5 text-slate-400" />
                  SKU Identifier <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="e.g. HW-SRV-BLADE-X1"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono"
                />
              </div>
            )}

            <div className={type === 'product' ? '' : 'md:col-span-2'}>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {type === 'product' ? 'Product Name' : 'Service / Deliverable Title'} <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={type === 'product' ? 'e.g. Enterprise Blade Server' : 'e.g. Cloud Architecture Advisory'}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Description & Category */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Description & Specifications
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Key technical capabilities, warranty terms, or deliverables included..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                Category
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Infrastructure, Consulting"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />

              {type === 'service' && (
                <div className="mt-3">
                  <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Billing Frequency
                  </label>
                  <select
                    value={billingFrequency}
                    onChange={(e) => setBillingFrequency(e.target.value as BillingFrequency)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="one_time">One-Time / Fixed</option>
                    <option value="monthly">Monthly Subscription</option>
                    <option value="quarterly">Quarterly Retainer</option>
                    <option value="annual">Annual Contract</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Pricing & Financial Matrix */}
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                Pricing & Margin Calculation
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Margin:</span>
                <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${Number(marginPercent) >= 30 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : Number(marginPercent) > 0 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
                  ${marginAmount.toLocaleString()} ({marginPercent}%)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Unit Sell Price ($) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs font-mono focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Cost / Supply Price ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={costPrice}
                  onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs font-mono focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1 flex items-center gap-1">
                  <Percent className="w-3 h-3 text-slate-400" />
                  Tax Rate (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={taxRatePercent}
                  onChange={(e) => setTaxRatePercent(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs font-mono focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Physical Inventory Thresholds (for Products only) */}
          {type === 'product' && (
            <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-900/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-indigo-400" />
                  Stock Levels & Reorder Thresholds
                </span>
                {inventoryQty <= reorderLevel && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Low Stock Trigger Active
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    Current Inventory Qty (Units)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={inventoryQty}
                    onChange={(e) => setInventoryQty(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    Reorder Warning Level (Min Qty)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={reorderLevel}
                    onChange={(e) => setReorderLevel(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Active Status Switch */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60">
            <div>
              <div className="text-xs font-semibold text-slate-200">Catalog Availability Status</div>
              <div className="text-[11px] text-slate-400">When enabled, this item is available for quotes, deals, and project deliverable assignments.</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-md shadow-indigo-500/20 disabled:opacity-50 transition flex items-center gap-2"
          >
            {isSubmitting ? (
              <>Saving Item...</>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                {editingItem ? 'Update Catalog Item' : 'Create Catalog Item'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
export default ProductModal;
