import React, { useState } from 'react';
import { 
  Plus, 
  Calendar, 
  CheckSquare, 
  User, 
  SlidersHorizontal,
  MessageSquare,
  Clock
} from 'lucide-react';
import clsx from 'clsx';
import { Task, TaskStatusColumn, Milestone } from '../types';

interface ProjectBoardProps {
  tasks: Task[];
  columns: TaskStatusColumn[];
  milestones: Milestone[];
  onOpenTask: (task: Task) => void;
  onQuickAddTask: (columnId: string, title: string) => Promise<void>;
  onMoveTask: (taskId: string, newStatus: string) => Promise<void>;
  onOpenColumnConfig: () => void;
}

const COLUMN_COLORS: Record<string, { dot: string; headerBg: string; border: string }> = {
  slate: { dot: 'bg-slate-400', headerBg: 'bg-slate-500/10 text-slate-300', border: 'border-slate-800' },
  blue: { dot: 'bg-blue-400', headerBg: 'bg-blue-500/10 text-blue-300', border: 'border-blue-500/20' },
  amber: { dot: 'bg-amber-400', headerBg: 'bg-amber-500/10 text-amber-300', border: 'border-amber-500/20' },
  purple: { dot: 'bg-purple-400', headerBg: 'bg-purple-500/10 text-purple-300', border: 'border-purple-500/20' },
  emerald: { dot: 'bg-emerald-400', headerBg: 'bg-emerald-500/10 text-emerald-300', border: 'border-emerald-500/20' },
  rose: { dot: 'bg-rose-400', headerBg: 'bg-rose-500/10 text-rose-300', border: 'border-rose-500/20' },
  cyan: { dot: 'bg-cyan-400', headerBg: 'bg-cyan-500/10 text-cyan-300', border: 'border-cyan-500/20' },
  indigo: { dot: 'bg-indigo-400', headerBg: 'bg-indigo-500/10 text-indigo-300', border: 'border-indigo-500/20' },
};

