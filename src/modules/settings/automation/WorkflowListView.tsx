import React, { useState, useEffect } from 'react';
import {
  Workflow,
  Plus,
  Trash2,
  Edit3,
  ToggleLeft,
  ToggleRight,
  Mail,
  CheckSquare,
  RefreshCw,
  Globe,
  Loader2,
  Play,
  Layers,
  FileCode,
  Download,
} from 'lucide-react';
import { apiClient } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { WorkflowRule } from '../../../types/settings';
import { WorkflowBuilderModal } from './WorkflowBuilderModal';
import { convertLinearToDAG } from '../../../types/workflow';

export const WorkflowListView: React.FC = () => {
  const { user } = useAuth();
  const tenantId = user?.tenantId || 'tenant-default';

  const [workflows, setWorkflows] = useState<WorkflowRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowRule | null>(null);
  const [exportIrModal, setExportIrModal] = useState<WorkflowRule | null>(null);
  const [testingWfId, setTestingWfId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<any | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const loadWorkflows = async () => {
      try {
        const res = await apiClient.get<WorkflowRule[]>('/settings/workflows').catch(() => []);
        if (Array.isArray(res) && res.length > 0 && isMounted) {
          setWorkflows(res);
        } else if (isMounted) {
          const initialRules: WorkflowRule[] = [
            {
              id: 'wf_deal_won_notify',
              name: 'Closed-Won VIP Deal Notification',
              description: 'Sends email to account executive and creates kickoff task on deals over $10,000.',
              targetModule: 'deals',
              triggerType: 'on_stage_change',
              isActive: true,
              conditions: [
                { field: 'pipelineStage', operator: 'equals', value: 'Closed Won' },
                { field: 'amount', operator: 'greater_than', value: 10000 },
              ],
              actions: [
                {
                  type: 'send_email',
                  config: { templateId: 'tpl_deal_won', recipientField: '{{deal.primaryContact.email}}' },
                },
                {
                  type: 'create_task',
                  config: { taskTitle: 'Schedule Client Onboarding Call', dueInDays: 2, priority: 'urgent' },
                },
              ],
            },
            {
              id: 'wf_task_escalation',
              name: 'High-Priority Task Slack Webhook',
              description: 'Dispatches outbound webhook to alerting endpoint when urgent task is logged.',
              targetModule: 'tasks',
              triggerType: 'on_create',
              isActive: true,
              conditions: [{ field: 'priority', operator: 'equals', value: 'urgent' }],
              actions: [
                {
                  type: 'call_webhook',
                  config: {
                    url: 'https://hooks.slack.com/services/T00/B00/X00',
                    method: 'POST',
                    payloadTemplate: '{"text": "🚨 Urgent Task Created: {{title}}"}',
                  },
                },
              ],
            },
          ];
          setWorkflows(initialRules);
        }
      } catch {
        // Continue
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadWorkflows();
    return () => {
      isMounted = false;
    };
  }, [tenantId]);

  const toggleWorkflowStatus = async (wf: WorkflowRule) => {
    const nextState = !wf.isActive;
    try {
      await apiClient.put(`/settings/workflows/${wf.id}`, {
        isActive: nextState,
        updatedAt: new Date().toISOString(),
      });
      setWorkflows((prev) =>
        prev.map((item) => (item.id === wf.id ? { ...item, isActive: nextState } : item))
      );
    } catch (err) {
      console.error('Failed to toggle workflow status:', err);
    }
  };

  const handleDeleteWorkflow = async (workflowId: string) => {
    if (!confirm('Are you sure you want to remove this workflow rule?')) return;
    try {
      await apiClient.delete(`/settings/workflows/${workflowId}`);
      setWorkflows(workflows.filter((w) => w.id !== workflowId));
    } catch (err) {
      console.error('Failed to delete workflow:', err);
    }
  };

  const handleTestExecution = async (wf: WorkflowRule) => {
    setTestingWfId(wf.id);
    setTestResult(null);

    const testPayload = {
      amount: 15000,
      pipelineStage: 'Closed Won',
      dealTitle: 'Enterprise Cloud Transformation',
      primaryContact: { email: 'client.lead@enterprise.com' },
      tenantId,
    };

    try {
      const res = await apiClient.post<any>('/settings/workflows/execute', {
        workflow: wf,
        payload: testPayload,
      });
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ error: err.message || 'Execution test failed' });
    } finally {
      setTestingWfId(null);
    }
  };

  const openBuilder = (workflow?: WorkflowRule) => {
    setSelectedWorkflow(workflow || null);
    setIsBuilderOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Workflow className="w-5 h-5 text-amber-400" />
            Workflow Automation Engine & Graphical Canvas
          </h2>
          <p className="text-xs text-slate-400">
            Node-based DAG flowcharts, JSON Intermediate Representation (IR), and reactive event triggers.
          </p>
        </div>

        <button
          onClick={() => openBuilder()}
          className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-lg shadow-amber-600/20 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Workflow Canvas</span>
        </button>
      </div>

      {/* Test Execution Result Banner */}
      {testResult && (
        <div className="p-4 rounded-2xl bg-slate-900 border border-amber-500/40 text-xs space-y-2 relative">
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-400 uppercase font-mono tracking-wider flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5" /> Simulation Run Result
            </span>
            <button onClick={() => setTestResult(null)} className="text-slate-400 hover:text-white">
              Close
            </button>
          </div>
          <pre className="p-3 bg-slate-950 rounded-xl font-mono text-[11px] text-emerald-300 overflow-x-auto border border-slate-800">
            {JSON.stringify(testResult, null, 2)}
          </pre>
        </div>
      )}

      {/* Workflows Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden backdrop-blur-md">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-800/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
            <tr>
              <th className="px-5 py-3.5">Workflow Name & Module</th>
              <th className="px-5 py-3.5">Graph IR / Paradigm</th>
              <th className="px-5 py-3.5">Trigger Condition</th>
              <th className="px-5 py-3.5">Action Cascade</th>
              <th className="px-5 py-3.5 text-center">Active</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                    <span>Loading automation triggers...</span>
                  </div>
                </td>
              </tr>
            ) : workflows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                  No workflow rules created yet. Click "New Workflow Canvas" to set up triggers.
                </td>
              </tr>
            ) : (
              workflows.map((wf) => {
                const nodeCount = wf.graphData?.nodes?.length || (wf.conditions?.length || 0) + (wf.actions?.length || 0) + 1;
                return (
                  <tr key={wf.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs">{wf.name || wf.title}</span>
                          <span className="px-2 py-0.2 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono text-[10px] uppercase">
                            {wf.targetModule}
                          </span>
                        </div>
                        {wf.description && (
                          <p className="text-[11px] text-slate-400 mt-0.5 max-w-sm truncate">
                            {wf.description}
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-mono text-[10px] font-bold">
                          <Layers className="w-3 h-3 text-indigo-400" />
                          <span>{nodeCount} Nodes (DAG)</span>
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="space-y-1">
                        <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200 font-mono text-[10px]">
                          {wf.triggerType.replace(/_/g, ' ')}
                        </span>
                        <p className="text-[11px] text-slate-400 font-mono">
                          {wf.conditions?.length || 0} match condition{wf.conditions?.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1.5">
                        {wf.actions.map((act, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-mono"
                          >
                            {act.type === 'send_email' && <Mail className="w-3 h-3 text-sky-400" />}
                            {act.type === 'create_task' && (
                              <CheckSquare className="w-3 h-3 text-emerald-400" />
                            )}
                            {act.type === 'update_field' && (
                              <RefreshCw className="w-3 h-3 text-purple-400" />
                            )}
                            {act.type === 'call_webhook' && (
                              <Globe className="w-3 h-3 text-indigo-400" />
                            )}
                            <span>{act.type.replace('_', ' ')}</span>
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={() => toggleWorkflowStatus(wf)}
                        className="p-1 text-slate-400 hover:text-white transition-colors"
                        title={wf.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {wf.isActive ? (
                          <ToggleRight className="w-7 h-7 text-amber-400" />
                        ) : (
                          <ToggleLeft className="w-7 h-7 text-slate-600" />
                        )}
                      </button>
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleTestExecution(wf)}
                          disabled={testingWfId === wf.id}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                          title="Run Execution Simulation"
                        >
                          {testingWfId === wf.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => setExportIrModal(wf)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-slate-800 transition-colors"
                          title="Export JSON IR"
                        >
                          <FileCode className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openBuilder(wf)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                          title="Edit Visual Canvas"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteWorkflow(wf.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Delete Rule"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* JSON IR Export Modal */}
      {exportIrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
                <FileCode className="w-4 h-4 text-amber-400" /> JSON Intermediate Representation (IR)
              </h3>
              <button onClick={() => setExportIrModal(null)} className="text-slate-400 hover:text-white">
                Close
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-amber-300 font-mono max-h-96 overflow-y-auto">
              {JSON.stringify(
                exportIrModal.graphData ||
                  convertLinearToDAG(
                    exportIrModal.id,
                    tenantId,
                    exportIrModal.name || exportIrModal.title || '',
                    exportIrModal.description || '',
                    exportIrModal.targetModule as any,
                    exportIrModal.triggerType,
                    exportIrModal.isActive,
                    exportIrModal.conditions,
                    exportIrModal.actions
                  ),
                null,
                2
              )}
            </pre>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  const ir = exportIrModal.graphData || convertLinearToDAG(
                    exportIrModal.id,
                    tenantId,
                    exportIrModal.name || exportIrModal.title || '',
                    exportIrModal.description || '',
                    exportIrModal.targetModule as any,
                    exportIrModal.triggerType,
                    exportIrModal.isActive,
                    exportIrModal.conditions,
                    exportIrModal.actions
                  );
                  navigator.clipboard.writeText(JSON.stringify(ir, null, 2));
                  alert('JSON IR copied to clipboard!');
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" /> Copy IR JSON
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Builder Modal */}
      {isBuilderOpen && (
        <WorkflowBuilderModal
          isOpen={isBuilderOpen}
          onClose={() => setIsBuilderOpen(false)}
          existingWorkflow={selectedWorkflow}
          onSaved={(updated) => {
            setWorkflows((prev) => {
              const idx = prev.findIndex((w) => w.id === updated.id);
              if (idx >= 0) {
                const copy = [...prev];
                copy[idx] = updated;
                return copy;
              }
              return [updated, ...prev];
            });
          }}
        />
      )}
    </div>
  );
};

export default WorkflowListView;
