import React, { useState } from 'react';
import { 
  Plus, 
  Hash, 
  Type, 
  Calendar, 
  DollarSign, 
  CheckSquare, 
  Star, 
  Tag, 
  Trash2,
  SlidersHorizontal 
} from 'lucide-react';
import { CustomFieldDefinition, CustomFieldType } from '../../types';

interface CustomFieldsPanelProps {
  customFields?: Record<string, any>;
  onChange: (fields: Record<string, any>) => void;
  availableDefinitions?: CustomFieldDefinition[];
}

const DEFAULT_DEFINITIONS: CustomFieldDefinition[] = [
  {
    id: 'cf-sprint-points',
    name: 'Story Points',
    type: 'number',
    defaultValue: 3,
  },
  {
    id: 'cf-environment',
    name: 'Environment',
    type: 'picklist',
    options: [
      { id: 'opt-dev', label: 'Development', colorHex: '#3b82f6' },
      { id: 'opt-stage', label: 'Staging', colorHex: '#8b5cf6' },
      { id: 'opt-prod', label: 'Production', colorHex: '#ef4444' },
    ],
  },
  {
    id: 'cf-budget-cap',
    name: 'Allocated Budget',
    type: 'currency',
    currencySymbol: '$',
    defaultValue: 1500,
  },
  {
    id: 'cf-qa-signoff',
    name: 'QA Signoff',
    type: 'checkbox',
    defaultValue: false,
  },
  {
    id: 'cf-client-impact',
    name: 'Client Impact',
    type: 'rating',
    ratingMax: 5,
    defaultValue: 4,
  },
];

export const CustomFieldsPanel: React.FC<CustomFieldsPanelProps> = ({
  customFields = {},
  onChange,
  availableDefinitions = DEFAULT_DEFINITIONS,
}) => {
  const [fields, setFields] = useState<Record<string, any>>(customFields);
  const [isAddingField, setIsAddingField] = useState(false);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState<CustomFieldType>('text');

  const handleValueChange = (fieldId: string, val: any) => {
    const updated = { ...fields, [fieldId]: val };
    setFields(updated);
    onChange(updated);
  };

  const handleAddNewCustomField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFieldName.trim()) return;

    const newId = `cf-${Date.now().toString(36)}`;
    const defaultValue = newFieldType === 'checkbox' ? false : newFieldType === 'number' ? 0 : '';
    const updated = { ...fields, [newId]: defaultValue };
    setFields(updated);
    onChange(updated);
    setNewFieldName('');
    setIsAddingField(false);
  };

  const handleRemoveField = (fieldId: string) => {
    const updated = { ...fields };
    delete updated[fieldId];
    setFields(updated);
    onChange(updated);
  };

  const getFieldIcon = (type: CustomFieldType) => {
    switch (type) {
      case 'number':
        return <Hash className="w-3.5 h-3.5 text-blue-400" />;
      case 'currency':
        return <DollarSign className="w-3.5 h-3.5 text-emerald-400" />;
      case 'picklist':
        return <Tag className="w-3.5 h-3.5 text-purple-400" />;
      case 'date':
        return <Calendar className="w-3.5 h-3.5 text-amber-400" />;
      case 'checkbox':
        return <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />;
      case 'rating':
        return <Star className="w-3.5 h-3.5 text-yellow-400" />;
      default:
        return <Type className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Custom Fields
          </span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-900/40 text-indigo-300 font-mono">
            {Object.keys(fields).length} Active
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsAddingField(!isAddingField)}
          className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium transition"
        >
          <Plus className="w-3 h-3" />
          Add Field
        </button>
      </div>

      {/* Add New Field Inline Form */}
      {isAddingField && (
        <form
          onSubmit={handleAddNewCustomField}
          className="p-3 bg-slate-900 border border-indigo-500/30 rounded-xl space-y-2.5 animate-in fade-in duration-150"
        >
          <div className="text-[11px] font-semibold text-slate-300">New Custom Field Definition</div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              required
              placeholder="Field name (e.g. Sprint Goal)"
              value={newFieldName}
              onChange={(e) => setNewFieldName(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
            <select
              value={newFieldType}
              onChange={(e) => setNewFieldType(e.target.value as CustomFieldType)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="text">Text</option>
              <option value="number">Number</option>
              <option value="currency">Currency ($)</option>
              <option value="date">Date</option>
              <option value="checkbox">Checkbox (Boolean)</option>
              <option value="rating">Rating (1-5)</option>
            </select>
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddingField(false)}
              className="px-2.5 py-1 rounded text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1 rounded bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500"
            >
              Save Field
            </button>
          </div>
        </form>
      )}

      {/* Render Active Custom Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        {availableDefinitions.map((def) => {
          const currentVal = fields[def.id] ?? def.defaultValue ?? '';

          return (
            <div
              key={def.id}
              className="flex flex-col gap-1 p-2.5 bg-slate-900/70 border border-slate-800/80 rounded-xl hover:border-slate-700 transition"
            >
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                <div className="flex items-center gap-1.5">
                  {getFieldIcon(def.type)}
                  <span>{def.name}</span>
                </div>
                {fields[def.id] !== undefined && (
                  <button
                    type="button"
                    onClick={() => handleRemoveField(def.id)}
                    className="text-slate-500 hover:text-rose-400 p-0.5"
                    title="Clear field value"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Dynamic Field Inputs */}
              {def.type === 'picklist' && def.options ? (
                <select
                  value={currentVal}
                  onChange={(e) => handleValueChange(def.id, e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Select option...</option>
                  {def.options.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : def.type === 'checkbox' ? (
                <label className="flex items-center gap-2 cursor-pointer py-1">
                  <input
                    type="checkbox"
                    checked={Boolean(currentVal)}
                    onChange={(e) => handleValueChange(def.id, e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-0"
                  />
                  <span className="text-xs text-slate-300">
                    {currentVal ? 'Verified / Yes' : 'Pending verification'}
                  </span>
                </label>
              ) : def.type === 'rating' ? (
                <div className="flex items-center gap-1 py-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleValueChange(def.id, star)}
                      className="p-0.5 focus:outline-none"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          star <= Number(currentVal || 0)
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-slate-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              ) : def.type === 'currency' ? (
                <div className="relative">
                  <span className="absolute left-2.5 top-1.5 text-xs text-slate-400 font-mono">
                    {def.currencySymbol || '$'}
                  </span>
                  <input
                    type="number"
                    value={currentVal}
                    onChange={(e) => handleValueChange(def.id, Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-6 pr-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              ) : def.type === 'date' ? (
                <input
                  type="date"
                  value={currentVal}
                  onChange={(e) => handleValueChange(def.id, e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              ) : (
                <input
                  type={def.type === 'number' ? 'number' : 'text'}
                  value={currentVal}
                  placeholder={`Enter ${def.name.toLowerCase()}...`}
                  onChange={(e) => handleValueChange(def.id, e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
