import { Prisma } from '@prisma/client';
import { prisma } from '../config/db.js';
import { withTenantTx } from '../utils/tenantTx.js';

export const GLOBAL_ZA_CALENDAR_ID = 'cal-za-global-sast';
export const DEFAULT_ZA_CALENDAR_NAME = 'South Africa Standard (SAST)';
export const DEFAULT_ZA_WORK_DAYS = [1, 2, 3, 4, 5]; // Mon=1 .. Fri=5
export const DEFAULT_DAILY_WORK_HOURS = 8.0;

/**
 * Presidentially declared ad-hoc South African public holidays under
 * Section 2A of the Public Holidays Act 36 of 1994.
 */
export const PRESIDENTIAL_ADHOC_ZA_HOLIDAYS: Record<string, string> = {
  '2023-12-15': 'Springbok Rugby World Cup Victory Holiday (s2A)',
  '2024-05-29': 'National and Provincial Elections (s2A)',
  '2026-11-04': 'Local Government Elections (s2A)',
};

export interface GeneratedSaHoliday {
  date: Date;
  dateIso: string; // YYYY-MM-DD
  name: string;
  isObservedMonday: boolean;
  isAdHocDeclared: boolean;
}

export interface ResolvedHolidayEntry {
  id?: string;
  calendarId?: string;
  dateIso: string; // YYYY-MM-DD
  name: string;
  isObservedMonday: boolean;
  isAdHocDeclared: boolean;
  isCustomTenantHoliday?: boolean;
}

export interface ResolvedWorkingCalendar {
  id: string;
  tenantId: string | null;
  name: string;
  countryCode: string;
  workDays: number[];
  dailyWorkHours: number;
  isDefault: boolean;
  holidaysByDate: Map<string, ResolvedHolidayEntry>;
}

const sastDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Africa/Johannesburg',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/**
 * Normalize a Date or ISO date string into canonical `YYYY-MM-DD`.
 * Preserves exact calendar dates for both UTC-midnight (`@db.Date` / `'YYYY-MM-DD'`)
 * and SAST (`Africa/Johannesburg`) timestamps.
 */
export function toIsoDateString(input: Date | string): string {
  if (typeof input === 'string') {
    const trimmed = input.trim();
    const directMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
    if (directMatch) {
      return `${directMatch[1]}-${directMatch[2]}-${directMatch[3]}`;
    }
    const isoPrefixMatch = /^(\d{4})-(\d{2})-(\d{2})T00:00:00(?:\.000)?Z$/i.exec(trimmed);
    if (isoPrefixMatch) {
      return `${isoPrefixMatch[1]}-${isoPrefixMatch[2]}-${isoPrefixMatch[3]}`;
    }
    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) {
      throw new Error(`Invalid date string: "${input}"`);
    }
    return toIsoDateString(parsed);
  }

  if (Number.isNaN(input.getTime())) {
    throw new Error('Invalid Date instance supplied to calendar engine.');
  }

  // Prisma @db.Date and `new Date('YYYY-MM-DD')` construct at 00:00:00.000Z
  if (
    input.getUTCHours() === 0 &&
    input.getUTCMinutes() === 0 &&
    input.getUTCSeconds() === 0 &&
    input.getUTCMilliseconds() === 0
  ) {
    const y = input.getUTCFullYear();
    const m = String(input.getUTCMonth() + 1).padStart(2, '0');
    const d = String(input.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // Otherwise resolve calendar date in Africa/Johannesburg (SAST, UTC+2)
  return sastDateFormatter.format(input);
}

/**
 * Parse a Date or `YYYY-MM-DD` string into canonical UTC midnight `Date`.
 */
export function parseUtcDate(input: Date | string): Date {
  const iso = toIsoDateString(input);
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/**
 * Add or subtract calendar days in pure UTC date arithmetic.
 */
export function addCalendarDaysUtc(date: Date, deltaDays: number): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + deltaDays)
  );
}

/**
 * Anonymous Gregorian algorithm (Meeus/Jones/Butcher) for Easter Sunday.
 * Deterministic for any Gregorian calendar year.
 */
