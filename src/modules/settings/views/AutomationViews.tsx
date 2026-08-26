import React from 'react';
import { Clock, Webhook, Plus } from 'lucide-react';

// =========================================================================
// 1. Scheduled Cron Triggers View
// =========================================================================
export const ScheduledCronView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600" />
            Scheduled Cron & Background Triggers
          </h2>
          <p className="text-xs text-slate-400">
            Time-based automated pipelines, daily health evaluations, and batch reporting triggers.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {[
          {
            name: 'Daily Client Health & Churn Risk Evaluation',
            cron: '0 0 * * * (Daily Midnight)',
            target: 'Accounts Module',
            status: 'Active',
          },
          {
            name: 'Weekly Pipeline Revenue Rollup Report',
            cron: '0 8 * * 1 (Every Monday 08:00)',
            target: 'Deals Module',
            status: 'Active',
          },
          {
            name: 'Overdue Task Reminder Dispatcher',
            cron: '0 9 * * * (Daily 09:00)',
            target: 'Tasks Module',
            status: 'Active',
          },
        ].map((job) => (
          <div
            key={job.name}
            className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-4"
          >
            <div>
              <h3 className="text-xs font-bold text-slate-100">{job.name}</h3>
              <p className="text-[11px] text-slate-400 font-mono">
                {job.cron} • <span className="text-amber-700 font-medium">{job.target}</span>
              </p>
            </div>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono font-semibold">
              {job.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// =========================================================================
// 2. Webhooks Gateway View
// =========================================================================
export const WebhooksGatewayView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <Webhook className="w-5 h-5 text-amber-600" />
            Webhooks Gateway
          </h2>
          <p className="text-xs text-slate-400">
            Register inbound webhook endpoints and outbound event notification receivers.
          </p>
        </div>
        <button className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm">
          <Plus className="w-3.5 h-3.5" />
          <span>Register Endpoint</span>
        </button>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <h3 className="text-xs font-bold text-slate-100 uppercase font-mono">Inbound Lead Webhook URL</h3>
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value="https://api.shogunate.dev/v1/webhooks/inbound-lead"
            className="flex-1 px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono"
          />
          <button className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-100">
            Copy
          </button>
        </div>
      </div>
    </div>
  );
};
