import React, { useState } from 'react';
import { X, Plus, Trash2, ArrowUp, ArrowDown, RotateCcw, Columns3, Check } from 'lucide-react';
import { TaskStatusColumn, DEFAULT_COLUMNS } from '../types';

interface ColumnConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  columns: TaskStatusColumn[];
  onSaveColumns: (columns: TaskStatusColumn[]) => void;
}

const COLOR_OPTIONS = [
  { id: 'slate', name: 'Slate', bg: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
  { id: 'blue', name: 'Blue', bg: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  { id: 'amber', name: 'Amber', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  { id: 'purple', name: 'Purple', bg: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  { id: 'emerald', name: 'Emerald', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  { id: 'rose', name: 'Rose', bg: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
  { id: 'cyan', name: 'Cyan', bg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
  { id: 'indigo', name: 'Indigo', bg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
];

export const ColumnConfigModal: React.FC<ColumnConfigModalProps> = ({
  isOpen,
  onClose,
  columns,
  onSaveColumns,
}) => {
  if (!isOpen) return null;

  const [localColumns, setLocalColumns] = useState<TaskStatusColumn[]>(columns);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnColor, setNewColumnColor] = useState('indigo');

  const handleAddColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColumnName.trim()) return;

    const slug = newColumnName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');

    const id = slug || `col_${Date.now()}`;

    // Prevent duplicate IDs
    let finalId = id;
    let counter = 1;
    while (localColumns.some((c) => c.id === finalId)) {
      finalId = `${id}_${counter++}`;
    }

    const newCol: TaskStatusColumn = {
      id: finalId,
      name: newColumnName.trim(),
      color: newColumnColor,
      order: localColumns.length,
    };

    setLocalColumns([...localColumns, newCol]);
    setNewColumnName('');
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= localColumns.length) return;

    const updated = [...localColumns];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);

    // Reassign order
    const reordered = updated.map((col, idx) => ({ ...col, order: idx }));
    setLocalColumns(reordered);
  };

  const handleRename = (id: string, name: string) => {
    setLocalColumns(
      localColumns.map((c) => (c.id === id ? { ...c, name } : c))
    );
  };

  const handleColorChange = (id: string, color: string) => {
    setLocalColumns(
      localColumns.map((c) => (c.id === id ? { ...c, color } : c))
    );
  };

  const handleDelete = (id: string) => {
    if (localColumns.length <= 1) {
      alert('You must have at least one workflow column.');
      return;
    }
    const updated = localColumns
      .filter((c) => c.id !== id)
      .map((c, idx) => ({ ...c, order: idx }));
    setLocalColumns(updated);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset workflow columns to standard defaults (Backlog, To Do, In Progress, In Review, Done)?')) {
      setLocalColumns(DEFAULT_COLUMNS);
    }
  };

  const handleSave = () => {
    onSaveColumns(localColumns);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Columns3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Workflow Columns</h3>
              <p className="text-[11px] text-slate-400">Customize Kanban stages for this project</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Columns list */}
          <div className="space-y-2">
            {localColumns.map((col, index) => {
              return (
                <div
                  key={col.id}
                  className="flex items-center justify-between gap-2 p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-slate-600 font-mono text-[10px] w-4 text-center">
                      {index + 1}
                    </span>
                    <input
                      type="text"
                      value={col.name}
                      onChange={(e) => handleRename(col.id, e.target.value)}
                      className="bg-transparent text-xs font-semibold text-slate-200 border-b border-transparent hover:border-slate-700 focus:border-indigo-500 focus:outline-none px-1 py-0.5 w-36 truncate"
                    />
                    <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
                      ({col.id})
                    </span>
                  </div>

                  {/* Color selector dropdown */}
                  <select
                    value={col.color || 'slate'}
                    onChange={(e) => handleColorChange(col.id, e.target.value)}
                    className="bg-slate-900 border border-slate-800 text-[11px] text-slate-300 rounded-lg px-2 py-1 focus:outline-none"
                  >
                    {COLOR_OPTIONS.map((co) => (
                      <option key={co.id} value={co.id}>
                        {co.name}
                      </option>
                    ))}
                  </select>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMove(index, 'up')}
                      className="p-1 text-slate-400 hover:text-slate-200 disabled:opacity-30 rounded hover:bg-slate-800"
                      title="Move left/up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === localColumns.length - 1}
                      onClick={() => handleMove(index, 'down')}
                      className="p-1 text-slate-400 hover:text-slate-200 disabled:opacity-30 rounded hover:bg-slate-800"
                      title="Move right/down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(col.id)}
                      className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-rose-500/10 transition-colors ml-1"
                      title="Delete column"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add new column form */}
          <form onSubmit={handleAddColumn} className="pt-3 border-t border-slate-800 flex items-center gap-2">
            <input
              type="text"
              placeholder="New column name (e.g. QA or Testing)..."
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
              className="flex-1 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <select
              value={newColumnColor}
              onChange={(e) => setNewColumnColor(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-xl px-2 py-1.5 focus:outline-none"
            >
              {COLOR_OPTIONS.map((co) => (
                <option key={co.id} value={co.id}>
                  {co.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={!newColumnName.trim()}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </form>
        </div>

        {/* Modal footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Defaults</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply Columns</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
