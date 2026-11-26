/**
 * Mass Edit Modal Component (VTiger-Style)
 * Enables batch updating selected CRM records via REST API.
 */

import React, { useState } from 'react';
import { apiClient } from '../../../services/api';
import { EntityModuleName, FieldDefinition, PicklistOption } from '../../../types/crmEntities';
import { X, Edit3, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export interface MassEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleName: EntityModuleName;
  selectedIds: string[];
  selectedRecords?: Record<string, any>[];
  fields: FieldDefinition[];
  onSuccess: () => void;
}

export const MassEditModal: React.FC<MassEditModalProps> = ({
  isOpen,
  onClose,
  moduleName,
  selectedIds,
  selectedRecords = [],
  fields,
  onSuccess,
}) => {
  const [selectedFieldName, setSelectedFieldName] = useState<string>('');
  const [fieldValue, setFieldValue] = useState<any>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter only editable fields (exclude readOnly and ID fields)
  const editableFields = fields.filter(
    (f) => !f.isReadOnly && f.name !== 'id' && !f.name.endsWith('Number')
  );

  const activeField = editableFields.find((f) => f.name === selectedFieldName);

  const picklistOptions: { label: string; value: string }[] = (
    activeField?.picklistValues || []
  ).map((opt) => {
    if (typeof opt === 'string') {
      return {
        label: opt.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        value: opt,
      };
    }
    return opt as PicklistOption;
  });

  const handleFieldSelect = (fieldName: string) => {
    setSelectedFieldName(fieldName);
    const field = editableFields.find((f) => f.name === fieldName);
    if (field) {
      if (field.type === 'boolean') {
        setFieldValue(true);
      } else if (field.picklistValues && field.picklistValues.length > 0) {
        const firstVal = typeof field.picklistValues[0] === 'string'
          ? field.picklistValues[0]
          : (field.picklistValues[0] as PicklistOption).value;
        setFieldValue(firstVal);
      } else {
        setFieldValue('');
      }
    }
  };

  const handleExecuteMassUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFieldName || selectedIds.length === 0) return;

    setIsUpdating(true);
    setError(null);

    try {
      const recordMap = new Map(selectedRecords.map((r) => [r.id, r]));
      await Promise.all(
        selectedIds.map((recordId) => {
          const payload: Record<string, any> = {
            updatedAt: new Date().toISOString(),
          };

          if (selectedFieldName.startsWith('customFields.')) {
            const customKey = selectedFieldName.slice('customFields.'.length);
            const existingCustom = recordMap.get(recordId)?.customFields || {};
            payload.customFields = {
              ...existingCustom,
              [customKey]: fieldValue,
            };
          } else {
            payload[selectedFieldName] = fieldValue;
          }

          return apiClient.put(`/crm/${moduleName}/${recordId}`, payload).catch(() => { });
        })
      );

      setIsUpdating(false);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('[MassEditModal Error]:', err);
      setError(err.message || 'Mass update failed.');
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">Mass Edit Records</h2>
              <p className="text-xs text-slate-400">
                Updating <span className="text-indigo-300 font-semibold">{selectedIds.length}</span> selected {moduleName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleExecuteMassUpdate} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Field Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Select Field to Update <span className="text-rose-400">*</span>
            </label>
            <select
              value={selectedFieldName}
              onChange={(e) => handleFieldSelect(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="" disabled>-- Choose a field to edit --</option>
              {editableFields.map((f) => (
                <option key={f.name} value={f.name}>
                  {f.label} ({f.type})
                </option>
              ))}
            </select>
          </div>

          {/* 2. Value Input depending on field type */}
          {selectedFieldName && activeField && (
            <div className="space-y-1.5 pt-2">
              <label className="block text-xs font-medium text-slate-300">
                New Value for <span className="text-indigo-300">{activeField.label}</span>
              </label>

              {activeField.type === 'picklist' ? (
                <select
                  value={fieldValue}
                  onChange={(e) => setFieldValue(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  {picklistOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : activeField.type === 'boolean' ? (
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-700 bg-slate-950/60 cursor-pointer flex-1 text-xs text-slate-200">
                    <input
                      type="radio"
                      name="boolVal"
                      checked={fieldValue === true}
                      onChange={() => setFieldValue(true)}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    Yes / True
                  </label>
                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-700 bg-slate-950/60 cursor-pointer flex-1 text-xs text-slate-200">
                    <input
                      type="radio"
                      name="boolVal"
                      checked={fieldValue === false}
                      onChange={() => setFieldValue(false)}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    No / False
                  </label>
                </div>
              ) : activeField.type === 'number' || activeField.type === 'currency' || activeField.type === 'percentage' ? (
                <input
                  type="number"
                  value={fieldValue}
                  onChange={(e) => setFieldValue(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Enter numeric value..."
                  required={activeField.isRequired}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              ) : activeField.type === 'textarea' ? (
                <textarea
                  value={fieldValue}
                  onChange={(e) => setFieldValue(e.target.value)}
                  rows={3}
                  placeholder="Enter text..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
                />
              ) : (
                <input
                  type="text"
                  value={fieldValue}
                  onChange={(e) => setFieldValue(e.target.value)}
                  placeholder={`Enter new ${activeField.label}...`}
                  required={activeField.isRequired}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              )}
            </div>
          )}

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isUpdating}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 rounded-xl transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedFieldName || isUpdating}
              className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-xl shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Applying Changes...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Apply to {selectedIds.length} Records
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MassEditModal;
