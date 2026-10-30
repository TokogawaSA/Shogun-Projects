import React, { useState, useEffect } from 'react';
import { X, FolderKanban, AlertTriangle, Loader2, CheckCircle2 } from 'lucide-react';
import { apiClient } from '../../../services/api';
import { SocialInteraction } from '../../../types/social';

interface EscalateToTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  interaction: SocialInteraction | null;
  onEscalate: (payload: { projectId: string; title: string; priority: string; description: string }) => Promise<void>;
}

export const EscalateToTaskModal: React.FC<EscalateToTaskModalProps> = ({
  isOpen,
  onClose,
  interaction,
  onEscalate,
}) => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [taskTitle, setTaskTitle] = useState<string>('');
  const [taskPriority, setTaskPriority] = useState<string>('high');
  const [taskDescription, setTaskDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setLoadingProjects(true);
      setErrorMsg('');
      apiClient
        .get<any[]>('/projects')
        .then((data) => {
          const list = Array.isArray(data) ? data : [];
          setProjects(list);
          if (list.length > 0) {
            setSelectedProjectId(list[0].id);
          }
        })
        .catch((err) => {
          console.warn('[EscalateModal] Could not fetch projects:', err);
        })
        .finally(() => setLoadingProjects(false));
    }
  }, [isOpen]);

  useEffect(() => {
    if (interaction) {
      setTaskTitle(`[${interaction.platform.toUpperCase()}] Support issue from @${interaction.authorHandle}`);
      setTaskPriority(
        interaction.urgency === 'critical'
          ? 'urgent'
          : interaction.urgency === 'high'
          ? 'high'
          : 'medium'
      );
      setTaskDescription(
        `Escalated from social interaction (${interaction.platform}):\n\n` +
          `Author: ${interaction.authorName} (@${interaction.authorHandle})\n` +
          `Sentiment: ${interaction.sentiment} (Score: ${interaction.sentimentScore || 0})\n` +
          `Detected Intent: ${interaction.intent}\n` +
          `Urgency Level: ${interaction.urgency}\n\n` +
          `Message Content:\n"${interaction.content}"\n\n` +
          (interaction.postUrl ? `Link: ${interaction.postUrl}` : '')
      );
    }
  }, [interaction]);

  if (!isOpen || !interaction) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) {
      setErrorMsg('Please select a project to assign this task.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await onEscalate({
        projectId: selectedProjectId,
        title: taskTitle,
        priority: taskPriority,
        description: taskDescription,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to escalate task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Escalate to Project Task</h2>
              <p className="text-xs text-slate-400">Convert social interaction directly into an engineering task</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Target Project Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Target Project *</label>
            {loadingProjects ? (
              <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading active projects...
              </div>
            ) : projects.length === 0 ? (
              <div className="text-xs text-amber-400 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                No active projects found. Please create a project first.
              </div>
            ) : (
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                required
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name || p.title || `Project #${p.id}`}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Task Title & Priority */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Task Title *</label>
              <input
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-medium"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Priority</label>
              <select
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          {/* Pre-populated Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Task Description & Context</label>
            <textarea
              rows={6}
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 font-mono leading-relaxed resize-none"
            />
          </div>

          {/* Meta summary card */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Author:</span>
              <span className="font-semibold text-slate-300">
                {interaction.authorName} (@{interaction.authorHandle})
              </span>
            </div>
            <div className="flex justify-between">
              <span>Sentiment & Intent:</span>
              <span className="font-semibold text-slate-300 capitalize">
                {interaction.sentiment} / {interaction.intent.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedProjectId}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2 shadow-lg shadow-indigo-600/20"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Escalating...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Create Project Task
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EscalateToTaskModal;
