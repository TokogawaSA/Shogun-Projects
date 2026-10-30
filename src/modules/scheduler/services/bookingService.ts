/**
 * Scheduler & Booking Client Service
 * 
 * Communicates with backend REST API at /api/bookings and /api/public/bookings,
 * with resilient offline-first fallback to local state.
 */

import { apiClient } from '../../../services/api';
import {
  Booking,
  BookingType,
  UserAvailability,
  TimeSlot,
  BookingFilters,
  WeeklySchedule,
} from '../types';

const STORAGE_KEY_BOOKINGS = 'shogun_scheduler_bookings';
const STORAGE_KEY_BOOKING_TYPES = 'shogun_scheduler_booking_types';
const STORAGE_KEY_AVAILABILITY = 'shogun_scheduler_availability';

export const DEFAULT_WEEKLY_SCHEDULE: WeeklySchedule = {
  monday: [{ start: '09:00', end: '17:00' }],
  tuesday: [{ start: '09:00', end: '17:00' }],
  wednesday: [{ start: '09:00', end: '17:00' }],
  thursday: [{ start: '09:00', end: '17:00' }],
  friday: [{ start: '09:00', end: '17:00' }],
  saturday: [],
  sunday: [],
};

export const INITIAL_BOOKING_TYPES: BookingType[] = [
  {
    id: 'bt-1',
    tenantId: 'tenant-default',
    userId: 'user-default',
    title: '30-min Project Status Check-in',
    slug: 'project-status-30',
    description: 'Quick bi-weekly status review on project milestones, task blockers, and delivery pacing.',
    durationMinutes: 30,
    locationType: 'google_meet',
    locationUrl: 'https://meet.google.com/shogun-demo',
    bufferBeforeMin: 0,
    bufferAfterMin: 10,
    color: '#6366f1',
    isActive: true,
  },
  {
    id: 'bt-2',
    tenantId: 'tenant-default',
    userId: 'user-default',
    title: '60-min Architecture & Scope Review',
    slug: 'architecture-scope-60',
    description: 'In-depth engineering walkthrough, WBS validation, and technical architecture sign-off.',
    durationMinutes: 60,
    locationType: 'zoom',
    locationUrl: 'https://zoom.us/j/shogun-arch-review',
    bufferBeforeMin: 5,
    bufferAfterMin: 15,
    color: '#06b6d4',
    isActive: true,
  },
  {
    id: 'bt-3',
    tenantId: 'tenant-default',
    userId: 'user-default',
    title: '45-min Commercial Discovery Call',
    slug: 'commercial-discovery-45',
    description: 'Consultation to evaluate client requirements, budget fit, and high-level milestones.',
    durationMinutes: 45,
    locationType: 'phone',
    locationUrl: '+1 (555) 234-5678',
    bufferBeforeMin: 0,
    bufferAfterMin: 10,
    color: '#10b981',
    isActive: true,
  },
];

class BookingService {
  private getLocalBookings(): Booking[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_BOOKINGS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Could not read bookings from local storage', e);
    }

