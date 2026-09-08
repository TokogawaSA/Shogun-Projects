import React, { useState, useEffect } from 'react';
import { ResourceWorkloadItem } from '../../../types';
import { projectManagementService } from '../../../services/projectManagementService';
import { Gauge } from 'lucide-react';

export const ResourceCapacityView: React.FC = () => {
  const [resources, setResources] = useState<ResourceWorkloadItem[]>([]);

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    try {
      const data = await projectManagementService.getResourceWorkload();
      setResources(data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Gauge className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              Resource Availability & Workload Heatmap
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                Staffing Capacity
              </span>
            </h3>
            <p className="text-xs text-slate-400">Team utilization bands, burnout prevention & skill mapping</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            Active Staff: <span className="text-emerald-400 font-bold">{resources.length} Workers</span>
          </span>
        </div>
      </div>

      {/* Resource Heatmap Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {resources.map((res) => {
          const isOver = res.utilizationPercent > 100;
          const isOptimal = res.utilizationPercent >= 80 && res.utilizationPercent <= 100;

          return (
            <div
              key={res.userId}
              className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 space-y-4 shadow-sm backdrop-blur-md transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-100">{res.userName}</h4>
                  <p className="text-xs text-slate-400 font-mono">{res.department} • {res.email}</p>
                </div>
                <span
                  className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${
                    isOver
                      ? 'bg-rose-950/80 text-rose-300 border-rose-800/60'
                      : isOptimal
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60'
                      : 'bg-amber-950/80 text-amber-300 border-amber-800/60'
                  }`}
                >
                  {res.status}
                </span>
              </div>

              {/* Progress Utilization Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">Capacity Utilization</span>
                  <span className={isOver ? 'text-rose-400 font-bold' : 'text-slate-200 font-bold'}>
                    {res.assignedHours}h / {res.weeklyCapacityHours}h ({res.utilizationPercent}%)
                  </span>
                </div>
                <div className="h-2.5 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                  <div
                    style={{ width: `${Math.min(res.utilizationPercent, 100)}%` }}
                    className={`h-full rounded-full transition-all ${
                      isOver ? 'bg-gradient-to-r from-rose-500 to-red-600' : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                    }`}
                  />
                </div>
              </div>

              {/* Skills Tags */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Competencies & Skills</span>
                <div className="flex flex-wrap gap-1.5">
                  {res.skills.map((skill) => (
                    <span
                      key={skill}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Rate Bands */}
              <div className="flex items-center justify-between pt-2 text-xs font-mono text-slate-400 border-t border-slate-800/60">
                <span>Cost: ${res.hourlyCostRate}/h</span>
                <span className="text-emerald-400 font-semibold">Bill: ${res.hourlyBillingRate}/h</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
