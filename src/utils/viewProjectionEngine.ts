import { Task, ViewFilterState, ViewSortState, ViewGroupBy, TaskGroupBucket } from '../types';

// Pre-allocated priority order map for O(1) sort weight lookup
const PRIORITY_ORDER: Record<string, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
};

// Static metadata for common grouping buckets
const STATUS_BUCKET_DEFS = [
  { id: 'todo', title: 'To Do', colorHex: '#64748b' },
  { id: 'in_progress', title: 'In Progress', colorHex: '#3b82f6' },
  { id: 'review', title: 'In Review', colorHex: '#8b5cf6' },
  { id: 'done', title: 'Complete', colorHex: '#10b981' },
];

const PRIORITY_BUCKET_DEFS = [
  { id: 'urgent', title: 'Urgent Priority', colorHex: '#f43f5e' },
  { id: 'high', title: 'High Priority', colorHex: '#f97316' },
  { id: 'medium', title: 'Medium Priority', colorHex: '#3b82f6' },
  { id: 'low', title: 'Low Priority', colorHex: '#64748b' },
];

/**
 * Filter and sort a list of tasks efficiently without mutating the original array
 */
export function filterAndSortTasks(
  tasks: Task[],
  filters: ViewFilterState,
  sort: ViewSortState
): Task[] {
  const q = filters.searchQuery ? filters.searchQuery.toLowerCase() : null;
  const statusFilter = filters.status && filters.status !== 'all' ? filters.status : null;
  const priorityFilter = filters.priority && filters.priority !== 'all' ? filters.priority : null;
  const assigneeFilter = filters.assigneeId && filters.assigneeId !== 'all' ? filters.assigneeId : null;

  // Single-pass filter
  const filtered: Task[] = [];
  for (let i = 0; i < tasks.length; i++) {
    const t = tasks[i];

    if (q) {
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchDesc = t.description ? t.description.toLowerCase().includes(q) : false;
      if (!matchTitle && !matchDesc) continue;
    }

    if (statusFilter && t.status !== statusFilter) continue;
    if (priorityFilter && t.priority !== priorityFilter) continue;

    if (assigneeFilter) {
      const hasAssignee =
        t.assigneeId === assigneeFilter ||
        t.assigneeIds?.includes(assigneeFilter) ||
        t.assignees?.some((a) => a.userId === assigneeFilter);
      if (!hasAssignee) continue;
    }

    filtered.push(t);
  }

  // Sorting
  const isPrioritySort = sort.field === 'priority';
  const isAsc = sort.direction === 'asc';

  return filtered.sort((a, b) => {
    let aVal: any = isPrioritySort ? PRIORITY_ORDER[a.priority] || 0 : (a as any)[sort.field];
    let bVal: any = isPrioritySort ? PRIORITY_ORDER[b.priority] || 0 : (b as any)[sort.field];

    if (aVal === undefined || aVal === null) aVal = '';
    if (bVal === undefined || bVal === null) bVal = '';

    if (aVal < bVal) return isAsc ? -1 : 1;
    if (aVal > bVal) return isAsc ? 1 : -1;
    return 0;
  });
}

/**
 * Polymorphically group tasks by Status, Priority, Assignee, or Due Date in a single O(N) pass
 */
export function groupTasksBy(
  tasks: Task[],
  groupBy: ViewGroupBy
): TaskGroupBucket<Task>[] {
  if (groupBy === 'none') {
    return [
      {
        id: 'all',
        title: 'All Tasks',
        items: tasks,
        count: tasks.length,
      },
    ];
  }

  if (groupBy === 'status') {
    const map = new Map<string, Task[]>();
    STATUS_BUCKET_DEFS.forEach((d) => map.set(d.id, []));

    for (let i = 0; i < tasks.length; i++) {
      const st = tasks[i].status || 'todo';
      if (!map.has(st)) map.set(st, []);
      map.get(st)!.push(tasks[i]);
    }

    return STATUS_BUCKET_DEFS.map((def) => {
      const items = map.get(def.id) || [];
      return {
        id: def.id,
        title: def.title,
        colorHex: def.colorHex,
        items,
        count: items.length,
      };
    });
  }

  if (groupBy === 'priority') {
    const map = new Map<string, Task[]>();
    PRIORITY_BUCKET_DEFS.forEach((d) => map.set(d.id, []));

    for (let i = 0; i < tasks.length; i++) {
      const p = tasks[i].priority || 'medium';
      if (!map.has(p)) map.set(p, []);
      map.get(p)!.push(tasks[i]);
    }

    return PRIORITY_BUCKET_DEFS.map((def) => {
      const items = map.get(def.id) || [];
      return {
        id: def.id,
        title: def.title,
        colorHex: def.colorHex,
        items,
        count: items.length,
      };
    });
  }

  if (groupBy === 'assignee') {
    const bucketsMap = new Map<string, Task[]>();
    bucketsMap.set('unassigned', []);

    for (let i = 0; i < tasks.length; i++) {
      const t = tasks[i];
      const assigneeKey = t.assigneeId || t.assignees?.[0]?.userId || 'unassigned';
      if (!bucketsMap.has(assigneeKey)) {
        bucketsMap.set(assigneeKey, []);
      }
      bucketsMap.get(assigneeKey)!.push(t);
    }

    const buckets: TaskGroupBucket<Task>[] = [];
    bucketsMap.forEach((items, key) => {
      const title =
        key === 'unassigned'
          ? 'Unassigned'
          : key === 'usr-admin-master'
          ? 'Admin Master'
          : key.startsWith('usr-agent-')
          ? `${key.replace('usr-agent-', '').toUpperCase()} Agent (AI)`
          : key;

      buckets.push({
        id: key,
        title,
        colorHex: key === 'unassigned' ? '#64748b' : '#6366f1',
        items,
        count: items.length,
      });
    });

    return buckets;
  }

  return [
    {
      id: 'default',
      title: 'Grouped',
      items: tasks,
      count: tasks.length,
    },
  ];
}
