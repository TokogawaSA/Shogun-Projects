import React, { useState, useEffect } from 'react';
import { PmAnalyticsMetrics } from '../../../types';
import { projectManagementService } from '../../../services/projectManagementService';
import { BarChart3, TrendingUp, TrendingDown, Download } from 'lucide-react';

export const AnalyticsReportsView: React.FC = () => {
  const [metrics, setMetrics] = useState<PmAnalyticsMetrics | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const data = await projectManagementService.getAnalytics('p-1');
      setMetrics(data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              Earned Value Management (EVM) Analytics & Custom Reports
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/60">
                SPI & CPI Performance
              </span>
            </h3>
            <p className="text-xs text-slate-400">Schedule variance, cost variance & downloadable executive summaries</p>
          </div>
        </div>

        <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export Status Summary (PDF/CSV)
        </button>
      </div>

      {/* EVM Key Badges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-2">
          <span className="text-xs font-mono text-slate-400 uppercase">Schedule Performance (SPI)</span>
          <div className="text-2xl font-bold text-indigo-400">{metrics?.spi || 0.94}</div>
          <p className="text-[11px] font-mono text-amber-400 flex items-center gap-1">
            <TrendingDown className="w-3 h-3" /> Slight Schedule Variance (-6%)
          </p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-2">
          <span className="text-xs font-mono text-slate-400 uppercase">Cost Performance (CPI)</span>
          <div className="text-2xl font-bold text-emerald-400">{metrics?.cpi || 1.07}</div>
          <p className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Under Budget (+7% Efficiency)
          </p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-2">
          <span className="text-xs font-mono text-slate-400 uppercase">Earned Value (EV)</span>
          <div className="text-2xl font-bold text-slate-100">${(metrics?.earnedValue || 42500).toLocaleString()}</div>
          <p className="text-[11px] font-mono text-slate-400">PV: ${(metrics?.plannedValue || 45000).toLocaleString()}</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-2">
          <span className="text-xs font-mono text-slate-400 uppercase">Actual Cost (AC)</span>
          <div className="text-2xl font-bold text-slate-100">${(metrics?.actualCost || 39800).toLocaleString()}</div>
          <p className="text-[11px] font-mono text-emerald-400">+$2,700 Cost Favorable</p>
        </div>
      </div>
    </div>
  );
};
