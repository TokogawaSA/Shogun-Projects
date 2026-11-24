import React, { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  GitBranch,
  Info,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import clsx from 'clsx';
import { apiClient } from '../../../services/api';
import { Task } from '../types';
import {
  SaHolidayItem,
  addSaWorkingDays,
  addUtcDays,
  buildHolidayMapForYears,
  countSaWorkingDays,
  fetchTenantWorkingCalendar,
  formatUtcIso,
  parseIsoDateUtc,
  toUtcIsoDate,
} from '../../../utils/saHolidayUtils';

interface CpmNodeResponse {
  id: string;
  title: string;
  durationDays: number;
  ES: number;
  EF: number;
  LS: number;
  LF: number;
  totalFloat: number;
  earlyStartDate: string;
  earlyFinishDate: string;
  isCritical: boolean;
  predecessorTaskIds: string[];
}

interface ProjectGanttTimelineProps {
  projectId: string;
  tasks: Task[];
  onOpenTask: (task: Task) => void;
  onRefreshTasks?: () => Promise<void> | void;
}

const DAY_CELL_WIDTH = 38;

export const ProjectGanttTimeline: React.FC<ProjectGanttTimelineProps> = ({
  projectId,
  tasks,
  onOpenTask,
  onRefreshTasks,
}) => {
  const [windowStartIso, setWindowStartIso] = useState<string>(() => {
    const taskDates = tasks
      .map((t) => t.startDate || t.dueDate)
      .filter(Boolean) as string[];
    if (taskDates.length > 0) {
      const sorted = [...taskDates].sort();
      return formatUtcIso(addUtcDays(parseIsoDateUtc(toUtcIsoDate(sorted[0])), -2));
    }
    return formatUtcIso(addUtcDays(parseIsoDateUtc(toUtcIsoDate(new Date())), -3));
  });

  const [spanDays, setSpanDays] = useState<number>(28);
  const [customHolidays, setCustomHolidays] = useState<SaHolidayItem[]>([]);
  const [workDays, setWorkDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [dailyWorkHours, setDailyWorkHours] = useState<number>(8);
  const [calendarName, setCalendarName] = useState<string>('South Africa Standard (SAST)');
  const [cpmNodes, setCpmNodes] = useState<Record<string, CpmNodeResponse>>({});
  const [isCascading, setIsCascading] = useState(false);

  const visibleYears = useMemo(() => {
    const startYr = parseIsoDateUtc(windowStartIso).getUTCFullYear();
    const endYr = addUtcDays(parseIsoDateUtc(windowStartIso), spanDays).getUTCFullYear();
    return Array.from(new Set([startYr - 1, startYr, endYr, endYr + 1]));
  }, [windowStartIso, spanDays]);

  useEffect(() => {
    let active = true;
    const primaryYear = parseIsoDateUtc(windowStartIso).getUTCFullYear();

    Promise.all([
      fetchTenantWorkingCalendar(primaryYear),
      apiClient
        .get<any>(`/pm/projects/${encodeURIComponent(projectId)}/critical-path`)
        .catch(() => null),
    ]).then(([calRes, cpmRes]) => {
      if (!active) return;
      if (calRes?.calendar) {
        setCalendarName(calRes.calendar.name);
        setWorkDays(calRes.calendar.workDays || [1, 2, 3, 4, 5]);
        setDailyWorkHours(calRes.calendar.dailyWorkHours || 8);
      }
      if (Array.isArray(calRes?.holidays)) {
        setCustomHolidays(calRes.holidays);
      }
      if (Array.isArray(cpmRes?.tasks)) {
        const map: Record<string, CpmNodeResponse> = {};
        for (const n of cpmRes.tasks) {
          map[n.id] = n;
        }
        setCpmNodes(map);
      }
    });

    return () => {
      active = false;
    };
  }, [projectId, windowStartIso, tasks]);

  const holidayMap = useMemo(
    () => buildHolidayMapForYears(visibleYears, customHolidays),
    [visibleYears, customHolidays]
  );

  const timelineDays = useMemo(() => {
    const start = parseIsoDateUtc(windowStartIso);
    return Array.from({ length: spanDays }, (_, idx) => {
      const dt = addUtcDays(start, idx);
      const iso = formatUtcIso(dt);
      const utcDay = dt.getUTCDay();
      const isWeekend =
        utcDay === 0 ? !workDays.includes(0) && !workDays.includes(7) : !workDays.includes(utcDay);
      const holiday = holidayMap.get(iso) || null;
      return {
        date: dt,
        iso,
        dayOfMonth: dt.getUTCDate(),
        weekdayShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][utcDay],
        monthShort: [
          'Jan',
          'Feb',
          'Mar',
          'Apr',
          'May',
          'Jun',
          'Jul',
          'Aug',
          'Sep',
          'Oct',
          'Nov',
          'Dec',
        ][dt.getUTCMonth()],
        isWeekend,
        holiday,
      };
    });
  }, [windowStartIso, spanDays, workDays, holidayMap]);

  const scheduledRows = useMemo(() => {
    return tasks.map((task) => {
      const serverNode = cpmNodes[task.id];
      const estHours = task.estimatedHours && task.estimatedHours > 0 ? task.estimatedHours : dailyWorkHours;
      const fallbackDuration = Math.max(1, Math.ceil(estHours / dailyWorkHours));

      const rawStart =
        serverNode?.earlyStartDate ||
        (task.startDate ? toUtcIsoDate(task.startDate) : null) ||
        (task.dueDate ? toUtcIsoDate(task.dueDate) : windowStartIso);

      const computedFinish =
        serverNode?.earlyFinishDate ||
        (task.dueDate && (!task.startDate || task.dueDate >= rawStart)
          ? toUtcIsoDate(task.dueDate)
          : addSaWorkingDays(rawStart, fallbackDuration, holidayMap, workDays));

      const workingDaysCount = Math.max(
        1,
        serverNode?.durationDays || countSaWorkingDays(rawStart, computedFinish, holidayMap, workDays)
      );

      return {
        task,
        startIso: rawStart,
        finishIso: computedFinish,
        workingDaysCount,
        ES: serverNode?.ES ?? 0,
        EF: serverNode?.EF ?? workingDaysCount,
        LS: serverNode?.LS ?? 0,
        LF: serverNode?.LF ?? workingDaysCount,
        totalFloat: serverNode?.totalFloat ?? 0,
        isCritical: serverNode ? serverNode.isCritical : task.priority === 'urgent',
        predecessors:
          serverNode?.predecessorTaskIds || task.predecessorTaskIds || [],
      };
    });
  }, [tasks, cpmNodes, dailyWorkHours, windowStartIso, holidayMap, workDays]);

  const holidaysInView = useMemo(
    () => timelineDays.filter((d) => d.holiday !== null).map((d) => d.holiday!),
    [timelineDays]
  );

  const handleCascadeSchedule = async () => {
    setIsCascading(true);
    try {
      const res = await apiClient.post<any>(
        `/pm/projects/${encodeURIComponent(projectId)}/schedule/cascade`,
        {}
      );
      if (Array.isArray(res?.tasks)) {
        const map: Record<string, CpmNodeResponse> = {};
        for (const n of res.tasks) {
          map[n.id] = n;
        }
        setCpmNodes(map);
      }
      if (onRefreshTasks) {
        await onRefreshTasks();
      }
    } finally {
      setIsCascading(false);
    }
  };

  const shiftWindow = (deltaDays: number) => {
    setWindowStartIso((prev) => formatUtcIso(addUtcDays(parseIsoDateUtc(prev), deltaDays)));
  };

  const windowStartMs = parseIsoDateUtc(windowStartIso).getTime();
  const msPerDay = 86_400_000;

  return (
    <div className="space-y-4">
      {/* Top Controls & SA Calendar Legend */}
      <div className="p-4 rounded-2xl bg-slate-900/85 border border-slate-800/80 backdrop-blur-xl shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Calendar className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-100">
              PM 360 Gantt Timeline & Critical Path (CPM)
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              {calendarName}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Finish-to-Start cascades and CPM passes skip weekends, SA statutory holidays, Sunday-to-Monday s2(1) shifts, and shutdown days.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Easter 2026 Quick Jump for instant inspection */}
          <button
            type="button"
            onClick={() => setWindowStartIso('2026-03-30')}
            className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-semibold transition"
            title="Jump to April 2026 SA Easter Long Weekend"
          >
            Apr 2026 Easter
          </button>

          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5">
            <button
              type="button"
              onClick={() => shiftWindow(-7)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="Previous 7 days"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() =>
                setWindowStartIso(formatUtcIso(addUtcDays(parseIsoDateUtc(toUtcIsoDate(new Date())), -2)))
              }
              className="px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:text-white"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => shiftWindow(7)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="Next 7 days"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <select
            value={spanDays}
            onChange={(e) => setSpanDays(Number(e.target.value))}
            className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value={21}>3 Weeks</option>
            <option value={28}>4 Weeks</option>
            <option value={42}>6 Weeks</option>
          </select>

          <button
            type="button"
            onClick={handleCascadeSchedule}
            disabled={isCascading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-xs font-semibold shadow-sm transition"
          >
            <RefreshCw className={clsx('w-3.5 h-3.5', isCascading && 'animate-spin')} />
            <span>Cascade FS & CPM</span>
          </button>
        </div>
      </div>

      {/* Active Public Holidays Banner in Current Viewport */}
      {holidaysInView.length > 0 && (
        <div className="px-4 py-2.5 rounded-xl bg-amber-950/30 border border-amber-500/30 flex items-center justify-between gap-3 flex-wrap text-xs">
          <div className="flex items-center gap-2 text-amber-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="font-semibold">SA Public Holidays in Timeline Window:</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {holidaysInView.map((h) => (
              <span
                key={h.dateIso}
                title={`${h.dateIso}: ${h.name}${h.isObservedMonday ? ' (Public Holidays Act s2(1) Observed Monday)' : ''}`}
                className="px-2 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-200 font-mono text-[11px]"
              >
                {h.dateIso} · {h.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Split Left WBS + Right Shaded Timeline Grid */}
      <div className="rounded-2xl bg-slate-900/85 border border-slate-800/80 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <div
            className="min-w-max"
            style={{ width: `${320 + timelineDays.length * DAY_CELL_WIDTH}px` }}
          >
            {/* Timeline Header */}
            <div className="flex border-b border-slate-800 bg-slate-950/90 sticky top-0 z-10">
              <div className="w-80 shrink-0 px-4 py-3 border-r border-slate-800 flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-slate-400">
                <span>Task / CPM Float</span>
                <span>Work Days</span>
              </div>

              <div className="flex">
                {timelineDays.map((day) => {
                  const isHoliday = Boolean(day.holiday);
                  const tooltipText = day.holiday
                    ? `${day.iso} — ${day.holiday.name}${
                        day.holiday.isObservedMonday
                          ? ' (Observed Monday - Act 36 of 1994 s2(1))'
                          : day.holiday.isCustomTenantHoliday
                            ? ' (Company Shutdown)'
                            : day.holiday.isAdHocDeclared
                              ? ' (Presidential Declaration s2A)'
                              : ' (SA Statutory Holiday)'
                      }`
                    : day.isWeekend
                      ? `${day.iso} — Weekend (Non-working)`
                      : `${day.iso} — Working Day`;

                  return (
                    <div
                      key={day.iso}
                      title={tooltipText}
                      style={{ width: `${DAY_CELL_WIDTH}px` }}
                      className={clsx(
                        'shrink-0 py-2 px-0.5 border-r border-slate-800/70 text-center relative group cursor-default select-none',
                        isHoliday
                          ? 'bg-amber-500/20 text-amber-200 border-b-2 border-b-amber-400'
                          : day.isWeekend
                            ? 'bg-slate-900/90 text-slate-500'
                            : 'text-slate-300'
                      )}
                    >
                      <div className="text-[9px] uppercase font-mono opacity-80">
                        {day.dayOfMonth === 1 ? day.monthShort : day.weekdayShort}
                      </div>
                      <div className="text-xs font-bold font-mono">{day.dayOfMonth}</div>
                      {isHoliday && (
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mx-auto mt-0.5" />
                      )}

                      {/* Rich Holiday Tooltip on Hover */}
                      {day.holiday && (
                        <div className="hidden group-hover:block absolute left-1/2 -translate-x-1/2 top-full mt-1 z-30 w-52 p-2 rounded-xl bg-slate-950 border border-amber-500/50 shadow-2xl text-left pointer-events-none">
                          <div className="text-[10px] font-mono text-amber-400 font-bold">
                            {day.iso} · NON-WORKING
                          </div>
                          <div className="text-xs font-semibold text-white mt-0.5">
                            {day.holiday.name}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {day.holiday.isObservedMonday
                              ? 'Sunday-to-Monday Observance (s2(1))'
                              : day.holiday.isCustomTenantHoliday
                                ? 'Tenant Shutdown Holiday'
                                : day.holiday.isAdHocDeclared
                                  ? 'Presidential Holiday (s2A)'
                                  : 'SA Public Holidays Act 36 of 1994'}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Rows */}
            {scheduledRows.length === 0 ? (
              <div className="py-14 text-center text-xs text-slate-400">
                No tasks scheduled in this project yet. Add tasks to inspect the South African CPM Gantt timeline.
              </div>
            ) : (
              scheduledRows.map((row) => {
                const startOffsetDays = Math.round(
                  (parseIsoDateUtc(row.startIso).getTime() - windowStartMs) / msPerDay
                );
                const endOffsetDays = Math.round(
                  (parseIsoDateUtc(row.finishIso).getTime() - windowStartMs) / msPerDay
                );

                const clampedLeft = Math.max(0, startOffsetDays);
                const clampedRight = Math.min(timelineDays.length - 1, endOffsetDays);
                const isBarVisible =
                  endOffsetDays >= 0 && startOffsetDays < timelineDays.length && clampedRight >= clampedLeft;

                const barLeftPx = clampedLeft * DAY_CELL_WIDTH + 3;
                const barWidthPx = Math.max(
                  DAY_CELL_WIDTH - 6,
                  (clampedRight - clampedLeft + 1) * DAY_CELL_WIDTH - 6
                );

                return (
                  <div
                    key={row.task.id}
                    className="flex border-b border-slate-800/60 hover:bg-slate-800/20 transition"
                  >
                    {/* Left Task Info Column */}
                    <div
                      onClick={() => onOpenTask(row.task)}
                      className="w-80 shrink-0 px-4 py-2.5 border-r border-slate-800 flex items-center justify-between gap-2 cursor-pointer group"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          {row.isCritical && (
                            <span
                              title="Critical Path Task (Total Float = 0d)"
                              className="w-2 h-2 rounded-full bg-rose-500 shrink-0"
                            />
                          )}
                          <span className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300 truncate">
                            {row.task.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 mt-0.5">
                          <span>
                            {row.startIso} → {row.finishIso}
                          </span>
                          {row.predecessors.length > 0 && (
                            <span className="inline-flex items-center gap-0.5 text-indigo-400">
                              <GitBranch className="w-2.5 h-2.5" /> FS({row.predecessors.length})
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={clsx(
                            'px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border',
                            row.isCritical
                              ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          )}
                        >
                          {row.workingDaysCount}d
                        </span>
                        <div className="text-[9px] font-mono text-slate-500 mt-0.5">
                          TF:{row.totalFloat}d
                        </div>
                      </div>
                    </div>

                    {/* Right Shaded Timeline Cells + Task Bar */}
                    <div className="relative flex items-center">
                      {timelineDays.map((day) => {
                        const isHoliday = Boolean(day.holiday);
                        return (
                          <div
                            key={day.iso}
                            title={
                              day.holiday
                                ? `${day.iso}: ${day.holiday.name} (Non-working Public Holiday)`
                                : day.isWeekend
                                  ? `${day.iso}: Weekend`
                                  : day.iso
                            }
                            style={{ width: `${DAY_CELL_WIDTH}px` }}
                            className={clsx(
                              'h-12 shrink-0 border-r border-slate-800/40',
                              isHoliday
                                ? 'bg-amber-500/12 bg-[repeating-linear-gradient(45deg,rgba(245,158,11,0.09),rgba(245,158,11,0.09)_5px,transparent_5px,transparent_10px)]'
                                : day.isWeekend
                                  ? 'bg-slate-950/75'
                                  : ''
                            )}
                          />
                        );
                      })}

                      {isBarVisible && (
                        <button
                          type="button"
                          onClick={() => onOpenTask(row.task)}
                          style={{ left: `${barLeftPx}px`, width: `${barWidthPx}px` }}
                          title={`${row.task.title} | ${row.workingDaysCount} working days (${row.startIso} → ${row.finishIso}) | ES:${row.ES} EF:${row.EF} LS:${row.LS} LF:${row.LF} Float:${row.totalFloat}d`}
                          className={clsx(
                            'absolute h-6 rounded-lg px-2 flex items-center justify-between text-[10px] font-semibold text-white shadow-md transition hover:brightness-110 z-10 overflow-hidden',
                            row.isCritical
                              ? 'bg-gradient-to-r from-rose-600 to-amber-600 ring-1 ring-rose-300/50'
                              : row.task.status === 'done'
                                ? 'bg-gradient-to-r from-emerald-600 to-teal-600'
                                : 'bg-gradient-to-r from-indigo-600 to-violet-600'
                          )}
                        >
                          <span className="truncate">{row.task.title}</span>
                          <span className="font-mono text-[9px] opacity-90 ml-1 shrink-0">
                            {row.workingDaysCount}wd
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer Legend */}
        <div className="px-4 py-2.5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between flex-wrap gap-3 text-[11px] text-slate-400">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-500/30 border border-amber-400 inline-block" />
              SA Public Holiday / Observed Monday / Shutdown
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-slate-900 border border-slate-700 inline-block" />
              Weekend (Sat–Sun)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-gradient-to-r from-rose-600 to-amber-600 inline-block" />
              Critical Path (Float = 0d)
            </span>
          </div>
          <span className="flex items-center gap-1 text-slate-500 font-mono text-[10px]">
            <Info className="w-3 h-3" /> Hover any shaded column header for statutory holiday details
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProjectGanttTimeline;
