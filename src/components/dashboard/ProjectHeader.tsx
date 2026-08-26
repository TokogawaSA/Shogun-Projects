import React, { useState } from 'react';
import { 
  FolderKanban, 
  ChevronDown, 
  Plus, 
  Users, 
  Sparkles, 
  X,
  Layers,
  Building2,
  Check
} from 'lucide-react';
import clsx from 'clsx';
import { apiClient } from '../../services/api';
import { useProject } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import { Project } from '../../types';

import { ProjectClientBadge } from '../../modules/crm/components/ProjectClientBadge';

export const ProjectHeader: React.FC = () => {
  const { currentProjectId, setCurrentProjectId, projects, setProjects } = useProject();
  const { user } = useAuth();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);

  // New Project Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newOrgId, setNewOrgId] = useState('org-shogunate-root');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeProject = projects.find((p) => p.id === currentProjectId) || projects[0] || null;

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsSubmitting(true);
    const newId = `proj-${Date.now().toString(36)}`;
    const createdProject: Project = {
      id: newId,
      title: newTitle.trim(),
      description: newDescription.trim(),
      organizationId: newOrgId.trim(),
      ownerId: user?.uid || 'usr-admin-master',
      members: user?.uid ? [user.uid] : ['usr-admin-master'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await apiClient.post('/projects', createdProject);
    } catch (err) {
      console.warn('Project save fallback:', err);
    }

    setProjects((prev) => [createdProject, ...prev]);
    setCurrentProjectId(newId);
    setNewTitle('');
    setNewDescription('');
    setIsNewProjectModalOpen(false);
    setIsDropdownOpen(false);
    setIsSubmitting(false);
  };

  return (
    <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-slate-900/60 flex flex-wrap items-center justify-between gap-4 shadow-xl">
      {/* Left: Active Project Info & Switcher */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 flex-shrink-0">
          <FolderKanban className="w-6 h-6 text-white" />
        </div>

        <div>
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 text-base font-bold text-white hover:text-indigo-300 transition group text-left cursor-pointer"
            >
              <span>{activeProject ? activeProject.title : 'Select Active Project'}</span>
              <ChevronDown className={clsx('w-4 h-4 text-slate-400 group-hover:text-indigo-300 transition-transform duration-200', isDropdownOpen && 'rotate-180')} />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute left-0 top-full mt-2 w-72 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-2 z-30 space-y-1 backdrop-blur-xl">
                <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Available Workspaces
                </div>

                {projects.map((proj) => (
                  <button
                    key={proj.id}
                    onClick={() => {
                      setCurrentProjectId(proj.id);
                      setIsDropdownOpen(false);
                    }}
                    className={clsx(
                      'w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-left transition',
                      proj.id === currentProjectId
                        ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    )}
                  >
                    <div className="truncate pr-2">
                      <p className="font-semibold text-slate-100">{proj.title}</p>
                      <p className="text-[10px] text-slate-400 font-mono truncate">{proj.id}</p>
                    </div>
                    {proj.id === currentProjectId && <Check className="w-4 h-4 text-indigo-400 flex-shrink-0" />}
                  </button>
                ))}

                <div className="pt-2 border-t border-slate-800">
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setIsNewProjectModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-indigo-400 hover:bg-indigo-600/15 transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Create New Workspace
                  </button>
                </div>
              </div>
            )}
          </div>

          <p className="text-xs text-slate-400 mt-0.5 max-w-xl line-clamp-1">
            {activeProject?.description || 'Collaborative workspace synchronized via Antigravity REST Platform'}
          </p>
        </div>
      </div>

      {/* Right: Organization Badge, Members Avatars & Action Buttons */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* CRM Client Badge */}
        <ProjectClientBadge project={activeProject} />

        {/* Org Badge */}
        {activeProject?.organizationId && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-mono text-[11px]">{activeProject.organizationId}</span>
          </div>
        )}

        {/* Member Avatars */}
        <div className="flex items-center gap-1.5 bg-slate-800/50 px-3 py-1.5 rounded-xl border border-slate-800">
          <Users className="w-4 h-4 text-indigo-400 mr-1" />
          <div className="flex -space-x-2 overflow-hidden">
            {(activeProject?.members && activeProject.members.length > 0 ? activeProject.members : ['Admin', 'Worker', 'Sentinel']).slice(0, 3).map((m, idx) => (
              <div
                key={idx}
                title={`Member: ${m}`}
                className="inline-block h-6 w-6 rounded-full ring-2 ring-slate-900 bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-bold text-[10px] flex items-center justify-center uppercase shadow"
              >
                {typeof m === 'string' ? m.charAt(0) : 'U'}
              </div>
            ))}
          </div>
          <span className="text-[11px] font-medium text-slate-400 ml-1.5">
            {activeProject?.members?.length || 1} {activeProject?.members?.length === 1 ? 'member' : 'members'}
          </span>
        </div>

        {/* Create Project Button */}
        <button
          onClick={() => setIsNewProjectModalOpen(true)}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/30 text-indigo-300 hover:text-white text-xs font-semibold transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Project</span>
        </button>
      </div>

      {/* New Project Modal */}
      {isNewProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-panel p-6 rounded-2xl border border-slate-700 bg-slate-900 w-full max-w-lg shadow-2xl relative">
            <button
              onClick={() => setIsNewProjectModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" /> Create Workspace / Project
            </h3>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300">Project Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., E-Commerce & WooCommerce Sync Hub"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full mt-1.5 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Description</label>
                <textarea
                  rows={3}
                  placeholder="Brief description of the workspace architecture or goals..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full mt-1.5 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Organization ID</label>
                <input
                  type="text"
                  placeholder="org-shogunate-root"
                  value={newOrgId}
                  onChange={(e) => setNewOrgId(e.target.value)}
                  className="w-full mt-1.5 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewProjectModalOpen(false)}
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
                  <span>{isSubmitting ? 'Creating...' : 'Initialize Project'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectHeader;
