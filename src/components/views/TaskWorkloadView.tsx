import React, { useEffect, useMemo, useState } from 'react';
import { Users, Bot, User, AlertTriangle, CheckCircle2, Clock, ArrowUpRight, Calendar } from 'lucide-react';
import { Task } from '../../types';
import {
  SaHolidayItem,
  addUtcDays,
  buildHolidayMapForYears,
  countSaWorkingDays,
  fetchTenantWorkingCalendar,
  formatUtcIso,
  getMondayOfIsoWeek,
  parseIsoDateUtc,
  toUtcIsoDate,
} from '../../utils/saHolidayUtils';

interface TaskWorkloadViewProps {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
}

interface UserWorkloadData {
  userId: string;
  name: string;
  role: string;
  isAi: boolean;
  assignedTasks: Task[];
  totalEstimatedHours: number;
  capacityHours: number;
  utilizationPercent: number;
}

const BASE_TEAM_MEMBERS = [
  { userId: 'usr-admin-master', name: 'Admin Master', role: 'Lead Architect', isAi: false, capacity: 40 },
  { userId: 'usr-dev-alex', name: 'Alex Rivers', role: 'Senior Fullstack Dev', isAi: false, capacity: 40 },
  { userId: 'usr-agent-sentinel', name: 'Sentinel Agent (AI)', role: 'Validation Subagent', isAi: true, capacity: 168 },
  { userId: 'usr-agent-worker', name: 'Worker Agent (AI)', role: 'Code Generator Subagent', isAi: true, capacity: 168 },
  { userId: 'usr-agent-auditor', name: 'Auditor Agent (AI)', role: 'Quality & Security Subagent', isAi: true, capacity: 168 },
];

