import React from 'react';
import { Shield, Cloud } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h3 className="text-xl font-bold text-white tracking-tight">Platform Configuration</h3>
        <p className="text-xs text-slate-400">Environment variables, security policies, and Antigravity IDE bindings</p>
      </div>

      <div className="glass-panel p-6 rounded-xl border border-slate-800 bg-slate-900/40 space-y-6">
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Cloud className="w-4 h-4 text-indigo-400" /> Firebase Environment Keys
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Project ID</label>
              <input 
                type="text" 
                readOnly 
                value="shogun-projects" 
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs font-mono text-slate-200"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Auth Domain</label>
              <input 
                type="text" 
                readOnly 
                value="shogun-projects.firebaseapp.com" 
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs font-mono text-slate-200"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 space-y-4">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" /> Security & Review Gates
          </h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/40 border border-slate-800">
              <div>
                <p className="text-xs font-semibold text-slate-200">Review-Driven Terminal Policy</p>
                <p className="text-[11px] text-slate-400">Prompts user for manual command confirmations prior to execution.</p>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">ENFORCED</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/40 border border-slate-800">
              <div>
                <p className="text-xs font-semibold text-slate-200">Isolated Client Sandboxes</p>
                <p className="text-[11px] text-slate-400">Restricts script runs to isolated, local client sandboxes.</p>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">ENABLED</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
