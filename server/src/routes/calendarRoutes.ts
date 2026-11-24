import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireTenantAdmin } from '../middleware/auth.js';
import { withTenantTx } from '../utils/tenantTx.js';
import {
  GLOBAL_ZA_CALENDAR_ID,
  addTenantShutdownPeriod,
  getOrCreateTenantWorkingCalendar,
  parseUtcDate,
  resolveWorkingCalendar,
  toIsoDateString,
} from '../services/saCalendarService.js';
import {
  addWorkingDays,
  calculateAvailableTeamCapacity,
  countWorkingDays,
} from '../services/schedulingEngine.js';

export const calendarRouter = Router();

const updateCalendarSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  workDays: z.array(z.number().int().min(0).max(7)).min(1).max(7).optional(),
  dailyWorkHours: z.number().min(1).max(24).optional(),
});

const addHolidaySchema = z.object({
  date: z.string().trim().min(8),
  name: z.string().trim().min(2).max(160),
  isAdHocDeclared: z.boolean().default(true),
});

const shutdownRangeSchema = z.object({
  startDate: z.string().trim().min(8),
  endDate: z.string().trim().min(8),
  name: z.string().trim().min(2).max(160).default("December Builder's Shutdown"),
});

const calculateScheduleSchema = z.object({
  startDate: z.string().trim().min(8),
  endDate: z.string().trim().optional(),
  durationDays: z.number().int().min(1).max(1000).optional(),
  calendarId: z.string().trim().optional(),
  weeklyCapacityHours: z.number().min(1).max(168).optional(),
});

/**
 * GET /api/v1/calendars?year=2026
 * Returns active working calendar + SA statutory, observed Monday (s2(1)), s2A,
 * and tenant custom shutdown holidays, along with annual working-day capacity stats.
 */
calendarRouter.get('/', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const year = Number(req.query.year) || new Date().getUTCFullYear();
    const clampedYear = Math.min(2100, Math.max(2000, year));

    const cal = await resolveWorkingCalendar({
      tenantId,
      calendarId: req.query.calendarId ? String(req.query.calendarId) : undefined,
      years: [clampedYear - 1, clampedYear, clampedYear + 1],
    });

    const yearPrefix = `${clampedYear}-`;
    const holidays = Array.from(cal.holidaysByDate.values())
      .filter((h) => h.dateIso.startsWith(yearPrefix))
      .sort((a, b) => a.dateIso.localeCompare(b.dateIso));

    const annualCapacity = await calculateAvailableTeamCapacity({
      startDate: `${clampedYear}-01-01`,
      endDate: `${clampedYear}-12-31`,
      calendarId: cal,
      tenantId,
    });

    res.json({
      success: true,
      year: clampedYear,
      calendar: {
        id: cal.id,
        tenantId: cal.tenantId,
        name: cal.name,
        countryCode: cal.countryCode,
        workDays: cal.workDays,
        dailyWorkHours: cal.dailyWorkHours,
        isDefault: cal.isDefault,
        isSharedGlobalBaseline: cal.id === GLOBAL_ZA_CALENDAR_ID,
      },
      stats: {
        workingDaysInYear: annualCapacity.workingDays,
        annualCapacityHours: annualCapacity.availableHoursPerMember,
        totalHolidays: holidays.length,
        observedMondaysCount: holidays.filter((h) => h.isObservedMonday).length,
        adHocAndShutdownCount: holidays.filter(
          (h) => h.isAdHocDeclared || h.isCustomTenantHoliday
        ).length,
      },
      holidays,
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to load South African working calendar.',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
  }
});

/**
 * PUT /api/v1/calendars/default
 * Tenant Admin: Configure workDays (e.g. Mon-Fri) & dailyWorkHours on tenant calendar.
 */
calendarRouter.put('/default', requireTenantAdmin, async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const parsed = updateCalendarSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid calendar payload.', issues: parsed.error.issues });
      return;
    }

    const updated = await getOrCreateTenantWorkingCalendar(tenantId, parsed.data);
    res.json({
      success: true,
      calendar: {
        id: updated.id,
        tenantId: updated.tenantId,
        name: updated.name,
        countryCode: updated.countryCode,
        workDays: updated.workDays,
        dailyWorkHours: Number(updated.dailyWorkHours),
        isDefault: updated.isDefault,
      },
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to update tenant working calendar.',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
  }
});

/**
 * POST /api/v1/calendars/holidays
 * Tenant Admin: Add a single ad-hoc or custom company holiday.
 */
