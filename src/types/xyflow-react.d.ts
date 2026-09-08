declare module '@xyflow/react' {
  import React from 'react';

  export interface Position {
    Top: 'top';
    Bottom: 'bottom';
    Left: 'left';
    Right: 'right';
  }

  export const Position: Position;

  export interface Node<T = any> {
    id: string;
    type?: string;
    position: { x: number; y: number };
    data: T;
    selected?: boolean;
  }

  export interface Edge {
    id: string;
    source: string;
    target: string;
    sourceHandle?: string | null;
    targetHandle?: string | null;
    label?: string;
    animated?: boolean;
    style?: React.CSSProperties;
  }

  export interface Connection {
    source: string | null;
    target: string | null;
    sourceHandle?: string | null;
    targetHandle?: string | null;
  }

  export interface HandleProps {
    type: 'source' | 'target';
    position: 'top' | 'bottom' | 'left' | 'right';
    id?: string;
    style?: React.CSSProperties;
    className?: string;
  }

  export const Handle: React.FC<HandleProps>;

  export interface ReactFlowProps {
    nodes: Node[];
    edges: Edge[];
    nodeTypes?: Record<string, React.ComponentType<any>>;
    onNodesChange?: (changes: any) => void;
    onEdgesChange?: (changes: any) => void;
    onConnect?: (connection: Connection) => void;
    onNodeClick?: (event: React.MouseEvent, node: Node) => void;
    fitView?: boolean;
    defaultEdgeOptions?: any;
    children?: React.ReactNode;
  }

  export const ReactFlow: React.FC<ReactFlowProps>;

  export interface BackgroundProps {
    color?: string;
    gap?: number;
    size?: number;
  }

  export const Background: React.FC<BackgroundProps>;

  export interface ControlsProps {
    className?: string;
  }

  export const Controls: React.FC<ControlsProps>;

  export const ReactFlowProvider: React.FC<{ children: React.ReactNode }>;

  export function addEdge(edgeParams: Connection | Edge, edges: Edge[]): Edge[];
  export function applyNodeChanges(changes: any[], nodes: Node[]): Node[];
  export function applyEdgeChanges(changes: any[], edges: Edge[]): Edge[];
}
