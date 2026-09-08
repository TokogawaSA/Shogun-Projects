import React, { useState, useEffect } from 'react';
import { TimesheetItem } from '../../../types';
import { projectManagementService } from '../../../services/projectManagementService';
import { Clock, CheckCircle2, XCircle } from 'lucide-react';

export const TimeSheetBillingView: React.FC = () => {
  const [timesheets, setTimesheets] = useState<TimesheetItem[]>([]);

  useEffect(() => {
    loadTimesheets();
  }, []);

  const loadTimesheets = async () => {
    try {
      const data = await projectManagementService.getTimesheets();
      setTimesheets(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await projectManagementService.updateTimesheetStatus(id, status);
      await loadTimesheets();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              Time Entry Logging & Weekly Timesheet Approvals
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800/60">
                Productive vs Non-Billable
              </span>
            </h3>
            <p className="text-xs text-slate-400">Log worked hours, categorize billability & execute manager sign-offs</p>
          </div>
        </div>

        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/20 transition-all flex items-center gap-2">
          <Clock className="w-4 h-4" />
          + Log Time Entry
        </button>
      </div>

      {/* Timesheet List Grid */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">Weekly Timesheet Approvals</h4>
          <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
            {timesheets.length} Pending Records
          </span>
        </div>

        <div className="space-y-3">
          {timesheets.map((ts) => (
            <div
              key={ts.id}
              className="bg-slate-950/80 border border-slate-800 hover:border-slate-700 p-4 rounded-xl flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center font-bold text-xs text-indigo-400">
                  {ts.user?.displayName.slice(0, 2).toUpperCase() || 'US'}
                </div>
                <div>
                  <h5 className="text-sm font-bold text-slate-100">{ts.user?.displayName}</h5>
                  <p className="text-xs font-mono text-slate-400">Week Starting {ts.weekStartDate}</p>
                </div>
              </div>

              <div className="flex items-center gap-6 font-mono text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Total Hours</span>
                  <span className="text-slate-200 font-bold">{ts.totalHours}h</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Billable</span>
                  <span className="text-emerald-400 font-bold">{ts.billableHours}h</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Status</span>
                  <span
                    className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${
                      ts.status === 'approved'
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60'
                        : ts.status === 'rejected'
                        ? 'bg-rose-950/80 text-rose-300 border-rose-800/60'
                        : 'bg-amber-950/80 text-amber-300 border-amber-800/60'
                    }`}
                  >
                    {ts.status}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {ts.status === 'submitted' && (
                  <>
                    <button
                      onClick={() => handleStatusUpdate(ts.id, 'approved')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(ts.id, 'rejected')}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
