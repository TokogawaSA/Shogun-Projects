import React, { useState } from 'react';
import { 
  Users, 
  Network, 
  KeyRound, 
  Share2, 
  Plus, 
  ShieldCheck, 
  Edit3, 
  Save, 
  X,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { ModuleName } from '../../../types/settings';

// =========================================================================
// 1. User Management View
// =========================================================================
export const UserManagementView: React.FC = () => {
  const { user } = useAuth();
  const [targetUid, setTargetUid] = useState('');
  const [selectedRole, setSelectedRole] = useState('manager');
  const [selectedProfile, setSelectedProfile] = useState('standard_profile');
  const [isTenantAdmin, setIsTenantAdmin] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const mockUsers = [
    {
      uid: user?.uid || 'usr_001',
      displayName: user?.displayName || 'Chief Admin',
      email: user?.email || 'admin@shogunate.dev',
      role: 'admin',
      profile: 'System Administrator Profile',
      isTenantAdmin: true,
      status: 'Active',
    },
    {
      uid: 'usr_002',
      displayName: 'Sarah Connor',
      email: 'sarah.c@shogunate.dev',
      role: 'project_manager',
      profile: 'Standard Project Manager',
      isTenantAdmin: false,
      status: 'Active',
    },
    {
      uid: 'usr_003',
      displayName: 'Alex Mercer',
      email: 'alex.m@shogunate.dev',
      role: 'developer',
      profile: 'Field Support Profile',
      isTenantAdmin: false,
      status: 'Active',
    },
  ];

  const handleSyncClaims = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUid) {
      setStatusMessage({ text: 'Please enter a target User UID or email.', type: 'error' });
      return;
    }
    setStatusMessage({
      text: `Custom claims and tenant profile updated successfully for ${targetUid}`,
      type: 'success',
    });
    setTargetUid('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-400" />
            User Management & Tenant Claims
          </h2>
          <p className="text-xs text-slate-400">
            Invite tenant operators, assign profile roles, and synchronize Firebase Auth custom claims.
          </p>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-xl border text-xs font-medium flex items-center justify-between ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
          }`}
        >
          <span>{statusMessage.text}</span>
          <button onClick={() => setStatusMessage(null)} className="p-1 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Sync Claims Form */}
      <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 backdrop-blur-md space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-sky-400" />
          Assign User Roles & Custom Claims
        </h3>
        <form onSubmit={handleSyncClaims} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Target User UID / Email</label>
            <input
              type="text"
              placeholder="e.g. user_firebase_uid"
              value={targetUid}
              onChange={(e) => setTargetUid(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Assigned Role</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500"
            >
              <option value="admin">Administrator</option>
              <option value="manager">Manager / Lead</option>
              <option value="project_manager">Project Manager</option>
              <option value="developer">Developer / Agent</option>
              <option value="viewer">Read-Only Viewer</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Permission Profile</label>
            <select
              value={selectedProfile}
              onChange={(e) => setSelectedProfile(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500"
            >
              <option value="admin_profile">System Administrator Profile</option>
              <option value="standard_profile">Standard Executive Profile</option>
              <option value="support_profile">Field Support Profile</option>
            </select>
          </div>

          <div className="space-y-1.5 flex flex-col justify-end">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer pb-2">
              <input
                type="checkbox"
                checked={isTenantAdmin}
                onChange={(e) => setIsTenantAdmin(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-sky-500 focus:ring-sky-500"
              />
              <span>Grant Tenant Admin</span>
            </label>
            <button
              type="submit"
              className="w-full py-2 px-4 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Apply Claims</span>
            </button>
          </div>
        </form>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden backdrop-blur-md">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-800/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Assigned Role</th>
              <th className="px-4 py-3">Profile</th>
              <th className="px-4 py-3">Claims</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {mockUsers.map((u) => (
              <tr key={u.uid} className="hover:bg-slate-800/40 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-semibold text-white">{u.displayName}</p>
                  <p className="text-[11px] text-slate-400 font-mono">{u.email}</p>
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-200 font-mono">
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-300">{u.profile}</td>
                <td className="px-4 py-3">
                  {u.isTenantAdmin ? (
                    <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] font-mono">
                      isTenantAdmin: true
                    </span>
                  ) : (
                    <span className="text-slate-500 font-mono text-[10px]">Standard User</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-slate-800 transition-colors">
                    <Edit3 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// =========================================================================
// 2. Role Hierarchy Tree View
// =========================================================================
export const RoleHierarchyView: React.FC = () => {
  const rolesTree = [
    {
      id: 'role_ceo',
      name: 'Chief Executive Officer (CEO)',
      profile: 'System Administrator Profile',
      children: [
        {
          id: 'role_sales_vp',
          name: 'VP of Sales & Growth',
          profile: 'Sales Executive Profile',
          children: [
            { id: 'role_sales_lead', name: 'Sales Team Lead', profile: 'Sales Representative Profile', children: [] },
            { id: 'role_sales_rep', name: 'Sales Representative', profile: 'Sales Representative Profile', children: [] },
          ],
        },
        {
          id: 'role_engineering_vp',
          name: 'VP of Engineering & Delivery',
          profile: 'Project Director Profile',
          children: [
            { id: 'role_pm', name: 'Senior Project Manager', profile: 'Standard Project Manager', children: [] },
            { id: 'role_dev', name: 'Software Engineer', profile: 'Developer Profile', children: [] },
          ],
        },
      ],
    },
  ];

  const renderTree = (node: any, level: number = 0) => (
    <div key={node.id} className="space-y-2" style={{ marginLeft: `${level * 24}px` }}>
      <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 hover:border-indigo-500/40 transition-all">
        <Network className="w-4 h-4 text-sky-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-white truncate">{node.name}</p>
          <p className="text-[11px] text-slate-400 font-mono">Assigned Profile: {node.profile}</p>
        </div>
        <button className="text-[10px] px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors">
          Add Sub-Role
        </button>
      </div>
      {node.children && node.children.map((child: any) => renderTree(child, level + 1))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Network className="w-5 h-5 text-sky-400" />
            Role Hierarchy Tree
          </h2>
          <p className="text-xs text-slate-400">
            Define top-down organizational reporting hierarchy and record roll-up visibility.
          </p>
        </div>
        <button className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" />
          <span>New Top Role</span>
        </button>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md space-y-4">
        {rolesTree.map((root) => renderTree(root))}
      </div>
    </div>
  );
};

// =========================================================================
// 3. Profiles & Permissions Matrix View
// =========================================================================
export const ProfilesMatrixView: React.FC = () => {
  const modules: ModuleName[] = ['projects', 'tasks', 'accounts', 'contacts', 'deals'];
  const [selectedProfile, setSelectedProfile] = useState<string>('admin');

  const [permissions, setPermissions] = useState<Record<string, { view: boolean; create: boolean; edit: boolean; delete: boolean }>>({
    projects: { view: true, create: true, edit: true, delete: true },
    tasks: { view: true, create: true, edit: true, delete: true },
    accounts: { view: true, create: true, edit: true, delete: false },
    contacts: { view: true, create: true, edit: true, delete: false },
    deals: { view: true, create: true, edit: true, delete: false },
  });

  const togglePerm = (mod: string, action: 'view' | 'create' | 'edit' | 'delete') => {
    setPermissions((prev) => ({
      ...prev,
      [mod]: {
        ...prev[mod],
        [action]: !prev[mod][action],
      },
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-sky-400" />
            Profiles & Permissions Matrix
          </h2>
          <p className="text-xs text-slate-400">
            Configure module-level CRUD and field-level permissions per security profile.
          </p>
        </div>
        <button className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5">
          <Save className="w-3.5 h-3.5" />
          <span>Save Profile Matrix</span>
        </button>
      </div>

      {/* Profile Selector */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
        <label className="text-xs font-semibold text-slate-300">Editing Profile:</label>
        <select
          value={selectedProfile}
          onChange={(e) => setSelectedProfile(e.target.value)}
          className="px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500"
        >
          <option value="admin">System Administrator</option>
          <option value="standard">Standard Executive</option>
          <option value="support">Field Support Specialist</option>
          <option value="sales">Sales Representative</option>
        </select>
      </div>

      {/* Module CRUD Matrix */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden backdrop-blur-md">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-800/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
            <tr>
              <th className="px-4 py-3">Module</th>
              <th className="px-4 py-3 text-center">View</th>
              <th className="px-4 py-3 text-center">Create</th>
              <th className="px-4 py-3 text-center">Edit</th>
              <th className="px-4 py-3 text-center">Delete</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {modules.map((mod) => {
              const perm = permissions[mod] || { view: true, create: true, edit: true, delete: false };
              return (
                <tr key={mod} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 font-semibold text-white capitalize">{mod}</td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={perm.view}
                      onChange={() => togglePerm(mod, 'view')}
                      className="rounded bg-slate-800 border-slate-700 text-sky-500 focus:ring-sky-500"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={perm.create}
                      onChange={() => togglePerm(mod, 'create')}
                      className="rounded bg-slate-800 border-slate-700 text-sky-500 focus:ring-sky-500"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={perm.edit}
                      onChange={() => togglePerm(mod, 'edit')}
                      className="rounded bg-slate-800 border-slate-700 text-sky-500 focus:ring-sky-500"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={perm.delete}
                      onChange={() => togglePerm(mod, 'delete')}
                      className="rounded bg-slate-800 border-slate-700 text-sky-500 focus:ring-sky-500"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// =========================================================================
// 4. Data Sharing Rules View
// =========================================================================
export const DataSharingRulesView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Share2 className="w-5 h-5 text-sky-400" />
            Data Sharing Rules & Organization Defaults
          </h2>
          <p className="text-xs text-slate-400">
            Set organization-wide default access (Public Read/Write, Public Read-Only, or Private) and custom sharing rules.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {['Accounts', 'Contacts', 'Deals Pipeline', 'Projects & Tasks'].map((mod) => (
          <div key={mod} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">{mod}</h3>
              <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono">
                Organization Default
              </span>
            </div>
            <select className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500">
              <option>Private (Owner & Hierarchy Only)</option>
              <option>Public Read-Only (All Tenant Members)</option>
              <option>Public Read/Write (Full Collaboration)</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  );
};
