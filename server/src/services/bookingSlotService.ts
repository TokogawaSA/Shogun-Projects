/**
 * Booking Slot Calculation Engine
 * 
 * Computes available booking slots for a host based on:
 * - Weekly working hours / availability config
 * - Booking type duration and buffer times
 * - Existing confirmed/scheduled bookings
 * - Current timestamp (past slots excluded)
 */

import { prisma } from '../config/db.js';

export interface TimeSlot {
  startTime: string; // ISO string
  endTime: string;   // ISO string
  durationMinutes: number;
}

export interface DayWindow {
  start: string; // "HH:MM" e.g. "09:00"
  end: string;   // "HH:MM" e.g. "17:00"
}

export type WeeklySchedule = Record<string, DayWindow[]>;

export const DEFAULT_WEEKLY_SCHEDULE: WeeklySchedule = {
  monday: [{ start: '09:00', end: '17:00' }],
  tuesday: [{ start: '09:00', end: '17:00' }],
  wednesday: [{ start: '09:00', end: '17:00' }],
  thursday: [{ start: '09:00', end: '17:00' }],
  friday: [{ start: '09:00', end: '17:00' }],
  saturday: [],
  sunday: [],
};

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/**
 * Calculates available slots for a host on a specific date (YYYY-MM-DD)
 */
export async function getAvailableSlots(params: {
  tenantId: string;
  hostUserId: string;
  targetDate: string; // YYYY-MM-DD
  bookingTypeId?: string;
  customDurationMin?: number;
  customBufferMin?: number;
}): Promise<TimeSlot[]> {
  const { tenantId, hostUserId, targetDate, bookingTypeId, customDurationMin, customBufferMin } = params;

  // 1. Fetch Booking Type details
  let durationMinutes = customDurationMin || 30;
  let bufferBeforeMin = 0;
  let bufferAfterMin = customBufferMin !== undefined ? customBufferMin : 10;

  if (bookingTypeId) {
    const bType = await prisma.bookingType.findFirst({
      where: { id: bookingTypeId, tenantId, isActive: true },
    });
    if (bType) {
      durationMinutes = bType.durationMinutes;
      bufferBeforeMin = bType.bufferBeforeMin;
      bufferAfterMin = bType.bufferAfterMin;
    }
  }

  // 2. Fetch Host Availability
  const userAvail = await prisma.userAvailability.findUnique({
    where: { userId: hostUserId },
  });

  const weeklySchedule: WeeklySchedule = (userAvail?.weeklySchedule as unknown as WeeklySchedule) || DEFAULT_WEEKLY_SCHEDULE;
  const slotStepMin = userAvail?.slotStepMin || durationMinutes;

  // Parse target date (local date components)
  const [yearStr, monthStr, dayStr] = targetDate.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1; // 0-indexed
  const day = parseInt(dayStr, 10);

  const targetDateObj = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
  const dayOfWeekName = DAY_NAMES[targetDateObj.getUTCDay()];
  const windowsForDay: DayWindow[] = weeklySchedule[dayOfWeekName] || [];

  if (!windowsForDay || windowsForDay.length === 0) {
    return [];
  }

  // 3. Fetch Existing Bookings on targetDate
  const startOfDay = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
  const endOfDay = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));

  const existingBookings = await prisma.booking.findMany({
    where: {
      tenantId,
      hostUserId,
      status: { notIn: ['cancelled', 'rescheduled'] },
      startTime: { lt: endOfDay },
      endTime: { gt: startOfDay },
    },
    select: {
      startTime: true,
      endTime: true,
    },
  });

  const now = new Date();
  const availableSlots: TimeSlot[] = [];

  // 4. Iterate Windows and Generate Slots
  for (const win of windowsForDay) {
    const [startH, startM] = win.start.split(':').map(Number);
    const [endH, endM] = win.end.split(':').map(Number);

    let currentSlotStart = new Date(Date.UTC(year, month, day, startH, startM, 0, 0));
    const windowEnd = new Date(Date.UTC(year, month, day, endH, endM, 0, 0));

    while (true) {
      const currentSlotEnd = new Date(currentSlotStart.getTime() + durationMinutes * 60 * 1000);
      if (currentSlotEnd > windowEnd) {
        break;
      }

      // Buffer-inclusive collision check with existing bookings
      // Host is busy during [b.startTime - bufferBeforeMin, b.endTime + bufferAfterMin]
      const hasCollision = existingBookings.some((b) => {
        const blockedStart = new Date(b.startTime).getTime() - bufferBeforeMin * 60 * 1000;
        const blockedEnd = new Date(b.endTime).getTime() + bufferAfterMin * 60 * 1000;
        return currentSlotStart.getTime() < blockedEnd && currentSlotEnd.getTime() > blockedStart;
      });

      // Past check: slot must be in the future (at least 15 min buffer from right now)
      const isFuture = currentSlotStart.getTime() > (now.getTime() + 15 * 60 * 1000);

      if (isFuture && !hasCollision) {
        availableSlots.push({
          startTime: currentSlotStart.toISOString(),
          endTime: currentSlotEnd.toISOString(),
          durationMinutes,
        });
      }

      // Increment by slot step
      currentSlotStart = new Date(currentSlotStart.getTime() + slotStepMin * 60 * 1000);
    }
  }

  return availableSlots;
}
