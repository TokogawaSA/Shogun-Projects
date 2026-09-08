import React, { useState } from 'react';
import { Layers, ChevronRight, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Task } from '../../types';
import { useHierarchy } from '../../context/HierarchyContext';

interface TaskMindMapViewProps {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
}

export const TaskMindMapView: React.FC<TaskMindMapViewProps> = ({ tasks, onSelectTask }) => {
  const { activeScope } = useHierarchy();
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Separate root tasks and subtasks
  const rootTasks = tasks.filter((t) => !t.parentTaskId);

  return (
    <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-2xl relative overflow-hidden min-h-[550px] select-none text-xs">
      {/* Mind Map Floating Controls */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 p-1 rounded-xl shadow-lg">
        <button
          onClick={() => setZoomLevel(Math.min(1.4, zoomLevel + 0.1))}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <span className="text-[10px] font-mono text-slate-400 px-1">
          {Math.round(zoomLevel * 100)}%
        </span>
        <button
          onClick={() => setZoomLevel(Math.max(0.6, zoomLevel - 0.1))}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setZoomLevel(1)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          title="Reset Zoom"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Mind Map Canvas */}
      <div
        className="flex items-center justify-start gap-12 overflow-x-auto p-8 custom-scrollbar transition-transform duration-150 origin-top-left"
        style={{ transform: `scale(${zoomLevel})` }}
      >
        {/* Central Root Node (Space / Scope Root) */}
        <div className="flex-shrink-0 flex flex-col items-center">
          <div className="p-4 bg-indigo-950/80 border-2 border-indigo-500 rounded-2xl shadow-xl shadow-indigo-500/20 text-center space-y-1 min-w-[160px] animate-pulse">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-md">
              <Layers className="w-4 h-4" />
            </div>
            <div className="font-bold text-slate-100 text-sm">{activeScope.title}</div>
            <div className="text-[10px] text-indigo-300 font-mono uppercase tracking-wider">
              {activeScope.level} Root
            </div>
          </div>
        </div>

        <ChevronRight className="w-6 h-6 text-slate-700 flex-shrink-0" />

        {/* Task Nodes Column */}
        <div className="flex-shrink-0 flex flex-col gap-6">
          {rootTasks.length === 0 ? (
            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-400 italic">
              No tasks found in active scope
            </div>
          ) : (
            rootTasks.map((task) => {
              const subtasks = tasks.filter((t) => t.parentTaskId === task.id);

              return (
                <div key={task.id} className="flex items-center gap-6">
                  {/* Root Task Node */}
                  <div
                    onClick={() => onSelectTask(task)}
                    className="p-3 bg-slate-900 border border-slate-700/80 rounded-xl hover:border-indigo-500 cursor-pointer shadow-md transition-all hover:scale-105 min-w-[200px] max-w-[240px] space-y-1.5 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-slate-500">{task.id}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          task.priority === 'urgent'
                            ? 'bg-rose-950 text-rose-300'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {task.priority.toUpperCase()}
                      </span>
                    </div>

                    <div className="font-semibold text-slate-200 group-hover:text-indigo-300 truncate">
                      {task.title}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                      <span className="font-mono">{task.status}</span>
                      {subtasks.length > 0 && (
                        <span className="text-indigo-400 font-medium">
                          {subtasks.length} Subtasks
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Subtask Branch */}
                  {subtasks.length > 0 && (
                    <>
                      <ChevronRight className="w-5 h-5 text-slate-700 flex-shrink-0" />
                      <div className="flex flex-col gap-2">
                        {subtasks.map((st) => (
                          <div
                            key={st.id}
                            onClick={() => onSelectTask(st)}
                            className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg hover:border-purple-500 cursor-pointer shadow transition hover:scale-105 min-w-[170px] max-w-[200px] group"
                          >
                            <div className="font-medium text-slate-300 group-hover:text-purple-300 truncate">
                              {st.title}
                            </div>
                            <div className="text-[9px] text-slate-500 font-mono mt-0.5">
                              ↳ Subtask ({st.status})
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
