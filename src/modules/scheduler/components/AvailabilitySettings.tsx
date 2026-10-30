import React, { useState } from 'react';
import { UserAvailability, WeeklySchedule } from '../types';
import { Clock, Globe, Check, Plus, Trash2 } from 'lucide-react';
import clsx from 'clsx';

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

interface AvailabilitySettingsProps {
  availability: UserAvailability;
  onSave: (payload: Partial<UserAvailability>) => Promise<void>;
}

export const AvailabilitySettings: React.FC<AvailabilitySettingsProps> = ({
  availability,
  onSave,
}) => {
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule>(
    availability.weeklySchedule || {}
  );
  const [timeZone, setTimeZone] = useState(availability.timeZone || 'UTC');
  const [slotStepMin, setSlotStepMin] = useState(availability.slotStepMin || 30);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const toggleDay = (dayKey: string) => {
    const current = weeklySchedule[dayKey] || [];
    if (current.length > 0) {
      setWeeklySchedule({ ...weeklySchedule, [dayKey]: [] });
    } else {
      setWeeklySchedule({
        ...weeklySchedule,
        [dayKey]: [{ start: '09:00', end: '17:00' }],
      });
    }
  };

  const addWindow = (dayKey: string) => {
    const list = [...(weeklySchedule[dayKey] || [])];
    const lastWin = list[list.length - 1];
    let newStart = '13:00';
    let newEnd = '17:00';
    if (lastWin && lastWin.end) {
      const [h, m] = lastWin.end.split(':').map(Number);
      const nextH = Math.min(22, h + 1);
      const endH = Math.min(23, nextH + 3);
      newStart = `${String(nextH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      newEnd = `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
    setWeeklySchedule({
      ...weeklySchedule,
      [dayKey]: [...list, { start: newStart, end: newEnd }],
    });
  };

  const removeWindow = (dayKey: string, idx: number) => {
    const list = [...(weeklySchedule[dayKey] || [])];
    list.splice(idx, 1);
    setWeeklySchedule({ ...weeklySchedule, [dayKey]: list });
  };

  const handleTimeChange = (
    dayKey: string,
    idx: number,
    field: 'start' | 'end',
    value: string
  ) => {
    const list = [...(weeklySchedule[dayKey] || [])];
    if (list[idx]) {
      list[idx] = { ...list[idx], [field]: value };
      setWeeklySchedule({ ...weeklySchedule, [dayKey]: list });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        weeklySchedule,
        timeZone,
        slotStepMin,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 max-w-4xl backdrop-blur-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span>Weekly Availability & Working Hours</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Set the days and time intervals when you are open for client & colleague bookings
          </p>
        </div>

        <div className="flex items-center gap-2">
          {savedSuccess && (
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Saved!
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Availability'}
          </button>
        </div>
      </div>

      {/* Timezone & Interval Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div className="space-y-1">
          <label className="text-slate-400 font-medium flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-slate-500" />
            <span>Primary Time Zone</span>
          </label>
          <select
            value={timeZone}
            onChange={(e) => setTimeZone(e.target.value)}
            className="w-full p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="UTC">UTC (Coordinated Universal Time)</option>

            <option value="America/New_York">America/New_York (Eastern Time)</option>
            <option value="America/Chicago">America/Chicago (Central Time)</option>
            <option value="America/Denver">America/Denver (Mountain Time)</option>
            <option value="America/Los_Angeles">America/Los_Angeles (Pacific Time)</option>
            <option value="Europe/London">Europe/London (GMT/BST)</option>
            <option value="Europe/Paris">Europe/Paris (CET)</option>
            <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
            <option value="Asia/Dubai">Asia/Dubai (GST)</option>
            <option value="Australia/Sydney">Australia/Sydney (AEST)</option>
          </select>
        </div>

        <div className="space-y-2 bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
          <div className="flex items-center justify-between">
            <label className="text-slate-300 font-medium flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Slot Step Interval</span>
            </label>
            <span className="text-[11px] font-mono font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md">
              Every {slotStepMin} min{slotStepMin === 1 ? '' : 's'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="relative">
              <input
                type="number"
                min={5}
                max={480}
                step={5}
                value={slotStepMin}
                onChange={(e) => {
                  const val = Math.max(5, Math.min(480, Number(e.target.value) || 5));
                  setSlotStepMin(val);
                }}
                className="w-full p-2 pr-12 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 font-mono text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="e.g. 30"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-medium pointer-events-none">
                mins
              </span>
            </div>

            <select
              value={[10, 15, 20, 30, 45, 60, 90, 120].includes(slotStepMin) ? slotStepMin : 'custom'}
              onChange={(e) => {
                if (e.target.value !== 'custom') {
                  setSlotStepMin(Number(e.target.value));
                }
              }}
              className="w-full p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value={10}>10 min slots (:00, :10, :20, ...)</option>
              <option value={15}>15 min slots (:00, :15, :30, :45)</option>
              <option value={20}>20 min slots (:00, :20, :40)</option>
              <option value={30}>30 min slots (:00, :30)</option>
              <option value={45}>45 min slots</option>
              <option value={60}>60 min hourly (:00)</option>
              <option value={90}>90 min (1.5 hrs)</option>
              <option value={120}>120 min (2 hrs)</option>
              {![10, 15, 20, 30, 45, 60, 90, 120].includes(slotStepMin) && (
                <option value="custom">Custom ({slotStepMin} mins)</option>
              )}
            </select>
          </div>

          {/* Quick preset buttons */}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="text-[10px] text-slate-500 font-medium mr-0.5">Presets:</span>
            {[10, 15, 20, 30, 45, 60, 90, 120].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setSlotStepMin(preset)}
                className={clsx(
                  'px-2 py-0.5 rounded-lg text-[10px] font-mono transition-all',
                  slotStepMin === preset
                    ? 'bg-indigo-600 text-white font-bold shadow-sm shadow-indigo-600/30'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
                )}
              >
                {preset}m
              </button>
            ))}
          </div>

          <p className="text-[11px] text-slate-500">
            Fully customizable slot frequency: Enter any custom step interval (5-480 min) to generate start times.
          </p>
        </div>
      </div>

      {/* Days of Week List */}
      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-mono uppercase text-slate-400 font-semibold tracking-wider">
          Weekly Working Windows
        </h4>

        <div className="divide-y divide-slate-800/80 rounded-xl border border-slate-800 overflow-hidden bg-slate-950/40">
          {DAYS_OF_WEEK.map(({ key, label }) => {
            const windows = weeklySchedule[key] || [];
            const isAvailable = windows.length > 0;

            return (
              <div
                key={key}
                className={clsx(
                  'p-3.5 flex flex-col sm:flex-row sm:items-start justify-between gap-3 transition-colors',
                  isAvailable ? 'bg-slate-900/40' : 'bg-slate-950/70 opacity-60'
                )}
              >
                {/* Day Switch */}
                <div className="flex items-center gap-3 min-w-36 pt-1">
                  <input
                    type="checkbox"
                    id={`day-toggle-${key}`}
                    checked={isAvailable}
                    onChange={() => toggleDay(key)}
                    className="w-4 h-4 rounded text-indigo-600 bg-slate-800 border-slate-700 focus:ring-indigo-500 cursor-pointer"
                  />
                  <label
                    htmlFor={`day-toggle-${key}`}
                    className="text-xs font-semibold text-slate-200 cursor-pointer"
                  >
                    {label}
                  </label>
                </div>

                {/* Time Slots or Unavailable */}
                <div className="flex-1 flex flex-col gap-2">
                  {isAvailable ? (
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {windows.map((win, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-900/90 border border-slate-800 text-xs shadow-sm"
                          >
                            <input
                              type="time"
                              value={win.start}
                              onChange={(e) =>
                                handleTimeChange(key, idx, 'start', e.target.value)
                              }
                              className="px-2 py-1 rounded bg-slate-950 border border-slate-700/80 text-slate-200 font-mono text-xs focus:outline-none focus:border-indigo-500"
                            />
                            <span className="text-slate-500 font-mono text-[11px]">to</span>
                            <input
                              type="time"
                              value={win.end}
                              onChange={(e) =>
                                handleTimeChange(key, idx, 'end', e.target.value)
                              }
                              className="px-2 py-1 rounded bg-slate-950 border border-slate-700/80 text-slate-200 font-mono text-xs focus:outline-none focus:border-indigo-500"
                            />
                            {windows.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeWindow(key, idx)}
                                title="Remove time slot window"
                                className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={() => addWindow(key)}
                          title="Add split shift or extra slot window"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600/15 hover:bg-indigo-600/25 border border-indigo-500/30 text-indigo-400 text-[11px] font-medium transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Window</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500 italic font-mono pt-1">
                      Unavailable / Day Off
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

