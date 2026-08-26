import React from 'react';
import { Share2 } from 'lucide-react';

// =========================================================================
// Data Sharing Rules View
// =========================================================================
export const DataSharingRulesView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <Share2 className="w-5 h-5 text-sky-600" />
            Data Sharing Rules & Organization Defaults
          </h2>
          <p className="text-xs text-slate-400">
            Set organization-wide default access (Public Read/Write, Public Read-Only, or Private) and custom sharing rules.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {['Accounts', 'Contacts', 'Deals Pipeline', 'Projects & Tasks'].map((mod) => (
          <div key={mod} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100">{mod}</h3>
              <span className="text-[10px] px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200 font-mono font-semibold">
                Organization Default
              </span>
            </div>
            <select className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-sky-500">
              <option>Private (Owner & Hierarchy Only)</option>
              <option>Public Read-Only (All Tenant Members)</option>
              <option>Public Read/Write (Full Collaboration)</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  );
};
