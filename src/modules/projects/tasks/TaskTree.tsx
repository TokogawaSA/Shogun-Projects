/**
 * Hierarchical Task Tree Component (Recursive parentTaskId tree)
 * Multi-Tenant Antigravity 2.0 Ecosystem
 * Enhanced with Project Overview Metrics, Rich Task Creation & Deep Tree Navigation
 */

import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  FolderTree, 
  Search,
  Briefcase,
  Clock,
  RefreshCw,
  Sparkles,
  Bot,
  Paperclip,
  Tag,
  X,
  Upload,
} from 'lucide-react';
import { SubTaskItem, SubTaskTreeNode } from './SubTaskItem';
import { TaskDetailDrawer } from './TaskDetailDrawer';
import { Task, TaskStatus, TaskPriority, TaskAttachment } from '../../../types';
import { apiClient } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { useProject } from '../../../context/ProjectContext';

interface TaskTreeProps {
  tasks: Task[];
  projectId?: string;
  onRefresh?: () => void;
}

export const TaskTree: React.FC<TaskTreeProps> = ({
  tasks,
  projectId = 'proj-shogun-1',
  onRefresh,
}) => {
  const { user } = useAuth();
  const { projects } = useProject();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  // New Task Modal / Quick Add
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('');
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium');
  const [newAssigneeId, setNewAssigneeId] = useState<string>('usr-admin-master');
  const [newDueDate, setNewDueDate] = useState<string>('');
  const [newEstimatedHours, setNewEstimatedHours] = useState<number>(4);
  const [targetParentTaskId, setTargetParentTaskId] = useState<string | null>(null);
  const [newAttachments, setNewAttachments] = useState<TaskAttachment[]>([]);
  const [newCustomFields, setNewCustomFields] = useState<Record<string, any>>({});
  const [customKey, setCustomKey] = useState<string>('');
  const [customVal, setCustomVal] = useState<string>('');

  // Current Project Information
  const currentProject = projects.find((p) => p.id === projectId) || projects[0];

  // Rollup Metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'done').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length;
  const totalEstimatedHours = tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
  const totalActualHours = tasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Transform flat tasks into a recursive tree using parentTaskId
  const treeNodes = useMemo(() => {
    const taskMap = new Map<string, SubTaskTreeNode>();
    const roots: SubTaskTreeNode[] = [];

    // Filter tasks if search or status filter is active
    const filtered = tasks.filter((t) => {
      const matchSearch =
        !searchQuery ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'all' || t.status === statusFilter;
      return matchSearch && matchStatus;
    });

    filtered.forEach((t) => {
      taskMap.set(t.id, { ...t, children: [] });
    });

    filtered.forEach((t) => {
      const node = taskMap.get(t.id);
      if (!node) return;

      if (t.parentTaskId && taskMap.has(t.parentTaskId)) {
        const parent = taskMap.get(t.parentTaskId);
        parent?.children?.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }, [tasks, searchQuery, statusFilter]);

  const handleSelectTask = (task: Task) => {
    setSelectedTask(task);
    setIsDrawerOpen(true);
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await apiClient.put(`/projects/tasks/${taskId}`, {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
      if (onRefresh) onRefresh();
    } catch {
      // Optimistic fallback
    }
  };

  const handleAddChildTaskTrigger = (parentTaskId: string) => {
    setTargetParentTaskId(parentTaskId);
    setIsAddModalOpen(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Are you sure you want to delete this task node and its children?')) return;
    try {
      await apiClient.delete(`/projects/tasks/${taskId}`);
      if (onRefresh) onRefresh();
    } catch {
      // Optimistic fallback
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const taskId = `TSK-${Date.now().toString(36).toUpperCase()}`;
    const nowIso = new Date().toISOString();

    const isAi = newAssigneeId.startsWith('usr-agent');
    const assignedAgent = isAi
      ? newAssigneeId.includes('sentinel')
        ? 'Sentinel'
        : 'Worker'
      : 'None';

    const taskData: Partial<Task> = {
      id: taskId,
      projectId,
      title: newTitle.trim(),
      description: newDescription.trim() || (targetParentTaskId ? `Sub-task child of ${targetParentTaskId}` : ''),
      status: 'todo',
      priority: newPriority,
      creatorId: user?.uid || 'usr-admin-master',
      assigneeId: newAssigneeId || undefined,
      assignedAgent,
      dueDate: newDueDate || undefined,
      parentTaskId: targetParentTaskId || null,
      estimatedHours: newEstimatedHours,
      actualHours: 0,
      subtasks: [],
      attachments: newAttachments,
      customFields: newCustomFields,
      timeLogs: [],
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    try {
      await apiClient.post('/projects/tasks', taskData);
      if (onRefresh) onRefresh();
    } catch {
      // Optimistic fallback
    }

    setIsAddModalOpen(false);
    setNewTitle('');
    setNewDescription('');
    setNewDueDate('');
    setNewAttachments([]);
    setNewCustomFields({});
    setTargetParentTaskId(null);
  };

  return (
    <div className="space-y-4">
      {/* 1. GENERAL PROJECT INFORMATION CARD */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-indigo-950/40 border border-slate-800 shadow-xl space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 flex-shrink-0 mt-0.5">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-bold text-slate-100">
                  {currentProject?.title || 'Antigravity 2.0 Integration Hub'}
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                  {projectId}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Active Execution
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                {currentProject?.description || 'Centralized multi-agent orchestration, WBS hierarchy, and task tracking engine.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                title="Refresh tasks"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => {
                setTargetParentTaskId(null);
                setIsAddModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-500/20 transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create Task</span>
            </button>
          </div>
        </div>

        {/* Key Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-800/80">
          <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[10px] font-mono text-slate-500 uppercase">Tasks Progress</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs font-bold text-slate-200">{completedTasks} / {totalTasks} Done</span>
              <span className="text-xs font-mono font-semibold text-emerald-400">{completionRate}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden mt-1.5">
              <div className="h-full bg-emerald-500" style={{ width: `${completionRate}%` }} />
            </div>
          </div>

          <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[10px] font-mono text-slate-500 uppercase">Hours Tracked</span>
            <div className="flex items-center gap-1.5 mt-1">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-xs font-bold text-slate-200 font-mono">{totalActualHours}h</span>
              <span className="text-[10px] text-slate-500 font-mono">/ {totalEstimatedHours}h budget</span>
            </div>
          </div>

          <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[10px] font-mono text-slate-500 uppercase">In-Flight Tasks</span>
            <div className="flex items-center gap-1.5 mt-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-bold text-slate-200 font-mono">{inProgressTasks} In Progress</span>
            </div>
          </div>

          <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[10px] font-mono text-slate-500 uppercase">Ecosystem Agents</span>
            <div className="flex items-center gap-1.5 mt-1">
              <Bot className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-xs font-bold text-purple-300 font-mono">Sentinel & Worker Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SEARCH & FILTER TOOLBAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tree tasks, IDs, specs, or subtasks..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs font-semibold"
          >
            <option value="all">All Statuses</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="review">Review</option>
            <option value="done">Done</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-mono">
            {treeNodes.length} Root Nodes • {totalTasks} Total Tasks
          </span>
        </div>
      </div>

      {/* 3. RECURSIVE TASK TREE CONTAINER */}
      <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-xl space-y-2 min-h-[320px]">
        {treeNodes.length === 0 ? (
          <div className="py-14 text-center text-slate-500 space-y-2.5">
            <FolderTree className="w-10 h-10 mx-auto text-slate-600" />
            <p className="font-semibold text-slate-300 text-xs">No tasks found matching criteria</p>
            <p className="text-[11px] text-slate-500 max-w-md mx-auto">
              Create a root task or child subtask to populate this project WBS tree hierarchy.
            </p>
            <button
              onClick={() => {
                setTargetParentTaskId(null);
                setIsAddModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-300 bg-indigo-950/60 border border-indigo-800/60 hover:bg-indigo-900/60 transition"
            >
              + Create First Root Task
            </button>
          </div>
        ) : (
          treeNodes.map((node) => (
            <SubTaskItem
              key={node.id}
              node={node}
              level={0}
              onSelectTask={handleSelectTask}
              onStatusChange={handleStatusChange}
              onAddChildTask={handleAddChildTaskTrigger}
              onDeleteTask={handleDeleteTask}
            />
          ))
        )}
      </div>

      {/* 4. TASK DETAIL DRAWER */}
      <TaskDetailDrawer
        task={selectedTask}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedTask(null);
        }}
        onUpdateTask={(updated) => {
          setSelectedTask(updated);
          if (onRefresh) onRefresh();
        }}
        onDeleteTask={handleDeleteTask}
        allProjectTasks={tasks}
      />

      {/* 5. DETAILED ADD TASK MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">
                    {targetParentTaskId ? `Add Child Sub-Task` : 'Create New Root Task'}
                  </h3>
                  {targetParentTaskId && (
                    <span className="text-[10px] font-mono text-indigo-400">
                      Parent ID: {targetParentTaskId}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3.5 text-xs">
              {/* Title */}
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Task Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Implement Kafka Producer Pipeline"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Technical Specifications & Description
                </label>
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Describe scope, inputs, required deliverables or acceptance criteria..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                />
              </div>

              {/* Assignee & Priority */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Assignment</label>
                  <select
                    value={newAssigneeId}
                    onChange={(e) => setNewAssigneeId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100"
                  >
                    <option value="usr-admin-master">Admin Master (Lead)</option>
                    <option value="usr-agent-sentinel">Sentinel Agent (AI)</option>
                    <option value="usr-agent-worker">Worker Agent (AI)</option>
                    <option value="usr-agent-auditor">Auditor Agent (AI)</option>
                    <option value="usr-dev-alex">Alex Rivers</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 capitalize"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              {/* Estimated Hours & Due Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Estimated Hours</label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={newEstimatedHours}
                    onChange={(e) => setNewEstimatedHours(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-mono"
                  />
                </div>
              </div>

              {/* File Uploads */}
              <div>
                <label className="block text-slate-300 font-medium mb-1 flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Attachments & Documents</span>
                </label>
                <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-xl p-3 text-center transition bg-slate-950/50">
                  <input
                    type="file"
                    multiple
                    id="tree-file-upload"
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      files.forEach((file) => {
                        const reader = new FileReader();
                        reader.onload = () => {
                          setNewAttachments((prev) => [
                            ...prev,
                            {
                              id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                              name: file.name,
                              url: reader.result as string,
                              size: file.size,
                              type: file.type || 'application/octet-stream',
                              uploadedAt: new Date().toISOString(),
                              uploadedBy: user?.uid || 'usr-admin-master',
                            },
                          ]);
                        };
                        reader.readAsDataURL(file);
                      });
                    }}
                  />
                  <label
                    htmlFor="tree-file-upload"
                    className="cursor-pointer flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-indigo-300"
                  >
                    <Upload className="w-5 h-5 text-indigo-400" />
                    <span className="text-[11px] font-medium">Click to upload files</span>
                    <span className="text-[10px] text-slate-500">PDF, images, spreadsheets, archives</span>
                  </label>
                </div>

                {newAttachments.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {newAttachments.map((f, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-200"
                      >
                        <span className="truncate max-w-[220px]">{f.name}</span>
                        <button
                          type="button"
                          onClick={() => setNewAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                          className="p-0.5 text-slate-400 hover:text-rose-400"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Custom Fields */}
              <div>
                <label className="block text-slate-300 font-medium mb-1 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-purple-400" />
                  <span>Custom Metadata Fields</span>
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={customKey}
                    onChange={(e) => setCustomKey(e.target.value)}
                    placeholder="Field name (e.g. storyPoints)"
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs"
                  />
                  <input
                    type="text"
                    value={customVal}
                    onChange={(e) => setCustomVal(e.target.value)}
                    placeholder="Value (e.g. 5)"
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!customKey.trim()) return;
                      setNewCustomFields((prev) => ({
                        ...prev,
                        [customKey.trim()]: customVal.trim(),
                      }));
                      setCustomKey('');
                      setCustomVal('');
                    }}
                    className="px-3 py-1 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 border border-purple-500/40 font-medium transition text-xs"
                  >
                    Add
                  </button>
                </div>

                {Object.keys(newCustomFields).length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(newCustomFields).map(([k, v]) => (
                      <span
                        key={k}
                        className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-purple-500/15 border border-purple-500/30 text-[10px] text-purple-300"
                      >
                        <strong>{k}:</strong> {String(v)}
                        <button
                          type="button"
                          onClick={() =>
                            setNewCustomFields((prev) => {
                              const copy = { ...prev };
                              delete copy[k];
                              return copy;
                            })
                          }
                          className="hover:text-rose-400"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-white font-semibold bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-500/20 transition flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Task Node</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskTree;
