import {
  addCalendarDaysUtc,
  generateSouthAfricanPublicHolidays,
  parseUtcDate,
  resolveWorkingCalendar,
  toIsoDateString,
  type ResolvedHolidayEntry,
  type ResolvedWorkingCalendar,
} from './saCalendarService.js';
import { withTenantTx } from '../utils/tenantTx.js';

export interface SchedulableTaskInput {
  id: string;
  title: string;
  startDate?: Date | string | null;
  dueDate?: Date | string | null;
  durationDays?: number | null;
  estimatedHours?: number | null;
  predecessorTaskIds?: string[] | null;
  priority?: string | null;
  status?: string | null;
}

export interface CpmTaskScheduleNode {
  id: string;
  title: string;
  durationDays: number;
  estimatedHours: number;
  predecessorTaskIds: string[];
  ES: number; // Early Start (0-based working day index from project anchor)
  EF: number; // Early Finish (working day index)
  LS: number; // Late Start (working day index)
  LF: number; // Late Finish (working day index)
  totalFloat: number; // LS - ES (in working days)
  freeFloat: number; // Free float (in working days)
  earlyStartDate: string; // YYYY-MM-DD
  earlyFinishDate: string; // YYYY-MM-DD
  lateStartDate: string; // YYYY-MM-DD
  lateFinishDate: string; // YYYY-MM-DD
  isCritical: boolean;
}

export interface CpmProjectScheduleResult {
  calendarId: string;
  calendarName: string;
  dailyWorkHours: number;
  projectStartDate: string;
  projectFinishDate: string;
  projectDurationWorkingDays: number;
  criticalPathLengthHours: number;
  criticalTaskIds: string[];
  hasDependencyCycle: boolean;
  tasks: CpmTaskScheduleNode[];
  holidaysInSpan: ResolvedHolidayEntry[];
}

export interface TeamCapacitySummary {
  calendarId: string;
  calendarName: string;
  startDate: string;
  endDate: string;
  workingDays: number;
  dailyWorkHours: number;
  availableHoursPerMember: number;
  totalTeamAvailableHours: number;
  holidaysInPeriod: ResolvedHolidayEntry[];
}

/**
 * Ensure the resolved calendar has ZA statutory + Sunday-to-Monday s2(1) holidays
 * populated if date arithmetic crosses into an uncached calendar year.
 */
function ensureYearPopulatedInCalendar(cal: ResolvedWorkingCalendar, year: number): void {
  if (cal.countryCode !== 'ZA') return;
  const newYearCheck = `${year}-01-01`;
  if (cal.holidaysByDate.has(newYearCheck)) return;

  for (const h of generateSouthAfricanPublicHolidays(year)) {
    if (!cal.holidaysByDate.has(h.dateIso)) {
      cal.holidaysByDate.set(h.dateIso, {
        calendarId: cal.id,
        dateIso: h.dateIso,
        name: h.name,
        isObservedMonday: h.isObservedMonday,
        isAdHocDeclared: h.isAdHocDeclared,
        isCustomTenantHoliday: false,
      });
    }
  }
}

/**
 * Check synchronously whether a UTC midnight `Date` is a working day under `cal`
 * (must be an enabled weekday in `cal.workDays` AND not a `PublicHoliday`).
 */
export function isWorkingDaySync(date: Date | string, cal: ResolvedWorkingCalendar): boolean {
  const dt = typeof date === 'string' ? parseUtcDate(date) : date;
  ensureYearPopulatedInCalendar(cal, dt.getUTCFullYear());

  const utcDay = dt.getUTCDay(); // 0=Sun, 1=Mon .. 6=Sat
  const isWorkWeekday =
    utcDay === 0
      ? cal.workDays.includes(0) || cal.workDays.includes(7)
      : cal.workDays.includes(utcDay);

  if (!isWorkWeekday) {
    return false;
  }

  const iso = toIsoDateString(dt);
  return !cal.holidaysByDate.has(iso);
}

