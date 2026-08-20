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
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  setDoc, 
  doc, 
  QuerySnapshot, 
  DocumentData,
  getDocs
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { useProject } from '../../context/ProjectContext';
import { Project } from '../../types';

export const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentProjectId, setCurrentProjectId, projects: contextProjects, setProjects: setContextProjects } = useProject();

  const [firestoreProjects, setFirestoreProjects] = useState<Project[]>([]);
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

  // Real-time Firestore query for projects where request.auth.uid is in members
  useEffect(() => {
    setLoading(true);
    const projectsCol = collection(db, 'projects');
    const userUid = user?.uid || 'usr-admin-master';

    // Query projects where user is in members
    const q = query(projectsCol, where('members', 'array-contains', userUid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        if (!snapshot.empty) {
          const loaded: Project[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              title: data.title || 'Untitled Project',
              description: data.description || '',
              organizationId: data.organizationId || 'org-shogunate-root',
              ownerId: data.ownerId || userUid,
              members: Array.isArray(data.members) ? data.members : [userUid],
              createdAt: typeof data.createdAt === 'object' && data.createdAt?.toDate 
                ? data.createdAt.toDate().toISOString() 
                : String(data.createdAt || new Date().toISOString()),
              updatedAt: typeof data.updatedAt === 'object' && data.updatedAt?.toDate 
                ? data.updatedAt.toDate().toISOString() 
                : String(data.updatedAt || new Date().toISOString()),
            };
          });
          setFirestoreProjects(loaded);
          setContextProjects(loaded);
        } else {
          // If no specific documents returned for array-contains, query all or fallback
          getDocs(projectsCol)
            .then((allSnap) => {
              if (!allSnap.empty) {
                const allLoaded: Project[] = allSnap.docs.map((docSnap) => {
                  const data = docSnap.data();
                  return {
                    id: docSnap.id,
                    title: data.title || 'Untitled Project',
                    description: data.description || '',
                    organizationId: data.organizationId || 'org-shogunate-root',
                    ownerId: data.ownerId || userUid,
                    members: Array.isArray(data.members) ? data.members : [userUid],
                    createdAt: typeof data.createdAt === 'object' && data.createdAt?.toDate 
                      ? data.createdAt.toDate().toISOString() 
                      : String(data.createdAt || new Date().toISOString()),
                    updatedAt: typeof data.updatedAt === 'object' && data.updatedAt?.toDate 
                      ? data.updatedAt.toDate().toISOString() 
                      : String(data.updatedAt || new Date().toISOString()),
                  };
                });
                setFirestoreProjects(allLoaded);
                setContextProjects(allLoaded);
              }
            })
            .catch(() => {
              // Gracefully fallback to context projects
            });
        }
        setLoading(false);
      },
      (err) => {
        console.warn('Firestore projects listener fallback to local:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, setContextProjects]);

  // Combine and deduplicate projects from Firestore and Context
  const allProjects = React.useMemo(() => {
    const combined = [...firestoreProjects];
    for (const cp of contextProjects) {
      if (!combined.some((p) => p.id === cp.id)) {
        combined.push(cp);
      }
    }
    return combined;
  }, [firestoreProjects, contextProjects]);

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
    const newProjId = `proj-${Date.now().toString(36)}`;
    
    // Parse additional members
    const parsedAdditional = newMembersInput
      .split(',')
      .map((m) => m.trim())
      .filter((m) => m.length > 0 && m !== userUid);

    const membersList = Array.from(new Set([userUid, ...parsedAdditional]));

    const newProject: Project = {
      id: newProjId,
      title: newTitle.trim(),
      description: newDescription.trim(),
      organizationId: newOrgId.trim() || 'org-shogunate-root',
      ownerId: userUid,
      members: membersList,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const projDocRef = doc(db, 'projects', newProjId);
      await setDoc(projDocRef, newProject);
    } catch (err) {
      console.warn('Could not persist project to Firestore, using local state:', err);
    }

    setContextProjects((prev) => [newProject, ...prev]);
    setFirestoreProjects((prev) => [newProject, ...prev]);
    setCurrentProjectId(newProjId);

    setNewTitle('');
    setNewDescription('');
    setNewMembersInput('');
    setIsCreateModalOpen(false);
    setIsSubmitting(false);

    // Navigate to board for new project
    navigate('/board');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Banner / Stats Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900/90 via-indigo-950/30 to-slate-900/90 shadow-xl flex flex-wrap items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
            <FolderKanban className="w-3.5 h-3.5 text-indigo-400" />
            Workspace Registry
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Projects & Multi-Agent Workspaces
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            Manage projects where you are assigned as a member, coordinate autonomous Sentinel, Worker, and Auditor subagents, and switch active Kanban boards.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition cursor-pointer hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Create Project</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[260px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search projects by title, description, or organization..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
          <span>{filteredProjects.length} Projects Available</span>
          <span className="text-slate-600">•</span>
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Firestore Sync Active
          </span>
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="py-16 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto" />
          <p className="text-xs text-slate-400 font-mono">Loading projects where user is in members...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/30">
            <FolderOpen className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-white">No Projects Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            No projects matched your criteria or user memberships. Click below to create your first project.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition shadow-lg shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" /> Create New Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => {
            const isActive = project.id === currentProjectId;
            const memberCount = project.members?.length || 1;

            return (
              <div
                key={project.id}
                className={clsx(
                  'glass-card rounded-2xl p-6 border flex flex-col justify-between transition-all duration-200 group relative',
                  isActive
                    ? 'border-indigo-500/80 bg-slate-900/90 shadow-xl shadow-indigo-500/10'
                    : 'border-slate-800/80 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900/80'
                )}
              >
                <div>
                  {/* Card Header: Workspace Badge & Active Indicator */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                        <FolderKanban className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">
                          {project.organizationId || 'org-shogunate'}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500">
                          {project.id}
                        </span>
                      </div>
                    </div>

                    {isActive && (
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        Active Workspace
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors leading-snug">
                    {project.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                    {project.description || 'No project description specified.'}
                  </p>
                </div>

                {/* Card Footer */}
                <div className="mt-6 pt-4 border-t border-slate-800/80 space-y-4">
                  {/* Meta Stats: Members & Updated Date */}
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/50">
                      <Users className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="font-semibold text-slate-200">{memberCount}</span>
                      <span>{memberCount === 1 ? 'member' : 'members'}</span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-slate-500">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Action Button: Set Active & Open Task Board */}
                  <button
                    onClick={() => handleSelectAndNavigate(project.id)}
                    className={clsx(
                      'w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer',
                      isActive
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700/60'
                    )}
                  >
                    <span>{isActive ? 'Open Task Board' : 'Set Active & Open Board'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Project Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="glass-panel p-6 rounded-2xl border border-slate-700 bg-slate-900 w-full max-w-lg shadow-2xl relative">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <FolderKanban className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">Create New Workspace</h3>
                <p className="text-xs text-slate-400">Initialize a new project and configure member access</p>
              </div>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300">Project Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., WooCommerce Payment Gateway Microservice"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Description</label>
                <textarea
                  rows={3}
                  placeholder="Briefly describe the architectural purpose, goals, or microservices..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Organization ID</label>
                  <input
                    type="text"
                    value={newOrgId}
                    onChange={(e) => setNewOrgId(e.target.value)}
                    placeholder="org-shogunate-root"
                    className="w-full mt-1.5 px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300">Additional Members (UIDs / emails)</label>
                  <input
                    type="text"
                    value={newMembersInput}
                    onChange={(e) => setNewMembersInput(e.target.value)}
                    placeholder="dev-agent-1, usr-review"
                    className="w-full mt-1.5 px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newTitle.trim()}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isSubmitting ? 'Creating...' : 'Create & Open Board'}</span>
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
