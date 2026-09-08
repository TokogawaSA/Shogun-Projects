import React, { useState, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  addEdge,
  Background,
  Controls,
  applyNodeChanges,
  applyEdgeChanges,
  Node,
  Edge,
  Connection,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import TriggerNode from './nodes/TriggerNode';
import ConditionNode from './nodes/ConditionNode';
import ActionNode from './nodes/ActionNode';
import DelayNode from './nodes/DelayNode';
import NodeConfigDrawer from './NodeConfigDrawer';
import { GitBranch, Mail, CheckSquare, RefreshCw, Globe, Clock, Layers } from 'lucide-react';

interface WorkflowCanvasProps {
  initialNodes?: Node[];
  initialEdges?: Edge[];
  onGraphChange?: (nodes: Node[], edges: Edge[]) => void;
}

export const WorkflowCanvasInner: React.FC<WorkflowCanvasProps> = ({
  initialNodes = [],
  initialEdges = [],
  onGraphChange,
}) => {
  const [nodes, setNodes] = useState<Node[]>(
    initialNodes.length > 0
      ? initialNodes
      : [
          {
            id: 'node_1',
            type: 'event_trigger',
            position: { x: 250, y: 50 },
            data: { module: 'deals', event: 'stage_changed', label: 'When Deal is Closed-Won' },
          },
          {
            id: 'node_2',
            type: 'condition',
            position: { x: 250, y: 180 },
            data: {
              logicalOperator: 'AND',
              rules: [{ field: 'amount', operator: 'greater_than', value: 10000 }],
              description: 'Amount > $10,000',
            },
          },
          {
            id: 'node_3',
            type: 'action_create_task',
            position: { x: 120, y: 350 },
            data: { taskTitle: 'Schedule VIP Onboarding Call', dueInDays: 2, priority: 'urgent' },
          },
          {
            id: 'node_4',
            type: 'action_send_email',
            position: { x: 380, y: 350 },
            data: { to: '{{deal.primaryContact.email}}', templateId: 'tmpl_standard_welcome' },
          },
        ]
  );

  const [edges, setEdges] = useState<Edge[]>(
    initialEdges.length > 0
      ? initialEdges
      : [
          { id: 'e1-2', source: 'node_1', target: 'node_2' },
          { id: 'e2-3', source: 'node_2', target: 'node_3', sourceHandle: 'true' },
          { id: 'e2-4', source: 'node_2', target: 'node_4', sourceHandle: 'false' },
        ]
  );

  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const nodeTypes = useMemo(
    () => ({
      event_trigger: TriggerNode,
      condition: ConditionNode,
      action_create_record: (props: any) => <ActionNode {...props} type="action_create_record" />,
      action_send_email: (props: any) => <ActionNode {...props} type="action_send_email" />,
      action_create_task: (props: any) => <ActionNode {...props} type="action_create_task" />,
      action_update_field: (props: any) => <ActionNode {...props} type="action_update_field" />,
      action_call_webhook: (props: any) => <ActionNode {...props} type="action_call_webhook" />,
      delay_timer: DelayNode,
    }),
    []
  );

  const notifyChange = (newNodes: Node[], newEdges: Edge[]) => {
    if (onGraphChange) {
      onGraphChange(newNodes, newEdges);
    }
  };

  const onNodesChange = useCallback(
    (changes: any) => {
      setNodes((nds) => {
        const updated = applyNodeChanges(changes, nds);
        notifyChange(updated, edges);
        return updated;
      });
    },
    [edges, onGraphChange]
  );

  const onEdgesChange = useCallback(
    (changes: any) => {
      setEdges((eds) => {
        const updated = applyEdgeChanges(changes, eds);
        notifyChange(nodes, updated);
        return updated;
      });
    },
    [nodes, onGraphChange]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => {
        const updated = addEdge({ ...params, animated: true, style: { strokeWidth: 2, stroke: '#6366f1' } }, eds);
        notifyChange(nodes, updated);
        return updated;
      });
    },
    [nodes, onGraphChange]
  );

  const onNodeClick = (_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  };

  const handleUpdateNodeData = (nodeId: string, newData: any) => {
    setNodes((nds) => {
      const updated = nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, ...newData } } : n));
      notifyChange(updated, edges);
      return updated;
    });
  };

  const handleDeleteNode = (nodeId: string) => {
    setNodes((nds) => {
      const updatedNodes = nds.filter((n) => n.id !== nodeId);
      const updatedEdges = edges.filter((e) => e.source !== nodeId && e.target !== nodeId);
      setEdges(updatedEdges);
      notifyChange(updatedNodes, updatedEdges);
      return updatedNodes;
    });
    setSelectedNode(null);
  };

  const addNodeToCanvas = (type: string) => {
    const newId = `node_${Date.now()}`;
    const newY = 150 + (nodes.length % 5) * 80;
    const newX = 200 + (nodes.length % 3) * 100;

    let defaultData: any = { label: `New ${type.replace(/_/g, ' ')}` };
    if (type === 'condition') {
      defaultData = { logicalOperator: 'AND', rules: [{ field: 'amount', operator: 'greater_than', value: 5000 }] };
    } else if (type === 'action_send_email') {
      defaultData = { to: '{{deal.primaryContact.email}}', templateId: 'tmpl_standard_welcome' };
    } else if (type === 'action_create_task') {
      defaultData = { taskTitle: 'Follow-up Task', dueInDays: 3, priority: 'medium' };
    } else if (type === 'action_update_field') {
      defaultData = { targetField: 'status', newValue: 'Active' };
    } else if (type === 'action_call_webhook') {
      defaultData = { url: 'https://api.external.service/webhook', method: 'POST' };
    }

    const newNode: Node = {
      id: newId,
      type: type as any,
      position: { x: newX, y: newY },
      data: defaultData,
    };

    const updatedNodes = [...nodes, newNode];
    setNodes(updatedNodes);
    notifyChange(updatedNodes, edges);
    setSelectedNode(newNode);
  };

  return (
    <div className="w-full h-[650px] relative bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
      {/* Node Palette Bar */}
      <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-2 z-10 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Layers size={16} className="text-amber-400" />
          <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
            Node Palette (DAG Flowchart)
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => addNodeToCanvas('condition')}
            className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20 text-xs font-semibold flex items-center gap-1 transition-all"
          >
            <GitBranch size={12} /> + Condition
          </button>
          <button
            type="button"
            onClick={() => addNodeToCanvas('action_send_email')}
            className="px-2.5 py-1 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-300 hover:bg-sky-500/20 text-xs font-semibold flex items-center gap-1 transition-all"
          >
            <Mail size={12} /> + Email
          </button>
          <button
            type="button"
            onClick={() => addNodeToCanvas('action_create_task')}
            className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 text-xs font-semibold flex items-center gap-1 transition-all"
          >
            <CheckSquare size={12} /> + Task
          </button>
          <button
            type="button"
            onClick={() => addNodeToCanvas('action_update_field')}
            className="px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20 text-xs font-semibold flex items-center gap-1 transition-all"
          >
            <RefreshCw size={12} /> + Field
          </button>
          <button
            type="button"
            onClick={() => addNodeToCanvas('action_call_webhook')}
            className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20 text-xs font-semibold flex items-center gap-1 transition-all"
          >
            <Globe size={12} /> + Webhook
          </button>
          <button
            type="button"
            onClick={() => addNodeToCanvas('delay_timer')}
            className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 text-xs font-semibold flex items-center gap-1 transition-all"
          >
            <Clock size={12} /> + Delay
          </button>
        </div>
      </div>

      {/* Main Flow Canvas */}
      <div className="flex-1 w-full h-full relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          fitView
          defaultEdgeOptions={{ style: { strokeWidth: 2, stroke: '#6366f1' }, animated: true }}
        >
          <Background color="#334155" gap={20} size={1} />
          <Controls className="bg-slate-900 border border-slate-800 text-white rounded-xl overflow-hidden" />
        </ReactFlow>

        {/* Selected Node Config Drawer */}
        {selectedNode && (
          <NodeConfigDrawer
            node={selectedNode}
            onClose={() => setSelectedNode(null)}
            onUpdate={(data) => handleUpdateNodeData(selectedNode.id, data)}
            onDeleteNode={handleDeleteNode}
          />
        )}
      </div>
    </div>
  );
};

export const WorkflowCanvas: React.FC<WorkflowCanvasProps> = (props) => (
  <ReactFlowProvider>
    <WorkflowCanvasInner {...props} />
  </ReactFlowProvider>
);

export default WorkflowCanvas;