export function computeGregorianEasterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3 = March, 4 = April
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Generate all South African public holidays for a given year under the
 * Public Holidays Act 36 of 1994:
 * - All 12 Schedule 1 statutory holidays (including Good Friday & Family Day)
 * - Section 2(1) Sunday-to-Monday observance without double-shifting when Monday
 *   is already a statutory holiday (e.g. 25 Dec Sunday -> 26 Dec Day of Goodwill)
 * - Section 2A pre-seeded presidentially declared holidays (e.g. 2026-11-04 Election Day)
 */
export function generateSouthAfricanPublicHolidays(
  year: number,
  options: { includePreSeededAdHoc?: boolean } = {}
): GeneratedSaHoliday[] {
  const { includePreSeededAdHoc = true } = options;

  const easterSunday = computeGregorianEasterSunday(year);
  const goodFriday = addCalendarDaysUtc(easterSunday, -2);
  const familyDay = addCalendarDaysUtc(easterSunday, 1);

  const makeFixed = (month1Based: number, day: number, name: string): GeneratedSaHoliday => {
    const dt = new Date(Date.UTC(year, month1Based - 1, day));
    return {
      date: dt,
      dateIso: toIsoDateString(dt),
      name,
      isObservedMonday: false,
      isAdHocDeclared: false,
    };
  };

  const statutory: GeneratedSaHoliday[] = [
    makeFixed(1, 1, "New Year's Day"),
    makeFixed(3, 21, 'Human Rights Day'),
    {
      date: goodFriday,
      dateIso: toIsoDateString(goodFriday),
      name: 'Good Friday',
      isObservedMonday: false,
      isAdHocDeclared: false,
    },
    {
      date: familyDay,
      dateIso: toIsoDateString(familyDay),
      name: 'Family Day',
      isObservedMonday: false,
      isAdHocDeclared: false,
    },
    makeFixed(4, 27, 'Freedom Day'),
    makeFixed(5, 1, "Workers' Day"),
    makeFixed(6, 16, 'Youth Day'),
    makeFixed(8, 9, "National Women's Day"),
    makeFixed(9, 24, 'Heritage Day'),
    makeFixed(12, 16, 'Day of Reconciliation'),
    makeFixed(12, 25, 'Christmas Day'),
    makeFixed(12, 26, 'Day of Goodwill'),
  ];

  // Handle rare calendar overlap (e.g. if Good Friday or Family Day ever coincides with a fixed holiday)
  const byDate = new Map<string, GeneratedSaHoliday>();
  for (const h of statutory) {
    const existing = byDate.get(h.dateIso);
    if (existing) {
      existing.name = `${existing.name} / ${h.name}`;
    } else {
      byDate.set(h.dateIso, { ...h });
    }
  }

  const statutoryDateSet = new Set<string>(byDate.keys());

  // Section 2(1): Whenever any statutory public holiday falls on a Sunday,
  // the following Monday shall be a public holiday (no double-shift if Monday is already statutory).
  for (const h of statutory) {
    if (h.date.getUTCDay() === 0) {
      const monday = addCalendarDaysUtc(h.date, 1);
      const mondayIso = toIsoDateString(monday);
      if (!statutoryDateSet.has(mondayIso) && !byDate.has(mondayIso)) {
        byDate.set(mondayIso, {
          date: monday,
          dateIso: mondayIso,
          name: `${h.name} (Observed)`,
          isObservedMonday: true,
          isAdHocDeclared: false,
        });
      }
    }
  }

  // Section 2A: Pre-seeded presidentially declared public holidays (e.g. 4 Nov 2026 Municipal Elections)
  if (includePreSeededAdHoc) {
    const yearPrefix = `${year}-`;
    for (const [iso, title] of Object.entries(PRESIDENTIAL_ADHOC_ZA_HOLIDAYS)) {
      if (iso.startsWith(yearPrefix) && !byDate.has(iso)) {
        byDate.set(iso, {
          date: parseUtcDate(iso),
          dateIso: iso,
          name: title,
          isObservedMonday: false,
          isAdHocDeclared: true,
        });
      }
    }
  }

  return Array.from(byDate.values()).sort((a, b) => a.dateIso.localeCompare(b.dateIso));
}

/**
 * Build an in-memory South African baseline calendar for fast deterministic evaluation
 * or when no custom database calendar ID is required.
 */
