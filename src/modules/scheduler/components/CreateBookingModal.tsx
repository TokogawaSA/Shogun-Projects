import React, { useState } from 'react';
import { Booking, BookingType, LocationType } from '../types';
import { X, Calendar } from 'lucide-react';

interface CreateBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingTypes: BookingType[];
  initialProjectId?: string;
  initialContactId?: string;
  initialAccountId?: string;
  onCreate: (payload: Partial<Booking>) => Promise<void>;
}

export const CreateBookingModal: React.FC<CreateBookingModalProps> = ({
  isOpen,
  onClose,
  bookingTypes,
  initialProjectId,
  initialContactId,
  initialAccountId,
  onCreate,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [selectedTypeId, setSelectedTypeId] = useState<string>(bookingTypes[0]?.id || '');
  const [date, setDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [time, setTime] = useState('10:00');
  const [duration, setDuration] = useState(30);
  const [locationType, setLocationType] = useState<LocationType>('google_meet');
  const [locationUrl, setLocationUrl] = useState('https://meet.google.com/shogun-session');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [projectId, setProjectId] = useState(initialProjectId || '');

  if (!isOpen) return null;

  const handleTypeChange = (typeId: string) => {
    setSelectedTypeId(typeId);
    const bType = bookingTypes.find((t) => t.id === typeId);
    if (bType) {
      setDuration(bType.durationMinutes);
      setLocationType(bType.locationType);
      if (bType.locationUrl) setLocationUrl(bType.locationUrl);
      if (!title || bookingTypes.some((t) => t.title === title)) {
        setTitle(bType.title);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName || !guestEmail || !date || !time) return;

    setSubmitting(true);
    try {
      const [h, m] = time.split(':').map(Number);
      const [year, month, day] = date.split('-').map(Number);
      const start = new Date(Date.UTC(year, month - 1, day, h, m));
      const end = new Date(start.getTime() + duration * 60 * 1000);

      await onCreate({
        title: title || `Meeting with ${guestName}`,
        bookingTypeId: selectedTypeId || null,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        durationMinutes: duration,
        locationType,
        locationUrl,
        guestName,
        guestEmail,
        guestPhone,
        guestNotes: notes,
        projectId: projectId || initialProjectId || null,
        contactId: initialContactId || null,
        accountId: initialAccountId || null,
        status: 'scheduled',
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Schedule New Meeting</h3>
              <p className="text-[11px] text-slate-400">Book session and link with CRM / Projects</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Booking Type Select */}
          {bookingTypes.length > 0 && (
            <div>
              <label className="block text-slate-400 font-medium mb-1">Meeting Service / Template</label>
              <select
                value={selectedTypeId}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                {bookingTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} ({t.durationMinutes} min)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Meeting Title */}
          <div>
            <label className="block text-slate-400 font-medium mb-1">Session Title</label>
            <input
              type="text"
              placeholder="e.g. Discovery Call, Milestone Walkthrough"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Date, Time & Duration */}
          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Time</label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full p-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Duration</label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full p-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value={15}>15 mins</option>
                <option value={30}>30 mins</option>
                <option value={45}>45 mins</option>
                <option value={60}>60 mins</option>
                <option value={90}>90 mins</option>
              </select>
            </div>
          </div>

          {/* Location / Meeting Type */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Location Format</label>
              <select
                value={locationType}
                onChange={(e) => setLocationType(e.target.value as LocationType)}
                className="w-full p-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="google_meet">Google Meet</option>
                <option value="zoom">Zoom</option>
                <option value="teams">Microsoft Teams</option>
                <option value="phone">Phone Call</option>
                <option value="in_person">In-Person Office</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1">Meeting Link or Location</label>
              <input
                type="text"
                placeholder="https://..."
                value={locationUrl}
                onChange={(e) => setLocationUrl(e.target.value)}
                className="w-full p-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Guest Information */}
          <div className="pt-2 border-t border-slate-800/80 space-y-2.5">
            <h4 className="text-[11px] font-mono uppercase text-slate-400 font-semibold">Attendee Details</h4>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Guest Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Henderson"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full p-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1">Guest Email *</label>
                <input
                  type="email"
                  required
                  placeholder="alex@company.com"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className="w-full p-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Phone Number (optional)</label>
              <input
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                className="w-full p-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {!initialProjectId && (
              <div>
                <label className="block text-slate-400 font-medium mb-1">Link to Project ID (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. prj-1"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full p-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            )}

            <div>
              <label className="block text-slate-400 font-medium mb-1">Notes / Agenda</label>
              <textarea
                placeholder="Topics to cover, client objectives..."
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              {submitting ? 'Scheduling...' : 'Schedule Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
