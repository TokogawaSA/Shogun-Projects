import React, { useState, useMemo } from 'react';
import { ProjectHeader } from '../components/dashboard/ProjectHeader';
import { KanbanBoard } from '../components/dashboard/KanbanBoard';
import { GanttChart, TaskDetailDrawer } from '../modules/projects';
import { useProject } from '../context/ProjectContext';
import { useHierarchy } from '../context/HierarchyContext';
import { useTasks } from '../hooks/useTasks';
import { HierarchySidebarTree } from '../components/hierarchy/HierarchySidebarTree';
import { HierarchyBreadcrumbs } from '../components/hierarchy/HierarchyBreadcrumbs';
import { CreateHierarchyModal } from '../components/hierarchy/CreateHierarchyModal';
import { UniversalViewBar } from '../components/views/UniversalViewBar';
import { TaskListView } from '../components/views/TaskListView';
import { TaskWorkloadView } from '../components/views/TaskWorkloadView';
import { TaskCalendarView } from '../components/views/TaskCalendarView';
import { TaskMindMapView } from '../components/views/TaskMindMapView';
import { filterAndSortTasks, groupTasksBy } from '../utils/viewProjectionEngine';
import { ViewMode, ViewGroupBy, ViewFilterState, ViewSortState } from '../types/views';
import { Task, TaskStatus } from '../types';
import { apiClient } from '../services/api';
import {
  FolderPlus,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
} from 'lucide-react';
import { CreateTaskModal } from '../components/dashboard/CreateTaskModal';

export const TaskBoardPage: React.FC = () => {
  const { currentProjectId } = useProject();
  const { activeScope, openCreateModal } = useHierarchy();

  // Multi-View state
  const [activeView, setActiveView] = useState<ViewMode>('list');
  const [groupBy, setGroupBy] = useState<ViewGroupBy>('status');
  const [filters, setFilters] = useState<ViewFilterState>({
    searchQuery: '',
    status: 'all',
    priority: 'all',
    assigneeId: 'all',
  });
  const [sort, setSort] = useState<ViewSortState>({
    field: 'createdAt',
    direction: 'desc',
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState<boolean>(false);

  // Raw tasks
  const { tasks, fetchTasks } = useTasks(currentProjectId || undefined);

  // Filter tasks based on active hierarchy scope
  const scopedTasks = useMemo(() => {
    if (activeScope.level === 'workspace') return tasks;
    if (activeScope.level === 'list' && activeScope.listId) {
      return tasks.filter(
        (t) =>
          t.listId === activeScope.listId ||
          (activeScope.folderId ? t.milestoneId === activeScope.folderId : true)
      );
    }
    if (activeScope.level === 'folder' && activeScope.folderId) {
      return tasks.filter((t) => t.milestoneId === activeScope.folderId);
    }
    if (activeScope.level === 'space' && activeScope.spaceId) {
      return tasks.filter((t) => t.projectId === activeScope.spaceId);
    }
    return tasks;
  }, [tasks, activeScope]);

  // Projected Tasks after search, filters, and sorting
  const processedTasks = useMemo(() => {
    return filterAndSortTasks(scopedTasks, filters, sort);
  }, [scopedTasks, filters, sort]);

  // Grouped task buckets for List & Board views
  const groupedBuckets = useMemo(() => {
    return groupTasksBy(processedTasks, groupBy);
  }, [processedTasks, groupBy]);

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
      if (fetchTasks) fetchTasks();
    } catch {
      // Handled optimistically
    }
  };

  const handleQuickAddTask = () => {
    setIsCreateTaskModalOpen(true);
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] -m-8 overflow-hidden">
      {/* ClickUp Hierarchical Sidebar */}
      {isSidebarOpen && <HierarchySidebarTree />}

      {/* Main Board View Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-950/40 p-6 space-y-4 overflow-y-auto custom-scrollbar">
        {/* Top Control Bar: Sidebar Toggle + Breadcrumbs */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition shadow-sm"
            title={isSidebarOpen ? 'Collapse Hierarchy Sidebar' : 'Expand Hierarchy Sidebar'}
          >
            {isSidebarOpen ? (
              <PanelLeftClose className="w-4 h-4" />
            ) : (
              <PanelLeftOpen className="w-4 h-4" />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <HierarchyBreadcrumbs />
          </div>

          <button
            onClick={() => openCreateModal('space')}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 shadow-md shadow-indigo-500/20 transition flex items-center gap-1.5 flex-shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Space</span>
          </button>
        </div>

        {/* Project Workspace Header & Switcher */}
        <ProjectHeader />

        {/* Universal Multi-View Switcher Bar */}
        <UniversalViewBar
          activeView={activeView}
          onViewChange={setActiveView}
          groupBy={groupBy}
          onGroupByChange={setGroupBy}
          filters={filters}
          onFilterChange={setFilters}
          sort={sort}
          onSortChange={setSort}
          onQuickAddTask={handleQuickAddTask}
          totalCount={processedTasks.length}
        />

        {/* View Surface Content */}
        {!currentProjectId && activeScope.level !== 'workspace' ? (
          <div className="glass-panel p-12 rounded-2xl border border-slate-800 bg-slate-900/40 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/30">
              <FolderPlus className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-100">No Active Space Selected</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Please select a Space, Folder, or List from the left sidebar to view and synchronize real-time tasks.
            </p>
          </div>
        ) : activeView === 'list' ? (
          <TaskListView
            groupedBuckets={groupedBuckets}
            onSelectTask={handleSelectTask}
            onStatusChange={handleStatusChange}
          />
        ) : activeView === 'board' ? (
          <KanbanBoard />
        ) : activeView === 'gantt' ? (
          <GanttChart />
        ) : activeView === 'calendar' ? (
          <TaskCalendarView
            tasks={processedTasks}
            onSelectTask={handleSelectTask}
          />
        ) : activeView === 'workload' ? (
          <TaskWorkloadView
            tasks={processedTasks}
            onSelectTask={handleSelectTask}
          />
        ) : (
          <TaskMindMapView
            tasks={processedTasks}
            onSelectTask={handleSelectTask}
          />
        )}
      </div>

      {/* Quick Creation Modal */}
      <CreateHierarchyModal />

      {/* Rich Task Creation Modal */}
      <CreateTaskModal
        isOpen={isCreateTaskModalOpen}
        onClose={() => setIsCreateTaskModalOpen(false)}
        onTaskCreated={() => {
          if (fetchTasks) fetchTasks();
        }}
      />

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
          if (fetchTasks) fetchTasks();
        }}
        allProjectTasks={tasks}
      />
    </div>
  );
};

export default TaskBoardPage;