    // Seed mock bookings if empty
    const now = new Date();
    const seed: Booking[] = [
      {
        id: 'b-101',
        tenantId: 'tenant-default',
        bookingTypeId: 'bt-1',
        hostUserId: 'user-default',
        title: 'Project Status Check-in with Sarah Jenkins',
        description: 'Reviewing SD-101 deliverable progress and structural calculations.',
        startTime: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(now.getTime() + 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
        durationMinutes: 30,
        status: 'confirmed',
        locationType: 'google_meet',
        locationUrl: 'https://meet.google.com/shogun-demo',
        guestName: 'Sarah Jenkins',
        guestEmail: 's.jenkins@apexrealestate.com',
        guestPhone: '+1 555-0199',
        projectId: 'prj-1',
        contactId: 'cnt-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        bookingType: INITIAL_BOOKING_TYPES[0],
        project: { id: 'prj-1', title: 'Apex Tower Modernization', code: 'PRJ-001' },
        contact: { id: 'cnt-1', firstName: 'Sarah', lastName: 'Jenkins', email: 's.jenkins@apexrealestate.com' },
        hostUser: { id: 'user-default', displayName: 'Lead Architect', email: 'architect@shogunate.dev' },
      },
      {
        id: 'b-102',
        tenantId: 'tenant-default',
        bookingTypeId: 'bt-2',
        hostUserId: 'user-default',
        title: 'Architecture Review with David Miller',
        description: 'Reviewing MEP coordination and seismic engineering reports.',
        startTime: new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(now.getTime() + 48 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
        durationMinutes: 60,
        status: 'scheduled',
        locationType: 'zoom',
        locationUrl: 'https://zoom.us/j/shogun-arch-review',
        guestName: 'David Miller',
        guestEmail: 'dmiller@pacificventures.io',
        guestPhone: '+1 555-0245',
        projectId: 'prj-2',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        bookingType: INITIAL_BOOKING_TYPES[1],
        project: { id: 'prj-2', title: 'Pacific Horizon Master Plan', code: 'PRJ-002' },
        hostUser: { id: 'user-default', displayName: 'Lead Architect', email: 'architect@shogunate.dev' },
      },
    ];

    try {
      localStorage.setItem(STORAGE_KEY_BOOKINGS, JSON.stringify(seed));
    } catch {}
    return seed;
  }

  private saveLocalBookings(bookings: Booking[]) {
    try {
      localStorage.setItem(STORAGE_KEY_BOOKINGS, JSON.stringify(bookings));
    } catch (e) {
      console.warn('Could not save bookings to local storage', e);
    }
  }

  // ==========================================
  // Bookings CRUD
  // ==========================================

  async getBookings(filters?: BookingFilters): Promise<Booking[]> {
    try {
      const data = await apiClient.get<Booking[]>('/api/bookings', { params: filters });
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch (err) {
      console.warn('[BookingService] Backend /api/bookings unavailable, using local store:', err);
    }

    let items = this.getLocalBookings();

    if (filters?.hostUserId) {
      items = items.filter((b) => b.hostUserId === filters.hostUserId);
    }
    if (filters?.projectId) {
      items = items.filter((b) => b.projectId === filters.projectId);
    }
    if (filters?.contactId) {
      items = items.filter((b) => b.contactId === filters.contactId);
    }
    if (filters?.accountId) {
      items = items.filter((b) => b.accountId === filters.accountId);
    }
    if (filters?.status && filters.status !== 'all') {
      items = items.filter((b) => b.status === filters.status);
    }
    if (filters?.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      items = items.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.guestName.toLowerCase().includes(q) ||
          b.guestEmail.toLowerCase().includes(q)
      );
    }

    return items;
  }

  async getBooking(id: string): Promise<Booking> {
    try {
      const data = await apiClient.get<Booking>(`/api/bookings/${id}`);
      if (data) return data;
    } catch {}

    const match = this.getLocalBookings().find((b) => b.id === id);
    if (!match) throw new Error('Booking not found');
    return match;
  }

  async createBooking(payload: Partial<Booking>): Promise<Booking> {
    try {
      const data = await apiClient.post<Booking>('/api/bookings', payload);
      if (data) {
        const local = this.getLocalBookings();
        this.saveLocalBookings([data, ...local]);
        return data;
      }
    } catch (err) {
      console.warn('[BookingService] createBooking backend error, saving locally:', err);
    }

    const newBooking: Booking = {
      id: `b-${Date.now()}`,
      tenantId: payload.tenantId || 'tenant-default',
      bookingTypeId: payload.bookingTypeId || null,
      hostUserId: payload.hostUserId || 'user-default',
      title: payload.title || 'Scheduled Meeting',
      description: payload.description || '',
      startTime: payload.startTime || new Date().toISOString(),
      endTime: payload.endTime || new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      durationMinutes: payload.durationMinutes || 30,
      status: payload.status || 'scheduled',
      locationType: payload.locationType || 'google_meet',
      locationUrl: payload.locationUrl || 'https://meet.google.com/shogun-demo',
      guestName: payload.guestName || 'Guest Attendee',
      guestEmail: payload.guestEmail || '',
      guestPhone: payload.guestPhone || '',
      guestNotes: payload.guestNotes || '',
      projectId: payload.projectId || null,
      contactId: payload.contactId || null,
      accountId: payload.accountId || null,
      dealId: payload.dealId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const current = this.getLocalBookings();
    this.saveLocalBookings([newBooking, ...current]);
    return newBooking;
  }

  async updateBooking(id: string, updates: Partial<Booking>): Promise<Booking> {
    try {
      const data = await apiClient.patch<Booking>(`/api/bookings/${id}`, updates);
      if (data) {
        const current = this.getLocalBookings();
        this.saveLocalBookings(current.map((b) => (b.id === id ? { ...b, ...data } : b)));
        return data;
      }
    } catch (err) {
      console.warn('[BookingService] updateBooking backend error, updating locally:', err);
    }

    const current = this.getLocalBookings();
    const updated = current.map((b) => (b.id === id ? { ...b, ...updates, updatedAt: new Date().toISOString() } : b));
    this.saveLocalBookings(updated);
    const result = updated.find((b) => b.id === id);
    if (!result) throw new Error('Booking not found');
    return result;
  }

  async deleteBooking(id: string): Promise<void> {
    try {
      await apiClient.delete(`/api/bookings/${id}`);
    } catch {}

    const current = this.getLocalBookings();
    this.saveLocalBookings(current.filter((b) => b.id !== id));
  }

  // ==========================================
  // Booking Types
  // ==========================================

  async getBookingTypes(userId?: string): Promise<BookingType[]> {
    try {
      const data = await apiClient.get<BookingType[]>('/api/bookings/types', {
        params: userId ? { userId } : undefined,
      });
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch {}

    try {
      const local = localStorage.getItem(STORAGE_KEY_BOOKING_TYPES);
      if (local) return JSON.parse(local);
    } catch {}

    return INITIAL_BOOKING_TYPES;
  }

  async createBookingType(payload: Partial<BookingType>): Promise<BookingType> {
    try {
      const data = await apiClient.post<BookingType>('/api/bookings/types', payload);
      if (data) return data;
    } catch {}

    const newType: BookingType = {
      id: `bt-${Date.now()}`,
      tenantId: payload.tenantId || 'tenant-default',
      userId: payload.userId || 'user-default',
      title: payload.title || 'New Meeting Type',
      slug: payload.slug || `meeting-${Date.now()}`,
      description: payload.description || '',
      durationMinutes: payload.durationMinutes || 30,
      locationType: payload.locationType || 'google_meet',
      locationUrl: payload.locationUrl || '',
      bufferBeforeMin: payload.bufferBeforeMin || 0,
      bufferAfterMin: payload.bufferAfterMin || 10,
      color: payload.color || '#6366f1',
      isActive: payload.isActive ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const types = await this.getBookingTypes();
    const updated = [newType, ...types];
    try {
      localStorage.setItem(STORAGE_KEY_BOOKING_TYPES, JSON.stringify(updated));
    } catch {}
    return newType;
  }

  async updateBookingType(id: string, updates: Partial<BookingType>): Promise<BookingType> {
    try {
      const data = await apiClient.patch<BookingType>(`/api/bookings/types/${id}`, updates);
      if (data) return data;
    } catch {}

    const types = await this.getBookingTypes();
    const updated = types.map((t) => (t.id === id ? { ...t, ...updates } : t));
    try {
      localStorage.setItem(STORAGE_KEY_BOOKING_TYPES, JSON.stringify(updated));
    } catch {}
    return updated.find((t) => t.id === id)!;
  }

  async deleteBookingType(id: string): Promise<void> {
    try {
      await apiClient.delete(`/api/bookings/types/${id}`);
    } catch {}

    const types = await this.getBookingTypes();
    const filtered = types.filter((t) => t.id !== id);
    try {
      localStorage.setItem(STORAGE_KEY_BOOKING_TYPES, JSON.stringify(filtered));
    } catch {}
  }

  // ==========================================
  // Availability
  // ==========================================

  async getAvailability(userId?: string): Promise<UserAvailability> {
    try {
      const data = await apiClient.get<UserAvailability>('/api/bookings/availability', {
        params: userId ? { userId } : undefined,
      });
      if (data) return data;
    } catch {}

    try {
      const local = localStorage.getItem(STORAGE_KEY_AVAILABILITY);
      if (local) return JSON.parse(local);
    } catch {}

    return {
      id: 'default',
      tenantId: 'tenant-default',
      userId: userId || 'user-default',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      weeklySchedule: DEFAULT_WEEKLY_SCHEDULE,
      slotStepMin: 30,
    };
  }

  async updateAvailability(payload: Partial<UserAvailability>): Promise<UserAvailability> {
    try {
      const data = await apiClient.put<UserAvailability>('/api/bookings/availability', payload);
      if (data) return data;
    } catch {}

    const updated: UserAvailability = {
      id: payload.id || 'avail-default',
      tenantId: payload.tenantId || 'tenant-default',
      userId: payload.userId || 'user-default',
      timeZone: payload.timeZone || 'UTC',
      weeklySchedule: payload.weeklySchedule || DEFAULT_WEEKLY_SCHEDULE,
      slotStepMin: payload.slotStepMin || 30,
    };

    try {
      localStorage.setItem(STORAGE_KEY_AVAILABILITY, JSON.stringify(updated));
    } catch {}
    return updated;
  }

  // ==========================================
  // Public Client Booking APIs
  // ==========================================

  async getPublicBookingTypeMeta(hostId: string, slug: string): Promise<{ host: any; bookingType: BookingType }> {
    try {
      const data = await apiClient.get(`/api/public/bookings/host/${hostId}/type/${slug}`);
      if (data) return data;
    } catch {}

    const matchType = INITIAL_BOOKING_TYPES.find((t) => t.slug === slug) || INITIAL_BOOKING_TYPES[0];
    return {
      host: {
        id: hostId,
        displayName: 'Shogun Team Specialist',
        photoURL: null,
      },
      bookingType: matchType,
    };
  }

  async getPublicSlots(hostUserId: string, date: string, bookingTypeId?: string): Promise<TimeSlot[]> {
    try {
      const data = await apiClient.get<TimeSlot[]>('/api/public/bookings/slots', {
        params: { hostUserId, date, bookingTypeId },
      });
      if (Array.isArray(data)) return data;
    } catch {}

    // Fallback slot generator for client preview
    const [year, month, day] = date.split('-').map(Number);
    const slots: TimeSlot[] = [];
    const hours = [9, 10, 11, 13, 14, 15, 16];

    for (const h of hours) {
      const start = new Date(Date.UTC(year, month - 1, day, h, 0, 0));
      const end = new Date(Date.UTC(year, month - 1, day, h, 30, 0));
      slots.push({
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        durationMinutes: 30,
      });
    }

    return slots;
  }

  async schedulePublicBooking(payload: any): Promise<{ success: boolean; booking: Booking }> {
    try {
      const data = await apiClient.post<any>('/api/public/bookings/schedule', payload);
      if (data?.booking) return data;
    } catch {}

    const localBooking = await this.createBooking({
      ...payload,
      title: `Meeting with ${payload.guestName}`,
    });

    return { success: true, booking: localBooking };
  }
}

export const bookingService = new BookingService();