const PRIORITY_META = {
  urgent: { label: 'Urgent', bg: 'bg-red-500/15 text-red-400 border-red-500/30' },
  high: { label: 'High', bg: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  medium: { label: 'Medium', bg: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  low: { label: 'Low', bg: 'bg-slate-500/15 text-slate-400 border-slate-500/30' },
};

export const ProjectBoard: React.FC<ProjectBoardProps> = ({
  tasks,
  columns,
  milestones,
  onOpenTask,
  onQuickAddTask,
  onMoveTask,
  onOpenColumnConfig,
}) => {
  const [inlineAddingColumn, setInlineAddingColumn] = useState<string | null>(null);
  const [quickTitle, setQuickTitle] = useState('');
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    setDraggingTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    if (dragOverColumn !== colId) {
      setDragOverColumn(colId);
    }
  };

  const handleDrop = async (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggingTaskId;
    setDragOverColumn(null);
    setDraggingTaskId(null);

    if (taskId) {
      await onMoveTask(taskId, colId);
    }
  };

  const handleQuickSubmit = async (colId: string) => {
    if (!quickTitle.trim()) return;
    const title = quickTitle.trim();
    setQuickTitle('');
    setInlineAddingColumn(null);
    await onQuickAddTask(colId, title);
  };

  return (
    <div className="space-y-4">
      {/* Board Controls Toolbar */}
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="font-semibold text-slate-200">{tasks.length}</span>
          <span>total tasks across</span>
          <span className="font-semibold text-slate-200">{columns.length}</span>
          <span>columns</span>
        </div>

        <button
          onClick={onOpenColumnConfig}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-white transition-all shadow-sm"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
          <span>Customize Columns</span>
        </button>
      </div>

      {/* Kanban Columns Grid */}
      <div className="flex items-start gap-4 overflow-x-auto pb-6 pt-1 scrollbar-thin">
        {columns.map((col) => {
          const colorMeta = COLUMN_COLORS[col.color || 'slate'] || COLUMN_COLORS.slate;
          const colTasks = tasks.filter((t) => (t.status || 'todo') === col.id);
          const isOver = dragOverColumn === col.id;

          return (
            <div
              key={col.id}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={() => setDragOverColumn(null)}
              onDrop={(e) => handleDrop(e, col.id)}
              className={clsx(
                'w-80 shrink-0 rounded-2xl flex flex-col transition-all duration-150 border',
                isOver
                  ? 'bg-indigo-950/20 border-indigo-500/50 ring-2 ring-indigo-500/20'
                  : 'bg-slate-900/60 border-slate-800/80'
              )}
            >
              {/* Column Header */}
              <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={clsx('w-2 h-2 rounded-full', colorMeta.dot)} />
                  <h4 className="text-xs font-bold text-slate-200 truncate uppercase tracking-wider font-mono">
                    {col.name}
                  </h4>
                  <span className="px-1.5 py-0.5 rounded-md bg-slate-800 text-[10px] font-mono text-slate-400 font-semibold">
                    {colTasks.length}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setInlineAddingColumn(col.id);
                    setQuickTitle('');
                  }}
                  className="p-1 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors"
                  title="Add task to this column"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Cards Container */}
              <div className="p-2.5 space-y-2.5 min-h-[300px] max-h-[calc(100vh-280px)] overflow-y-auto">
                {/* Inline Quick Add Form */}
                {inlineAddingColumn === col.id && (
                  <div className="p-3 bg-slate-900 border border-indigo-500/50 rounded-xl shadow-lg animate-in fade-in zoom-in-95 duration-100">
                    <input
                      type="text"
                      autoFocus
                      placeholder="Task title..."
                      value={quickTitle}
                      onChange={(e) => setQuickTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleQuickSubmit(col.id);
                        if (e.key === 'Escape') setInlineAddingColumn(null);
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 mb-2"
                    />
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setInlineAddingColumn(null)}
                        className="px-2 py-1 text-[11px] text-slate-400 hover:text-slate-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickSubmit(col.id)}
                        disabled={!quickTitle.trim()}
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-[11px] font-semibold rounded-lg shadow-sm"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}

                {/* Task Cards */}
                {colTasks.map((task) => {
                  const pMeta = PRIORITY_META[task.priority || 'medium'];
                  const milestone = milestones.find((m) => m.id === task.milestoneId);
                  const subtasksTotal = task.subtasks?.length || 0;
                  const subtasksDone = task.subtasks?.filter((s) => s.completed).length || 0;
                  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && col.id !== 'done';
                  const commentsCount = task.comments?.length || 0;

                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onClick={() => onOpenTask(task)}
                      className={clsx(
                        'group p-3.5 bg-slate-900/90 hover:bg-slate-900 border border-slate-800/90 hover:border-slate-700/90 rounded-xl shadow-sm hover:shadow-md cursor-pointer transition-all duration-150 flex flex-col justify-between space-y-2.5',
                        draggingTaskId === task.id ? 'opacity-40 scale-95' : 'opacity-100'
                      )}
                    >
                      {/* Priority pill, Issue Type & Milestone Tag */}
                      <div className="flex items-center justify-between gap-1.5 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          {task.issueType && task.issueType !== 'task' && (
                            <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700 font-semibold">
                              {task.issueType === 'bug' ? '🐞 Bug' : task.issueType === 'feature' ? '✨ Feat' : task.issueType}
                            </span>
                          )}
                          <span
                            className={clsx(
                              'px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider border',
                              pMeta.bg
                            )}
                          >
                            {pMeta.label}
                          </span>
                        </div>

                        {milestone && (
                          <span className="text-[10px] font-mono text-indigo-400 truncate max-w-[130px] bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                            {milestone.title}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h5 className="text-xs font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors line-clamp-2 leading-relaxed">
                        {task.title}
                      </h5>

                      {/* Card Footer: Subtasks, Due Date, Hours, Comments, Assignee */}
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1.5 border-t border-slate-800/60">
                        <div className="flex items-center gap-2 flex-wrap">
                          {subtasksTotal > 0 && (
                            <span
                              className={clsx(
                                'flex items-center gap-1 font-mono text-[10px]',
                                subtasksDone === subtasksTotal ? 'text-emerald-400' : 'text-slate-400'
                              )}
                              title="Subtasks completed"
                            >
                              <CheckSquare className="w-3 h-3" />
                              <span>{subtasksDone}/{subtasksTotal}</span>
                            </span>
                          )}

                          {commentsCount > 0 && (
                            <span className="flex items-center gap-1 font-mono text-[10px] text-slate-400" title="Comments">
                              <MessageSquare className="w-3 h-3 text-slate-500" />
                              <span>{commentsCount}</span>
                            </span>
                          )}

                          {task.estimatedHours !== undefined && task.estimatedHours > 0 && (
                            <span className="flex items-center gap-1 font-mono text-[10px] text-slate-400" title="Estimated Hours">
                              <Clock className="w-3 h-3 text-slate-500" />
                              <span>{task.estimatedHours}h</span>
                            </span>
                          )}

                          {task.dueDate && (
                            <span
                              className={clsx(
                                'flex items-center gap-1 font-mono text-[10px]',
                                isOverdue ? 'text-rose-400 font-semibold' : 'text-slate-400'
                              )}
                              title={isOverdue ? 'Overdue' : 'Due date'}
                            >
                              <Calendar className="w-3 h-3" />
                              <span>{task.dueDate.slice(5)}</span>
                            </span>
                          )}
                        </div>

                        {/* Assignee Avatar / Initial */}
                        {task.assignee ? (
                          <div
                            className="w-5 h-5 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-[10px] font-bold flex items-center justify-center uppercase shrink-0"
                            title={task.assignee.displayName || task.assignee.email}
                          >
                            {(task.assignee.displayName || task.assignee.email || 'U').charAt(0)}
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border border-dashed border-slate-700 flex items-center justify-center text-slate-600">
                            <User className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Empty column placeholder */}
                {colTasks.length === 0 && inlineAddingColumn !== col.id && (
                  <div
                    onClick={() => {
                      setInlineAddingColumn(col.id);
                      setQuickTitle('');
                    }}
                    className="p-6 border border-dashed border-slate-800/80 rounded-xl text-center text-slate-500 text-xs hover:border-slate-700 hover:text-slate-400 cursor-pointer transition-colors"
                  >
                    <Plus className="w-4 h-4 mx-auto mb-1 opacity-50" />
                    <span>Drop tasks here or add card</span>
                  </div>
                )}
              </div>

              {/* Bottom Quick Add Trigger */}
              {inlineAddingColumn !== col.id && (
                <div className="p-2 border-t border-slate-800/60">
                  <button
                    type="button"
                    onClick={() => {
                      setInlineAddingColumn(col.id);
                      setQuickTitle('');
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-xl transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Task</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