/**
 * Snap `date` to the same or nearest working day in `direction` (`'forward'` default).
 */
export function ensureWorkingDaySync(
  date: Date | string,
  cal: ResolvedWorkingCalendar,
  direction: 'forward' | 'backward' = 'forward'
): Date {
  let cursor = parseUtcDate(date);
  const step = direction === 'forward' ? 1 : -1;
  let guard = 0;

  while (!isWorkingDaySync(cursor, cal) && guard < 366) {
    cursor = addCalendarDaysUtc(cursor, step);
    guard++;
  }

  return cursor;
}

/**
 * Step forward (`offsetDays > 0`) or backward (`offsetDays < 0`) by `offsetDays`
 * working days from `date`.
 * Example: `shiftWorkingDaysSync('2026-04-02', 1, zaCal)` -> `'2026-04-07'`
 * (jumping over Good Friday 3 Apr, Sat 4 Apr, Sun 5 Apr, and Family Day 6 Apr).
 */
export function shiftWorkingDaysSync(
  date: Date | string,
  offsetDays: number,
  cal: ResolvedWorkingCalendar
): Date {
  let cursor = parseUtcDate(date);
  if (offsetDays === 0) {
    return ensureWorkingDaySync(cursor, cal, 'forward');
  }

  const step = offsetDays > 0 ? 1 : -1;
  let remaining = Math.abs(Math.trunc(offsetDays));
  let guard = 0;

  while (remaining > 0 && guard < 3660) {
    cursor = addCalendarDaysUtc(cursor, step);
    if (isWorkingDaySync(cursor, cal)) {
      remaining--;
    }
    guard++;
  }

  return cursor;
}

/**
 * Synchronous task-duration working day calculator:
 * Given a `startDate` and task `durationDays` (>= 1), snaps `startDate` to the first
 * available working day (Day 1) and advances `durationDays - 1` additional working days,
 * skipping weekends and `PublicHoliday` dates.
 *
 * Example: A 3-day task starting Thursday `2026-04-02` works:
 * - Day 1: Thu `2026-04-02`
 * - Skips Fri `2026-04-03` (Good Friday), Sat `04-04`, Sun `04-05`, Mon `2026-04-06` (Family Day)
 * - Day 2: Tue `2026-04-07`
 * - Day 3: Wed `2026-04-08` -> finishes Wednesday `2026-04-08`.
 */
export function addWorkingDaysSync(
  startDate: Date | string,
  durationDays: number,
  cal: ResolvedWorkingCalendar
): Date {
  if (durationDays < 0) {
    return shiftWorkingDaysSync(startDate, durationDays, cal);
  }

  const effectiveStart = ensureWorkingDaySync(startDate, cal, 'forward');
  if (durationDays <= 1) {
    return effectiveStart;
  }

  return shiftWorkingDaysSync(effectiveStart, Math.ceil(durationDays) - 1, cal);
}

/**
 * Count actual working days inclusively between `startDate` and `endDate`,
 * skipping weekends and `PublicHoliday` dates.
 * Example:
 * - `countWorkingDaysSync('2026-04-02', '2026-04-08', zaCal)` === `3`
 * - `countWorkingDaysSync('2027-01-01', '2027-12-31', zaCal)` === `251`
 */
export function countWorkingDaysSync(
  startDate: Date | string,
  endDate: Date | string,
  cal: ResolvedWorkingCalendar
): number {
  const start = parseUtcDate(startDate);
  const end = parseUtcDate(endDate);

  if (end.getTime() < start.getTime()) {
    return -countWorkingDaysSync(end, start, cal);
  }

  let count = 0;
  let cursor = start;
  let guard = 0;

  while (cursor.getTime() <= end.getTime() && guard < 36600) {
    if (isWorkingDaySync(cursor, cal)) {
      count++;
    }
    cursor = addCalendarDaysUtc(cursor, 1);
    guard++;
  }

  return count;
}

