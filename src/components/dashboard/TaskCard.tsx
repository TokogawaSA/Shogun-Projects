import React, { useState } from 'react';
import { 
  Bot, 
  ArrowRight, 
  ArrowLeft, 
  Calendar, 
  Trash2, 
  User, 
  CheckCircle2, 
  CircleDot, 
  Flame, 
  Eye, 
  ListChecks, 
  ExternalLink,
  Clock,
  Layers
} from 'lucide-react';
import clsx from 'clsx';
import { apiClient } from '../../services/api';
import { Task, TaskStatus, TaskPriority } from '../../types';

interface TaskCardProps {
  task: Task;
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
  onDelete?: (taskId: string) => void;
  onOpenDetail?: (task: Task) => void;
}

const statusOrder: TaskStatus[] = ['todo', 'in_progress', 'review', 'done'];

export const TaskCard: React.FC<TaskCardProps> = ({ task, onStatusChange, onDelete, onOpenDetail }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const currentIndex = statusOrder.indexOf(task.status);
  const prevStatus = currentIndex > 0 ? statusOrder[currentIndex - 1] : null;
  const nextStatus = currentIndex < statusOrder.length - 1 ? statusOrder[currentIndex + 1] : null;

  const subtasks = task.subtasks || [];
  const totalSubtasks = subtasks.length;
  const completedSubtasks = subtasks.filter((s) => s.completed).length;
  const subtaskProgress = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  const getPriorityStyle = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'high':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'medium':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'low':
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'todo':
        return <CircleDot className="w-3 h-3 text-slate-400" />;
      case 'in_progress':
        return <Flame className="w-3 h-3 text-indigo-600" />;
      case 'review':
        return <Eye className="w-3 h-3 text-amber-600" />;
      case 'done':
        return <CheckCircle2 className="w-3 h-3 text-emerald-600" />;
    }
  };

  const handleUpdateStatus = async (e: React.MouseEvent, newStatus: TaskStatus) => {
    e.stopPropagation();
    if (isUpdating) return;
    setIsUpdating(true);

    if (onStatusChange) {
      onStatusChange(task.id, newStatus);
    }

    try {
      if (task.id) {
        await apiClient.put(`/projects/tasks/${task.id}`, {
          status: newStatus,
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.warn('Task status update error, relying on optimistic state:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteTask = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDeleting) return;
    if (!window.confirm(`Are you sure you want to delete "${task.title}"?`)) return;

    setIsDeleting(true);
    if (onDelete) {
      onDelete(task.id);
    }

    try {
      if (task.id) {
        await apiClient.delete(`/projects/tasks/${task.id}`);
      }
    } catch (err) {
      console.warn('Task delete error:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      onClick={() => onOpenDetail && onOpenDetail(task)}
      className={clsx(
        'glass-card rounded-xl p-4 border bg-slate-900 shadow-sm transition-all duration-200 group relative cursor-pointer',
        task.optimistic || isUpdating ? 'opacity-75 border-dashed border-indigo-500' : 'border-slate-700 hover:border-indigo-400 hover:shadow-md'
      )}
    >
      {/* Card Header: Category/Status & Priority Badge */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-[11px] font-mono text-slate-300">
          {getStatusIcon(task.status)}
          <span className="capitalize">{task.status.replace('_', ' ')}</span>
        </div>

        <div className="flex items-center gap-2">
          {task.parentTaskId && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              Sub-task
            </span>
          )}
          {task.lineItemId && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 flex items-center gap-1">
              <Layers className="w-2.5 h-2.5" /> Scope
            </span>
          )}
          <span className={clsx('text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize', getPriorityStyle(task.priority))}>
            {task.priority}
          </span>
          <button
            onClick={handleDeleteTask}
            disabled={isDeleting}
            title="Delete task"
            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-slate-800 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Task Title & Description */}
      <h4 className="text-sm font-semibold text-slate-100 group-hover:text-indigo-600 transition-colors leading-snug flex items-center justify-between gap-2">
        <span>{task.title}</span>
        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-70 text-indigo-500 flex-shrink-0 transition-opacity" />
      </h4>
      {task.description && (
        <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Subtask Progress Bar */}
      {totalSubtasks > 0 && (
        <div className="mt-3 pt-2.5 border-t border-slate-700 space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 text-slate-400 font-mono">
              <ListChecks className="w-3.5 h-3.5 text-indigo-600" />
              <span>{completedSubtasks}/{totalSubtasks} subtasks done</span>
            </div>
            <span className="text-[10px] font-semibold text-slate-400 font-mono">
              {subtaskProgress}%
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className={clsx(
                "h-full rounded-full transition-all duration-300",
                completedSubtasks === totalSubtasks ? "bg-emerald-500" : "bg-gradient-to-r from-indigo-500 to-violet-600"
              )}
              style={{ width: `${subtaskProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Time Tracking Progress Indicator */}
      {((task.actualHours || 0) > 0 || (task.estimatedHours || 0) > 0) && (
        <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-indigo-400" />
            <span>Time:</span>
          </div>
          <div>
            <span className={((task.actualHours || 0) > (task.estimatedHours || 0)) && (task.estimatedHours || 0) > 0 ? "text-rose-400 font-bold" : "text-slate-200"}>
              {task.actualHours || 0}h
            </span>
            {(task.estimatedHours || 0) > 0 && (
              <span className="text-slate-500"> / {task.estimatedHours}h</span>
            )}
          </div>
        </div>
      )}

      {/* Footer Info: Assignee, Due Date & Navigation controls */}
      <div className="mt-3.5 pt-2.5 border-t border-slate-700 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-slate-400">
          {task.assigneeId ? (
            <div className="flex items-center gap-1 text-[11px] bg-slate-800 px-2 py-0.5 rounded border border-slate-700 text-slate-300">
              <User className="w-3 h-3 text-indigo-600" />
              <span className="truncate max-w-[80px]">{task.assigneeId}</span>
            </div>
          ) : task.assignedAgent ? (
            <div className="flex items-center gap-1 text-[11px] bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 text-indigo-700 font-medium">
              <Bot className="w-3 h-3 text-indigo-600" />
              <span>{task.assignedAgent}</span>
            </div>
          ) : null}

          {task.dueDate && (
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>{task.dueDate}</span>
            </div>
          )}
        </div>

        {/* Transition Controls */}
        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
          {prevStatus && (
            <button
              onClick={(e) => handleUpdateStatus(e, prevStatus)}
              disabled={isUpdating}
              title={`Move to ${prevStatus.replace('_', ' ')}`}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          )}

          {nextStatus && (
            <button
              onClick={(e) => handleUpdateStatus(e, nextStatus)}
              disabled={isUpdating}
              title={`Move to ${nextStatus.replace('_', ' ')}`}
              className="p-1 rounded bg-indigo-50 hover:bg-indigo-600 border border-indigo-200 text-indigo-700 hover:text-white transition flex items-center gap-1 px-2 text-[11px] font-semibold"
            >
              <span>Next</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
