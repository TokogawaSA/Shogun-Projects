import React from 'react';
import {
  List,
  Kanban,
  BarChart3,
  Calendar,
  Users,
  Network,
  Filter,
  SlidersHorizontal,
  Search,
  Plus,
  ArrowUpDown,
} from 'lucide-react';
import { ViewMode, ViewGroupBy, ViewFilterState, ViewSortState } from '../../types/views';

interface UniversalViewBarProps {
  activeView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  groupBy: ViewGroupBy;
  onGroupByChange: (groupBy: ViewGroupBy) => void;
  filters: ViewFilterState;
  onFilterChange: (filters: ViewFilterState) => void;
  sort: ViewSortState;
  onSortChange: (sort: ViewSortState) => void;
  onQuickAddTask: () => void;
  totalCount: number;
}

const VIEW_TABS: { id: ViewMode; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'list', label: 'List View', icon: List },
  { id: 'board', label: 'Kanban Board', icon: Kanban },
  { id: 'gantt', label: 'Gantt Chart', icon: BarChart3 },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'workload', label: 'Workload', icon: Users },
  { id: 'mindmap', label: 'Mind Map', icon: Network },
];

export const UniversalViewBar: React.FC<UniversalViewBarProps> = ({
  activeView,
  onViewChange,
  groupBy,
  onGroupByChange,
  filters,
  onFilterChange,
  sort,
  onSortChange,
  onQuickAddTask,
  totalCount,
}) => {
  return (
    <div className="flex flex-col gap-2.5 p-2 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-md">
      {/* Top Row: View Switcher Tabs + Quick Add */}
      <div className="flex items-center justify-between gap-3 overflow-x-auto custom-scrollbar">
        {/* View Tabs */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800/80 flex-shrink-0">
          {VIEW_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeView === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onViewChange(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Quick Add + Count */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[11px] font-mono text-slate-400 px-2 py-1 rounded bg-slate-950 border border-slate-800 hidden sm:inline">
            {totalCount} Tasks
          </span>
          <button
            onClick={onQuickAddTask}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition shadow flex items-center gap-1.5 flex-shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Bottom Row: Controls (Search, Group By, Filter, Sort) */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/60 text-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
          <input
            type="text"
            placeholder="Search tasks in current scope..."
            value={filters.searchQuery}
            onChange={(e) => onFilterChange({ ...filters, searchQuery: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Group By & Filter Selectors */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Group By */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-slate-300">
            <SlidersHorizontal className="w-3 h-3 text-indigo-400" />
            <span className="text-[11px] text-slate-400">Group:</span>
            <select
              value={groupBy}
              onChange={(e) => onGroupByChange(e.target.value as ViewGroupBy)}
              className="bg-transparent text-xs font-medium focus:outline-none cursor-pointer"
            >
              <option value="status" className="bg-slate-900">
                Status
              </option>
              <option value="priority" className="bg-slate-900">
                Priority
              </option>
              <option value="assignee" className="bg-slate-900">
                Assignee
              </option>
              <option value="none" className="bg-slate-900">
                No Grouping
              </option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-slate-300">
            <Filter className="w-3 h-3 text-purple-400" />
            <span className="text-[11px] text-slate-400">Status:</span>
            <select
              value={filters.status}
              onChange={(e) => onFilterChange({ ...filters, status: e.target.value })}
              className="bg-transparent text-xs font-medium focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900">
                All Statuses
              </option>
              <option value="todo" className="bg-slate-900">
                To Do
              </option>
              <option value="in_progress" className="bg-slate-900">
                In Progress
              </option>
              <option value="review" className="bg-slate-900">
                In Review
              </option>
              <option value="done" className="bg-slate-900">
                Complete
              </option>
            </select>
          </div>

          {/* Sort Order */}
          <button
            onClick={() =>
              onSortChange({
                ...sort,
                direction: sort.direction === 'asc' ? 'desc' : 'asc',
              })
            }
            className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-slate-300 hover:text-white transition"
            title={`Sorted by ${sort.field} (${sort.direction.toUpperCase()})`}
          >
            <ArrowUpDown className="w-3 h-3 text-slate-400" />
            <span className="text-[11px] uppercase font-mono">{sort.direction}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
