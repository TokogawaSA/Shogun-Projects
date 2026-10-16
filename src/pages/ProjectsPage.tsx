import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Users, 
  ArrowRight, 
  Search, 
  X, 
  FolderOpen, 
  Loader2, 
  AlertCircle,
  LayoutGrid,
  List,
  FolderKanban,
  Building2,
  Clock,
  Sparkles
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
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'mine'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Create Project Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const newOrgId = 'org-shogunate-root';
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
  const allProjects = useMemo(() => {
    const combined = [...apiProjects];
    for (const cp of contextProjects) {
      if (!combined.some((p) => p.id === cp.id)) {
        combined.push(cp);
      }
    }
    return combined;
  }, [apiProjects, contextProjects]);

  // Filter projects by search query and active tab
  const filteredProjects = useMemo(() => {
    return allProjects.filter((p) => {
      const matchesSearch = 
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (selectedFilter === 'mine') {
        const userUid = user?.uid || 'usr-admin-master';
        return p.ownerId === userUid || p.members?.includes(userUid);
      }
      return true;
    });
  }, [allProjects, searchQuery, selectedFilter, user]);

  const handleSelectAndNavigate = (projectId: string) => {
    setCurrentProjectId(projectId);
    navigate(`/projects/${projectId}`);
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

      // Navigate to project hub
      navigate(`/projects/${newProject.id}`);
    } catch (err: any) {
      console.warn('Could not persist project via API:', err);
      setErrorMsg(err.message || 'Failed to create project.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12">
      {/* 1. Header Toolbar */}
      <div className="relative overflow-hidden bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl shadow-xl transition-all">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500/20 via-indigo-600/15 to-violet-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400 shrink-0 shadow-sm">
              <FolderKanban className="w-5 h-5" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="px-2 py-0.5 rounded-md bg-slate-800/90 border border-slate-700/70 text-slate-300 font-mono text-[11px] font-semibold tracking-wider">
                  DIRECTORY
                </span>
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Projects Portfolio
                </h1>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                <span className="flex items-center gap-1 text-slate-300">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  {allProjects.length} {allProjects.length === 1 ? 'Project Hub' : 'Project Hubs'}
                </span>
                <span className="text-slate-600">•</span>
                <span className="flex items-center gap-1 text-indigo-400 font-medium">
                  <Sparkles className="w-3 h-3" />
                  Streamlined Project Management
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all self-start lg:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* 2. Filter Navigation Bar */}
      <div className="bg-slate-900/80 border border-slate-800/80 p-1.5 rounded-2xl backdrop-blur-xl shadow-lg sticky top-0 z-20 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setSelectedFilter('all')}
            className={clsx(
              "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-150 whitespace-nowrap",
              selectedFilter === 'all'
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold ring-1 ring-indigo-400/40"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            )}
          >
            <FolderKanban className="w-3.5 h-3.5" />
            <span>All Projects</span>
            <span className={clsx(
              "px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold",
              selectedFilter === 'all' ? "bg-indigo-700 text-white" : "bg-slate-800 text-slate-400"
            )}>
              {allProjects.length}
            </span>
          </button>

          <button
            onClick={() => setSelectedFilter('mine')}
            className={clsx(
              "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-150 whitespace-nowrap",
              selectedFilter === 'mine'
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold ring-1 ring-indigo-400/40"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            )}
          >
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>My Projects</span>
          </button>
        </div>

        {/* Search Input & View Toggles */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by title, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/60 transition-all font-sans"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex items-center bg-slate-950/80 border border-slate-800/90 p-0.5 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={clsx(
                "p-1.5 rounded-lg transition-colors",
                viewMode === 'grid' ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
              )}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={clsx(
                "p-1.5 rounded-lg transition-colors",
                viewMode === 'list' ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
              )}
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Main Projects Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3 bg-slate-900/40 rounded-2xl border border-slate-800/80 backdrop-blur-xl">
          <Loader2 className="w-7 h-7 animate-spin text-indigo-400" />
          <p className="text-xs text-slate-400 font-medium">Loading workspace directory...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl text-center space-y-4 backdrop-blur-xl">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <FolderOpen className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-sm">
            <h3 className="text-base font-semibold text-slate-200">
              {searchQuery ? 'No matching projects found' : 'No projects available'}
            </h3>
            <p className="text-xs text-slate-400">
              {searchQuery 
                ? `No projects matched "${searchQuery}". Clear your search to see all projects.` 
                : 'Create your first project to start managing tasks, milestones, and teams.'}
            </p>
          </div>
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition-colors"
            >
              Clear Search Filter
            </button>
          ) : (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create First Project</span>
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((proj) => {
            const isCurrent = proj.id === currentProjectId;
            const memberCount = proj.members?.length || 1;
            const projectCode = proj.id.slice(0, 10).toUpperCase();

            return (
              <div
                key={proj.id}
                onClick={() => handleSelectAndNavigate(proj.id)}
                className={clsx(
                  'group relative overflow-hidden rounded-2xl p-5 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between border',
                  isCurrent
                    ? 'bg-slate-900/90 border-indigo-500/60 shadow-indigo-500/10 ring-1 ring-indigo-500/30'
                    : 'bg-slate-900/80 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/95'
                )}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3.5 relative">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 via-indigo-600/15 to-violet-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400 shrink-0 shadow-sm group-hover:border-indigo-500/50 transition-colors">
                        <FolderKanban className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <span className="px-1.5 py-0.5 rounded-md bg-slate-800/90 border border-slate-700/70 text-slate-300 font-mono text-[10px] font-semibold tracking-wider">
                          {projectCode}
                        </span>
                        <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors truncate mt-0.5">
                          {proj.title}
                        </h3>
                      </div>
                    </div>

                    {isCurrent && (
                      <span className="shrink-0 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[11px] font-mono font-medium flex items-center gap-1 shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Active
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed min-h-[34px] mb-4">
                    {proj.description || 'No description provided for this project.'}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-slate-400 pt-2 border-t border-slate-800/60">
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      <span>{memberCount} {memberCount === 1 ? 'member' : 'members'}</span>
                    </div>
                    <span className="text-slate-700">•</span>
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>
                        {new Date(proj.createdAt).toLocaleDateString(undefined, { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3.5 border-t border-slate-800/60 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-mono">Workspace</span>
                  <div className="flex items-center gap-1 text-xs font-semibold text-indigo-400 group-hover:text-indigo-300 group-hover:translate-x-0.5 transition-all">
                    <span>Open Hub</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl divide-y divide-slate-800/70 backdrop-blur-xl">
          {filteredProjects.map((proj) => {
            const isCurrent = proj.id === currentProjectId;
            const memberCount = proj.members?.length || 1;
            const projectCode = proj.id.slice(0, 10).toUpperCase();

            return (
              <div
                key={proj.id}
                onClick={() => handleSelectAndNavigate(proj.id)}
                className={clsx(
                  'group flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 transition-colors cursor-pointer',
                  isCurrent
                    ? 'bg-slate-900/95 hover:bg-slate-900'
                    : 'hover:bg-slate-800/40'
                )}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 via-indigo-600/15 to-violet-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400 shrink-0 shadow-sm">
                    <FolderKanban className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="px-1.5 py-0.5 rounded-md bg-slate-800/90 border border-slate-700/70 text-slate-300 font-mono text-[10px] font-semibold tracking-wider">
                        {projectCode}
                      </span>
                      <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors truncate">
                        {proj.title}
                      </h3>
                      {isCurrent && (
                        <span className="px-2 py-0.2 rounded-md bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[10px] font-mono font-medium flex items-center gap-1 shadow-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 truncate max-w-md">
                      {proj.description || 'No description provided.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0">
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <div className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      <span>{memberCount}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{new Date(proj.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSelectAndNavigate(proj.id)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
                  >
                    <span>Open</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Create Project Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div 
            className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <FolderKanban className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">Create New Project</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Initialize a new project hub for tracking tasks and milestones
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mx-6 mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateProject} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Project Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Website Redesign, Infrastructure Migration"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/60 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Description</label>
                <textarea
                  rows={3}
                  placeholder="Outline project objectives, deliverables, or mission..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/60 transition-all resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Invite Team Members</label>
                <input
                  type="text"
                  placeholder="Enter user emails separated by commas"
                  value={newMembersInput}
                  onChange={(e) => setNewMembersInput(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 text-xs font-medium border border-slate-700/60 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newTitle.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
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
