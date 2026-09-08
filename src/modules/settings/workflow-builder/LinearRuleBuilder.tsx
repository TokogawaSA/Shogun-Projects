import React from 'react';
import { Plus, Trash2, Mail, CheckSquare, RefreshCw, Globe, Zap, GitBranch, Play } from 'lucide-react';
import {
  WorkflowCondition,
  WorkflowAction,
  SupportedModule,
  WorkflowTriggerType,
  ConditionOperator,
} from '../../../types/settings';

interface LinearRuleBuilderProps {
  name: string;
  setName: (val: string) => void;
  description: string;
  setDescription: (val: string) => void;
  targetModule: SupportedModule;
  setTargetModule: (val: SupportedModule) => void;
  triggerType: WorkflowTriggerType;
  setTriggerType: (val: WorkflowTriggerType) => void;
  isActive: boolean;
  setIsActive: (val: boolean) => void;
  conditions: WorkflowCondition[];
  setConditions: (conds: WorkflowCondition[]) => void;
  actions: WorkflowAction[];
  setActions: (acts: WorkflowAction[]) => void;
}

export const LinearRuleBuilder: React.FC<LinearRuleBuilderProps> = ({
  name,
  setName,
  description,
  setDescription,
  targetModule,
  setTargetModule,
  triggerType,
  setTriggerType,
  isActive,
  setIsActive,
  conditions,
  setConditions,
  actions,
  setActions,
}) => {
  const handleAddCondition = () => {
    setConditions([...conditions, { field: 'amount', operator: 'greater_than', value: 10000 }]);
  };

  const handleUpdateCondition = (index: number, field: keyof WorkflowCondition, val: any) => {
    const updated = [...conditions];
    updated[index] = { ...updated[index], [field]: val };
    setConditions(updated);
  };

  const handleRemoveCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const handleAddAction = (type: WorkflowAction['type']) => {
    let newAction: WorkflowAction;
    switch (type) {
      case 'send_email':
        newAction = { type: 'send_email', config: { templateId: 'tmpl_welcome', recipientField: '{{deal.primaryContact.email}}' } };
        break;
      case 'create_task':
        newAction = { type: 'create_task', config: { taskTitle: 'Schedule Client Kickoff', dueInDays: 2, priority: 'urgent' } };
        break;
      case 'update_field':
        newAction = { type: 'update_field', config: { targetField: 'status', newValue: 'Closed Won' } };
        break;
      case 'call_webhook':
      default:
        newAction = {
          type: 'call_webhook',
          config: { url: 'https://api.external.service/webhook', method: 'POST', payloadTemplate: '{"event": "closed_won"}' },
        };
        break;
    }
    setActions([...actions, newAction]);
  };

  const handleRemoveAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* 1. TRIGGER BLOCK CARD */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-amber-500/40 shadow-xl space-y-4 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400">
              <Zap size={18} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                1. Trigger Block (When Event Occurs)
              </h4>
              <p className="text-[11px] text-slate-400">Define the target entity and lifecycle event trigger.</p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Rule Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Closed-Won Project Onboarding Automation"
              className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of workflow purpose..."
              className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Target Module</label>
            <select
              value={targetModule}
              onChange={(e) => setTargetModule(e.target.value as SupportedModule)}
              className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500 font-sans"
            >
              <option value="deals">Deals & Revenue</option>
              <option value="projects">Projects Hub</option>
              <option value="tasks">Kanban Tasks</option>
              <option value="accounts">Client Accounts</option>
              <option value="contacts">Contacts Directory</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Trigger Event</label>
            <select
              value={triggerType}
              onChange={(e) => setTriggerType(e.target.value as WorkflowTriggerType)}
              className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500 font-sans"
            >
              <option value="on_create">On Record Created</option>
              <option value="on_update">On Record Updated</option>
              <option value="on_stage_change">On Pipeline Stage Changed</option>
              <option value="time_based_cron">Time-Based Schedule (Cron)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Visual Down Arrow */}
      <div className="flex justify-center -my-3 z-10">
        <div className="p-1.5 rounded-full bg-slate-800 border border-slate-700 text-amber-400">
          <Play size={14} className="rotate-90" />
        </div>
      </div>

      {/* 2. CONDITION BLOCK CARD */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-indigo-500/40 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400">
              <GitBranch size={18} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                2. Condition Block (IF Predicates Match)
              </h4>
              <p className="text-[11px] text-slate-400">Evaluate conditions to allow or stop action dispatching.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddCondition}
            className="px-3 py-1.5 rounded-xl bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/30 text-xs font-bold transition-all flex items-center gap-1"
          >
            <Plus size={14} /> Add Condition Rule
          </button>
        </div>

        {conditions.length === 0 ? (
          <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500">
            No conditions attached. Workflow triggers unconditionally for all {targetModule} events.
          </div>
        ) : (
          <div className="space-y-2.5">
            {conditions.map((cond, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 flex flex-wrap items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Field (e.g. amount)"
                  value={cond.field}
                  onChange={(e) => handleUpdateCondition(idx, 'field', e.target.value)}
                  className="flex-1 min-w-[120px] px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                />

                <select
                  value={cond.operator}
                  onChange={(e) => handleUpdateCondition(idx, 'operator', e.target.value as ConditionOperator)}
                  className="px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-indigo-300 font-sans"
                >
                  <option value="equals">equals (=)</option>
                  <option value="not_equals">not equals (!=)</option>
                  <option value="greater_than">greater than (&gt;)</option>
                  <option value="less_than">less than (&lt;)</option>
                  <option value="contains">contains</option>
                  <option value="starts_with">starts with</option>
                </select>

                <input
                  type="text"
                  placeholder="Value to compare"
                  value={cond.value !== undefined ? String(cond.value) : ''}
                  onChange={(e) => handleUpdateCondition(idx, 'value', e.target.value)}
                  className="flex-1 min-w-[120px] px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                />

                <button
                  type="button"
                  onClick={() => handleRemoveCondition(idx)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Visual Down Arrow */}
      <div className="flex justify-center -my-3 z-10">
        <div className="p-1.5 rounded-full bg-slate-800 border border-slate-700 text-indigo-400">
          <Play size={14} className="rotate-90" />
        </div>
      </div>

      {/* 3. ACTION CASCADE CARD */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-emerald-500/40 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              3. Action Cascade (THEN Execute Actions)
            </h4>
            <p className="text-[11px] text-slate-400">Sequential actions executed when conditions pass.</p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleAddAction('send_email')}
              className="px-2.5 py-1 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 hover:bg-sky-500/20 text-xs font-semibold flex items-center gap-1"
            >
              <Mail size={14} /> + Email
            </button>
            <button
              type="button"
              onClick={() => handleAddAction('create_task')}
              className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 text-xs font-semibold flex items-center gap-1"
            >
              <CheckSquare size={14} /> + Task
            </button>
            <button
              type="button"
              onClick={() => handleAddAction('update_field')}
              className="px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 text-xs font-semibold flex items-center gap-1"
            >
              <RefreshCw size={14} /> + Field
            </button>
            <button
              type="button"
              onClick={() => handleAddAction('call_webhook')}
              className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 text-xs font-semibold flex items-center gap-1"
            >
              <Globe size={14} /> + Webhook
            </button>
          </div>
        </div>

        {actions.length === 0 ? (
          <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500">
            No actions attached. Select an action button above to attach execution steps.
          </div>
        ) : (
          <div className="space-y-3">
            {actions.map((act, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5 uppercase font-mono">
                    {act.type === 'send_email' && <Mail size={14} className="text-sky-400" />}
                    {act.type === 'create_task' && <CheckSquare size={14} className="text-emerald-400" />}
                    {act.type === 'update_field' && <RefreshCw size={14} className="text-purple-400" />}
                    {act.type === 'call_webhook' && <Globe size={14} className="text-indigo-400" />}
                    <span>
                      Step {idx + 1}: {act.type.replace(/_/g, ' ')}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveAction(idx)}
                    className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {act.type === 'send_email' && (
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-[10px] text-slate-400 font-mono uppercase">Template ID</label>
                      <input
                        type="text"
                        value={act.config?.templateId || ''}
                        onChange={(e) => {
                          const copy = [...actions];
                          if (!copy[idx].config) (copy[idx] as any).config = {};
                          (copy[idx] as any).config.templateId = e.target.value;
                          setActions(copy);
                        }}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-mono uppercase">Recipient Email</label>
                      <input
                        type="text"
                        value={act.config?.recipientField || ''}
                        onChange={(e) => {
                          const copy = [...actions];
                          if (!copy[idx].config) (copy[idx] as any).config = {};
                          (copy[idx] as any).config.recipientField = e.target.value;
                          setActions(copy);
                        }}
                        placeholder="{{deal.primaryContact.email}}"
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                      />
                    </div>
                  </div>
                )}

                {act.type === 'create_task' && (
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div className="col-span-2">
                      <label className="text-[10px] text-slate-400 font-mono uppercase">Task Title</label>
                      <input
                        type="text"
                        value={act.config?.taskTitle || ''}
                        onChange={(e) => {
                          const copy = [...actions];
                          if (!copy[idx].config) (copy[idx] as any).config = {};
                          (copy[idx] as any).config.taskTitle = e.target.value;
                          setActions(copy);
                        }}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-mono uppercase">Due In (Days)</label>
                      <input
                        type="number"
                        value={act.config?.dueInDays || 2}
                        onChange={(e) => {
                          const copy = [...actions];
                          if (!copy[idx].config) (copy[idx] as any).config = {};
                          (copy[idx] as any).config.dueInDays = Number(e.target.value);
                          setActions(copy);
                        }}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                      />
                    </div>
                  </div>
                )}

                {act.type === 'update_field' && (
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-[10px] text-slate-400 font-mono uppercase">Target Field</label>
                      <input
                        type="text"
                        value={act.config?.targetField || ''}
                        onChange={(e) => {
                          const copy = [...actions];
                          if (!copy[idx].config) (copy[idx] as any).config = {};
                          (copy[idx] as any).config.targetField = e.target.value;
                          setActions(copy);
                        }}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-mono uppercase">New Field Value</label>
                      <input
                        type="text"
                        value={String(act.config?.newValue || '')}
                        onChange={(e) => {
                          const copy = [...actions];
                          if (!copy[idx].config) (copy[idx] as any).config = {};
                          (copy[idx] as any).config.newValue = e.target.value;
                          setActions(copy);
                        }}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                      />
                    </div>
                  </div>
                )}

                {act.type === 'call_webhook' && (
                  <div className="space-y-2 text-xs">
                    <div className="flex gap-2">
                      <select
                        value={act.config?.method || 'POST'}
                        onChange={(e) => {
                          const copy = [...actions];
                          if (!copy[idx].config) (copy[idx] as any).config = {};
                          (copy[idx] as any).config.method = e.target.value;
                          setActions(copy);
                        }}
                        className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-amber-300 font-mono font-bold"
                      >
                        <option value="POST">POST</option>
                        <option value="GET">GET</option>
                        <option value="PUT">PUT</option>
                      </select>
                      <input
                        type="url"
                        value={act.config?.url || ''}
                        onChange={(e) => {
                          const copy = [...actions];
                          if (!copy[idx].config) (copy[idx] as any).config = {};
                          (copy[idx] as any).config.url = e.target.value;
                          setActions(copy);
                        }}
                        placeholder="https://api.external.service/webhook"
                        className="flex-1 px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LinearRuleBuilder;
