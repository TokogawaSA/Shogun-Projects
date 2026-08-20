import React from 'react';
import { ProjectHeader } from '../components/dashboard/ProjectHeader';
import { KanbanBoard } from '../components/dashboard/KanbanBoard';
import { useProject } from '../context/ProjectContext';
import { FolderPlus } from 'lucide-react';

export const TaskBoardPage: React.FC = () => {
  const { currentProjectId } = useProject();

  return (
    <div className="space-y-6">
      {/* Project Workspace Header & Switcher */}
      <ProjectHeader />

      {/* Task Board Content */}
      {!currentProjectId ? (
        <div className="glass-panel p-12 rounded-2xl border border-slate-800 bg-slate-900/40 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/30">
            <FolderPlus className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-white">No Active Workspace Selected</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Please select or create a project workspace from the header dropdown above to view and synchronize real-time tasks.
          </p>
        </div>
      ) : (
        <KanbanBoard />
      )}
    </div>
  );
};

export default TaskBoardPage;
