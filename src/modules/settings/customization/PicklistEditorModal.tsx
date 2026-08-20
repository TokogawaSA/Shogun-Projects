import React, { useState } from 'react';
import { ListFilter, Plus, Trash2, X, Save } from 'lucide-react';

interface PicklistEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  fieldName: string;
  initialValues: string[];
  onSave: (values: string[]) => void;
}

export const PicklistEditorModal: React.FC<PicklistEditorModalProps> = ({
  isOpen,
  onClose,
  fieldName,
  initialValues,
  onSave,
}) => {
  const [options, setOptions] = useState<string[]>(initialValues || []);
  const [newOption, setNewOption] = useState('');

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newOption.trim();
    if (!trimmed || options.includes(trimmed)) return;
    setOptions([...options, trimmed]);
    setNewOption('');
  };

  const handleRemove = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= options.length) return;
    const updated = [...options];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIdx, 0, moved);
    setOptions(updated);
  };

  const handleSave = () => {
    onSave(options);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <ListFilter className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">
              Picklist Options: <span className="text-indigo-300 font-mono">{fieldName}</span>
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Add Input */}
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            type="text"
            placeholder="Type new option label..."
            value={newOption}
            onChange={(e) => setNewOption(e.target.value)}
            className="flex-1 px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </form>

        {/* Option List */}
        <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
          {options.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-4">No picklist options configured.</p>
          ) : (
            options.map((opt, idx) => (
              <div
                key={`${opt}-${idx}`}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/60 text-xs text-slate-200"
              >
                <span className="font-medium">{opt}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMove(idx, 'up')}
                    className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    disabled={idx === options.length - 1}
                    onClick={() => handleMove(idx, 'down')}
                    className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                  >
                    ▼
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    className="p-1 text-slate-500 hover:text-rose-400 transition-colors ml-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-indigo-600/20"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Apply Options</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PicklistEditorModal;
