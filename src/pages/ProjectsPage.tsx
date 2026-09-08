import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FolderKanban, 
  Plus, 
  Users, 
  ArrowRight, 
  CheckCircle2, 
  Search, 
  Sparkles, 
  X, 
  Calendar, 
  FolderOpen, 
  Loader2, 
  AlertCircle 
} from 'lucide-react';
import clsx from 'clsx';
import { apiClient } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import { Project } from '../types';

export const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentProjectId, setCurrentProjectId, projects: contextProjects, setProjects: setContextProjects } = useProject();

  const [apiProjects, setApiProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Create Project Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newOrgId, setNewOrgId] = useState('org-shogunate-root');
  const [newMembersInput, setNewMembersInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get<any[]>('/projects');
      if (Array.isArray(data)) {
        const loaded: Project[] = data.map((p) => ({
          id: p.id,
          title: p.title || 'Untitled Project',
          description: p.description || '',
          organizationId: p.tenantId || p.organizationId || 'org-shogunate-root',
          ownerId: p.ownerId || user?.uid || 'usr-admin-master',
          members: Array.isArray(p.members) ? p.members : [user?.uid || 'usr-admin-master'],
          createdAt: String(p.createdAt || new Date().toISOString()),
          updatedAt: String(p.updatedAt || new Date().toISOString()),
        }));
        setApiProjects(loaded);
        setContextProjects(loaded);
      }
    } catch (err) {
      console.warn('Could not fetch projects from REST API, using fallback context:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [user]);

  // Combine and deduplicate projects from API and Context
  const allProjects = React.useMemo(() => {
    const combined = [...apiProjects];
    for (const cp of contextProjects) {
      if (!combined.some((p) => p.id === cp.id)) {
        combined.push(cp);
      }
    }
    return combined;
  }, [apiProjects, contextProjects]);

  const filteredProjects = allProjects.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.organizationId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectAndNavigate = (projectId: string) => {
    setCurrentProjectId(projectId);
    navigate('/board');
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    const userUid = user?.uid || 'usr-admin-master';
    
    // Parse additional members
    const parsedAdditional = newMembersInput
      .split(',')
      .map((m) => m.trim())
      .filter((m) => m.length > 0 && m !== userUid);

    const membersList = Array.from(new Set([userUid, ...parsedAdditional]));

    const payload = {
      title: newTitle.trim(),
      description: newDescription.trim(),
      organizationId: newOrgId.trim() || 'org-shogunate-root',
      ownerId: userUid,
      members: membersList,
    };

    try {
      const created = await apiClient.post<any>('/projects', payload);

      const newProject: Project = {
        id: created.id || `proj-${Date.now().toString(36)}`,
        title: created.title || payload.title,
        description: created.description || payload.description,
        organizationId: created.tenantId || payload.organizationId,
        ownerId: created.ownerId || payload.ownerId,
        members: payload.members,
        createdAt: created.createdAt || new Date().toISOString(),
        updatedAt: created.updatedAt || new Date().toISOString(),
      };

      setApiProjects((prev) => [newProject, ...prev]);
      setContextProjects([newProject, ...contextProjects]);
      setCurrentProjectId(newProject.id);

      // Reset form
      setNewTitle('');
      setNewDescription('');
      setNewMembersInput('');
      setIsCreateModalOpen(false);
    } catch (err: any) {
      console.warn('Could not persist project via API:', err);
      setErrorMsg(err.message || 'Failed to create project.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
              <FolderKanban className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Multi-Agent Workspace Projects</h1>
          </div>
          <p className="text-sm text-slate-400">
            Registered project hubs, role assignments, and shared execution pathways.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium rounded-xl shadow-lg shadow-indigo-600/20 transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Hero Banner: ClickUp-Grade Multi-View Engine */}
      <div className="p-5 bg-gradient-to-r from-indigo-950/70 via-slate-900/90 to-purple-950/70 border border-indigo-500/30 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 uppercase tracking-wider font-mono">
              ClickUp-Grade Architecture
            </span>
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              6 Polymorphic Views Active
            </span>
          </div>
          <h2 className="text-base font-bold text-slate-100">
            Universal Multi-View Task Hub & Hierarchy Engine
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl">
            Toggle seamlessly between <strong>List Table</strong>, <strong>Kanban Board</strong>, <strong>Gantt Timeline</strong>, <strong>Calendar</strong>, <strong>Workload Matrix</strong>, and <strong>Mind Map Graph</strong> with recursive subtasks, dynamic custom fields, and dependency cycle prevention.
          </p>
        </div>

        <button
          onClick={() => navigate('/board')}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition flex items-center gap-2 flex-shrink-0"
        >
          <span>Open Task Hub & Views</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search projects by title or org..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Showing {filteredProjects.length} of {allProjects.length} projects
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <p className="text-sm text-slate-400 font-mono">Synchronizing workspace registry from PostgreSQL...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-slate-900/40 border border-slate-800 rounded-2xl text-center space-y-4">
          <div className="p-4 bg-slate-800/60 rounded-full text-slate-400">
            <FolderOpen className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-sm">
            <h3 className="text-base font-semibold text-slate-200">No Projects Found</h3>
            <p className="text-xs text-slate-400">
              {searchQuery ? `No projects match "${searchQuery}".` : 'You do not have access to any projects yet.'}
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Your First Project</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((proj) => {
            const isCurrent = proj.id === currentProjectId;
            const memberCount = proj.members?.length || 1;

            return (
              <div
                key={proj.id}
                onClick={() => handleSelectAndNavigate(proj.id)}
                className={clsx(
                  'group relative flex flex-col justify-between p-6 rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden',
                  isCurrent
                    ? 'bg-slate-900/90 border-indigo-500/50 shadow-xl shadow-indigo-500/10 ring-1 ring-indigo-500/30'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80 hover:shadow-lg'
                )}
              >
                {/* Active Indicator Ribbon */}
                {isCurrent && (
                  <div className="absolute top-0 right-0">
                    <div className="bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-xl flex items-center gap-1 shadow-md">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Active Scope</span>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Icon & Title */}
                  <div className="flex items-start gap-3">
                    <div
                      className={clsx(
                        'p-2.5 rounded-xl border transition-colors',
                        isCurrent
                          ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400'
                          : 'bg-slate-800/80 border-slate-700 text-slate-400 group-hover:text-slate-200 group-hover:border-slate-600'
                      )}
                    >
                      <FolderKanban className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0 pr-16">
                      <h3 className="text-base font-semibold text-slate-100 group-hover:text-indigo-400 transition-colors truncate">
                        {proj.title}
                      </h3>
                      <p className="text-xs text-slate-400 font-mono mt-0.5 truncate">{proj.id}</p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed min-h-[32px]">
                    {proj.description || 'No description provided for this project.'}
                  </p>

                  {/* Metadata Chips */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800/60">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-950/60 border border-slate-800/80 rounded-lg text-[11px] text-slate-400">
                      <Users className="w-3 h-3 text-slate-500" />
                      <span>{memberCount} {memberCount === 1 ? 'member' : 'members'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-950/60 border border-slate-800/80 rounded-lg text-[11px] text-slate-400">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      <span>{new Date(proj.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-500 truncate max-w-[150px]">
                    {proj.organizationId}
                  </span>
                  <div className="flex items-center gap-1 text-xs font-medium text-indigo-400 group-hover:translate-x-0.5 transition-transform">
                    <span>Open Board</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create New Project */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">Create New Project</h3>
                  <p className="text-xs text-slate-400">Initialize a multi-tenant project registry scope</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Project Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Enterprise Cloud Migration"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Description</label>
                <textarea
                  rows={3}
                  placeholder="Describe the scope, objectives, or mission..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Organization / Tenant ID</label>
                <input
                  type="text"
                  placeholder="org-shogunate-root"
                  value={newOrgId}
                  onChange={(e) => setNewOrgId(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Initial Members (Comma separated UIDs)</label>
                <input
                  type="text"
                  placeholder="usr-dev-1, usr-dev-2"
                  value={newMembersInput}
                  onChange={(e) => setNewMembersInput(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newTitle.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/20 transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create Project</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