export function buildInMemoryZaCalendar(
  years: number[] = [2025, 2026, 2027, 2028, 2029, 2030]
): ResolvedWorkingCalendar {
  const holidaysByDate = new Map<string, ResolvedHolidayEntry>();
  for (const yr of years) {
    for (const h of generateSouthAfricanPublicHolidays(yr)) {
      holidaysByDate.set(h.dateIso, {
        calendarId: GLOBAL_ZA_CALENDAR_ID,
        dateIso: h.dateIso,
        name: h.name,
        isObservedMonday: h.isObservedMonday,
        isAdHocDeclared: h.isAdHocDeclared,
        isCustomTenantHoliday: false,
      });
    }
  }

  return {
    id: GLOBAL_ZA_CALENDAR_ID,
    tenantId: null,
    name: DEFAULT_ZA_CALENDAR_NAME,
    countryCode: 'ZA',
    workDays: [...DEFAULT_ZA_WORK_DAYS],
    dailyWorkHours: DEFAULT_DAILY_WORK_HOURS,
    isDefault: true,
    holidaysByDate,
  };
}

let seededGlobalYears = new Set<number>();

/**
 * Idempotently seed the shared global `'ZA'` baseline `WorkingCalendar` (`tenantId = null`)
 * and its statutory + s2(1) observed + s2A declared `PublicHoliday` records into PostgreSQL.
 */
export async function seedGlobalZaCalendar(
  years: number[] = [2025, 2026, 2027, 2028, 2029, 2030]
) {
  const missingYears = years.filter((y) => !seededGlobalYears.has(y));

  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.allow_global_calendar_seed', 'true', true)`;

    const calendar = await tx.workingCalendar.upsert({
      where: { id: GLOBAL_ZA_CALENDAR_ID },
      update: {
        name: DEFAULT_ZA_CALENDAR_NAME,
        countryCode: 'ZA',
        isDefault: true,
      },
      create: {
        id: GLOBAL_ZA_CALENDAR_ID,
        tenantId: null,
        name: DEFAULT_ZA_CALENDAR_NAME,
        countryCode: 'ZA',
        workDays: DEFAULT_ZA_WORK_DAYS,
        dailyWorkHours: new Prisma.Decimal('8.00'),
        isDefault: true,
      },
    });

    const yearsToUpsert = missingYears.length > 0 ? missingYears : years;
    for (const yr of yearsToUpsert) {
      const generated = generateSouthAfricanPublicHolidays(yr);
      for (const h of generated) {
        await tx.publicHoliday.upsert({
          where: {
            calendarId_date: {
              calendarId: calendar.id,
              date: h.date,
            },
          },
          update: {
            name: h.name,
            isObservedMonday: h.isObservedMonday,
            isAdHocDeclared: h.isAdHocDeclared,
          },
          create: {
            calendarId: calendar.id,
            date: h.date,
            name: h.name,
            isObservedMonday: h.isObservedMonday,
            isAdHocDeclared: h.isAdHocDeclared,
          },
        });
      }
      seededGlobalYears.add(yr);
    }

    return calendar;
  });
}

/**
 * Reset in-memory seed cache (useful in isolated database test suites).
 */
export function resetGlobalZaSeedCache(): void {
  seededGlobalYears = new Set<number>();
}

/**
 * Ensure a tenant has its own editable `WorkingCalendar` (cloned from the SA baseline
 * if not yet provisioned) so custom December builder's shutdown days remain tenant-isolated.
 */
export async function getOrCreateTenantWorkingCalendar(
  tenantId: string,
  overrides?: {
    name?: string;
    workDays?: number[];
    dailyWorkHours?: number;
  }
) {
  await seedGlobalZaCalendar([2025, 2026, 2027, 2028]);

  return withTenantTx(tenantId, async (tx) => {
    let existing = await tx.workingCalendar.findFirst({
      where: { tenantId, isDefault: true },
      orderBy: { createdAt: 'asc' },
    });

    if (!existing) {
      existing = await tx.workingCalendar.findFirst({
        where: { tenantId },
        orderBy: { createdAt: 'asc' },
      });
    }

    if (!existing) {
      existing = await tx.workingCalendar.create({
        data: {
          tenantId,
          name: overrides?.name || DEFAULT_ZA_CALENDAR_NAME,
          countryCode: 'ZA',
          workDays: overrides?.workDays || DEFAULT_ZA_WORK_DAYS,
          dailyWorkHours: new Prisma.Decimal(
            (overrides?.dailyWorkHours ?? DEFAULT_DAILY_WORK_HOURS).toFixed(2)
          ),
          isDefault: true,
        },
      });
    } else if (overrides) {
      existing = await tx.workingCalendar.update({
        where: { id: existing.id },
        data: {
          ...(overrides.name !== undefined ? { name: overrides.name } : {}),
          ...(overrides.workDays !== undefined ? { workDays: overrides.workDays } : {}),
          ...(overrides.dailyWorkHours !== undefined
            ? { dailyWorkHours: new Prisma.Decimal(overrides.dailyWorkHours.toFixed(2)) }
            : {}),
          isDefault: true,
        },
      });
    }

    return existing;
  });
}

