import React, { useState } from 'react';
import { Booking, BookingStatus } from '../types';
import {
  X,
  Calendar,
  Clock,
  Video,
  Phone,
  MapPin,
  User,
  Mail,
  Building2,
  FolderKanban,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  RotateCcw,
  Check,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface BookingDetailModalProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (id: string, status: BookingStatus, cancellationReason?: string) => Promise<void>;
  onReschedule?: (id: string, newStart: string, newEnd: string) => Promise<void>;
}

export const BookingDetailModal: React.FC<BookingDetailModalProps> = ({
  booking,
  isOpen,
  onClose,
  onUpdateStatus,
  onReschedule,
}) => {
  const [updating, setUpdating] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [newStartDate, setNewStartDate] = useState('');
  const [newStartTime, setNewStartTime] = useState('');

  if (!isOpen || !booking) return null;

  const startDate = new Date(booking.startTime);
  const endDate = new Date(booking.endTime);

  const formatDateTime = (date: Date) => {
    return date.toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleStatusChange = async (status: BookingStatus) => {
    setUpdating(true);
    try {
      await onUpdateStatus(booking.id, status, isCancelling ? cancelReason : undefined);
      setIsCancelling(false);
      onClose();
    } finally {
      setUpdating(false);
    }
  };

  const handleRescheduleSubmit = async () => {
    if (!newStartDate || !newStartTime || !onReschedule) return;
    setUpdating(true);
    try {
      const [h, m] = newStartTime.split(':').map(Number);
      const [year, month, day] = newStartDate.split('-').map(Number);
      const newStart = new Date(Date.UTC(year, month - 1, day, h, m));
      const newEnd = new Date(newStart.getTime() + booking.durationMinutes * 60 * 1000);

      await onReschedule(booking.id, newStart.toISOString(), newEnd.toISOString());
      setIsRescheduling(false);
      onClose();
    } finally {
      setUpdating(false);
    }
  };

  const statusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed
          </span>
        );
      case 'scheduled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Clock className="w-3.5 h-3.5" /> Scheduled
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Check className="w-3.5 h-3.5" /> Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5" /> Cancelled
          </span>
        );
      case 'no_show':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertCircle className="w-3.5 h-3.5" /> No-Show
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-700 text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-start justify-between bg-slate-900/50">
          <div className="space-y-1.5 pr-4">
            <div className="flex items-center gap-2">
              {statusBadge(booking.status)}
              <span className="text-[11px] font-mono text-slate-400">
                {booking.durationMinutes} min session
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-100">{booking.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Time & Location Banner */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
            <div className="flex items-center gap-2 text-xs text-slate-200">
              <Calendar className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="font-semibold">{formatDateTime(startDate)}</span>
              <span className="text-slate-500">to</span>
              <span className="text-slate-300 font-mono text-[11px]">
                {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-300">
              {booking.locationType === 'phone' ? (
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : booking.locationType === 'in_person' ? (
                <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
              ) : (
                <Video className="w-4 h-4 text-indigo-400 shrink-0" />
              )}
              <span className="capitalize">{booking.locationType.replace('_', ' ')}</span>
              {booking.locationUrl && (
                <a
                  href={booking.locationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 text-xs font-medium transition-all"
                >
                  <span>Join Meeting</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>

          {/* Guest Information */}
          <div className="space-y-2.5">
            <h4 className="text-[11px] uppercase font-mono tracking-wider text-slate-400 font-bold">
              Guest Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40 flex items-center gap-2.5">
                <User className="w-4 h-4 text-slate-400" />
                <div>
                  <div className="text-[10px] text-slate-500">Name</div>
                  <div className="font-semibold text-slate-200">{booking.guestName}</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40 flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-slate-400" />
                <div className="truncate">
                  <div className="text-[10px] text-slate-500">Email</div>
                  <div className="font-semibold text-slate-200 truncate">{booking.guestEmail}</div>
                </div>
              </div>
            </div>

            {booking.guestNotes && (
              <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/40 text-xs text-slate-300">
                <span className="text-[10px] font-mono uppercase text-slate-500 block mb-1">
                  Guest Agenda / Notes:
                </span>
                {booking.guestNotes}
              </div>
            )}
          </div>

          {/* CRM & Project Linkages */}
          {(booking.project || booking.contact || booking.account) && (
            <div className="space-y-2.5">
              <h4 className="text-[11px] uppercase font-mono tracking-wider text-slate-400 font-bold">
                Connected Context
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {booking.project && (
                  <Link
                    to={`/pm?projectId=${booking.projectId}&tab=bookings`}
                    className="p-3 rounded-xl bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 flex items-center justify-between transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <FolderKanban className="w-4 h-4 text-indigo-400" />
                      <div>
                        <div className="text-[10px] text-slate-400">Linked Project</div>
                        <div className="font-semibold text-slate-200 group-hover:text-white">
                          {booking.project.title}
                        </div>
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                  </Link>
                )}

                {booking.contact && (
                  <Link
                    to={`/crm/contacts/${booking.contactId}`}
                    className="p-3 rounded-xl bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center justify-between transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-emerald-400" />
                      <div>
                        <div className="text-[10px] text-slate-400">CRM Contact</div>
                        <div className="font-semibold text-slate-200 group-hover:text-white">
                          {booking.contact.firstName} {booking.contact.lastName}
                        </div>
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                  </Link>
                )}

                {booking.account && (
                  <Link
                    to={`/crm/accounts/${booking.accountId}`}
                    className="p-3 rounded-xl bg-cyan-500/5 hover:bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 flex items-center justify-between transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-cyan-400" />
                      <div>
                        <div className="text-[10px] text-slate-400">Client Account</div>
                        <div className="font-semibold text-slate-200 group-hover:text-white">
                          {booking.account.accountName}
                        </div>
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Cancellation Reason if cancelled */}
          {booking.status === 'cancelled' && booking.cancellationReason && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
              <span className="font-semibold block mb-0.5">Cancellation Reason:</span>
              {booking.cancellationReason}
            </div>
          )}

          {/* Cancellation Input Box */}
          {isCancelling && (
            <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/40 space-y-3">
              <h5 className="text-xs font-semibold text-rose-300">Confirm Cancellation</h5>
              <textarea
                placeholder="Reason for cancellation (optional)..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={2}
                className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={() => setIsCancelling(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                >
                  Back
                </button>
                <button
                  disabled={updating}
                  onClick={() => handleStatusChange('cancelled')}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-sm"
                >
                  {updating ? 'Cancelling...' : 'Confirm Cancel'}
                </button>
              </div>
            </div>
          )}

          {/* Reschedule Input Box */}
          {isRescheduling && (
            <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-800/40 space-y-3">
              <h5 className="text-xs font-semibold text-indigo-300">Reschedule Meeting</h5>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1 font-mono">Date</label>
                  <input
                    type="date"
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1 font-mono">Time</label>
                  <input
                    type="time"
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={() => setIsRescheduling(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                >
                  Back
                </button>
                <button
                  disabled={updating || !newStartDate || !newStartTime}
                  onClick={handleRescheduleSubmit}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm"
                >
                  {updating ? 'Rescheduling...' : 'Save New Time'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action Toolbar Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {booking.status !== 'cancelled' && (
              <button
                onClick={() => {
                  setIsCancelling(true);
                  setIsRescheduling(false);
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
              >
                Cancel Meeting
              </button>
            )}

            {booking.status !== 'cancelled' && booking.status !== 'completed' && (
              <button
                onClick={() => {
                  setIsRescheduling(true);
                  setIsCancelling(false);
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reschedule</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {booking.status === 'scheduled' && (
              <button
                disabled={updating}
                onClick={() => handleStatusChange('confirmed')}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-sm"
              >
                Confirm
              </button>
            )}

            {booking.status === 'confirmed' && (
              <>
                <button
                  disabled={updating}
                  onClick={() => handleStatusChange('no_show')}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium text-amber-400 hover:bg-amber-500/10 border border-amber-500/20 transition-all"
                >
                  No-Show
                </button>
                <button
                  disabled={updating}
                  onClick={() => handleStatusChange('completed')}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-sm"
                >
                  Complete
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