calendarRouter.post('/holidays', requireTenantAdmin, async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const parsed = addHolidaySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid holiday payload.', issues: parsed.error.issues });
      return;
    }

    const dt = parseUtcDate(parsed.data.date);
    const tenantCal = await getOrCreateTenantWorkingCalendar(tenantId);

    const holiday = await withTenantTx(tenantId, async (tx) => {
      return tx.publicHoliday.upsert({
        where: {
          calendarId_date: {
            calendarId: tenantCal.id,
            date: dt,
          },
        },
        update: {
          name: parsed.data.name,
          isAdHocDeclared: parsed.data.isAdHocDeclared,
        },
        create: {
          calendarId: tenantCal.id,
          date: dt,
          name: parsed.data.name,
          isObservedMonday: false,
          isAdHocDeclared: parsed.data.isAdHocDeclared,
        },
      });
    });

    res.status(201).json({
      success: true,
      holiday: {
        id: holiday.id,
        calendarId: holiday.calendarId,
        dateIso: toIsoDateString(holiday.date),
        name: holiday.name,
        isObservedMonday: holiday.isObservedMonday,
        isAdHocDeclared: holiday.isAdHocDeclared,
        isCustomTenantHoliday: true,
      },
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to create custom public holiday.',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
  }
});

/**
 * POST /api/v1/calendars/shutdown
 * Tenant Admin: Add a December Builder's Shutdown or custom shutdown date range.
 */
calendarRouter.post('/shutdown', requireTenantAdmin, async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const parsed = shutdownRangeSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid shutdown period.', issues: parsed.error.issues });
      return;
    }

    const result = await addTenantShutdownPeriod({
      tenantId,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
      name: parsed.data.name,
    });

    res.status(201).json({
      success: true,
      ...result,
    });
  } catch (err: any) {
    res.status(400).json({
      error: err.message || 'Failed to add company shutdown period.',
    });
  }
});

/**
 * DELETE /api/v1/calendars/holidays/:holidayId
 * Tenant Admin: Delete a custom/shutdown holiday from the tenant's calendar.
 */
calendarRouter.delete(
  '/holidays/:holidayId',
  requireTenantAdmin,
  async (req: Request, res: Response) => {
    try {
      const tenantId = req.user!.tenantId;
      const { holidayId } = req.params;

      const deleted = await withTenantTx(tenantId, async (tx) => {
        const existing = await tx.publicHoliday.findFirst({
          where: { id: holidayId },
          include: { calendar: true },
        });

        if (!existing || existing.calendar.tenantId !== tenantId) {
          return null;
        }

        await tx.publicHoliday.delete({ where: { id: existing.id } });
        return existing;
      });

      if (!deleted) {
        res.status(404).json({
          error:
            'Custom tenant holiday not found (statutory South African baseline holidays cannot be deleted).',
        });
        return;
      }

      res.json({ success: true, deletedId: deleted.id });
    } catch (err: any) {
      res.status(500).json({
        error: 'Failed to delete custom holiday.',
        ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
      });
    }
  }
);

/**
 * POST /api/v1/calendars/calculate
 * Preview SA working-day finish dates, working-day counts, and team capacity.
 */
calendarRouter.post('/calculate', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const parsed = calculateScheduleSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid calculation input.', issues: parsed.error.issues });
      return;
    }

    const { startDate, endDate, durationDays, calendarId, weeklyCapacityHours } = parsed.data;

    const computedFinishDate = durationDays
      ? toIsoDateString(await addWorkingDays(startDate, durationDays, calendarId, { tenantId }))
      : endDate || startDate;

    const targetEnd = endDate || computedFinishDate;
    const workingDaysCount = await countWorkingDays(startDate, targetEnd, calendarId, {
      tenantId,
    });
    const capacity = await calculateAvailableTeamCapacity({
      startDate,
      endDate: targetEnd,
      calendarId,
      tenantId,
      baseWeeklyCapacityHours: weeklyCapacityHours,
    });

    res.json({
      success: true,
      startDate: toIsoDateString(startDate),
      finishDate: computedFinishDate,
      endDate: toIsoDateString(targetEnd),
      workingDays: workingDaysCount,
      availableHoursPerMember: capacity.availableHoursPerMember,
      holidaysSkipped: capacity.holidaysInPeriod,
    });
  } catch (err: any) {
    res.status(400).json({
      error: err.message || 'Failed to compute working-day schedule.',
    });
  }
});

export default calendarRouter;
