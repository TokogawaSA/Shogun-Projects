import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  ChevronDown, 
  FolderKanban, 
  Search, 
  Check, 
  Plus, 
  SlidersHorizontal, 
  LayoutGrid, 
  List, 
  Layers, 
  BarChart3, 
  Loader2
} from 'lucide-react';
import clsx from 'clsx';
import { useProject } from '../../context/ProjectContext';
import { Task, Milestone, TaskStatusColumn, ProjectWorkspaceMeta, TaskPriority } from './types';
import { projectService } from './services/projectService';
import { ProjectBoard } from './components/ProjectBoard';
import { ProjectTaskList } from './components/ProjectTaskList';
import { ProjectMilestones } from './components/ProjectMilestones';
import { ProjectOverview } from './components/ProjectOverview';
import { TaskDetailModal } from './components/TaskDetailModal';
import { CreateTaskModal } from './components/CreateTaskModal';
import { ColumnConfigModal } from './components/ColumnConfigModal';

type WorkspaceTab = 'board' | 'list' | 'milestones' | 'overview';

export const ProjectWorkspace: React.FC = () => {
  const { id: urlProjectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as WorkspaceTab | null;

  const { projects, currentProjectId, setCurrentProjectId } = useProject();

  // Active Project ID Resolution
  const activeProjectId = urlProjectId || currentProjectId || projects[0]?.id || 'default-project';
  const currentProjectMeta = projects.find((p) => p.id === activeProjectId);

  // Core State
  const [activeTab, setActiveTab] = useState<WorkspaceTab>(() => {
    if (tabParam && ['board', 'list', 'milestones', 'overview'].includes(tabParam)) {
      return tabParam;
    }
    return 'board';
  });

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<ProjectWorkspaceMeta>({
    id: activeProjectId,
    title: currentProjectMeta?.title || 'Project Workspace',
    description: currentProjectMeta?.description || '',
    members: currentProjectMeta?.members || [],
    createdAt: currentProjectMeta?.createdAt,
  });

  const [tasks, setTasks] = useState<Task[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [columns, setColumns] = useState<TaskStatusColumn[]>([]);

  // Modals
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [createTaskDefaultStatus, setCreateTaskDefaultStatus] = useState<string | undefined>(undefined);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isColumnConfigOpen, setIsColumnConfigOpen] = useState(false);
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [projectSearch, setProjectSearch] = useState('');

  // Sync tab with URL
  const handleTabChange = (tab: WorkspaceTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Load project dataset
  const loadData = useCallback(async () => {
    if (!activeProjectId) return;
    setLoading(true);
    try {
      const [projMeta, loadedTasks, loadedMilestones] = await Promise.all([
        projectService.getProject(activeProjectId),
        projectService.getTasks(activeProjectId),
        projectService.getMilestones(activeProjectId),
      ]);

      const loadedCols = projectService.getProjectColumns(activeProjectId);

      setProject({
        ...projMeta,
        title: projMeta.title || currentProjectMeta?.title || 'Project Workspace',
        description: projMeta.description || currentProjectMeta?.description || '',
      });
      setTasks(loadedTasks);
      setMilestones(loadedMilestones);
      setColumns(loadedCols);
    } finally {
      setLoading(false);
    }
  }, [activeProjectId, currentProjectMeta]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Sync active project to context
  useEffect(() => {
    if (activeProjectId && activeProjectId !== currentProjectId) {
      setCurrentProjectId(activeProjectId);
    }
  }, [activeProjectId, currentProjectId, setCurrentProjectId]);

  // Tasks CRUD handlers
  const handleCreateTask = async (taskPayload: Partial<Task>) => {
    const created = await projectService.createTask(taskPayload);
    const updated = [created, ...tasks];
    setTasks(updated);
    localStorage.setItem(`shogun_pm_tasks_${activeProjectId}`, JSON.stringify(updated));
  };

  const handleUpdateTask = async (taskUpdates: Partial<Task>) => {
    if (!taskUpdates.id) return;
    const updatedTask = await projectService.updateTask(taskUpdates.id, taskUpdates);
    const updated = tasks.map((t) => (t.id === updatedTask.id ? { ...t, ...updatedTask } : t));
    setTasks(updated);
    localStorage.setItem(`shogun_pm_tasks_${activeProjectId}`, JSON.stringify(updated));
    if (selectedTask?.id === updatedTask.id) {
      setSelectedTask(updatedTask);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    await projectService.deleteTask(taskId);
    const updated = tasks.filter((t) => t.id !== taskId);
    setTasks(updated);
    localStorage.setItem(`shogun_pm_tasks_${activeProjectId}`, JSON.stringify(updated));
    if (selectedTask?.id === taskId) {
      setSelectedTask(null);
    }
  };

  const handleMoveTask = async (taskId: string, newStatus: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;

    // Optimistic UI update
    const updated = tasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t));
    setTasks(updated);
    localStorage.setItem(`shogun_pm_tasks_${activeProjectId}`, JSON.stringify(updated));

    // Persist
    await projectService.updateTask(taskId, { ...task, status: newStatus });
  };

  const handleUpdateStatus = async (taskId: string, newStatus: string) => {
    await handleMoveTask(taskId, newStatus);
  };

  const handleUpdatePriority = async (taskId: string, newPriority: TaskPriority) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.priority === newPriority) return;

    const updated = tasks.map((t) => (t.id === taskId ? { ...t, priority: newPriority } : t));
    setTasks(updated);
    localStorage.setItem(`shogun_pm_tasks_${activeProjectId}`, JSON.stringify(updated));

    await projectService.updateTask(taskId, { ...task, priority: newPriority });
  };

  // Milestones CRUD handlers
  const handleCreateMilestone = async (mPayload: Partial<Milestone>) => {
    const created = await projectService.createMilestone(activeProjectId, mPayload);
    const updated = [...milestones, created];
    setMilestones(updated);
    localStorage.setItem(`shogun_pm_milestones_${activeProjectId}`, JSON.stringify(updated));
  };

  const handleUpdateMilestone = async (mId: string, updates: Partial<Milestone>) => {
    await projectService.updateMilestone(mId, updates);
    const updated = milestones.map((m) => (m.id === mId ? { ...m, ...updates } : m));
    setMilestones(updated);
    localStorage.setItem(`shogun_pm_milestones_${activeProjectId}`, JSON.stringify(updated));
  };

  const handleDeleteMilestone = async (mId: string) => {
    await projectService.deleteMilestone(mId);
    const updated = milestones.filter((m) => m.id !== mId);
    setMilestones(updated);
    localStorage.setItem(`shogun_pm_milestones_${activeProjectId}`, JSON.stringify(updated));
  };

  // Columns handler
  const handleSaveColumns = (newCols: TaskStatusColumn[]) => {
    setColumns(newCols);
    projectService.saveProjectColumns(activeProjectId, newCols);
  };

  // Switch project handler
  const handleSwitchProject = (targetId: string) => {
    setCurrentProjectId(targetId);
    setIsProjectDropdownOpen(false);
    navigate(`/projects/${targetId}?tab=${activeTab}`);
  };

  const filteredProjects = useMemo(() => {
    if (!projectSearch.trim()) return projects;
    const q = projectSearch.toLowerCase();
    return projects.filter(
      (p) => p.title.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)
    );
  }, [projects, projectSearch]);

  const activeTitle = project.title || currentProjectMeta?.title || 'Project Workspace';
  const activeCode = (project.id || 'PRJ').slice(0, 8).toUpperCase();

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12">
      {/* 1. Header Toolbar with Switcher & Quick Actions */}
      <div className="relative overflow-hidden bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl shadow-xl transition-all">
        {/* Ambient subtle glow */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left: Back button & Project Switcher Dropdown */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/projects')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 hover:border-slate-600 text-slate-300 hover:text-white transition-all text-xs font-medium shadow-sm group shrink-0"
              title="Return to Projects Directory"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-400 group-hover:text-white group-hover:-translate-x-0.5 transition-transform" />
              <span className="hidden sm:inline">All Projects</span>
            </button>

            <span className="text-slate-700 text-sm hidden sm:inline">/</span>

            {/* Project Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 hover:border-indigo-500/50 text-slate-100 transition-all shadow-sm group max-w-xs sm:max-w-md"
              >
                <div className="w-6 h-6 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                  <FolderKanban className="w-3.5 h-3.5" />
                </div>
                <div className="truncate text-left">
                  <span className="text-xs font-bold truncate block">{activeTitle}</span>
                </div>
                <ChevronDown
                  className={clsx(
                    'w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0',
                    isProjectDropdownOpen ? 'rotate-180 text-indigo-400' : ''
                  )}
                />
              </button>

              {/* Click-outside Backdrop */}
              {isProjectDropdownOpen && (
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => {
                    setIsProjectDropdownOpen(false);
                    setProjectSearch('');
                  }}
                />
              )}

              {/* Dropdown Menu */}
              {isProjectDropdownOpen && (
                <div className="absolute left-0 top-full mt-2 w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 z-40 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-2.5 py-1.5 flex items-center justify-between border-b border-slate-800 mb-2">
                    <span className="text-[10px] uppercase font-mono text-slate-400 font-bold tracking-wider">
                      Switch Project
                    </span>
                    <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                      {projects.length} available
                    </span>
                  </div>

                  {projects.length > 3 && (
                    <div className="relative px-1 mb-2">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search projects..."
                        value={projectSearch}
                        onChange={(e) => setProjectSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                        autoFocus
                      />
                    </div>
                  )}

                  <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                    {filteredProjects.map((p) => {
                      const isCurrent = p.id === activeProjectId;
                      return (
                        <button
                          key={p.id}
                          onClick={() => handleSwitchProject(p.id)}
                          className={clsx(
                            'w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors',
                            isCurrent
                              ? 'bg-indigo-600/20 text-indigo-300 font-semibold border border-indigo-500/30'
                              : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                          )}
                        >
                          <div className="truncate mr-2">
                            <div className="truncate font-medium">{p.title}</div>
                            <div className="text-[10px] font-mono text-slate-500">{p.id}</div>
                          </div>
                          {isCurrent && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <span className="px-2 py-0.5 rounded-md bg-slate-800/90 border border-slate-700/70 text-slate-400 font-mono text-[10px] font-semibold hidden md:inline">
              {activeCode}
            </span>
          </div>

          {/* Right: Quick Action Buttons */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => setIsColumnConfigOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 hover:border-slate-600 text-xs font-medium text-slate-300 hover:text-white transition-all shadow-sm"
              title="Customize workflow columns"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
              <span>Columns</span>
            </button>

            <button
              onClick={() => {
                setCreateTaskDefaultStatus(columns[0]?.id || 'todo');
                setIsCreateTaskOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Task</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Unified Tab Navigation Bar */}
      <div className="bg-slate-900/80 border border-slate-800/80 p-1.5 rounded-2xl backdrop-blur-xl shadow-lg sticky top-0 z-20 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1.5 min-w-max">
          <button
            onClick={() => handleTabChange('board')}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all duration-150',
              activeTab === 'board'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold ring-1 ring-indigo-400/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            )}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Board</span>
            <span className={clsx(
              'px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold',
              activeTab === 'board' ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-slate-400'
            )}>
              {tasks.length}
            </span>
          </button>

          <button
            onClick={() => handleTabChange('list')}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all duration-150',
              activeTab === 'list'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold ring-1 ring-indigo-400/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            )}
          >
            <List className="w-3.5 h-3.5" />
            <span>List</span>
          </button>

          <button
            onClick={() => handleTabChange('milestones')}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all duration-150',
              activeTab === 'milestones'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold ring-1 ring-indigo-400/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            )}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Milestones</span>
            <span className={clsx(
              'px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold',
              activeTab === 'milestones' ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-slate-400'
            )}>
              {milestones.length}
            </span>
          </button>

          <button
            onClick={() => handleTabChange('overview')}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all duration-150',
              activeTab === 'overview'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold ring-1 ring-indigo-400/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            )}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Overview & Vitals</span>
          </button>
        </div>
      </div>

      {/* 3. Tab Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-3 bg-slate-900/40 rounded-2xl border border-slate-800/80 backdrop-blur-xl">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
          <p className="text-xs text-slate-400 font-medium">Loading project workspace...</p>
        </div>
      ) : (
        <div className="transition-all duration-150">
          {activeTab === 'board' && (
            <ProjectBoard
              tasks={tasks}
              columns={columns}
              milestones={milestones}
              onOpenTask={(task) => setSelectedTask(task)}
              onQuickAddTask={async (columnId, title) => {
                await handleCreateTask({
                  projectId: activeProjectId,
                  title,
                  status: columnId,
                  priority: 'medium',
                });
              }}
              onMoveTask={handleMoveTask}
              onOpenColumnConfig={() => setIsColumnConfigOpen(true)}
            />
          )}

          {activeTab === 'list' && (
            <ProjectTaskList
              tasks={tasks}
              columns={columns}
              milestones={milestones}
              onOpenTask={(task) => setSelectedTask(task)}
              onUpdateStatus={handleUpdateStatus}
              onUpdatePriority={handleUpdatePriority}
              onDeleteTask={handleDeleteTask}
              onOpenCreateModal={() => {
                setCreateTaskDefaultStatus(columns[0]?.id || 'todo');
                setIsCreateTaskOpen(true);
              }}
            />
          )}

          {activeTab === 'milestones' && (
            <ProjectMilestones
              projectId={activeProjectId}
              milestones={milestones}
              tasks={tasks}
              onCreateMilestone={handleCreateMilestone}
              onUpdateMilestone={handleUpdateMilestone}
              onDeleteMilestone={handleDeleteMilestone}
              onOpenTask={(task) => setSelectedTask(task)}
            />
          )}

          {activeTab === 'overview' && (
            <ProjectOverview
              project={project}
              tasks={tasks}
              milestones={milestones}
              columns={columns}
              onUpdateProject={async (updates) => {
                setProject((prev) => ({ ...prev, ...updates }));
                await projectService.updateProject(activeProjectId, updates);
              }}
              onNavigateTab={(tab) => handleTabChange(tab)}
            />
          )}
        </div>
      )}

      {/* 4. Modals */}
      {/* Task Details Modal */}
      <TaskDetailModal
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        columns={columns}
        milestones={milestones}
        allTasks={tasks}
        onSave={handleUpdateTask}
        onDelete={handleDeleteTask}
      />

      {/* Create Task Modal */}
      <CreateTaskModal
        projectId={activeProjectId}
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
        columns={columns}
        milestones={milestones}
        defaultStatus={createTaskDefaultStatus}
        onCreate={handleCreateTask}
      />

      {/* Column Config Modal */}
      <ColumnConfigModal
        isOpen={isColumnConfigOpen}
        onClose={() => setIsColumnConfigOpen(false)}
        columns={columns}
        onSaveColumns={handleSaveColumns}
      />
    </div>
  );
};

export default ProjectWorkspace;
