import React from 'react';
import { ShieldAlert, Flag } from 'lucide-react';

export const RiskDeliverablesView: React.FC = () => {
  const risks = [
    { id: 'r-1', title: 'Database Migration Timeout Under Load', prob: 4, impact: 4, score: 16, category: 'technical', owner: 'Alex Mercer', status: 'open', plan: 'Pre-index tables and allocate temporary high-IOPS pool.' },
    { id: 'r-2', title: 'Client Sign-off Delay on Scope', prob: 2, impact: 5, score: 10, category: 'schedule', owner: 'Elena Rostova', status: 'mitigated', plan: 'Establish weekly formal sign-off checkpoint gates.' },
    { id: 'r-3', title: 'Third-Party API Rate Limit Ceiling', prob: 3, impact: 3, score: 9, category: 'operational', owner: 'David Vance', status: 'open', plan: 'Implement Redis token bucket caching layer.' },
  ];

  const deliverables = [
    { id: 'd-1', title: 'Multi-Tenant PostgreSQL Relational Schema', type: 'service', cost: 12000, billable: 18000, margin: '33%', status: 'accepted' },
    { id: 'd-2', title: 'Interactive Gantt & WBS Hierarchy Module', type: 'service', cost: 8500, billable: 14000, margin: '39%', status: 'delivered' },
    { id: 'd-3', title: 'Automated Workflow Engine & Client Portal', type: 'service', cost: 9500, billable: 16500, margin: '42%', status: 'in_progress' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-red-500 flex items-center justify-center shadow-lg shadow-rose-600/20">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              Risk Registers & Contractual Deliverable Milestones
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800/60">
                5x5 Threat Matrix
              </span>
            </h3>
            <p className="text-xs text-slate-400">Log project risks, coordinate mitigation plans & track deliverable sign-offs</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Risk Register Card */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              Active Risk Register (5x5 Score)
            </h4>
            <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
              {risks.length} Logged Risks
            </span>
          </div>

          <div className="space-y-3">
            {risks.map((risk) => (
              <div key={risk.id} className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-100">{risk.title}</span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                    risk.score >= 15 ? 'bg-rose-950 text-rose-300 border-rose-800' : 'bg-amber-950 text-amber-300 border-amber-800'
                  }`}>
                    Score: {risk.score} (P{risk.prob} x I{risk.impact})
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono">Mitigation: {risk.plan}</p>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800/80 font-mono">
                  <span>Owner: {risk.owner}</span>
                  <span className="uppercase text-indigo-400">{risk.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Deliverable Milestones Card */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
              <Flag className="w-4 h-4 text-emerald-400" />
              Contractual Deliverable Pipeline
            </h4>
            <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
              {deliverables.length} Deliverables
            </span>
          </div>

          <div className="space-y-3">
            {deliverables.map((del) => (
              <div key={del.id} className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-100">{del.title}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                    Margin: {del.margin}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>Est Cost: ${del.cost.toLocaleString()}</span>
                  <span className="text-emerald-400 font-bold">Billable: ${del.billable.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
