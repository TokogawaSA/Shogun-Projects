/**
 * Price Book Tier Manager & Dynamic Pricing Matrix
 * Multi-Tenant Antigravity 2.0 Ecosystem
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Plus, 
  ArrowLeft, 
  CheckCircle2, 
  X, 
  Package, 
  Wrench
} from 'lucide-react';
import { useCatalog } from './hooks/useCatalog';
import { useCurrency } from '../../context/CurrencyContext';

export const PriceBookManager: React.FC = () => {
  const navigate = useNavigate();
  const { currencySymbol, formatCurrency } = useCurrency();
  const { 
    items, 
    priceBooks, 
    createPriceBook, 
    updatePriceBook, 
    setDefaultPriceBook 
  } = useCatalog();

  const [selectedPbId, setSelectedPbId] = useState<string>(priceBooks[0]?.id || 'pb-standard');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [newPbName, setNewPbName] = useState<string>('');
  const [newPbDesc, setNewPbDesc] = useState<string>('');
  const [bulkDiscountPercent, setBulkDiscountPercent] = useState<number>(10);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Active Selected Price Book
  const activePb = priceBooks.find((pb) => pb.id === selectedPbId) || priceBooks[0];

  const showSuccess = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  const handleCreatePriceBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPbName.trim()) return;

    const newId = await createPriceBook({
      tenantId: 'tenant-default',
      name: newPbName.trim(),
      description: newPbDesc.trim(),
      pricingRules: {},
      isDefault: false,
    });

    setIsCreateModalOpen(false);
    setNewPbName('');
    setNewPbDesc('');
    setSelectedPbId(newId);
    showSuccess(`Created Price Book: ${newPbName}`);
  };

  const handleUpdateItemPrice = async (productId: string, newPrice: number) => {
    if (!activePb) return;

    const updatedRules = { ...(activePb.pricingRules || {}) };
    if (newPrice > 0) {
      updatedRules[productId] = newPrice;
    } else {
      delete updatedRules[productId];
    }

    await updatePriceBook(activePb.id, { pricingRules: updatedRules });
    showSuccess(`Updated price rule for item`);
  };

  const handleApplyBulkDiscount = async () => {
    if (!activePb || bulkDiscountPercent <= 0) return;

    const updatedRules = { ...(activePb.pricingRules || {}) };
    items.forEach((item) => {
      const discounted = Number((item.unitPrice * (1 - bulkDiscountPercent / 100)).toFixed(2));
      updatedRules[item.id] = discounted;
    });

    await updatePriceBook(activePb.id, { pricingRules: updatedRules });
    showSuccess(`Applied ${bulkDiscountPercent}% discount across all catalog items`);
  };

  const handleResetAllRules = async () => {
    if (!activePb) return;
    if (window.confirm(`Reset all custom prices in "${activePb.name}" to standard list prices?`)) {
      await updatePriceBook(activePb.id, { pricingRules: {} });
      showSuccess(`Reset pricing rules in ${activePb.name}`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* Header & Back Navigation */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/catalog')}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 mb-2 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Products & Services Catalog
          </button>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-violet-400" />
            Price Books & Pricing Tiers Manager
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure customer-specific pricing tiers, wholesale partner rates, and enterprise discount matrices
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-md shadow-indigo-500/20 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Price Book Tier
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {actionSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Main Grid: Price Book Selector Sidebar + Pricing Matrix Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Price Books List */}
        <div className="space-y-3 lg:col-span-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono px-1">
            Active Price Books ({priceBooks.length})
          </div>

          <div className="space-y-2">
            {priceBooks.map((pb) => {
              const isSelected = pb.id === (activePb?.id || selectedPbId);
              const customRuleCount = Object.keys(pb.pricingRules || {}).length;

              return (
                <div
                  key={pb.id}
                  onClick={() => setSelectedPbId(pb.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden backdrop-blur-md ${
                    isSelected
                      ? 'bg-indigo-950/40 border-indigo-500/60 shadow-lg shadow-indigo-500/10'
                      : 'bg-slate-900/80 border-slate-800 hover:bg-slate-800/60 text-slate-400'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-bold text-xs text-slate-100">{pb.name}</div>
                    {pb.isDefault && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                        Default
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{pb.description}</p>

                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-800/80 text-[10px] font-mono">
                    <span className="text-indigo-400 font-semibold">{customRuleCount} Custom Overrides</span>
                    {!pb.isDefault && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDefaultPriceBook(pb.id);
                          showSuccess(`Set "${pb.name}" as default commercial list price.`);
                        }}
                        className="text-slate-400 hover:text-emerald-400 transition"
                      >
                        Set Default
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Pricing Rules Matrix Editor */}
        <div className="lg:col-span-3 space-y-4">
          {activePb && (
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md space-y-5">
              {/* Header Info & Bulk Tools */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-100">{activePb.name}</h2>
                    {activePb.isDefault && (
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Default Commercial
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{activePb.description}</p>
                </div>

                {/* Bulk Discount Tools */}
                <div className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80">
                  <span className="text-[11px] font-semibold text-slate-300 font-mono pl-2">Bulk Tier:</span>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    value={bulkDiscountPercent}
                    onChange={(e) => setBulkDiscountPercent(parseInt(e.target.value, 10) || 0)}
                    className="w-14 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-xs font-mono text-center"
                  />
                  <span className="text-xs text-slate-400 font-mono">%</span>
                  <button
                    onClick={handleApplyBulkDiscount}
                    className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold transition"
                  >
                    Apply
                  </button>
                  <button
                    onClick={handleResetAllRules}
                    className="px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-[11px] font-semibold transition"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Items Pricing Rules Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
                      <th className="pb-3 px-2">Catalog Item</th>
                      <th className="pb-3 px-3">Type</th>
                      <th className="pb-3 px-3 text-right">Standard Price</th>
                      <th className="pb-3 px-4 text-right">Tier Override Price ({currencySymbol})</th>
                      <th className="pb-3 px-3 text-right">Effective Savings</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs">
                    {items.map((item) => {
                      const customPrice = activePb.pricingRules?.[item.id];
                      const effectivePrice = customPrice !== undefined ? customPrice : item.unitPrice;
                      const hasOverride = customPrice !== undefined && customPrice !== item.unitPrice;
                      const savings = item.unitPrice - effectivePrice;
                      const savingsPercent = item.unitPrice > 0 ? ((savings / item.unitPrice) * 100).toFixed(1) : '0';

                      return (
                        <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${item.type === 'product' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                {item.type === 'product' ? <Package className="w-3.5 h-3.5" /> : <Wrench className="w-3.5 h-3.5" />}
                              </div>
                              <div>
                                <div className="font-bold text-slate-200">{item.name}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{item.sku}</div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                              {item.type}
                            </span>
                          </td>

                          <td className="py-3 px-3 text-right font-mono text-slate-400">
                            {formatCurrency(item.unitPrice)}
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <span className="text-slate-400 font-mono text-xs">{currencySymbol}</span>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                defaultValue={effectivePrice}
                                key={`${activePb.id}-${item.id}-${effectivePrice}`}
                                onBlur={(e) => {
                                  const val = parseFloat(e.target.value);
                                  if (!isNaN(val)) {
                                    handleUpdateItemPrice(item.id, val);
                                  }
                                }}
                                className={`w-28 px-2.5 py-1 rounded-lg text-right font-mono text-xs border ${
                                  hasOverride
                                    ? 'bg-indigo-950/40 border-indigo-500 text-indigo-200 font-bold'
                                    : 'bg-slate-800/80 border-slate-700 text-slate-300'
                                } focus:ring-2 focus:ring-indigo-500`}
                              />
                            </div>
                          </td>

                          <td className="py-3 px-3 text-right font-mono">
                            {hasOverride ? (
                              <span className={`text-xs font-semibold ${savings >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {savings >= 0 ? `-${savingsPercent}% (${formatCurrency(savings)})` : `+${Math.abs(Number(savingsPercent))}%`}
                              </span>
                            ) : (
                              <span className="text-slate-500 text-[11px]">List Price</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Price Book Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-violet-400" />
                New Price Book Tier
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePriceBook} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Price Book Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={newPbName}
                  onChange={(e) => setNewPbName(e.target.value)}
                  placeholder="e.g. Enterprise Tier A, Reseller Margin 25%"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Description / Eligibility Rules
                </label>
                <textarea
                  value={newPbDesc}
                  onChange={(e) => setNewPbDesc(e.target.value)}
                  rows={3}
                  placeholder="Contractual minimums, strategic partner terms, or tier qualifications..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md transition"
                >
                  Create Price Book
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default PriceBookManager;
