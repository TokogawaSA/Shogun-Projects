import { evaluateCondition, resolveMergeTags } from './evaluator.js';
import { prisma } from '../config/db.js';
import { withTenantTx } from '../utils/tenantTx.js';
import { emailQueue } from '../queues/index.js';

export interface WorkflowExecutionResult {
  workflowId: string;
  executedNodeIds: string[];
  actionsPerformed: Array<{
    nodeId: string;
    type: string;
    details: any;
  }>;
  completedAt: string;
  status: 'success' | 'failed';
  error?: string;
}

/**
 * DAG Execution Engine
 * Evaluates visual graph Intermediate Representation (IR) sequentially/concurrently across branches
 */
export async function executeWorkflow(
  workflow: any,
  eventPayload: Record<string, any>
): Promise<WorkflowExecutionResult> {
  const tenantId = workflow.tenantId || eventPayload.tenantId || 'tenant-default';
  let nodes = workflow.graphData?.nodes || workflow.nodes || [];
  let edges = workflow.graphData?.edges || workflow.edges || [];
  let triggerId = workflow.graphData?.trigger?.id || workflow.trigger?.id || 'node_1';

  // If graph nodes are empty, automatically synthesize DAG graph from linear conditions and actions
  if ((!nodes || nodes.length === 0) && (workflow.conditions || workflow.actions)) {
    const triggerNodeId = 'node_1';
    triggerId = triggerNodeId;
    nodes = [
      {
        id: triggerNodeId,
        type: 'event_trigger',
        data: {
          id: triggerNodeId,
          type: 'event_trigger',
          module: workflow.targetModule || 'deals',
          event: workflow.triggerType || 'on_stage_change',
        },
      },
    ];
    edges = [];
    let currentSourceId = triggerNodeId;

    if (Array.isArray(workflow.conditions) && workflow.conditions.length > 0) {
      const condNodeId = 'node_cond_1';
      nodes.push({
        id: condNodeId,
        type: 'condition',
        data: {
          logicalOperator: 'AND',
          rules: workflow.conditions,
        },
      });
      edges.push({
        id: `e-${currentSourceId}-${condNodeId}`,
        source: currentSourceId,
        target: condNodeId,
      });
      currentSourceId = condNodeId;
    }

    if (Array.isArray(workflow.actions)) {
      workflow.actions.forEach((act: any, idx: number) => {
        const actionNodeId = `node_act_${idx + 1}`;
        let nodeType = 'action_create_task';
        let dataPayload: any = {};

        switch (act.type) {
          case 'send_email':
            nodeType = 'action_send_email';
            dataPayload = {
              templateId: act.config?.templateId || act.templateId || 'tmpl_default',
              to: act.config?.recipientField || act.recipientField || act.to || '',
              subject: act.config?.subject || act.subject || 'Workflow Alert',
            };
            break;
          case 'create_task':
            nodeType = 'action_create_task';
            dataPayload = {
              taskTitle: act.config?.taskTitle || act.taskTitle || act.title || 'Follow-up Task',
              dueInDays: act.config?.dueInDays || act.dueInDays || 2,
              priority: act.config?.priority || act.priority || 'medium',
              description: act.config?.description || act.description,
            };
            break;
          case 'update_field':
            nodeType = 'action_update_field';
            dataPayload = {
              targetField: act.config?.targetField || act.targetField || act.fieldName || 'status',
              newValue: act.config?.newValue !== undefined ? act.config.newValue : act.newValue !== undefined ? act.newValue : act.value,
            };
            break;
          case 'call_webhook':
            nodeType = 'action_call_webhook';
            dataPayload = {
              url: act.config?.url || act.url || '',
              method: act.config?.method || act.method || 'POST',
              payloadTemplate: act.config?.payloadTemplate || act.payloadTemplate,
            };
            break;
          case 'create_record':
            nodeType = 'action_create_record';
            dataPayload = {
              targetModule: act.config?.targetModule || act.targetModule || 'projects',
              mapping: act.config?.mapping || act.mapping || {},
            };
            break;
        }

        const isBranchSource = currentSourceId.startsWith('node_cond');
        nodes.push({
          id: actionNodeId,
          type: nodeType,
          data: dataPayload,
        });

        edges.push({
          id: `e-${currentSourceId}-${actionNodeId}`,
          source: currentSourceId,
          target: actionNodeId,
          sourceHandle: isBranchSource ? 'true' : undefined,
        });

        currentSourceId = actionNodeId;
      });
    }
  }
  const context: Record<string, any> = { ...eventPayload };

  const executedNodeIds: string[] = [];
  const actionsPerformed: Array<{ nodeId: string; type: string; details: any }> = [];

  const nodeMap = new Map<string, any>(nodes.map((n: any) => [n.id, n]));
  const edgeMap = edges.reduce((acc: any, e: any) => {
    if (!acc[e.source]) acc[e.source] = [];
    acc[e.source].push(e);
    return acc;
  }, {});

  let currentNodeId: string | null = triggerId;
  const visited = new Set<string>();

  try {
    while (currentNodeId && !visited.has(currentNodeId)) {
      visited.add(currentNodeId);
      executedNodeIds.push(currentNodeId);

      const currentNode = nodeMap.get(currentNodeId);
      if (!currentNode) break;

      const outgoingEdges: any[] = edgeMap[currentNodeId] || [];

      // Handle Condition Branching
      if (currentNode.type === 'condition') {
        const isMatch = evaluateCondition(currentNode.data, context);
        const branchHandle = isMatch ? 'true' : 'false';
        
        const branchEdge = outgoingEdges.find((e: any) => e.sourceHandle === branchHandle);
        if (branchEdge) {
          currentNodeId = branchEdge.target;
        } else {
          // If edges have explicit true/false branching, never fallthrough to the wrong branch
          const hasBranchHandles = outgoingEdges.some((e: any) => e.sourceHandle === 'true' || e.sourceHandle === 'false');
          if (hasBranchHandles) {
            currentNodeId = null;
          } else {
            // Unbranched edge only continues if condition matched
            currentNodeId = isMatch ? (outgoingEdges[0]?.target || null) : null;
          }
        }
        continue;
      }

      // 1. Action: Create Record
      if (currentNode.type === 'action_create_record') {
        await withTenantTx(tenantId, async (tx) => {
          const mapping = currentNode.data?.mapping || {};
          const payload: Record<string, any> = {};
          
          for (const [key, val] of Object.entries(mapping)) {
            payload[key] = resolveMergeTags(String(val), context);
          }

          const targetModule = currentNode.data?.targetModule || 'projects';
          let createdRecord: any = null;

          if (targetModule === 'projects' && tx.project) {
            createdRecord = await tx.project.create({
              data: {
                tenantId,
                title: payload.name || payload.title || 'Automated Project',
                description: payload.description || `Provisioned by workflow ${workflow.id}`,
                ownerId: context.userId || context.ownerId || 'usr-system',
                accountId: payload.accountId || context.accountId,
                dealId: payload.dealId || context.dealId,
              },
            });
          } else if (targetModule === 'tasks' && tx.task) {
            createdRecord = await tx.task.create({
              data: {
                tenantId,
                projectId: payload.projectId || context.projectId || 'prj-default',
                title: payload.title || payload.name || 'Automated Task',
                description: payload.description || 'Generated by workflow engine',
                creatorId: context.userId || 'usr-system',
                assigneeId: payload.assigneeId || context.userId,
                status: 'todo',
                priority: 'medium',
              },
            });
          }

          actionsPerformed.push({
            nodeId: currentNode.id,
            type: 'action_create_record',
            details: { module: targetModule, recordId: createdRecord?.id },
          });
        });
      }

      // 2. Action: Send Email
      if (currentNode.type === 'action_send_email') {
        const recipient = resolveMergeTags(currentNode.data?.to || currentNode.data?.recipientField || '', context);
        const templateId = currentNode.data?.templateId || 'tmpl_default';
        const subject = resolveMergeTags(currentNode.data?.subject || 'Workflow Alert', context);

        try {
          if (emailQueue && typeof emailQueue.add === 'function') {
            await emailQueue.add('send_templated_email', {
              tenantId,
              templateId,
              to: recipient,
              subject,
              context,
            });
          }
        } catch (e: any) {
          console.warn('[WorkflowRunner] emailQueue add warning:', e.message);
        }

        actionsPerformed.push({
          nodeId: currentNode.id,
          type: 'action_send_email',
          details: { recipient, templateId, subject },
        });
      }

      // 3. Action: Create Task
      if (currentNode.type === 'action_create_task') {
        await withTenantTx(tenantId, async (tx) => {
          const taskTitle = resolveMergeTags(currentNode.data?.taskTitle || currentNode.data?.title || 'Workflow Task', context);
          const dueInDays = Number(currentNode.data?.dueInDays || 2);
          const dueDate = new Date(Date.now() + dueInDays * 86400000);
          
          let projectId = context.projectId || context.linkedProjectId;
          if (!projectId) {
            const firstProject = await tx.project.findFirst({ where: { tenantId } });
            projectId = firstProject?.id || 'prj-default';
          }

          const createdTask = await tx.task.create({
            data: {
              tenantId,
              projectId,
              title: taskTitle,
              description: resolveMergeTags(currentNode.data?.description || `Generated by workflow ${workflow.name || workflow.id}`, context),
              priority: currentNode.data?.priority || 'medium',
              status: 'todo',
              creatorId: context.userId || 'usr-system',
              assigneeId: context.userId,
              dueDate,
            },
          });

          actionsPerformed.push({
            nodeId: currentNode.id,
            type: 'action_create_task',
            details: { taskId: createdTask.id, title: taskTitle },
          });
        });
      }

      // 4. Action: Update Field
      if (currentNode.type === 'action_update_field') {
        const targetField = currentNode.data?.targetField;
        const newValue = resolveMergeTags(String(currentNode.data?.newValue || ''), context);

        if (targetField && context.entityId && context.moduleName) {
          await withTenantTx(tenantId, async (tx) => {
            if (context.moduleName === 'deals' && tx.deal) {
              await tx.deal.update({
                where: { id: context.entityId },
                data: { [targetField]: newValue },
              });
            } else if (context.moduleName === 'tasks' && tx.task) {
              await tx.task.update({
                where: { id: context.entityId },
                data: { [targetField]: newValue },
              });
            }
          });
        }

        actionsPerformed.push({
          nodeId: currentNode.id,
          type: 'action_update_field',
          details: { targetField, newValue },
        });
      }

      // 5. Action: Call Webhook
      if (currentNode.type === 'action_call_webhook') {
        const webhookUrl = resolveMergeTags(currentNode.data?.url || '', context);
        const method = currentNode.data?.method || 'POST';
        const payloadStr = resolveMergeTags(currentNode.data?.payloadTemplate || JSON.stringify(context), context);

        actionsPerformed.push({
          nodeId: currentNode.id,
          type: 'action_call_webhook',
          details: { url: webhookUrl, method, payload: payloadStr },
        });
      }

      // Advance to next node via first outgoing edge, or terminate if leaf node
      if (outgoingEdges.length > 0) {
        currentNodeId = outgoingEdges[0].target;
      } else {
        currentNodeId = null;
      }
    }

    return {
      workflowId: workflow.id,
      executedNodeIds,
      actionsPerformed,
      completedAt: new Date().toISOString(),
      status: 'success',
    };
  } catch (err: any) {
    console.error(`[WorkflowRunner] Error executing workflow ${workflow.id}:`, err.message);
    return {
      workflowId: workflow.id,
      executedNodeIds,
      actionsPerformed,
      completedAt: new Date().toISOString(),
      status: 'failed',
      error: err.message,
    };
  }
}
