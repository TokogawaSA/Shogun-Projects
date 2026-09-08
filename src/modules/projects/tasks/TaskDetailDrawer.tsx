/**
 * Comprehensive Task Detail Workspace & Side Drawer (ClickUp-Grade Engine)
 * Multi-Tenant Antigravity 2.0 Ecosystem
 * Enhanced with Rich Descriptions, File Uploads, Detailed Assignment & General Project Context
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  Clock,
  Repeat,
  Network,
  Plus,
  Trash2,
  Save,
  ListChecks,
  Calendar,
  SlidersHorizontal,
  ChevronRight,
  ChevronDown,
  Paperclip,
  Briefcase,
  Building2,
  FileText,
  Bot,
  User,
  Layers,
  Bold,
  Italic,
  List,
  Code,
  CheckSquare,
  UploadCloud,
  Tag,
  Download,
} from 'lucide-react';
import { apiClient } from '../../../services/api';
import { useProject } from '../../../context/ProjectContext';
import {
  Task,
  SubTask,
  TaskPriority,
  TaskStatus,
  TimeLog,
  TaskAssigneeAllocation,
  TaskDependencyItem,
  AdvancedRecurrenceConfig,
  TaskAttachment,
} from '../../../types';
import { TimeTrackerWidget } from './TimeTrackerWidget';
import { TaskAttachmentsPanel } from './TaskAttachmentsPanel';
import { CustomFieldsPanel } from '../../../components/tasks/CustomFieldsPanel';
import { TaskDependenciesPanel } from '../../../components/tasks/TaskDependenciesPanel';
import { MultiAssigneeSelector } from '../../../components/tasks/MultiAssigneeSelector';
import { AdvancedRecurrenceModal } from '../../../components/tasks/AdvancedRecurrenceModal';

interface TaskDetailDrawerProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateTask?: (updated: Task) => void;
  onDeleteTask?: (taskId: string) => void;
  allProjectTasks?: Task[];
}

export const TaskDetailDrawer: React.FC<TaskDetailDrawerProps> = ({
  task,
  isOpen,
  onClose,
  onUpdateTask,
  onDeleteTask,
  allProjectTasks = [],
}) => {
  const { projects } = useProject();
  const [currentTask, setCurrentTask] = useState<Task | null>(task);
  const [activeTab, setActiveTab] = useState<
    'description' | 'subtasks' | 'attachments' | 'customfields' | 'dependencies' | 'timelogs'
  >('description');

  // Core Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [descViewMode, setDescViewMode] = useState<'edit' | 'preview'>('edit');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [estimatedHours, setEstimatedHours] = useState<number>(0);
  const [milestoneId, setMilestoneId] = useState<string>('');
  const [lineItemId, setLineItemId] = useState<string>('');

  // Attachments & Acceptance Criteria
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [acceptanceCriteria, setAcceptanceCriteria] = useState<
    Array<{ id: string; text: string; completed: boolean }>
  >([]);
  const [newCriterionText, setNewCriterionText] = useState('');

  // Multi-Assignees, Custom Fields, Dependencies, Recurrence
  const [assignees, setAssignees] = useState<TaskAssigneeAllocation[]>([]);
  const [customFields, setCustomFields] = useState<Record<string, any>>({});
  const [dependencies, setDependencies] = useState<TaskDependencyItem[]>([]);
  const [advancedRecurrence, setAdvancedRecurrence] = useState<AdvancedRecurrenceConfig | undefined>(
    undefined
  );
  const [isRecurrenceModalOpen, setIsRecurrenceModalOpen] = useState(false);

  // Subtasks & Expanded state
  const [subtasks, setSubtasks] = useState<SubTask[]>([]);
  const [expandedSubtaskId, setExpandedSubtaskId] = useState<string | null>(null);
  const [subtaskDescModes, setSubtaskDescModes] = useState<Record<string, 'edit' | 'preview'>>({});
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newSubtaskDesc, setNewSubtaskDesc] = useState('');
  const [newSubtaskAssignee, setNewSubtaskAssignee] = useState('');
  const [newSubtaskPriority, setNewSubtaskPriority] = useState<TaskPriority>('medium');
  const [newSubtaskDueDate, setNewSubtaskDueDate] = useState('');
  const [newSubtaskAttachments, setNewSubtaskAttachments] = useState<TaskAttachment[]>([]);
  const [newSubtaskCustomFields, setNewSubtaskCustomFields] = useState<Record<string, any>>({});
  const [isAddingCustomFieldToSt, setIsAddingCustomFieldToSt] = useState<string | null>(null);
  const [newStFieldKey, setNewStFieldKey] = useState('');
  const [newStFieldVal, setNewStFieldVal] = useState('');
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);

  // Detailed Project Metadata
  const [projectMetadata, setProjectMetadata] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Resolve matching project from context or fetch
  const linkedProject = projects.find((p) => p.id === (currentTask?.projectId || task?.projectId));

  useEffect(() => {
    if (task) {
      setCurrentTask(task);
      setTitle(task.title || '');
      setDescription(task.description || '');
      setStatus(task.status || 'todo');
      setPriority(task.priority || 'medium');
      setStartDate(task.startDate || '');
      setDueDate(task.dueDate || '');
      setEstimatedHours(task.estimatedHours || 0);
      setMilestoneId(task.milestoneId || '');
      setLineItemId(task.lineItemId || '');
      setSubtasks(task.subtasks || []);
      setTimeLogs(task.timeLogs || []);
      setCustomFields(task.customFields || {});
      setDependencies(task.dependencies || []);
      setAdvancedRecurrence(task.advancedRecurrence);
      setAttachments(task.attachments || task.customFields?.attachments || []);
      setAcceptanceCriteria(
        task.acceptanceCriteria || [
          { id: 'crit-1', text: 'Define technical implementation scope & constraints', completed: true },
          { id: 'crit-2', text: 'Unit test validation passes with zero regression', completed: false },
          { id: 'crit-3', text: 'Peer review and deployment signoff', completed: false },
        ]
      );

      // Initialize assignees
      if (task.assignees && task.assignees.length > 0) {
        setAssignees(task.assignees);
      } else if (task.assigneeId) {
        setAssignees([
          {
            userId: task.assigneeId,
            displayName: task.assigneeId === 'usr-admin-master' ? 'Admin Master' : task.assigneeId,
            email: 'admin@shogunate.solutions',
            role: 'Lead',
            allocationPercent: 100,
          },
        ]);
      } else {
        setAssignees([]);
      }

      // Fetch richer project information if available
      const pId = task.projectId;
      if (pId && pId !== 'proj-default') {
        apiClient
          .get<any>(`/projects/${pId}`)
          .then((res) => setProjectMetadata(res))
          .catch(() => setProjectMetadata(null));
      }
    }
  }, [task]);

  if (!isOpen || !currentTask) return null;

  // Insert markdown helper tokens
  const handleInsertMarkdown = (prefix: string, suffix: string = '') => {
    setDescription((prev) => `${prev}\n${prefix} ${suffix}`.trim());
  };

  const handleQuickAssign = (userId: string, displayName: string, role: string) => {
    const isAlready = assignees.some((a) => a.userId === userId);
    if (!isAlready) {
      setAssignees([...assignees, { userId, displayName, email: `${userId}@antigravity.ai`, role, allocationPercent: 100 }]);
    }
  };

  const handleSaveTask = async () => {
    setIsSaving(true);
    const updated: Task = {
      ...currentTask,
      title,
      description,
      status,
      priority,
      startDate,
      dueDate,
      estimatedHours,
      milestoneId: milestoneId || null,
      lineItemId: lineItemId || null,
      assignees,
      assigneeIds: assignees.map((a) => a.userId),
      assigneeId: assignees[0]?.userId || undefined,
      customFields: {
        ...customFields,
        attachments,
      },
      attachments,
      acceptanceCriteria,
      dependencies,
      predecessorTaskIds: dependencies
        .filter((d) => d.type === 'waiting_on')
        .map((d) => d.targetTaskId),
      advancedRecurrence,
      isRecurring: Boolean(advancedRecurrence?.enabled),
      subtasks,
      timeLogs,
      updatedAt: new Date().toISOString(),
    };

    try {
      if (currentTask.id) {
        await apiClient.put(`/projects/tasks/${currentTask.id}`, {
          title,
          description,
          status,
          priority,
          startDate,
          dueDate,
          estimatedHours,
          milestoneId: milestoneId || null,
          lineItemId: lineItemId || null,
          assigneeId: assignees[0]?.userId || null,
          assigneeIds: assignees.map((a) => a.userId),
          customFields: {
            ...customFields,
            attachments,
          },
          attachments,
          dependencies,
          predecessorTaskIds: dependencies
            .filter((d) => d.type === 'waiting_on')
            .map((d) => d.targetTaskId),
          isRecurring: Boolean(advancedRecurrence?.enabled),
          recurrenceRule: advancedRecurrence?.frequency || null,
          subtasks,
          updatedAt: new Date().toISOString(),
        });
      }

      if (onUpdateTask) {
        onUpdateTask(updated);
      }
      setSaveSuccess('Task parameters and files updated successfully.');
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (e: any) {
      console.warn('[TaskDetailDrawer] Save note:', e);
      if (onUpdateTask) {
        onUpdateTask(updated);
      }
      setSaveSuccess('Saved locally in active session.');
      setTimeout(() => setSaveSuccess(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  // Subtask management
  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;

    const newSt: SubTask = {
      id: `st-${Date.now().toString(36)}`,
      title: newSubtaskTitle.trim(),
      description: newSubtaskDesc.trim() || undefined,
      assigneeId: newSubtaskAssignee || undefined,
      assigneeName: newSubtaskAssignee || undefined,
      completed: false,
      priority: newSubtaskPriority,
      dueDate: newSubtaskDueDate || undefined,
      attachments: newSubtaskAttachments,
      customFields: newSubtaskCustomFields,
      createdAt: new Date().toISOString(),
    };

    setSubtasks([...subtasks, newSt]);
    setNewSubtaskTitle('');
    setNewSubtaskDesc('');
    setNewSubtaskAssignee('');
    setNewSubtaskPriority('medium');
    setNewSubtaskDueDate('');
    setNewSubtaskAttachments([]);
    setNewSubtaskCustomFields({});
  };

  const handleToggleSubtask = (stId: string) => {
    setSubtasks(
      subtasks.map((st) => (st.id === stId ? { ...st, completed: !st.completed } : st))
    );
  };

  const handleUpdateSubtaskField = (stId: string, field: keyof SubTask, val: any) => {
    setSubtasks(
      subtasks.map((st) => (st.id === stId ? { ...st, [field]: val } : st))
    );
  };

  const handleRemoveSubtask = (stId: string) => {
    setSubtasks(subtasks.filter((st) => st.id !== stId));
  };

  const handleToggleSubtaskDescMode = (stId: string) => {
    setSubtaskDescModes((prev) => ({
      ...prev,
      [stId]: prev[stId] === 'preview' ? 'edit' : 'preview',
    }));
  };

  const handleSubtaskFileUpload = (stId: string, files: FileList | null) => {
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
    setSubtasks((prev) =>
      prev.map((st) =>
        st.id === stId ? { ...st, attachments: [...(st.attachments || []), ...newAtts] } : st
      )
    );
  };

  const handleRemoveSubtaskFile = (stId: string, fileId: string) => {
    setSubtasks((prev) =>
      prev.map((st) =>
        st.id === stId
          ? { ...st, attachments: (st.attachments || []).filter((a) => a.id !== fileId) }
          : st
      )
    );
  };

  const handleSubtaskCustomFieldChange = (stId: string, key: string, val: any) => {
    setSubtasks((prev) =>
      prev.map((st) =>
        st.id === stId
          ? { ...st, customFields: { ...(st.customFields || {}), [key]: val } }
          : st
      )
    );
  };

  const handleRemoveSubtaskCustomField = (stId: string, key: string) => {
    setSubtasks((prev) =>
      prev.map((st) => {
        if (st.id !== stId) return st;
        const next = { ...(st.customFields || {}) };
        delete next[key];
        return { ...st, customFields: next };
      })
    );
  };

  const handleNewSubtaskFiles = (files: FileList | null) => {
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
        id: `att-new-st-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        url,
        uploadedBy: 'Current User',
        uploadedAt: new Date().toISOString(),
      });
    });
    setNewSubtaskAttachments((prev) => [...prev, ...newAtts]);
  };

  // Acceptance criteria helpers
  const handleAddCriterion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCriterionText.trim()) return;
    setAcceptanceCriteria([
      ...acceptanceCriteria,
      { id: `crit-${Date.now()}`, text: newCriterionText.trim(), completed: false },
    ]);
    setNewCriterionText('');
  };

  const handleToggleCriterion = (id: string) => {
    setAcceptanceCriteria(
      acceptanceCriteria.map((c) => (c.id === id ? { ...c, completed: !c.completed } : c))
    );
  };

  const handleRemoveCriterion = (id: string) => {
    setAcceptanceCriteria(acceptanceCriteria.filter((c) => c.id !== id));
  };

  const completedSubtasks = subtasks.filter((st) => st.completed).length;
  const subtaskProgress =
    subtasks.length > 0 ? Math.round((completedSubtasks / subtasks.length) * 100) : 0;
  const completedCriteria = acceptanceCriteria.filter((c) => c.completed).length;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-slate-900 border-l border-slate-800 shadow-2xl h-full flex flex-col justify-between overflow-hidden">
        {/* Header Toolbar */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80 backdrop-blur">
          <div className="flex items-center gap-2 min-w-0">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
              {currentTask.id}
            </span>
            <div className="flex items-center gap-1 text-xs text-slate-400 truncate">
              <span className="text-slate-500 font-mono">Task Editor</span>
              <ChevronRight className="w-3 h-3 text-slate-600" />
              <span className="font-semibold text-slate-200 truncate">{title || 'Untitled Task'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsRecurrenceModalOpen(true)}
              className={`p-1.5 rounded-lg border transition text-xs flex items-center gap-1.5 ${
                advancedRecurrence?.enabled
                  ? 'bg-purple-900/40 text-purple-300 border-purple-500/40'
                  : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
              }`}
              title="Recurring Task Schedule"
            >
              <Repeat className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px] font-medium">
                {advancedRecurrence?.enabled ? 'Recurring' : 'Recurrence'}
              </span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Close Panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
          {saveSuccess && (
            <div className="p-3 bg-emerald-950/50 border border-emerald-800 text-emerald-300 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{saveSuccess}</span>
            </div>
          )}

          {/* 1. GENERAL PROJECT CONTEXT BANNER */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/30 border border-slate-800 shadow-sm space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Briefcase className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-200">
                      {projectMetadata?.title || linkedProject?.title || 'Antigravity 2.0 Integration Hub'}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {currentTask.projectId || 'proj-shogun-1'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1">
                    {projectMetadata?.description || linkedProject?.description || 'Centralized project delivery'}
                  </p>
                </div>
              </div>

              {/* CRM Client Association */}
              {(projectMetadata?.account || projectMetadata?.deal) && (
                <div className="flex items-center gap-1.5 text-[11px] font-mono px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-300">
                  <Building2 className="w-3 h-3 text-indigo-400" />
                  <span>Client: {projectMetadata?.account?.accountName || 'Enterprise Holding AG'}</span>
                </div>
              )}
            </div>

            {/* Breadcrumb Path & Milestones */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/80 text-[11px] text-slate-400">
              <span className="text-slate-500">Milestone / Scope:</span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700 font-mono text-[10px]">
                {milestoneId ? `Milestone: ${milestoneId}` : 'Main Delivery Sprint'}
              </span>
              {lineItemId && (
                <span className="px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-800/60 font-mono text-[10px] flex items-center gap-1">
                  <Layers className="w-2.5 h-2.5" /> Quoted SOW Deliverable
                </span>
              )}
              {currentTask.parentTaskId && (
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 font-mono text-[10px]">
                  Parent Task: {currentTask.parentTaskId}
                </span>
              )}
            </div>
          </div>

          {/* 2. TITLE & STATUS / PRIORITY BAR */}
          <div className="space-y-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task Title..."
              className="w-full bg-transparent text-xl font-bold text-slate-100 placeholder-slate-500 border-0 border-b border-transparent hover:border-slate-800 focus:border-indigo-500 focus:ring-0 px-0 py-1 transition"
            />

            <div className="flex flex-wrap items-center gap-2">
              {/* Status */}
              <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs">
                <span className="text-slate-400 text-[11px]">Status:</span>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TaskStatus)}
                  className="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="todo" className="bg-slate-900">To Do</option>
                  <option value="in_progress" className="bg-slate-900">In Progress</option>
                  <option value="review" className="bg-slate-900">In Review</option>
                  <option value="done" className="bg-slate-900">Complete</option>
                </select>
              </div>

              {/* Priority */}
              <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs">
                <span className="text-slate-400 text-[11px]">Priority:</span>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className={`bg-transparent text-xs font-semibold focus:outline-none cursor-pointer ${
                    priority === 'urgent'
                      ? 'text-rose-400'
                      : priority === 'high'
                      ? 'text-orange-400'
                      : priority === 'medium'
                      ? 'text-blue-400'
                      : 'text-slate-400'
                  }`}
                >
                  <option value="low" className="bg-slate-900">Low</option>
                  <option value="medium" className="bg-slate-900">Medium</option>
                  <option value="high" className="bg-slate-900">High</option>
                  <option value="urgent" className="bg-slate-900">Urgent</option>
                </select>
              </div>

              {/* Estimated Hours */}
              <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-[11px] text-slate-400">Est:</span>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(parseFloat(e.target.value) || 0)}
                  className="w-12 bg-transparent text-xs text-slate-200 font-mono focus:outline-none"
                />
                <span className="text-[11px] text-slate-500">hrs</span>
              </div>

              {/* Due Date */}
              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px] text-slate-400">Due:</span>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer font-mono"
                />
              </div>
            </div>
          </div>

          {/* 3. DETAILED ASSIGNMENT & QUICK ACTIONS */}
          <div className="space-y-2 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <MultiAssigneeSelector assignees={assignees} onChange={setAssignees} />

            {/* Quick Assign Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
              <span className="text-slate-500">Quick Assign:</span>
              <button
                type="button"
                onClick={() => handleQuickAssign('usr-admin-master', 'Admin Master', 'Lead Architect')}
                className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              >
                + Assign to Me
              </button>
              <button
                type="button"
                onClick={() => handleQuickAssign('usr-agent-sentinel', 'Sentinel Agent (AI)', 'Sentinel Agent')}
                className="px-2 py-0.5 rounded-md bg-purple-950/50 hover:bg-purple-900/50 text-purple-300 border border-purple-800/50 transition flex items-center gap-1"
              >
                <Bot className="w-2.5 h-2.5" />
                + Sentinel AI
              </button>
              <button
                type="button"
                onClick={() => handleQuickAssign('usr-agent-worker', 'Worker Agent (AI)', 'Worker Agent')}
                className="px-2 py-0.5 rounded-md bg-cyan-950/50 hover:bg-cyan-900/50 text-cyan-300 border border-cyan-800/50 transition flex items-center gap-1"
              >
                <Bot className="w-2.5 h-2.5" />
                + Worker AI
              </button>
            </div>
          </div>

          {/* 4. TAB NAVIGATION */}
          <div className="flex border-b border-slate-800 gap-2 pt-1 overflow-x-auto custom-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab('description')}
              className={`pb-2.5 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 flex-shrink-0 ${
                activeTab === 'description'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Description & Specs
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('subtasks')}
              className={`pb-2.5 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 flex-shrink-0 ${
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
              className={`pb-2.5 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 flex-shrink-0 ${
                activeTab === 'attachments'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Paperclip className="w-3.5 h-3.5" />
              Attachments ({attachments.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('customfields')}
              className={`pb-2.5 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 flex-shrink-0 ${
                activeTab === 'customfields'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Custom Fields
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('dependencies')}
              className={`pb-2.5 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 flex-shrink-0 ${
                activeTab === 'dependencies'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              Dependencies ({dependencies.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('timelogs')}
              className={`pb-2.5 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 flex-shrink-0 ${
                activeTab === 'timelogs'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Time Logs
            </button>
          </div>

          {/* 5. TAB PANES */}

          {/* TAB 1: DESCRIPTION & SPECS */}
          {activeTab === 'description' && (
            <div className="space-y-4 animate-in fade-in">
              {/* Description Toolbar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setDescViewMode('edit')}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                      descViewMode === 'edit'
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Edit Specification
                  </button>
                  <button
                    type="button"
                    onClick={() => setDescViewMode('preview')}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                      descViewMode === 'preview'
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Preview
                  </button>
                </div>

                {descViewMode === 'edit' && (
                  <div className="flex items-center gap-1 text-slate-400">
                    <button
                      type="button"
                      onClick={() => handleInsertMarkdown('**Bold Text**')}
                      className="p-1 rounded hover:bg-slate-800 hover:text-white"
                      title="Bold"
                    >
                      <Bold className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertMarkdown('_Italic Text_')}
                      className="p-1 rounded hover:bg-slate-800 hover:text-white"
                      title="Italic"
                    >
                      <Italic className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertMarkdown('- Item')}
                      className="p-1 rounded hover:bg-slate-800 hover:text-white"
                      title="Bullet List"
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertMarkdown('```ts\n// Code snippet\n```')}
                      className="p-1 rounded hover:bg-slate-800 hover:text-white"
                      title="Code Block"
                    >
                      <Code className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {descViewMode === 'edit' ? (
                <div className="space-y-1">
                  <textarea
                    rows={6}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide technical architecture, user stories, steps to reproduce, or acceptance criteria..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition font-sans leading-relaxed"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>Markdown formatting supported</span>
                    <span>{description.length} characters • {description.split(/\s+/).filter(Boolean).length} words</span>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 min-h-[140px] text-xs text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                  {description ? description : <span className="text-slate-500 italic">No description provided yet.</span>}
                </div>
              )}

              {/* Acceptance Criteria / DoD Checklist */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                    Acceptance Criteria & Definition of Done ({completedCriteria}/{acceptanceCriteria.length})
                  </span>
                  {acceptanceCriteria.length > 0 && (
                    <span className="text-[10px] font-mono text-slate-400">
                      {Math.round((completedCriteria / acceptanceCriteria.length) * 100)}% Complete
                    </span>
                  )}
                </div>

                <div className="space-y-1.5">
                  {acceptanceCriteria.map((crit) => (
                    <div
                      key={crit.id}
                      className="flex items-center justify-between p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl group hover:border-slate-700"
                    >
                      <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={crit.completed}
                          onChange={() => handleToggleCriterion(crit.id)}
                          className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
                        />
                        <span className={`text-xs ${crit.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                          {crit.text}
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handleRemoveCriterion(crit.id)}
                        className="text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 p-1 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddCriterion} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add an acceptance criterion or validation step..."
                    value={newCriterionText}
                    onChange={(e) => setNewCriterionText(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={!newCriterionText.trim()}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 transition text-xs font-semibold disabled:opacity-40"
                  >
                    Add
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: DETAILED SUBTASKS */}
          {activeTab === 'subtasks' && (
            <div className="space-y-4 animate-in fade-in">
              {/* Progress bar */}
              {subtasks.length > 0 && (
                <div className="space-y-1.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div className="flex justify-between text-xs text-slate-400 font-mono">
                    <span>Subtask Completion</span>
                    <span className="text-emerald-400 font-bold">
                      {completedSubtasks}/{subtasks.length} ({subtaskProgress}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-300"
                      style={{ width: `${subtaskProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Subtasks List */}
              <div className="space-y-2">
                {subtasks.map((st) => {
                  const isExpanded = expandedSubtaskId === st.id;
                  const descMode = subtaskDescModes[st.id] || 'edit';
                  const stAtts = st.attachments || [];
                  const stFields = st.customFields || {};
                  const fieldKeys = Object.keys(stFields);

                  return (
                    <div
                      key={st.id}
                      className="p-3 bg-slate-950 border border-slate-800 rounded-2xl group hover:border-slate-700 transition space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <label className="flex items-center gap-2 cursor-pointer min-w-0 flex-1">
                          <input
                            type="checkbox"
                            checked={st.completed}
                            onChange={() => handleToggleSubtask(st.id)}
                            className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
                          />
                          <span
                            className={`text-xs font-semibold truncate ${
                              st.completed ? 'line-through text-slate-500' : 'text-slate-200'
                            }`}
                          >
                            {st.title}
                          </span>

                          {/* Indicators for description, attachments, and custom fields */}
                          {st.description && (
                            <span
                              className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-950/60 text-indigo-400 border border-indigo-800/60 flex items-center gap-0.5 flex-shrink-0"
                              title="Has description"
                            >
                              <FileText className="w-2.5 h-2.5" />
                              <span className="hidden sm:inline">Desc</span>
                            </span>
                          )}

                          {stAtts.length > 0 && (
                            <span
                              className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 flex items-center gap-0.5 flex-shrink-0"
                              title={`${stAtts.length} attachment(s)`}
                            >
                              <Paperclip className="w-2.5 h-2.5" />
                              <span>{stAtts.length}</span>
                            </span>
                          )}

                          {fieldKeys.length > 0 && (
                            <span
                              className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-950/60 text-purple-400 border border-purple-800/60 flex items-center gap-0.5 flex-shrink-0"
                              title={`${fieldKeys.length} custom field(s)`}
                            >
                              <Tag className="w-2.5 h-2.5" />
                              <span>{fieldKeys.length}</span>
                            </span>
                          )}
                        </label>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {/* Priority Badge */}
                          {st.priority && (
                            <span
                              className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase font-bold hidden sm:inline-block ${
                                st.priority === 'urgent'
                                  ? 'bg-rose-950/60 text-rose-300 border-rose-800/60'
                                  : st.priority === 'high'
                                  ? 'bg-orange-950/60 text-orange-300 border-orange-800/60'
                                  : st.priority === 'medium'
                                  ? 'bg-blue-950/60 text-blue-300 border-blue-800/60'
                                  : 'bg-slate-800 text-slate-400 border-slate-700'
                              }`}
                            >
                              {st.priority}
                            </span>
                          )}

                          {/* Assignee Badge */}
                          {st.assigneeId && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
                              <User className="w-2.5 h-2.5 text-indigo-400" />
                              {st.assigneeId}
                            </span>
                          )}

                          {/* Expand details button */}
                          <button
                            type="button"
                            onClick={() => setExpandedSubtaskId(isExpanded ? null : st.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                            title="Edit subtask details, description, files and custom fields"
                          >
                            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRemoveSubtask(st.id)}
                            className="text-slate-500 hover:text-rose-400 p-1 transition"
                            title="Delete Subtask"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Expandable Subtask Detailed Panel */}
                      {isExpanded && (
                        <div className="pt-3 border-t border-slate-800/80 space-y-3.5 animate-in fade-in">
                          {/* 1. Subtask Description */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1">
                                <FileText className="w-3 h-3 text-indigo-400" />
                                Subtask Instructions & Description
                              </label>
                              <button
                                type="button"
                                onClick={() => handleToggleSubtaskDescMode(st.id)}
                                className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                              >
                                {descMode === 'preview' ? 'Edit Mode' : 'Preview'}
                              </button>
                            </div>

                            {descMode === 'edit' ? (
                              <textarea
                                rows={2}
                                value={st.description || ''}
                                onChange={(e) => handleUpdateSubtaskField(st.id, 'description', e.target.value)}
                                placeholder="Add technical specification, requirements, or steps for this subtask..."
                                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                              />
                            ) : (
                              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 min-h-[50px] text-xs text-slate-200 whitespace-pre-wrap font-sans">
                                {st.description || <span className="text-slate-500 italic">No description provided.</span>}
                              </div>
                            )}
                          </div>

                          {/* 2. Subtask Assignee, Priority & Due Date */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div>
                              <label className="text-[10px] font-mono uppercase text-slate-400">Assignee</label>
                              <select
                                value={st.assigneeId || ''}
                                onChange={(e) => handleUpdateSubtaskField(st.id, 'assigneeId', e.target.value)}
                                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-slate-200 focus:outline-none"
                              >
                                <option value="">Unassigned</option>
                                <option value="usr-admin-master">Admin Master</option>
                                <option value="usr-agent-sentinel">Sentinel Agent (AI)</option>
                                <option value="usr-agent-worker">Worker Agent (AI)</option>
                                <option value="usr-dev-alex">Alex Rivers</option>
                              </select>
                            </div>

                            <div>
                              <label className="text-[10px] font-mono uppercase text-slate-400">Priority</label>
                              <select
                                value={st.priority || 'medium'}
                                onChange={(e) => handleUpdateSubtaskField(st.id, 'priority', e.target.value as TaskPriority)}
                                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-slate-200 focus:outline-none capitalize"
                              >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                              </select>
                            </div>

                            <div>
                              <label className="text-[10px] font-mono uppercase text-slate-400">Target Date</label>
                              <input
                                type="date"
                                value={st.dueDate ? st.dueDate.split('T')[0] : ''}
                                onChange={(e) => handleUpdateSubtaskField(st.id, 'dueDate', e.target.value)}
                                className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-slate-200 font-mono focus:outline-none"
                              />
                            </div>
                          </div>

                          {/* 3. Subtask File Uploads */}
                          <div className="space-y-2 p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                                <Paperclip className="w-3 h-3 text-emerald-400" />
                                Subtask File Uploads ({stAtts.length})
                              </span>
                              <label className="px-2 py-0.5 rounded-lg bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white transition text-[10px] font-semibold cursor-pointer flex items-center gap-1 border border-indigo-500/30">
                                <UploadCloud className="w-3 h-3" />
                                <span>Attach File</span>
                                <input
                                  type="file"
                                  multiple
                                  onChange={(e) => handleSubtaskFileUpload(st.id, e.target.files)}
                                  className="hidden"
                                />
                              </label>
                            </div>

                            {stAtts.length > 0 ? (
                              <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar">
                                {stAtts.map((att) => (
                                  <div
                                    key={att.id}
                                    className="flex items-center justify-between p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs"
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <Paperclip className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                                      <span className="text-slate-200 truncate font-medium text-[11px]">{att.name}</span>
                                      <span className="text-[10px] font-mono text-slate-500">
                                        ({Math.round(att.size / 1024)} KB)
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                      {att.url && (
                                        <a
                                          href={att.url}
                                          download={att.name}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="p-1 text-slate-400 hover:text-indigo-300"
                                          title="Download File"
                                        >
                                          <Download className="w-3 h-3" />
                                        </a>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveSubtaskFile(st.id, att.id)}
                                        className="p-1 text-slate-500 hover:text-rose-400"
                                        title="Delete Attachment"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[11px] text-slate-500 italic">No files attached to this subtask yet.</p>
                            )}
                          </div>

                          {/* 4. Subtask Custom Fields */}
                          <div className="space-y-2 p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                                <Tag className="w-3 h-3 text-purple-400" />
                                Subtask Custom Fields ({fieldKeys.length})
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setIsAddingCustomFieldToSt(isAddingCustomFieldToSt === st.id ? null : st.id)
                                }
                                className="px-2 py-0.5 rounded-lg bg-purple-600/20 text-purple-400 hover:bg-purple-600 hover:text-white transition text-[10px] font-semibold flex items-center gap-1 border border-purple-500/30"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Add Field</span>
                              </button>
                            </div>

                            {/* Preset Quick Chips */}
                            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                              <span className="text-[10px] font-mono text-slate-500">Presets:</span>
                              <button
                                type="button"
                                onClick={() => handleSubtaskCustomFieldChange(st.id, 'storyPoints', 3)}
                                className="px-2 py-0.5 rounded-md text-[10px] bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700"
                              >
                                + Points (3)
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSubtaskCustomFieldChange(st.id, 'qaSignoff', true)}
                                className="px-2 py-0.5 rounded-md text-[10px] bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700"
                              >
                                + QA Done
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSubtaskCustomFieldChange(st.id, 'env', 'staging')}
                                className="px-2 py-0.5 rounded-md text-[10px] bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700"
                              >
                                + Staging
                              </button>
                            </div>

                            {/* Add Custom Field Inline Form */}
                            {isAddingCustomFieldToSt === st.id && (
                              <div className="p-2 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                  <input
                                    type="text"
                                    placeholder="Field Name (e.g. env)..."
                                    value={newStFieldKey}
                                    onChange={(e) => setNewStFieldKey(e.target.value)}
                                    className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200"
                                  />
                                  <input
                                    type="text"
                                    placeholder="Value (e.g. production)..."
                                    value={newStFieldVal}
                                    onChange={(e) => setNewStFieldVal(e.target.value)}
                                    className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200"
                                  />
                                </div>
                                <div className="flex justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setIsAddingCustomFieldToSt(null);
                                      setNewStFieldKey('');
                                      setNewStFieldVal('');
                                    }}
                                    className="px-2.5 py-1 text-[10px] rounded text-slate-400 hover:text-white"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (newStFieldKey.trim()) {
                                        handleSubtaskCustomFieldChange(st.id, newStFieldKey.trim(), newStFieldVal.trim());
                                        setNewStFieldKey('');
                                        setNewStFieldVal('');
                                        setIsAddingCustomFieldToSt(null);
                                      }
                                    }}
                                    className="px-2.5 py-1 text-[10px] font-semibold bg-indigo-600 text-white rounded hover:bg-indigo-500"
                                  >
                                    Save Field
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Render Custom Fields */}
                            {fieldKeys.length > 0 ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                {fieldKeys.map((k) => (
                                  <div
                                    key={k}
                                    className="flex items-center justify-between p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs"
                                  >
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <Tag className="w-2.5 h-2.5 text-purple-400 flex-shrink-0" />
                                      <span className="font-mono text-[10px] text-slate-400 capitalize">{k}:</span>
                                      <span className="font-semibold text-slate-200 truncate text-[11px]">
                                        {String(stFields[k])}
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveSubtaskCustomField(st.id, k)}
                                      className="text-slate-500 hover:text-rose-400 p-0.5 transition"
                                      title="Remove Custom Field"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[11px] text-slate-500 italic">No custom fields assigned to this subtask.</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Add New Detailed Subtask */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-indigo-400" />
                  Add New Subtask Step
                </span>

                <form onSubmit={handleAddSubtask} className="space-y-2.5">
                  <input
                    type="text"
                    placeholder="Subtask Title..."
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <textarea
                    rows={2}
                    placeholder="Subtask instructions & technical notes (optional)..."
                    value={newSubtaskDesc}
                    onChange={(e) => setNewSubtaskDesc(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />

                  {/* Priority, Assignee & Due Date Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <select
                      value={newSubtaskAssignee}
                      onChange={(e) => setNewSubtaskAssignee(e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
                    >
                      <option value="">Assignee (Optional)</option>
                      <option value="usr-admin-master">Admin Master</option>
                      <option value="usr-agent-sentinel">Sentinel Agent (AI)</option>
                      <option value="usr-agent-worker">Worker Agent (AI)</option>
                      <option value="usr-dev-alex">Alex Rivers</option>
                    </select>

                    <select
                      value={newSubtaskPriority}
                      onChange={(e) => setNewSubtaskPriority(e.target.value as TaskPriority)}
                      className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none capitalize"
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                      <option value="urgent">Urgent Priority</option>
                    </select>

                    <input
                      type="date"
                      value={newSubtaskDueDate}
                      onChange={(e) => setNewSubtaskDueDate(e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 font-mono focus:outline-none"
                    />
                  </div>

                  {/* Initial Files Dropzone */}
                  <div className="flex items-center justify-between gap-2 p-2 bg-slate-900 border border-slate-800 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Paperclip className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-[11px] text-slate-300">
                        {newSubtaskAttachments.length > 0
                          ? `${newSubtaskAttachments.length} file(s) queued for this subtask`
                          : 'Attach files to subtask'}
                      </span>
                    </div>
                    <label className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white cursor-pointer text-[10px] font-semibold border border-slate-700 flex items-center gap-1">
                      <UploadCloud className="w-3 h-3" />
                      <span>Select Files</span>
                      <input
                        type="file"
                        multiple
                        onChange={(e) => handleNewSubtaskFiles(e.target.files)}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={!newSubtaskTitle.trim()}
                      className="px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition text-xs font-semibold disabled:opacity-40 shadow-sm"
                    >
                      Create Subtask Step
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 3: FILE UPLOADS & ATTACHMENTS */}
          {activeTab === 'attachments' && (
            <div className="animate-in fade-in">
              <TaskAttachmentsPanel
                attachments={attachments}
                onChange={setAttachments}
              />
            </div>
          )}

          {/* TAB 4: CUSTOM FIELDS */}
          {activeTab === 'customfields' && (
            <div className="animate-in fade-in">
              <CustomFieldsPanel customFields={customFields} onChange={setCustomFields} />
            </div>
          )}

          {/* TAB 5: DEPENDENCIES */}
          {activeTab === 'dependencies' && (
            <div className="animate-in fade-in">
              <TaskDependenciesPanel
                currentTaskId={currentTask.id}
                dependencies={dependencies}
                allTasks={allProjectTasks}
                onChange={setDependencies}
              />
            </div>
          )}

          {/* TAB 6: TIME TRACKING */}
          {activeTab === 'timelogs' && (
            <div className="space-y-4 animate-in fade-in">
              <TimeTrackerWidget
                task={currentTask}
                onTimeLogAdded={(log: TimeLog) => {
                  setTimeLogs([...timeLogs, log]);
                  setCurrentTask({
                    ...currentTask,
                    actualHours: (currentTask.actualHours || 0) + log.hoursLogged,
                  });
                }}
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/90 backdrop-blur flex items-center justify-between">
          {onDeleteTask ? (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Delete this task node permanently?')) {
                  onDeleteTask(currentTask.id);
                  onClose();
                }
              }}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/40 transition flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Task</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveTask}
              disabled={isSaving}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 shadow-md shadow-indigo-500/20 flex items-center gap-2 transition disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recurrence Rule Modal */}
      <AdvancedRecurrenceModal
        isOpen={isRecurrenceModalOpen}
        onClose={() => setIsRecurrenceModalOpen(false)}
        config={advancedRecurrence}
        onChange={setAdvancedRecurrence}
      />
    </div>
  );
};

export default TaskDetailDrawer;