async function resolveCalendarInput(
  calendarOrId?: string | ResolvedWorkingCalendar | null,
  options?: { tenantId?: string | null; years?: number[] }
): Promise<ResolvedWorkingCalendar> {
  if (calendarOrId && typeof calendarOrId === 'object' && 'holidaysByDate' in calendarOrId) {
    if (options?.years) {
      for (const yr of options.years) {
        ensureYearPopulatedInCalendar(calendarOrId, yr);
      }
    }
    return calendarOrId;
  }

  return resolveWorkingCalendar({
    calendarId: typeof calendarOrId === 'string' ? calendarOrId : undefined,
    tenantId: options?.tenantId,
    years: options?.years,
  });
}

/**
 * Calculate the finish date of a task starting on `startDate` with duration `durationDays`,
 * skipping weekends and `PublicHoliday` dates on the specified `WorkingCalendar`.
 */
export async function addWorkingDays(
  startDate: Date | string,
  durationDays: number,
  calendarId?: string | ResolvedWorkingCalendar | null,
  options?: { tenantId?: string | null }
): Promise<Date> {
  const start = parseUtcDate(startDate);
  const startYr = start.getUTCFullYear();
  const cal = await resolveCalendarInput(calendarId, {
    tenantId: options?.tenantId,
    years: [startYr - 1, startYr, startYr + 1],
  });

  return addWorkingDaysSync(start, durationDays, cal);
}

/**
 * Step forward or backward by `offsetDays` working days (`+1` = next working day, `-1` = previous working day).
 */
export async function shiftWorkingDays(
  date: Date | string,
  offsetDays: number,
  calendarId?: string | ResolvedWorkingCalendar | null,
  options?: { tenantId?: string | null }
): Promise<Date> {
  const dt = parseUtcDate(date);
  const yr = dt.getUTCFullYear();
  const cal = await resolveCalendarInput(calendarId, {
    tenantId: options?.tenantId,
    years: [yr - 1, yr, yr + 1],
  });

  return shiftWorkingDaysSync(dt, offsetDays, cal);
}

/**
 * Count working days inclusively between `startDate` and `endDate` on `calendarId`,
 * excluding weekends and `PublicHoliday` dates.
 */
export async function countWorkingDays(
  startDate: Date | string,
  endDate: Date | string,
  calendarId?: string | ResolvedWorkingCalendar | null,
  options?: { tenantId?: string | null }
): Promise<number> {
  const start = parseUtcDate(startDate);
  const end = parseUtcDate(endDate);
  const minYr = Math.min(start.getUTCFullYear(), end.getUTCFullYear());
  const maxYr = Math.max(start.getUTCFullYear(), end.getUTCFullYear());
  const years: number[] = [];
  for (let y = minYr; y <= maxYr; y++) {
    years.push(y);
  }

  const cal = await resolveCalendarInput(calendarId, {
    tenantId: options?.tenantId,
    years,
  });

  return countWorkingDaysSync(start, end, cal);
}

/**
 * Compute full Critical Path Method (CPM) forward/backward passes (`ES`, `EF`, `LS`, `LF`,
 * `totalFloat`, `freeFloat`) and Finish-to-Start Gantt cascade dates while skipping
 * South African weekends, statutory holidays, Sunday-to-Monday s2(1) holidays, and shutdown days.
 */
