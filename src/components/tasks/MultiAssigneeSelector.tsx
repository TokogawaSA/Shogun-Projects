import React, { useState } from 'react';
import { Users, Plus, X, Bot, User, Check } from 'lucide-react';
import { TaskAssigneeAllocation } from '../../types';

interface MultiAssigneeSelectorProps {
  assignees?: TaskAssigneeAllocation[];
  onChange: (assignees: TaskAssigneeAllocation[]) => void;
}

const AVAILABLE_TEAM_MEMBERS: TaskAssigneeAllocation[] = [
  {
    userId: 'usr-admin-master',
    displayName: 'Admin Master',
    email: 'admin@shogunate.solutions',
    role: 'Lead Architect',
    allocationPercent: 100,
  },
  {
    userId: 'usr-dev-alex',
    displayName: 'Alex Rivers',
    email: 'alex.rivers@shogunate.solutions',
    role: 'Senior Fullstack Dev',
    allocationPercent: 100,
  },
  {
    userId: 'usr-agent-sentinel',
    displayName: 'Sentinel Agent (AI)',
    email: 'sentinel@antigravity.ai',
    role: 'Logic & Validation Subagent',
    allocationPercent: 100,
  },
  {
    userId: 'usr-agent-worker',
    displayName: 'Worker Agent (AI)',
    email: 'worker@antigravity.ai',
    role: 'Code Generation Subagent',
    allocationPercent: 100,
  },
  {
    userId: 'usr-agent-auditor',
    displayName: 'Auditor Agent (AI)',
    email: 'auditor@antigravity.ai',
    role: 'Security & Quality Subagent',
    allocationPercent: 100,
  },
];

export const MultiAssigneeSelector: React.FC<MultiAssigneeSelectorProps> = ({
  assignees = [],
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const handleToggleAssignee = (member: TaskAssigneeAllocation) => {
    const isAssigned = assignees.some((a) => a.userId === member.userId);
    if (isAssigned) {
      onChange(assignees.filter((a) => a.userId !== member.userId));
    } else {
      onChange([...assignees, member]);
    }
  };

  const filteredMembers = AVAILABLE_TEAM_MEMBERS.filter(
    (m) =>
      m.displayName.toLowerCase().includes(search.toLowerCase()) ||
      m.role?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-1.5 relative">
      <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-indigo-400" />
          Assignees & Agents ({assignees.length})
        </span>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
        >
          <Plus className="w-3 h-3" />
          Manage
        </button>
      </label>

      {/* Render Selected Assignees Pills */}
      <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-950 border border-slate-800 rounded-xl min-h-[38px]">
        {assignees.length === 0 ? (
          <span className="text-xs text-slate-500 italic">Unassigned (Click Manage to assign)</span>
        ) : (
          assignees.map((a) => {
            const isAi = a.userId.startsWith('usr-agent');
            return (
              <span
                key={a.userId}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${
                  isAi
                    ? 'bg-purple-950/40 text-purple-200 border-purple-800/60'
                    : 'bg-indigo-950/40 text-indigo-200 border-indigo-800/60'
                }`}
              >
                {isAi ? (
                  <Bot className="w-3 h-3 text-purple-400" />
                ) : (
                  <User className="w-3 h-3 text-indigo-400" />
                )}
                <span className="truncate max-w-[120px]">{a.displayName}</span>
                <button
                  type="button"
                  onClick={() => handleToggleAssignee(a)}
                  className="text-slate-400 hover:text-white p-0.5 rounded"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })
        )}
      </div>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2.5 space-y-2 animate-in fade-in duration-150">
          <input
            type="text"
            placeholder="Search users or AI agents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />

          <div className="max-h-48 overflow-y-auto space-y-1 custom-scrollbar">
            {filteredMembers.map((member) => {
              const isAssigned = assignees.some((a) => a.userId === member.userId);
              const isAi = member.userId.startsWith('usr-agent');

              return (
                <div
                  key={member.userId}
                  onClick={() => handleToggleAssignee(member)}
                  className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition text-xs ${
                    isAssigned
                      ? 'bg-indigo-600/20 text-indigo-200 border border-indigo-500/40'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`w-6 h-6 rounded-md flex items-center justify-center ${
                        isAi ? 'bg-purple-900/60 text-purple-300' : 'bg-indigo-900/60 text-indigo-300'
                      }`}
                    >
                      {isAi ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{member.displayName}</div>
                      <div className="text-[10px] text-slate-400 truncate">{member.role}</div>
                    </div>
                  </div>

                  {isAssigned && <Check className="w-4 h-4 text-indigo-400 flex-shrink-0" />}
                </div>
              );
            })}
          </div>

          <div className="pt-1 border-t border-slate-800 flex justify-end">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-2.5 py-1 rounded bg-slate-800 text-slate-200 text-xs hover:bg-slate-700"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
