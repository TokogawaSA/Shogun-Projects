import React from 'react';

export const GanttPage: React.FC = () => {
  const schedule = [
    { phase: 'PHASE 1', title: 'Composer & PSR-4 Setup', start: 'Day 1', duration: '2 days', progress: 100, status: 'Completed' },
    { phase: 'PHASE 2', title: 'Custom MySQL Table Schema', start: 'Day 3', duration: '3 days', progress: 100, status: 'Completed' },
    { phase: 'PHASE 3', title: 'WooCommerce Mapping Engine', start: 'Day 6', duration: '4 days', progress: 60, status: 'In Progress' },
    { phase: 'PHASE 4', title: 'WP_REST_Controller API Paths', start: 'Day 10', duration: '3 days', progress: 20, status: 'In Progress' },
    { phase: 'PHASE 5', title: 'Action Scheduler Google Cloud Sync', start: 'Day 13', duration: '4 days', progress: 0, status: 'Pending' },
    { phase: 'PHASE 6', title: 'Gutenberg Sidebar & Telemetry', start: 'Day 17', duration: '5 days', progress: 0, status: 'Pending' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white tracking-tight">Project Timeline & Gantt Schedule</h3>
        <p className="text-xs text-slate-400">Milestone delivery pathways tracked via Antigravity 2.0 schedule matrix</p>
      </div>

      <div className="glass-panel p-6 rounded-xl border border-slate-800 bg-slate-900/40 space-y-6">
        <div className="space-y-4">
          {schedule.map((item, idx) => (
            <div key={idx} className="p-4 rounded-lg bg-slate-800/40 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-indigo-400 px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
                    {item.phase}
                  </span>
                  <span className="text-sm font-semibold text-slate-100">{item.title}</span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-slate-400 font-mono">{item.start} ({item.duration})</span>
                  <span className={`px-2 py-0.5 rounded font-semibold ${item.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-300' : item.status === 'In Progress' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-700/50 text-slate-400'}`}>
                    {item.status}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${item.progress === 100 ? 'bg-emerald-400' : 'bg-indigo-500'}`}
                  style={{ width: `${item.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
