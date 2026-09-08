import React from 'react';
import { Settings, Zap } from 'lucide-react';

export const AdminWorkflowView: React.FC = () => {
  const rules = [
    { id: 'r-1', title: 'Auto-Notify PM on Task Status Move to Review', trigger: 'on_stage_change', module: 'tasks', action: 'Send Email & In-App Notification', active: true },
    { id: 'r-2', title: 'Auto-Generate Invoice on Milestone Sign-off', trigger: 'on_update', module: 'projectMilestones', action: 'Create Invoice (Requested State)', active: true },
    { id: 'r-3', title: 'Escalate Over-Allocated Worker Alert', trigger: 'time_based_cron', module: 'resources', action: 'Trigger Burnout Risk Alert', active: true },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-700 to-slate-900 flex items-center justify-center shadow-lg border border-slate-700">
            <Settings className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              System Administration & Workflow Automation Rules
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700">
                Rule Engine
              </span>
            </h3>
            <p className="text-xs text-slate-400">User roles, organizational access tiers & trigger-condition-action rule execution</p>
          </div>
        </div>

        <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2">
          <Zap className="w-4 h-4" />
          + Create Automation Rule
        </button>
      </div>

      {/* Rules Grid */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            Configured Workflow Rules
          </h4>
          <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
            {rules.length} Rules Active
          </span>
        </div>

        <div className="space-y-3">
          {rules.map((rule) => (
            <div key={rule.id} className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h5 className="text-xs font-bold text-slate-100">{rule.title}</h5>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                    {rule.trigger}
                  </span>
                </div>
                <p className="text-xs font-mono text-slate-400">Action: {rule.action} (Target: {rule.module})</p>
              </div>

              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                Active
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