/**
 * Resolve an effective `WorkingCalendar` merging:
 * 1. Deterministic ZA statutory + Sunday-to-Monday s2(1) + s2A baseline holidays (when `countryCode === 'ZA'`),
 * 2. Database-persisted global `'ZA'` baseline holidays, and
 * 3. Tenant-specific custom / December shutdown holidays from the selected `WorkingCalendar`.
 */
export async function resolveWorkingCalendar(options?: {
  calendarId?: string | null;
  tenantId?: string | null;
  years?: number[];
}): Promise<ResolvedWorkingCalendar> {
  const requestedYears =
    options?.years && options.years.length > 0
      ? Array.from(new Set(options.years))
      : [2025, 2026, 2027, 2028];

  try {
    await seedGlobalZaCalendar(requestedYears);

    const runLookup = async (tx: Prisma.TransactionClient) => {
      let targetCal = null;

      if (options?.calendarId) {
        targetCal = await tx.workingCalendar.findFirst({
          where: { id: options.calendarId },
          include: { holidays: true },
        });
      }

      if (!targetCal && options?.tenantId) {
        targetCal = await tx.workingCalendar.findFirst({
          where: { tenantId: options.tenantId, isDefault: true },
          include: { holidays: true },
          orderBy: { updatedAt: 'desc' },
        });
      }

      const globalCal = await tx.workingCalendar.findFirst({
        where: { id: GLOBAL_ZA_CALENDAR_ID },
        include: { holidays: true },
      });

      return { targetCal, globalCal };
    };

    const { targetCal, globalCal } = options?.tenantId
      ? await withTenantTx(options.tenantId, runLookup)
      : await prisma.$transaction(runLookup);

    const effectiveCal = targetCal || globalCal;
    const countryCode = effectiveCal?.countryCode || 'ZA';
    const workDays =
      effectiveCal?.workDays && effectiveCal.workDays.length > 0
        ? effectiveCal.workDays
        : [...DEFAULT_ZA_WORK_DAYS];
    const dailyWorkHours = effectiveCal
      ? Number(effectiveCal.dailyWorkHours)
      : DEFAULT_DAILY_WORK_HOURS;

    const holidaysByDate = new Map<string, ResolvedHolidayEntry>();

    // 1. Seed deterministic ZA statutory + observed Monday baseline for all requested years
    if (countryCode === 'ZA') {
      for (const yr of requestedYears) {
        for (const h of generateSouthAfricanPublicHolidays(yr)) {
          holidaysByDate.set(h.dateIso, {
            calendarId: GLOBAL_ZA_CALENDAR_ID,
            dateIso: h.dateIso,
            name: h.name,
            isObservedMonday: h.isObservedMonday,
            isAdHocDeclared: h.isAdHocDeclared,
            isCustomTenantHoliday: false,
          });
        }
      }
    }

    // 2. Overlay persisted global ZA baseline holidays (e.g. newly added presidential s2A holidays)
    if (globalCal && countryCode === 'ZA') {
      for (const gh of globalCal.holidays) {
        const iso = toIsoDateString(gh.date);
        holidaysByDate.set(iso, {
          id: gh.id,
          calendarId: gh.calendarId,
          dateIso: iso,
          name: gh.name,
          isObservedMonday: gh.isObservedMonday,
          isAdHocDeclared: gh.isAdHocDeclared,
          isCustomTenantHoliday: false,
        });
      }
    }

    // 3. Overlay tenant-specific or custom calendar holidays (e.g. December Builder's Shutdown)
    if (targetCal && targetCal.id !== GLOBAL_ZA_CALENDAR_ID) {
      for (const th of targetCal.holidays) {
        const iso = toIsoDateString(th.date);
        const existingGlobal = holidaysByDate.get(iso);
        holidaysByDate.set(iso, {
          id: th.id,
          calendarId: th.calendarId,
          dateIso: iso,
          name: existingGlobal && !existingGlobal.isCustomTenantHoliday ? existingGlobal.name : th.name,
          isObservedMonday: th.isObservedMonday || Boolean(existingGlobal?.isObservedMonday),
          isAdHocDeclared: th.isAdHocDeclared,
          isCustomTenantHoliday: targetCal.tenantId !== null,
        });
      }
    }

    return {
      id: effectiveCal?.id || GLOBAL_ZA_CALENDAR_ID,
      tenantId: effectiveCal?.tenantId ?? null,
      name: effectiveCal?.name || DEFAULT_ZA_CALENDAR_NAME,
      countryCode,
      workDays,
      dailyWorkHours,
      isDefault: effectiveCal?.isDefault ?? true,
      holidaysByDate,
    };
  } catch {
    // Graceful deterministic fallback if DB is temporarily unreachable
    return buildInMemoryZaCalendar(requestedYears);
  }
}

