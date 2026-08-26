import React, { useState } from 'react';
import { ProjectHeader } from '../components/dashboard/ProjectHeader';
import { KanbanBoard } from '../components/dashboard/KanbanBoard';
import { TaskTree } from '../modules/projects/tasks/TaskTree';
import { useProject } from '../context/ProjectContext';
import { useTasks } from '../hooks/useTasks';
import { FolderPlus, Kanban, FolderTree } from 'lucide-react';

export const TaskBoardPage: React.FC = () => {
  const { currentProjectId } = useProject();
  const [activeView, setActiveView] = useState<'kanban' | 'tree'>('kanban');
  const { tasks } = useTasks(currentProjectId || undefined);

  return (
    <div className="space-y-6">
      {/* Project Workspace Header & Switcher */}
      <ProjectHeader />

      {/* View Switcher Bar */}
      {currentProjectId && (
        <div className="flex items-center justify-between gap-4 p-2 bg-slate-900/80 border border-slate-800 rounded-2xl">
          <div className="flex items-center gap-1.5 bg-slate-950/60 p-1 rounded-xl border border-slate-800/80">
            <button
              onClick={() => setActiveView('kanban')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                activeView === 'kanban'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              Kanban Board
            </button>

            <button
              onClick={() => setActiveView('tree')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                activeView === 'tree'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <FolderTree className="w-3.5 h-3.5" />
              Recursive Task Tree ({tasks.length})
            </button>
          </div>

          <div className="text-xs text-slate-400 font-mono pr-2 hidden sm:block">
            {activeView === 'kanban' ? 'Visual workflow columns' : 'Multi-level nested sub-tasks & time tracking'}
          </div>
        </div>
      )}

      {/* Task Board Content */}
      {!currentProjectId ? (
        <div className="glass-panel p-12 rounded-2xl border border-slate-800 bg-slate-900/40 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto border border-indigo-200">
            <FolderPlus className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-100">No Active Workspace Selected</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Please select or create a project workspace from the header dropdown above to view and synchronize real-time tasks.
          </p>
        </div>
      ) : activeView === 'kanban' ? (
        <KanbanBoard />
      ) : (
        <TaskTree tasks={tasks} projectId={currentProjectId} />
      )}
    </div>
  );
};

export default TaskBoardPage;
