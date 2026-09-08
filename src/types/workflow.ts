import {
  SupportedModule,
  WorkflowTriggerType,
  WorkflowCondition,
  WorkflowAction,
} from './settings';

/**
 * Workflow Intermediate Representation (IR) Schema
 * Standardized format for visual graph serialization & execution engine parsing
 */

export type WorkflowNodeType =
  | 'event_trigger'
  | 'condition'
  | 'action_create_record'
  | 'action_send_email'
  | 'action_create_task'
  | 'action_update_field'
  | 'action_call_webhook'
  | 'delay_timer';

export interface WorkflowTriggerNodeData {
  id: string;
  type: 'event_trigger';
  module: SupportedModule;
  event: WorkflowTriggerType;
  targetStage?: string;
  label?: string;
}

export interface WorkflowConditionNodeData {
  logicalOperator: 'AND' | 'OR';
  rules: WorkflowCondition[];
  description?: string;
}

export interface WorkflowActionCreateRecordData {
  targetModule: SupportedModule;
  mapping: Record<string, string>; // field -> template tag e.g. "{{deal.title}} - Delivery"
}

export interface WorkflowActionSendEmailData {
  templateId?: string;
  to: string; // e.g. "{{deal.primaryContact.email}}"
  subject?: string;
  bodyHtml?: string;
}

export interface WorkflowActionCreateTaskData {
  taskTitle: string;
  dueInDays: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedUserId?: string;
  description?: string;
}

export interface WorkflowActionUpdateFieldData {
  targetField: string;
  newValue: string;
}

export interface WorkflowActionCallWebhookData {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH';
  payloadTemplate?: string;
  headers?: Record<string, string>;
}

export interface WorkflowDelayData {
  duration: number;
  unit: 'minutes' | 'hours' | 'days';
  isoDuration?: string;
}

export type WorkflowNodeData =
  | WorkflowTriggerNodeData
  | WorkflowConditionNodeData
  | WorkflowActionCreateRecordData
  | WorkflowActionSendEmailData
  | WorkflowActionCreateTaskData
  | WorkflowActionUpdateFieldData
  | WorkflowActionCallWebhookData
  | WorkflowDelayData
  | Record<string, any>;

export interface WorkflowCanvasNode {
  id: string;
  type: WorkflowNodeType;
  position: { x: number; y: number };
  data: WorkflowNodeData;
}

export interface WorkflowCanvasEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: 'true' | 'false' | 'default' | string;
  targetHandle?: string;
  label?: string;
}

