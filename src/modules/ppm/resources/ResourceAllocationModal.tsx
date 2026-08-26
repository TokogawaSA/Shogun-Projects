import React, { useState } from 'react';
import { 
  X, 
  UserCheck, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRightLeft, 
  Clock, 
  Sparkles,
  ShieldAlert,
  Loader2
} from 'lucide-react';
import { apiClient } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { WorkloadSummary, WorkloadTaskDetail } from '../hooks/useResourceCapacity';
import { SkillMatrix } from '../../../types';

interface ResourceAllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: WorkloadTaskDetail | null;
  workloads: Record<string, WorkloadSummary>;
  skills: SkillMatrix[];
  onSuccess?: () => void;
}

export const ResourceAllocationModal: React.FC<ResourceAllocationModalProps> = ({
  isOpen,
  onClose,
  task,
  workloads,
  skills,
  onSuccess,
}) => {
  const { user } = useAuth();
  const tenantId = user?.tenantId || 'tenant-default';

  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!isOpen || !task) return null;

  const currentAssignee = Object.values(workloads).find((w) =>
    w.tasks.some((t) => t.taskId === task.taskId)
  );

  const skillNameMap = new Map<string, string>();
  skills.forEach((s) => skillNameMap.set(s.skillId, s.name));

  const candidateList = Object.values(workloads).map((member) => {
    const isCurrent = member.userId === currentAssignee?.userId;
    const taskHours = task.estimatedHours || 8;
    const projectedHours = isCurrent ? member.assignedHours : member.assignedHours + taskHours;
    const projectedUtilization = Math.round((projectedHours / (member.weeklyCapacityHours || 40)) * 100);
    const wouldBeOverallocated = projectedHours > member.weeklyCapacityHours;

    // Check skill match
    const categoryMatches = member.skills.some((skId) => {
      const skName = skillNameMap.get(skId) || '';
      return skName.toLowerCase().includes(task.category?.toLowerCase() || '') ||
        (task.category?.toLowerCase().includes('interface') && skName.toLowerCase().includes('react')) ||
        (task.category?.toLowerCase().includes('serverless') && skName.toLowerCase().includes('node')) ||
        (task.category?.toLowerCase().includes('database') && skName.toLowerCase().includes('gcp'));
    });

    return {
      ...member,
      isCurrent,
      projectedHours,
      projectedUtilization,
      wouldBeOverallocated,
      categoryMatches,
    };
  });

  const handleReassign = async () => {
    if (!selectedAssigneeId || selectedAssigneeId === currentAssignee?.userId) {
      setSubmitError('Please select a different team member to rebalance this task.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // 1. Update task via REST API
      await apiClient.put(`/projects/tasks/${task.taskId}`, {
        assigneeId: selectedAssigneeId,
        updatedAt: new Date().toISOString(),
      });

      // 2. Add audit trail entry in project activity logs
      const targetUser = workloads[selectedAssigneeId];
      await apiClient.post(`/projects/${task.projectId}/activity_logs`, {
        eventType: 'TASK_REASSIGNED_PPM_CAPACITY',
        taskId: task.taskId,
        taskTitle: task.taskTitle,
        previousAssigneeId: currentAssignee?.userId || 'unassigned',
        newAssigneeId: selectedAssigneeId,
        newAssigneeName: targetUser?.displayName || selectedAssigneeId,
        performedBy: user?.displayName || user?.email || 'Resource Manager',
        tenantId,
        createdAt: new Date().toISOString(),
        metadata: {
          estimatedHours: task.estimatedHours,
          reason: 'PPM Resource Capacity Rebalancing',
        },
      }).catch(() => {});

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err: any) {
      console.error('[ResourceAllocationModal Error]:', err);
      setSubmitError(err.message || 'Failed to reassign task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Resource Reallocation & Task Rebalancing
              </h2>
              <p className="text-xs text-slate-400">
                Optimize team capacity & eliminate single-engineer bottlenecks
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Task Info Summary */}
        <div className="p-6 bg-slate-950/30 border-b border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {task.projectTitle}
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Weight: <strong className="text-white">{task.estimatedHours}h</strong>
            </span>
          </div>
          <h3 className="text-sm font-semibold text-white">{task.taskTitle}</h3>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span>
              Category: <span className="text-slate-300">{task.category || 'General'}</span>
            </span>
            <span>
              Priority: <span className="text-amber-400 capitalize">{task.priority}</span>
            </span>
            <span>
              Current Assignee:{' '}
              <strong className="text-indigo-300">
                {currentAssignee?.displayName || 'Unassigned'}
              </strong>
            </span>
          </div>
        </div>

        {/* Error Alert */}
        {submitError && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        {/* Candidate List */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
            <span>Select Optimal Candidate</span>
            <span className="text-[11px] font-mono text-slate-400">
              {candidateList.length} Team Members Evaluated
            </span>
          </div>

          <div className="space-y-2.5">
            {candidateList.map((candidate) => {
              const isSelected = selectedAssigneeId === candidate.userId;
              const isCurrent = candidate.isCurrent;

              return (
                <div
                  key={candidate.userId}
                  onClick={() => !isCurrent && setSelectedAssigneeId(candidate.userId)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-slate-900/40 border-slate-800/60 opacity-60 cursor-not-allowed'
                      : isSelected
                      ? 'bg-indigo-600/15 border-indigo-500 ring-1 ring-indigo-500/50 shadow-md'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-xs text-indigo-300 border border-slate-700">
                        {candidate.displayName
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-white">
                            {candidate.displayName}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-700 text-slate-300 font-mono">
                              Current Assignee
                            </span>
                          )}
                          {candidate.categoryMatches && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5" /> Skill Match
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400">{candidate.department}</p>
                      </div>
                    </div>

                    {/* Capacity & Impact Gauge */}
                    <div className="text-right flex items-center gap-4">
                      <div>
                        <div className="flex items-center justify-end gap-1.5 text-xs">
                          <span className="text-slate-400">Projected:</span>
                          <span
                            className={`font-semibold ${
                              candidate.wouldBeOverallocated
                                ? 'text-rose-400'
                                : candidate.projectedUtilization >= 80
                                ? 'text-amber-400'
                                : 'text-emerald-400'
                            }`}
                          >
                            {candidate.projectedHours}h / {candidate.weeklyCapacityHours}h (
                            {candidate.projectedUtilization}%)
                          </span>
                        </div>
                        <div className="w-28 h-1.5 bg-slate-800 rounded-full mt-1.5 overflow-hidden ml-auto">
                          <div
                            className={`h-full rounded-full transition-all ${
                              candidate.wouldBeOverallocated
                                ? 'bg-rose-500'
                                : candidate.projectedUtilization >= 80
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{
                              width: `${Math.min(100, candidate.projectedUtilization)}%`,
                            }}
                          />
                        </div>
                      </div>

                      {candidate.wouldBeOverallocated && (
                        <div title="Burnout Risk: Candidate will exceed weekly capacity limit">
                          <ShieldAlert className="w-4 h-4 text-rose-400 animate-pulse" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            {selectedAssigneeId ? (
              <span className="text-indigo-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                Target assignee selected
              </span>
            ) : (
              <span>Select an available engineer above</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleReassign}
              disabled={!selectedAssigneeId || isSubmitting}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Rebalancing Workload...
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
                  Confirm Reassignment
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
