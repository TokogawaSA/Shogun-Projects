/**
 * Hierarchical Task Tree Component (Recursive parentTaskId tree)
 * Multi-Tenant Antigravity 2.0 Ecosystem
 */

import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  FolderTree, 
  Search 
} from 'lucide-react';
import { SubTaskItem, SubTaskTreeNode } from './SubTaskItem';
import { TaskDetailDrawer } from './TaskDetailDrawer';
import { Task, TaskStatus, TaskPriority } from '../../../types';
import { apiClient } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';

interface TaskTreeProps {
  tasks: Task[];
  projectId?: string;
  onRefresh?: () => void;
}

export const TaskTree: React.FC<TaskTreeProps> = ({
  tasks,
  projectId = 'proj-default',
  onRefresh,
}) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  // New Task Modal / Quick Add
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium');
  const [newEstimatedHours, setNewEstimatedHours] = useState<number>(4);
  const [targetParentTaskId, setTargetParentTaskId] = useState<string | null>(null);

  // Transform flat tasks into a recursive tree using parentTaskId
  const treeNodes = useMemo(() => {
    const taskMap = new Map<string, SubTaskTreeNode>();
    const roots: SubTaskTreeNode[] = [];

    // Filter tasks if search is active
    const filtered = tasks.filter((t) => {
      const matchSearch =
        !searchQuery ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchQuery.toLowerCase());
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
      // Optimistic
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
      // Optimistic
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const taskId = `TSK-${Date.now().toString(36).toUpperCase()}`;
    const nowIso = new Date().toISOString();

    const taskData: Partial<Task> = {
      id: taskId,
      projectId,
      title: newTitle.trim(),
      description: targetParentTaskId ? `Sub-task child of ${targetParentTaskId}` : '',
      status: 'todo',
      priority: newPriority,
      creatorId: user?.uid || 'usr-admin',
      parentTaskId: targetParentTaskId || null,
      estimatedHours: newEstimatedHours,
      actualHours: 0,
      subtasks: [],
      timeLogs: [],
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    try {
      await apiClient.post('/projects/tasks', taskData);
      if (onRefresh) onRefresh();
    } catch {
      // Optimistic
    }

    setIsAddModalOpen(false);
    setNewTitle('');
    setTargetParentTaskId(null);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tree tasks & sub-tasks..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500 font-medium"
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
            <option value="review">Review</option>
            <option value="done">Done</option>
          </select>
        </div>

        <button
          onClick={() => {
            setTargetParentTaskId(null);
            setIsAddModalOpen(true);
          }}
          className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-500/20 transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Root Task
        </button>
      </div>

      {/* Task Tree Container */}
      <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-xl space-y-2 min-h-[300px]">
        {treeNodes.length === 0 ? (
          <div className="py-12 text-center text-slate-500 space-y-2">
            <FolderTree className="w-10 h-10 mx-auto text-slate-600" />
            <p className="font-semibold text-slate-400 text-xs">No tasks found matching criteria</p>
            <p className="text-[11px] text-slate-500">Create a root task or import deliverables to populate the tree hierarchy.</p>
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
          if (onRefresh) onRefresh();
        }}
        allProjectTasks={tasks}
      />

      {/* Add Task Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                {targetParentTaskId ? `Add Child Sub-Task under ${targetParentTaskId}` : 'Create New Root Task'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3.5 text-xs">
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
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 capitalize"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Estimated Hours</label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={newEstimatedHours}
                    onChange={(e) => setNewEstimatedHours(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl text-white font-semibold bg-indigo-600 hover:bg-indigo-500 shadow-md transition"
                >
                  Create Task
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