export interface WorkflowIR {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  targetModule: SupportedModule;
  triggerType: WorkflowTriggerType;
  isActive: boolean;
  trigger: WorkflowTriggerNodeData;
  nodes: WorkflowCanvasNode[];
  edges: WorkflowCanvasEdge[];
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Converter: Linear Rule -> DAG Intermediate Representation (IR)
 * Converts card-based conditions & actions array into nodes & edges graph layout
 */
export function convertLinearToDAG(
  id: string,
  tenantId: string,
  name: string,
  description: string,
  targetModule: SupportedModule,
  triggerType: WorkflowTriggerType,
  isActive: boolean,
  conditions: WorkflowCondition[],
  actions: WorkflowAction[]
): WorkflowIR {
  const triggerNodeId = 'node_1';
  const triggerNode: WorkflowTriggerNodeData = {
    id: triggerNodeId,
    type: 'event_trigger',
    module: targetModule,
    event: triggerType,
    label: `Trigger on ${targetModule} (${triggerType.replace(/_/g, ' ')})`,
  };

  const nodes: WorkflowCanvasNode[] = [
    {
      id: triggerNodeId,
      type: 'event_trigger',
      position: { x: 250, y: 50 },
      data: triggerNode,
    },
  ];

  const edges: WorkflowCanvasEdge[] = [];
  let currentSourceId = triggerNodeId;
  let currentY = 180;

  // Add Condition Node if conditions exist
  if (conditions.length > 0) {
    const condNodeId = 'node_cond_1';
    nodes.push({
      id: condNodeId,
      type: 'condition',
      position: { x: 250, y: currentY },
      data: {
        logicalOperator: 'AND',
        rules: conditions,
        description: `Evaluate ${conditions.length} condition rule(s)`,
      },
    });

    edges.push({
      id: `e-${currentSourceId}-${condNodeId}`,
      source: currentSourceId,
      target: condNodeId,
    });

    currentSourceId = condNodeId;
    currentY += 160;
  }

  // Add Action Nodes
  actions.forEach((act, idx) => {
    const actionNodeId = `node_act_${idx + 1}`;
    let nodeType: WorkflowNodeType = 'action_create_task';
    let dataPayload: any = {};

    switch (act.type) {
      case 'send_email':
        nodeType = 'action_send_email';
        dataPayload = {
          templateId: act.config?.templateId || act.templateId || 'tmpl_default',
          to: act.config?.recipientField || act.recipientField || '{{deal.primaryContact.email}}',
          subject: act.config?.subject || act.subject,
        };
        break;
      case 'create_task':
        nodeType = 'action_create_task';
        dataPayload = {
          taskTitle: act.config?.taskTitle || act.taskTitle || 'Follow-up Task',
          dueInDays: act.config?.dueInDays || act.dueInDays || 2,
          priority: act.config?.priority || act.priority || 'medium',
        };
        break;
      case 'update_field':
        nodeType = 'action_update_field';
        dataPayload = {
          targetField: act.config?.targetField || act.targetField || 'status',
          newValue: act.config?.newValue || act.newValue || 'Updated',
        };
        break;
      case 'call_webhook':
        nodeType = 'action_call_webhook';
        dataPayload = {
          url: act.config?.url || act.url || 'https://api.external.service/webhook',
          method: act.config?.method || act.method || 'POST',
          payloadTemplate: act.config?.payloadTemplate || act.payloadTemplate,
        };
        break;
    }

    const isBranchSource = currentSourceId.includes('cond');
    const xPos = isBranchSource ? 200 + idx * 220 : 250;

    nodes.push({
      id: actionNodeId,
      type: nodeType,
      position: { x: xPos, y: currentY },
      data: dataPayload,
    });

    edges.push({
      id: `e-${currentSourceId}-${actionNodeId}`,
      source: currentSourceId,
      target: actionNodeId,
      sourceHandle: isBranchSource ? (idx === 0 ? 'true' : 'false') : undefined,
    });

    if (!isBranchSource) {
      currentSourceId = actionNodeId;
      currentY += 150;
    }
  });

  return {
    id,
    tenantId,
    name,
    description,
    targetModule,
    triggerType,
    isActive,
    trigger: triggerNode,
    nodes,
    edges,
  };
}

/**
 * Converter: DAG Intermediate Representation (IR) -> Linear Rule Array
 * Extracts linear conditions and actions from a visual DAG graph
 */
export function convertDAGToLinear(ir: WorkflowIR): {
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
} {
  const conditions: WorkflowCondition[] = [];
  const actions: WorkflowAction[] = [];

  ir.nodes.forEach((node) => {
    if (node.type === 'condition') {
      const condData = node.data as WorkflowConditionNodeData;
      if (Array.isArray(condData.rules)) {
        conditions.push(...condData.rules);
      }
    } else if (node.type === 'action_send_email') {
      const data = node.data as WorkflowActionSendEmailData;
      actions.push({
        type: 'send_email',
        config: {
          templateId: data.templateId,
          recipientField: data.to,
          subject: data.subject,
        },
      });
    } else if (node.type === 'action_create_task') {
      const data = node.data as WorkflowActionCreateTaskData;
      actions.push({
        type: 'create_task',
        config: {
          taskTitle: data.taskTitle,
          dueInDays: data.dueInDays,
          priority: data.priority,
        },
      });
    } else if (node.type === 'action_update_field') {
      const data = node.data as WorkflowActionUpdateFieldData;
      actions.push({
        type: 'update_field',
        config: {
          targetField: data.targetField,
          newValue: data.newValue,
        },
      });
    } else if (node.type === 'action_call_webhook') {
      const data = node.data as WorkflowActionCallWebhookData;
      actions.push({
        type: 'call_webhook',
        config: {
          url: data.url,
          method: data.method,
          payloadTemplate: data.payloadTemplate,
        },
      });
    }
  });

  return { conditions, actions };
}
