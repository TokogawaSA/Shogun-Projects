import React, { useState, useEffect } from 'react';
import { CriticalPathData } from '../../../types';
import { projectManagementService } from '../../../services/projectManagementService';
import { CalendarRange, Flame, GitCommit, Flag } from 'lucide-react';

export const InteractiveTimelineView: React.FC = () => {
  const [criticalData, setCriticalData] = useState<CriticalPathData | null>(null);
  const [highlightCritical, setHighlightCritical] = useState(true);

  useEffect(() => {
    loadTimeline();
  }, []);

  const loadTimeline = async () => {
    try {
      const data = await projectManagementService.getCriticalPath('p-1');
      setCriticalData(data);
    } catch (err) {
      console.error(err);
    }
  };

  const tasks = [
    { id: 'wbs-1', title: 'System Architecture & Data Pipelines', startDay: 1, durationDays: 10, isCritical: true, milestone: 'M1 Kick-off' },
    { id: 'wbs-1-1', title: 'Database Schema & Indexing', startDay: 1, durationDays: 4, isCritical: false, milestone: null },
    { id: 'wbs-1-2', title: 'REST API & Controller Pathways', startDay: 5, durationDays: 6, isCritical: true, milestone: 'M2 API Gate' },
    { id: 'wbs-2', title: 'Frontend Component Architecture', startDay: 3, durationDays: 7, isCritical: false, milestone: null },
    { id: 'wbs-2-2', title: '10 Sub-Module View Integrations', startDay: 11, durationDays: 8, isCritical: true, milestone: 'M3 Release Sign-off' },
  ];

  const totalDays = 20;
  const daysArray = Array.from({ length: totalDays }, (_, i) => i + 1);

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <CalendarRange className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              Interactive Gantt & Critical Path Method (CPM)
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/60">
                Finish-to-Start
              </span>
            </h3>
            <p className="text-xs text-slate-400">Visual schedule baselines, dependency flow & bottleneck chains</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800 hover:border-slate-700">
            <input
              type="checkbox"
              checked={highlightCritical}
              onChange={(e) => setHighlightCritical(e.target.checked)}
              className="w-4 h-4 rounded text-rose-500 focus:ring-rose-500 accent-rose-500"
            />
            <Flame className="w-4 h-4 text-rose-400" />
            Highlight Critical Path
          </label>
          <div className="text-xs font-mono text-slate-400 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
            Critical Chain: <span className="text-rose-400 font-bold">{criticalData?.criticalPathLengthHours || 84} Hours</span>
          </div>
        </div>
      </div>

      {/* Gantt Timeline Container */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4 overflow-x-auto">
        {/* Timeline Header Days */}
        <div className="grid grid-cols-24 gap-1 border-b border-slate-800 pb-3 font-mono text-[11px] text-slate-400 text-center">
          <div className="col-span-8 text-left font-sans font-bold text-slate-300 px-2">Work Item & Milestones</div>
          <div className="col-span-16 grid grid-cols-20 gap-1 text-center">
            {daysArray.map((day) => (
              <div key={day} className="py-1 bg-slate-950/50 rounded border border-slate-800/40 font-mono text-[10px]">
                D{day}
              </div>
            ))}
          </div>
        </div>

        {/* Task Duration Rows */}
        <div className="space-y-3">
          {tasks.map((task) => {
            const isCritical = highlightCritical && task.isCritical;
            return (
              <div key={task.id} className="grid grid-cols-24 gap-1 items-center py-2 hover:bg-slate-950/40 rounded-xl px-2 transition-all">
                <div className="col-span-8 flex items-center justify-between pr-4">
                  <div className="flex items-center gap-2 min-w-0">
                    {isCritical ? (
                      <Flame className="w-4 h-4 text-rose-500 flex-shrink-0 animate-pulse" />
                    ) : (
                      <GitCommit className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                    )}
                    <span className="text-xs font-semibold text-slate-200 truncate">{task.title}</span>
                  </div>
                  {task.milestone && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 flex items-center gap-1 flex-shrink-0">
                      <Flag className="w-3 h-3" />
                      {task.milestone}
                    </span>
                  )}
                </div>

                <div className="col-span-16 grid grid-cols-20 gap-1 items-center relative h-9 bg-slate-950/60 rounded-xl border border-slate-800/60 p-1">
                  <div
                    style={{
                      gridColumnStart: task.startDay,
                      gridColumnEnd: `span ${task.durationDays}`,
                    }}
                    className={`h-full rounded-lg flex items-center justify-between px-3 text-[11px] font-mono font-bold shadow-md transition-all ${
                      isCritical
                        ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-rose-600/30 ring-1 ring-rose-400'
                        : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-indigo-600/20'
                    }`}
                  >
                    <span className="truncate">{task.id}</span>
                    <span>{task.durationDays}d</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
