/**
 * SubTaskItem - Recursive Tree Node Component
 * Multi-Tenant Antigravity 2.0 Ecosystem
 */

import React, { useState } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  CheckCircle2, 
  CircleDot, 
  Flame, 
  Eye, 
  Plus, 
  Clock, 
  User, 
  Trash2, 
  Layers
} from 'lucide-react';
import { Task, TaskStatus, TaskPriority } from '../../../types';

export interface SubTaskTreeNode extends Task {
  children?: SubTaskTreeNode[];
}

interface SubTaskItemProps {
  node: SubTaskTreeNode;
  level?: number;
  onSelectTask: (task: Task) => void;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onAddChildTask: (parentTaskId: string) => void;
  onDeleteTask: (taskId: string) => void;
}

export const SubTaskItem: React.FC<SubTaskItemProps> = ({
  node,
  level = 0,
  onSelectTask,
  onStatusChange,
  onAddChildTask,
  onDeleteTask,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const hasChildren = node.children && node.children.length > 0;

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'done':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
      case 'in_progress':
        return <Flame className="w-3.5 h-3.5 text-indigo-400" />;
      case 'review':
        return <Eye className="w-3.5 h-3.5 text-amber-400" />;
      case 'todo':
      default:
        return <CircleDot className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      case 'high':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'medium':
        return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
      case 'low':
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  const actualHrs = node.actualHours || 0;
  const estimatedHrs = node.estimatedHours || 0;
  const hasHours = estimatedHrs > 0 || actualHrs > 0;

  return (
    <div className="space-y-1">
      {/* Current Node Row */}
      <div
        style={{ paddingLeft: `${level * 20 + 8}px` }}
        className={`group flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${
          node.status === 'done'
            ? 'bg-slate-900/40 border-slate-800/60 opacity-80'
            : 'bg-slate-900/80 hover:bg-slate-800/80 border-slate-800 hover:border-slate-700'
        }`}
        onClick={() => onSelectTask(node)}
      >
        {/* Left info: expander, status icon, title */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="p-1 rounded-md hover:bg-slate-700 text-slate-400 transition"
            >
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
          ) : (
            <div className="w-5 h-5 flex items-center justify-center text-slate-600">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
            </div>
          )}

          {/* Inline Status Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              const nextStatus: TaskStatus =
                node.status === 'todo'
                  ? 'in_progress'
                  : node.status === 'in_progress'
                  ? 'review'
                  : node.status === 'review'
                  ? 'done'
                  : 'todo';
              onStatusChange(node.id, nextStatus);
            }}
            className="p-1 rounded-lg hover:bg-slate-800 transition"
            title={`Status: ${node.status}. Click to advance.`}
          >
            {getStatusIcon(node.status)}
          </button>

          {/* Title */}
          <span
            className={`text-xs font-semibold truncate ${
              node.status === 'done' ? 'line-through text-slate-500' : 'text-slate-200'
            }`}
          >
            {node.title}
          </span>

          {/* Level depth indicator tag if deeply nested */}
          {level > 0 && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 hidden sm:inline-block">
              L{level}
            </span>
          )}

          {/* Linked Deliverable Indicator */}
          {node.lineItemId && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 hidden md:flex items-center gap-1">
              <Layers className="w-2.5 h-2.5" /> Quoted Scope
            </span>
          )}
        </div>

        {/* Right info: Priority, Time, Assignee, Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Hours Logged Badge */}
          {hasHours && (
            <div className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700 text-slate-300">
              <Clock className="w-3 h-3 text-indigo-400" />
              <span className={actualHrs > estimatedHrs && estimatedHrs > 0 ? 'text-rose-400 font-bold' : ''}>
                {actualHrs}h
              </span>
              {estimatedHrs > 0 && <span className="text-slate-500">/ {estimatedHrs}h</span>}
            </div>
          )}

          {/* Priority */}
          <span
            className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded border capitalize hidden sm:inline-block ${getPriorityBadge(
              node.priority
            )}`}
          >
            {node.priority}
          </span>

          {/* Assignee */}
          {node.assigneeId && (
            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono px-1.5 py-0.5 rounded bg-slate-800">
              <User className="w-3 h-3 text-slate-400" />
              <span className="truncate max-w-[60px]">{node.assigneeId}</span>
            </div>
          )}

          {/* Inline Action: Add Child Task */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddChildTask(node.id);
            }}
            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-emerald-400 transition"
            title="Add Child Sub-Task"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          {/* Inline Action: Delete Task */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteTask(node.id);
            }}
            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
            title="Delete Task Node"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Recursive Children Rendering */}
      {hasChildren && isExpanded && (
        <div className="space-y-1">
          {node.children!.map((child) => (
            <SubTaskItem
              key={child.id}
              node={child}
              level={level + 1}
              onSelectTask={onSelectTask}
              onStatusChange={onStatusChange}
              onAddChildTask={onAddChildTask}
              onDeleteTask={onDeleteTask}
            />
          ))}
        </div>
      )}
    </div>
  );
};
export default SubTaskItem;
