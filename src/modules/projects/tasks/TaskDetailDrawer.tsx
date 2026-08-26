/**
 * Comprehensive Task Detail Workspace & Side Drawer
 * Multi-Tenant Antigravity 2.0 Ecosystem
 */

import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  Clock, 
  Layers, 
  Repeat, 
  Network, 
  Plus, 
  Trash2, 
  Save, 
  DollarSign, 
  Activity, 
  ListChecks 
} from 'lucide-react';
import { apiClient } from '../../../services/api';
import { useCatalog } from '../../catalog/hooks/useCatalog';
import { Task, SubTask, TaskPriority, TaskStatus, TimeLog, ProjectMilestone, RecurrenceRule } from '../../../types';
import { TimeTrackerWidget } from './TimeTrackerWidget';

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
  allProjectTasks = [],
}) => {
  const { items: catalogItems } = useCatalog();

  const [currentTask, setCurrentTask] = useState<Task | null>(task);
  const [activeTab, setActiveTab] = useState<'subtasks' | 'timelogs' | 'dependencies' | 'activity'>('subtasks');

  // Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [estimatedHours, setEstimatedHours] = useState<number>(0);
  const [milestoneId, setMilestoneId] = useState<string>('');
  const [lineItemId, setLineItemId] = useState<string>('');
  const [predecessorIds, setPredecessorIds] = useState<string[]>([]);
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule>('weekly');

  // Subtasks & TimeLogs
  const [subtasks, setSubtasks] = useState<SubTask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (task) {
      setCurrentTask(task);
      setTitle(task.title || '');
      setDescription(task.description || '');
      setStatus(task.status || 'todo');
      setPriority(task.priority || 'medium');
      setAssigneeId(task.assigneeId || '');
      setDueDate(task.dueDate || '');
      setEstimatedHours(task.estimatedHours || 0);
      setMilestoneId(task.milestoneId || '');
      setLineItemId(task.lineItemId || '');
      setPredecessorIds(task.predecessorTaskIds || []);
      setIsRecurring(!!task.isRecurring);
      setRecurrenceRule(task.recurrenceRule || 'weekly');
      setSubtasks(task.subtasks || []);
      setTimeLogs(task.timeLogs || []);

      // Fetch milestones
      if (task.projectId) {
        apiClient.get<ProjectMilestone[]>(`/projects/${task.projectId}/milestones`)
          .then((res) => {
            if (Array.isArray(res)) {
              setMilestones(res);
            }
          })
          .catch(() => {});
      }
    }
  }, [task]);

  if (!isOpen || !currentTask) return null;

  const handleSaveTask = async () => {
    setIsSaving(true);
    const updated: Task = {
      ...currentTask,
      title,
      description,
      status,
      priority,
      assigneeId,
      dueDate,
      estimatedHours,
      milestoneId: milestoneId || null,
      lineItemId: lineItemId || null,
      predecessorTaskIds: predecessorIds,
      isRecurring,
      recurrenceRule: isRecurring ? recurrenceRule : undefined,
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
          assigneeId,
          dueDate,
          estimatedHours,
          milestoneId: milestoneId || null,
          lineItemId: lineItemId || null,
          predecessorTaskIds: predecessorIds,
          isRecurring,
          recurrenceRule: isRecurring ? recurrenceRule : null,
          subtasks,
          updatedAt: new Date().toISOString(),
        });
      }

      if (onUpdateTask) {
        onUpdateTask(updated);
      }
      setSaveSuccess('Task parameters updated successfully.');
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (e: any) {
      console.warn('[TaskDetailDrawer] Save note:', e);
      if (onUpdateTask) onUpdateTask(updated);
      setSaveSuccess('Task updated (optimistic).');
      setTimeout(() => setSaveSuccess(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    const newSt: SubTask = {
      id: `st-${Date.now().toString(36)}`,
      title: newSubtaskTitle.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
    };
    setSubtasks((prev) => [...prev, newSt]);
    setNewSubtaskTitle('');
  };

  const handleToggleSubtask = (stId: string) => {
    setSubtasks((prev) =>
      prev.map((s) => (s.id === stId ? { ...s, completed: !s.completed } : s))
    );
  };

  const handleDeleteSubtask = (stId: string) => {
    setSubtasks((prev) => prev.filter((s) => s.id !== stId));
  };

  const handleTimeLogAdded = (log: TimeLog) => {
    setTimeLogs((prev) => [log, ...prev]);
    const addedHours = log.hoursLogged || 0;
    const newActual = Number(((currentTask.actualHours || 0) + addedHours).toFixed(2));
    setCurrentTask((prev) => (prev ? { ...prev, actualHours: newActual } : prev));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/75 backdrop-blur-sm animate-fade-in flex justify-end">
      <div className="w-full max-w-2xl bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 backdrop-blur-md">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
              {currentTask.id}
            </span>
            <span className="text-xs text-slate-400 font-mono">Task Workspace</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveTask}
              disabled={isSaving}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {saveSuccess && (
          <div className="px-5 py-2 bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{saveSuccess}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Main Title & Description */}
          <div className="space-y-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task Summary Title"
              className="w-full text-base font-bold text-slate-100 bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Detailed acceptance criteria, deliverables, technical instructions..."
              className="w-full text-xs text-slate-200 bg-slate-800/60 border border-slate-700 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
            />
          </div>

          {/* Key Attributes Matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs">
            <div>
              <label className="block text-[10px] uppercase font-mono text-slate-400 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Under Review</option>
                <option value="done">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-mono text-slate-400 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs capitalize"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-mono text-slate-400 mb-1">Assignee</label>
              <input
                type="text"
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                placeholder="Agent / User"
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-mono text-slate-400 mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs font-mono"
              />
            </div>
          </div>

          {/* Time Tracking Widget */}
          <TimeTrackerWidget
            task={{ ...currentTask, actualHours: currentTask.actualHours, estimatedHours }}
            onTimeLogAdded={handleTimeLogAdded}
          />

          {/* Scope, Milestone & Linkage Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs">
            {/* Milestone Assignment */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 font-mono mb-1 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                Project Milestone
              </label>
              <select
                value={milestoneId}
                onChange={(e) => setMilestoneId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">No Milestone Linked</option>
                {milestones.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title} ({m.status})
                  </option>
                ))}
              </select>
            </div>

            {/* Catalog Deliverable Linkage */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 font-mono mb-1 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                Quoted Catalog Deliverable
              </label>
              <select
                value={lineItemId}
                onChange={(e) => setLineItemId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">No Catalog Deliverable Linked</option>
                {catalogItems.map((c) => (
                  <option key={c.id} value={c.id}>
                    [{c.type.toUpperCase()}] {c.name} (${c.unitPrice})
                  </option>
                ))}
              </select>
            </div>

            {/* Estimated Budget Hours */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 font-mono mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                Estimated Scope Hours
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs font-mono focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Recurrence Rule */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-slate-300 font-semibold font-mono flex items-center gap-1">
                  <Repeat className="w-3.5 h-3.5 text-violet-400" />
                  Recurring Task
                </span>
              </label>

              {isRecurring && (
                <select
                  value={recurrenceRule}
                  onChange={(e) => setRecurrenceRule(e.target.value as RecurrenceRule)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs font-mono"
                >
                  <option value="daily">Daily Auto-Generation</option>
                  <option value="weekly">Weekly Auto-Generation</option>
                  <option value="monthly">Monthly Auto-Generation</option>
                </select>
              )}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-slate-800 flex items-center gap-4 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('subtasks')}
              className={`pb-2 border-b-2 transition flex items-center gap-1.5 ${
                activeTab === 'subtasks'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <ListChecks className="w-4 h-4" />
              Sub-Tasks ({subtasks.length})
            </button>

            <button
              onClick={() => setActiveTab('timelogs')}
              className={`pb-2 border-b-2 transition flex items-center gap-1.5 ${
                activeTab === 'timelogs'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Clock className="w-4 h-4" />
              Time Logs ({timeLogs.length})
            </button>

            <button
              onClick={() => setActiveTab('dependencies')}
              className={`pb-2 border-b-2 transition flex items-center gap-1.5 ${
                activeTab === 'dependencies'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Network className="w-4 h-4" />
              Dependencies ({predecessorIds.length})
            </button>

            <button
              onClick={() => setActiveTab('activity')}
              className={`pb-2 border-b-2 transition flex items-center gap-1.5 ${
                activeTab === 'activity'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-4 h-4" />
              Activity
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'subtasks' && (
            <div className="space-y-3">
              {/* Add Subtask Input */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                  placeholder="Add a subtask checklist item..."
                  className="flex-1 px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleAddSubtask}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>

              {/* Subtask list */}
              <div className="space-y-2 divide-y divide-slate-800/60">
                {subtasks.map((st) => (
                  <div
                    key={st.id}
                    className="pt-2 flex items-center justify-between gap-3 text-xs group"
                  >
                    <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={st.completed}
                        onChange={() => handleToggleSubtask(st.id)}
                        className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-emerald-500"
                      />
                      <span
                        className={`truncate ${
                          st.completed ? 'line-through text-slate-500' : 'text-slate-200'
                        }`}
                      >
                        {st.title}
                      </span>
                    </label>

                    <button
                      onClick={() => handleDeleteSubtask(st.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'timelogs' && (
            <div className="space-y-3">
              {timeLogs.length === 0 ? (
                <p className="text-center text-slate-500 text-xs py-6">
                  No individual time logs recorded yet. Use the timer above to log work sessions.
                </p>
              ) : (
                <div className="divide-y divide-slate-800 text-xs font-mono">
                  {timeLogs.map((tl) => (
                    <div key={tl.id} className="py-2.5 flex items-center justify-between gap-4">
                      <div>
                        <div className="font-bold text-slate-200">{tl.description}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {tl.date} • by {tl.userName || tl.userId}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-bold text-indigo-400">{tl.hoursLogged}h</div>
                        {tl.isBillable && (
                          <div className="text-[10px] text-emerald-400">
                            ${((tl.hourlyRate || 0) * tl.hoursLogged).toLocaleString()} Billable
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'dependencies' && (
            <div className="space-y-3 text-xs">
              <label className="block text-slate-400">
                Predecessor Tasks (must be completed before starting this task):
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto p-2 rounded-xl bg-slate-950 border border-slate-800">
                {allProjectTasks
                  .filter((t) => t.id !== currentTask.id)
                  .map((t) => (
                    <label
                      key={t.id}
                      className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-900 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={predecessorIds.includes(t.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPredecessorIds([...predecessorIds, t.id]);
                          } else {
                            setPredecessorIds(predecessorIds.filter((id) => id !== t.id));
                          }
                        }}
                        className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-slate-300 font-semibold">{t.title}</span>
                      <span className="text-[10px] font-mono text-slate-500">({t.status})</span>
                    </label>
                  ))}
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-2 text-xs text-slate-400 font-mono py-2">
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                Task created at {currentTask.createdAt || 'N/A'} by {currentTask.creatorId || 'Admin'}
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                Last updated at {currentTask.updatedAt || 'N/A'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default TaskDetailDrawer;
