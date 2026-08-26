import React, { useState } from 'react';
import { 
  Award, 
  Users, 
  Plus, 
  Trash2, 
  Save, 
  Search, 
  Check, 
  Layers, 
  DollarSign, 
  Clock, 
  Briefcase,
  Sparkles,
  Loader2
} from 'lucide-react';
import { useResourceCapacity } from '../hooks/useResourceCapacity';
import { SkillMatrix, ResourceProfile } from '../../../types';

export const SkillMatrixEditor: React.FC = () => {
  const { profiles, workloads, skills, loading, saveProfile, saveSkill, deleteSkill } =
    useResourceCapacity();

  const [activeTab, setActiveTab] = useState<'profiles' | 'skills'>('profiles');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  // Edit states for Profile
  const [editDepartment, setEditDepartment] = useState<string>('');
  const [editWeeklyHours, setEditWeeklyHours] = useState<number>(40);
  const [editCostRate, setEditCostRate] = useState<number>(75);
  const [editBillingRate, setEditBillingRate] = useState<number>(150);
  const [editSkills, setEditSkills] = useState<string[]>([]);
  const [savingProfile, setSavingProfile] = useState<boolean>(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);

  // Edit states for New Skill
  const [newSkillName, setNewSkillName] = useState<string>('');
  const [newSkillCategory, setNewSkillCategory] = useState<string>('Frontend');
  const [creatingSkill, setCreatingSkill] = useState<boolean>(false);

  const categories = [
    'Frontend',
    'Backend',
    'DevOps',
    'Data Architecture',
    'Security & QA',
    'Product Management',
    'AI & Machine Learning',
  ];

  // When selecting a profile, load its values
  const handleSelectProfile = (userId: string) => {
    setSelectedProfileId(userId);
    setProfileSuccessMsg(null);
    const prof = profiles.find((p) => p.userId === userId);
    const summary = workloads[userId];

    if (prof) {
      setEditDepartment(prof.department || 'Engineering');
      setEditWeeklyHours(prof.weeklyCapacityHours || 40);
      setEditCostRate(prof.hourlyCostRate || 75);
      setEditBillingRate(prof.hourlyBillingRate || 150);
      setEditSkills(prof.skills || []);
    } else if (summary) {
      setEditDepartment(summary.department || 'Engineering');
      setEditWeeklyHours(summary.weeklyCapacityHours || 40);
      setEditCostRate(summary.hourlyCostRate || 75);
      setEditBillingRate(summary.hourlyBillingRate || 150);
      setEditSkills(summary.skills || []);
    }
  };

  const toggleSkillTag = (skillId: string) => {
    setEditSkills((prev) =>
      prev.includes(skillId) ? prev.filter((id) => id !== skillId) : [...prev, skillId]
    );
  };

  const handleSaveProfile = async () => {
    if (!selectedProfileId) return;

    setSavingProfile(true);
    setProfileSuccessMsg(null);

    const targetProf = profiles.find((p) => p.userId === selectedProfileId);
    const updatedProfile: ResourceProfile = {
      userId: selectedProfileId,
      tenantId: targetProf?.tenantId || 'tenant-default',
      department: editDepartment,
      skills: editSkills,
      weeklyCapacityHours: Number(editWeeklyHours),
      hourlyCostRate: Number(editCostRate),
      hourlyBillingRate: Number(editBillingRate),
      globalWorkloadHours: targetProf?.globalWorkloadHours || {},
    };

    try {
      await saveProfile(updatedProfile);
      setProfileSuccessMsg('Resource profile saved successfully!');
      setTimeout(() => setProfileSuccessMsg(null), 3500);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCreateSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;

    setCreatingSkill(true);
    const newSkill: SkillMatrix = {
      skillId: `sk-${newSkillName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString(36)}`,
      name: newSkillName.trim(),
      category: newSkillCategory,
    };

    try {
      await saveSkill(newSkill);
      setNewSkillName('');
    } catch (err) {
      console.error(err);
    } finally {
      setCreatingSkill(false);
    }
  };

  const memberList = Object.values(workloads).filter(
    (m) =>
      m.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedMemberSummary = selectedProfileId ? workloads[selectedProfileId] : null;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              Skill Matrix & Resource Profile Registry
            </h1>
            <p className="text-xs text-slate-400">
              Manage organization capability matrices, billing rate bands & capacity hours
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('profiles')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'profiles'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            Resource Profiles ({profiles.length})
          </button>
          <button
            onClick={() => setActiveTab('skills')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'skills'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            Skill Taxonomy ({skills.length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 className="w-7 h-7 animate-spin text-indigo-500" />
          <p className="text-xs">Loading Resource Capacity & Skill Matrix...</p>
        </div>
      ) : activeTab === 'profiles' ? (
        /* Profiles View */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Member Selection List */}
          <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-5 space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search engineers & roles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
              {memberList.map((member) => {
                const isSelected = selectedProfileId === member.userId;
                return (
                  <div
                    key={member.userId}
                    onClick={() => handleSelectProfile(member.userId)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600/15 border-indigo-500 shadow-md ring-1 ring-indigo-500/30'
                        : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 text-indigo-300 font-bold text-xs flex items-center justify-center border border-slate-700">
                          {member.displayName
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-white">{member.displayName}</p>
                          <p className="text-[11px] text-slate-400">{member.department}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {member.weeklyCapacityHours}h/wk
                        </span>
                        <p className="text-[10px] text-emerald-400 font-mono mt-0.5">
                          ${member.hourlyBillingRate}/h
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Profile Editor Panel */}
          <div className="lg:col-span-2 bg-slate-900/60 rounded-2xl border border-slate-800 p-6">
            {selectedMemberSummary ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-300 text-sm">
                      {selectedMemberSummary.displayName
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white">
                        {selectedMemberSummary.displayName}
                      </h2>
                      <p className="text-xs text-slate-400">{selectedMemberSummary.email}</p>
                    </div>
                  </div>

                  {profileSuccessMsg && (
                    <div className="text-xs text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 animate-fadeIn">
                      <Check className="w-4 h-4" />
                      {profileSuccessMsg}
                    </div>
                  )}
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                      Department / Organization Unit
                    </label>
                    <input
                      type="text"
                      value={editDepartment}
                      onChange={(e) => setEditDepartment(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      Weekly Capacity (Hours)
                    </label>
                    <input
                      type="number"
                      min={10}
                      max={80}
                      value={editWeeklyHours}
                      onChange={(e) => setEditWeeklyHours(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-rose-400" />
                      Hourly Internal Cost Rate ($/hr)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={editCostRate}
                      onChange={(e) => setEditCostRate(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                      Hourly Client Billing Rate ($/hr)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={editBillingRate}
                      onChange={(e) => setEditBillingRate(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Skill Matrix Tag Assigner */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      Assigned Skill Tags ({editSkills.length} selected)
                    </label>
                    <span className="text-[11px] text-slate-500">
                      Click tags to toggle capability mapping
                    </span>
                  </div>

                  <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800/80 flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                    {skills.map((skill) => {
                      const isAssigned = editSkills.includes(skill.skillId);
                      return (
                        <button
                          key={skill.skillId}
                          type="button"
                          onClick={() => toggleSkillTag(skill.skillId)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                            isAssigned
                              ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400'
                              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-slate-200'
                          }`}
                        >
                          {isAssigned && <Check className="w-3.5 h-3.5" />}
                          <span>{skill.name}</span>
                          <span className="text-[9px] opacity-70 font-mono">
                            ({skill.category})
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Save Action */}
                <div className="pt-4 border-t border-slate-800 flex justify-end">
                  <button
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                    className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    {savingProfile ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving Profile...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Update Resource Profile
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-96 flex flex-col items-center justify-center text-slate-400 space-y-3">
                <Users className="w-10 h-10 text-slate-600" />
                <p className="text-xs">Select a team member on the left to configure their profile</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Skills Taxonomy View */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add Skill Form */}
          <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-6 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-400" />
              Register New Skill
            </h2>

            <form onSubmit={handleCreateSkill} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Skill / Competency Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Next.js App Router"
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Taxonomy Category
                </label>
                <select
                  value={newSkillCategory}
                  onChange={(e) => setNewSkillCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={!newSkillName.trim() || creatingSkill}
                className="w-full py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {creatingSkill ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Add Skill to Registry
              </button>
            </form>
          </div>

          {/* Skill List by Categories */}
          <div className="lg:col-span-2 bg-slate-900/60 rounded-2xl border border-slate-800 p-6 space-y-6">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              Active System Skills Directory ({skills.length})
            </h2>

            <div className="space-y-6 max-h-[600px] overflow-y-auto pr-1">
              {categories.map((cat) => {
                const catSkills = skills.filter((s) => s.category === cat);
                if (catSkills.length === 0) return null;

                return (
                  <div key={cat} className="space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                      <span className="w-2 h-2 rounded-full bg-indigo-500" />
                      <span>{cat}</span>
                      <span className="text-[10px] font-mono text-slate-500">
                        ({catSkills.length})
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {catSkills.map((skill) => (
                        <div
                          key={skill.skillId}
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 group hover:border-slate-700"
                        >
                          <div>
                            <p className="text-xs font-medium text-white">{skill.name}</p>
                            <p className="text-[10px] font-mono text-slate-500">{skill.skillId}</p>
                          </div>
                          <button
                            onClick={() => deleteSkill(skill.skillId)}
                            className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors opacity-0 group-hover:opacity-100"
                            title="Delete Skill"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
