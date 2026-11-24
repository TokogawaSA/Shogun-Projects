import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, Sparkles } from 'lucide-react';
import { Task } from '../../types';
import {
  SaHolidayItem,
  buildHolidayMapForYears,
  fetchTenantWorkingCalendar,
} from '../../utils/saHolidayUtils';

interface TaskCalendarViewProps {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onQuickAddForDate?: (dateIso: string) => void;
}

export const TaskCalendarView: React.FC<TaskCalendarViewProps> = ({
  tasks,
  onSelectTask,
  onQuickAddForDate,
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const [apiHolidays, setApiHolidays] = useState<SaHolidayItem[]>([]);

  useEffect(() => {
    let active = true;
    fetchTenantWorkingCalendar(year).then((res) => {
      if (active && Array.isArray(res.holidays)) {
        setApiHolidays(res.holidays);
      }
    });
    return () => {
      active = false;
    };
  }, [year]);

  const holidayMap = useMemo(
    () => buildHolidayMapForYears([year], apiHolidays),
    [year, apiHolidays]
  );

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const leadingBlanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  // Group tasks by date string YYYY-MM-DD
  const tasksByDate = React.useMemo(() => {
    const map = new Map<string, Task[]>();
    tasks.forEach((t) => {
      if (t.dueDate) {
        const d = new Date(t.dueDate).toISOString().split('T')[0];
        if (!map.has(d)) map.set(d, []);
        map.get(d)!.push(t);
      }
    });
    return map;
  }, [tasks]);

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 space-y-4 backdrop-blur-md shadow-xl select-none text-xs">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-indigo-400" />
          <h3 className="text-base font-bold text-slate-100">
            {monthNames[month]} {year}
          </h3>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-2.5 py-1 text-xs font-semibold text-slate-300 hover:text-white"
          >
            Today
          </button>
          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider py-1 border-b border-slate-800/60">
        <div>Sun</div>
        <div>Mon</div>
        <div>Tue</div>
        <div>Wed</div>
        <div>Thu</div>
        <div>Fri</div>
        <div>Sat</div>
      </div>

      {/* Calendar Days Grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Leading empty cells */}
        {leadingBlanks.map((b) => (
          <div key={`blank-${b}`} className="min-h-[100px] p-2 bg-slate-950/20 rounded-xl border border-transparent" />
        ))}

        {/* Days of Month */}
        {daysArray.map((day) => {
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayTasks = tasksByDate.get(dateStr) || [];
          const holiday = holidayMap.get(dateStr) || null;
          const isToday =
            new Date().toISOString().split('T')[0] === dateStr;

          return (
            <div
              key={day}
              title={
                holiday
                  ? `${dateStr}: ${holiday.name}${holiday.isObservedMonday ? ' (Observed Monday - Act 36 of 1994 s2(1))' : ' (SA Public Holiday)'}`
                  : undefined
              }
              className={`min-h-[110px] p-2 rounded-xl border transition flex flex-col justify-between ${
                holiday
                  ? 'bg-amber-950/35 border-amber-500/60 shadow-sm'
                  : isToday
                    ? 'bg-indigo-950/30 border-indigo-500/80 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1 gap-1">
                <div className="flex items-center gap-1 min-w-0">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                      holiday
                        ? 'bg-amber-500/30 text-amber-200 border border-amber-400/50'
                        : isToday
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-300'
                    }`}
                  >
                    {day}
                  </span>
                  {holiday && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-200 text-[9px] font-semibold truncate">
                      <Sparkles className="w-2.5 h-2.5 shrink-0" />
                      <span className="truncate">{holiday.name}</span>
                    </span>
                  )}
                </div>

                {onQuickAddForDate && (
                  <button
                    onClick={() => onQuickAddForDate(dateStr)}
                    className="p-0.5 rounded text-slate-500 hover:text-indigo-400 hover:bg-slate-800 opacity-0 hover:opacity-100 transition"
                    title="Add task on this date"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Day Tasks List */}
              <div className="space-y-1 flex-1 overflow-y-auto max-h-[80px] custom-scrollbar">
                {dayTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => onSelectTask(task)}
                    className={`p-1.5 rounded-lg border text-[11px] font-medium truncate cursor-pointer transition ${
                      task.priority === 'urgent'
                        ? 'bg-rose-950/60 text-rose-200 border-rose-800/80 hover:bg-rose-900/60'
                        : task.priority === 'high'
                        ? 'bg-orange-950/60 text-orange-200 border-orange-800/80 hover:bg-orange-900/60'
                        : task.status === 'done'
                        ? 'bg-emerald-950/60 text-emerald-200 border-emerald-800/80 hover:bg-emerald-900/60 line-through opacity-80'
                        : 'bg-indigo-950/60 text-indigo-200 border-indigo-800/80 hover:bg-indigo-900/60'
                    }`}
                    title={`${task.title} (${task.status})`}
                  >
                    {task.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
