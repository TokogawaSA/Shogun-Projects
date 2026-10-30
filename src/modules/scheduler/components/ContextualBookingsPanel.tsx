import React, { useState, useEffect, useCallback } from 'react';
import { Booking, BookingType, BookingStatus } from '../types';
import { bookingService } from '../services/bookingService';
import { BookingDetailModal } from './BookingDetailModal';
import { CreateBookingModal } from './CreateBookingModal';
import {
  Calendar,
  Clock,
  Plus,
  User,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Check,
} from 'lucide-react';
import clsx from 'clsx';

interface ContextualBookingsPanelProps {
  projectId?: string;
  contactId?: string;
  accountId?: string;
  title?: string;
  className?: string;
}

export const ContextualBookingsPanel: React.FC<ContextualBookingsPanelProps> = ({
  projectId,
  contactId,
  accountId,
  title = 'Scheduled Meetings & Bookings',
  className = '',
}) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingTypes, setBookingTypes] = useState<BookingType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [allBookings, types] = await Promise.all([
        bookingService.getBookings({ projectId, contactId, accountId }),
        bookingService.getBookingTypes(),
      ]);
      setBookings(allBookings);
      setBookingTypes(types);
    } finally {
      setLoading(false);
    }
  }, [projectId, contactId, accountId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  const handleCreateBooking = async (payload: Partial<Booking>) => {
    await bookingService.createBooking({
      ...payload,
      projectId,
      contactId,
      accountId,
    });
    await loadData();
  };

  const statusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> Confirmed
          </span>
        );
      case 'scheduled':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Clock className="w-3 h-3" /> Scheduled
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Check className="w-3 h-3" /> Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3 h-3" /> Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertCircle className="w-3 h-3" /> {status}
          </span>
        );
    }
  };

  return (
    <div className={clsx('space-y-4', className)}>
      {/* Header Bar */}
      <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 p-3.5 rounded-2xl backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-bold text-slate-100">{title}</h3>
          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono text-[10px] font-semibold">
            {bookings.length}
          </span>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Schedule Meeting</span>
        </button>
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-slate-400 text-xs">
          <Loader2 className="w-5 h-5 animate-spin mr-2 text-indigo-500" />
          Loading meeting schedule...
        </div>
      ) : bookings.length === 0 ? (
        <div className="p-8 text-center bg-slate-900/40 border border-slate-800/80 rounded-2xl text-slate-500 text-xs space-y-2">
          <Calendar className="w-7 h-7 mx-auto opacity-40 text-indigo-400" />
          <p>No meetings scheduled for this record yet.</p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-2"
          >
            Schedule the first session
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {bookings.map((b) => {
            const start = new Date(b.startTime);
            const color = b.bookingType?.color || '#6366f1';

            return (
              <div
                key={b.id}
                onClick={() => setSelectedBooking(b)}
                className="p-4 rounded-xl bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-slate-700/80 transition-all cursor-pointer group shadow-sm flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <span
                      className="w-2 h-7 rounded-full shrink-0 mt-0.5"
                      style={{ backgroundColor: color }}
                    />
                    <div>
                      <h4 className="text-xs font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors">
                        {b.title}
                      </h4>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>
                          {start.toLocaleDateString(undefined, {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}{' '}
                          at{' '}
                          {start.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <span>•</span>
                        <span>{b.durationMinutes}m</span>
                      </div>
                    </div>
                  </div>

                  <div>{statusBadge(b.status)}</div>
                </div>

                <div className="pt-2 border-t border-slate-800/70 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5 truncate mr-2">
                    <User className="w-3 h-3 text-slate-500 shrink-0" />
                    <span className="truncate">{b.guestName}</span>
                  </div>

                  {b.locationUrl && (
                    <a
                      href={b.locationUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-indigo-400 hover:text-indigo-300 text-[10px] font-semibold flex items-center gap-1 shrink-0"
                    >
                      <span>Join</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
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
        initialProjectId={projectId}
        initialContactId={contactId}
        initialAccountId={accountId}
        onCreate={handleCreateBooking}
      />
    </div>
  );
};
