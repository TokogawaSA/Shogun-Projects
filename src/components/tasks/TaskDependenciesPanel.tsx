import React, { useState } from 'react';
import { Network, Plus, Trash2, AlertCircle, ArrowRight } from 'lucide-react';
import { Task, TaskDependencyItem, DependencyRelationType } from '../../types';

interface TaskDependenciesPanelProps {
  currentTaskId: string;
  dependencies?: TaskDependencyItem[];
  allTasks?: Task[];
  onChange: (deps: TaskDependencyItem[]) => void;
}

export const TaskDependenciesPanel: React.FC<TaskDependenciesPanelProps> = ({
  currentTaskId,
  dependencies = [],
  allTasks = [],
  onChange,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [selectedTargetId, setSelectedTargetId] = useState('');
  const [selectedType, setSelectedType] = useState<DependencyRelationType>('waiting_on');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Group dependencies by relation type
  const waitingOn = dependencies.filter((d) => d.type === 'waiting_on');
  const blocking = dependencies.filter((d) => d.type === 'blocking');

  // Candidate tasks for dependency (excluding current task and already linked tasks)
  const candidateTasks = allTasks.filter((t) => {
    if (t.id === currentTaskId) return false;
    return !dependencies.some((d) => d.targetTaskId === t.id);
  });

  // Cycle Detection Algorithm (Directed Acyclic Graph cycle check)
  const wouldCauseCycle = (sourceId: string, targetId: string): boolean => {
    // If target task already directly or transitively depends on sourceId, adding sourceId -> targetId creates a loop
    const visited = new Set<string>();
    const queue = [targetId];

    while (queue.length > 0) {
      const curr = queue.shift()!;
      if (curr === sourceId) return true;
      if (visited.has(curr)) continue;
      visited.add(curr);

      const targetTask = allTasks.find((t) => t.id === curr);
      if (targetTask?.predecessorTaskIds) {
        queue.push(...targetTask.predecessorTaskIds);
      }
    }
    return false;
  };

  const handleAddDependency = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTargetId) return;

    setErrorMsg(null);

    // Validate cycle
    if (selectedType === 'waiting_on' && wouldCauseCycle(currentTaskId, selectedTargetId)) {
      setErrorMsg('Cannot link task: Circular dependency detected (Task A cannot block Task B if Task B blocks Task A).');
      return;
    }

    const targetTask = allTasks.find((t) => t.id === selectedTargetId);
    const newItem: TaskDependencyItem = {
      id: `dep-${Date.now().toString(36)}`,
      taskId: currentTaskId,
      targetTaskId: selectedTargetId,
      targetTaskTitle: targetTask?.title || 'Untitled Task',
      targetTaskStatus: targetTask?.status || 'todo',
      type: selectedType,
      createdAt: new Date().toISOString(),
    };

    const updated = [...dependencies, newItem];
    onChange(updated);
    setSelectedTargetId('');
    setIsAdding(false);
  };

  const handleRemoveDependency = (depId: string) => {
    const updated = dependencies.filter((d) => d.id !== depId);
    onChange(updated);
  };

  return (
    <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Network className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Task Dependencies (DAG)
          </span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-900/40 text-purple-300 font-mono">
            {dependencies.length} Links
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsAdding(!isAdding)}
          className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 font-medium transition"
        >
          <Plus className="w-3 h-3" />
          Link Task
        </button>
      </div>

      {/* Add Dependency Selector */}
      {isAdding && (
        <form
          onSubmit={handleAddDependency}
          className="p-3 bg-slate-900 border border-purple-500/30 rounded-xl space-y-2.5 animate-in fade-in duration-150"
        >
          <div className="text-[11px] font-semibold text-slate-300">Link Dependent Task</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as DependencyRelationType)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
            >
              <option value="waiting_on">Waiting On (Predecessor)</option>
              <option value="blocking">Blocking (Dependent)</option>
            </select>

            <select
              value={selectedTargetId}
              onChange={(e) => setSelectedTargetId(e.target.value)}
              required
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
            >
              <option value="">Select target task...</option>
              {candidateTasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.status})
                </option>
              ))}
            </select>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-1.5 text-rose-400 text-xs bg-rose-950/40 p-2 rounded-lg border border-rose-800/60">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setErrorMsg(null);
              }}
              className="px-2.5 py-1 rounded text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedTargetId}
              className="px-3 py-1 rounded bg-purple-600 text-white text-xs font-semibold hover:bg-purple-500 disabled:opacity-50"
            >
              Link Dependency
            </button>
          </div>
        </form>
      )}

      {/* Dependency Lists */}
      <div className="space-y-2 pt-1 text-xs">
        {/* Waiting On */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Waiting On ({waitingOn.length})</span>
            <span className="text-[10px] text-slate-500">— Must complete before this task starts</span>
          </div>
          {waitingOn.length === 0 ? (
            <div className="text-[11px] text-slate-500 italic pl-3">No blocking predecessors</div>
          ) : (
            waitingOn.map((dep) => (
              <div
                key={dep.id}
                className="flex items-center justify-between p-2 bg-slate-900/60 border border-slate-800/80 rounded-lg"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <ArrowRight className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span className="truncate font-medium text-slate-200">{dep.targetTaskTitle}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 font-mono">
                    {dep.targetTaskStatus}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveDependency(dep.id)}
                  className="text-slate-500 hover:text-rose-400 p-1"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Blocking */}
        <div className="space-y-1.5 pt-1">
          <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            <span>Blocking ({blocking.length})</span>
            <span className="text-[10px] text-slate-500">— Blocked until this task completes</span>
          </div>
          {blocking.length === 0 ? (
            <div className="text-[11px] text-slate-500 italic pl-3">No tasks blocked by this task</div>
          ) : (
            blocking.map((dep) => (
              <div
                key={dep.id}
                className="flex items-center justify-between p-2 bg-slate-900/60 border border-slate-800/80 rounded-lg"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <ArrowRight className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                  <span className="truncate font-medium text-slate-200">{dep.targetTaskTitle}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 font-mono">
                    {dep.targetTaskStatus}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveDependency(dep.id)}
                  className="text-slate-500 hover:text-rose-400 p-1"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
