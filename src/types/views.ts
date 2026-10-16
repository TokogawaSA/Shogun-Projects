/**
 * ClickUp-Style Universal Multi-View Visualization Contracts
 */

export type ViewMode =
  | 'list'
  | 'board'
  | 'tree'
  | 'phase_gates'
  | 'gantt'
  | 'calendar'
  | 'workload'
  | 'mindmap';

export type ViewGroupBy = 'status' | 'priority' | 'assignee' | 'dueDate' | 'none';

export interface ViewFilterState {
  searchQuery: string;
  status: string; // 'all' | 'todo' | 'in_progress' | 'review' | 'done'
  priority: string; // 'all' | 'low' | 'medium' | 'high' | 'urgent'
  assigneeId: string; // 'all' | string
}

export interface ViewSortState {
  field: 'title' | 'dueDate' | 'priority' | 'createdAt' | 'estimatedHours';
  direction: 'asc' | 'desc';
}

export interface TaskGroupBucket<T> {
  id: string;
  title: string;
  colorHex?: string;
  items: T[];
  count: number;
}
