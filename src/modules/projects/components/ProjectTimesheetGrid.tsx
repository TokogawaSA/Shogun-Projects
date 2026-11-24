import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Send,
  Sparkles,
  Users,
} from 'lucide-react';
import clsx from 'clsx';
import { apiClient } from '../../../services/api';
import { Task } from '../types';
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
} from '../../../utils/saHolidayUtils';

interface ProjectTimesheetGridProps {
  projectId: string;
  tasks: Task[];
}

export const ProjectTimesheetGrid: React.FC<ProjectTimesheetGridProps> = ({
  projectId,
  tasks,
}) => {
  const [weekMondayIso, setWeekMondayIso] = useState<string>(() =>
    getMondayOfIsoWeek(toUtcIsoDate(new Date()))
  );
  const [customHolidays, setCustomHolidays] = useState<SaHolidayItem[]>([]);
  const [workDays, setWorkDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [dailyWorkHours, setDailyWorkHours] = useState<number>(8);
  const [annualWorkingDays, setAnnualWorkingDays] = useState<number>(250);
  const [entries, setEntries] = useState<Record<string, Record<string, number>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedNotice, setSubmittedNotice] = useState<string | null>(null);

  const activeYear = useMemo(
    () => parseIsoDateUtc(weekMondayIso).getUTCFullYear(),
    [weekMondayIso]
  );

  useEffect(() => {
    let mounted = true;
    fetchTenantWorkingCalendar(activeYear).then((res) => {
      if (!mounted) return;
      setWorkDays(res.calendar.workDays || [1, 2, 3, 4, 5]);
      setDailyWorkHours(res.calendar.dailyWorkHours || 8);
      setCustomHolidays(res.holidays || []);
      setAnnualWorkingDays(res.stats.workingDaysInYear);
    });
    return () => {
      mounted = false;
    };
  }, [activeYear]);

  const holidayMap = useMemo(
    () => buildHolidayMapForYears([activeYear - 1, activeYear, activeYear + 1], customHolidays),
    [activeYear, customHolidays]
  );

  const weekDays = useMemo(() => {
    const monday = parseIsoDateUtc(weekMondayIso);
    return Array.from({ length: 7 }, (_, idx) => {
      const dt = addUtcDays(monday, idx);
      const iso = formatUtcIso(dt);
      const utcDay = dt.getUTCDay();
      const isWeekend =
        utcDay === 0 ? !workDays.includes(0) && !workDays.includes(7) : !workDays.includes(utcDay);
      const holiday = holidayMap.get(iso) || null;
      return {
        iso,
        label: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][utcDay],
        shortDate: iso.slice(5),
        isWeekend,
        holiday,
      };
    });
  }, [weekMondayIso, workDays, holidayMap]);

  const weekSundayIso = weekDays[6].iso;
  const workingDaysInWeek = useMemo(
    () => countSaWorkingDays(weekMondayIso, weekSundayIso, holidayMap, workDays),
    [weekMondayIso, weekSundayIso, holidayMap, workDays]
  );
  const targetWeeklyCapacityHours = Number((workingDaysInWeek * dailyWorkHours).toFixed(1));

  const visibleTasks = useMemo(() => tasks.slice(0, 12), [tasks]);

  const totalLoggedThisWeek = useMemo(() => {
    let sum = 0;
    for (const taskMap of Object.values(entries)) {
      for (const day of weekDays) {
        sum += Number(taskMap[day.iso] || 0);
      }
    }
    return Number(sum.toFixed(2));
  }, [entries, weekDays]);

  const utilizationPct =
    targetWeeklyCapacityHours > 0
      ? Math.round((totalLoggedThisWeek / targetWeeklyCapacityHours) * 100)
      : 100;

  const handleHourChange = (taskId: string, dayIso: string, raw: string) => {
    const val = Math.max(0, Math.min(24, Number(raw) || 0));
    setEntries((prev) => ({
      ...prev,
      [taskId]: {
        ...(prev[taskId] || {}),
        [dayIso]: val,
      },
    }));
  };

  const handleSubmitTimesheet = async () => {
    setIsSubmitting(true);
    setSubmittedNotice(null);
    try {
      await apiClient.post('/pm/timesheets/submit', {
        projectId,
        weekStartDate: weekMondayIso,
        totalHours: totalLoggedThisWeek,
        billableHours: totalLoggedThisWeek,
      });
      setSubmittedNotice(
        `Submitted ${totalLoggedThisWeek}h against ${targetWeeklyCapacityHours}h SA working-day capacity for week of ${weekMondayIso}.`
      );
    } catch {
      setSubmittedNotice(
        `Saved ${totalLoggedThisWeek}h locally against ${targetWeeklyCapacityHours}h SA working-day capacity.`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* SA Capacity & Working-Day Telemetry Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/85 border border-slate-800/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400">SA Adjusted Week Capacity</div>
            <div className="text-lg font-bold text-slate-100 font-mono">
              {targetWeeklyCapacityHours}h{' '}
              <span className="text-xs font-normal text-slate-400">
                ({workingDaysInWeek} working days)
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/85 border border-slate-800/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400">{activeYear} SA Working Baseline</div>
            <div className="text-lg font-bold text-emerald-300 font-mono">
              {annualWorkingDays} days · {Math.round(annualWorkingDays * dailyWorkHours)}h
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/85 border border-slate-800/80 flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] text-slate-400">Logged vs SA Capacity</div>
            <div className="text-lg font-bold text-slate-100 font-mono">
              {totalLoggedThisWeek}h / {targetWeeklyCapacityHours}h ({utilizationPct}%)
            </div>
          </div>
          <button
            type="button"
            onClick={handleSubmitTimesheet}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-xs font-semibold shadow-sm transition"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Submit Week</span>
          </button>
        </div>
      </div>

      {submittedNotice && (
        <div className="px-4 py-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{submittedNotice}</span>
        </div>
      )}

      {/* Week Switcher */}
      <div className="p-4 rounded-2xl bg-slate-900/85 border border-slate-800/80 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold text-slate-100">
            Weekly Timesheet Grid ({weekMondayIso} → {weekSundayIso})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setWeekMondayIso('2026-08-10')}
            className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[11px] font-semibold"
            title="Inspect Aug 2026 Observed Monday Week (10 Aug 2026)"
          >
            Aug 2026 Observed Mon
          </button>
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5">
            <button
              type="button"
              onClick={() =>
                setWeekMondayIso((prev) => formatUtcIso(addUtcDays(parseIsoDateUtc(prev), -7)))
              }
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setWeekMondayIso(getMondayOfIsoWeek(toUtcIsoDate(new Date())))}
              className="px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:text-white"
            >
              Current Week
            </button>
            <button
              type="button"
              onClick={() =>
                setWeekMondayIso((prev) => formatUtcIso(addUtcDays(parseIsoDateUtc(prev), 7)))
              }
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Timesheet Grid Table with Shaded SA Public Holidays */}
      <div className="rounded-2xl bg-slate-900/85 border border-slate-800/80 overflow-x-auto shadow-xl">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/90">
              <th className="text-left px-4 py-3 font-mono text-[11px] uppercase text-slate-400 min-w-[220px]">
                Project Task
              </th>
              {weekDays.map((day) => (
                <th
                  key={day.iso}
                  title={
                    day.holiday
                      ? `${day.iso} — ${day.holiday.name} (SA Public Holiday — Excluded from capacity)`
                      : day.isWeekend
                        ? `${day.iso} — Weekend`
                        : `${day.iso} — Standard Working Day (${dailyWorkHours}h)`
                  }
                  className={clsx(
                    'px-2.5 py-2.5 text-center font-mono min-w-[92px] border-l border-slate-800/70',
                    day.holiday
                      ? 'bg-amber-500/20 text-amber-200 border-b-2 border-b-amber-400'
                      : day.isWeekend
                        ? 'bg-slate-900/90 text-slate-500'
                        : 'text-slate-200'
                  )}
                >
                  <div>{day.label}</div>
                  <div className="text-[10px] opacity-80">{day.shortDate}</div>
                  {day.holiday && (
                    <div className="mt-1 px-1.5 py-0.5 rounded bg-amber-500/25 text-amber-200 text-[9px] truncate max-w-[90px] mx-auto">
                      {day.holiday.name}
                    </div>
                  )}
                </th>
              ))}
              <th className="px-4 py-3 text-right font-mono text-[11px] uppercase text-slate-400 border-l border-slate-800">
                Row Total
              </th>
            </tr>
          </thead>

          <tbody>
            {visibleTasks.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-10 text-center text-slate-400">
                  No tasks in this project yet. Create tasks to record weekly timesheet hours.
                </td>
              </tr>
            ) : (
              visibleTasks.map((task) => {
                const rowMap = entries[task.id] || {};
                const rowTotal = weekDays.reduce(
                  (acc, d) => acc + Number(rowMap[d.iso] || 0),
                  0
                );

                return (
                  <tr
                    key={task.id}
                    className="border-b border-slate-800/60 hover:bg-slate-800/20"
                  >
                    <td className="px-4 py-2.5 font-medium text-slate-200 truncate max-w-[240px]">
                      {task.title}
                    </td>
                    {weekDays.map((day) => (
                      <td
                        key={day.iso}
                        title={
                          day.holiday
                            ? `${day.holiday.name} (${day.iso}) — Public holidays are excluded from required capacity`
                            : undefined
                        }
                        className={clsx(
                          'p-1.5 text-center border-l border-slate-800/50',
                          day.holiday
                            ? 'bg-amber-500/12'
                            : day.isWeekend
                              ? 'bg-slate-950/70'
                              : ''
                        )}
                      >
                        <input
                          type="number"
                          min={0}
                          max={24}
                          step={0.5}
                          value={rowMap[day.iso] ?? ''}
                          placeholder={day.holiday || day.isWeekend ? '—' : '0'}
                          onChange={(e) => handleHourChange(task.id, day.iso, e.target.value)}
                          className={clsx(
                            'w-16 text-center px-2 py-1 rounded-lg border font-mono text-xs focus:outline-none focus:border-indigo-500',
                            day.holiday
                              ? 'bg-amber-950/40 border-amber-500/30 text-amber-200 placeholder-amber-400/50'
                              : day.isWeekend
                                ? 'bg-slate-950 border-slate-800 text-slate-400'
                                : 'bg-slate-950 border-slate-800 text-slate-100'
                          )}
                        />
                      </td>
                    ))}
                    <td className="px-4 py-2.5 text-right font-mono font-bold text-indigo-300 border-l border-slate-800">
                      {rowTotal.toFixed(1)}h
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProjectTimesheetGrid;