export async function computeProjectCpm(
  tasks: SchedulableTaskInput[],
  options?: {
    calendarId?: string | ResolvedWorkingCalendar | null;
    tenantId?: string | null;
    projectStartDate?: Date | string;
  }
): Promise<CpmProjectScheduleResult> {
  const candidateYears = new Set<number>([new Date().getUTCFullYear(), 2026, 2027]);
  if (options?.projectStartDate) {
    candidateYears.add(parseUtcDate(options.projectStartDate).getUTCFullYear());
  }
  for (const t of tasks) {
    if (t.startDate) candidateYears.add(parseUtcDate(t.startDate).getUTCFullYear());
    if (t.dueDate) candidateYears.add(parseUtcDate(t.dueDate).getUTCFullYear());
  }

  const cal = await resolveCalendarInput(options?.calendarId, {
    tenantId: options?.tenantId,
    years: Array.from(candidateYears),
  });

  const dailyHours = cal.dailyWorkHours > 0 ? cal.dailyWorkHours : 8;

  if (tasks.length === 0) {
    const fallbackStart = ensureWorkingDaySync(
      options?.projectStartDate || new Date(),
      cal,
      'forward'
    );
    const iso = toIsoDateString(fallbackStart);
    return {
      calendarId: cal.id,
      calendarName: cal.name,
      dailyWorkHours: dailyHours,
      projectStartDate: iso,
      projectFinishDate: iso,
      projectDurationWorkingDays: 0,
      criticalPathLengthHours: 0,
      criticalTaskIds: [],
      hasDependencyCycle: false,
      tasks: [],
      holidaysInSpan: [],
    };
  }

  const taskIds = new Set(tasks.map((t) => t.id));
  const predecessorsMap = new Map<string, string[]>();
  const successorsMap = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  for (const t of tasks) {
    const validPreds = Array.from(
      new Set((t.predecessorTaskIds || []).filter((pid) => pid !== t.id && taskIds.has(pid)))
    );
    predecessorsMap.set(t.id, validPreds);
    inDegree.set(t.id, validPreds.length);
    if (!successorsMap.has(t.id)) {
      successorsMap.set(t.id, []);
    }
  }

  for (const [tid, preds] of predecessorsMap.entries()) {
    for (const pid of preds) {
      successorsMap.get(pid)!.push(tid);
    }
  }

  // Kahn's topological sort with deterministic cycle fallback
  const queue: string[] = [];
  for (const t of tasks) {
    if ((inDegree.get(t.id) || 0) === 0) {
      queue.push(t.id);
    }
  }

  const topoOrder: string[] = [];
  while (queue.length > 0) {
    const curr = queue.shift()!;
    topoOrder.push(curr);
    for (const succ of successorsMap.get(curr) || []) {
      const nextDeg = (inDegree.get(succ) || 0) - 1;
      inDegree.set(succ, nextDeg);
      if (nextDeg === 0) {
        queue.push(succ);
      }
    }
  }

  let hasDependencyCycle = false;
  if (topoOrder.length < tasks.length) {
    hasDependencyCycle = true;
    for (const t of tasks) {
      if (!topoOrder.includes(t.id)) {
        // Break cycle edge on remaining unvisited nodes so schedule still resolves cleanly
        predecessorsMap.set(
          t.id,
          (predecessorsMap.get(t.id) || []).filter((pid) => topoOrder.includes(pid))
        );
        topoOrder.push(t.id);
      }
    }
    // Rebuild clean DAG successors after cycle break
    for (const t of tasks) {
      successorsMap.set(t.id, []);
    }
    for (const [tid, preds] of predecessorsMap.entries()) {
      for (const pid of preds) {
        successorsMap.get(pid)!.push(tid);
      }
    }
  }

  // Resolve project anchor start date
  let earliestExplicit: Date | null = options?.projectStartDate
    ? ensureWorkingDaySync(options.projectStartDate, cal, 'forward')
    : null;

  for (const t of tasks) {
    if (t.startDate) {
      const snapped = ensureWorkingDaySync(t.startDate, cal, 'forward');
      if (!earliestExplicit || snapped.getTime() < earliestExplicit.getTime()) {
        earliestExplicit = snapped;
      }
    }
  }

  if (!earliestExplicit) {
    earliestExplicit = ensureWorkingDaySync(new Date(), cal, 'forward');
  }

  const projectAnchorDate = earliestExplicit;
  const taskInputById = new Map(tasks.map((t) => [t.id, t]));

  interface ForwardState {
    durationDays: number;
    estimatedHours: number;
    earlyStartDate: Date;
    earlyFinishDate: Date;
    ES: number;
    EF: number;
  }

  const forwardMap = new Map<string, ForwardState>();

  // Forward Pass: ES, EF, earlyStartDate, earlyFinishDate
  for (const tid of topoOrder) {
    const input = taskInputById.get(tid)!;
    const estHours =
      input.estimatedHours && input.estimatedHours > 0
        ? Number(input.estimatedHours)
        : input.durationDays && input.durationDays > 0
          ? Number(input.durationDays) * dailyHours
          : dailyHours;

    let durationDays =
      input.durationDays && input.durationDays > 0
        ? Math.ceil(input.durationDays)
        : input.startDate && input.dueDate
          ? Math.max(1, countWorkingDaysSync(input.startDate, input.dueDate, cal))
          : Math.max(1, Math.ceil(estHours / dailyHours));

    if (durationDays < 1) durationDays = 1;

    const preds = predecessorsMap.get(tid) || [];
    let earlyStartDate = input.startDate
      ? ensureWorkingDaySync(input.startDate, cal, 'forward')
      : projectAnchorDate;

    for (const pid of preds) {
      const predState = forwardMap.get(pid);
      if (predState) {
        // Finish-to-Start: successor cannot start until next working day after predecessor finishes
        const nextWorkingAfterPred = shiftWorkingDaysSync(predState.earlyFinishDate, 1, cal);
        if (nextWorkingAfterPred.getTime() > earlyStartDate.getTime()) {
          earlyStartDate = nextWorkingAfterPred;
        }
      }
    }

    const earlyFinishDate = addWorkingDaysSync(earlyStartDate, durationDays, cal);
    const esIndex = Math.max(0, countWorkingDaysSync(projectAnchorDate, earlyStartDate, cal) - 1);
    const efIndex = esIndex + durationDays;

    forwardMap.set(tid, {
      durationDays,
      estimatedHours: estHours,
      earlyStartDate,
      earlyFinishDate,
      ES: esIndex,
      EF: efIndex,
    });
  }

  let projectDurationWorkingDays = 0;
  let projectFinishDate = projectAnchorDate;
  for (const state of forwardMap.values()) {
    if (state.EF > projectDurationWorkingDays) {
      projectDurationWorkingDays = state.EF;
    }
    if (state.earlyFinishDate.getTime() > projectFinishDate.getTime()) {
      projectFinishDate = state.earlyFinishDate;
    }
  }

  // Backward Pass: LF, LS, lateFinishDate, lateStartDate, Total Float, Free Float
  const nodeMap = new Map<string, CpmTaskScheduleNode>();

  for (let i = topoOrder.length - 1; i >= 0; i--) {
    const tid = topoOrder[i];
    const input = taskInputById.get(tid)!;
    const fwd = forwardMap.get(tid)!;
    const succs = successorsMap.get(tid) || [];

    let LF = projectDurationWorkingDays;
    let lateFinishDate = projectFinishDate;

    if (succs.length > 0) {
      let minSuccLs = Infinity;
      let minLateFinish: Date | null = null;

      for (const sid of succs) {
        const succNode = nodeMap.get(sid)!;
        if (succNode.LS < minSuccLs) {
          minSuccLs = succNode.LS;
        }
        const candidateLfDate = shiftWorkingDaysSync(succNode.lateStartDate, -1, cal);
        if (!minLateFinish || candidateLfDate.getTime() < minLateFinish.getTime()) {
          minLateFinish = candidateLfDate;
        }
      }

      LF = minSuccLs;
      if (minLateFinish) {
        lateFinishDate = minLateFinish;
      }
    }

    const LS = LF - fwd.durationDays;
    const lateStartDate =
      fwd.durationDays <= 1
        ? lateFinishDate
        : shiftWorkingDaysSync(lateFinishDate, -(fwd.durationDays - 1), cal);

    const totalFloat = Math.max(0, LS - fwd.ES);

    let freeFloat = projectDurationWorkingDays - fwd.EF;
    if (succs.length > 0) {
      const minSuccEs = Math.min(...succs.map((sid) => forwardMap.get(sid)!.ES));
      freeFloat = Math.max(0, minSuccEs - fwd.EF);
    }

    nodeMap.set(tid, {
      id: tid,
      title: input.title,
      durationDays: fwd.durationDays,
      estimatedHours: fwd.estimatedHours,
      predecessorTaskIds: predecessorsMap.get(tid) || [],
      ES: fwd.ES,
      EF: fwd.EF,
      LS,
      LF,
      totalFloat,
      freeFloat,
      earlyStartDate: toIsoDateString(fwd.earlyStartDate),
      earlyFinishDate: toIsoDateString(fwd.earlyFinishDate),
      lateStartDate: toIsoDateString(lateStartDate),
      lateFinishDate: toIsoDateString(lateFinishDate),
      isCritical: totalFloat === 0,
    });
  }

  const orderedNodes = tasks.map((t) => nodeMap.get(t.id)!);
  const criticalTaskIds = orderedNodes.filter((n) => n.isCritical).map((n) => n.id);
  const criticalPathLengthHours = projectDurationWorkingDays * dailyHours;

  const spanStartIso = toIsoDateString(projectAnchorDate);
  const spanEndIso = toIsoDateString(projectFinishDate);
  const holidaysInSpan = Array.from(cal.holidaysByDate.values())
    .filter((h) => h.dateIso >= spanStartIso && h.dateIso <= spanEndIso)
    .sort((a, b) => a.dateIso.localeCompare(b.dateIso));

  return {
    calendarId: cal.id,
    calendarName: cal.name,
    dailyWorkHours: dailyHours,
    projectStartDate: spanStartIso,
    projectFinishDate: spanEndIso,
    projectDurationWorkingDays,
    criticalPathLengthHours,
    criticalTaskIds,
    hasDependencyCycle,
    tasks: orderedNodes,
    holidaysInSpan,
  };
}

