import { apiClient } from '../services/api';

export interface SaHolidayItem {
  id?: string;
  calendarId?: string;
  dateIso: string; // YYYY-MM-DD
  name: string;
  isObservedMonday: boolean;
  isAdHocDeclared: boolean;
  isCustomTenantHoliday?: boolean;
}

export interface WorkingCalendarMeta {
  id: string;
  tenantId: string | null;
  name: string;
  countryCode: string;
  workDays: number[];
  dailyWorkHours: number;
  isDefault: boolean;
  isSharedGlobalBaseline?: boolean;
}

export interface WorkingCalendarApiResponse {
  success: boolean;
  year: number;
  calendar: WorkingCalendarMeta;
  stats: {
    workingDaysInYear: number;
    annualCapacityHours: number;
    totalHolidays: number;
    observedMondaysCount: number;
    adHocAndShutdownCount: number;
  };
  holidays: SaHolidayItem[];
}

const PRESIDENTIAL_ADHOC_ZA_HOLIDAYS: Record<string, string> = {
  '2023-12-15': 'Springbok Rugby World Cup Victory Holiday (s2A)',
  '2024-05-29': 'National and Provincial Elections (s2A)',
  '2026-11-04': 'Local Government Elections (s2A)',
};

export function toUtcIsoDate(input: Date | string): string {
  if (typeof input === 'string') {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(input.trim());
    if (m) return `${m[1]}-${m[2]}-${m[3]}`;
    const parsed = new Date(input);
    if (!Number.isNaN(parsed.getTime())) return toUtcIsoDate(parsed);
  } else {
    const y = input.getFullYear();
    const m = String(input.getMonth() + 1).padStart(2, '0');
    const d = String(input.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return new Date().toISOString().slice(0, 10);
}

export function parseIsoDateUtc(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function addUtcDays(date: Date, delta: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + delta));
}

export function formatUtcIso(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function computeGregorianEaster(year: number): Date {
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
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Deterministic client-side generator matching `server/src/services/saCalendarService.ts`
 * (Public Holidays Act 36 of 1994 Schedule 1 + s2(1) Sunday->Monday + s2A).
 */
export function generateClientSaHolidays(year: number): SaHolidayItem[] {
  const easter = computeGregorianEaster(year);
  const goodFriday = addUtcDays(easter, -2);
  const familyDay = addUtcDays(easter, 1);

  const fixed = (m: number, d: number, name: string) => {
    const dt = new Date(Date.UTC(year, m - 1, d));
    return {
      date: dt,
      dateIso: formatUtcIso(dt),
      name,
      isObservedMonday: false,
      isAdHocDeclared: false,
    };
  };

  const statutory = [
    fixed(1, 1, "New Year's Day"),
    fixed(3, 21, 'Human Rights Day'),
    {
      date: goodFriday,
      dateIso: formatUtcIso(goodFriday),
      name: 'Good Friday',
      isObservedMonday: false,
      isAdHocDeclared: false,
    },
    {
      date: familyDay,
      dateIso: formatUtcIso(familyDay),
      name: 'Family Day',
      isObservedMonday: false,
      isAdHocDeclared: false,
    },
    fixed(4, 27, 'Freedom Day'),
    fixed(5, 1, "Workers' Day"),
    fixed(6, 16, 'Youth Day'),
    fixed(8, 9, "National Women's Day"),
    fixed(9, 24, 'Heritage Day'),
    fixed(12, 16, 'Day of Reconciliation'),
    fixed(12, 25, 'Christmas Day'),
    fixed(12, 26, 'Day of Goodwill'),
  ];

  const byDate = new Map<string, SaHolidayItem>();
  for (const h of statutory) {
    byDate.set(h.dateIso, {
      dateIso: h.dateIso,
      name: h.name,
      isObservedMonday: false,
      isAdHocDeclared: false,
    });
  }

  const statutorySet = new Set(byDate.keys());

  for (const h of statutory) {
    if (h.date.getUTCDay() === 0) {
      const mondayIso = formatUtcIso(addUtcDays(h.date, 1));
      if (!statutorySet.has(mondayIso) && !byDate.has(mondayIso)) {
        byDate.set(mondayIso, {
          dateIso: mondayIso,
          name: `${h.name} (Observed)`,
          isObservedMonday: true,
          isAdHocDeclared: false,
        });
      }
    }
  }

  const prefix = `${year}-`;
  for (const [iso, title] of Object.entries(PRESIDENTIAL_ADHOC_ZA_HOLIDAYS)) {
    if (iso.startsWith(prefix) && !byDate.has(iso)) {
      byDate.set(iso, {
        dateIso: iso,
        name: title,
        isObservedMonday: false,
        isAdHocDeclared: true,
      });
    }
  }

  return Array.from(byDate.values()).sort((a, b) => a.dateIso.localeCompare(b.dateIso));
}

export function buildHolidayMapForYears(
  years: number[],
  customHolidays: SaHolidayItem[] = []
): Map<string, SaHolidayItem> {
  const map = new Map<string, SaHolidayItem>();
  for (const yr of years) {
    for (const h of generateClientSaHolidays(yr)) {
      map.set(h.dateIso, h);
    }
  }
  for (const ch of customHolidays) {
    map.set(ch.dateIso, ch);
  }
  return map;
}

export function isSaWorkingDay(
  dateIso: string,
  holidayMap: Map<string, SaHolidayItem>,
  workDays: number[] = [1, 2, 3, 4, 5]
): boolean {
  const dt = parseIsoDateUtc(dateIso);
  const utcDay = dt.getUTCDay();
  const isWorkWeekday =
    utcDay === 0 ? workDays.includes(0) || workDays.includes(7) : workDays.includes(utcDay);
  if (!isWorkWeekday) return false;
  return !holidayMap.has(dateIso);
}

export function countSaWorkingDays(
  startIso: string,
  endIso: string,
  holidayMap: Map<string, SaHolidayItem>,
  workDays: number[] = [1, 2, 3, 4, 5]
): number {
  const start = parseIsoDateUtc(startIso);
  const end = parseIsoDateUtc(endIso);
  if (end.getTime() < start.getTime()) return 0;

  let count = 0;
  let cursor = start;
  let guard = 0;
  while (cursor.getTime() <= end.getTime() && guard < 4000) {
    if (isSaWorkingDay(formatUtcIso(cursor), holidayMap, workDays)) {
      count++;
    }
    cursor = addUtcDays(cursor, 1);
    guard++;
  }
  return count;
}

export function addSaWorkingDays(
  startIso: string,
  durationDays: number,
  holidayMap: Map<string, SaHolidayItem>,
  workDays: number[] = [1, 2, 3, 4, 5]
): string {
  let cursor = parseIsoDateUtc(startIso);
  let guard = 0;
  while (!isSaWorkingDay(formatUtcIso(cursor), holidayMap, workDays) && guard < 366) {
    cursor = addUtcDays(cursor, 1);
    guard++;
  }
  let remaining = Math.max(0, Math.ceil(durationDays) - 1);
  while (remaining > 0 && guard < 3660) {
    cursor = addUtcDays(cursor, 1);
    if (isSaWorkingDay(formatUtcIso(cursor), holidayMap, workDays)) {
      remaining--;
    }
    guard++;
  }
  return formatUtcIso(cursor);
}

export function getMondayOfIsoWeek(dateIso: string): string {
  const dt = parseIsoDateUtc(dateIso);
  const day = dt.getUTCDay();
  const offset = day === 0 ? -6 : 1 - day;
  return formatUtcIso(addUtcDays(dt, offset));
}

export async function fetchTenantWorkingCalendar(
  year: number
): Promise<WorkingCalendarApiResponse> {
  try {
    return await apiClient.get<WorkingCalendarApiResponse>(`/v1/calendars?year=${year}`);
  } catch {
    const holidays = generateClientSaHolidays(year);
    const map = buildHolidayMapForYears([year], holidays);
    const workingDaysInYear = countSaWorkingDays(`${year}-01-01`, `${year}-12-31`, map);
    return {
      success: true,
      year,
      calendar: {
        id: 'cal-za-global-sast',
        tenantId: null,
        name: 'South Africa Standard (SAST)',
        countryCode: 'ZA',
        workDays: [1, 2, 3, 4, 5],
        dailyWorkHours: 8,
        isDefault: true,
        isSharedGlobalBaseline: true,
      },
      stats: {
        workingDaysInYear,
        annualCapacityHours: workingDaysInYear * 8,
        totalHolidays: holidays.length,
        observedMondaysCount: holidays.filter((h) => h.isObservedMonday).length,
        adHocAndShutdownCount: holidays.filter((h) => h.isAdHocDeclared).length,
      },
      holidays,
    };
  }
}
