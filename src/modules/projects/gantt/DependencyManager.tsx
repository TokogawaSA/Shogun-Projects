/**
 * Task Dependency Matrix & Critical Path Analyzer
 * Multi-Tenant Antigravity 2.0 Ecosystem
 */

import React, { useMemo } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Zap 
} from 'lucide-react';
import { Task } from '../../../types';

interface DependencyManagerProps {
  tasks: Task[];
  onSelectTask?: (task: Task) => void;
}

export interface DependencyConflict {
  taskId: string;
  taskTitle: string;
  predecessorId: string;
  predecessorTitle: string;
  predecessorDue?: string;
  taskDue?: string;
  message: string;
}

export const DependencyManager: React.FC<DependencyManagerProps> = ({
  tasks,
  onSelectTask,
}) => {
  // 1. Detect Finish-to-Start Conflicts
  const conflicts = useMemo(() => {
    const taskMap = new Map<string, Task>();
    tasks.forEach((t) => taskMap.set(t.id, t));

    const conflictList: DependencyConflict[] = [];

    tasks.forEach((task) => {
      if (!task.predecessorTaskIds || task.predecessorTaskIds.length === 0) return;

      task.predecessorTaskIds.forEach((predId) => {
        const pred = taskMap.get(predId);
        if (!pred) return;

        // If predecessor is not done and its due date > dependent task's due date
        if (pred.dueDate && task.dueDate) {
          const predDate = new Date(pred.dueDate).getTime();
          const taskDate = new Date(task.dueDate).getTime();

          if (predDate > taskDate) {
            conflictList.push({
              taskId: task.id,
              taskTitle: task.title,
              predecessorId: pred.id,
              predecessorTitle: pred.title,
              predecessorDue: pred.dueDate,
              taskDue: task.dueDate,
              message: `Predecessor "${pred.title}" due (${pred.dueDate}) is scheduled after dependent task due (${task.dueDate}).`,
            });
          }
        }
      });
    });

    return conflictList;
  }, [tasks]);

  // 2. Critical Path Calculation (Longest path through DAG)
  const { criticalPathTasks, totalCriticalDuration } = useMemo(() => {
    const taskMap = new Map<string, Task>();
    tasks.forEach((t) => taskMap.set(t.id, t));

    // Simple forward pass duration estimate
    const durations = new Map<string, number>();
    const predecessorsMap = new Map<string, string[]>();

    tasks.forEach((t) => {
      const dur = t.estimatedHours || 8;
      durations.set(t.id, dur);
      predecessorsMap.set(t.id, t.predecessorTaskIds || []);
    });

    // Find deepest chain
    let maxPath: string[] = [];
    let maxDuration = 0;

    const findPath = (currentId: string, currentPath: string[], currentDur: number) => {
      const newPath = [...currentPath, currentId];
      const newDur = currentDur + (durations.get(currentId) || 0);

      // Find children who have currentId as predecessor
      const successors = tasks.filter((t) => (t.predecessorTaskIds || []).includes(currentId));

      if (successors.length === 0) {
        if (newDur > maxDuration) {
          maxDuration = newDur;
          maxPath = newPath;
        }
        return;
      }

      successors.forEach((s) => {
        findPath(s.id, newPath, newDur);
      });
    };

    // Start with root tasks (no predecessors)
    const roots = tasks.filter((t) => !t.predecessorTaskIds || t.predecessorTaskIds.length === 0);
    roots.forEach((r) => findPath(r.id, [], 0));

    const cpTasks = maxPath.map((id) => taskMap.get(id)).filter(Boolean) as Task[];

    return {
      criticalPathTasks: cpTasks,
      totalCriticalDuration: maxDuration,
    };
  }, [tasks]);

  return (
    <div className="space-y-6">
      {/* Telemetry Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md backdrop-blur-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
              Critical Path Tasks
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono tracking-tight">
            {criticalPathTasks.length} Nodes
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            Determines minimum timeline duration
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md backdrop-blur-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
              Critical Timeline Duration
            </span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-100 font-mono tracking-tight">
            {totalCriticalDuration} Hours
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            Cumulative sequence effort
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md backdrop-blur-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
              Schedule Conflicts
            </span>
            <div
              className={`p-2 rounded-xl border ${
                conflicts.length > 0
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              }`}
            >
              {conflicts.length > 0 ? (
                <AlertTriangle className="w-4 h-4" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
            </div>
          </div>
          <div
            className={`text-2xl font-black font-mono tracking-tight ${
              conflicts.length > 0 ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            {conflicts.length} Identified
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            {conflicts.length > 0 ? 'Finish-to-start timing violations' : 'All dependency links healthy'}
          </div>
        </div>
      </div>

      {/* Conflicts Alert Section */}
      {conflicts.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-2.5 animate-fade-in">
          <div className="flex items-center gap-2 text-rose-300 text-xs font-bold font-mono">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>Dependency Schedule Inversions Detected:</span>
          </div>

          <div className="space-y-2">
            {conflicts.map((c, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-slate-900/80 border border-rose-500/20 text-xs flex items-center justify-between gap-3"
              >
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-200">{c.taskTitle}</div>
                  <p className="text-[11px] text-rose-400">{c.message}</p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Conflict
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Critical Path Flow Chain */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
              Critical Path Sequence
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {criticalPathTasks.length} sequential execution stages
          </span>
        </div>

        {criticalPathTasks.length === 0 ? (
          <p className="text-center text-slate-500 text-xs py-6">
            No linked predecessor task sequence found in this project.
          </p>
        ) : (
          <div className="space-y-3">
            {criticalPathTasks.map((task, idx) => (
              <div
                key={task.id}
                onClick={() => onSelectTask && onSelectTask(task)}
                className="group p-3.5 rounded-xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/40 transition cursor-pointer flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center justify-center font-mono font-bold text-xs flex-shrink-0">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-200 group-hover:text-amber-300 transition">
                      {task.title}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      Due: {task.dueDate || 'Unscheduled'} • Budget: {task.estimatedHours || 8}h
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded ${
                      task.status === 'done'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {task.status}
                  </span>
                  {idx < criticalPathTasks.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 transition" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default DependencyManager;
