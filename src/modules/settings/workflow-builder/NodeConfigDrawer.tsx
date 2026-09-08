import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Plus, Zap, GitBranch, Mail, CheckSquare, RefreshCw, Globe, Clock, Copy } from 'lucide-react';
import { Node } from '@xyflow/react';

interface NodeConfigDrawerProps {
  node: Node | null;
  onClose: () => void;
  onUpdate: (data: any) => void;
  onDeleteNode?: (nodeId: string) => void;
}

export const NodeConfigDrawer: React.FC<NodeConfigDrawerProps> = ({
  node,
  onClose,
  onUpdate,
  onDeleteNode,
}) => {
  const [formData, setFormData] = useState<any>({});
  const [copiedTag, setCopiedTag] = useState<string | null>(null);

  useEffect(() => {
    if (node) {
      setFormData(node.data || {});
    }
  }, [node]);

  if (!node) return null;

  const nodeType = node.type || 'event_trigger';

  const handleChange = (key: string, value: any) => {
    const updated = { ...formData, [key]: value };
    setFormData(updated);
    onUpdate(updated);
  };

  const handleCopyTag = (tag: string) => {
    navigator.clipboard.writeText(tag);
    setCopiedTag(tag);
    setTimeout(() => setCopiedTag(null), 1500);
  };

  const sampleTags = [
    '{{deal.title}}',
    '{{deal.amount}}',
    '{{deal.accountId}}',
    '{{deal.primaryContact.email}}',
    '{{task.title}}',
    '{{task.status}}',
  ];

  return (
    <div className="absolute right-0 top-0 bottom-0 w-96 bg-slate-900 border-l border-slate-800 shadow-2xl z-40 flex flex-col backdrop-blur-md">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
            {nodeType === 'event_trigger' && <Zap size={16} />}
            {nodeType === 'condition' && <GitBranch size={16} />}
            {nodeType === 'action_send_email' && <Mail size={16} />}
            {nodeType === 'action_create_task' && <CheckSquare size={16} />}
            {nodeType === 'action_update_field' && <RefreshCw size={16} />}
            {nodeType === 'action_call_webhook' && <Globe size={16} />}
            {nodeType === 'delay_timer' && <Clock size={16} />}
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Node Config: {nodeType.replace(/_/g, ' ')}
            </h3>
            <p className="text-[10px] text-slate-400">ID: {node.id}</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Body */}
      <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
        {/* Label */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-300">Node Display Label</label>
          <input
            type="text"
            value={formData.label || ''}
            onChange={(e) => handleChange('label', e.target.value)}
            placeholder="Custom label for canvas node..."
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* 1. TRIGGER NODE CONFIG */}
        {nodeType === 'event_trigger' && (
          <>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300">Target Module</label>
              <select
                value={formData.module || 'deals'}
                onChange={(e) => handleChange('module', e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-sans"
              >
                <option value="deals">Deals & Revenue</option>
                <option value="projects">Projects Hub</option>
                <option value="tasks">Kanban Tasks</option>
                <option value="accounts">Client Accounts</option>
                <option value="contacts">Contacts Directory</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300">Event Trigger Type</label>
              <select
                value={formData.event || 'on_stage_change'}
                onChange={(e) => handleChange('event', e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-sans"
              >
                <option value="on_create">On Record Created</option>
                <option value="on_update">On Record Updated</option>
                <option value="on_stage_change">On Pipeline Stage Changed</option>
                <option value="time_based_cron">Time-Based Schedule (Cron)</option>
              </select>
            </div>
          </>
        )}

        {/* 2. CONDITION NODE CONFIG */}
        {nodeType === 'condition' && (
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300">Logical Match Operator</label>
              <select
                value={formData.logicalOperator || 'AND'}
                onChange={(e) => handleChange('logicalOperator', e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-sans"
              >
                <option value="AND">Match ALL Conditions (AND)</option>
                <option value="OR">Match ANY Condition (OR)</option>
              </select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-slate-300">Predicate Rules</label>
                <button
                  type="button"
                  onClick={() => {
                    const rules = formData.rules || [];
                    handleChange('rules', [...rules, { field: 'amount', operator: 'greater_than', value: 10000 }]);
                  }}
                  className="px-2 py-1 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold flex items-center gap-1"
                >
                  <Plus size={12} /> Add Rule
                </button>
              </div>

              {(!formData.rules || formData.rules.length === 0) ? (
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-center text-slate-500 text-[11px]">
                  No rules configured. Pass-through mode.
                </div>
              ) : (
                formData.rules.map((rule: any, idx: number) => (
                  <div key={idx} className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-slate-400">Rule #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const rules = formData.rules.filter((_: any, i: number) => i !== idx);
                          handleChange('rules', rules);
                        }}
                        className="text-slate-500 hover:text-rose-400"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>

                    <input
                      type="text"
                      value={rule.field || ''}
                      onChange={(e) => {
                        const updated = [...formData.rules];
                        updated[idx].field = e.target.value;
                        handleChange('rules', updated);
                      }}
                      placeholder="Field (e.g. amount)"
                      className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-white font-mono text-[11px]"
                    />

                    <select
                      value={rule.operator || 'equals'}
                      onChange={(e) => {
                        const updated = [...formData.rules];
                        updated[idx].operator = e.target.value;
                        handleChange('rules', updated);
                      }}
                      className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-amber-300 text-[11px]"
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
                      value={String(rule.value ?? '')}
                      onChange={(e) => {
                        const updated = [...formData.rules];
                        updated[idx].value = e.target.value;
                        handleChange('rules', updated);
                      }}
                      placeholder="Comparison value"
                      className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-white font-mono text-[11px]"
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 3. SEND EMAIL ACTION CONFIG */}
        {nodeType === 'action_send_email' && (
          <>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300">Recipient Email Tag / Address</label>
              <input
                type="text"
                value={formData.to || ''}
                onChange={(e) => handleChange('to', e.target.value)}
                placeholder="e.g. {{deal.primaryContact.email}}"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300">Template ID</label>
              <input
                type="text"
                value={formData.templateId || ''}
                onChange={(e) => handleChange('templateId', e.target.value)}
                placeholder="tmpl_standard_welcome"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono"
              />
            </div>
          </>
        )}

        {/* 4. CREATE TASK ACTION CONFIG */}
        {nodeType === 'action_create_task' && (
          <>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300">Task Title</label>
              <input
                type="text"
                value={formData.taskTitle || formData.title || ''}
                onChange={(e) => handleChange('taskTitle', e.target.value)}
                placeholder="e.g. Client Kickoff Sync for {{deal.title}}"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">Due In (Days)</label>
                <input
                  type="number"
                  value={formData.dueInDays || 2}
                  onChange={(e) => handleChange('dueInDays', Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">Priority</label>
                <select
                  value={formData.priority || 'medium'}
                  onChange={(e) => handleChange('priority', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
          </>
        )}

        {/* 5. UPDATE FIELD ACTION CONFIG */}
        {nodeType === 'action_update_field' && (
          <>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300">Target Field Name</label>
              <input
                type="text"
                value={formData.targetField || ''}
                onChange={(e) => handleChange('targetField', e.target.value)}
                placeholder="e.g. stage or lifecycleStage"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300">New Field Value</label>
              <input
                type="text"
                value={formData.newValue || ''}
                onChange={(e) => handleChange('newValue', e.target.value)}
                placeholder="e.g. Closed Won or Customer"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono"
              />
            </div>
          </>
        )}

        {/* 6. CALL WEBHOOK ACTION CONFIG */}
        {nodeType === 'action_call_webhook' && (
          <>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300">Webhook Target URL</label>
              <input
                type="url"
                value={formData.url || ''}
                onChange={(e) => handleChange('url', e.target.value)}
                placeholder="https://hooks.slack.com/services/..."
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300">HTTP Method</label>
              <select
                value={formData.method || 'POST'}
                onChange={(e) => handleChange('method', e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-amber-300 font-mono font-bold"
              >
                <option value="POST">POST</option>
                <option value="GET">GET</option>
                <option value="PUT">PUT</option>
              </select>
            </div>
          </>
        )}

        {/* Dynamic Context Merge Tag Helper */}
        <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 space-y-2 mt-4">
          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider font-mono block">
            Available Dynamic Merge Tags
          </span>
          <div className="flex flex-wrap gap-1.5">
            {sampleTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleCopyTag(tag)}
                className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 hover:border-amber-500/50 text-[10px] font-mono text-slate-300 flex items-center gap-1"
              >
                <span>{tag}</span>
                <Copy size={10} className="text-slate-400" />
              </button>
            ))}
          </div>
          {copiedTag && <span className="text-[10px] text-emerald-400 font-mono font-bold">Copied {copiedTag}!</span>}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
        {onDeleteNode && (
          <button
            type="button"
            onClick={() => onDeleteNode(node.id)}
            className="px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Trash2 size={14} /> Delete Node
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          className="ml-auto px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-amber-600/20 flex items-center gap-1.5 transition-all"
        >
          <Save size={14} /> Done Editing
        </button>
      </div>
    </div>
  );
};

export default NodeConfigDrawer;
