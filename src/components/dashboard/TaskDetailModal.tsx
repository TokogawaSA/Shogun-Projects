import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  Circle, 
  Plus, 
  Trash2, 
  Calendar, 
  User, 
  Bot, 
  ListChecks, 
  Clock, 
  Tag
} from 'lucide-react';
import clsx from 'clsx';
import { apiClient } from '../../services/api';
import { Task, SubTask, TaskPriority, TaskStatus } from '../../types';

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateTask?: (updatedTask: Task) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  isOpen,
  onClose,
  onUpdateTask,
}) => {
  const [currentTask, setCurrentTask] = useState<Task | null>(task);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newSubtaskAssignee, setNewSubtaskAssignee] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setCurrentTask(task);
    setNewSubtaskTitle('');
    setNewSubtaskAssignee('');
  }, [task]);

  if (!isOpen || !currentTask) return null;

  const subtasks: SubTask[] = currentTask.subtasks || [];
  const completedCount = subtasks.filter((s) => s.completed).length;
  const totalCount = subtasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

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

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'todo':
        return 'bg-slate-800 text-slate-400 border-slate-700';
      case 'in_progress':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'review':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'done':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  };

  const saveSubtasks = async (updatedSubtasks: SubTask[]) => {
    const updatedCompleted = updatedSubtasks.filter((s) => s.completed).length;
    const calculatedProgress = updatedSubtasks.length > 0 
      ? Math.round((updatedCompleted / updatedSubtasks.length) * 100) 
      : currentTask.progress;

    const updated = {
      ...currentTask,
      subtasks: updatedSubtasks,
      progress: calculatedProgress,
      updatedAt: new Date().toISOString(),
    };

    setCurrentTask(updated);
    if (onUpdateTask) {
      onUpdateTask(updated);
    }

    try {
      if (currentTask.id) {
        await apiClient.put(`/projects/tasks/${currentTask.id}`, {
          subtasks: updatedSubtasks,
          progress: calculatedProgress,
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.warn('Subtask update error, relying on optimistic state:', err);
    }
  };

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim() || isSubmitting) return;
    setIsSubmitting(true);

    const newSubtask: SubTask = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: newSubtaskTitle.trim(),
      completed: false,
      assigneeId: newSubtaskAssignee.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    const updatedSubtasks = [...subtasks, newSubtask];
    await saveSubtasks(updatedSubtasks);

    setNewSubtaskTitle('');
    setNewSubtaskAssignee('');
    setIsSubmitting(false);
  };

  const handleToggleSubtask = async (subtaskId: string) => {
    const updatedSubtasks = subtasks.map((st) =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );
    await saveSubtasks(updatedSubtasks);
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    const updatedSubtasks = subtasks.filter((st) => st.id !== subtaskId);
    await saveSubtasks(updatedSubtasks);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-700 bg-slate-900 flex items-start justify-between gap-4">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={clsx('text-[11px] font-semibold px-2.5 py-0.5 rounded-full border capitalize font-mono', getStatusBadge(currentTask.status))}>
                {currentTask.status.replace('_', ' ')}
              </span>
              <span className={clsx('text-[11px] font-semibold px-2.5 py-0.5 rounded-full border capitalize', getPriorityStyle(currentTask.priority))}>
                {currentTask.priority} priority
              </span>
              {currentTask.category && (
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
                  <Tag className="w-3 h-3 text-indigo-600" />
                  {currentTask.category}
                </span>
              )}
            </div>
            <h3 className="text-xl font-bold text-slate-100 tracking-tight leading-snug">
              {currentTask.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Description */}
          {currentTask.description ? (
            <div className="space-y-1.5">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Description</h4>
              <p className="text-sm text-slate-300 leading-relaxed bg-slate-800/60 p-3.5 rounded-xl border border-slate-700">
                {currentTask.description}
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No description provided for this task.</p>
          )}

          {/* Meta Info Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Assignee / Agent</span>
              <div className="flex items-center gap-1.5 mt-1 text-xs font-medium text-slate-100 truncate">
                {currentTask.assignedAgent ? (
                  <>
                    <Bot className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                    <span>{currentTask.assignedAgent}</span>
                  </>
                ) : currentTask.assigneeId ? (
                  <>
                    <User className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                    <span className="truncate">{currentTask.assigneeId}</span>
                  </>
                ) : (
                  <span className="text-slate-400">Unassigned</span>
                )}
              </div>
            </div>

            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Due Date</span>
              <div className="flex items-center gap-1.5 mt-1 text-xs font-medium text-slate-100">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <span>{currentTask.dueDate || 'No due date'}</span>
              </div>
            </div>

            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Created</span>
              <div className="flex items-center gap-1.5 mt-1 text-xs font-medium text-slate-100">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{currentTask.createdAt ? new Date(currentTask.createdAt).toLocaleDateString() : 'N/A'}</span>
              </div>
            </div>

            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Subtasks Done</span>
              <div className="flex items-center gap-1.5 mt-1 text-xs font-bold text-indigo-700 font-mono">
                <ListChecks className="w-3.5 h-3.5 text-indigo-600" />
                <span>{totalCount > 0 ? `${completedCount}/${totalCount} (${progressPercent}%)` : 'None'}</span>
              </div>
            </div>
          </div>

          {/* Subtasks Section */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <ListChecks className="w-3.5 h-3.5" />
                </div>
                <h4 className="text-sm font-bold text-slate-100">Subtask Checklist</h4>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono border border-slate-700">
                  {completedCount}/{totalCount} done
                </span>
              </div>
              {totalCount > 0 && (
                <span className="text-xs font-semibold text-indigo-600 font-mono">
                  {progressPercent}%
                </span>
              )}
            </div>

            {/* Progress Bar */}
            {totalCount > 0 && (
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className={clsx(
                    "h-full transition-all duration-300 rounded-full",
                    progressPercent === 100 ? "bg-emerald-500" : "bg-gradient-to-r from-indigo-500 to-violet-600"
                  )}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            )}

            {/* Subtasks List */}
            <div className="space-y-2">
              {subtasks.length === 0 ? (
                <div className="text-center py-6 px-4 rounded-xl border border-dashed border-slate-700 bg-slate-800/40 text-slate-400 text-xs">
                  No subtasks created yet. Add subtasks below to track granular execution steps.
                </div>
              ) : (
                subtasks.map((st) => (
                  <div
                    key={st.id}
                    className={clsx(
                      'flex items-center justify-between gap-3 p-3 rounded-xl border transition-all duration-150',
                      st.completed
                        ? 'bg-slate-800/40 border-slate-700 text-slate-400'
                        : 'bg-slate-800/70 border-slate-700 text-slate-100 hover:border-indigo-400'
                    )}
                  >
                    <div 
                      onClick={() => handleToggleSubtask(st.id)}
                      className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                    >
                      <button 
                        type="button"
                        className={clsx(
                          'w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-colors',
                          st.completed 
                            ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' 
                            : 'text-slate-400 hover:text-indigo-600 border border-slate-600 bg-white'
                        )}
                      >
                        {st.completed ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-3.5 h-3.5" />}
                      </button>
                      <span className={clsx('text-xs font-medium truncate', st.completed && 'line-through text-slate-400')}>
                        {st.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {st.assigneeId && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400 flex items-center gap-1">
                          <User className="w-2.5 h-2.5 text-indigo-600" />
                          {st.assigneeId}
                        </span>
                      )}
                      <button
                        onClick={() => handleDeleteSubtask(st.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-slate-800 transition"
                        title="Delete subtask"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add Subtask Form */}
            <form onSubmit={handleAddSubtask} className="pt-2 flex flex-col sm:flex-row gap-2">
              <div className="flex-1">
                <input
                  type="text"
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  placeholder="Add a new subtask (e.g., 'Verify PHP unit tests')..."
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
              <div className="w-full sm:w-36">
                <input
                  type="text"
                  value={newSubtaskAssignee}
                  onChange={(e) => setNewSubtaskAssignee(e.target.value)}
                  placeholder="Assignee (opt)"
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting || !newSubtaskTitle.trim()}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-sm shadow-indigo-600/20 flex-shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Subtask</span>
              </button>
            </form>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-700 bg-slate-900 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-mono">ID: {currentTask.id}</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailModal;
