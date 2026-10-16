import React from 'react';
import {
  Flame,
  Eye,
  CheckCircle2,
  CircleDot,
  Plus,
} from 'lucide-react';
import clsx from 'clsx';
import { Task, TaskStatus } from '../../types';
import { TaskGroupBucket } from '../../types/views';
import { TaskCard } from './TaskCard';

export interface KanbanBoardProps {
  groupedBuckets?: TaskGroupBucket<Task>[];
  tasks?: Task[];
  onSelectTask?: (task: Task) => void;
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
  onDelete?: (taskId: string) => void;
  onQuickAddTask?: () => void;
}

const DEFAULT_STATUS_COLUMNS: Array<{
  status: TaskStatus;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  badgeColor: string;
}> = [
  { status: 'todo', label: 'To Do', icon: CircleDot, color: 'border-slate-700', badgeColor: 'bg-slate-800 text-slate-300' },
  { status: 'in_progress', label: 'In Progress', icon: Flame, color: 'border-indigo-800/60', badgeColor: 'bg-indigo-950/60 text-indigo-300 border border-indigo-800/60' },
  { status: 'review', label: 'In Review', icon: Eye, color: 'border-amber-800/60', badgeColor: 'bg-amber-950/60 text-amber-300 border border-amber-800/60' },
  { status: 'done', label: 'Done', icon: CheckCircle2, color: 'border-emerald-800/60', badgeColor: 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60' },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  groupedBuckets,
  tasks = [],
  onSelectTask,
  onStatusChange,
  onDelete,
  onQuickAddTask,
}) => {
  // If groupedBuckets are passed from TaskBoardPage (supporting dynamic groupBy), render buckets as columns
  if (groupedBuckets && groupedBuckets.length > 0) {
    return (
      <div className="flex gap-6 overflow-x-auto pb-4 items-start min-h-[600px] select-none">
        {groupedBuckets.map((bucket) => {
          // Only show root tasks in board columns to prevent subtask clutter
          const rootTasks = bucket.items.filter((t) => !t.parentTaskId);

          return (
            <div
              key={bucket.id}
              className="glass-panel p-4 rounded-2xl border border-slate-800/80 bg-slate-900/40 flex flex-col w-80 flex-shrink-0 min-h-[500px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: bucket.colorHex || '#6366f1' }}
                  />
                  <h3 className="text-sm font-bold text-slate-100">{bucket.title}</h3>
                </div>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  {rootTasks.length}
                </span>
              </div>

              {/* Cards List */}
              <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                {rootTasks.length === 0 ? (
                  <div className="h-32 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs text-center p-4">
                    <p>No tasks in this group</p>
                    {onQuickAddTask && (
                      <button
                        onClick={onQuickAddTask}
                        className="mt-2 text-[11px] text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Add task
                      </button>
                    )}
                  </div>
                ) : (
                  rootTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onStatusChange={onStatusChange}
                      onDelete={onDelete}
                      onOpenDetail={onSelectTask}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Fallback 4 Status Columns when no groupedBuckets are supplied
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 select-none">
      {DEFAULT_STATUS_COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.status && !t.parentTaskId);
        const ColIcon = col.icon;

        return (
          <div
            key={col.status}
            className={clsx(
              'glass-panel p-4 rounded-2xl border bg-slate-900/40 flex flex-col min-h-[550px]',
              col.color
            )}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
              <div className="flex items-center gap-2">
                <ColIcon className="w-4 h-4 text-slate-300" />
                <h3 className="text-sm font-bold text-slate-100">{col.label}</h3>
              </div>
              <span className={clsx('text-[11px] font-mono font-bold px-2 py-0.5 rounded-full', col.badgeColor)}>
                {colTasks.length}
              </span>
            </div>

            {/* Cards List */}
            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              {colTasks.length === 0 ? (
                <div className="h-32 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs text-center p-4">
                  <p>No tasks in {col.label.toLowerCase()}</p>
                  {onQuickAddTask && (
                    <button
                      onClick={onQuickAddTask}
                      className="mt-2 text-[11px] text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Add task
                    </button>
                  )}
                </div>
              ) : (
                colTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onStatusChange={onStatusChange}
                    onDelete={onDelete}
                    onOpenDetail={onSelectTask}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KanbanBoard;
