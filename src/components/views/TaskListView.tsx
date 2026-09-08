import React, { useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Network,
  Repeat,
  Bot,
  User,
  ListChecks,
  Paperclip,
  Tag,
  CheckSquare,
  Square,
} from 'lucide-react';
import { Task, TaskStatus, TaskPriority } from '../../types';
import { TaskGroupBucket } from '../../types/views';

interface TaskListViewProps {
  groupedBuckets: TaskGroupBucket<Task>[];
  onSelectTask: (task: Task) => void;
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
}

export const TaskListView: React.FC<TaskListViewProps> = ({
  groupedBuckets,
  onSelectTask,
  onStatusChange,
}) => {
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const toggleRow = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedRows((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950/60 text-rose-300 border border-rose-800/60">URGENT</span>;
      case 'high':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-orange-950/60 text-orange-300 border border-orange-800/60">HIGH</span>;
      case 'medium':
        return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-950/60 text-blue-300 border border-blue-800/60">MEDIUM</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-400">LOW</span>;
    }
  };

  return (
    <div className="space-y-6 text-xs select-none">
      {groupedBuckets.map((bucket) => {
        if (bucket.items.length === 0) return null;

        // Group root tasks vs subtasks
        const rootTasks = bucket.items.filter((t) => !t.parentTaskId);

        return (
          <div
            key={bucket.id}
            className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-lg backdrop-blur-md"
          >
            {/* Group Header */}
            <div className="p-3 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: bucket.colorHex || '#6366f1' }}
                />
                <span className="font-bold text-slate-200 text-xs uppercase tracking-wider">
                  {bucket.title}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-800 text-slate-400">
                  {bucket.count}
                </span>
              </div>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-slate-950/40 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800/40">
              <div className="col-span-5">Task Title & Subtasks</div>
              <div className="col-span-2 text-center">Status</div>
              <div className="col-span-2 text-center">Priority</div>
              <div className="col-span-2 text-center">Assignees</div>
              <div className="col-span-1 text-right">Due Date</div>
            </div>

            {/* Task Rows */}
            <div className="divide-y divide-slate-800/40">
              {rootTasks.map((task) => {
                const subtasks = bucket.items.filter((t) => t.parentTaskId === task.id);
                const hasSubtasks = subtasks.length > 0 || (task.subtasks && task.subtasks.length > 0);
                const isExpanded = expandedRows[task.id] ?? false;

                return (
                  <React.Fragment key={task.id}>
                    {/* Root Task Row */}
                    <div
                      onClick={() => onSelectTask(task)}
                      className="grid grid-cols-12 gap-2 items-center px-4 py-2.5 hover:bg-slate-800/40 cursor-pointer transition group"
                    >
                      {/* Title & Chevron */}
                      <div className="col-span-5 flex items-center gap-2 min-w-0">
                        {hasSubtasks ? (
                          <button
                            type="button"
                            onClick={(e) => toggleRow(task.id, e)}
                            className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5" />
                            )}
                          </button>
                        ) : (
                          <div className="w-5" />
                        )}

                        <span className="font-mono text-[10px] text-slate-500">{task.id}</span>

                        <span className="font-medium text-slate-200 truncate group-hover:text-indigo-300 transition">
                          {task.title}
                        </span>

                        {hasSubtasks && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 font-mono flex items-center gap-1">
                            <ListChecks className="w-3 h-3" />
                            {subtasks.length || task.subtasks?.length}
                          </span>
                        )}

                        {/* Attached Files & Custom Fields badges on root task */}
                        {task.attachments && task.attachments.length > 0 && (
                          <span
                            className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-mono flex items-center gap-1"
                            title={`${task.attachments.length} attachment(s)`}
                          >
                            <Paperclip className="w-2.5 h-2.5" />
                            {task.attachments.length}
                          </span>
                        )}

                        {task.customFields && Object.keys(task.customFields).filter(k => k !== 'attachments').length > 0 && (
                          <span
                            className="px-1.5 py-0.5 rounded text-[10px] bg-purple-500/10 text-purple-300 border border-purple-500/20 font-mono hidden xl:flex items-center gap-1"
                            title={`${Object.keys(task.customFields).filter(k => k !== 'attachments').length} custom field(s)`}
                          >
                            <Tag className="w-2.5 h-2.5" />
                            {Object.keys(task.customFields).filter(k => k !== 'attachments').length}
                          </span>
                        )}

                        {task.dependencies && task.dependencies.length > 0 && (
                          <Network className="w-3 h-3 text-purple-400 flex-shrink-0" />
                        )}

                        {task.isRecurring && (
                          <Repeat className="w-3 h-3 text-purple-400 flex-shrink-0" />
                        )}
                      </div>

                      {/* Status */}
                      <div className="col-span-2 flex justify-center">
                        <select
                          value={task.status}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) =>
                            onStatusChange && onStatusChange(task.id, e.target.value as TaskStatus)
                          }
                          className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-0.5 text-[11px] font-semibold text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
                        >
                          <option value="todo">To Do</option>
                          <option value="in_progress">In Progress</option>
                          <option value="review">In Review</option>
                          <option value="done">Complete</option>
                        </select>
                      </div>

                      {/* Priority */}
                      <div className="col-span-2 flex justify-center">
                        {getPriorityBadge(task.priority)}
                      </div>

                      {/* Assignees */}
                      <div className="col-span-2 flex justify-center items-center gap-1 min-w-0">
                        {task.assignees && task.assignees.length > 0 ? (
                          task.assignees.slice(0, 2).map((a) => (
                            <span
                              key={a.userId}
                              className="w-6 h-6 rounded-full bg-indigo-900/60 border border-indigo-700 flex items-center justify-center text-[10px] font-bold text-indigo-200"
                              title={a.displayName}
                            >
                              {a.userId.startsWith('usr-agent') ? (
                                <Bot className="w-3 h-3 text-purple-300" />
                              ) : (
                                a.displayName.substring(0, 2).toUpperCase()
                              )}
                            </span>
                          ))
                        ) : task.assigneeId ? (
                          <span className="w-6 h-6 rounded-full bg-indigo-900/60 border border-indigo-700 flex items-center justify-center text-[10px] font-bold text-indigo-200">
                            <User className="w-3 h-3" />
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-600">—</span>
                        )}
                      </div>

                      {/* Due Date */}
                      <div className="col-span-1 text-right text-[11px] font-mono text-slate-400">
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}
                      </div>
                    </div>

                    {/* Subtask Rows */}
                    {isExpanded && (
                      <div className="bg-slate-950/30 divide-y divide-slate-800/30">
                        {/* Recursive Task Children */}
                        {subtasks.map((subtask) => (
                          <div
                            key={subtask.id}
                            onClick={() => onSelectTask(subtask)}
                            className="grid grid-cols-12 gap-2 items-center px-4 py-2 bg-slate-950/40 hover:bg-slate-800/30 cursor-pointer transition pl-10 border-l-2 border-indigo-500/40 ml-4"
                          >
                            <div className="col-span-5 flex items-center gap-2 min-w-0">
                              <span className="text-[10px] font-mono text-slate-500">{subtask.id}</span>
                              <span className="font-medium text-slate-300 truncate">{subtask.title}</span>
                              {subtask.attachments && subtask.attachments.length > 0 && (
                                <span className="text-[10px] text-indigo-400 flex items-center gap-0.5">
                                  <Paperclip className="w-2.5 h-2.5" />
                                  {subtask.attachments.length}
                                </span>
                              )}
                              {subtask.customFields && Object.keys(subtask.customFields).filter(k => k !== 'attachments').length > 0 && (
                                <span className="text-[10px] text-purple-400 flex items-center gap-0.5">
                                  <Tag className="w-2.5 h-2.5" />
                                  {Object.keys(subtask.customFields).filter(k => k !== 'attachments').length}
                                </span>
                              )}
                            </div>

                            <div className="col-span-2 flex justify-center">
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400">
                                {subtask.status}
                              </span>
                            </div>

                            <div className="col-span-2 flex justify-center">
                              {getPriorityBadge(subtask.priority)}
                            </div>

                            <div className="col-span-2 flex justify-center text-[11px] text-slate-500">
                              {subtask.assigneeId || '—'}
                            </div>

                            <div className="col-span-1 text-right text-[11px] font-mono text-slate-400">
                              {subtask.dueDate ? new Date(subtask.dueDate).toLocaleDateString() : '—'}
                            </div>
                          </div>
                        ))}

                        {/* Checklist Subtasks */}
                        {task.subtasks && task.subtasks.map((chk) => (
                          <div
                            key={chk.id}
                            onClick={() => onSelectTask(task)}
                            className="grid grid-cols-12 gap-2 items-center px-4 py-2 bg-slate-950/20 hover:bg-slate-800/20 cursor-pointer transition pl-10 border-l-2 border-emerald-500/40 ml-4"
                          >
                            <div className="col-span-5 flex items-center gap-2 min-w-0">
                              {chk.completed ? (
                                <CheckSquare className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                              ) : (
                                <Square className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                              )}
                              <span className={`text-xs truncate ${chk.completed ? 'line-through text-slate-500' : 'text-slate-300'}`}>
                                {chk.title}
                              </span>
                              {chk.description && (
                                <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-400">
                                  Desc
                                </span>
                              )}
                              {chk.attachments && chk.attachments.length > 0 && (
                                <span className="text-[10px] text-indigo-400 flex items-center gap-0.5">
                                  <Paperclip className="w-2.5 h-2.5" />
                                  {chk.attachments.length}
                                </span>
                              )}
                              {chk.customFields && Object.keys(chk.customFields).filter(k => k !== 'attachments').length > 0 && (
                                <span className="text-[10px] text-purple-400 flex items-center gap-0.5">
                                  <Tag className="w-2.5 h-2.5" />
                                  {Object.keys(chk.customFields).filter(k => k !== 'attachments').length}
                                </span>
                              )}
                            </div>

                            <div className="col-span-2 flex justify-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${chk.completed ? 'bg-emerald-950/60 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                                {chk.completed ? 'Completed' : 'Checklist'}
                              </span>
                            </div>

                            <div className="col-span-2 flex justify-center">
                              {chk.priority ? getPriorityBadge(chk.priority) : <span className="text-[10px] text-slate-600">—</span>}
                            </div>

                            <div className="col-span-2 flex justify-center text-[11px] text-slate-500">
                              {chk.assigneeId || '—'}
                            </div>

                            <div className="col-span-1 text-right text-[11px] font-mono text-slate-400">
                              {chk.dueDate ? new Date(chk.dueDate).toLocaleDateString() : '—'}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
