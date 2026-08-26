import React from 'react';
import { Bell } from 'lucide-react';

// =========================================================================
// Notification Dispatcher View
// =========================================================================
export const NotificationDispatcherView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <Bell className="w-5 h-5 text-emerald-600" />
            Notification Dispatcher & Alert Queues
          </h2>
          <p className="text-xs text-slate-400">
            Manage in-app telemetry badges and real-time WebSocket event dispatching.
          </p>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <h3 className="text-xs font-bold text-slate-100 uppercase font-mono">Active Real-Time Channels</h3>
        <div className="space-y-2">
          {['Task Assignment Queue', 'Workflow Trigger Dispatcher', 'System Security Alerts'].map((c) => (
            <div
              key={c}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 text-xs text-slate-200"
            >
              <span>{c}</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono font-semibold">
                Listening (Live WebSockets)
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