export const TaskWorkloadView: React.FC<TaskWorkloadViewProps> = ({ tasks, onSelectTask }) => {
  const [customHolidays, setCustomHolidays] = useState<SaHolidayItem[]>([]);
  const [workDays, setWorkDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [annualWorkingDays, setAnnualWorkingDays] = useState<number>(251);

  const todayIso = toUtcIsoDate(new Date());
  const currentYear = parseIsoDateUtc(todayIso).getUTCFullYear();
  const weekMondayIso = getMondayOfIsoWeek(todayIso);
  const weekSundayIso = formatUtcIso(addUtcDays(parseIsoDateUtc(weekMondayIso), 6));

  useEffect(() => {
    let active = true;
    fetchTenantWorkingCalendar(currentYear).then((res) => {
      if (!active) return;
      setWorkDays(res.calendar.workDays || [1, 2, 3, 4, 5]);
      setCustomHolidays(res.holidays || []);
      setAnnualWorkingDays(res.stats.workingDaysInYear);
    });
    return () => {
      active = false;
    };
  }, [currentYear]);

  const holidayMap = useMemo(
    () => buildHolidayMapForYears([currentYear - 1, currentYear, currentYear + 1], customHolidays),
    [currentYear, customHolidays]
  );

  const saWorkingDaysThisWeek = useMemo(
    () => countSaWorkingDays(weekMondayIso, weekSundayIso, holidayMap, workDays),
    [weekMondayIso, weekSundayIso, holidayMap, workDays]
  );

  const workloadList: UserWorkloadData[] = BASE_TEAM_MEMBERS.map((member) => {
    const assigned = tasks.filter(
      (t) =>
        t.assigneeId === member.userId ||
        t.assignees?.some((a) => a.userId === member.userId) ||
        t.assigneeIds?.includes(member.userId)
    );

    const totalHours = assigned.reduce((acc, t) => acc + (t.estimatedHours || 4), 0);
    // Adjust human member weekly capacity by actual SA working days so public holidays
    // are never flagged as under-utilization
    const adjustedCapacity = member.isAi
      ? member.capacity
      : Number(((member.capacity / 5) * saWorkingDaysThisWeek).toFixed(1));
    const denom = adjustedCapacity > 0 ? adjustedCapacity : member.capacity;
    const utilization = denom > 0 ? Math.round((totalHours / denom) * 100) : 100;

    return {
      userId: member.userId,
      name: member.name,
      role: member.role,
      isAi: member.isAi,
      assignedTasks: assigned,
      totalEstimatedHours: totalHours,
      capacityHours: adjustedCapacity,
      utilizationPercent: utilization,
    };
  });

  return (
    <div className="space-y-6 text-xs select-none">
      {/* SA Working Calendar Capacity Notice */}
      <div className="px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between flex-wrap gap-2 text-[11px] text-slate-300">
        <span className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-emerald-400" />
          <span>
            South African Working Calendar active: <strong>{saWorkingDaysThisWeek} working days</strong> this week ({weekMondayIso} → {weekSundayIso})
          </span>
        </span>
        <span className="font-mono text-emerald-300">
          {currentYear}: {annualWorkingDays} SA working days ({annualWorkingDays * 8}h/member)
        </span>
      </div>
      {/* Overview Cards Header */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400">Active Resources</div>
            <div className="text-lg font-bold text-slate-100">{workloadList.length} Members & Agents</div>
          </div>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400">Total Allocated Work</div>
            <div className="text-lg font-bold text-slate-100">
              {workloadList.reduce((acc, w) => acc + w.totalEstimatedHours, 0)} Hours
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400">Workload Balance</div>
            <div className="text-lg font-bold text-emerald-400">Optimal (Zero Blockers)</div>
          </div>
        </div>
      </div>

      {/* Resource Heatmap Grid */}
      <div className="space-y-4">
        {workloadList.map((worker) => {
          const isOverallocated = worker.utilizationPercent > 100;
          const isOptimal = worker.utilizationPercent >= 40 && worker.utilizationPercent <= 100;

          return (
            <div
              key={worker.userId}
              className="p-5 bg-slate-900/60 border border-slate-800/80 rounded-2xl space-y-4 backdrop-blur-md shadow-md"
            >
              {/* Member Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                      worker.isAi
                        ? 'bg-purple-900/40 text-purple-300 border-purple-800/60'
                        : 'bg-indigo-900/40 text-indigo-300 border-indigo-800/60'
                    }`}
                  >
                    {worker.isAi ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-100">{worker.name}</span>
                      {worker.isAi && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-purple-950 text-purple-300 border border-purple-800">
                          AI AGENT
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400">{worker.role}</div>
                  </div>
                </div>

                {/* Status Flag */}
                <div className="flex items-center gap-2">
                  {isOverallocated ? (
                    <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-950/60 text-rose-300 border border-rose-800 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                      Overallocated ({worker.utilizationPercent}%)
                    </span>
                  ) : isOptimal ? (
                    <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Optimal Load ({worker.utilizationPercent}%)
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-slate-400">
                      Under Capacity ({worker.utilizationPercent}%)
                    </span>
                  )}
                </div>
              </div>

              {/* Progress / Capacity Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                  <span>
                    Allocated: <strong className="text-slate-200">{worker.totalEstimatedHours}h</strong> /{' '}
                    {worker.capacityHours}h capacity
                  </span>
                  <span>{worker.assignedTasks.length} Assigned Tasks</span>
                </div>
                <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800/80">
                  <div
                    className={`h-full transition-all duration-300 ${
                      isOverallocated ? 'bg-rose-500' : isOptimal ? 'bg-emerald-500' : 'bg-indigo-500'
                    }`}
                    style={{ width: `${Math.min(100, worker.utilizationPercent)}%` }}
                  />
                </div>
              </div>

              {/* Assigned Task Chips */}
              {worker.assignedTasks.length > 0 && (
                <div className="pt-2 border-t border-slate-800/60 flex flex-wrap gap-2">
                  {worker.assignedTasks.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => onSelectTask(t)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 hover:border-slate-700 cursor-pointer flex items-center gap-2 transition group"
                    >
                      <span className="font-mono text-[10px] text-slate-500">{t.id}</span>
                      <span className="font-medium text-slate-300 group-hover:text-indigo-300 truncate max-w-[180px]">
                        {t.title}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {t.estimatedHours || 4}h
                      </span>
                      <ArrowUpRight className="w-3 h-3 text-slate-500 group-hover:text-indigo-400 opacity-0 group-hover:opacity-100" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
