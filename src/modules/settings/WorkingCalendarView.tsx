import React, { useCallback, useEffect, useState } from 'react';
import {
  Calculator,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  Plus,
  Save,
  Sparkles,
  Sun,
  Trash2,
} from 'lucide-react';
import clsx from 'clsx';
import { apiClient } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  SaHolidayItem,
  WorkingCalendarApiResponse,
  fetchTenantWorkingCalendar,
} from '../../utils/saHolidayUtils';

const WEEKDAY_OPTIONS = [
  { day: 1, label: 'Mon' },
  { day: 2, label: 'Tue' },
  { day: 3, label: 'Wed' },
  { day: 4, label: 'Thu' },
  { day: 5, label: 'Fri' },
  { day: 6, label: 'Sat' },
  { day: 0, label: 'Sun' },
];

export const WorkingCalendarView: React.FC = () => {
  const { isTenantAdmin } = useAuth();
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [loading, setLoading] = useState<boolean>(true);
  const [calendarName, setCalendarName] = useState<string>('South Africa Standard (SAST)');
  const [workDays, setWorkDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [dailyWorkHours, setDailyWorkHours] = useState<number>(8);
  const [holidays, setHolidays] = useState<SaHolidayItem[]>([]);
  const [stats, setStats] = useState<WorkingCalendarApiResponse['stats']>({
    workingDaysInYear: 250,
    annualCapacityHours: 2000,
    totalHolidays: 13,
    observedMondaysCount: 1,
    adHocAndShutdownCount: 1,
  });

  // Shutdown Period Form
  const [shutdownStart, setShutdownStart] = useState<string>('2026-12-17');
  const [shutdownEnd, setShutdownEnd] = useState<string>('2026-12-31');
  const [shutdownLabel, setShutdownLabel] = useState<string>("December Builder's Shutdown");

  // Ad-hoc Single Holiday Form
  const [adHocDate, setAdHocDate] = useState<string>('');
  const [adHocName, setAdHocName] = useState<string>('');

  // Live Schedule Preview Calculator
  const [calcStart, setCalcStart] = useState<string>('2026-04-02');
  const [calcDuration, setCalcDuration] = useState<number>(3);
  const [calcResult, setCalcResult] = useState<{
    finishDate: string;
    workingDays: number;
    availableHoursPerMember: number;
    holidaysSkipped: SaHolidayItem[];
  } | null>(null);

  const [saving, setSaving] = useState<boolean>(false);
  const [banner, setBanner] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const loadCalendar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchTenantWorkingCalendar(selectedYear);
      setCalendarName(data.calendar.name);
      setWorkDays(data.calendar.workDays || [1, 2, 3, 4, 5]);
      setDailyWorkHours(data.calendar.dailyWorkHours || 8);
      setHolidays(data.holidays || []);
      setStats(data.stats);
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    loadCalendar();
  }, [loadCalendar]);

  const toggleWorkDay = (day: number) => {
    setWorkDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const handleSaveCalendarDefaults = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setBanner(null);
    try {
      await apiClient.put('/v1/calendars/default', {
        name: calendarName,
        workDays,
        dailyWorkHours,
      });
      setBanner({
        type: 'ok',
        text: 'Tenant South African working calendar hours and workdays saved.',
      });
      await loadCalendar();
    } catch (err: any) {
      setBanner({ type: 'err', text: err.message || 'Failed to update calendar.' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddShutdown = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setBanner(null);
    try {
      const res = await apiClient.post<any>('/v1/calendars/shutdown', {
        startDate: shutdownStart,
        endDate: shutdownEnd,
        name: shutdownLabel,
      });
      setBanner({
        type: 'ok',
        text: `Added ${res.addedDaysCount ?? 0} non-working shutdown days (${shutdownStart} → ${shutdownEnd}).`,
      });
      await loadCalendar();
    } catch (err: any) {
      setBanner({ type: 'err', text: err.message || 'Failed to add shutdown period.' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddAdHocHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adHocDate || !adHocName.trim()) return;
    setSaving(true);
    setBanner(null);
    try {
      await apiClient.post('/v1/calendars/holidays', {
        date: adHocDate,
        name: adHocName.trim(),
        isAdHocDeclared: true,
      });
      setAdHocDate('');
      setAdHocName('');
      setBanner({ type: 'ok', text: 'Custom non-working holiday added to tenant calendar.' });
      await loadCalendar();
    } catch (err: any) {
      setBanner({ type: 'err', text: err.message || 'Failed to add custom holiday.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteHoliday = async (holidayId?: string) => {
    if (!holidayId) return;
    setSaving(true);
    setBanner(null);
    try {
      await apiClient.delete(`/v1/calendars/holidays/${encodeURIComponent(holidayId)}`);
      setBanner({ type: 'ok', text: 'Removed custom tenant holiday.' });
      await loadCalendar();
    } catch (err: any) {
      setBanner({ type: 'err', text: err.message || 'Cannot delete statutory baseline holiday.' });
    } finally {
      setSaving(false);
    }
  };

  const handleRunPreviewCalculation = async () => {
    try {
      const res = await apiClient.post<any>('/v1/calendars/calculate', {
        startDate: calcStart,
        durationDays: calcDuration,
      });
      setCalcResult({
        finishDate: res.finishDate,
        workingDays: res.workingDays,
        availableHoursPerMember: res.availableHoursPerMember,
        holidaysSkipped: res.holidaysSkipped || [],
      });
    } catch (err: any) {
      setBanner({ type: 'err', text: err.message || 'Schedule calculation failed.' });
    }
  };

  useEffect(() => {
    handleRunPreviewCalculation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Public Holidays Act 36 of 1994 · s2(1) & s2A
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-400" />
            Working Calendars & December Shutdown
          </h2>
          <p className="text-xs text-slate-400">
            Manage South African statutory holidays, automatic Sunday-to-Monday observance, presidentially declared holidays, and company builder&apos;s shutdown periods.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 font-mono">Calendar Year:</label>
          <select
            value={selectedYear}
            onChange={(e) => {
              const yr = Number(e.target.value);
              setSelectedYear(yr);
              setShutdownStart(`${yr}-12-17`);
              setShutdownEnd(`${yr}-12-31`);
            }}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-100 focus:outline-none focus:border-indigo-500"
          >
            {[2025, 2026, 2027, 2028, 2029, 2030].map((yr) => (
              <option key={yr} value={yr}>
                {yr} SAST
              </option>
            ))}
          </select>
        </div>
      </div>

      {banner && (
        <div
          className={clsx(
            'px-4 py-3 rounded-xl border text-xs flex items-center gap-2',
            banner.type === 'ok'
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
          )}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{banner.text}</span>
        </div>
      )}

      {/* Annual Capacity KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/75 border border-slate-800">
          <div className="text-[11px] font-mono uppercase text-slate-400">
            {selectedYear} SA Working Days
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono mt-1">
            {stats.workingDaysInYear}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Excludes weekends &amp; SA public holidays
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/75 border border-slate-800">
          <div className="text-[11px] font-mono uppercase text-slate-400">
            Annual Capacity / FTE
          </div>
          <div className="text-2xl font-extrabold text-indigo-400 font-mono mt-1">
            {stats.annualCapacityHours}h
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            At {dailyWorkHours}h/day ({workDays.length}d/week)
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/75 border border-slate-800">
          <div className="text-[11px] font-mono uppercase text-slate-400">
            Sunday → Monday Shifts
          </div>
          <div className="text-2xl font-extrabold text-amber-400 font-mono mt-1">
            {stats.observedMondaysCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Act 36 of 1994 s2(1) automatic observance
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/75 border border-slate-800">
          <div className="text-[11px] font-mono uppercase text-slate-400">
            s2A &amp; Shutdown Days
          </div>
          <div className="text-2xl font-extrabold text-purple-400 font-mono mt-1">
            {stats.adHocAndShutdownCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Presidential elections &amp; builder&apos;s break
          </div>
        </div>
      </div>

      {/* Configuration Forms Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workdays & Daily Hours */}
        <form
          onSubmit={handleSaveCalendarDefaults}
          className="p-5 rounded-2xl bg-slate-900/75 border border-slate-800 space-y-4"
        >
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-100">
              Standard Workweek &amp; Daily Hours
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Calendar Name</label>
              <input
                type="text"
                value={calendarName}
                onChange={(e) => setCalendarName(e.target.value)}
                disabled={!isTenantAdmin}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1.5">Active Workdays</label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {WEEKDAY_OPTIONS.map((opt) => {
                  const active = workDays.includes(opt.day);
                  return (
                    <button
                      key={opt.day}
                      type="button"
                      disabled={!isTenantAdmin}
                      onClick={() => toggleWorkDay(opt.day)}
                      className={clsx(
                        'px-3 py-1.5 rounded-xl font-mono text-xs font-semibold border transition',
                        active
                          ? 'bg-indigo-600 text-white border-indigo-400/50'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                      )}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Daily Work Hours</label>
              <input
                type="number"
                min={1}
                max={24}
                step={0.5}
                value={dailyWorkHours}
                onChange={(e) => setDailyWorkHours(Number(e.target.value) || 8)}
                disabled={!isTenantAdmin}
                className="w-36 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {isTenantAdmin && (
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-xs font-semibold transition"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Save Working Calendar</span>
            </button>
          )}
        </form>

        {/* December Builder's Shutdown Period */}
        <form
          onSubmit={handleAddShutdown}
          className="p-5 rounded-2xl bg-slate-900/75 border border-slate-800 space-y-4"
        >
          <div className="flex items-center gap-2">
            <Sun className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-slate-100">
              December Builder&apos;s Shutdown / Custom Closure
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Block out annual December studio/construction shutdown periods. Gantt CPM cascades and resource utilization heatmaps automatically skip these dates.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Shutdown Start</label>
              <input
                type="date"
                value={shutdownStart}
                onChange={(e) => setShutdownStart(e.target.value)}
                disabled={!isTenantAdmin}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Shutdown End</label>
              <input
                type="date"
                value={shutdownEnd}
                onChange={(e) => setShutdownEnd(e.target.value)}
                disabled={!isTenantAdmin}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono"
              />
            </div>
          </div>

          <div className="text-xs">
            <label className="block text-slate-400 mb-1">Shutdown Label</label>
            <input
              type="text"
              value={shutdownLabel}
              onChange={(e) => setShutdownLabel(e.target.value)}
              disabled={!isTenantAdmin}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
            />
          </div>

          {isTenantAdmin && (
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-60 text-white text-xs font-semibold transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Apply Shutdown Range</span>
            </button>
          )}
        </form>
      </div>

      {/* Interactive Working-Day Schedule Tester */}
      <div className="p-5 rounded-2xl bg-slate-900/75 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-100">
              SA Working-Day &amp; Long-Weekend Schedule Calculator
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Tests `addWorkingDays` &amp; `countWorkingDays` live
          </span>
        </div>

        <div className="flex flex-wrap items-end gap-3 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">Task Start Date</label>
            <input
              type="date"
              value={calcStart}
              onChange={(e) => setCalcStart(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Duration (Working Days)</label>
            <input
              type="number"
              min={1}
              max={365}
              value={calcDuration}
              onChange={(e) => setCalcDuration(Math.max(1, Number(e.target.value) || 1))}
              className="w-32 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono"
            />
          </div>
          <button
            type="button"
            onClick={handleRunPreviewCalculation}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition"
          >
            Calculate Finish Date
          </button>
        </div>

        {calcResult && (
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-slate-400">Task Finish Date: </span>
              <strong className="font-mono text-emerald-300 text-sm">
                {calcResult.finishDate}
              </strong>
              <span className="text-slate-400 ml-3">
                ({calcResult.workingDays} working days · {calcResult.availableHoursPerMember}h)
              </span>
            </div>
            {calcResult.holidaysSkipped.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-amber-300 font-semibold">Skipped Holidays:</span>
                {calcResult.holidaysSkipped.map((h) => (
                  <span
                    key={h.dateIso}
                    className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-200 font-mono text-[11px]"
                  >
                    {h.dateIso} ({h.name})
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Public Holidays & Ad-Hoc Declarations Table */}
      <div className="p-5 rounded-2xl bg-slate-900/75 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-slate-100">
              {selectedYear} South African Public Holidays &amp; Tenant Shutdowns ({holidays.length})
            </h3>
          </div>

          {isTenantAdmin && (
            <form onSubmit={handleAddAdHocHoliday} className="flex items-center gap-2 flex-wrap">
              <input
                type="date"
                value={adHocDate}
                onChange={(e) => setAdHocDate(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 font-mono"
              />
              <input
                type="text"
                placeholder="Ad-hoc holiday name..."
                value={adHocName}
                onChange={(e) => setAdHocName(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100"
              />
              <button
                type="submit"
                disabled={saving || !adHocDate || !adHocName.trim()}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold"
              >
                <Plus className="w-3.5 h-3.5" /> Add Day
              </button>
            </form>
          )}
        </div>

        {loading ? (
          <div className="py-12 flex items-center justify-center text-slate-400 text-xs gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
            <span>Loading {selectedYear} South African calendar...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px] uppercase">
                  <th className="text-left py-2.5 px-3">Date</th>
                  <th className="text-left py-2.5 px-3">Holiday / Closure Name</th>
                  <th className="text-left py-2.5 px-3">Classification</th>
                  <th className="text-right py-2.5 px-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {holidays.map((h) => (
                  <tr
                    key={`${h.dateIso}-${h.name}`}
                    className="border-b border-slate-800/60 hover:bg-slate-800/30"
                  >
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-200">{h.dateIso}</td>
                    <td className="py-2.5 px-3 text-slate-100 font-medium">{h.name}</td>
                    <td className="py-2.5 px-3">
                      {h.isObservedMonday ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Observed Monday (s2(1))
                        </span>
                      ) : h.isCustomTenantHoliday ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          Tenant Shutdown / Custom
                        </span>
                      ) : h.isAdHocDeclared ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-sky-500/20 text-sky-300 border border-sky-500/30">
                          Presidential s2A
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          SA Statutory (Schedule 1)
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {isTenantAdmin && h.isCustomTenantHoliday && h.id ? (
                        <button
                          type="button"
                          onClick={() => handleDeleteHoliday(h.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                          title="Remove custom shutdown day"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <span className="text-[10px] font-mono text-slate-500">Protected</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkingCalendarView;
