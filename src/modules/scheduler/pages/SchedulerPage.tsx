import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { Booking, BookingType, UserAvailability, BookingStatus } from '../types';
import { bookingService } from '../services/bookingService';
import { CalendarView } from '../components/CalendarView';
import { BookingsTable } from '../components/BookingsTable';
import { BookingTypeManager } from '../components/BookingTypeManager';
import { AvailabilitySettings } from '../components/AvailabilitySettings';
import { BookingDetailModal } from '../components/BookingDetailModal';
import { CreateBookingModal } from '../components/CreateBookingModal';
import {
  Calendar as CalendarIcon,
  ListFilter,
  Layers,
  Clock,
  Plus,
  Loader2,
} from 'lucide-react';
import clsx from 'clsx';

export type SchedulerTab = 'calendar' | 'table' | 'types' | 'availability';

export const SchedulerPage: React.FC = () => {
  const { user } = useAuth();
  const hostUserId = user?.uid || (user as any)?.id || 'user-default';

  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = (searchParams.get('tab') as SchedulerTab) || 'calendar';

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingTypes, setBookingTypes] = useState<BookingType[]>([]);
  const [availability, setAvailability] = useState<UserAvailability | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [bList, types, avail] = await Promise.all([
        bookingService.getBookings(),
        bookingService.getBookingTypes(hostUserId),
        bookingService.getAvailability(hostUserId),
      ]);
      setBookings(bList);
      setBookingTypes(types);
      setAvailability(avail);
    } finally {
      setLoading(false);
    }
  }, [hostUserId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTabChange = (tab: SchedulerTab) => {
    setSearchParams({ tab });
  };

  // Booking CRUD
  const handleCreateBooking = async (payload: Partial<Booking>) => {
    await bookingService.createBooking({
      ...payload,
      hostUserId,
    });
    await loadData();
  };

  const handleUpdateStatus = async (id: string, status: BookingStatus, cancellationReason?: string) => {
    await bookingService.updateBooking(id, { status, cancellationReason });
    await loadData();
  };

  const handleReschedule = async (id: string, newStart: string, newEnd: string) => {
    await bookingService.updateBooking(id, {
      startTime: newStart,
      endTime: newEnd,
      status: 'rescheduled',
    });
    await loadData();
  };

  const handleDeleteBooking = async (id: string) => {
    await bookingService.deleteBooking(id);
    await loadData();
  };

  // Types CRUD
  const handleCreateType = async (payload: Partial<BookingType>) => {
    await bookingService.createBookingType({
      ...payload,
      userId: hostUserId,
    });
    await loadData();
  };

  const handleUpdateType = async (id: string, updates: Partial<BookingType>) => {
    await bookingService.updateBookingType(id, updates);
    await loadData();
  };

  const handleDeleteType = async (id: string) => {
    await bookingService.deleteBookingType(id);
    await loadData();
  };

  // Availability Save
  const handleSaveAvailability = async (payload: Partial<UserAvailability>) => {
    await bookingService.updateAvailability({
      ...payload,
      userId: hostUserId,
    });
    await loadData();
  };

  // Metrics
  const confirmedCount = bookings.filter((b) => b.status === 'confirmed').length;
  const scheduledCount = bookings.filter((b) => b.status === 'scheduled').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl shadow-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Operations & Commercial
              </span>
              <span className="text-xs text-slate-400 font-mono">Real-Time Sync</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
              <span>Scheduler & Bookings</span>
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl">
              Unified client consultation booking portal, internal meeting dispatch, and seamless activity synchronization with CRM Accounts and Project Workspaces.
            </p>
          </div>

          {/* Quick Metrics & CTA */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-4 bg-slate-950/60 border border-slate-800/80 px-4 py-2 rounded-xl text-xs font-mono">
              <div>
                <div className="text-[10px] text-slate-500">Confirmed</div>
                <div className="font-bold text-emerald-400">{confirmedCount}</div>
              </div>
              <div className="w-px h-6 bg-slate-800" />
              <div>
                <div className="text-[10px] text-slate-500">Pending</div>
                <div className="font-bold text-indigo-400">{scheduledCount}</div>
              </div>
              <div className="w-px h-6 bg-slate-800" />
              <div>
                <div className="text-[10px] text-slate-500">Services</div>
                <div className="font-bold text-cyan-400">{bookingTypes.length}</div>
              </div>
            </div>

            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Session</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Navigation Tabs Bar */}
      <div className="bg-slate-900/80 border border-slate-800/80 p-1.5 rounded-2xl backdrop-blur-xl shadow-lg sticky top-0 z-20 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1.5 min-w-max">
          <button
            onClick={() => handleTabChange('calendar')}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all duration-150',
              currentTab === 'calendar'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold ring-1 ring-indigo-400/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            )}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Calendar View</span>
            <span
              className={clsx(
                'px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold',
                currentTab === 'calendar' ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-slate-400'
              )}
            >
              {bookings.length}
            </span>
          </button>

          <button
            onClick={() => handleTabChange('table')}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all duration-150',
              currentTab === 'table'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold ring-1 ring-indigo-400/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            )}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>Bookings List</span>
          </button>

          <button
            onClick={() => handleTabChange('types')}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all duration-150',
              currentTab === 'types'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold ring-1 ring-indigo-400/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            )}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Booking Types</span>
            <span
              className={clsx(
                'px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold',
                currentTab === 'types' ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-slate-400'
              )}
            >
              {bookingTypes.length}
            </span>
          </button>

          <button
            onClick={() => handleTabChange('availability')}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all duration-150',
              currentTab === 'availability'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold ring-1 ring-indigo-400/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            )}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>My Working Hours</span>
          </button>
        </div>
      </div>

      {/* 3. Main View Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-3 bg-slate-900/40 rounded-2xl border border-slate-800 backdrop-blur-xl">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
          <p className="text-xs text-slate-400 font-medium">Loading scheduler...</p>
        </div>
      ) : (
        <div>
          {currentTab === 'calendar' && (
            <CalendarView
              bookings={bookings}
              bookingTypes={bookingTypes}
              onSelectBooking={(b) => setSelectedBooking(b)}
              onOpenCreate={() => setIsCreateOpen(true)}
            />
          )}

          {currentTab === 'table' && (
            <BookingsTable
              bookings={bookings}
              onSelectBooking={(b) => setSelectedBooking(b)}
              onUpdateStatus={handleUpdateStatus}
              onDeleteBooking={handleDeleteBooking}
            />
          )}

          {currentTab === 'types' && (
            <BookingTypeManager
              bookingTypes={bookingTypes}
              hostUserId={hostUserId}
              onCreateType={handleCreateType}
              onUpdateType={handleUpdateType}
              onDeleteType={handleDeleteType}
            />
          )}

          {currentTab === 'availability' && availability && (
            <AvailabilitySettings
              availability={availability}
              onSave={handleSaveAvailability}
            />
          )}
        </div>
      )}

      {/* Modals */}
      <BookingDetailModal
        booking={selectedBooking}
        isOpen={Boolean(selectedBooking)}
        onClose={() => setSelectedBooking(null)}
        onUpdateStatus={handleUpdateStatus}
        onReschedule={handleReschedule}
      />

      <CreateBookingModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        bookingTypes={bookingTypes}
        onCreate={handleCreateBooking}
      />
    </div>
  );
};
