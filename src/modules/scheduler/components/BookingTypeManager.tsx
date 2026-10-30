import React, { useState } from 'react';
import { BookingType, LocationType } from '../types';
import {
  Plus,
  Copy,
  Check,
  Clock,
  Video,
  Phone,
  MapPin,
  ExternalLink,
  Edit2,
  Trash2,
} from 'lucide-react';
import clsx from 'clsx';

interface BookingTypeManagerProps {
  bookingTypes: BookingType[];
  hostUserId: string;
  onCreateType: (payload: Partial<BookingType>) => Promise<void>;
  onUpdateType: (id: string, updates: Partial<BookingType>) => Promise<void>;
  onDeleteType: (id: string) => Promise<void>;
}

export const BookingTypeManager: React.FC<BookingTypeManagerProps> = ({
  bookingTypes,
  hostUserId,
  onCreateType,
  onUpdateType,
  onDeleteType,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<BookingType | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(30);
  const [locationType, setLocationType] = useState<LocationType>('google_meet');
  const [locationUrl, setLocationUrl] = useState('');
  const [bufferBefore, setBufferBefore] = useState(0);
  const [bufferAfter, setBufferAfter] = useState(10);
  const [color, setColor] = useState('#6366f1');

  const openCreate = () => {
    setEditingType(null);
    setTitle('');
    setSlug('');
    setDescription('');
    setDuration(30);
    setLocationType('google_meet');
    setLocationUrl('https://meet.google.com/new');
    setBufferBefore(0);
    setBufferAfter(10);
    setColor('#6366f1');
    setIsModalOpen(true);
  };

  const openEdit = (bt: BookingType) => {
    setEditingType(bt);
    setTitle(bt.title);
    setSlug(bt.slug);
    setDescription(bt.description || '');
    setDuration(bt.durationMinutes);
    setLocationType(bt.locationType);
    setLocationUrl(bt.locationUrl || '');
    setBufferBefore(bt.bufferBeforeMin);
    setBufferAfter(bt.bufferAfterMin);
    setColor(bt.color || '#6366f1');
    setIsModalOpen(true);
  };

  const handleCopyLink = (slugValue: string, id: string) => {
    const origin = window.location.origin;
    const url = `${origin}/book/${hostUserId || 'default'}/${slugValue}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    const payload: Partial<BookingType> = {
      title,
      slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description,
      durationMinutes: duration,
      locationType,
      locationUrl,
      bufferBeforeMin: bufferBefore,
      bufferAfterMin: bufferAfter,
      color,
      isActive: true,
    };

    if (editingType) {
      await onUpdateType(editingType.id, payload);
    } else {
      await onCreateType(payload);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl backdrop-blur-xl shadow-lg">
        <div>
          <h3 className="text-sm font-bold text-slate-100">Booking Types & Services</h3>
          <p className="text-xs text-slate-400">
            Define meeting services with custom durations, buffers, and public booking URLs
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Meeting Type</span>
        </button>
      </div>

      {/* Grid of Booking Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {bookingTypes.map((bt) => {
          const publicUrl = `/book/${hostUserId || 'default'}/${bt.slug}`;
          return (
            <div
              key={bt.id}
              className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl hover:border-slate-700 transition-all flex flex-col justify-between group relative overflow-hidden"
            >
              {/* Top Accent Strip */}
              <div
                className="absolute top-0 left-0 right-0 h-1.5"
                style={{ backgroundColor: bt.color || '#6366f1' }}
              />

              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2 pt-1">
                  <h4 className="text-sm font-bold text-slate-100 group-hover:text-indigo-300 transition-colors">
                    {bt.title}
                  </h4>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(bt)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                      title="Edit type"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteType(bt.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete type"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 min-h-[32px]">
                  {bt.description || 'No description provided.'}
                </p>

                {/* Specs Pill List */}
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-400">
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/60">
                    <Clock className="w-3 h-3 text-indigo-400" />
                    <span>{bt.durationMinutes}m</span>
                  </span>
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/60 capitalize">
                    {bt.locationType === 'phone' ? (
                      <Phone className="w-3 h-3 text-emerald-400" />
                    ) : bt.locationType === 'in_person' ? (
                      <MapPin className="w-3 h-3 text-rose-400" />
                    ) : (
                      <Video className="w-3 h-3 text-indigo-400" />
                    )}
                    <span>{bt.locationType.replace('_', ' ')}</span>
                  </span>
                  {bt.bufferAfterMin > 0 && (
                    <span className="px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/60">
                      +{bt.bufferAfterMin}m buffer
                    </span>
                  )}
                </div>
              </div>

              {/* Footer: Copy Link & Preview */}
              <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleCopyLink(bt.slug, bt.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                >
                  {copiedId === bt.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-semibold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copy Booking Link</span>
                    </>
                  )}
                </button>

                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Open public booking page"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-100">
              {editingType ? 'Edit Meeting Type' : 'Create New Meeting Type'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 30-min Project Status Check-in"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">URL Slug</label>
                  <input
                    type="text"
                    placeholder="e.g. project-status-30"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Duration (minutes)</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>60 minutes</option>
                    <option value={90}>90 minutes</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Description</label>
                <textarea
                  placeholder="Briefly explain what clients or colleagues can expect from this session..."
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Location Format</label>
                  <select
                    value={locationType}
                    onChange={(e) => setLocationType(e.target.value as LocationType)}
                    className="w-full p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="google_meet">Google Meet</option>
                    <option value="zoom">Zoom</option>
                    <option value="teams">Microsoft Teams</option>
                    <option value="phone">Phone Call</option>
                    <option value="in_person">In-Person Office</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Buffer After (min)</label>
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={bufferAfter}
                    onChange={(e) => setBufferAfter(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Accent Color</label>
                <div className="flex items-center gap-2">
                  {['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={clsx(
                        'w-7 h-7 rounded-lg transition-transform',
                        color === c && 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110'
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md shadow-indigo-600/30"
                >
                  Save Meeting Type
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
