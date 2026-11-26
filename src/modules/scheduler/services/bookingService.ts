/**
 * Scheduler & Booking Client Service
 *
 * Communicates directly with backend REST API at /api/bookings and /api/public/bookings.
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

export const DEFAULT_WEEKLY_SCHEDULE: WeeklySchedule = {
  monday: [{ start: '09:00', end: '17:00' }],
  tuesday: [{ start: '09:00', end: '17:00' }],
  wednesday: [{ start: '09:00', end: '17:00' }],
  thursday: [{ start: '09:00', end: '17:00' }],
  friday: [{ start: '09:00', end: '17:00' }],
  saturday: [],
  sunday: [],
};

class BookingService {
  // ==========================================
  // Bookings CRUD
  // ==========================================

  async getBookings(filters?: BookingFilters): Promise<Booking[]> {
    try {
      const data = await apiClient.get<Booking[]>('/api/bookings', { params: filters });
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error('[BookingService] Failed to fetch bookings:', err);
      return [];
    }
  }

  async getBooking(id: string): Promise<Booking> {
    return await apiClient.get<Booking>(`/api/bookings/${id}`);
  }

  async createBooking(payload: Partial<Booking>): Promise<Booking> {
    return await apiClient.post<Booking>('/api/bookings', payload);
  }

  async updateBooking(id: string, updates: Partial<Booking>): Promise<Booking> {
    return await apiClient.patch<Booking>(`/api/bookings/${id}`, updates);
  }

  async deleteBooking(id: string): Promise<void> {
    await apiClient.delete(`/api/bookings/${id}`);
  }

  // ==========================================
  // Booking Types
  // ==========================================

  async getBookingTypes(userId?: string): Promise<BookingType[]> {
    try {
      const data = await apiClient.get<BookingType[]>('/api/bookings/types', {
        params: userId ? { userId } : undefined,
      });
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error('[BookingService] Failed to fetch booking types:', err);
      return [];
    }
  }

  async createBookingType(payload: Partial<BookingType>): Promise<BookingType> {
    return await apiClient.post<BookingType>('/api/bookings/types', payload);
  }

  async updateBookingType(id: string, updates: Partial<BookingType>): Promise<BookingType> {
    return await apiClient.patch<BookingType>(`/api/bookings/types/${id}`, updates);
  }

  async deleteBookingType(id: string): Promise<void> {
    await apiClient.delete(`/api/bookings/types/${id}`);
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
    } catch (err) {
      console.error('[BookingService] Failed to fetch availability:', err);
    }

    return {
      id: '',
      tenantId: '',
      userId: userId || '',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      weeklySchedule: DEFAULT_WEEKLY_SCHEDULE,
      slotStepMin: 30,
    };
  }

  async updateAvailability(payload: Partial<UserAvailability>): Promise<UserAvailability> {
    return await apiClient.put<UserAvailability>('/api/bookings/availability', payload);
  }

  // ==========================================
  // Public Client Booking APIs
  // ==========================================

  async getPublicBookingTypeMeta(hostId: string, slug: string): Promise<{ host: any; bookingType: BookingType }> {
    return await apiClient.get(`/api/public/bookings/host/${hostId}/type/${slug}`);
  }

  async getPublicSlots(hostUserId: string, date: string, bookingTypeId?: string): Promise<TimeSlot[]> {
    try {
      const data = await apiClient.get<TimeSlot[]>('/api/public/bookings/slots', {
        params: { hostUserId, date, bookingTypeId },
      });
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error('[BookingService] Failed to fetch public slots:', err);
      return [];
    }
  }

  async schedulePublicBooking(payload: any): Promise<{ success: boolean; booking: Booking }> {
    return await apiClient.post<{ success: boolean; booking: Booking }>(
      '/api/public/bookings/schedule',
      payload
    );
  }
}

export const bookingService = new BookingService();