/**
 * Add a custom company shutdown period (such as the South African December Builder's Shutdown)
 * to a tenant's `WorkingCalendar`. Skips non-working weekend days and existing statutory holidays.
 */
export async function addTenantShutdownPeriod(params: {
  tenantId: string;
  calendarId?: string;
  startDate: Date | string;
  endDate: Date | string;
  name?: string;
}) {
  const start = parseUtcDate(params.startDate);
  const end = parseUtcDate(params.endDate);
  if (end.getTime() < start.getTime()) {
    throw new Error('Shutdown endDate must be on or after startDate.');
  }

  const label = (params.name || "December Builder's Shutdown").trim();
  const tenantCal = await getOrCreateTenantWorkingCalendar(params.tenantId);
  const targetCalendarId =
    params.calendarId && params.calendarId !== GLOBAL_ZA_CALENDAR_ID
      ? params.calendarId
      : tenantCal.id;

  const years = new Set<number>([start.getUTCFullYear(), end.getUTCFullYear()]);
  const zaStatutoryMap = new Map<string, GeneratedSaHoliday>();
  for (const yr of years) {
    for (const h of generateSouthAfricanPublicHolidays(yr)) {
      zaStatutoryMap.set(h.dateIso, h);
    }
  }

  const workDays = tenantCal.workDays.length > 0 ? tenantCal.workDays : DEFAULT_ZA_WORK_DAYS;
  const createdOrUpdated: Array<{ id: string; dateIso: string; name: string }> = [];

  await withTenantTx(params.tenantId, async (tx) => {
    let cursor = start;
    let safety = 0;
    while (cursor.getTime() <= end.getTime() && safety < 120) {
      safety++;
      const utcDay = cursor.getUTCDay();
      const isWeekend =
        utcDay === 0
          ? !workDays.includes(0) && !workDays.includes(7)
          : !workDays.includes(utcDay);
      const iso = toIsoDateString(cursor);

      if (!isWeekend && !zaStatutoryMap.has(iso)) {
        const row = await tx.publicHoliday.upsert({
          where: {
            calendarId_date: {
              calendarId: targetCalendarId,
              date: cursor,
            },
          },
          update: {
            name: label,
            isAdHocDeclared: true,
          },
          create: {
            calendarId: targetCalendarId,
            date: cursor,
            name: label,
            isObservedMonday: false,
            isAdHocDeclared: true,
          },
        });
        createdOrUpdated.push({
          id: row.id,
          dateIso: iso,
          name: row.name,
        });
      }

      cursor = addCalendarDaysUtc(cursor, 1);
    }
  });

  return {
    calendarId: targetCalendarId,
    addedDaysCount: createdOrUpdated.length,
    days: createdOrUpdated,
  };
}

export const saCalendarService = {
  GLOBAL_ZA_CALENDAR_ID,
  DEFAULT_ZA_CALENDAR_NAME,
  PRESIDENTIAL_ADHOC_ZA_HOLIDAYS,
  toIsoDateString,
  parseUtcDate,
  addCalendarDaysUtc,
  computeGregorianEasterSunday,
  generateSouthAfricanPublicHolidays,
  buildInMemoryZaCalendar,
  seedGlobalZaCalendar,
  resetGlobalZaSeedCache,
  getOrCreateTenantWorkingCalendar,
  resolveWorkingCalendar,
  addTenantShutdownPeriod,
};
