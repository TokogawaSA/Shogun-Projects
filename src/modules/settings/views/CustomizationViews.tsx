import React, { useState } from 'react';
import { ListFilter, Save, Trash2 } from 'lucide-react';

// =========================================================================
// Picklist Values & Dependency Manager View
// =========================================================================
export const PicklistManagerView: React.FC = () => {
  const [options, setOptions] = useState([
    'Discovery & Requirement',
    'Solution Proposal',
    'Executive Negotiation',
    'Closed - Won',
    'Closed - Lost',
  ]);
  const [newOption, setNewOption] = useState('');

  const handleAddOption = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOption) return;
    setOptions([...options, newOption]);
    setNewOption('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <ListFilter className="w-5 h-5 text-indigo-600" />
            Picklist Values & Dependency Manager
          </h2>
          <p className="text-xs text-slate-400">
            Define global dropdown values and option sequences across CRM modules.
          </p>
        </div>
        <button className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm">
          <Save className="w-3.5 h-3.5" />
          <span>Save Picklist</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <label className="text-xs font-bold text-slate-200">Select Field Picklist</label>
          <div className="space-y-1">
            {['deal_stage (Deals)', 'account_tier (Accounts)', 'contact_lifecycle (Contacts)', 'task_priority (Tasks)'].map(
              (p) => (
                <button
                  key={p}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium bg-slate-800/60 hover:bg-slate-800 text-slate-200 transition-colors"
                >
                  {p}
                </button>
              )
            )}
          </div>
        </div>

        <div className="md:col-span-2 p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-100">Values List</h3>
          <div className="space-y-2">
            {options.map((opt, idx) => (
              <div
                key={opt}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/60 text-xs text-slate-200"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-400">{idx + 1}.</span>
                  <span>{opt}</span>
                </div>
                <button
                  onClick={() => setOptions(options.filter((_, i) => i !== idx))}
                  className="text-slate-400 hover:text-rose-600 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddOption} className="flex gap-2 pt-2">
            <input
              type="text"
              placeholder="Add new option value"
              value={newOption}
              onChange={(e) => setNewOption(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-colors shadow-sm"
            >
              Add Option
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
