import React, { useState, useMemo } from 'react';
import { 
  Search, 
  X, 
  Calendar, 
  CheckSquare, 
  CheckCircle2, 
  Trash2, 
  Plus,
  MessageSquare
} from 'lucide-react';
import clsx from 'clsx';
import { Task, TaskPriority, TaskStatusColumn, Milestone } from '../types';

interface ProjectTaskListProps {
  tasks: Task[];
  columns: TaskStatusColumn[];
  milestones: Milestone[];
  onOpenTask: (task: Task) => void;
  onUpdateStatus: (taskId: string, newStatus: string) => Promise<void>;
  onUpdatePriority: (taskId: string, newPriority: TaskPriority) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onOpenCreateModal: () => void;
}

const PRIORITY_META = {
  urgent: { label: 'Urgent', bg: 'bg-red-500/15 text-red-400 border-red-500/30' },
  high: { label: 'High', bg: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  medium: { label: 'Medium', bg: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  low: { label: 'Low', bg: 'bg-slate-500/15 text-slate-400 border-slate-500/30' },
};

export const ProjectTaskList: React.FC<ProjectTaskListProps> = ({
  tasks,
  columns,
  milestones,
  onOpenTask,
  onUpdateStatus,
  onUpdatePriority,
  onDeleteTask,
  onOpenCreateModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchesSearch =
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.assignee?.displayName && t.assignee.displayName.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
      return true;
    });
  }, [tasks, searchQuery, statusFilter, priorityFilter]);

  return (
    <div className="space-y-4">
      {/* Search and Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800/80 p-2.5 rounded-2xl backdrop-blur-xl shadow-lg">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tasks by title, description, or assignee..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-7 py-1.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/60"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2">
          {/* Status Column Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950/80 border border-slate-800 text-xs text-slate-300 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Columns ({tasks.length})</option>
            {columns.map((col) => {
              const count = tasks.filter((t) => (t.status || 'todo') === col.id).length;
              return (
                <option key={col.id} value={col.id}>
                  {col.name} ({count})
                </option>
              );
            })}
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-slate-950/80 border border-slate-800 text-xs text-slate-300 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-600/30 transition-all shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* High-Density Task Table */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl backdrop-blur-xl">
        {filteredTasks.length === 0 ? (
          <div className="py-16 px-4 text-center space-y-3">
            <CheckCircle2 className="w-8 h-8 text-slate-600 mx-auto" />
            <h4 className="text-sm font-semibold text-slate-300">No tasks found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all'
                ? 'No tasks matched your active search and filter options.'
                : 'Get started by creating your first task in this workspace.'}
            </p>
            <button
              onClick={onOpenCreateModal}
              className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Task</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800/80 bg-slate-950/60 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4 w-36">Status</th>
                  <th className="py-3 px-4">Task Summary</th>
                  <th className="py-3 px-4 w-28">Priority</th>
                  <th className="py-3 px-4 w-36">Assignee</th>
                  <th className="py-3 px-4 w-28">Due Date</th>
                  <th className="py-3 px-4 w-20 text-center">Subtasks</th>
                  <th className="py-3 px-4 w-16 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredTasks.map((task) => {
                  const pMeta = PRIORITY_META[task.priority || 'medium'];
                  const milestone = milestones.find((m) => m.id === task.milestoneId);
                  const subtasksTotal = task.subtasks?.length || 0;
                  const subtasksDone = task.subtasks?.filter((s) => s.completed).length || 0;
                  const isDone = task.status === 'done';
                  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !isDone;
                  const commentsCount = task.comments?.length || 0;

                  return (
                    <tr
                      key={task.id}
                      onClick={() => onOpenTask(task)}
                      className={clsx(
                        'group hover:bg-slate-800/40 cursor-pointer transition-colors',
                        isDone && 'opacity-60'
                      )}
                    >
                      {/* Status Dropdown */}
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={task.status}
                          onChange={(e) => onUpdateStatus(task.id, e.target.value)}
                          className="bg-slate-950/90 border border-slate-800 text-[11px] text-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:border-indigo-500 font-medium"
                        >
                          {columns.map((col) => (
                            <option key={col.id} value={col.id}>
                              {col.name}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Title & Tags */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          {task.issueType && task.issueType !== 'task' && (
                            <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-mono font-semibold">
                              {task.issueType === 'bug' ? '🐞 Bug' : task.issueType === 'feature' ? '✨ Feat' : task.issueType}
                            </span>
                          )}
                          <span
                            className={clsx(
                              'font-medium transition-colors group-hover:text-indigo-300',
                              isDone ? 'line-through text-slate-500' : 'text-slate-100'
                            )}
                          >
                            {task.title}
                          </span>
                          {milestone && (
                            <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-mono text-indigo-400 shrink-0">
                              {milestone.title}
                            </span>
                          )}
                          {commentsCount > 0 && (
                            <span className="flex items-center gap-1 font-mono text-[10px] text-slate-400 bg-slate-800/80 px-1 py-0.2 rounded" title="Comments">
                              <MessageSquare className="w-2.5 h-2.5 text-slate-500" />
                              <span>{commentsCount}</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Priority Dropdown */}
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={task.priority || 'medium'}
                          onChange={(e) => onUpdatePriority(task.id, e.target.value as TaskPriority)}
                          className={clsx(
                            'text-[10px] font-semibold uppercase tracking-wider rounded-md px-1.5 py-0.5 border bg-transparent focus:outline-none',
                            pMeta.bg
                          )}
                        >
                          <option value="low" className="bg-slate-900 text-slate-200">Low</option>
                          <option value="medium" className="bg-slate-900 text-blue-300">Medium</option>
                          <option value="high" className="bg-slate-900 text-amber-300">High</option>
                          <option value="urgent" className="bg-slate-900 text-red-300">Urgent</option>
                        </select>
                      </td>

                      {/* Assignee */}
                      <td className="py-3 px-4">
                        {task.assignee ? (
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[10px] font-bold flex items-center justify-center uppercase shrink-0">
                              {(task.assignee.displayName || task.assignee.email).charAt(0)}
                            </div>
                            <span className="truncate max-w-[100px] text-slate-300 text-[11px]">
                              {task.assignee.displayName || task.assignee.email}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-600 font-mono text-[11px]">—</span>
                        )}
                      </td>

                      {/* Due Date */}
                      <td className="py-3 px-4">
                        {task.dueDate ? (
                          <span
                            className={clsx(
                              'font-mono text-[11px] flex items-center gap-1',
                              isOverdue ? 'text-rose-400 font-semibold' : 'text-slate-400'
                            )}
                          >
                            <Calendar className="w-3 h-3 text-slate-500" />
                            {task.dueDate}
                          </span>
                        ) : (
                          <span className="text-slate-600 font-mono text-[11px]">—</span>
                        )}
                      </td>

                      {/* Subtasks */}
                      <td className="py-3 px-4 text-center">
                        {subtasksTotal > 0 ? (
                          <span
                            className={clsx(
                              'inline-flex items-center gap-1 font-mono text-[10px] px-1.5 py-0.5 rounded',
                              subtasksDone === subtasksTotal
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-slate-800 text-slate-400'
                            )}
                          >
                            <CheckSquare className="w-3 h-3" />
                            <span>{subtasksDone}/{subtasksTotal}</span>
                          </span>
                        ) : (
                          <span className="text-slate-600 font-mono text-[11px]">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete task "${task.title}"?`)) {
                              onDeleteTask(task.id);
                            }
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-all"
                          title="Delete task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