/**
 * Cascade Finish-to-Start task dates in PostgreSQL when a predecessor task shifts,
 * automatically jumping over South African weekends and public holidays.
 */
export async function cascadeProjectGanttTasks(
  tenantId: string,
  projectId: string,
  calendarId?: string | null
): Promise<CpmProjectScheduleResult> {
  const projectData = await withTenantTx(tenantId, async (tx) => {
    const project = await tx.project.findFirst({
      where: { id: projectId, tenantId },
      select: { id: true, calendarId: true, createdAt: true },
    });
    const tasks = await tx.task.findMany({
      where: { projectId, tenantId },
      orderBy: { createdAt: 'asc' },
    });
    return { project, tasks };
  });

  const effectiveCalId = calendarId || projectData.project?.calendarId || undefined;
  const inputs: SchedulableTaskInput[] = projectData.tasks.map((t) => {
    const cf =
      typeof t.customFields === 'object' && t.customFields !== null
        ? (t.customFields as Record<string, any>)
        : {};
    return {
      id: t.id,
      title: t.title,
      startDate: cf.startDate || null,
      dueDate: t.dueDate,
      durationDays: typeof cf.durationDays === 'number' ? cf.durationDays : null,
      estimatedHours: t.estimatedHours,
      predecessorTaskIds: Array.isArray(t.predecessorTaskIds)
        ? (t.predecessorTaskIds as string[])
        : [],
      priority: t.priority,
      status: t.status,
    };
  });

  const cpm = await computeProjectCpm(inputs, {
    calendarId: effectiveCalId,
    tenantId,
    projectStartDate: projectData.project?.createdAt,
  });

  // Persist cascaded dates for tasks that have Finish-to-Start predecessors
  await withTenantTx(tenantId, async (tx) => {
    for (const node of cpm.tasks) {
      if (node.predecessorTaskIds.length === 0) continue;
      const orig = projectData.tasks.find((t) => t.id === node.id);
      if (!orig) continue;

      const cf =
        typeof orig.customFields === 'object' && orig.customFields !== null
          ? { ...(orig.customFields as Record<string, any>) }
          : {};
      const nextDueIso = node.earlyFinishDate;
      const origDueIso = orig.dueDate ? toIsoDateString(orig.dueDate) : null;

      if (cf.startDate !== node.earlyStartDate || origDueIso !== nextDueIso) {
        cf.startDate = node.earlyStartDate;
        cf.durationDays = node.durationDays;
        await tx.task.update({
          where: { id: orig.id },
          data: {
            dueDate: parseUtcDate(nextDueIso),
            customFields: cf,
          },
        });
      }
    }
  });

  return cpm;
}

