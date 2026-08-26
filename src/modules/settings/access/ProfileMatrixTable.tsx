import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  Save,
  CheckCircle2,
  Loader2,
  Layers,
} from 'lucide-react';
import { apiClient } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import {
  Profile,
  SupportedModule,
  FieldPermissionLevel,
  ModuleCrudPermissions,
} from '../../../types/settings';

export const ProfileMatrixTable: React.FC = () => {
  const { user } = useAuth();
  const tenantId = user?.tenantId || 'tenant-default';

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('admin_profile');
  const [activeTab, setActiveTab] = useState<'module_crud' | 'field_security'>('module_crud');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const modulesList: { id: SupportedModule; name: string }[] = [
    { id: 'projects', name: 'Projects Hub' },
    { id: 'tasks', name: 'Tasks & Sprints' },
    { id: 'accounts', name: 'Client Accounts' },
    { id: 'contacts', name: 'Contacts Directory' },
    { id: 'deals', name: 'Deals & Revenue Pipeline' },
  ];

  const sampleModuleFields: Record<SupportedModule, string[]> = {
    deals: ['title', 'value', 'pipelineStage', 'expectedCloseDate', 'winProbability', 'assignedRepId'],
    accounts: ['name', 'domain', 'industry', 'tier', 'status', 'billingDetails.currency'],
    contacts: ['firstName', 'lastName', 'email', 'phone', 'lifecycleStage', 'jobTitle'],
    projects: ['title', 'description', 'organizationId', 'ownerId', 'members'],
    tasks: ['title', 'description', 'status', 'priority', 'dueDate', 'assigneeId'],
  };

  const [selectedFieldModule, setSelectedFieldModule] = useState<SupportedModule>('deals');

  useEffect(() => {
    let isMounted = true;

    const loadProfiles = async () => {
      try {
        const res = await apiClient.get<Profile[]>('/settings/profiles').catch(() => []);
        if (Array.isArray(res) && res.length > 0 && isMounted) {
          setProfiles(res);
          if (!res.some((p) => p.id === selectedProfileId)) {
            setSelectedProfileId(res[0].id);
          }
        } else if (isMounted) {
          const defaultProfiles: Profile[] = [
            {
              id: 'admin_profile',
              name: 'System Administrator Profile',
              description: 'Unrestricted full access to all tenant modules and field layouts',
              modulePermissions: {
                projects: { view: true, create: true, edit: true, delete: true },
                tasks: { view: true, create: true, edit: true, delete: true },
                accounts: { view: true, create: true, edit: true, delete: true },
                contacts: { view: true, create: true, edit: true, delete: true },
                deals: { view: true, create: true, edit: true, delete: true },
              },
              fieldPermissions: {
                deals: { value: 'read_write', winProbability: 'read_write' },
                accounts: { 'billingDetails.currency': 'read_write' },
                projects: {},
                tasks: {},
                contacts: {},
              },
            },
            {
              id: 'standard_profile',
              name: 'Standard Executive Profile',
              description: 'Standard day-to-day operations with restricted record deletion',
              modulePermissions: {
                projects: { view: true, create: true, edit: true, delete: false },
                tasks: { view: true, create: true, edit: true, delete: true },
                accounts: { view: true, create: true, edit: true, delete: false },
                contacts: { view: true, create: true, edit: true, delete: false },
                deals: { view: true, create: true, edit: true, delete: false },
              },
              fieldPermissions: {
                deals: { value: 'read_only', winProbability: 'read_write' },
                accounts: { 'billingDetails.currency': 'read_only' },
                projects: {},
                tasks: {},
                contacts: {},
              },
            },
            {
              id: 'support_profile',
              name: 'Field Support Specialist',
              description: 'Read-only pipeline access and assigned task updating',
              modulePermissions: {
                projects: { view: true, create: false, edit: false, delete: false },
                tasks: { view: true, create: true, edit: true, delete: false },
                accounts: { view: true, create: false, edit: false, delete: false },
                contacts: { view: true, create: false, edit: false, delete: false },
                deals: { view: true, create: false, edit: false, delete: false },
              },
              fieldPermissions: {
                deals: { value: 'hidden', winProbability: 'hidden' },
                accounts: {},
                projects: {},
                tasks: {},
                contacts: {},
              },
            },
          ];
          setProfiles(defaultProfiles);
        }
      } catch {
        // Continue
      }
    };

    loadProfiles();
    return () => {
      isMounted = false;
    };
  }, [tenantId, selectedProfileId]);

  const currentProfile = profiles.find((p) => p.id === selectedProfileId);

  const handleToggleModulePerm = (
    moduleKey: SupportedModule,
    permKey: keyof ModuleCrudPermissions
  ) => {
    if (!currentProfile) return;

    const modulePerms = currentProfile.modulePermissions[moduleKey] || {
      view: false,
      create: false,
      edit: false,
      delete: false,
    };

    const updatedProfile: Profile = {
      ...currentProfile,
      modulePermissions: {
        ...currentProfile.modulePermissions,
        [moduleKey]: {
          ...modulePerms,
          [permKey]: !modulePerms[permKey],
        },
      },
    };

    setProfiles(profiles.map((p) => (p.id === currentProfile.id ? updatedProfile : p)));
  };

  const handleSetFieldPerm = (
    moduleKey: string,
    fieldName: string,
    level: FieldPermissionLevel
  ) => {
    if (!currentProfile) return;

    const moduleFields = currentProfile.fieldPermissions[moduleKey] || {};

    const updatedProfile: Profile = {
      ...currentProfile,
      fieldPermissions: {
        ...currentProfile.fieldPermissions,
        [moduleKey]: {
          ...moduleFields,
          [fieldName]: level,
        },
      },
    };

    setProfiles(profiles.map((p) => (p.id === currentProfile.id ? updatedProfile : p)));
  };

  const handleSaveProfile = async () => {
    if (!currentProfile) return;
    setSaving(true);
    setSaveSuccess(false);

    try {
      await apiClient.post('/settings/profiles', currentProfile);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save profile permissions:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-sky-400" />
            Profiles & Permissions Matrix
          </h2>
          <p className="text-xs text-slate-400">
            Define granular module-level CRUD rights and field-level security policies per role profile.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
              <CheckCircle2 className="w-4 h-4" /> Saved!
            </span>
          )}
          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all shadow-lg shadow-sky-600/20 flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>{saving ? 'Saving Matrix...' : 'Save Profile Matrix'}</span>
          </button>
        </div>
      </div>

      {/* Profile Selector Toolbar & Tabs */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-300">Active Profile:</span>
          <select
            value={selectedProfileId}
            onChange={(e) => setSelectedProfileId(e.target.value)}
            className="px-3.5 py-1.5 text-xs font-semibold bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-sky-500 font-sans"
          >
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 gap-1">
          <button
            onClick={() => setActiveTab('module_crud')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'module_crud'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Module CRUD Privileges
          </button>
          <button
            onClick={() => setActiveTab('field_security')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'field_security'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Field-Level Security
          </button>
        </div>
      </div>

      {/* Tab 1: Module CRUD Rights Matrix */}
      {activeTab === 'module_crud' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden backdrop-blur-md">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Module Name</th>
                <th className="px-5 py-3.5 text-center">View (Read)</th>
                <th className="px-5 py-3.5 text-center">Create (Insert)</th>
                <th className="px-5 py-3.5 text-center">Edit (Update)</th>
                <th className="px-5 py-3.5 text-center">Delete (Destroy)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {modulesList.map((m) => {
                const perms = currentProfile?.modulePermissions?.[m.id] || {
                  view: true,
                  create: true,
                  edit: true,
                  delete: false,
                };
                return (
                  <tr key={m.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-4 font-semibold text-white">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-sky-400" />
                        <span>{m.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={perms.view}
                        onChange={() => handleToggleModulePerm(m.id, 'view')}
                        className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-sky-500 focus:ring-sky-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-5 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={perms.create}
                        onChange={() => handleToggleModulePerm(m.id, 'create')}
                        className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-sky-500 focus:ring-sky-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-5 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={perms.edit}
                        onChange={() => handleToggleModulePerm(m.id, 'edit')}
                        className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-sky-500 focus:ring-sky-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-5 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={perms.delete}
                        onChange={() => handleToggleModulePerm(m.id, 'delete')}
                        className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-sky-500 focus:ring-sky-500 cursor-pointer"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Field-Level Security Matrix */}
      {activeTab === 'field_security' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">Target Field Module:</span>
            <select
              value={selectedFieldModule}
              onChange={(e) => setSelectedFieldModule(e.target.value as SupportedModule)}
              className="px-3 py-1 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white font-sans"
            >
              {modulesList.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden backdrop-blur-md">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Field Key</th>
                  <th className="px-5 py-3.5 text-center">Read / Write</th>
                  <th className="px-5 py-3.5 text-center">Read Only</th>
                  <th className="px-5 py-3.5 text-center">Hidden (No Access)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {(sampleModuleFields[selectedFieldModule] || []).map((fieldName) => {
                  const currentLevel: FieldPermissionLevel =
                    currentProfile?.fieldPermissions?.[selectedFieldModule]?.[fieldName] || 'read_write';

                  return (
                    <tr key={fieldName} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-white text-xs">{fieldName}</td>
                      <td className="px-5 py-3.5 text-center">
                        <input
                          type="radio"
                          name={`field_${fieldName}`}
                          checked={currentLevel === 'read_write'}
                          onChange={() => handleSetFieldPerm(selectedFieldModule, fieldName, 'read_write')}
                          className="w-4 h-4 text-sky-500 bg-slate-800 border-slate-700 cursor-pointer"
                        />
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <input
                          type="radio"
                          name={`field_${fieldName}`}
                          checked={currentLevel === 'read_only'}
                          onChange={() => handleSetFieldPerm(selectedFieldModule, fieldName, 'read_only')}
                          className="w-4 h-4 text-amber-500 bg-slate-800 border-slate-700 cursor-pointer"
                        />
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <input
                          type="radio"
                          name={`field_${fieldName}`}
                          checked={currentLevel === 'hidden'}
                          onChange={() => handleSetFieldPerm(selectedFieldModule, fieldName, 'hidden')}
                          className="w-4 h-4 text-rose-500 bg-slate-800 border-slate-700 cursor-pointer"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileMatrixTable;
