/**
 * Scheduler & Booking Module Type Definitions
 */

export type BookingStatus =
  | 'scheduled'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'rescheduled'
  | 'no_show';

export type LocationType =
  | 'google_meet'
  | 'zoom'
  | 'teams'
  | 'phone'
  | 'in_person';

export interface BookingType {
  id: string;
  tenantId: string;
  userId: string;
  title: string;
  slug: string;
  description?: string | null;
  durationMinutes: number;
  locationType: LocationType;
  locationUrl?: string | null;
  bufferBeforeMin: number;
  bufferAfterMin: number;
  color: string;
  isActive: boolean;
  customQuestions?: Array<{
    id: string;
    label: string;
    type: 'text' | 'textarea' | 'select' | 'checkbox';
    required: boolean;
    options?: string[];
  }> | null;
  createdAt?: string;
  updatedAt?: string;
  user?: {
    id: string;
    displayName: string;
    email: string;
  };
  _count?: {
    bookings: number;
  };
}

export interface DayWindow {
  start: string; // "HH:MM" e.g. "09:00"
  end: string;   // "HH:MM" e.g. "17:00"
}

export type WeeklySchedule = Record<string, DayWindow[]>;

export interface UserAvailability {
  id: string;
  tenantId: string;
  userId: string;
  timeZone: string;
  weeklySchedule: WeeklySchedule;
  slotStepMin: number;
}

export interface TimeSlot {
  startTime: string; // ISO String
  endTime: string;   // ISO String
  durationMinutes: number;
}

export interface Booking {
  id: string;
  tenantId: string;
  bookingTypeId?: string | null;
  hostUserId: string;
  title: string;
  description?: string | null;
  startTime: string; // ISO String
  endTime: string;   // ISO String
  durationMinutes: number;
  status: BookingStatus;
  locationType: LocationType;
  locationUrl?: string | null;

  // Guest Details
  guestName: string;
  guestEmail: string;
  guestPhone?: string | null;
  guestNotes?: string | null;
  customAnswers?: Record<string, any> | null;

  // Linked CRM & Project Entities
  projectId?: string | null;
  accountId?: string | null;
  contactId?: string | null;
  dealId?: string | null;

  cancellationReason?: string | null;
  rescheduledFromId?: string | null;

  createdAt: string;
  updatedAt: string;

  // Joined Associations
  bookingType?: BookingType | null;
  hostUser?: {
    id: string;
    displayName: string;
    email: string;
    photoURL?: string | null;
  };
  project?: {
    id: string;
    title: string;
    code?: string | null;
  } | null;
  contact?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
  } | null;
  account?: {
    id: string;
    accountName: string;
    domain?: string | null;
  } | null;
  deal?: {
    id: string;
    dealName: string;
    amount?: number | null;
  } | null;
}

export interface BookingFilters {
  hostUserId?: string;
  projectId?: string;
  contactId?: string;
  accountId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  searchQuery?: string;
}
