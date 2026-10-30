import React, { useState } from 'react';
import { Booking, BookingStatus } from '../types';
import {
  Clock,
  User,
  FolderKanban,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Check,
  Trash2,
} from 'lucide-react';

interface BookingsTableProps {
  bookings: Booking[];
  onSelectBooking: (booking: Booking) => void;
  onUpdateStatus: (id: string, status: BookingStatus) => Promise<void>;
  onDeleteBooking: (id: string) => Promise<void>;
}

export const BookingsTable: React.FC<BookingsTableProps> = ({
  bookings,
  onSelectBooking,
  onUpdateStatus,
  onDeleteBooking,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = bookings.filter((b) => {
    if (statusFilter !== 'all' && b.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        b.title.toLowerCase().includes(q) ||
        b.guestName.toLowerCase().includes(q) ||
        b.guestEmail.toLowerCase().includes(q) ||
        (b.project?.title && b.project.title.toLowerCase().includes(q))
      );
    }
    return true;
  });

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
      case 'no_show':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertCircle className="w-3 h-3" /> No-Show
          </span>
        );
      default:
        return <span className="text-slate-400">{status}</span>;
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-3 p-4">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search by title, guest, email, project..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-64"
          />
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
        </div>

        <span className="text-xs font-mono text-slate-400">
          Showing {filtered.length} of {bookings.length} meetings
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/70 border-b border-slate-800 text-[10px] uppercase font-mono text-slate-400">
            <tr>
              <th className="py-3 px-4">Session & Type</th>
              <th className="py-3 px-4">Guest Attendee</th>
              <th className="py-3 px-4">Date & Time</th>
              <th className="py-3 px-4">Connected Context</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-500">
                  No meeting sessions match the filters.
                </td>
              </tr>
            ) : (
              filtered.map((b) => {
                const start = new Date(b.startTime);
                return (
                  <tr
                    key={b.id}
                    className="hover:bg-slate-800/50 transition-colors group cursor-pointer"
                    onClick={() => onSelectBooking(b)}
                  >
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors">
                        {b.title}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{b.durationMinutes} min</span>
                        <span>•</span>
                        <span className="capitalize">{b.locationType.replace('_', ' ')}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-slate-200 font-medium">{b.guestName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{b.guestEmail}</div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="text-slate-200 font-mono">
                        {start.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        {b.project && (
                          <div className="flex items-center gap-1 text-[11px] text-indigo-400 font-medium">
                            <FolderKanban className="w-3 h-3" />
                            <span className="truncate max-w-[140px]">{b.project.title}</span>
                          </div>
                        )}
                        {b.contact && (
                          <div className="flex items-center gap-1 text-[11px] text-emerald-400">
                            <User className="w-3 h-3" />
                            <span>{b.contact.firstName} {b.contact.lastName}</span>
                          </div>
                        )}
                        {!b.project && !b.contact && (
                          <span className="text-slate-600 text-[10px] font-mono">Direct / Unlinked</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      {statusBadge(b.status)}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {b.status === 'scheduled' && (
                          <button
                            onClick={() => onUpdateStatus(b.id, 'confirmed')}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 transition-colors"
                          >
                            Confirm
                          </button>
                        )}
                        <button
                          onClick={() => onSelectBooking(b)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                        >
                          View
                        </button>
                        <button
                          onClick={() => onDeleteBooking(b.id)}
                          className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Delete booking"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
