import React, { useState } from 'react';
import { Workflow, X, Save, Layers, ListFilter } from 'lucide-react';
import { apiClient } from '../../../services/api';
import {
  WorkflowRule,
  SupportedModule,
  WorkflowTriggerType,
  WorkflowCondition,
  WorkflowAction,
} from '../../../types/settings';
import { convertLinearToDAG, convertDAGToLinear } from '../../../types/workflow';
import LinearRuleBuilder from '../workflow-builder/LinearRuleBuilder';
import WorkflowCanvas from '../workflow-builder/WorkflowCanvas';
import { Node, Edge } from '@xyflow/react';

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
  // Paradigm mode: 'linear' (Paradigm A) vs 'dag' (Paradigm B)
  const [paradigm, setParadigm] = useState<'linear' | 'dag'>('dag');
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Core Rule Meta
  const [name, setName] = useState(existingWorkflow?.name || existingWorkflow?.title || '');
  const [description, setDescription] = useState(existingWorkflow?.description || '');
  const [targetModule, setTargetModule] = useState<SupportedModule>(
    (existingWorkflow?.targetModule as SupportedModule) || 'deals'
  );
  const [triggerType, setTriggerType] = useState<WorkflowTriggerType>(
    existingWorkflow?.triggerType || 'on_stage_change'
  );
  const [isActive, setIsActive] = useState<boolean>(
    existingWorkflow?.isActive !== undefined ? existingWorkflow.isActive : true
  );

  // Paradigm A Linear State
  const [conditions, setConditions] = useState<WorkflowCondition[]>(
    existingWorkflow?.conditions && existingWorkflow.conditions.length > 0
      ? existingWorkflow.conditions
      : [{ field: 'amount', operator: 'greater_than', value: 10000 }]
  );

  const [actions, setActions] = useState<WorkflowAction[]>(
    existingWorkflow?.actions && existingWorkflow.actions.length > 0
      ? existingWorkflow.actions
      : [
          {
            type: 'send_email',
            config: {
              templateId: 'tmpl_standard_welcome',
              recipientField: '{{deal.primaryContact.email}}',
            },
          },
        ]
  );

  // Paradigm B Graph State (IR)
  const initialIR = convertLinearToDAG(
    existingWorkflow?.id || `wf_${Date.now()}`,
    'tenant-default',
    name || 'New Workflow Rule',
    description,
    targetModule,
    triggerType,
    isActive,
    conditions,
    actions
  );

  const [graphNodes, setGraphNodes] = useState<Node[]>(
    existingWorkflow?.graphData?.nodes || initialIR.nodes
  );
  const [graphEdges, setGraphEdges] = useState<Edge[]>(
    existingWorkflow?.graphData?.edges || initialIR.edges
  );

  if (!isOpen) return null;

  const handleGraphChange = (newNodes: Node[], newEdges: Edge[]) => {
    setGraphNodes(newNodes);
    setGraphEdges(newEdges);

    // Sync graph nodes back to linear conditions and actions
    const extracted = convertDAGToLinear({
      id: existingWorkflow?.id || `wf_${Date.now()}`,
      tenantId: 'tenant-default',
      name,
      targetModule,
      triggerType,
      isActive,
      trigger: { id: 'node_1', type: 'event_trigger', module: targetModule, event: triggerType },
      nodes: newNodes as any,
      edges: newEdges as any,
    });

    if (extracted.conditions.length > 0) setConditions(extracted.conditions);
    if (extracted.actions.length > 0) setActions(extracted.actions);
  };

  const handleSaveWorkflow = async () => {
    if (!name.trim()) {
      setErrorMessage('Workflow name is required.');
      return;
    }

    setSaving(true);
    setErrorMessage(null);

    const workflowId = existingWorkflow?.id || `wf_${Date.now()}`;
    let finalGraphNodes = graphNodes;
    let finalGraphEdges = graphEdges;

    if (paradigm === 'linear') {
      const generatedIR = convertLinearToDAG(
        workflowId,
        'tenant-default',
        name.trim(),
        description.trim(),
        targetModule,
        triggerType,
        isActive,
        conditions,
        actions
      );
      finalGraphNodes = generatedIR.nodes;
      finalGraphEdges = generatedIR.edges;
    }

    const graphDataPayload = {
      id: workflowId,
      trigger: { id: 'node_1', type: 'event_trigger', module: targetModule, event: triggerType },
      nodes: finalGraphNodes,
      edges: finalGraphEdges,
    };

    const payload: WorkflowRule = {
      id: workflowId,
      name: name.trim(),
      title: name.trim(),
      description: description.trim(),
      targetModule,
      triggerType,
      isActive,
      conditions,
      actions,
      graphData: graphDataPayload,
      createdAt: existingWorkflow?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await apiClient.post('/settings/workflows', payload);
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
      <div className="relative w-full max-w-5xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Workflow className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                {existingWorkflow ? 'Edit Automation Workflow' : 'Create Automation Workflow'}
              </h3>
              <p className="text-[11px] text-slate-400">
                Visual Graph Canvas (DAG) & Rule-Based Automation Engine.
              </p>
            </div>
          </div>

          {/* Paradigm Toggle Switcher */}
          <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setParadigm('linear')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                paradigm === 'linear'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ListFilter size={14} />
              <span>Paradigm A: Linear Card Builder</span>
            </button>
            <button
              type="button"
              onClick={() => setParadigm('dag')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                paradigm === 'dag'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers size={14} />
              <span>Paradigm B: Node Canvas (DAG)</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs font-semibold">
              {errorMessage}
            </div>
          )}

          {paradigm === 'linear' ? (
            <LinearRuleBuilder
              name={name}
              setName={setName}
              description={description}
              setDescription={setDescription}
              targetModule={targetModule}
              setTargetModule={setTargetModule}
              triggerType={triggerType}
              setTriggerType={setTriggerType}
              isActive={isActive}
              setIsActive={setIsActive}
              conditions={conditions}
              setConditions={setConditions}
              actions={actions}
              setActions={setActions}
            />
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Workflow Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Closed-Won Onboarding Automation"
                    className="w-full px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Target Module</label>
                  <select
                    value={targetModule}
                    onChange={(e) => setTargetModule(e.target.value as SupportedModule)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white font-sans"
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
                    className="w-full px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white font-sans"
                  >
                    <option value="on_create">On Record Created</option>
                    <option value="on_update">On Record Updated</option>
                    <option value="on_stage_change">On Pipeline Stage Changed</option>
                    <option value="time_based_cron">Time-Based Schedule (Cron)</option>
                  </select>
                </div>
              </div>

              <WorkflowCanvas
                initialNodes={graphNodes}
                initialEdges={graphEdges}
                onGraphChange={handleGraphChange}
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            {graphNodes.length} Canvas Nodes • {graphEdges.length} Connections
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
              <span>{saving ? 'Deploying...' : 'Deploy Workflow Graph (IR)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowBuilderModal;
