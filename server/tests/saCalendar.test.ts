import crypto from 'node:crypto';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../src/config/db.js';
import { disconnectRedis } from '../src/config/redis.js';
import {
  GLOBAL_ZA_CALENDAR_ID,
  addTenantShutdownPeriod,
  generateSouthAfricanPublicHolidays,
  resetGlobalZaSeedCache,
  seedGlobalZaCalendar,
  toIsoDateString,
} from '../src/services/saCalendarService.js';
import {
  addWorkingDays,
  calculateAvailableTeamCapacity,
  computeProjectCpm,
  countWorkingDays,
} from '../src/services/schedulingEngine.js';

describe('Phase 1 – South African Working Calendar, Sunday-to-Monday Observance & Gantt/CPM Integration', () => {
  const tenantAlphaId = `tenant-za-cal-a-${crypto.randomUUID().slice(0, 8)}`;
  const tenantBetaId = `tenant-za-cal-b-${crypto.randomUUID().slice(0, 8)}`;

  beforeAll(async () => {
    resetGlobalZaSeedCache();
    await prisma.tenant.createMany({
      data: [
        { id: tenantAlphaId, name: 'Gauteng Civil & Structural (Pty) Ltd' },
        { id: tenantBetaId, name: 'Western Cape Studio Architects (Pty) Ltd' },
      ],
    });
    await seedGlobalZaCalendar([2022, 2026, 2027]);
  });

  afterAll(async () => {
    try {
      await prisma.tenant.deleteMany({
        where: { id: { in: [tenantAlphaId, tenantBetaId] } },
      });
    } finally {
      await disconnectRedis();
      await prisma.$disconnect();
    }
  });

  it('skips Good Friday (3 Apr 2026), weekend (4–5 Apr), and Family Day (6 Apr) so a 3-day task starting Thu 2 Apr 2026 finishes Wed 8 Apr 2026', async () => {
    const finishDate = await addWorkingDays('2026-04-02', 3, GLOBAL_ZA_CALENDAR_ID);
    expect(toIsoDateString(finishDate)).toBe('2026-04-08');

    const workingDaysInSpan = await countWorkingDays(
      '2026-04-02',
      '2026-04-08',
      GLOBAL_ZA_CALENDAR_ID
    );
    expect(workingDaysInSpan).toBe(3);
  });

  it('enforces Public Holidays Act 36 of 1994 s2(1) Sunday-to-Monday observance for 9–10 Aug 2026 and 21–22 Mar 2027 without double-shifting', async () => {
    const holidays2026 = generateSouthAfricanPublicHolidays(2026);
    const womensDay = holidays2026.find((h) => h.dateIso === '2026-08-09');
    const womensDayObserved = holidays2026.find((h) => h.dateIso === '2026-08-10');
    const electionDay2026 = holidays2026.find((h) => h.dateIso === '2026-11-04');

    expect(womensDay?.name).toBe("National Women's Day");
    expect(womensDay?.isObservedMonday).toBe(false);
    expect(womensDayObserved).toBeDefined();
    expect(womensDayObserved?.isObservedMonday).toBe(true);
    expect(electionDay2026?.isAdHocDeclared).toBe(true);

    // A 2-day task starting Friday 7 August 2026 must skip Sat 8 Aug, Sun 9 Aug, AND observed Mon 10 Aug -> finishes Tue 11 Aug 2026
    const augFinish = await addWorkingDays('2026-08-07', 2, GLOBAL_ZA_CALENDAR_ID);
    expect(toIsoDateString(augFinish)).toBe('2026-08-11');

    const holidays2027 = generateSouthAfricanPublicHolidays(2027);
    const humanRightsSunday = holidays2027.find((h) => h.dateIso === '2027-03-21');
    const humanRightsObserved = holidays2027.find((h) => h.dateIso === '2027-03-22');
    const goodwillObserved = holidays2027.find((h) => h.dateIso === '2027-12-27');

    expect(humanRightsSunday?.name).toBe('Human Rights Day');
    expect(humanRightsObserved?.isObservedMonday).toBe(true);
    expect(goodwillObserved?.isObservedMonday).toBe(true);

    // A 2-day task starting Friday 19 March 2027 must skip Sat 20 Mar, Sun 21 Mar, AND observed Mon 22 Mar -> finishes Tue 23 Mar 2027
    const marFinish = await addWorkingDays('2027-03-19', 2, GLOBAL_ZA_CALENDAR_ID);
    expect(toIsoDateString(marFinish)).toBe('2027-03-23');

    // Verify no double-shifting when Christmas Day (25 Dec 2022) falls on Sunday and Monday 26 Dec is already statutory Day of Goodwill
    const holidays2022 = generateSouthAfricanPublicHolidays(2022, { includePreSeededAdHoc: false });
    expect(holidays2022.find((h) => h.dateIso === '2022-12-26')?.isObservedMonday).toBe(false);
    expect(holidays2022.find((h) => h.dateIso === '2022-12-27')).toBeUndefined();
  });

  it('computes 251 actual SA working days (2,008 hours) in 2027 and cascades CPM Finish-to-Start tasks across Easter & tenant December shutdowns under FORCE RLS', async () => {
    const workingDays2027 = await countWorkingDays(
      '2027-01-01',
      '2027-12-31',
      GLOBAL_ZA_CALENDAR_ID
    );
    expect(workingDays2027).toBe(251);

    const cap2027 = await calculateAvailableTeamCapacity({
      startDate: '2027-01-01',
      endDate: '2027-12-31',
      calendarId: GLOBAL_ZA_CALENDAR_ID,
    });
    expect(cap2027.workingDays).toBe(251);
    expect(cap2027.availableHoursPerMember).toBe(2008);

    // Verify CPM Forward/Backward Pass + Finish-to-Start jump over Easter 2026
    const cpm = await computeProjectCpm(
      [
        {
          id: 'task-foundation',
          title: 'Foundation Pour',
          startDate: '2026-04-02', // Thu before Good Friday
          durationDays: 3, // Thu 2 Apr, Tue 7 Apr, Wed 8 Apr -> finishes 2026-04-08
          predecessorTaskIds: [],
        },
        {
          id: 'task-steelwork',
          title: 'Structural Steel Erection',
          durationDays: 2, // FS after 2026-04-08 -> Thu 9 Apr & Fri 10 Apr -> finishes 2026-04-10
          predecessorTaskIds: ['task-foundation'],
        },
      ],
      { calendarId: GLOBAL_ZA_CALENDAR_ID }
    );

    const foundation = cpm.tasks.find((t) => t.id === 'task-foundation')!;
    const steelwork = cpm.tasks.find((t) => t.id === 'task-steelwork')!;

    expect(foundation.earlyStartDate).toBe('2026-04-02');
    expect(foundation.earlyFinishDate).toBe('2026-04-08');
    expect(foundation.totalFloat).toBe(0);
    expect(foundation.isCritical).toBe(true);

    expect(steelwork.earlyStartDate).toBe('2026-04-09');
    expect(steelwork.earlyFinishDate).toBe('2026-04-10');
    expect(steelwork.totalFloat).toBe(0);
    expect(steelwork.isCritical).toBe(true);
    expect(cpm.projectDurationWorkingDays).toBe(5);

    // Add a December Builder's Shutdown on Tenant Alpha and verify PostgreSQL FORCE RLS isolates it from Tenant Beta
    const shutdown = await addTenantShutdownPeriod({
      tenantId: tenantAlphaId,
      startDate: '2026-12-17',
      endDate: '2026-12-24',
      name: "December Builder's Shutdown",
    });
    expect(shutdown.addedDaysCount).toBe(6); // Thu 17, Fri 18, Mon 21, Tue 22, Wed 23, Thu 24

    // Under shogun_rls_enforced role, Tenant Beta can see the shared global ZA calendar (tenantId IS NULL)
    // but CANNOT see Tenant Alpha's custom calendar or shutdown holidays
    const betaVisibleCalendars = await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL ROLE shogun_rls_enforced`);
      await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantBetaId}, true)`;
      return tx.workingCalendar.findMany({
        include: { holidays: true },
      });
    });

    expect(betaVisibleCalendars.some((c) => c.id === GLOBAL_ZA_CALENDAR_ID)).toBe(true);
    expect(betaVisibleCalendars.some((c) => c.tenantId === tenantAlphaId)).toBe(false);
  });
});
