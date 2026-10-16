import React, { useState } from 'react';
import { 
  FolderKanban, 
  CheckCircle2, 
  Clock, 
  Layers, 
  Users, 
  Calendar, 
  ArrowRight, 
  Edit3, 
  Save, 
  Loader2,
  Sparkles,
  Columns3
} from 'lucide-react';
import { ProjectWorkspaceMeta, Task, Milestone, TaskStatusColumn } from '../types';

interface ProjectOverviewProps {
  project: ProjectWorkspaceMeta;
  tasks: Task[];
  milestones: Milestone[];
  columns: TaskStatusColumn[];
  onUpdateProject: (updates: Partial<ProjectWorkspaceMeta>) => Promise<void>;
  onNavigateTab: (tab: 'board' | 'list' | 'milestones') => void;
}

export const ProjectOverview: React.FC<ProjectOverviewProps> = ({
  project,
  tasks,
  milestones,
  columns,
  onUpdateProject,
  onNavigateTab,
}) => {
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [description, setDescription] = useState(project.description || '');
  const [isSaving, setIsSaving] = useState(false);

  const completedTasks = tasks.filter((t) => t.status === 'done');
  const completionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;
  const completedMilestones = milestones.filter((m) => m.status === 'completed');
  const urgentTasks = tasks.filter((t) => t.priority === 'urgent' && t.status !== 'done');

  const handleSaveDescription = async () => {
    setIsSaving(true);
    try {
      await onUpdateProject({ description: description.trim() });
      setIsEditingDescription(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Executive Vitals Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tasks */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
              Total Tasks
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{tasks.length}</span>
            <span className="text-xs text-slate-400 font-mono">items</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            {completedTasks.length} completed ({completionRate}%)
          </p>
        </div>

        {/* Completion Progress */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
              Progress
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-400">{completionRate}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>

        {/* Milestones */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
              Milestone Gates
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{milestones.length}</span>
            <span className="text-xs text-slate-400 font-mono">gates</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            {completedMilestones.length} of {milestones.length} signed off
          </p>
        </div>

        {/* Urgent Action Items */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
              Urgent Items
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-400">{urgentTasks.length}</span>
            <span className="text-xs text-slate-400 font-mono">active</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">Requires immediate attention</p>
        </div>
      </div>

      {/* 2. Project Scope Description & Details */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-100">Project Mission & Objectives</h3>
          </div>
          {!isEditingDescription && (
            <button
              onClick={() => setIsEditingDescription(true)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Edit</span>
            </button>
          )}
        </div>

        {isEditingDescription ? (
          <div className="space-y-3">
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline project deliverables, requirements, and background..."
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setDescription(project.description || '');
                  setIsEditingDescription(false);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveDescription}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Save</span>
              </button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-300 leading-relaxed min-h-[40px]">
            {project.description || 'No description provided. Click "Edit" to define the scope and objectives for this project.'}
          </p>
        )}

        {/* Metadata Badges */}
        <div className="flex items-center gap-4 text-xs text-slate-400 pt-3 border-t border-slate-800/60 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-slate-500" />
            <span>{project.members?.length || 1} team members</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>
              Created {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'Recently'}
            </span>
          </div>
          <span>•</span>
          <span className="font-mono text-[11px] text-slate-500">ID: {project.id}</span>
        </div>
      </div>

      {/* 3. Workflow Column Breakdown & Quick Jump Navigation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Workflow Stages Distribution */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Columns3 className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-100">Workflow Distribution</h3>
            </div>
            <button
              onClick={() => onNavigateTab('board')}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
            >
              <span>Open Board</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {columns.map((col) => {
              const count = tasks.filter((t) => (t.status || 'todo') === col.id).length;
              const percent = tasks.length > 0 ? Math.round((count / tasks.length) * 100) : 0;
              return (
                <div key={col.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">{col.name}</span>
                    <span className="font-mono text-slate-400 text-[11px]">
                      {count} ({percent}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800/60">
                    <div
                      className="h-full bg-indigo-500 transition-all duration-300"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Launchpad */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl shadow-lg flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-100 mb-1">Quick Launchpad</h3>
            <p className="text-xs text-slate-400">Jump directly to workspace action views:</p>
          </div>

          <div className="space-y-2.5">
            <button
              onClick={() => onNavigateTab('board')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800 hover:border-indigo-500/40 transition-all text-xs group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold">
                  <FolderKanban className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-slate-200 group-hover:text-white">Kanban Board</div>
                  <div className="text-[11px] text-slate-400">Drag and drop tasks through stages</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
            </button>

            <button
              onClick={() => onNavigateTab('list')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800 hover:border-indigo-500/40 transition-all text-xs group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-slate-200 group-hover:text-white">Task List Table</div>
                  <div className="text-[11px] text-slate-400">Sort, filter, and mass update tasks</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
            </button>

            <button
              onClick={() => onNavigateTab('milestones')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800 hover:border-indigo-500/40 transition-all text-xs group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold">
                  <Layers className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-slate-200 group-hover:text-white">Delivery Milestones</div>
                  <div className="text-[11px] text-slate-400">Phase gates and completion rollups</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
