import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Sparkles, 
  CheckCircle2, 
  CircleDot, 
  Eye, 
  Flame, 
  X, 
  Loader2, 
  AlertCircle, 
  Filter 
} from 'lucide-react';
import clsx from 'clsx';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useProject } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import { useFirestoreTasks } from '../../hooks/useFirestoreTasks';
import { Task, TaskStatus, TaskPriority, TaskCategory, AgentType } from '../../types';
import { TaskCard } from './TaskCard';
import { TaskDetailModal } from './TaskDetailModal';

// Fallback mock tasks with subtasks if offline or no documents exist
const initialFallbackTasks: Task[] = [
  {
    id: 'TSK-101',
    projectId: 'proj-shogun-1',
    title: 'Configure Firebase MCP Server (.agents/mcp_config.json)',
    description: 'Bind npx firebase-tools@latest mcp command to Antigravity IDE agent runner for autonomous operations.',
    status: 'done',
    priority: 'urgent',
    category: 'Agentic Orchestration',
    assignedAgent: 'Sentinel',
    progress: 100,
    creatorId: 'usr-admin-master',
    dueDate: 'Aug 18',
    subtasks: [
      { id: 'sub-1', title: 'Verify MCP configuration schema in .agents', completed: true, createdAt: new Date(Date.now() - 3600000 * 48).toISOString() },
      { id: 'sub-2', title: 'Test firebase-tools MCP endpoint connection', completed: true, createdAt: new Date(Date.now() - 3600000 * 40).toISOString() },
      { id: 'sub-3', title: 'Expose Firestore tools to Sentinel subagent', completed: true, createdAt: new Date(Date.now() - 3600000 * 30).toISOString() },
    ],
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: 'TSK-102',
    projectId: 'proj-shogun-1',
    title: 'Scaffold React 19 + TypeScript multi-page frontend',
    description: 'Set up Vite bundler, Tailwind CSS tokens, Lucide icons, and React Router multi-page layouts.',
    status: 'done',
    priority: 'high',
    category: 'Client Interface',
    assignedAgent: 'Worker',
    progress: 100,
    creatorId: 'usr-admin-master',
    dueDate: 'Aug 18',
    subtasks: [
      { id: 'sub-4', title: 'Configure Vite & React 19 dependencies', completed: true, createdAt: new Date(Date.now() - 3600000 * 36).toISOString() },
      { id: 'sub-5', title: 'Implement Tailwind glassmorphism design tokens', completed: true, createdAt: new Date(Date.now() - 3600000 * 30).toISOString() },
      { id: 'sub-6', title: 'Setup React Router DOM routes and layouts', completed: true, createdAt: new Date(Date.now() - 3600000 * 20).toISOString() },
    ],
    createdAt: new Date(Date.now() - 3600000 * 36).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: 'TSK-103',
    projectId: 'proj-shogun-1',
    title: 'Implement Firestore onSnapshot persistent listeners',
    description: 'Establish WebSocket connections for real-time document synchronization with optimistic local state updates.',
    status: 'in_progress',
    priority: 'high',
    category: 'State & Synchronization',
    assignedAgent: 'Worker',
    progress: 50,
    creatorId: 'usr-admin-master',
    dueDate: 'Aug 19',
    subtasks: [
      { id: 'sub-7', title: 'Connect onSnapshot to Firestore tasks collection', completed: true, createdAt: new Date(Date.now() - 3600000 * 20).toISOString() },
      { id: 'sub-8', title: 'Implement optimistic local state reducer', completed: true, createdAt: new Date(Date.now() - 3600000 * 15).toISOString() },
      { id: 'sub-9', title: 'Handle offline reconnect jitter and snapshot fallbacks', completed: false, createdAt: new Date(Date.now() - 3600000 * 10).toISOString() },
      { id: 'sub-10', title: 'Add real-time latency telemetry indicator', completed: false, createdAt: new Date(Date.now() - 3600000 * 5).toISOString() },
    ],
    createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'TSK-104',
    projectId: 'proj-shogun-1',
    title: 'Security Layer Audit & Nonce Verification',
    description: 'Auditor subagent scans REST permission callbacks and ensures strict sanitization gates.',
    status: 'review',
    priority: 'medium',
    category: 'Database & Identity',
    assignedAgent: 'Auditor',
    progress: 67,
    creatorId: 'usr-admin-master',
    dueDate: 'Aug 20',
    subtasks: [
      { id: 'sub-11', title: 'Inspect permission_callback on custom REST paths', completed: true, createdAt: new Date(Date.now() - 3600000 * 10).toISOString() },
      { id: 'sub-12', title: 'Sanitize input payloads against XSS/injection', completed: true, createdAt: new Date(Date.now() - 3600000 * 6).toISOString() },
      { id: 'sub-13', title: 'Verify nonce expiration policies', completed: false, createdAt: new Date(Date.now() - 3600000 * 2).toISOString() },
    ],
    createdAt: new Date(Date.now() - 3600000 * 10).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'TSK-105',
    projectId: 'proj-shogun-1',
    title: 'Deploy Cloud Functions Gen 2 Webhook Triggers',
    description: 'Author event-driven TypeScript Cloud Functions with Node.js 20+ runtime for automated audit logs.',
    status: 'todo',
    priority: 'high',
    category: 'Serverless Compute',
    assignedAgent: 'Sentinel',
    progress: 0,
    creatorId: 'usr-admin-master',
    dueDate: 'Aug 21',
    subtasks: [
      { id: 'sub-14', title: 'Define Cloud Function trigger on project document updates', completed: false, createdAt: new Date().toISOString() },
      { id: 'sub-15', title: 'Configure Action Scheduler queue dispatchers', completed: false, createdAt: new Date().toISOString() },
      { id: 'sub-16', title: 'Deploy Gen 2 functions to Google Cloud region', completed: false, createdAt: new Date().toISOString() },
    ],
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'TSK-106',
    projectId: 'proj-shogun-1',
    title: 'Firebase App Hosting & Global CDN Pipeline',
    description: 'Configure single-command automated deployment pipeline with SSL termination and asset caching.',
    status: 'todo',
    priority: 'medium',
    category: 'Edge Delivery',
    assignedAgent: 'None',
    progress: 0,
    creatorId: 'usr-admin-master',
    dueDate: 'Aug 22',
    subtasks: [
      { id: 'sub-17', title: 'Configure apphosting.yaml build settings', completed: false, createdAt: new Date().toISOString() },
      { id: 'sub-18', title: 'Verify SSL certificate provisioning', completed: false, createdAt: new Date().toISOString() },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

const columns: { status: TaskStatus; label: string; icon: React.ComponentType<{ className?: string }>; color: string; badgeColor: string }[] = [
  { status: 'todo', label: 'To Do', icon: CircleDot, color: 'border-slate-700/80', badgeColor: 'bg-slate-800 text-slate-300' },
  { status: 'in_progress', label: 'In Progress', icon: Flame, color: 'border-indigo-500/80', badgeColor: 'bg-indigo-500/20 text-indigo-300' },
  { status: 'review', label: 'In Review', icon: Eye, color: 'border-amber-500/80', badgeColor: 'bg-amber-500/20 text-amber-300' },
  { status: 'done', label: 'Done', icon: CheckCircle2, color: 'border-emerald-500/80', badgeColor: 'bg-emerald-500/20 text-emerald-300' },
];

export const KanbanBoard: React.FC = () => {
  const { currentProjectId, projects } = useProject();
  const { user } = useAuth();
  
  // Real-time Firestore sync hook
  const { tasks: firestoreTasks, loading, error } = useFirestoreTasks(currentProjectId || undefined);

  // Local optimistic state layer
  const [localTasks, setLocalTasks] = useState<Task[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);

  // Selected task for Subtask details modal
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<Task | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // New Task Form State
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('medium');
  const [newTaskCategory, setNewTaskCategory] = useState<TaskCategory>('Client Interface');
  const [newTaskAgent, setNewTaskAgent] = useState<AgentType>('Worker');
  const [newTaskDueDate, setNewTaskDueDate] = useState('Aug 25');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Determine active task list: prioritize Firestore tasks if loaded and non-empty, otherwise local or contextual fallback
  const displayTasks = useMemo(() => {
    if (firestoreTasks.length > 0) {
      return firestoreTasks;
    }
    if (localTasks.length > 0) {
      return localTasks;
    }
    if (currentProjectId && currentProjectId !== 'proj-shogun-1') {
      const activeProj = projects.find((p) => p.id === currentProjectId);
      return [
        {
          id: `TSK-INIT-${currentProjectId.slice(-4)}`,
          projectId: currentProjectId,
          title: `Sales-to-Delivery Kickoff: ${activeProj?.title || 'Project Deliverables'}`,
          description: `Kickoff engineering sprint, initialize repository architecture, and configure Sentinel/Worker subagents.`,
          status: 'todo' as TaskStatus,
          priority: 'urgent' as TaskPriority,
          category: 'Client Interface' as TaskCategory,
          assignedAgent: 'Sentinel' as AgentType,
          progress: 0,
          creatorId: user?.uid || 'usr-admin-master',
          dueDate: 'Sprint 1',
          subtasks: [
            { id: 'sub-init-1', title: 'Review deal scope, SLA requirements, and deliverables', completed: false, createdAt: new Date().toISOString() },
            { id: 'sub-init-2', title: 'Provision multi-tenant environment tokens', completed: false, createdAt: new Date().toISOString() },
            { id: 'sub-init-3', title: 'Assign Sentinel and Worker subagent roles', completed: false, createdAt: new Date().toISOString() },
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ];
    }
    return initialFallbackTasks;
  }, [firestoreTasks, localTasks, currentProjectId, projects, user]);

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    setLocalTasks((prev) => {
      const source = prev.length > 0 ? prev : displayTasks;
      return source.map((t) =>
        t.id === taskId ? { ...t, status: newStatus, optimistic: true } : t
      );
    });
  };

  const handleDeleteTask = (taskId: string) => {
    setLocalTasks((prev) => {
      const source = prev.length > 0 ? prev : displayTasks;
      return source.filter((t) => t.id !== taskId);
    });
  };

  const handleOpenDetail = (task: Task) => {
    // Find latest version from current state
    const current = displayTasks.find((t) => t.id === task.id) || task;
    setSelectedTaskForDetail(current);
    setIsDetailModalOpen(true);
  };

  const handleUpdateTaskFromDetail = (updatedTask: Task) => {
    setSelectedTaskForDetail(updatedTask);
    setLocalTasks((prev) => {
      const source = prev.length > 0 ? prev : displayTasks;
      return source.map((t) => (t.id === updatedTask.id ? updatedTask : t));
    });
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !currentProjectId) return;

    setIsSubmitting(true);
    const newTaskId = `TSK-${Math.floor(100 + Math.random() * 900)}`;
    const createdTask: Task = {
      id: newTaskId,
      projectId: currentProjectId,
      title: newTaskTitle.trim(),
      description: newTaskDesc.trim(),
      status: 'todo',
      priority: newTaskPriority,
      category: newTaskCategory,
      assignedAgent: newTaskAgent,
      creatorId: user?.uid || 'usr-admin-master',
      dueDate: newTaskDueDate,
      progress: 0,
      subtasks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      optimistic: true,
    };

    // Add to local state immediately for instant feedback
    setLocalTasks((prev) => [createdTask, ...(prev.length > 0 ? prev : displayTasks)]);
    setIsSubmitting(false);
    setNewTaskTitle('');
    setNewTaskDesc('');
    setIsNewTaskModalOpen(false);

    // Background Firestore synchronization
    try {
      const tasksColRef = collection(db, 'projects', currentProjectId, 'tasks');
      const addPromise = addDoc(tasksColRef, {
        projectId: createdTask.projectId,
        title: createdTask.title,
        description: createdTask.description,
        status: createdTask.status,
        priority: createdTask.priority,
        category: createdTask.category,
        assignedAgent: createdTask.assignedAgent,
        creatorId: createdTask.creatorId,
        dueDate: createdTask.dueDate,
        progress: createdTask.progress,
        subtasks: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Timeout race so local development is never stalled
      await Promise.race([
        addPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Sync timeout')), 1500))
      ]);
    } catch (err) {
      console.warn('Firestore task write completed with local fallback:', err);
    }
  };

  // Filter tasks
  const filteredTasks = displayTasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  return (
    <div className="space-y-6">
      {/* Board Search & Actions Bar */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-wrap items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-3 flex-1 min-w-[280px] max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search tasks, descriptions, or IDs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Priority Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Sync Status Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-[11px] text-slate-400 font-mono">
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                <span>Syncing Firestore...</span>
              </>
            ) : error ? (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>Local Buffer Mode</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
                <span>Real-Time Stream Active</span>
              </>
            )}
          </div>

          {/* Add Task Button */}
          <button
            onClick={() => setIsNewTaskModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Task
          </button>
        </div>
      </div>

      {/* 4 Status Columns: To Do, In Progress, In Review, Done */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {columns.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.status === col.status);
          const ColIcon = col.icon;

          return (
            <div
              key={col.status}
              className={clsx(
                'glass-panel p-4 rounded-xl border bg-slate-900/40 flex flex-col min-h-[600px]',
                col.color
              )}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
                <div className="flex items-center gap-2">
                  <ColIcon className="w-4 h-4 text-slate-300" />
                  <h3 className="text-sm font-bold text-slate-100">{col.label}</h3>
                </div>
                <span className={clsx('text-[11px] font-mono font-bold px-2 py-0.5 rounded-full', col.badgeColor)}>
                  {colTasks.length}
                </span>
              </div>

              {/* Task Cards List */}
              <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                {colTasks.length === 0 ? (
                  <div className="h-36 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-xl text-slate-400 text-xs text-center p-4">
                    <p>No tasks in {col.label.toLowerCase()}</p>
                    <button
                      onClick={() => setIsNewTaskModalOpen(true)}
                      className="mt-2 text-[11px] text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Create one
                    </button>
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onStatusChange={handleStatusChange}
                      onDelete={handleDeleteTask}
                      onOpenDetail={handleOpenDetail}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Detail & Subtasks Modal */}
      <TaskDetailModal
        task={selectedTaskForDetail}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedTaskForDetail(null);
        }}
        onUpdateTask={handleUpdateTaskFromDetail}
      />

      {/* New Task Creation Modal */}
      {isNewTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="glass-panel p-6 rounded-2xl border border-slate-700 bg-slate-900 w-full max-w-lg shadow-2xl relative">
            <button
              onClick={() => setIsNewTaskModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" /> Create New Project Task
            </h3>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300">Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Implement real-time task status transitions"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full mt-1.5 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Description</label>
                <textarea
                  rows={3}
                  placeholder="Details, technical criteria, or specifications..."
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  className="w-full mt-1.5 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Category</label>
                  <select
                    value={newTaskCategory}
                    onChange={(e) => setNewTaskCategory(e.target.value as TaskCategory)}
                    className="w-full mt-1.5 px-2 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Client Interface">Client Interface</option>
                    <option value="State & Synchronization">State & Sync</option>
                    <option value="Serverless Compute">Serverless Compute</option>
                    <option value="Database & Identity">Database & Identity</option>
                    <option value="Agentic Orchestration">Agentic Orchestration</option>
                    <option value="Edge Delivery">Edge Delivery</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300">Priority</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as TaskPriority)}
                    className="w-full mt-1.5 px-2.5 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300">Due Date</label>
                  <input
                    type="text"
                    placeholder="e.g., Aug 25"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="w-full mt-1.5 px-2.5 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300">Assigned Agent</label>
                  <select
                    value={newTaskAgent}
                    onChange={(e) => setNewTaskAgent(e.target.value as AgentType)}
                    className="w-full mt-1.5 px-2.5 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Worker">Worker</option>
                    <option value="Sentinel">Sentinel</option>
                    <option value="Auditor">Auditor</option>
                    <option value="Human">Human</option>
                    <option value="None">None</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewTaskModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isSubmitting ? 'Saving...' : 'Add Task'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default KanbanBoard;