/**
 * Calculate available working-day capacity hours for PPM Resource Capability Heatmaps
 * and Timesheets so South African public holidays are never flagged as under-utilization.
 */
export async function calculateAvailableTeamCapacity(params: {
  startDate: Date | string;
  endDate: Date | string;
  calendarId?: string | ResolvedWorkingCalendar | null;
  tenantId?: string | null;
  baseWeeklyCapacityHours?: number;
  memberCount?: number;
}): Promise<TeamCapacitySummary> {
  const start = parseUtcDate(params.startDate);
  const end = parseUtcDate(params.endDate);
  const minYr = Math.min(start.getUTCFullYear(), end.getUTCFullYear());
  const maxYr = Math.max(start.getUTCFullYear(), end.getUTCFullYear());
  const years: number[] = [];
  for (let y = minYr; y <= maxYr; y++) {
    years.push(y);
  }

  const cal = await resolveCalendarInput(params.calendarId, {
    tenantId: params.tenantId,
    years,
  });

  const workingDays = countWorkingDaysSync(start, end, cal);
  const standardWorkDaysPerWeek = cal.workDays.length > 0 ? cal.workDays.length : 5;
  const effectiveDailyHours =
    params.baseWeeklyCapacityHours !== undefined && params.baseWeeklyCapacityHours > 0
      ? params.baseWeeklyCapacityHours / standardWorkDaysPerWeek
      : cal.dailyWorkHours;

  const availableHoursPerMember = Number((workingDays * effectiveDailyHours).toFixed(2));
  const members = Math.max(1, params.memberCount ?? 1);
  const totalTeamAvailableHours = Number((availableHoursPerMember * members).toFixed(2));

  const startIso = toIsoDateString(start);
  const endIso = toIsoDateString(end);
  const holidaysInPeriod = Array.from(cal.holidaysByDate.values())
    .filter((h) => h.dateIso >= startIso && h.dateIso <= endIso)
    .sort((a, b) => a.dateIso.localeCompare(b.dateIso));

  return {
    calendarId: cal.id,
    calendarName: cal.name,
    startDate: startIso,
    endDate: endIso,
    workingDays,
    dailyWorkHours: Number(effectiveDailyHours.toFixed(2)),
    availableHoursPerMember,
    totalTeamAvailableHours,
    holidaysInPeriod,
  };
}

/**
 * Helper to get the Monday–Sunday bounds of a week containing `referenceDate`.
 */
export function getIsoWeekBounds(referenceDate: Date | string = new Date()): {
  monday: Date;
  sunday: Date;
  mondayIso: string;
  sundayIso: string;
} {
  const dt = parseUtcDate(referenceDate);
  const day = dt.getUTCDay(); // 0=Sun, 1=Mon .. 6=Sat
  const offsetToMonday = day === 0 ? -6 : 1 - day;
  const monday = addCalendarDaysUtc(dt, offsetToMonday);
  const sunday = addCalendarDaysUtc(monday, 6);
  return {
    monday,
    sunday,
    mondayIso: toIsoDateString(monday),
    sundayIso: toIsoDateString(sunday),
  };
}

export const schedulingEngine = {
  isWorkingDaySync,
  ensureWorkingDaySync,
  shiftWorkingDaysSync,
  addWorkingDaysSync,
  countWorkingDaysSync,
  addWorkingDays,
  shiftWorkingDays,
  countWorkingDays,
  computeProjectCpm,
  cascadeProjectGanttTasks,
  calculateAvailableTeamCapacity,
  getIsoWeekBounds,
};
