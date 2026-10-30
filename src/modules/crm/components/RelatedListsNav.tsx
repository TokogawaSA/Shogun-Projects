/**
 * Related Lists Sub-Panel Navigation & Linked Collections Viewer (VTiger-Style)
 * Manages Sub-Panel tabs: Summary, Details, Projects, Tasks, Activity Stream.
 * Renders embedded Linked Projects table and Linked Tasks checklists.
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { EntityModuleName } from '../../../types/crmEntities';
import {
  Layers,
  CheckSquare,
  Activity,
  Plus,
  ExternalLink,
  Square,
  Check,
  Calendar,
  LayoutGrid,
  FileText,
  Radio,
} from 'lucide-react';
import { ContextualBookingsPanel } from '../../scheduler/components/ContextualBookingsPanel';

export type SubPanelTab = 'summary' | 'details' | 'projects' | 'tasks' | 'activities' | 'social' | 'bookings';

export interface RelatedListsNavProps {
  moduleName: EntityModuleName;
  recordId: string;
  record: Record<string, any>;
  activeTab: SubPanelTab;
  onTabChange: (tab: SubPanelTab) => void;
  className?: string;
}

export const RelatedListsNav: React.FC<RelatedListsNavProps> = ({
  moduleName,
  recordId,
  record,
  activeTab,
  onTabChange,
  className = '',
}) => {
  const { user } = useAuth();
  const tenantId = user?.tenantId || 'tenant-default';
  const navigate = useNavigate();

  // Linked Data States
  const [linkedProjects, setLinkedProjects] = useState<any[]>([]);
  const [linkedTasks, setLinkedTasks] = useState<any[]>([]);
  const [socialInteractions, setSocialInteractions] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [loadingSocial, setLoadingSocial] = useState(false);

  // New Task Form Drawer / Inline Modal
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [isSavingTask, setIsSavingTask] = useState(false);

  // Fetch Linked Social Interactions
  useEffect(() => {
    if (!recordId) return;
    const filterParam = moduleName === 'contacts' ? { contactId: recordId } : { accountId: recordId };
    setLoadingSocial(true);
    apiClient
      .get<any>('/v1/social/interactions', { params: filterParam })
      .then((res) => {
        setSocialInteractions(res?.data || []);
      })
      .catch(() => setSocialInteractions([]))
      .finally(() => setLoadingSocial(false));
  }, [recordId, moduleName]);

  // 1. Fetch Linked Projects
  useEffect(() => {
    if (!recordId) return;
    setLoadingProjects(true);

    const loadProjects = async () => {
      try {
        const list = await apiClient.get<any[]>('/projects').catch(() => []);
        if (Array.isArray(list)) {
          const matching = list.filter((p: any) => {
            if (moduleName === 'accounts') {
              return p.accountId === recordId || p.organizationId === recordId;
            }
            if (moduleName === 'deals') {
              return p.dealId === recordId || p.id === record.linkedProjectId;
            }
            if (moduleName === 'contacts') {
              return p.primaryContactId === recordId || p.accountId === record.accountId;
            }
            return false;
          });
          setLinkedProjects(matching);
        }
      } catch (err) {
        console.warn('[RelatedListsNav] Projects query fallback:', err);
        setLinkedProjects([]);
      } finally {
        setLoadingProjects(false);
      }
    };

    loadProjects();
  }, [moduleName, recordId, record.accountId, record.linkedProjectId]);

  // 2. Fetch Linked Tasks
  useEffect(() => {
    if (!recordId) return;
    setLoadingTasks(true);

    const loadTasks = async () => {
      try {
        const list = await apiClient.get<any[]>('/projects/tasks/all').catch(() => []);
        if (Array.isArray(list)) {
          const matched = list.filter((t: any) => t.relatedEntityId === recordId || t.accountId === recordId);
          setLinkedTasks(matched);
        }
      } catch {
        setLinkedTasks([]);
      } finally {
        setLoadingTasks(false);
      }
    };

    loadTasks();
  }, [recordId, tenantId]);

  // Toggle Task Completion
  const handleToggleTaskStatus = async (taskId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'done' ? 'todo' : 'done';
    setLinkedTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: nextStatus } : t))
    );

    try {
      await apiClient.put(`/projects/tasks/${taskId}`, {
        status: nextStatus,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('[RelatedListsNav] Task status toggle error:', err);
    }
  };

  // Create Linked Task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || isSavingTask) return;

    setIsSavingTask(true);
    const newTaskId = `TSK-${Date.now().toString(36)}`;
    const newTask = {
      id: newTaskId,
      title: taskTitle.trim(),
      priority: taskPriority,
      status: 'todo',
      dueDate: taskDueDate || null,
      tenantId,
      relatedEntityType: moduleName,
      relatedEntityId: recordId,
      accountId: moduleName === 'accounts' ? recordId : record.accountId || null,
      contactId: moduleName === 'contacts' ? recordId : record.contactId || null,
      dealId: moduleName === 'deals' ? recordId : null,
      creatorId: user?.uid || 'usr-admin',
      assigneeId: record.assignedUserId || user?.uid || 'usr-admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await apiClient.post('/projects/tasks', newTask);
      setLinkedTasks((prev) => [newTask, ...prev]);
      setTaskTitle('');
      setTaskDueDate('');
      setIsTaskModalOpen(false);
    } catch (err) {
      console.error('[RelatedListsNav] Task creation error:', err);
    } finally {
      setIsSavingTask(false);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 1. Sub-Panel Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto select-none">
        <button
          onClick={() => onTabChange('summary')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'summary'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          Summary
        </button>

        <button
          onClick={() => onTabChange('details')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'details'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Details & Layout Blocks
        </button>

        <button
          onClick={() => onTabChange('projects')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'projects'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Linked Projects
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              activeTab === 'projects'
                ? 'bg-white/20 text-white'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {linkedProjects.length}
          </span>
        </button>

        <button
          onClick={() => onTabChange('tasks')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'tasks'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <CheckSquare className="w-3.5 h-3.5" />
          Tasks & Reminders
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              activeTab === 'tasks'
                ? 'bg-white/20 text-white'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {linkedTasks.length}
          </span>
        </button>

        <button
          onClick={() => onTabChange('activities')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'activities'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          Activity Stream
        </button>

        <button
          onClick={() => onTabChange('social')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'social'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          Social Activity
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              activeTab === 'social'
                ? 'bg-white/20 text-white'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {socialInteractions.length}
          </span>
        </button>

        <button
          onClick={() => onTabChange('bookings')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'bookings'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          Bookings & Meetings
        </button>
      </div>

      {/* 2. Projects Sub-Panel Content */}
      {activeTab === 'projects' && (
        <div className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-6 shadow-xl space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Linked Projects</h3>
              <p className="text-xs text-slate-400">
                Delivery and execution workspaces affiliated with this {moduleName.slice(0, -1)}.
              </p>
            </div>
            <button
              onClick={() => navigate('/projects')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              New Project
            </button>
          </div>

          {loadingProjects ? (
            <div className="py-8 text-center text-xs text-slate-500">Loading projects...</div>
          ) : linkedProjects.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <Layers className="w-8 h-8 opacity-40 mx-auto" />
              <p className="text-xs text-slate-400 font-medium">No linked delivery projects found.</p>
              <p className="text-[11px] text-slate-500">
                Provision a new project from Closed-Won deals or link existing projects.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="border-b border-slate-800 text-slate-400 select-none">
                  <tr>
                    <th className="py-2.5 px-3">Project Title</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Created</th>
                    <th className="py-2.5 px-3 text-right">View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {linkedProjects.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 font-medium text-indigo-300">
                        <Link to={`/projects/${p.id}`} className="hover:underline flex items-center gap-1.5">
                          <span>{p.title || 'Untitled Project'}</span>
                        </Link>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[11px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                          Active
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-400">
                        {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link
                          to={`/projects/${p.id}`}
                          className="p-1 text-slate-400 hover:text-indigo-400 transition-colors inline-block"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 3. Tasks Sub-Panel Content */}
      {activeTab === 'tasks' && (
        <div className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-6 shadow-xl space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Tasks & Reminders</h3>
              <p className="text-xs text-slate-400">
                Action items and follow-ups associated with this record.
              </p>
            </div>
            <button
              onClick={() => setIsTaskModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Task
            </button>
          </div>

          {loadingTasks ? (
            <div className="py-8 text-center text-xs text-slate-500">Loading tasks...</div>
          ) : linkedTasks.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <CheckSquare className="w-8 h-8 opacity-40 mx-auto" />
              <p className="text-xs text-slate-400 font-medium">No tasks recorded for this entity.</p>
              <p className="text-[11px] text-slate-500">Click &quot;Add Task&quot; above to schedule a follow-up.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {linkedTasks.map((t) => {
                const isDone = t.status === 'done';
                return (
                  <div
                    key={t.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      isDone
                        ? 'bg-slate-950/30 border-slate-800/40 opacity-60'
                        : 'bg-slate-950/60 border-slate-800 hover:border-indigo-500/40'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => handleToggleTaskStatus(t.id, t.status)}
                        className="text-slate-400 hover:text-indigo-400 shrink-0"
                      >
                        {isDone ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                      <div className="min-w-0">
                        <p className={`text-xs font-medium ${isDone ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                          {t.title}
                        </p>
                        {t.dueDate && (
                          <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            <span>Due: {new Date(t.dueDate).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full capitalize font-semibold ${
                        t.priority === 'urgent'
                          ? 'bg-rose-500/20 text-rose-300'
                          : t.priority === 'high'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {t.priority || 'medium'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Inline Add Task Dialog */}
          {isTaskModalOpen && (
            <form onSubmit={handleCreateTask} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <h4 className="text-xs font-semibold text-slate-200">Create Linked Task</h4>
              <input
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Task title / action item..."
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-slate-200"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Due Date</label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-slate-200"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-3 py-1 text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingTask || !taskTitle.trim()}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow"
                >
                  {isSavingTask ? 'Saving...' : 'Create Task'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* 5. Social Activity Sub-Panel Content */}
      {activeTab === 'social' && (
        <div className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-6 shadow-xl space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Radio className="w-4 h-4 text-indigo-400" />
                Linked Social Interactions & Mentions
              </h3>
              <p className="text-xs text-slate-400">
                Inbound brand mentions, support issues, and posts associated with this {moduleName.slice(0, -1)}.
              </p>
            </div>
            <button
              onClick={() => navigate('/social')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow"
            >
              <span>Social Hub</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          {loadingSocial ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading social mentions...</div>
          ) : socialInteractions.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl text-xs text-slate-500">
              No social mentions or interactions linked to this record.
            </div>
          ) : (
            <div className="space-y-3">
              {socialInteractions.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">
                      {item.authorName} (@{item.authorHandle})
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                        {item.platform}
                      </span>
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                        {item.sentiment}
                      </span>
                    </div>
                  </div>
                  <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{item.content}</p>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800/60">
                    <span className="capitalize">Intent: {item.intent?.replace('_', ' ')}</span>
                    <span>{new Date(item.publishedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 6. Bookings Sub-Panel Content */}
      {activeTab === 'bookings' && (
        <div className="animate-fadeIn">
          <ContextualBookingsPanel
            contactId={moduleName === 'contacts' ? recordId : undefined}
            accountId={moduleName === 'accounts' ? recordId : undefined}
            title={`${record.accountName || record.firstName || 'CRM Entity'} Scheduled Meetings`}
          />
        </div>
      )}
    </div>
  );
};

export default RelatedListsNav;
