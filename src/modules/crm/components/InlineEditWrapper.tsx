/**
 * Inline Edit Container Component (VTiger-Style)
 * Supports hover-to-reveal edit pencil triggers, double-click editing,
 * keyboard accessibility (Enter to save, Esc to cancel), and optimistic state sync.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Pencil, Check, X, Loader2, HelpCircle } from 'lucide-react';

export interface InlineEditWrapperProps {
  label?: string;
  tooltip?: string;
  isReadOnly?: boolean;
  isRequired?: boolean;
  onSave?: () => Promise<boolean | void> | boolean | void;
  onCancel?: () => void;
  isEditing?: boolean;
  setIsEditing?: (editing: boolean) => void;
  children: (props: {
    isEditing: boolean;
    startEditing: () => void;
    cancelEditing: () => void;
    saveEditing: () => Promise<void>;
    isSaving: boolean;
  }) => React.ReactNode;
  className?: string;
}

export const InlineEditWrapper: React.FC<InlineEditWrapperProps> = ({
  label,
  tooltip,
  isReadOnly = false,
  isRequired = false,
  onSave,
  onCancel,
  isEditing: controlledEditing,
  setIsEditing: setControlledEditing,
  children,
  className = '',
}) => {
  const [internalEditing, setInternalEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isEditing = controlledEditing !== undefined ? controlledEditing : internalEditing;

  const setEditing = (val: boolean) => {
    if (isReadOnly && val) return;
    if (setControlledEditing) {
      setControlledEditing(val);
    } else {
      setInternalEditing(val);
    }
  };

  const startEditing = () => {
    if (!isReadOnly) {
      setEditing(true);
    }
  };

  const cancelEditing = () => {
    setEditing(false);
    if (onCancel) onCancel();
  };

  const saveEditing = async () => {
    if (isSaving || isReadOnly) return;
    setIsSaving(true);
    try {
      if (onSave) {
        await onSave();
      }
      setEditing(false);
    } catch (err) {
      console.error('[InlineEditWrapper] Save error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isEditing) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      cancelEditing();
    } else if (e.key === 'Enter' && !e.shiftKey && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
      e.preventDefault();
      saveEditing();
    }
  };

  // Click outside to cancel or blur handle
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isEditing &&
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        // Option to save or cancel on blur - let's save if modified
        saveEditing();
      }
    };

    if (isEditing) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEditing]);

  return (
    <div
      ref={containerRef}
      onKeyDown={handleKeyDown}
      className={`group relative flex flex-col py-1 px-1.5 rounded-lg transition-colors ${
        isEditing
          ? 'bg-slate-800/80 ring-1 ring-indigo-500/50 shadow-inner'
          : 'hover:bg-slate-800/40'
      } ${className}`}
    >
      {/* Field Label Header */}
      {label && (
        <div className="flex items-center justify-between gap-1 mb-1 text-xs font-medium text-slate-400 select-none">
          <div className="flex items-center gap-1">
            <span>{label}</span>
            {isRequired && <span className="text-rose-400 font-bold">*</span>}
            {tooltip && (
              <span title={tooltip} className="cursor-help text-slate-500 hover:text-slate-300 transition-colors">
                <HelpCircle className="w-3 h-3" />
              </span>
            )}
          </div>

          {/* Hover Action Trigger (Visible when not editing & not read only) */}
          {!isReadOnly && !isEditing && (
            <button
              type="button"
              onClick={startEditing}
              title={`Edit ${label}`}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded text-slate-400 hover:text-indigo-400 hover:bg-slate-700/60 focus:outline-none"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex items-center justify-between gap-2 min-h-[30px]">
        <div
          className="flex-1 min-w-0"
          onDoubleClick={!isReadOnly && !isEditing ? startEditing : undefined}
        >
          {children({
            isEditing,
            startEditing,
            cancelEditing,
            saveEditing,
            isSaving,
          })}
        </div>

        {/* Action Buttons in Active Edit Mode */}
        {isEditing && (
          <div className="flex items-center gap-1 shrink-0 self-start mt-0.5">
            <button
              type="button"
              onClick={saveEditing}
              disabled={isSaving}
              title="Save (Enter)"
              className="p-1 rounded-md bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/40 hover:text-emerald-300 border border-emerald-500/30 transition-all focus:outline-none disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
            </button>
            <button
              type="button"
              onClick={cancelEditing}
              disabled={isSaving}
              title="Cancel (Esc)"
              className="p-1 rounded-md bg-slate-700/50 text-slate-400 hover:bg-rose-500/20 hover:text-rose-300 border border-slate-600/30 transition-all focus:outline-none disabled:opacity-50"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InlineEditWrapper;
