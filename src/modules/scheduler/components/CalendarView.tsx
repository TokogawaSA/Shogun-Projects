import React, { useState, useMemo } from 'react';
import { Booking, BookingType } from '../types';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  User,
  Search,
  Calendar as CalendarIcon,
} from 'lucide-react';
import clsx from 'clsx';

export type CalendarDisplayMode = 'month' | 'week' | 'day' | 'agenda';

interface CalendarViewProps {
  bookings: Booking[];
  bookingTypes: BookingType[];
  onSelectBooking: (booking: Booking) => void;
  onOpenCreate: () => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  bookings,
  bookingTypes,
  onSelectBooking,
  onOpenCreate,
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [displayMode, setDisplayMode] = useState<CalendarDisplayMode>('month');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Navigate functions
  const handlePrev = () => {
    const next = new Date(currentDate);
    if (displayMode === 'month') {
      next.setMonth(next.getMonth() - 1);
    } else if (displayMode === 'week') {
      next.setDate(next.getDate() - 7);
    } else {
      next.setDate(next.getDate() - 1);
    }
    setCurrentDate(next);
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    if (displayMode === 'month') {
      next.setMonth(next.getMonth() + 1);
    } else if (displayMode === 'week') {
      next.setDate(next.getDate() + 7);
    } else {
      next.setDate(next.getDate() + 1);
    }
    setCurrentDate(next);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Filter bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (statusFilter !== 'all' && b.status !== statusFilter) return false;
      if (typeFilter !== 'all' && b.bookingTypeId !== typeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = b.title.toLowerCase().includes(q);
        const matchesGuest = b.guestName.toLowerCase().includes(q) || b.guestEmail.toLowerCase().includes(q);
        const matchesProject = b.project?.title?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesGuest && !matchesProject) return false;
      }
      return true;
    });
  }, [bookings, statusFilter, typeFilter, searchQuery]);

  // Calendar title label
  const headerTitle = useMemo(() => {
    if (displayMode === 'month') {
      return currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    }
    if (displayMode === 'week') {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return `${startOfWeek.toLocaleString('default', { month: 'short', day: 'numeric' })} – ${endOfWeek.toLocaleString('default', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    return currentDate.toLocaleString('default', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
  }, [currentDate, displayMode]);

  // Month grid computation
  const monthDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startingDayOfWeek = firstDay.getDay(); // 0 is Sunday
    const totalDays = lastDay.getDate();

    const days: Array<{
      date: Date;
      isCurrentMonth: boolean;
      isToday: boolean;
      dateKey: string;
    }> = [];

    // Prev month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({
        date: d,
        isCurrentMonth: false,
        isToday: false,
        dateKey: d.toISOString().split('T')[0],
      });
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // Current month days
    for (let day = 1; day <= totalDays; day++) {
      const d = new Date(year, month, day);
      const dateKey = d.toISOString().split('T')[0];
      days.push({
        date: d,
        isCurrentMonth: true,
        isToday: dateKey === todayStr,
        dateKey,
      });
    }

    // Next month padding to reach 35 or 42
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({
        date: d,
        isCurrentMonth: false,
        isToday: false,
        dateKey: d.toISOString().split('T')[0],
      });
    }

    return days;
  }, [currentDate]);

  // Map bookings to day keys
  const bookingsByDate = useMemo(() => {
    const map: Record<string, Booking[]> = {};
    for (const b of filteredBookings) {
      const dateKey = b.startTime.split('T')[0];
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(b);
    }
    return map;
  }, [filteredBookings]);

  return (
    <div className="space-y-4">
      {/* 1. Header Toolbar */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 backdrop-blur-xl shadow-lg">
        {/* Navigation & Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
            <button
              onClick={handlePrev}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-700/80 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-700/80 transition-colors"
            >
              Today
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-700/80 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h2 className="text-base font-bold text-slate-100 min-w-44">{headerTitle}</h2>
        </div>

        {/* Filters, View Selector & New Meeting Button */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter sessions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-36 sm:w-44"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no_show">No-Show</option>
          </select>

          {/* Type Filter */}
          {bookingTypes && bookingTypes.length > 0 && (
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500 max-w-36 truncate"
            >
              <option value="all">All Services</option>
              {bookingTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          )}

          {/* Display Mode Tabs */}
          <div className="flex items-center p-1 bg-slate-950/80 border border-slate-800 rounded-xl">
            {(['month', 'week', 'agenda'] as CalendarDisplayMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setDisplayMode(mode)}
                className={clsx(
                  'px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all',
                  displayMode === mode
                    ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                )}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* New Session Button */}
          <button
            onClick={onOpenCreate}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule Meeting</span>
          </button>
        </div>
      </div>

      {/* 2. Month Calendar View */}
      {displayMode === 'month' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-slate-800 bg-slate-950/60 text-center">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="py-2.5 text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider">
                {d}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-800/80">
            {monthDays.map((dayObj, idx) => {
              const dayBookings = bookingsByDate[dayObj.dateKey] || [];
              return (
                <div
                  key={idx}
                  className={clsx(
                    'min-h-[110px] p-2 flex flex-col transition-colors',
                    dayObj.isCurrentMonth ? 'bg-slate-900/40' : 'bg-slate-950/40 opacity-40',
                    dayObj.isToday && 'ring-1 ring-inset ring-indigo-500/60 bg-indigo-950/10'
                  )}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={clsx(
                        'text-xs font-mono font-semibold px-1.5 py-0.5 rounded-md',
                        dayObj.isToday
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'text-slate-400'
                      )}
                    >
                      {dayObj.date.getDate()}
                    </span>
                    {dayBookings.length > 0 && (
                      <span className="text-[10px] font-mono text-slate-500">
                        {dayBookings.length} mtg
                      </span>
                    )}
                  </div>

                  {/* Day Bookings List */}
                  <div className="space-y-1 overflow-y-auto max-h-24 scrollbar-none flex-1">
                    {dayBookings.map((b) => {
                      const startTimeStr = new Date(b.startTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                      const color = b.bookingType?.color || '#6366f1';
                      return (
                        <button
                          key={b.id}
                          onClick={() => onSelectBooking(b)}
                          className={clsx(
                            'w-full text-left p-1.5 rounded-lg text-[11px] font-medium truncate flex items-center gap-1.5 transition-all group',
                            b.status === 'cancelled'
                              ? 'bg-rose-950/30 text-rose-400 line-through border border-rose-900/40'
                              : 'bg-slate-800/90 text-slate-200 hover:bg-slate-700 border border-slate-700/60 hover:border-slate-600 shadow-sm'
                          )}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <span className="font-mono text-[10px] text-slate-400 shrink-0">
                            {startTimeStr}
                          </span>
                          <span className="truncate">{b.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Agenda View */}
      {displayMode === 'agenda' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <h3 className="text-xs font-mono uppercase text-slate-400 font-bold tracking-wider">
            Upcoming Scheduled Sessions ({filteredBookings.length})
          </h3>

          {filteredBookings.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-xs">
              <CalendarIcon className="w-8 h-8 mx-auto mb-2 opacity-40 text-indigo-400" />
              No meetings found for the selected criteria.
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredBookings.map((b) => {
                const start = new Date(b.startTime);
                const color = b.bookingType?.color || '#6366f1';
                return (
                  <div
                    key={b.id}
                    onClick={() => onSelectBooking(b)}
                    className="p-3.5 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition-all group shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-2.5 h-10 rounded-full shrink-0 mt-0.5"
                        style={{ backgroundColor: color }}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors">
                            {b.title}
                          </h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 text-slate-400 border border-slate-800">
                            {b.durationMinutes}m
                          </span>
                          <span className={clsx(
                            'text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize',
                            b.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            b.status === 'scheduled' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                            b.status === 'completed' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                            'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          )}>
                            {b.status}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            {start.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} at{' '}
                            {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-slate-500" />
                            {b.guestName} ({b.guestEmail})
                          </span>
                          {b.project && (
                            <span className="text-indigo-400 font-mono text-[10px]">
                              Project: {b.project.title}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {b.locationUrl && (
                        <a
                          href={b.locationUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 text-xs font-medium transition-all"
                        >
                          Join
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. Week View */}
      {displayMode === 'week' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="grid grid-cols-7 gap-2">
            {[0, 1, 2, 3, 4, 5, 6].map((dayOffset) => {
              const weekStart = new Date(currentDate);
              weekStart.setDate(currentDate.getDate() - currentDate.getDay() + dayOffset);
              const dateKey = weekStart.toISOString().split('T')[0];
              const dayBookings = bookingsByDate[dateKey] || [];
              const isToday = dateKey === new Date().toISOString().split('T')[0];

              return (
                <div
                  key={dayOffset}
                  className={clsx(
                    'p-3 rounded-xl border min-h-[300px] flex flex-col',
                    isToday
                      ? 'bg-indigo-950/20 border-indigo-500/40'
                      : 'bg-slate-950/40 border-slate-800'
                  )}
                >
                  <div className="text-center pb-2 border-b border-slate-800 mb-2">
                    <div className="text-[10px] font-mono uppercase text-slate-400">
                      {weekStart.toLocaleString('default', { weekday: 'short' })}
                    </div>
                    <div
                      className={clsx(
                        'text-xs font-mono font-bold mt-0.5 inline-block px-1.5 py-0.5 rounded',
                        isToday ? 'bg-indigo-600 text-white' : 'text-slate-200'
                      )}
                    >
                      {weekStart.getDate()}
                    </div>
                  </div>

                  <div className="space-y-1.5 flex-1 overflow-y-auto">
                    {dayBookings.map((b) => (
                      <div
                        key={b.id}
                        onClick={() => onSelectBooking(b)}
                        className="p-2 rounded-lg bg-slate-800/90 hover:bg-slate-800 border border-slate-700/60 cursor-pointer text-[11px] space-y-1 transition-all"
                      >
                        <div className="font-semibold text-slate-200 truncate">{b.title}</div>
                        <div className="text-[10px] font-mono text-indigo-400">
                          {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
