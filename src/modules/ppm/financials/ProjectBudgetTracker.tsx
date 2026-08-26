import React, { useState } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Save, 
  Edit3, 
  Layers, 
  FolderKanban,
  Calculator,
  Loader2,
  RefreshCw,
  PieChart
} from 'lucide-react';
import { useFinancials } from '../hooks/useFinancials';
import { ProjectBudget } from '../../../types';

export const ProjectBudgetTracker: React.FC = () => {
  const { projects, summaries, budgets, saveProjectBudget, loading, refresh } = useFinancials();

  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Form edit states
  const [capexBudgetInput, setCapexBudgetInput] = useState<number>(0);
  const [opexBudgetInput, setOpexBudgetInput] = useState<number>(0);
  const [laborBudgetInput, setLaborBudgetInput] = useState<number>(0);
  const [currencyInput, setCurrencyInput] = useState<string>('USD');
  const [profitMarginInput, setProfitMarginInput] = useState<number>(25);

  // Ensure an initial project is selected
  const activeProjectId = selectedProjectId || projects[0]?.id || '';
  const currentSummary = summaries[activeProjectId];
  const currentBudget = budgets[activeProjectId];

  const handleSelectProject = (projId: string) => {
    setSelectedProjectId(projId);
    setIsEditing(false);
    setSaveSuccess(false);
    const b = budgets[projId];
    if (b) {
      setCapexBudgetInput(b.capexBudget);
      setOpexBudgetInput(b.opexBudget);
      setLaborBudgetInput(b.laborBudget);
      setCurrencyInput(b.currency || 'USD');
      setProfitMarginInput(b.profitMarginPercent || 25);
    }
  };

  const handleStartEditing = () => {
    if (currentBudget) {
      setCapexBudgetInput(currentBudget.capexBudget);
      setOpexBudgetInput(currentBudget.opexBudget);
      setLaborBudgetInput(currentBudget.laborBudget);
      setCurrencyInput(currentBudget.currency || 'USD');
      setProfitMarginInput(currentBudget.profitMarginPercent || 25);
    }
    setIsEditing(true);
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProjectId) return;

    setIsSaving(true);
    setSaveSuccess(false);

    const updatedBudget: ProjectBudget = {
      projectId: activeProjectId,
      tenantId: currentBudget?.tenantId || 'tenant-default',
      capexBudget: Number(capexBudgetInput),
      opexBudget: Number(opexBudgetInput),
      laborBudget: Number(laborBudgetInput),
      actualLaborCost: currentSummary?.actualLaborCost || 0,
      actualExpenses: currentSummary?.actualExpenses || 0,
      currency: currencyInput,
      profitMarginPercent: Number(profitMarginInput),
    };

    try {
      await saveProjectBudget(updatedBudget);
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading && projects.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-7 h-7 animate-spin text-indigo-500" />
        <p className="text-xs">Loading multi-tier project budget tracker...</p>
      </div>
    );
  }

  const formatCurrency = (val: number, curr = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: curr,
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner & Project Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-600/20">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              Multi-Tier Project Budget Control
            </h1>
            <p className="text-xs text-slate-400">
              Granular CapEx, OpEx & Labor cost variance monitoring and margin governance
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <FolderKanban className="w-4 h-4 text-slate-400" />
            <select
              value={activeProjectId}
              onChange={(e) => handleSelectProject(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium min-w-[220px]"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => refresh()}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition-colors"
            title="Refresh Budget Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>

      {currentSummary ? (
        <div className="space-y-6">
          {/* High-Level Budget KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold">Total Allocated Budget</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-white">
                {formatCurrency(currentSummary.totalAllocatedBudget, currentSummary.currency)}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
                <span>CapEx + OpEx + Labor</span>
              </div>
            </div>

            <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold">Total Incurred Cost</span>
                <TrendingUp className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-bold text-white">
                {formatCurrency(currentSummary.totalActualCost, currentSummary.currency)}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                <span>Actual Spend</span>
                <span className="font-mono text-slate-400">{currentSummary.utilizationPercent}% consumed</span>
              </div>
            </div>

            <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold">Budget Variance</span>
                {currentSummary.totalVariance < 0 ? (
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                )}
              </div>
              <div
                className={`text-2xl font-bold ${
                  currentSummary.totalVariance < 0 ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {formatCurrency(currentSummary.totalVariance, currentSummary.currency)}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {currentSummary.totalVariance < 0 ? 'Budget Overrun Deficit' : 'Under Budget Buffer'}
              </div>
            </div>

            <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold">Target Profit Margin</span>
                <PieChart className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-white">
                {currentSummary.profitMarginPercent}%
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Target: {currentBudget?.profitMarginPercent || 25}% target ROI
              </div>
            </div>
          </div>

          {/* Multi-Tier Breakdown Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 1. CapEx Tier */}
            <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-xs">
                    CX
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">CapEx Tier</h3>
                    <p className="text-[11px] text-slate-400">Hardware & Fixed Infrastructure</p>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                    currentSummary.actualCapex > currentSummary.capexBudget
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {currentSummary.capexBudget > 0
                    ? Math.round((currentSummary.actualCapex / currentSummary.capexBudget) * 100)
                    : 0}
                  % Utilized
                </span>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Allocated Budget:</span>
                  <span className="font-semibold text-white">
                    {formatCurrency(currentSummary.capexBudget, currentSummary.currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Actual Spend:</span>
                  <span className="font-semibold text-white">
                    {formatCurrency(currentSummary.actualCapex, currentSummary.currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Variance:</span>
                  <span
                    className={`font-semibold ${
                      currentSummary.capexVariance < 0 ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {formatCurrency(currentSummary.capexVariance, currentSummary.currency)}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                <div
                  className={`h-full rounded-full transition-all ${
                    currentSummary.actualCapex > currentSummary.capexBudget
                      ? 'bg-rose-500'
                      : (currentSummary.actualCapex / (currentSummary.capexBudget || 1)) >= 0.8
                      ? 'bg-amber-500'
                      : 'bg-blue-500'
                  }`}
                  style={{
                    width: `${Math.min(
                      100,
                      currentSummary.capexBudget > 0
                        ? (currentSummary.actualCapex / currentSummary.capexBudget) * 100
                        : 0
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* 2. OpEx Tier */}
            <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-xs">
                    OX
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">OpEx Tier</h3>
                    <p className="text-[11px] text-slate-400">SaaS, Cloud & Operating Travel</p>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                    currentSummary.actualOpex > currentSummary.opexBudget
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {currentSummary.opexBudget > 0
                    ? Math.round((currentSummary.actualOpex / currentSummary.opexBudget) * 100)
                    : 0}
                  % Utilized
                </span>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Allocated Budget:</span>
                  <span className="font-semibold text-white">
                    {formatCurrency(currentSummary.opexBudget, currentSummary.currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Actual Spend:</span>
                  <span className="font-semibold text-white">
                    {formatCurrency(currentSummary.actualOpex, currentSummary.currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Variance:</span>
                  <span
                    className={`font-semibold ${
                      currentSummary.opexVariance < 0 ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {formatCurrency(currentSummary.opexVariance, currentSummary.currency)}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                <div
                  className={`h-full rounded-full transition-all ${
                    currentSummary.actualOpex > currentSummary.opexBudget
                      ? 'bg-rose-500'
                      : (currentSummary.actualOpex / (currentSummary.opexBudget || 1)) >= 0.8
                      ? 'bg-amber-500'
                      : 'bg-indigo-500'
                  }`}
                  style={{
                    width: `${Math.min(
                      100,
                      currentSummary.opexBudget > 0
                        ? (currentSummary.actualOpex / currentSummary.opexBudget) * 100
                        : 0
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* 3. Labor Budget Tier */}
            <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs">
                    LB
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Labor Budget Tier</h3>
                    <p className="text-[11px] text-slate-400">Engineering & Delivery Hours</p>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                    currentSummary.actualLaborCost > currentSummary.laborBudget
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {currentSummary.laborBudget > 0
                    ? Math.round((currentSummary.actualLaborCost / currentSummary.laborBudget) * 100)
                    : 0}
                  % Utilized
                </span>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Allocated Budget:</span>
                  <span className="font-semibold text-white">
                    {formatCurrency(currentSummary.laborBudget, currentSummary.currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Actual Spend:</span>
                  <span className="font-semibold text-white">
                    {formatCurrency(currentSummary.actualLaborCost, currentSummary.currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Variance:</span>
                  <span
                    className={`font-semibold ${
                      currentSummary.laborVariance < 0 ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {formatCurrency(currentSummary.laborVariance, currentSummary.currency)}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                <div
                  className={`h-full rounded-full transition-all ${
                    currentSummary.actualLaborCost > currentSummary.laborBudget
                      ? 'bg-rose-500'
                      : (currentSummary.actualLaborCost / (currentSummary.laborBudget || 1)) >= 0.8
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{
                    width: `${Math.min(
                      100,
                      currentSummary.laborBudget > 0
                        ? (currentSummary.actualLaborCost / currentSummary.laborBudget) * 100
                        : 0
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Allocation Edit Form */}
          <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Project Budget Allocations</h3>
                  <p className="text-xs text-slate-400">
                    Adjust CapEx, OpEx, and Labor ceiling caps for {currentSummary.projectTitle}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {saveSuccess && (
                  <div className="text-xs text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 animate-fadeIn">
                    <CheckCircle2 className="w-4 h-4" /> Budget Saved!
                  </div>
                )}
                {!isEditing ? (
                  <button
                    onClick={handleStartEditing}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 transition-all flex items-center gap-2"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Modify Allocations
                  </button>
                ) : null}
              </div>
            </div>

            {isEditing ? (
              <form onSubmit={handleSaveBudget} className="space-y-4 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      CapEx Budget Cap ($)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={capexBudgetInput}
                      onChange={(e) => setCapexBudgetInput(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      OpEx Budget Cap ($)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={opexBudgetInput}
                      onChange={(e) => setOpexBudgetInput(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      Labor Budget Cap ($)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={laborBudgetInput}
                      onChange={(e) => setLaborBudgetInput(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      Currency
                    </label>
                    <select
                      value={currencyInput}
                      onChange={(e) => setCurrencyInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="CAD">CAD ($)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      Target Profit Margin (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={profitMarginInput}
                      onChange={(e) => setProfitMarginInput(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" /> Save Budget Allocations
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                  <span className="text-slate-500 block mb-1">CapEx Allocation:</span>
                  <span className="text-sm font-bold text-white">
                    {formatCurrency(currentBudget?.capexBudget || 0, currentBudget?.currency)}
                  </span>
                </div>
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                  <span className="text-slate-500 block mb-1">OpEx Allocation:</span>
                  <span className="text-sm font-bold text-white">
                    {formatCurrency(currentBudget?.opexBudget || 0, currentBudget?.currency)}
                  </span>
                </div>
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                  <span className="text-slate-500 block mb-1">Labor Allocation:</span>
                  <span className="text-sm font-bold text-white">
                    {formatCurrency(currentBudget?.laborBudget || 0, currentBudget?.currency)}
                  </span>
                </div>
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                  <span className="text-slate-500 block mb-1">Target ROI Margin:</span>
                  <span className="text-sm font-bold text-emerald-400">
                    {currentBudget?.profitMarginPercent || 25}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-12 text-center text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800">
          <FolderKanban className="w-8 h-8 mx-auto text-slate-600 mb-2" />
          <p className="text-sm">Please select an active project to view and configure its financial budget.</p>
        </div>
      )}
    </div>
  );
};
