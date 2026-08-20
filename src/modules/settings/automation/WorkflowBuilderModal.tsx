import React, { useState } from 'react';
import {
  Workflow,
  Plus,
  Trash2,
  X,
  Save,
  Mail,
  CheckSquare,
  RefreshCw,
  Globe,
} from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { useAuth } from '../../../context/AuthContext';
import {
  WorkflowRule,
  SupportedModule,
  WorkflowTriggerType,
  WorkflowCondition,
  WorkflowAction,
  ConditionOperator,
} from '../../../types/settings';

interface WorkflowBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingWorkflow?: WorkflowRule | null;
  onSaved?: (savedRule: WorkflowRule) => void;
}

export const WorkflowBuilderModal: React.FC<WorkflowBuilderModalProps> = ({
  isOpen,
  onClose,
  existingWorkflow,
  onSaved,
}) => {
  const { user } = useAuth();
  const tenantId = user?.tenantId || 'tenant-default';

  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Step 1: Meta
  const [name, setName] = useState(existingWorkflow?.name || '');
  const [description, setDescription] = useState(existingWorkflow?.description || '');
  const [targetModule, setTargetModule] = useState<SupportedModule>(
    (existingWorkflow?.targetModule as SupportedModule) || 'deals'
  );
  const [triggerType, setTriggerType] = useState<WorkflowTriggerType>(
    existingWorkflow?.triggerType || 'on_create'
  );
  const [isActive, setIsActive] = useState<boolean>(
    existingWorkflow?.isActive !== undefined ? existingWorkflow.isActive : true
  );

  // Step 2: Conditions
  const [conditions, setConditions] = useState<WorkflowCondition[]>(
    existingWorkflow?.conditions && existingWorkflow.conditions.length > 0
      ? existingWorkflow.conditions
      : [{ field: 'value', operator: 'greater_than', value: 5000 }]
  );

  // Step 3: Actions
  const [actions, setActions] = useState<WorkflowAction[]>(
    existingWorkflow?.actions && existingWorkflow.actions.length > 0
      ? existingWorkflow.actions
      : [
          {
            type: 'send_email',
            config: {
              templateId: 'tpl_welcome',
              recipientField: 'ownerEmail',
            },
          },
        ]
  );

  if (!isOpen) return null;

  // Condition Handlers
  const handleAddCondition = () => {
    setConditions([
      ...conditions,
      { field: 'status', operator: 'equals', value: 'Closed Won' },
    ]);
  };

  const handleUpdateCondition = (index: number, field: keyof WorkflowCondition, val: any) => {
    const updated = [...conditions];
    updated[index] = { ...updated[index], [field]: val };
    setConditions(updated);
  };

  const handleRemoveCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  // Action Handlers
  const handleAddAction = (type: WorkflowAction['type']) => {
    let newAction: WorkflowAction;
    switch (type) {
      case 'send_email':
        newAction = {
          type: 'send_email',
          config: { templateId: 'tpl_default', recipientField: 'ownerEmail' },
        };
        break;
      case 'create_task':
        newAction = {
          type: 'create_task',
          config: {
            taskTitle: 'Automated Follow-up Task',
            dueInDays: 3,
            priority: 'high',
          },
        };
        break;
      case 'update_field':
        newAction = {
          type: 'update_field',
          config: { targetField: 'status', newValue: 'In Progress' },
        };
        break;
      case 'call_webhook':
        newAction = {
          type: 'call_webhook',
          config: {
            url: 'https://api.external.service/webhook',
            method: 'POST',
            payloadTemplate: '{"event": "workflow_trigger", "id": "{{docId}}"}',
          },
        };
        break;
    }
    setActions([...actions, newAction]);
  };

  const handleRemoveAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index));
  };

  const handleSaveWorkflow = async () => {
    if (!name.trim()) {
      setErrorMessage('Workflow name is required.');
      setActiveStep(1);
      return;
    }

    setSaving(true);
    setErrorMessage(null);

    const workflowId = existingWorkflow?.id || `wf_${Date.now()}`;
    const payload: WorkflowRule = {
      id: workflowId,
      name: name.trim(),
      description: description.trim(),
      targetModule,
      triggerType,
      isActive,
      conditions,
      actions,
      createdAt: existingWorkflow?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, `tenants/${tenantId}/workflows`, workflowId), payload, { merge: true });
      if (onSaved) onSaved(payload);
      onClose();
    } catch (err: any) {
      console.error('Error saving workflow rule:', err);
      setErrorMessage(err.message || 'Failed to save workflow rule.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Workflow className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {existingWorkflow ? 'Edit Automation Workflow' : 'Create Automation Workflow'}
              </h3>
              <p className="text-[11px] text-slate-400">
                Configure reactive triggers, condition matrices, and automated action cascades.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Navigation Bar */}
        <div className="grid grid-cols-3 border-b border-slate-800 bg-slate-950/50 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveStep(1)}
            className={`py-3 px-4 flex items-center justify-center gap-2 transition-colors border-b-2 ${
              activeStep === 1
                ? 'border-amber-500 text-amber-300 bg-amber-500/5'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold">
              1
            </span>
            <span>Target & Trigger</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStep(2)}
            className={`py-3 px-4 flex items-center justify-center gap-2 transition-colors border-b-2 ${
              activeStep === 2
                ? 'border-amber-500 text-amber-300 bg-amber-500/5'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold">
              2
            </span>
            <span>Match Conditions ({conditions.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStep(3)}
            className={`py-3 px-4 flex items-center justify-center gap-2 transition-colors border-b-2 ${
              activeStep === 3
                ? 'border-amber-500 text-amber-300 bg-amber-500/5'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold">
              3
            </span>
            <span>Action Cascade ({actions.length})</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs font-semibold">
              {errorMessage}
            </div>
          )}

          {/* STEP 1: Basic Info & Trigger */}
          {activeStep === 1 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Workflow Name</label>
                <input
                  type="text"
                  placeholder="e.g. VIP Deal Closed Notification"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Description</label>
                <textarea
                  rows={2}
                  placeholder="Explain when and why this rule executes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
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

                <div className="space-y-1.5">
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

              <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">Rule Execution Status</h4>
                  <p className="text-[11px] text-slate-400">
                    Active workflows are evaluated on write events in Cloud Function Gen 2.
                  </p>
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
            </div>
          )}

          {/* STEP 2: Match Conditions */}
          {activeStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  Specify criteria that records must satisfy to trigger action dispatchers.
                </p>
                <button
                  type="button"
                  onClick={handleAddCondition}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30 text-xs font-bold transition-all flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Condition</span>
                </button>
              </div>

              {conditions.length === 0 ? (
                <div className="p-8 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500">
                  No conditions set. The workflow will trigger on every event for this module.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {conditions.map((cond, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-800/60 border border-slate-700 flex flex-wrap items-center gap-2"
                    >
                      <input
                        type="text"
                        placeholder="Field Name (e.g. value)"
                        value={cond.field}
                        onChange={(e) => handleUpdateCondition(idx, 'field', e.target.value)}
                        className="flex-1 min-w-[120px] px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                      />

                      <select
                        value={cond.operator}
                        onChange={(e) =>
                          handleUpdateCondition(idx, 'operator', e.target.value as ConditionOperator)
                        }
                        className="px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-amber-300 font-sans"
                      >
                        <option value="equals">equals (=)</option>
                        <option value="not_equals">not equals (!=)</option>
                        <option value="greater_than">greater than (&gt;)</option>
                        <option value="less_than">less than (&lt;)</option>
                        <option value="contains">contains</option>
                        <option value="starts_with">starts with</option>
                        <option value="is_empty">is empty</option>
                        <option value="is_not_empty">is not empty</option>
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
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Action Cascade */}
          {activeStep === 3 && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-slate-400">
                  Select and configure actions executed in sequence when conditions pass.
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleAddAction('send_email')}
                    className="px-2.5 py-1 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 hover:bg-sky-500/20 text-xs font-semibold flex items-center gap-1"
                  >
                    <Mail className="w-3.5 h-3.5" /> Email
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddAction('create_task')}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 text-xs font-semibold flex items-center gap-1"
                  >
                    <CheckSquare className="w-3.5 h-3.5" /> Task
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddAction('update_field')}
                    className="px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 text-xs font-semibold flex items-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Field
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddAction('call_webhook')}
                    className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 text-xs font-semibold flex items-center gap-1"
                  >
                    <Globe className="w-3.5 h-3.5" /> Webhook
                  </button>
                </div>
              </div>

              {actions.length === 0 ? (
                <div className="p-8 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500">
                  No actions attached. Add an action above to execute on trigger.
                </div>
              ) : (
                <div className="space-y-3">
                  {actions.map((act, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-800/70 border border-slate-700 space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5 uppercase font-mono">
                          {act.type === 'send_email' && <Mail className="w-3.5 h-3.5 text-sky-400" />}
                          {act.type === 'create_task' && (
                            <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                          )}
                          {act.type === 'update_field' && (
                            <RefreshCw className="w-3.5 h-3.5 text-purple-400" />
                          )}
                          {act.type === 'call_webhook' && (
                            <Globe className="w-3.5 h-3.5 text-indigo-400" />
                          )}
                          <span>Action {idx + 1}: {act.type.replace('_', ' ')}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAction(idx)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Action Type Form Configs */}
                      {act.type === 'send_email' && (
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <label className="text-[10px] text-slate-400 font-mono uppercase">
                              Template Key
                            </label>
                            <input
                              type="text"
                              value={act.config?.templateId || ''}
                              onChange={(e) => {
                                const updated = [...actions];
                                if (!updated[idx].config) (updated[idx] as any).config = {};
                                (updated[idx] as any).config.templateId = e.target.value;
                                setActions(updated);
                              }}
                              className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 font-mono uppercase">
                              Recipient Field / Email
                            </label>
                            <input
                              type="text"
                              value={act.config?.recipientField || ''}
                              onChange={(e) => {
                                const updated = [...actions];
                                if (!updated[idx].config) (updated[idx] as any).config = {};
                                (updated[idx] as any).config.recipientField = e.target.value;
                                setActions(updated);
                              }}
                              placeholder="ownerEmail or client@mail.com"
                              className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                            />
                          </div>
                        </div>
                      )}

                      {act.type === 'create_task' && (
                        <div className="grid grid-cols-3 gap-3 text-xs">
                          <div className="col-span-2">
                            <label className="text-[10px] text-slate-400 font-mono uppercase">
                              Task Title
                            </label>
                            <input
                              type="text"
                              value={act.config?.taskTitle || ''}
                              onChange={(e) => {
                                const updated = [...actions];
                                if (!updated[idx].config) (updated[idx] as any).config = {};
                                (updated[idx] as any).config.taskTitle = e.target.value;
                                setActions(updated);
                              }}
                              className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 font-mono uppercase">
                              Due In (Days)
                            </label>
                            <input
                              type="number"
                              value={act.config?.dueInDays || 1}
                              onChange={(e) => {
                                const updated = [...actions];
                                if (!updated[idx].config) (updated[idx] as any).config = {};
                                (updated[idx] as any).config.dueInDays = Number(e.target.value);
                                setActions(updated);
                              }}
                              className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                            />
                          </div>
                        </div>
                      )}

                      {act.type === 'update_field' && (
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <label className="text-[10px] text-slate-400 font-mono uppercase">
                              Target Field
                            </label>
                            <input
                              type="text"
                              value={act.config?.targetField || ''}
                              onChange={(e) => {
                                const updated = [...actions];
                                if (!updated[idx].config) (updated[idx] as any).config = {};
                                (updated[idx] as any).config.targetField = e.target.value;
                                setActions(updated);
                              }}
                              className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 font-mono uppercase">
                              New Field Value
                            </label>
                            <input
                              type="text"
                              value={String(act.config?.newValue || '')}
                              onChange={(e) => {
                                const updated = [...actions];
                                if (!updated[idx].config) (updated[idx] as any).config = {};
                                (updated[idx] as any).config.newValue = e.target.value;
                                setActions(updated);
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
                                const updated = [...actions];
                                if (!updated[idx].config) (updated[idx] as any).config = {};
                                (updated[idx] as any).config.method = e.target.value;
                                setActions(updated);
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
                                const updated = [...actions];
                                if (!updated[idx].config) (updated[idx] as any).config = {};
                                (updated[idx] as any).config.url = e.target.value;
                                setActions(updated);
                              }}
                              placeholder="https://api.domain.com/endpoint"
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
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {activeStep > 1 && (
              <button
                type="button"
                onClick={() => setActiveStep((prev) => (prev - 1) as any)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
              >
                Previous Step
              </button>
            )}
            {activeStep < 3 && (
              <button
                type="button"
                onClick={() => setActiveStep((prev) => (prev + 1) as any)}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30 text-xs font-bold transition-all"
              >
                Next Step
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveWorkflow}
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-lg shadow-amber-600/20 flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Deploy Workflow Rule'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowBuilderModal;
