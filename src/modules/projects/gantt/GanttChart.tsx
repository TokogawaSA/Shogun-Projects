/**
 * Interactive Gantt Chart Visualizer & Timeline Engine
 * Multi-Tenant Antigravity 2.0 Ecosystem
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  CalendarRange, 
  Flag, 
  ArrowLeft, 
  CheckCircle2, 
  Search, 
  Network, 
  ChevronLeft, 
  ChevronRight,
  Zap
} from 'lucide-react';
import { apiClient } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { Project, ProjectMilestone, Task } from '../../../types';
import { TaskDetailDrawer } from '../tasks/TaskDetailDrawer';
import { DependencyManager } from './DependencyManager';

export const GanttChart: React.FC = () => {
  const { id: routeProjectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const tenantId = user?.tenantId || 'tenant-default';

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(routeProjectId || '');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'timeline' | 'critical_path'>('timeline');

  // Selected Task for Drawer
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);

  // 1. Fetch available projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await apiClient.get<Project[]>('/projects');
        if (Array.isArray(res) && res.length > 0) {
          setProjects(res);
          if (!selectedProjectId) {
            setSelectedProjectId(routeProjectId || res[0].id);
          }
        }
      } catch (e) {
        console.warn('[GanttChart] Project fetch notice:', e);
      }
    };
    fetchProjects();
  }, [routeProjectId, selectedProjectId]);

  // 2. Fetch Tasks & Milestones
  const fetchProjectData = useCallback(async () => {
    if (!selectedProjectId) return;

    try {
      // Tasks
      const tRes = await apiClient.get<Task[]>(`/projects/tasks/all?projectId=${selectedProjectId}`).catch(() => []);
      let tList: Task[] = [];
      if (Array.isArray(tRes) && tRes.length > 0) {
        tList = tRes;
      } else {
        // Fallback default tasks
        tList = [
          {
            id: 'tsk-1',
            projectId: selectedProjectId,
            title: 'Architectural Blueprint & PSR-4 Routing',
            description: 'Core namespaces and autoloader definitions',
            status: 'done',
            priority: 'urgent',
            creatorId: 'usr-admin',
            dueDate: new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0],
            estimatedHours: 12,
            actualHours: 12,
            createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'tsk-2',
            projectId: selectedProjectId,
            title: 'Custom MySQL Database Schema & Table Indexing',
            description: 'Custom submission logging tables and transform hooks',
            status: 'done',
            priority: 'high',
            creatorId: 'usr-admin',
            predecessorTaskIds: ['tsk-1'],
            dueDate: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
            estimatedHours: 16,
            actualHours: 14,
            createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'tsk-3',
            projectId: selectedProjectId,
            title: 'WooCommerce Dynamic Pricing & Product ID Matrix',
            description: 'Line item pricing calculator and price book overrides',
            status: 'in_progress',
            priority: 'high',
            creatorId: 'usr-admin',
            predecessorTaskIds: ['tsk-2'],
            dueDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
            estimatedHours: 20,
            actualHours: 9.5,
            createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'tsk-4',
            projectId: selectedProjectId,
            title: 'REST API Controller & Strict Permission Callback Endpoints',
            description: 'WP_REST_Controller route registrations and parameter sanitation',
            status: 'in_progress',
            priority: 'medium',
            creatorId: 'usr-admin',
            predecessorTaskIds: ['tsk-3'],
            dueDate: new Date(Date.now() + 8 * 86400000).toISOString().split('T')[0],
            estimatedHours: 14,
            actualHours: 4,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'tsk-5',
            projectId: selectedProjectId,
            title: 'Action Scheduler Google Cloud Sync Triggers',
            description: 'Async queues for Google Sheets, Docs, and Gmail webhook updates',
            status: 'todo',
            priority: 'high',
            creatorId: 'usr-admin',
            predecessorTaskIds: ['tsk-4'],
            dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
            estimatedHours: 18,
            actualHours: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'tsk-6',
            projectId: selectedProjectId,
            title: 'Gutenberg Sidebar & Performance Telemetry Widgets',
            description: 'React client widgets inside Gutenberg block editor iframe',
            status: 'todo',
            priority: 'medium',
            creatorId: 'usr-admin',
            predecessorTaskIds: ['tsk-5'],
            dueDate: new Date(Date.now() + 21 * 86400000).toISOString().split('T')[0],
            estimatedHours: 24,
            actualHours: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ];
      }

      // Milestones
      const mRes = await apiClient.get<ProjectMilestone[]>(`/projects/${selectedProjectId}/milestones`).catch(() => []);
      let mList: ProjectMilestone[] = [];
      if (Array.isArray(mRes) && mRes.length > 0) {
        mList = mRes;
      } else {
        mList = [
          {
            id: 'ms-1',
            projectId: selectedProjectId,
            tenantId,
            title: 'Phase 1: Architecture & Schema',
            dueDate: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
            status: 'completed',
            completionPercentage: 100,
            createdAt: new Date().toISOString(),
          },
          {
            id: 'ms-2',
            projectId: selectedProjectId,
            tenantId,
            title: 'Phase 2: Core Microservices & Rest API',
            dueDate: new Date(Date.now() + 8 * 86400000).toISOString().split('T')[0],
            status: 'in_progress',
            completionPercentage: 55,
            createdAt: new Date().toISOString(),
          },
          {
            id: 'ms-3',
            projectId: selectedProjectId,
            tenantId,
            title: 'Phase 3: Production Rollout & Gutenberg Integration',
            dueDate: new Date(Date.now() + 21 * 86400000).toISOString().split('T')[0],
            status: 'pending',
            completionPercentage: 0,
            createdAt: new Date().toISOString(),
          },
        ];
      }

      setTasks(tList);
      setMilestones(mList);
    } catch (e) {
      console.warn('[GanttChart] Data load notice:', e);
    }
  }, [selectedProjectId, tenantId]);

  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

  // Timeline Scale Settings (30 days span starting from 7 days ago)
  const timelineDays = useMemo(() => {
    const days: { date: Date; dateStr: string; label: string; isToday: boolean }[] = [];
    const base = new Date();
    base.setDate(base.getDate() - 7);

    for (let i = 0; i < 35; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const isToday = d.toDateString() === new Date().toDateString();
      days.push({
        date: d,
        dateStr: d.toISOString().split('T')[0],
        label: `${d.toLocaleDateString('en-US', { month: 'short' })} ${d.getDate()}`,
        isToday,
      });
    }
    return days;
  }, []);

  // Filter Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchSearch =
        !searchQuery ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'all' || t.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [tasks, searchQuery, statusFilter]);

  // Compute Task Gantt Bar Positions (Left %, Width %)
  const getTaskBarCoords = (task: Task) => {
    const startDate = task.createdAt
      ? new Date(task.createdAt)
      : new Date(Date.now() - 7 * 86400000);
    const dueDate = task.dueDate
      ? new Date(task.dueDate)
      : new Date(startDate.getTime() + 3 * 86400000);

    const timelineStart = timelineDays[0].date.getTime();
    const timelineEnd = timelineDays[timelineDays.length - 1].date.getTime();
    const totalDuration = timelineEnd - timelineStart;

    const taskStartOffset = Math.max(0, startDate.getTime() - timelineStart);
    const taskEndOffset = Math.max(taskStartOffset + 86400000, dueDate.getTime() - timelineStart);

    const leftPercent = Math.min(95, Math.max(0, (taskStartOffset / totalDuration) * 100));
    const widthPercent = Math.min(
      100 - leftPercent,
      Math.max(4, ((taskEndOffset - taskStartOffset) / totalDuration) * 100)
    );

    return { leftPercent, widthPercent };
  };

  const showUpdateNotice = (msg: string) => {
    setUpdateMsg(msg);
    setTimeout(() => setUpdateMsg(null), 3500);
  };

  // Adjust Date Range (e.g. shift due date by +1 or -1 day)
  const handleShiftTaskDueDate = async (taskId: string, daysDelta: number) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const currentDue = task.dueDate ? new Date(task.dueDate) : new Date();
    currentDue.setDate(currentDue.getDate() + daysDelta);
    const newDueStr = currentDue.toISOString().split('T')[0];

    // Optimistic Update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, dueDate: newDueStr } : t))
    );

    try {
      await apiClient.put(`/projects/tasks/${taskId}`, {
        dueDate: newDueStr,
        updatedAt: new Date().toISOString(),
      });
      showUpdateNotice(`Updated "${task.title}" due date to ${newDueStr}`);
    } catch {
      showUpdateNotice(`Shifted "${task.title}" schedule (optimistic).`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/projects')}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 mb-2 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Projects Directory
          </button>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2.5">
            <CalendarRange className="w-6 h-6 text-indigo-400" />
            Interactive Gantt Timeline & Critical Path
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Visualize multi-phase task durations, milestone gates, and finish-to-start dependency flow
          </p>
        </div>

        {/* Project Selector & Views */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 p-1.5 rounded-xl">
            <span className="text-xs font-semibold text-slate-400 font-mono pl-2">Project:</span>
            <select
              value={selectedProjectId}
              onChange={(e) => {
                setSelectedProjectId(e.target.value);
                navigate(`/projects/${e.target.value}/gantt`);
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center bg-slate-900/90 border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'timeline'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CalendarRange className="w-3.5 h-3.5" />
              Gantt View
            </button>
            <button
              onClick={() => setActiveTab('critical_path')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'critical_path'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Critical Path
            </button>
          </div>
        </div>
      </div>

      {updateMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{updateMsg}</span>
        </div>
      )}

      {activeTab === 'critical_path' ? (
        <DependencyManager
          tasks={tasks}
          onSelectTask={(t) => {
            setSelectedTask(t);
            setIsDrawerOpen(true);
          }}
        />
      ) : (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-md">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1 max-w-xs">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter timeline tasks..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold"
              >
                <option value="all">All Statuses</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Completed</option>
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Done
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500" /> In Progress
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-slate-700" /> Todo
              </span>
              <span className="flex items-center gap-1.5">
                <Flag className="w-3 h-3 text-amber-400" /> Milestone
              </span>
            </div>
          </div>

          {/* Interactive Gantt Matrix */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl backdrop-blur-md">
            {/* Header Timeline Columns */}
            <div className="flex border-b border-slate-800 bg-slate-950/80 text-[11px] font-mono text-slate-400 sticky top-0 z-20">
              <div className="w-72 sm:w-80 p-3 border-r border-slate-800 font-bold text-slate-300 uppercase tracking-wider">
                Task Deliverable / Scope
              </div>
              <div className="flex-1 overflow-x-auto flex divide-x divide-slate-800/60">
                {timelineDays.map((day, idx) => (
                  <div
                    key={idx}
                    className={`min-w-[40px] flex-1 py-3 text-center text-[10px] ${
                      day.isToday
                        ? 'bg-indigo-500/15 text-indigo-300 font-bold border-b-2 border-indigo-500'
                        : 'text-slate-400'
                    }`}
                  >
                    {day.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Milestones Flag Row */}
            {milestones.length > 0 && (
              <div className="flex border-b border-slate-800/80 bg-slate-900/60 py-2.5 px-3 items-center text-xs">
                <div className="w-72 sm:w-80 font-bold text-amber-400 font-mono flex items-center gap-1.5">
                  <Flag className="w-3.5 h-3.5" /> Project Milestone Gates
                </div>
                <div className="flex-1 flex items-center gap-3 overflow-x-auto pl-4 font-mono text-[11px]">
                  {milestones.map((m) => (
                    <span
                      key={m.id}
                      className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 flex-shrink-0"
                    >
                      <span>{m.title}</span>
                      <span className="text-slate-400">({m.dueDate})</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Task Rows */}
            <div className="divide-y divide-slate-800/60 text-xs">
              {filteredTasks.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  No project tasks found matching criteria.
                </div>
              ) : (
                filteredTasks.map((task) => {
                  const { leftPercent, widthPercent } = getTaskBarCoords(task);
                  const isDone = task.status === 'done';
                  const isInProgress = task.status === 'in_progress';

                  return (
                    <div
                      key={task.id}
                      className="flex hover:bg-slate-800/30 transition-colors group relative"
                    >
                      {/* Left: Task Title & Date Controls */}
                      <div
                        onClick={() => {
                          setSelectedTask(task);
                          setIsDrawerOpen(true);
                        }}
                        className="w-72 sm:w-80 p-3 border-r border-slate-800 flex items-center justify-between gap-2 cursor-pointer"
                      >
                        <div className="min-w-0 flex-1">
                          <div
                            className={`font-semibold truncate group-hover:text-indigo-400 transition ${
                              isDone ? 'line-through text-slate-500' : 'text-slate-200'
                            }`}
                          >
                            {task.title}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5 flex items-center gap-2">
                            <span>Due: {task.dueDate || 'Unscheduled'}</span>
                            {task.predecessorTaskIds && task.predecessorTaskIds.length > 0 && (
                              <span className="text-amber-400 flex items-center gap-0.5">
                                <Network className="w-2.5 h-2.5" />
                                {task.predecessorTaskIds.length} Pred.
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Quick Date Shift Controls */}
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShiftTaskDueDate(task.id, -1);
                            }}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200"
                            title="Shift Due Date -1 Day"
                          >
                            <ChevronLeft className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShiftTaskDueDate(task.id, 1);
                            }}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200"
                            title="Shift Due Date +1 Day"
                          >
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Right: Gantt Bar Track */}
                      <div className="flex-1 relative h-14 bg-slate-950/30 flex items-center px-2">
                        {/* Dependency Guide Line if predecessor exists */}
                        {task.predecessorTaskIds && task.predecessorTaskIds.length > 0 && (
                          <div
                            className="absolute h-0.5 bg-amber-500/30 border-t border-dashed border-amber-500/50"
                            style={{
                              left: '0%',
                              width: `${leftPercent}%`,
                              top: '50%',
                            }}
                          />
                        )}

                        {/* Task Duration Bar */}
                        <div
                          onClick={() => {
                            setSelectedTask(task);
                            setIsDrawerOpen(true);
                          }}
                          style={{
                            left: `${leftPercent}%`,
                            width: `${widthPercent}%`,
                          }}
                          className={`absolute h-7 rounded-lg shadow-md cursor-pointer transition-all duration-200 flex items-center justify-between px-2 text-[11px] font-mono font-bold text-white ${
                            isDone
                              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 border border-emerald-400/40'
                              : isInProgress
                              ? 'bg-gradient-to-r from-indigo-600 to-violet-600 border border-indigo-400/40 shadow-indigo-500/20'
                              : 'bg-slate-800 border border-slate-700 text-slate-300'
                          }`}
                        >
                          <span className="truncate pr-1">{task.title}</span>
                          <span className="text-[10px] opacity-80 flex-shrink-0">
                            {task.actualHours || 0}h
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Task Detail Drawer */}
      <TaskDetailDrawer
        task={selectedTask}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedTask(null);
        }}
        onUpdateTask={(updated) => {
          setSelectedTask(updated);
          fetchProjectData();
        }}
        allProjectTasks={tasks}
      />
    </div>
  );
};
export default GanttChart;
