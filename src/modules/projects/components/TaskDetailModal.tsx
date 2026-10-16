import React, { useState, useEffect } from 'react';
import { 
  X, 
  Trash2, 
  CheckCircle2, 
  Calendar, 
  User, 
  Flag, 
  CheckSquare, 
  Plus, 
  Columns3, 
  Layers, 
  Loader2,
  Clock,
  MessageSquare,
  Paperclip,
  Tag,
  GitBranch,
  Send,
  ExternalLink,
  Sparkles,
  Bug,
  Bookmark,
  CheckCircle,
  Zap
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../../../context/AuthContext';
import { 
  Task, 
  TaskPriority, 
  IssueType, 
  TaskStatusColumn, 
  Milestone, 
  Subtask, 
  TaskComment, 
  TaskAttachment 
} from '../types';

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  columns: TaskStatusColumn[];
  milestones: Milestone[];
  allTasks?: Task[];
  onSave: (updatedTask: Partial<Task>) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
}

const ISSUE_TYPES: Array<{ id: IssueType; label: string; icon: React.FC<{ className?: string }>; color: string }> = [
  { id: 'task', label: 'Task', icon: CheckCircle, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  { id: 'bug', label: 'Bug', icon: Bug, color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
  { id: 'feature', label: 'Feature', icon: Sparkles, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  { id: 'improvement', label: 'Improvement', icon: Zap, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  { id: 'epic', label: 'Epic', icon: Bookmark, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
];

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  isOpen,
  onClose,
  columns,
  milestones,
  allTasks = [],
  onSave,
  onDelete,
}) => {
  const { user } = useAuth();
  if (!isOpen || !task) return null;

  // Active Tab: Details vs Comments vs Attachments
  const [modalTab, setModalTab] = useState<'details' | 'comments' | 'attachments'>('details');

  // Form State
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [status, setStatus] = useState(task.status);
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [issueType, setIssueType] = useState<IssueType>(task.issueType || 'task');
  const [startDate, setStartDate] = useState(task.startDate || '');
  const [dueDate, setDueDate] = useState(task.dueDate || '');
  const [assigneeEmail, setAssigneeEmail] = useState(task.assignee?.email || '');
  const [assigneeName, setAssigneeName] = useState(task.assignee?.displayName || '');
  const [milestoneId, setMilestoneId] = useState(task.milestoneId || '');
  const [parentTaskId, setParentTaskId] = useState(task.parentTaskId || '');
  const [estimatedHours, setEstimatedHours] = useState<number>(task.estimatedHours || 0);
  const [actualHours, setActualHours] = useState<number>(task.actualHours || 0);

  // Subtasks
  const [subtasks, setSubtasks] = useState<Subtask[]>(task.subtasks || []);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  // Comments
  const [comments, setComments] = useState<TaskComment[]>(task.comments || []);
  const [newCommentText, setNewCommentText] = useState('');

  // Attachments
  const [attachments, setAttachments] = useState<TaskAttachment[]>(task.attachments || []);
  const [newAttachmentName, setNewAttachmentName] = useState('');
  const [newAttachmentUrl, setNewAttachmentUrl] = useState('');
  const [isAddingAttachment, setIsAddingAttachment] = useState(false);

  // Tags
  const [tags, setTags] = useState<string[]>(task.tags || []);
  const [newTagInput, setNewTagInput] = useState('');

  // Status
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setStatus(task.status);
      setPriority(task.priority);
      setIssueType(task.issueType || 'task');
      setStartDate(task.startDate || '');
      setDueDate(task.dueDate || '');
      setAssigneeEmail(task.assignee?.email || '');
      setAssigneeName(task.assignee?.displayName || '');
      setMilestoneId(task.milestoneId || '');
      setParentTaskId(task.parentTaskId || '');
      setEstimatedHours(task.estimatedHours || 0);
      setActualHours(task.actualHours || 0);
      setSubtasks(task.subtasks || []);
      setComments(task.comments || []);
      setAttachments(task.attachments || []);
      setTags(task.tags || []);
    }
  }, [task]);

  // Subtask Handlers
  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    const newSubtask: Subtask = {
      id: `st-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
      title: newSubtaskTitle.trim(),
      completed: false,
    };
    setSubtasks([...subtasks, newSubtask]);
    setNewSubtaskTitle('');
  };

  const handleToggleSubtask = (id: string) => {
    setSubtasks(
      subtasks.map((st) => (st.id === id ? { ...st, completed: !st.completed } : st))
    );
  };

  const handleDeleteSubtask = (id: string) => {
    setSubtasks(subtasks.filter((st) => st.id !== id));
  };

  // Tag Handlers
  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTagInput.trim()) {
      e.preventDefault();
      const cleanTag = newTagInput.trim().toLowerCase().replace(/^#/, '');
      if (!tags.includes(cleanTag)) {
        setTags([...tags, cleanTag]);
      }
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Comment Handlers
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    const newComment: TaskComment = {
      id: `cm-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
      authorId: user?.uid || 'usr-current',
      authorName: user?.displayName || user?.email?.split('@')[0] || 'Team Member',
      authorEmail: user?.email || undefined,
      content: newCommentText.trim(),
      createdAt: new Date().toISOString(),
    };
    const updated = [...comments, newComment];
    setComments(updated);
    setNewCommentText('');
  };

  // Attachment Handlers
  const handleAddAttachment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAttachmentName.trim() || !newAttachmentUrl.trim()) return;
    const newAtt: TaskAttachment = {
      id: `att-${Date.now().toString(36)}`,
      name: newAttachmentName.trim(),
      url: newAttachmentUrl.trim(),
      uploadedAt: new Date().toISOString(),
    };
    setAttachments([...attachments, newAtt]);
    setNewAttachmentName('');
    setNewAttachmentUrl('');
    setIsAddingAttachment(false);
  };

  const handleDeleteAttachment = (id: string) => {
    setAttachments(attachments.filter((a) => a.id !== id));
  };

  const completedSubtasks = subtasks.filter((st) => st.completed).length;
  const progressPercent = subtasks.length > 0 ? Math.round((completedSubtasks / subtasks.length) * 100) : 0;

  const handleSave = async () => {
    if (!title.trim()) return;
    setIsSaving(true);
    try {
      await onSave({
        id: task.id,
        projectId: task.projectId,
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        issueType,
        startDate: startDate || undefined,
        dueDate: dueDate || undefined,
        milestoneId: milestoneId || undefined,
        parentTaskId: parentTaskId || undefined,
        estimatedHours: Number(estimatedHours) || 0,
        actualHours: Number(actualHours) || 0,
        subtasks,
        comments,
        attachments,
        tags,
        assignee: assigneeName
          ? {
              id: task.assigneeId || 'usr-assigned',
              displayName: assigneeName.trim(),
              email: assigneeEmail.trim() || `${assigneeName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
            }
          : undefined,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete task "${task.title}"?`)) return;
    setIsDeleting(true);
    try {
      await onDelete(task.id);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  const currentTypeConfig = ISSUE_TYPES.find((it) => it.id === issueType) || ISSUE_TYPES[0];
  const TypeIcon = currentTypeConfig.icon;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Modal Top Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Issue Type Selector */}
            <div className={clsx('flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-semibold uppercase tracking-wider', currentTypeConfig.color)}>
              <TypeIcon className="w-3.5 h-3.5" />
              <select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value as IssueType)}
                className="bg-transparent focus:outline-none cursor-pointer uppercase text-xs font-semibold"
              >
                {ISSUE_TYPES.map((t) => (
                  <option key={t.id} value={t.id} className="bg-slate-900 text-slate-200">
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[10px] font-semibold tracking-wider">
              TASK-{task.id.slice(0, 6).toUpperCase()}
            </span>

            {task.creator && (
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                Reported by <strong className="text-slate-300">{task.creator.displayName || task.creator.email}</strong>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
              title="Delete task"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin text-rose-400" /> : <Trash2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. Sub-Tab Switcher (Details / Comments / Attachments) */}
        <div className="px-5 border-b border-slate-800 bg-slate-950/40 flex items-center gap-4 shrink-0 text-xs">
          <button
            onClick={() => setModalTab('details')}
            className={clsx(
              'py-2.5 border-b-2 font-medium transition-colors flex items-center gap-1.5',
              modalTab === 'details'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            )}
          >
            <span>Overview & Fields</span>
          </button>

          <button
            onClick={() => setModalTab('comments')}
            className={clsx(
              'py-2.5 border-b-2 font-medium transition-colors flex items-center gap-1.5',
              modalTab === 'comments'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            )}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Comments ({comments.length})</span>
          </button>

          <button
            onClick={() => setModalTab('attachments')}
            className={clsx(
              'py-2.5 border-b-2 font-medium transition-colors flex items-center gap-1.5',
              modalTab === 'attachments'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            )}
          >
            <Paperclip className="w-3.5 h-3.5" />
            <span>Attachments ({attachments.length})</span>
          </button>
        </div>

        {/* 3. Modal Content Area */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {modalTab === 'details' && (
            <>
              {/* Title Input */}
              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Task title..."
                  className="w-full text-base font-bold text-white bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/60"
                />
              </div>

              {/* Workflow, Priority, Milestone, Parent Task Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Status Column */}
                <div>
                  <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mb-1">
                    <Columns3 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Status</span>
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    {columns.map((col) => (
                      <option key={col.id} value={col.id}>
                        {col.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mb-1">
                    <Flag className="w-3.5 h-3.5 text-slate-500" />
                    <span>Priority</span>
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="low">🟢 Low</option>
                    <option value="medium">🔵 Medium</option>
                    <option value="high">🟡 High</option>
                    <option value="urgent">🔴 Urgent</option>
                  </select>
                </div>

                {/* Milestone */}
                <div>
                  <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mb-1">
                    <Layers className="w-3.5 h-3.5 text-slate-500" />
                    <span>Milestone</span>
                  </label>
                  <select
                    value={milestoneId}
                    onChange={(e) => setMilestoneId(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">(None)</option>
                    {milestones.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Parent Task / Hierarchy */}
                <div>
                  <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mb-1">
                    <GitBranch className="w-3.5 h-3.5 text-slate-500" />
                    <span>Parent Task</span>
                  </label>
                  <select
                    value={parentTaskId}
                    onChange={(e) => setParentTaskId(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">(None - Root Item)</option>
                    {allTasks
                      .filter((t) => t.id !== task.id)
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.title}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Dates & Time Tracking Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-3.5 bg-slate-950/50 rounded-xl border border-slate-800/80">
                {/* Start Date */}
                <div>
                  <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>Start Date</span>
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Due Date */}
                <div>
                  <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>Due Date</span>
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Estimated Hours */}
                <div>
                  <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mb-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Est. Hours</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={estimatedHours}
                    onChange={(e) => setEstimatedHours(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                {/* Logged Hours */}
                <div>
                  <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mb-1">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Logged Hours</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={actualHours}
                    onChange={(e) => setActualHours(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              {/* Ownership & People */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mb-1">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span>Assignee Name</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Alex Vance"
                    value={assigneeName}
                    onChange={(e) => setAssigneeName(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">Assignee Email</label>
                  <input
                    type="email"
                    placeholder="alex@example.com"
                    value={assigneeEmail}
                    onChange={(e) => setAssigneeEmail(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Description / Acceptance Criteria</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add detailed task instructions, scope, or acceptance criteria..."
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
                />
              </div>

              {/* Tags / Labels */}
              <div>
                <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mb-1.5">
                  <Tag className="w-3.5 h-3.5 text-slate-500" />
                  <span>Tags & Labels</span>
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {tags.map((tg) => (
                    <span
                      key={tg}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-mono"
                    >
                      #{tg}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tg)}
                        className="hover:text-rose-400 ml-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    placeholder="Type tag and press Enter..."
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    className="bg-slate-950/80 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-44"
                  />
                </div>
              </div>

              {/* Subtasks / Checklist */}
              <div className="pt-2 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-semibold text-slate-200">Subtask Checklist</span>
                  </div>
                  {subtasks.length > 0 && (
                    <span className="text-[11px] font-mono text-slate-400">
                      {completedSubtasks}/{subtasks.length} ({progressPercent}%)
                    </span>
                  )}
                </div>

                {subtasks.length > 0 && (
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                )}

                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {subtasks.map((st) => (
                    <div
                      key={st.id}
                      className="flex items-center justify-between gap-2 px-3 py-1.5 bg-slate-950/50 rounded-xl border border-slate-800/80 group hover:border-slate-700 transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() => handleToggleSubtask(st.id)}
                        className="flex items-center gap-2.5 text-left flex-1 min-w-0"
                      >
                        <CheckCircle2
                          className={clsx(
                            'w-4 h-4 shrink-0 transition-colors',
                            st.completed ? 'text-emerald-400' : 'text-slate-600 hover:text-slate-400'
                          )}
                        />
                        <span
                          className={clsx(
                            'text-xs truncate transition-all',
                            st.completed ? 'line-through text-slate-500' : 'text-slate-200'
                          )}
                        >
                          {st.title}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSubtask(st.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-opacity"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddSubtask} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Add a checklist item and press Enter..."
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    className="flex-1 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={!newSubtaskTitle.trim()}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </form>
              </div>
            </>
          )}

          {/* Comments Discussion Thread */}
          {modalTab === 'comments' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200">Activity & Comments Thread</span>
                <span className="text-[11px] font-mono text-slate-500">{comments.length} comments</span>
              </div>

              {/* Comments Stream */}
              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                {comments.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl text-xs text-slate-500">
                    No comments yet. Start the conversation below.
                  </div>
                ) : (
                  comments.map((cm) => (
                    <div
                      key={cm.id}
                      className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold text-[10px] flex items-center justify-center uppercase">
                            {cm.authorName.charAt(0)}
                          </div>
                          <span className="font-semibold text-slate-200">{cm.authorName}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500">
                          {new Date(cm.createdAt).toLocaleDateString()} at{' '}
                          {new Date(cm.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap pl-7">
                        {cm.content}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Comment Composer */}
              <form onSubmit={handleAddComment} className="pt-3 border-t border-slate-800 space-y-2">
                <textarea
                  rows={3}
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder="Write a comment or update for the team..."
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                />
                <div className="flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={!newCommentText.trim()}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Post Comment</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Attachments Panel */}
          {modalTab === 'attachments' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200">Attached Documents & Resources</span>
                <button
                  type="button"
                  onClick={() => setIsAddingAttachment(true)}
                  className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Attach Link</span>
                </button>
              </div>

              {isAddingAttachment && (
                <form onSubmit={handleAddAttachment} className="p-3 bg-slate-950 rounded-xl border border-indigo-500/40 space-y-2">
                  <input
                    type="text"
                    required
                    placeholder="Document or Resource Name (e.g. Figma Spec, PDF Guide)"
                    value={newAttachmentName}
                    onChange={(e) => setNewAttachmentName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                  />
                  <input
                    type="url"
                    required
                    placeholder="URL (e.g. https://figma.com/... or https://drive.google.com/...)"
                    value={newAttachmentUrl}
                    onChange={(e) => setNewAttachmentUrl(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingAttachment(false)}
                      className="px-2.5 py-1 text-xs text-slate-400"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 bg-indigo-600 text-white text-xs font-semibold rounded-lg"
                    >
                      Attach
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-2 max-h-[360px] overflow-y-auto">
                {attachments.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl text-xs text-slate-500">
                    No attachments linked to this task.
                  </div>
                ) : (
                  attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Paperclip className="w-4 h-4 text-indigo-400 shrink-0" />
                        <div className="min-w-0">
                          <h6 className="text-xs font-medium text-slate-200 truncate">{att.name}</h6>
                          <a
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1"
                          >
                            <span className="truncate max-w-sm">{att.url}</span>
                            <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                          </a>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteAttachment(att.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                        title="Remove attachment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* 4. Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !title.trim()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <span>Save Changes</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
