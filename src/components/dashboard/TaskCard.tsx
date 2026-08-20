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
  ExternalLink
} from 'lucide-react';
import clsx from 'clsx';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
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
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'high':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'medium':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'low':
      default:
        return 'bg-slate-700/40 text-slate-300 border-slate-600/30';
    }
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'todo':
        return <CircleDot className="w-3 h-3 text-slate-400" />;
      case 'in_progress':
        return <Flame className="w-3 h-3 text-indigo-400" />;
      case 'review':
        return <Eye className="w-3 h-3 text-amber-400" />;
      case 'done':
        return <CheckCircle2 className="w-3 h-3 text-emerald-400" />;
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
      if (task.projectId && task.id) {
        const taskRef = doc(db, 'projects', task.projectId, 'tasks', task.id);
        await updateDoc(taskRef, {
          status: newStatus,
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.warn('Firestore update failed, relying on optimistic state:', err);
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
      if (task.projectId && task.id) {
        const taskRef = doc(db, 'projects', task.projectId, 'tasks', task.id);
        await deleteDoc(taskRef);
      }
    } catch (err) {
      console.warn('Firestore delete failed:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      onClick={() => onOpenDetail && onOpenDetail(task)}
      className={clsx(
        'glass-card rounded-xl p-4 border bg-slate-900/70 transition-all duration-200 group relative cursor-pointer',
        task.optimistic || isUpdating ? 'opacity-75 border-dashed border-indigo-500' : 'border-slate-800/80 hover:border-indigo-500/50 shadow-sm hover:shadow-lg hover:shadow-indigo-500/10'
      )}
    >
      {/* Card Header: Category/Status & Priority Badge */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/60 text-[11px] font-mono text-slate-300">
          {getStatusIcon(task.status)}
          <span className="capitalize">{task.status.replace('_', ' ')}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className={clsx('text-[10px] font-semibold px-2 py-0.5 rounded border capitalize', getPriorityStyle(task.priority))}>
            {task.priority}
          </span>
          <button
            onClick={handleDeleteTask}
            disabled={isDeleting}
            title="Delete task"
            className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-slate-800/80 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Task Title & Description */}
      <h4 className="text-sm font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors leading-snug flex items-center justify-between gap-2">
        <span>{task.title}</span>
        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-70 text-indigo-400 flex-shrink-0 transition-opacity" />
      </h4>
      {task.description && (
        <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Subtask Progress Bar */}
      {totalSubtasks > 0 && (
        <div className="mt-3 pt-2.5 border-t border-slate-800/60 space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 text-slate-400 font-mono">
              <ListChecks className="w-3.5 h-3.5 text-indigo-400" />
              <span>{completedSubtasks}/{totalSubtasks} subtasks done</span>
            </div>
            <span className="text-[10px] font-semibold text-slate-400 font-mono">
              {subtaskProgress}%
            </span>
          </div>
          <div className="w-full bg-slate-800/90 h-1.5 rounded-full overflow-hidden">
            <div 
              className={clsx(
                "h-full rounded-full transition-all duration-300",
                completedSubtasks === totalSubtasks ? "bg-emerald-400" : "bg-gradient-to-r from-indigo-500 to-violet-500"
              )}
              style={{ width: `${subtaskProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer Info: Assignee, Due Date & Navigation controls */}
      <div className="mt-3.5 pt-2.5 border-t border-slate-800/70 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-slate-400">
          {task.assigneeId ? (
            <div className="flex items-center gap-1 text-[11px] bg-slate-800/60 px-2 py-0.5 rounded border border-slate-700/40 text-slate-300">
              <User className="w-3 h-3 text-indigo-400" />
              <span className="truncate max-w-[80px]">{task.assigneeId}</span>
            </div>
          ) : task.assignedAgent ? (
            <div className="flex items-center gap-1 text-[11px] bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-500/30 text-indigo-300">
              <Bot className="w-3 h-3 text-indigo-400" />
              <span>{task.assignedAgent}</span>
            </div>
          ) : null}

          {task.dueDate && (
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <Calendar className="w-3 h-3 text-slate-500" />
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
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          )}

          {nextStatus && (
            <button
              onClick={(e) => handleUpdateStatus(e, nextStatus)}
              disabled={isUpdating}
              title={`Move to ${nextStatus.replace('_', ' ')}`}
              className="p-1 rounded bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/30 text-indigo-300 hover:text-white transition flex items-center gap-1 px-1.5 text-[11px]"
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
