import React, { useState, useEffect } from 'react';
import { ClientChangeRequestItem } from '../../../types';
import { projectManagementService } from '../../../services/projectManagementService';
import { ExternalLink, Shield } from 'lucide-react';

export const ClientPortalView: React.FC = () => {
  const [changeRequests, setChangeRequests] = useState<ClientChangeRequestItem[]>([]);

  useEffect(() => {
    loadChangeRequests();
  }, []);

  const loadChangeRequests = async () => {
    try {
      const data = await projectManagementService.getChangeRequests();
      setChangeRequests(data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <ExternalLink className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              External Client Portal & Change Request Approvals
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
                Client Interface
              </span>
            </h3>
            <p className="text-xs text-slate-400">Controlled client access, review checkpoints & change request governance</p>
          </div>
        </div>

        <button className="px-3.5 py-2 bg-slate-950 hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-mono border border-slate-700 flex items-center gap-2 transition-all">
          <Shield className="w-4 h-4 text-cyan-400" />
          Client Portal Link Live
        </button>
      </div>

      {/* Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-2">
          <span className="text-xs font-mono text-slate-400 uppercase">Overall Project Progress</span>
          <div className="text-2xl font-bold text-cyan-400">68% Complete</div>
          <p className="text-[11px] font-mono text-slate-400">17 of 25 Milestones Delivered</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-2">
          <span className="text-xs font-mono text-slate-400 uppercase">Deliverable Sign-offs</span>
          <div className="text-2xl font-bold text-emerald-400">3 Accepted</div>
          <p className="text-[11px] font-mono text-slate-400">1 Pending Final Review</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl space-y-2">
          <span className="text-xs font-mono text-slate-400 uppercase">Active Change Requests</span>
          <div className="text-2xl font-bold text-amber-400">1 Pending Approval</div>
          <p className="text-[11px] font-mono text-slate-400">Total Scope Impact: +$4,500</p>
        </div>
      </div>

      {/* Change Request Log */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">Formal Client Change Requests</h4>
          <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
            {changeRequests.length} Requests Logged
          </span>
        </div>

        <div className="space-y-3">
          {changeRequests.map((cr) => (
            <div key={cr.id} className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-bold text-slate-100">{cr.title}</h5>
                <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${
                  cr.status === 'approved' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-amber-950 text-amber-300 border-amber-800'
                }`}>
                  {cr.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">{cr.description}</p>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800/80">
                <span>Cost Impact: +${cr.costImpact}</span>
                <span>Schedule Impact: +{cr.scheduleDaysImpact} Days</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
