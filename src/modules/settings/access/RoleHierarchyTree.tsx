import React, { useState, useEffect } from 'react';
import {
  Network,
  Plus,
  Edit3,
  Trash2,
  Save,
  X,
  ChevronDown,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { apiClient } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { Role } from '../../../types/settings';

export const RoleHierarchyTree: React.FC = () => {
  const { user } = useAuth();
  const tenantId = user?.tenantId || 'tenant-default';

  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  // Form State
  const [roleName, setRoleName] = useState('');
  const [parentRoleId, setParentRoleId] = useState<string | null>(null);
  const [assignedProfileId, setAssignedProfileId] = useState('standard_profile');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const loadRoles = async () => {
      try {
        const res = await apiClient.get<Role[]>('/settings/roles').catch(() => []);
        if (Array.isArray(res) && res.length > 0 && isMounted) {
          setRoles(res);
        } else if (isMounted) {
          // Default seed hierarchy
          const initialRoles: Role[] = [
            {
              id: 'role_ceo',
              name: 'Chief Executive Officer (CEO)',
              parentRoleId: null,
              assignedProfileId: 'admin_profile',
              description: 'Top-level enterprise executive authority',
            },
            {
              id: 'role_vp_eng',
              name: 'VP of Engineering',
              parentRoleId: 'role_ceo',
              assignedProfileId: 'admin_profile',
              description: 'Head of technical delivery and DevOps systems',
            },
            {
              id: 'role_pm_lead',
              name: 'Senior Project Manager',
              parentRoleId: 'role_vp_eng',
              assignedProfileId: 'standard_profile',
              description: 'Coordinates cross-functional product sprints',
            },
            {
              id: 'role_dev',
              name: 'Software Engineer / Agent',
              parentRoleId: 'role_pm_lead',
              assignedProfileId: 'support_profile',
              description: 'Builds core features and fixes tickets',
            },
            {
              id: 'role_vp_sales',
              name: 'VP of Sales & Growth',
              parentRoleId: 'role_ceo',
              assignedProfileId: 'standard_profile',
              description: 'Oversees pipeline revenue and key client accounts',
            },
            {
              id: 'role_sales_rep',
              name: 'Account Executive',
              parentRoleId: 'role_vp_sales',
              assignedProfileId: 'support_profile',
              description: 'Drives outbound prospecting and deal conversions',
            },
          ];
          setRoles(initialRoles);
        }
      } catch {
        // Continue
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadRoles();
    return () => {
      isMounted = false;
    };
  }, [tenantId]);

  const toggleCollapse = (id: string) => {
    setCollapsedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const openRoleModal = (role?: Role, parentId?: string | null) => {
    if (role) {
      setEditingRole(role);
      setRoleName(role.name);
      setParentRoleId(role.parentRoleId || null);
      setAssignedProfileId(role.assignedProfileId || 'standard_profile');
      setDescription(role.description || '');
    } else {
      setEditingRole(null);
      setRoleName('');
      setParentRoleId(parentId !== undefined ? parentId : null);
      setAssignedProfileId('standard_profile');
      setDescription('');
    }
    setIsModalOpen(true);
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) return;

    setSaving(true);
    const roleId = editingRole?.id || `role_${Date.now()}`;
    const roleData: Role = {
      id: roleId,
      name: roleName,
      parentRoleId: parentRoleId || null,
      assignedProfileId,
      description,
      updatedAt: new Date().toISOString(),
    };

    try {
      await apiClient.post('/settings/roles', roleData);
      setRoles((prev) => {
        const idx = prev.findIndex((r) => r.id === roleId);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = roleData;
          return updated;
        }
        return [...prev, roleData];
      });
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to save role:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('Are you sure you want to remove this role?')) return;
    try {
      await apiClient.delete(`/settings/roles/${roleId}`);
      setRoles(roles.filter((r) => r.id !== roleId));
    } catch (err) {
      console.error('Failed to delete role:', err);
    }
  };

  // Build recursive tree from flat array
  const buildTree = (parentId: string | null = null): (Role & { children: any[] })[] => {
    return roles
      .filter((r) => (r.parentRoleId || null) === parentId)
      .map((r) => ({
        ...r,
        children: buildTree(r.id),
      }));
  };

  const roleTree = buildTree(null);

  const renderNode = (node: Role & { children: any[] }, level: number = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isCollapsed = collapsedNodes[node.id];

    return (
      <div key={node.id} className="space-y-2.5">
        <div
          className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-sky-500/40 transition-all duration-200 shadow-md backdrop-blur-md group"
          style={{ marginLeft: `${level * 28}px` }}
        >
          <div className="flex items-center gap-3 min-w-0">
            {hasChildren ? (
              <button
                onClick={() => toggleCollapse(node.id)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                {isCollapsed ? (
                  <ChevronRight className="w-4 h-4 text-sky-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-sky-400" />
                )}
              </button>
            ) : (
              <div className="w-6 flex justify-center">
                <span className="w-2 h-2 rounded-full bg-slate-700" />
              </div>
            )}

            <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 flex-shrink-0">
              <Network className="w-4 h-4" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-white truncate">{node.name}</h4>
                <span className="text-[10px] px-2 py-0.2 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-mono capitalize">
                  {node.assignedProfileId.replace('_', ' ')}
                </span>
              </div>
              {node.description && (
                <p className="text-[11px] text-slate-400 truncate mt-0.5">{node.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => openRoleModal(undefined, node.id)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] font-semibold text-sky-300 hover:text-white flex items-center gap-1 transition-colors"
              title="Add Sub-Role"
            >
              <Plus className="w-3 h-3" />
              <span>Add Sub</span>
            </button>
            <button
              onClick={() => openRoleModal(node)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Edit Role"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleDeleteRole(node.id)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              title="Delete Role"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {hasChildren && !isCollapsed && (
          <div className="space-y-2.5 relative before:absolute before:left-3 before:top-0 before:bottom-3 before:w-px before:bg-slate-800">
            {node.children.map((child: any) => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Network className="w-5 h-5 text-sky-400" />
            Role Hierarchy Tree
          </h2>
          <p className="text-xs text-slate-400">
            Define recursive organizational reporting lines and top-down record roll-up privileges.
          </p>
        </div>
        <button
          onClick={() => openRoleModal(undefined, null)}
          className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all shadow-lg shadow-sky-600/20 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Top-Level Role</span>
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-sky-400 mx-auto mb-2" />
          <p className="text-xs">Loading organizational role tree...</p>
        </div>
      ) : roleTree.length === 0 ? (
        <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-slate-400">
          No roles defined. Click "New Top-Level Role" to initialize the tree.
        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-md space-y-4">
          {roleTree.map((root) => renderNode(root, 0))}
        </div>
      )}

      {/* Add / Edit Role Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Network className="w-5 h-5 text-sky-400" />
                <h3 className="text-sm font-bold text-white">
                  {editingRole ? 'Edit Organization Role' : 'Create Role Node'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRole} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Role Title / Designation</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Project Manager"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Reports To (Parent Role)</label>
                <select
                  value={parentRoleId || ''}
                  onChange={(e) => setParentRoleId(e.target.value ? e.target.value : null)}
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-sky-500 font-sans"
                >
                  <option value="">None (Root Role / Top Executive)</option>
                  {roles
                    .filter((r) => !editingRole || r.id !== editingRole.id)
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Assigned Permission Profile</label>
                <select
                  value={assignedProfileId}
                  onChange={(e) => setAssignedProfileId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-sky-500 font-sans"
                >
                  <option value="admin_profile">Administrator Profile</option>
                  <option value="standard_profile">Standard Executive Profile</option>
                  <option value="support_profile">Field Support Specialist</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Scope of authority and duties..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-sky-600/20"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>{saving ? 'Saving...' : 'Save Role'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleHierarchyTree;
