import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  SlidersHorizontal, 
  Flame, 
  ArrowRightLeft, 
  Clock, 
  ChevronRight,
  Sparkles,
  RefreshCw,
  Loader2,
  TrendingUp
} from 'lucide-react';
import { useResourceCapacity, WorkloadTaskDetail } from '../hooks/useResourceCapacity';
import { ResourceAllocationModal } from './ResourceAllocationModal';

export const ResourceCapacityPlanner: React.FC = () => {
  const { workloads, skills, loading, refresh } = useResourceCapacity();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [skillFilter, setSkillFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'optimal' | 'near_capacity' | 'over_allocated'>('all');

  const [selectedTaskForRebalance, setSelectedTaskForRebalance] = useState<WorkloadTaskDetail | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const skillNameMap = new Map<string, string>();
  skills.forEach((s) => skillNameMap.set(s.skillId, s.name));

  const allMembers = Object.values(workloads);

  // Extract unique departments
  const departments = Array.from(
    new Set(allMembers.map((m) => m.department).filter(Boolean))
  );

  // Filter members
  const filteredMembers = allMembers.filter((m) => {
    const matchesSearch =
      m.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.department.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept = departmentFilter === 'all' || m.department === departmentFilter;
    const matchesSkill = skillFilter === 'all' || m.skills.includes(skillFilter);
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;

    return matchesSearch && matchesDept && matchesSkill && matchesStatus;
  });

  // Calculate high-level telemetry
  const totalCapacity = allMembers.reduce((acc, m) => acc + (m.weeklyCapacityHours || 40), 0);
  const totalAssigned = allMembers.reduce((acc, m) => acc + m.assignedHours, 0);
  const overallUtilization = totalCapacity > 0 ? Math.round((totalAssigned / totalCapacity) * 100) : 0;
  const overallocatedCount = allMembers.filter((m) => m.isOverallocated).length;
  const optimalCount = allMembers.filter((m) => m.status === 'optimal').length;

  const handleOpenRebalance = (task: WorkloadTaskDetail) => {
    setSelectedTaskForRebalance(task);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Telemetry Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Total Capacity</span>
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{totalCapacity}h</span>
            <span className="text-xs text-slate-400 font-mono">/ week</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Across {allMembers.length} active resources</div>
        </div>

        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Assigned Workload</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{totalAssigned}h</span>
            <span className="text-xs text-slate-400 font-mono">committed</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">{totalCapacity - totalAssigned}h available buffer</div>
        </div>

        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Team Utilization</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold ${
                overallUtilization > 100
                  ? 'text-rose-400'
                  : overallUtilization >= 80
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {overallUtilization}%
            </span>
            <span className="text-xs text-slate-400 font-mono">portfolio load</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                overallUtilization > 100
                  ? 'bg-rose-500'
                  : overallUtilization >= 80
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, overallUtilization)}%` }}
            />
          </div>
        </div>

        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Burnout Risks</span>
            <Flame className="w-4 h-4 text-rose-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold ${overallocatedCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {overallocatedCount}
            </span>
            <span className="text-xs text-slate-400 font-mono">over-allocated</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {optimalCount} engineers in optimal capacity band
          </div>
        </div>
      </div>

      {/* Control & Filtering Bar */}
      <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                Resource Allocation & Capacity Heatmap
              </h2>
              <p className="text-xs text-slate-400">
                Track engineer workload bands, skill alignments & dynamically reassign bottlenecks
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => refresh()}
              disabled={loading}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition-colors"
              title="Refresh Heatmap"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-800/80">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search team member..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Departments ({departments.length})</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Skill Capabilities ({skills.length})</option>
              {skills.map((s) => (
                <option key={s.skillId} value={s.skillId}>
                  {s.name} ({s.category})
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Workload Bands</option>
              <option value="optimal">Optimal (≤ 75%)</option>
              <option value="near_capacity">Near Capacity (76% - 100%)</option>
              <option value="over_allocated">Over-allocated (&gt; 100%)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Capacity Heatmap Grid */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 className="w-7 h-7 animate-spin text-indigo-500" />
          <p className="text-xs">Calculating real-time capacity and workload matrices...</p>
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="bg-slate-900/40 rounded-2xl border border-slate-800 p-12 text-center text-slate-400 space-y-3">
          <SlidersHorizontal className="w-8 h-8 mx-auto text-slate-600" />
          <p className="text-sm">No resources match the selected filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMembers.map((member) => {
            const isExpanded = expandedUser === member.userId;
            const capacity = member.weeklyCapacityHours || 40;
            const utilization = member.utilizationPercent;

            return (
              <div
                key={member.userId}
                className={`bg-slate-900/80 rounded-2xl border transition-all overflow-hidden ${
                  member.isOverallocated
                    ? 'border-rose-500/40 bg-rose-950/10'
                    : member.status === 'near_capacity'
                    ? 'border-amber-500/30'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Member Summary Header */}
                <div
                  onClick={() => setExpandedUser(isExpanded ? null : member.userId)}
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sm text-indigo-300">
                        {member.displayName
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()}
                      </div>
                      <div
                        className={`w-3.5 h-3.5 rounded-full absolute -bottom-1 -right-1 border-2 border-slate-900 ${
                          member.isOverallocated
                            ? 'bg-rose-500 animate-pulse'
                            : member.status === 'near_capacity'
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{member.displayName}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {member.department}
                        </span>
                        {member.isOverallocated && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                            <Flame className="w-3 h-3" /> Burnout Risk
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                        <span>{member.email}</span>
                        <span>&bull;</span>
                        <span className="text-emerald-400 font-mono">
                          Rate: ${member.hourlyBillingRate}/h
                        </span>
                        <span>&bull;</span>
                        <span>{member.tasks.length} active tasks</span>
                      </div>
                    </div>
                  </div>

                  {/* Heatmap & Progress Indicator */}
                  <div className="flex items-center gap-6">
                    <div className="w-48 text-right">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-400">Workload:</span>
                        <span
                          className={`font-bold ${
                            member.isOverallocated
                              ? 'text-rose-400'
                              : member.status === 'near_capacity'
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {member.assignedHours}h / {capacity}h ({utilization}%)
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className={`h-full rounded-full transition-all ${
                            member.isOverallocated
                              ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                              : member.status === 'near_capacity'
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, utilization)}%` }}
                        />
                      </div>
                    </div>

                    <ChevronRight
                      className={`w-5 h-5 text-slate-500 transition-transform ${
                        isExpanded ? 'rotate-90 text-white' : ''
                      }`}
                    />
                  </div>
                </div>

                {/* Expanded Task Breakdown Drawer */}
                {isExpanded && (
                  <div className="p-5 bg-slate-950/60 border-t border-slate-800/80 space-y-4 animate-fadeIn">
                    {/* Skill Tags */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Capabilities:
                      </span>
                      {member.skills.length > 0 ? (
                        member.skills.map((skId) => (
                          <span
                            key={skId}
                            className="text-[11px] font-medium px-2.5 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                          >
                            {skillNameMap.get(skId) || skId}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-500">No skills assigned yet</span>
                      )}
                    </div>

                    {/* Assigned Tasks Table */}
                    <div>
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2">
                        <span>Assigned Tasks ({member.tasks.length})</span>
                        <span className="text-[11px] text-slate-500">
                          Click "Rebalance" to reassign tasks to an available teammate
                        </span>
                      </div>

                      {member.tasks.length === 0 ? (
                        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-400">
                          No active project tasks currently assigned. Engineer is fully available.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {member.tasks.map((task) => (
                            <div
                              key={task.taskId}
                              className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between gap-4 hover:border-slate-700"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-mono uppercase px-2 py-0.2 rounded bg-indigo-500/20 text-indigo-300">
                                    {task.projectTitle}
                                  </span>
                                  <span className="text-xs font-semibold text-white">
                                    {task.taskTitle}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                                  <span>Category: {task.category || 'General'}</span>
                                  <span>&bull;</span>
                                  <span>
                                    Priority:{' '}
                                    <strong className="text-amber-400 capitalize">
                                      {task.priority}
                                    </strong>
                                  </span>
                                  <span>&bull;</span>
                                  <span>
                                    Status:{' '}
                                    <strong className="text-slate-300 capitalize">
                                      {task.status}
                                    </strong>
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 flex-shrink-0">
                                <span className="text-xs font-mono text-slate-300">
                                  {task.estimatedHours}h
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenRebalance(task);
                                  }}
                                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 transition-all flex items-center gap-1.5"
                                >
                                  <ArrowRightLeft className="w-3.5 h-3.5" />
                                  Rebalance
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Reallocation Modal */}
      {isModalOpen && selectedTaskForRebalance && (
        <ResourceAllocationModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedTaskForRebalance(null);
          }}
          task={selectedTaskForRebalance}
          workloads={workloads}
          skills={skills}
          onSuccess={() => {
            refresh();
          }}
        />
      )}
    </div>
  );
};
