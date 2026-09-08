import React, { useState } from 'react';
import { X, Repeat, CheckCircle2, Calendar } from 'lucide-react';
import { AdvancedRecurrenceConfig, RecurrenceFrequency, RecurrenceTriggerType } from '../../types';

interface AdvancedRecurrenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  config?: AdvancedRecurrenceConfig;
  onChange: (config: AdvancedRecurrenceConfig) => void;
}

const DEFAULT_RECURRENCE: AdvancedRecurrenceConfig = {
  enabled: true,
  triggerType: 'on_schedule',
  frequency: 'weekly',
  interval: 1,
  endCondition: 'never',
  createNewTaskOnRecur: true,
};

export const AdvancedRecurrenceModal: React.FC<AdvancedRecurrenceModalProps> = ({
  isOpen,
  onClose,
  config = DEFAULT_RECURRENCE,
  onChange,
}) => {
  const [localConfig, setLocalConfig] = useState<AdvancedRecurrenceConfig>(config);

  if (!isOpen) return null;

  const handleSave = () => {
    onChange(localConfig);
    onClose();
  };

  const handleDisable = () => {
    onChange({ ...localConfig, enabled: false });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Repeat className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Recurring Task Rules</h3>
              <p className="text-[11px] text-slate-400">Automate recurring project work</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Recurrence Trigger Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Recur Trigger
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  setLocalConfig({ ...localConfig, triggerType: 'on_schedule' as RecurrenceTriggerType })
                }
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition ${
                  localConfig.triggerType === 'on_schedule'
                    ? 'bg-purple-900/30 border-purple-500/80 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs">
                  <Calendar className="w-3.5 h-3.5 text-purple-400" />
                  On Schedule
                </div>
                <span className="text-[10px] text-slate-400">Recur at set calendar intervals</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setLocalConfig({ ...localConfig, triggerType: 'on_completion' as RecurrenceTriggerType })
                }
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition ${
                  localConfig.triggerType === 'on_completion'
                    ? 'bg-purple-900/30 border-purple-500/80 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                  On Completion
                </div>
                <span className="text-[10px] text-slate-400">Recur $N$ days after marked Done</span>
              </button>
            </div>
          </div>

          {/* Frequency & Interval */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Repeats</label>
              <select
                value={localConfig.frequency}
                onChange={(e) =>
                  setLocalConfig({
                    ...localConfig,
                    frequency: e.target.value as RecurrenceFrequency,
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Interval (Every)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={localConfig.interval}
                  onChange={(e) =>
                    setLocalConfig({ ...localConfig, interval: Math.max(1, Number(e.target.value)) })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                />
                <span className="text-xs text-slate-400 font-medium capitalize">
                  {localConfig.frequency === 'daily'
                    ? 'Days'
                    : localConfig.frequency === 'weekly'
                    ? 'Weeks'
                    : 'Months'}
                </span>
              </div>
            </div>
          </div>

          {/* Behavior on Recur */}
          <div className="space-y-2 p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <div className="text-[11px] font-semibold text-slate-300">Action on Recur</div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="recur_action"
                checked={localConfig.createNewTaskOnRecur}
                onChange={() => setLocalConfig({ ...localConfig, createNewTaskOnRecur: true })}
                className="text-purple-600 focus:ring-0"
              />
              <span className="text-xs text-slate-200">
                Create new task clone (Keep history intact)
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="recur_action"
                checked={!localConfig.createNewTaskOnRecur}
                onChange={() => setLocalConfig({ ...localConfig, createNewTaskOnRecur: false })}
                className="text-purple-600 focus:ring-0"
              />
              <span className="text-xs text-slate-200">
                Reset status to "To Do" and shift due date
              </span>
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/40">
          <button
            type="button"
            onClick={handleDisable}
            className="px-3 py-1.5 rounded-xl text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition font-medium"
          >
            Disable Recurrence
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 text-white hover:bg-purple-500 shadow-md shadow-purple-500/20"
            >
              Save Rule
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
