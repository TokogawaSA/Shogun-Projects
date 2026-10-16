import React, { useState } from 'react';
import { 
  Plus, 
  Calendar, 
  Layers, 
  Trash2, 
  X, 
  Loader2, 
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import clsx from 'clsx';
import { Milestone, Task } from '../types';

interface ProjectMilestonesProps {
  projectId: string;
  milestones: Milestone[];
  tasks: Task[];
  onCreateMilestone: (milestone: Partial<Milestone>) => Promise<void>;
  onUpdateMilestone: (milestoneId: string, updates: Partial<Milestone>) => Promise<void>;
  onDeleteMilestone: (milestoneId: string) => Promise<void>;
  onOpenTask: (task: Task) => void;
}

export const ProjectMilestones: React.FC<ProjectMilestonesProps> = ({
  projectId,
  milestones,
  tasks,
  onCreateMilestone,
  onUpdateMilestone,
  onDeleteMilestone,
  onOpenTask,
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedMilestoneId, setExpandedMilestoneId] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsSubmitting(true);
    try {
      await onCreateMilestone({
        projectId,
        title: newTitle.trim(),
        description: newDescription.trim(),
        dueDate: newDueDate || undefined,
        status: 'pending',
      });
      setNewTitle('');
      setNewDescription('');
      setNewDueDate('');
      setIsCreateModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleCompleted = async (m: Milestone) => {
    const newStatus = m.status === 'completed' ? 'pending' : 'completed';
    await onUpdateMilestone(m.id, {
      status: newStatus,
      completionPercentage: newStatus === 'completed' ? 100 : 0,
    });
  };

  return (
    <div className="space-y-5">
      {/* Header Toolbar */}
      <div className="flex items-center justify-between gap-3 bg-slate-900/80 border border-slate-800/80 p-3 rounded-2xl backdrop-blur-xl shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">Milestone Gates</h3>
            <p className="text-[11px] text-slate-400">Track key delivery gates and completion criteria</p>
          </div>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-600/30 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Milestone</span>
        </button>
      </div>

      {/* Milestones Cards Grid */}
      {milestones.length === 0 ? (
        <div className="py-16 px-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl text-center space-y-3 backdrop-blur-xl">
          <Layers className="w-8 h-8 text-slate-600 mx-auto" />
          <h4 className="text-sm font-semibold text-slate-300">No milestones yet</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Milestones help you track phase sign-offs, customer release gates, or critical deliverables.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Milestone</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {milestones.map((m) => {
            const linkedTasks = tasks.filter((t) => t.milestoneId === m.id);
            const completedLinked = linkedTasks.filter((t) => t.status === 'done');
            const calculatedPercent =
              linkedTasks.length > 0
                ? Math.round((completedLinked.length / linkedTasks.length) * 100)
                : m.status === 'completed'
                ? 100
                : m.completionPercentage || 0;

            const isDone = m.status === 'completed';
            const isExpanded = expandedMilestoneId === m.id;
            const isOverdue = m.dueDate && new Date(m.dueDate) < new Date() && !isDone;

            return (
              <div
                key={m.id}
                className={clsx(
                  'bg-slate-900/80 border rounded-2xl overflow-hidden shadow-lg backdrop-blur-xl transition-all duration-150',
                  isDone ? 'border-emerald-500/30' : 'border-slate-800/80 hover:border-slate-700'
                )}
              >
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left: Checkmark + Title + Due Date */}
                  <div className="flex items-start gap-3.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => handleToggleCompleted(m)}
                      className={clsx(
                        'w-7 h-7 rounded-xl border flex items-center justify-center shrink-0 transition-colors mt-0.5',
                        isDone
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                          : 'bg-slate-950/80 border-slate-700 hover:border-slate-500 text-slate-500'
                      )}
                      title={isDone ? 'Mark as incomplete' : 'Mark as completed'}
                    >
                      <Check className="w-4 h-4" />
                    </button>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4
                          className={clsx(
                            'text-sm font-bold truncate transition-colors',
                            isDone ? 'line-through text-slate-400' : 'text-slate-100'
                          )}
                        >
                          {m.title}
                        </h4>

                        <span
                          className={clsx(
                            'px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold uppercase tracking-wider border',
                            isDone
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                              : isOverdue
                              ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                              : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                          )}
                        >
                          {isDone ? 'Completed' : isOverdue ? 'Overdue' : 'Active Gate'}
                        </span>
                      </div>

                      {m.description && (
                        <p className="text-xs text-slate-400 line-clamp-1">{m.description}</p>
                      )}

                      <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                        {m.dueDate && (
                          <span
                            className={clsx(
                              'flex items-center gap-1 font-mono text-[11px]',
                              isOverdue ? 'text-rose-400 font-semibold' : 'text-slate-400'
                            )}
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Target: {m.dueDate}</span>
                          </span>
                        )}
                        <span>•</span>
                        <span className="font-mono text-[11px] text-slate-400">
                          {completedLinked.length}/{linkedTasks.length} tasks completed
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Progress bar & Controls */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                    <div className="w-36 space-y-1 text-right">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-slate-400">Progress</span>
                        <span className={clsx('font-bold', isDone ? 'text-emerald-400' : 'text-indigo-400')}>
                          {calculatedPercent}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className={clsx(
                            'h-full transition-all duration-300',
                            isDone ? 'bg-emerald-500' : 'bg-gradient-to-r from-indigo-500 to-indigo-400'
                          )}
                          style={{ width: `${calculatedPercent}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {linkedTasks.length > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedMilestoneId(isExpanded ? null : m.id)
                          }
                          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                          title="Toggle linked tasks breakdown"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Delete milestone "${m.title}"?`)) {
                            onDeleteMilestone(m.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                        title="Delete milestone"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Linked Tasks Breakdown */}
                {isExpanded && linkedTasks.length > 0 && (
                  <div className="px-5 pb-4 pt-1 border-t border-slate-800/80 bg-slate-950/40 space-y-2">
                    <span className="text-[10px] uppercase font-mono font-bold text-slate-400 tracking-wider">
                      Linked Tasks
                    </span>
                    <div className="space-y-1.5">
                      {linkedTasks.map((t) => (
                        <div
                          key={t.id}
                          onClick={() => onOpenTask(t)}
                          className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800/80 cursor-pointer transition-colors text-xs"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span
                              className={clsx(
                                'w-2 h-2 rounded-full shrink-0',
                                t.status === 'done' ? 'bg-emerald-400' : 'bg-indigo-400'
                              )}
                            />
                            <span
                              className={clsx(
                                'truncate font-medium',
                                t.status === 'done' ? 'line-through text-slate-500' : 'text-slate-200'
                              )}
                            >
                              {t.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 text-[11px] font-mono text-slate-400">
                            <span className="capitalize">{t.status.replace(/_/g, ' ')}</span>
                            <ArrowRight className="w-3 h-3 text-slate-600" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Milestone Modal */}
      {isCreateModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setIsCreateModalOpen(false)}
        >
          <div 
            className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Create Milestone</h3>
                  <p className="text-[11px] text-slate-400">Add a delivery stage or sign-off target</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Milestone Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Beta Release Gate, Client Sign-off, or Alpha Build"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>Target Due Date</span>
                </label>
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Key deliverables, sign-off criteria, or requirements..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newTitle.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create Milestone</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
