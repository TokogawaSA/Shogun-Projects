import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { bookingService } from '../modules/scheduler/services/bookingService';
import { BookingType, TimeSlot } from '../modules/scheduler/types';
import {
  Calendar as CalendarIcon,
  Clock,
  Video,
  CheckCircle2,
  Loader2,
  Layers,
  ArrowRight,
  Globe,
} from 'lucide-react';
import clsx from 'clsx';

export const PublicBookingPage: React.FC = () => {
  const { hostId = 'user-default', slug = 'project-status-30' } = useParams<{
    hostId: string;
    slug: string;
  }>();

  const [loading, setLoading] = useState(true);
  const [hostMeta, setHostMeta] = useState<any>(null);
  const [bookingType, setBookingType] = useState<BookingType | null>(null);

  // Booking Flow Steps: 1: Pick Date & Slot, 2: Fill Details, 3: Confirmed
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Selected state
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  // Guest Details
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestNotes, setGuestNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<any>(null);

  // Load Host & Type Meta
  useEffect(() => {
    async function loadMeta() {
      setLoading(true);
      try {
        const data = await bookingService.getPublicBookingTypeMeta(hostId, slug);
        setHostMeta(data.host);
        setBookingType(data.bookingType);
      } finally {
        setLoading(false);
      }
    }
    loadMeta();
  }, [hostId, slug]);

  // Load Slots whenever selectedDate or bookingType changes
  const loadSlots = useCallback(async () => {
    if (!selectedDate || !bookingType) return;
    setLoadingSlots(true);
    try {
      const slots = await bookingService.getPublicSlots(
        hostId,
        selectedDate,
        bookingType.id
      );
      setAvailableSlots(slots);
      setSelectedSlot(null);
    } finally {
      setLoadingSlots(false);
    }
  }, [hostId, selectedDate, bookingType]);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || !guestName || !guestEmail) return;

    setSubmitting(true);
    try {
      const res = await bookingService.schedulePublicBooking({
        hostUserId: hostId,
        bookingTypeId: bookingType?.id,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        guestName,
        guestEmail,
        guestPhone,
        guestNotes,
      });

      setConfirmedBooking(res.booking);
      setStep(3);
    } catch (err) {
      console.error('Booking failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-xs font-mono">Loading booking calendar...</p>
      </div>
    );
  }

  if (!bookingType) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-md text-center space-y-3 text-slate-300">
          <CalendarIcon className="w-8 h-8 mx-auto text-rose-400" />
          <h2 className="text-base font-bold text-white">Booking Service Not Found</h2>
          <p className="text-xs text-slate-400">
            This booking link may have expired or is currently inactive. Please check with your meeting host.
          </p>
        </div>
      </div>
    );
  }

  const startDate = selectedSlot ? new Date(selectedSlot.startTime) : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 py-12 px-4 flex items-center justify-center">
      {/* Background Glow */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative w-full max-w-4xl bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-2xl flex flex-col md:flex-row">
        {/* Left Sidebar: Host & Meeting Type Info */}
        <div className="w-full md:w-80 p-8 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col justify-between bg-slate-950/50">
          <div className="space-y-6">
            {/* Host Branding */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-600/20 font-bold text-lg text-white">
                {hostMeta?.displayName?.[0] || 'S'}
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  {hostMeta?.displayName || 'Shogun Team'}
                </h3>
                <p className="text-xs text-slate-400 font-mono">Shogun Projects</p>
              </div>
            </div>

            {/* Meeting Type Info */}
            <div className="space-y-2">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full mr-2"
                style={{ backgroundColor: bookingType.color || '#6366f1' }}
              />
              <h2 className="text-lg font-bold text-white">{bookingType.title}</h2>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>{bookingType.durationMinutes} minutes</span>
                <span>•</span>
                <span className="capitalize">{bookingType.locationType.replace('_', ' ')}</span>
              </div>
            </div>

            {bookingType.description && (
              <p className="text-xs text-slate-400 leading-relaxed">
                {bookingType.description}
              </p>
            )}

            {/* Selected Summary Pill */}
            {selectedSlot && step === 2 && (
              <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs space-y-1">
                <div className="text-[10px] font-mono uppercase text-indigo-400 font-semibold">
                  Selected Time
                </div>
                <div className="font-semibold text-white">
                  {new Date(selectedSlot.startTime).toLocaleString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-slate-800 text-[11px] text-slate-500 font-mono flex items-center justify-between">
            <span>Powered by Shogun 2.0</span>
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 p-8 flex flex-col justify-center">
          {/* Step 1: Select Date & Slot */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-white">Select a Date & Time</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Choose an available window in your local time zone
                </p>
              </div>

              {/* Date Input */}
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1.5">
                  Select Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full sm:w-64 p-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              {/* Time Slots Grid */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-slate-400 font-medium block">
                    Available Slots ({availableSlots.length})
                  </label>
                  <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1 bg-slate-950/60 border border-slate-800 px-2 py-0.5 rounded-lg">
                    <Globe className="w-3 h-3 text-indigo-400" />
                    <span>{Intl.DateTimeFormat().resolvedOptions().timeZone || 'GMT+2'}</span>
                  </span>
                </div>

                {loadingSlots ? (
                  <div className="py-12 flex items-center justify-center text-xs text-slate-500">
                    <Loader2 className="w-4 h-4 animate-spin mr-2 text-indigo-400" />
                    Finding available slots...
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="py-8 text-center bg-slate-950/50 rounded-xl border border-slate-800 text-xs text-slate-500">
                    No available slots on this date. Please select another day.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto pr-1">
                    {availableSlots.map((slot) => {
                      const timeStr = new Date(slot.startTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                      const isSelected = selectedSlot?.startTime === slot.startTime;

                      return (
                        <button
                          key={slot.startTime}
                          onClick={() => setSelectedSlot(slot)}
                          className={clsx(
                            'p-2.5 rounded-xl text-xs font-mono font-semibold transition-all flex items-center justify-center gap-1.5',
                            isSelected
                              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/40 ring-1 ring-white/30'
                              : 'bg-slate-950/80 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700'
                          )}
                        >
                          <Clock className="w-3.5 h-3.5 opacity-60" />
                          <span>{timeStr}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Next Step Button */}
              <div className="pt-4 border-t border-slate-800 flex justify-end">
                <button
                  disabled={!selectedSlot}
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Guest Details Form */}
          {step === 2 && (
            <form onSubmit={handleSubmitBooking} className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Enter Your Details</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    We will send a calendar invite and session instructions to your email
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  Change Time
                </button>
              </div>

              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jane Doe"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="jane@company.com"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Phone Number (optional)</label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">
                    Project / Meeting Agenda Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Share any background details, drawings, or specific goals for this session..."
                    value={guestNotes}
                    onChange={(e) => setGuestNotes(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
                >
                  {submitting ? 'Confirming Session...' : 'Confirm Booking'}
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Booking Confirmed */}
          {step === 3 && (
            <div className="py-8 text-center space-y-5">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">You're Scheduled!</h3>
                <p className="text-xs text-slate-400">
                  A calendar invitation has been dispatched to{' '}
                  <span className="font-semibold text-slate-200">{guestEmail}</span>
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 max-w-sm mx-auto text-left text-xs space-y-2">
                <div className="font-semibold text-white">{bookingType.title}</div>
                <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
                  <CalendarIcon className="w-3.5 h-3.5 text-indigo-400" />
                  <span>
                    {startDate?.toLocaleString(undefined, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px] capitalize">
                  <Video className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{bookingType.locationType.replace('_', ' ')}</span>
                </div>
              </div>

              <div className="pt-2 space-y-1">
                {confirmedBooking?.id && (
                  <div className="text-[10px] font-mono text-indigo-400">
                    Booking Reference: {confirmedBooking.id}
                  </div>
                )}
                <p className="text-[11px] text-slate-500">
                  Need to make changes? Check your confirmation email for reschedule options.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
