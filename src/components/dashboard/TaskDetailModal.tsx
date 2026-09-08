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
  Tag,
  Paperclip,
  UploadCloud,
  FileText,
  SlidersHorizontal,
  ChevronRight,
  ChevronDown,
  Download,
  Save,
  Check
} from 'lucide-react';
import clsx from 'clsx';
import { apiClient } from '../../services/api';
import { Task, SubTask, TaskPriority, TaskStatus, TaskAttachment } from '../../types';
import { TaskAttachmentsPanel } from '../../modules/projects/tasks/TaskAttachmentsPanel';
import { CustomFieldsPanel } from '../tasks/CustomFieldsPanel';

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
  const [activeTab, setActiveTab] = useState<'overview' | 'subtasks' | 'attachments' | 'customfields'>('overview');

  // Task edit state
  const [description, setDescription] = useState('');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [customFields, setCustomFields] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Subtask expanded & creation state
  const [expandedSubtaskId, setExpandedSubtaskId] = useState<string | null>(null);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newSubtaskDesc, setNewSubtaskDesc] = useState('');
  const [newSubtaskAssignee, setNewSubtaskAssignee] = useState('');
  const [newSubtaskPriority, setNewSubtaskPriority] = useState<TaskPriority>('medium');
  const [newSubtaskDueDate, setNewSubtaskDueDate] = useState('');
  const [newSubtaskAttachments, setNewSubtaskAttachments] = useState<TaskAttachment[]>([]);
  const [isSubmittingSubtask, setIsSubmittingSubtask] = useState(false);

  // Subtask inline custom field adder
  const [addingFieldSubtaskId, setAddingFieldSubtaskId] = useState<string | null>(null);
  const [subtaskNewFieldKey, setSubtaskNewFieldKey] = useState('');
  const [subtaskNewFieldVal, setSubtaskNewFieldVal] = useState('');

  useEffect(() => {
    if (task) {
      setCurrentTask(task);
      setDescription(task.description || '');
      setAttachments(task.attachments || task.customFields?.attachments || []);
      setCustomFields(task.customFields || {});
      setNewSubtaskTitle('');
      setNewSubtaskDesc('');
      setNewSubtaskAssignee('');
      setNewSubtaskAttachments([]);
    }
  }, [task]);

  if (!isOpen || !currentTask) return null;

  const subtasks: SubTask[] = currentTask.subtasks || [];
  const completedCount = subtasks.filter((s) => s.completed).length;
  const totalCount = subtasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const getPriorityStyle = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-rose-950/60 text-rose-300 border-rose-800/60';
      case 'high':
        return 'bg-amber-950/60 text-amber-300 border-amber-800/60';
      case 'medium':
        return 'bg-sky-950/60 text-sky-300 border-sky-800/60';
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
        return 'bg-indigo-950/60 text-indigo-300 border-indigo-800/60';
      case 'review':
        return 'bg-amber-950/60 text-amber-300 border-amber-800/60';
      case 'done':
        return 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60';
    }
  };

  const saveTaskUpdates = async (updates: Partial<Task>) => {
    setIsSaving(true);
    const updated: Task = {
      ...currentTask,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    setCurrentTask(updated);
    if (onUpdateTask) {
      onUpdateTask(updated);
    }

    try {
      if (currentTask.id) {
        await apiClient.put(`/projects/tasks/${currentTask.id}`, updates);
        setSaveMessage('Saved successfully');
        setTimeout(() => setSaveMessage(null), 2500);
      }
    } catch (err) {
      console.warn('Task update error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const saveSubtasks = async (updatedSubtasks: SubTask[]) => {
    const updatedCompleted = updatedSubtasks.filter((s) => s.completed).length;
    const calculatedProgress = updatedSubtasks.length > 0 
      ? Math.round((updatedCompleted / updatedSubtasks.length) * 100) 
      : currentTask.progress;

    await saveTaskUpdates({
      subtasks: updatedSubtasks,
      progress: calculatedProgress,
    });
  };

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim() || isSubmittingSubtask) return;
    setIsSubmittingSubtask(true);

    const newSubtask: SubTask = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: newSubtaskTitle.trim(),
      description: newSubtaskDesc.trim() || undefined,
      completed: false,
      assigneeId: newSubtaskAssignee.trim() || undefined,
      priority: newSubtaskPriority,
      dueDate: newSubtaskDueDate || undefined,
      attachments: newSubtaskAttachments,
      customFields: {},
      createdAt: new Date().toISOString(),
    };

    const updatedSubtasks = [...subtasks, newSubtask];
    await saveSubtasks(updatedSubtasks);

    setNewSubtaskTitle('');
    setNewSubtaskDesc('');
    setNewSubtaskAssignee('');
    setNewSubtaskAttachments([]);
    setNewSubtaskDueDate('');
    setIsSubmittingSubtask(false);
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

  const handleUpdateSubtask = async (subtaskId: string, patch: Partial<SubTask>) => {
    const updatedSubtasks = subtasks.map((st) =>
      st.id === subtaskId ? { ...st, ...patch } : st
    );
    await saveSubtasks(updatedSubtasks);
  };

  const handleSubtaskFileUpload = async (subtaskId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newAtts: TaskAttachment[] = [];
    Array.from(files).forEach((file) => {
      let url: string | undefined = undefined;
      try {
        url = URL.createObjectURL(file);
      } catch {
        url = undefined;
      }
      newAtts.push({
        id: `att-st-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        url,
        uploadedBy: 'Current User',
        uploadedAt: new Date().toISOString(),
      });
    });

    const targetSubtask = subtasks.find((st) => st.id === subtaskId);
    if (!targetSubtask) return;
    await handleUpdateSubtask(subtaskId, {
      attachments: [...(targetSubtask.attachments || []), ...newAtts],
    });
  };

  const handleRemoveSubtaskFile = async (subtaskId: string, fileId: string) => {
    const targetSubtask = subtasks.find((st) => st.id === subtaskId);
    if (!targetSubtask) return;
    await handleUpdateSubtask(subtaskId, {
      attachments: (targetSubtask.attachments || []).filter((a) => a.id !== fileId),
    });
  };

  const handleAddSubtaskCustomField = async (subtaskId: string) => {
    if (!subtaskNewFieldKey.trim()) return;
    const targetSubtask = subtasks.find((st) => st.id === subtaskId);
    if (!targetSubtask) return;
    const updatedFields = {
      ...(targetSubtask.customFields || {}),
      [subtaskNewFieldKey.trim()]: subtaskNewFieldVal.trim(),
    };
    await handleUpdateSubtask(subtaskId, { customFields: updatedFields });
    setSubtaskNewFieldKey('');
    setSubtaskNewFieldVal('');
    setAddingFieldSubtaskId(null);
  };

  const handleRemoveSubtaskCustomField = async (subtaskId: string, fieldKey: string) => {
    const targetSubtask = subtasks.find((st) => st.id === subtaskId);
    if (!targetSubtask) return;
    const updatedFields = { ...(targetSubtask.customFields || {}) };
    delete updatedFields[fieldKey];
    await handleUpdateSubtask(subtaskId, { customFields: updatedFields });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/80 flex items-start justify-between gap-4">
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
                  <Tag className="w-3 h-3 text-indigo-400" />
                  {currentTask.category}
                </span>
              )}
              {saveMessage && (
                <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
                  <Check className="w-3 h-3" /> {saveMessage}
                </span>
              )}
              {isSaving && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  Saving...
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

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-5 gap-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`py-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Overview & Description
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('subtasks')}
            className={`py-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'subtasks'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ListChecks className="w-3.5 h-3.5" />
            Subtasks ({subtasks.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('attachments')}
            className={`py-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'attachments'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Paperclip className="w-3.5 h-3.5" />
            File Uploads ({attachments.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('customfields')}
            className={`py-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'customfields'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Custom Fields ({Object.keys(customFields).length})
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
          {/* TAB 1: OVERVIEW & DESCRIPTION */}
          {activeTab === 'overview' && (
            <div className="space-y-5 animate-in fade-in">
              {/* Meta Info Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Assignee / Agent</span>
                  <div className="flex items-center gap-1.5 mt-1 text-xs font-medium text-slate-100 truncate">
                    {currentTask.assignedAgent ? (
                      <>
                        <Bot className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                        <span>{currentTask.assignedAgent}</span>
                      </>
                    ) : currentTask.assigneeId ? (
                      <>
                        <User className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                        <span className="truncate">{currentTask.assigneeId}</span>
                      </>
                    ) : (
                      <span className="text-slate-400">Unassigned</span>
                    )}
                  </div>
                </div>

                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Due Date</span>
                  <div className="flex items-center gap-1.5 mt-1 text-xs font-medium text-slate-100">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{currentTask.dueDate || 'No due date'}</span>
                  </div>
                </div>

                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Created</span>
                  <div className="flex items-center gap-1.5 mt-1 text-xs font-medium text-slate-100">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{currentTask.createdAt ? new Date(currentTask.createdAt).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>

                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Subtasks Done</span>
                  <div className="flex items-center gap-1.5 mt-1 text-xs font-bold text-emerald-400 font-mono">
                    <ListChecks className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{totalCount > 0 ? `${completedCount}/${totalCount} (${progressPercent}%)` : 'None'}</span>
                  </div>
                </div>
              </div>

              {/* Editable Description Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-400" />
                    Task Description & Specification
                  </h4>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingDesc(!isEditingDesc)}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white"
                    >
                      {isEditingDesc ? 'Preview Mode' : 'Edit Description'}
                    </button>
                    {isEditingDesc && (
                      <button
                        type="button"
                        onClick={() => {
                          saveTaskUpdates({ description });
                          setIsEditingDesc(false);
                        }}
                        className="text-[10px] font-semibold px-2.5 py-0.5 rounded bg-indigo-600 text-white hover:bg-indigo-500 flex items-center gap-1"
                      >
                        <Save className="w-3 h-3" /> Save
                      </button>
                    )}
                  </div>
                </div>

                {isEditingDesc ? (
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter detailed task architecture, acceptance criteria, or execution notes..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                ) : (
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {description ? description : <span className="text-slate-500 italic">No description provided for this task.</span>}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: DETAILED SUBTASKS */}
          {activeTab === 'subtasks' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-300">
                    Subtask Checklist ({completedCount}/{totalCount} Completed)
                  </span>
                </div>
                {totalCount > 0 && (
                  <span className="text-xs font-mono text-emerald-400 font-bold">{progressPercent}%</span>
                )}
              </div>

              {totalCount > 0 && (
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              )}

              {/* Subtasks List */}
              <div className="space-y-2">
                {subtasks.map((st) => {
                  const isExpanded = expandedSubtaskId === st.id;
                  const stAtts = st.attachments || [];
                  const stFields = st.customFields || {};
                  const fieldKeys = Object.keys(stFields);

                  return (
                    <div
                      key={st.id}
                      className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2 group hover:border-slate-700 transition"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div 
                          onClick={() => handleToggleSubtask(st.id)}
                          className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0"
                        >
                          <button 
                            type="button"
                            className="text-slate-400 hover:text-indigo-400"
                          >
                            {st.completed ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Circle className="w-4 h-4" />}
                          </button>
                          <span className={clsx('text-xs font-semibold truncate', st.completed && 'line-through text-slate-500')}>
                            {st.title}
                          </span>

                          {st.description && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-950/60 text-indigo-400 border border-indigo-800/60 flex items-center gap-0.5">
                              <FileText className="w-2.5 h-2.5" />
                              <span>Desc</span>
                            </span>
                          )}

                          {stAtts.length > 0 && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 flex items-center gap-0.5">
                              <Paperclip className="w-2.5 h-2.5" />
                              <span>{stAtts.length}</span>
                            </span>
                          )}

                          {fieldKeys.length > 0 && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-950/60 text-purple-400 border border-purple-800/60 flex items-center gap-0.5">
                              <Tag className="w-2.5 h-2.5" />
                              <span>{fieldKeys.length}</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {st.assigneeId && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400 flex items-center gap-1">
                              <User className="w-2.5 h-2.5 text-indigo-400" />
                              {st.assigneeId}
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => setExpandedSubtaskId(isExpanded ? null : st.id)}
                            className="p-1 text-slate-400 hover:text-white"
                            title="Toggle Subtask Details"
                          >
                            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteSubtask(st.id)}
                            className="text-slate-500 hover:text-rose-400 p-1"
                            title="Delete Subtask"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Expandable Subtask Detailed Panel */}
                      {isExpanded && (
                        <div className="pt-2 border-t border-slate-800/80 space-y-3 animate-in fade-in">
                          {/* Description */}
                          <div>
                            <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                              Subtask Instructions
                            </label>
                            <textarea
                              rows={2}
                              value={st.description || ''}
                              onChange={(e) => handleUpdateSubtask(st.id, { description: e.target.value })}
                              placeholder="Technical specifications or checklist notes for this subtask..."
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                            />
                          </div>

                          {/* Subtask Attachments */}
                          <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1">
                                <Paperclip className="w-3 h-3 text-emerald-400" /> Files ({stAtts.length})
                              </span>
                              <label className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white text-[10px] font-semibold cursor-pointer flex items-center gap-1">
                                <UploadCloud className="w-2.5 h-2.5" />
                                <span>Upload</span>
                                <input
                                  type="file"
                                  multiple
                                  onChange={(e) => handleSubtaskFileUpload(st.id, e.target.files)}
                                  className="hidden"
                                />
                              </label>
                            </div>

                            {stAtts.length > 0 ? (
                              <div className="space-y-1">
                                {stAtts.map((a) => (
                                  <div key={a.id} className="flex items-center justify-between p-1.5 bg-slate-950 rounded border border-slate-800 text-xs">
                                    <span className="text-slate-300 truncate text-[11px]">{a.name}</span>
                                    <div className="flex items-center gap-1">
                                      {a.url && (
                                        <a href={a.url} download={a.name} target="_blank" rel="noreferrer" className="p-0.5 text-slate-400 hover:text-white">
                                          <Download className="w-3 h-3" />
                                        </a>
                                      )}
                                      <button type="button" onClick={() => handleRemoveSubtaskFile(st.id, a.id)} className="p-0.5 text-slate-500 hover:text-rose-400">
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[10px] text-slate-500 italic">No files attached to subtask.</p>
                            )}
                          </div>

                          {/* Subtask Custom Fields */}
                          <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1">
                                <Tag className="w-3 h-3 text-purple-400" /> Custom Fields ({fieldKeys.length})
                              </span>
                              <button
                                type="button"
                                onClick={() => setAddingFieldSubtaskId(addingFieldSubtaskId === st.id ? null : st.id)}
                                className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white text-[10px] font-semibold flex items-center gap-1"
                              >
                                <Plus className="w-2.5 h-2.5" />
                                <span>Add</span>
                              </button>
                            </div>

                            {addingFieldSubtaskId === st.id && (
                              <div className="flex gap-1.5 pt-1">
                                <input
                                  type="text"
                                  placeholder="Field key..."
                                  value={subtaskNewFieldKey}
                                  onChange={(e) => setSubtaskNewFieldKey(e.target.value)}
                                  className="w-1/2 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200"
                                />
                                <input
                                  type="text"
                                  placeholder="Value..."
                                  value={subtaskNewFieldVal}
                                  onChange={(e) => setSubtaskNewFieldVal(e.target.value)}
                                  className="w-1/2 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleAddSubtaskCustomField(st.id)}
                                  className="px-2 py-1 bg-indigo-600 text-white rounded text-[10px]"
                                >
                                  Save
                                </button>
                              </div>
                            )}

                            {fieldKeys.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {fieldKeys.map((k) => (
                                  <span key={k} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] text-slate-300 font-mono">
                                    <span className="text-slate-500">{k}:</span>
                                    <span>{String(stFields[k])}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveSubtaskCustomField(st.id, k)}
                                      className="text-slate-500 hover:text-rose-400 ml-1"
                                    >
                                      ×
                                    </button>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Add Subtask Form */}
              <form onSubmit={handleAddSubtask} className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-indigo-400" />
                  Add Subtask Step
                </span>
                <input
                  type="text"
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  placeholder="Subtask title (e.g., 'Verify PHP unit tests')..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <textarea
                  rows={2}
                  value={newSubtaskDesc}
                  onChange={(e) => setNewSubtaskDesc(e.target.value)}
                  placeholder="Subtask technical instructions (optional)..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                  <input
                    type="text"
                    value={newSubtaskAssignee}
                    onChange={(e) => setNewSubtaskAssignee(e.target.value)}
                    placeholder="Assignee (opt)"
                    className="w-36 px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100"
                  />
                  <select
                    value={newSubtaskPriority}
                    onChange={(e) => setNewSubtaskPriority(e.target.value as TaskPriority)}
                    className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 capitalize"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent</option>
                  </select>
                  <button
                    type="submit"
                    disabled={isSubmittingSubtask || !newSubtaskTitle.trim()}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition ml-auto"
                  >
                    Add Subtask
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: TASK FILE UPLOADS */}
          {activeTab === 'attachments' && (
            <div className="animate-in fade-in">
              <TaskAttachmentsPanel
                attachments={attachments}
                onChange={(updatedAtts) => {
                  setAttachments(updatedAtts);
                  saveTaskUpdates({ attachments: updatedAtts });
                }}
              />
            </div>
          )}

          {/* TAB 4: TASK CUSTOM FIELDS */}
          {activeTab === 'customfields' && (
            <div className="animate-in fade-in">
              <CustomFieldsPanel
                customFields={customFields}
                onChange={(updatedFields) => {
                  setCustomFields(updatedFields);
                  saveTaskUpdates({ customFields: updatedFields });
                }}
              />
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
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
