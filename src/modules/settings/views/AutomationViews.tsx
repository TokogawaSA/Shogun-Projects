import React, { useState } from 'react';
import {
  GitFork,
  Clock,
  Webhook,
  Plus,
  Zap,
  Mail,
  ListTodo,
} from 'lucide-react';
import { WorkflowRule } from '../../../types/settings';

// =========================================================================
// 1. Workflow Rules View
// =========================================================================
export const WorkflowRulesView: React.FC = () => {
  const [workflows, setWorkflows] = useState<WorkflowRule[]>([
    {
      id: 'wf_001',
      title: 'Deal Won -> Auto Project & Onboarding Tasks',
      targetModule: 'deals',
      triggerType: 'on_stage_change',
      conditions: [{ field: 'stage', operator: 'equals', value: 'Closed Won' }],
      actions: [
        { type: 'create_task', title: 'Conduct Client Kickoff Call', priority: 'high', dueDaysFromTrigger: 2 },
        { type: 'send_email', subject: 'Welcome to Onboarding!', bodyHtml: '<p>Welcome aboard!</p>' },
      ],
      isActive: true,
    },
    {
      id: 'wf_002',
      title: 'New Inbound Lead -> Instant Auto-Response',
      targetModule: 'contacts',
      triggerType: 'on_create',
      conditions: [{ field: 'lifecycleStage', operator: 'equals', value: 'lead' }],
      actions: [{ type: 'send_email', subject: 'Thank you for reaching out' }],
      isActive: true,
    },
    {
      id: 'wf_003',
      title: 'Enterprise Account Creation -> Webhook Sync to ERP',
      targetModule: 'accounts',
      triggerType: 'on_create',
      conditions: [{ field: 'tier', operator: 'equals', value: 'enterprise' }],
      actions: [{ type: 'call_webhook', url: 'https://api.erp.internal/sync', method: 'POST' }],
      isActive: false,
    },
  ]);

  const toggleActive = (id: string) => {
    setWorkflows(
      workflows.map((wf) => (wf.id === id ? { ...wf, isActive: !wf.isActive } : wf))
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <GitFork className="w-5 h-5 text-amber-400" />
            Workflow Rules & Automation Engine
          </h2>
          <p className="text-xs text-slate-400">
            Define dynamic condition-action pipelines executing on record events.
          </p>
        </div>
        <button className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" />
          <span>New Workflow Rule</span>
        </button>
      </div>

      <div className="space-y-4">
        {workflows.map((wf) => (
          <div
            key={wf.id}
            className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    {wf.title}
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono capitalize">
                      {wf.targetModule}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Trigger: <span className="text-amber-300">{wf.triggerType}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleActive(wf.id)}
                  className={`text-xs px-2.5 py-1 rounded-full font-mono font-semibold border transition-colors ${
                    wf.isActive
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {wf.isActive ? 'Active' : 'Disabled'}
                </button>
              </div>
            </div>

            {/* Conditions & Actions Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
              <div className="space-y-1">
                <p className="text-[10px] font-mono uppercase text-slate-400">Conditions ({wf.conditions.length}):</p>
                {wf.conditions.map((c, i) => (
                  <div key={i} className="text-xs text-slate-300 bg-slate-800/40 px-2.5 py-1 rounded-lg font-mono">
                    {c.field} <span className="text-amber-400">{c.operator}</span> "{c.value}"
                  </div>
                ))}
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-mono uppercase text-slate-400">Actions ({wf.actions.length}):</p>
                <div className="flex flex-wrap gap-1.5">
                  {wf.actions.map((act, i) => (
                    <span
                      key={i}
                      className="text-xs px-2.5 py-1 rounded-lg bg-slate-800/60 border border-slate-700/60 text-slate-200 flex items-center gap-1.5"
                    >
                      {act.type === 'send_email' && <Mail className="w-3 h-3 text-emerald-400" />}
                      {act.type === 'create_task' && <ListTodo className="w-3 h-3 text-sky-400" />}
                      {act.type === 'call_webhook' && <Webhook className="w-3 h-3 text-purple-400" />}
                      <span className="capitalize">{act.type.replace('_', ' ')}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// =========================================================================
// 2. Scheduled Cron Triggers View
// =========================================================================
export const ScheduledCronView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" />
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
              <h3 className="text-xs font-bold text-white">{job.name}</h3>
              <p className="text-[11px] text-slate-400 font-mono">
                {job.cron} • <span className="text-amber-300">{job.target}</span>
              </p>
            </div>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
              {job.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// =========================================================================
// 3. Webhooks Gateway View
// =========================================================================
export const WebhooksGatewayView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Webhook className="w-5 h-5 text-amber-400" />
            Webhooks Gateway
          </h2>
          <p className="text-xs text-slate-400">
            Register inbound webhook endpoints and outbound event notification receivers.
          </p>
        </div>
        <button className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" />
          <span>Register Endpoint</span>
        </button>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <h3 className="text-xs font-bold text-white uppercase font-mono">Inbound Lead Webhook URL</h3>
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value="https://us-central1-shogun-projects.cloudfunctions.net/inboundLeadWebhook"
            className="flex-1 px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-200 font-mono"
          />
          <button className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-white">
            Copy
          </button>
        </div>
      </div>
    </div>
  );
};
