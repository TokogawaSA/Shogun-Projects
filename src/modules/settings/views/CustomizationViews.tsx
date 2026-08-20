import React, { useState } from 'react';
import {
  Layers,
  TableProperties,
  ListFilter,
  Hash,
  Plus,
  Save,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { CustomField, FieldType, LayoutBlock, SupportedModule } from '../../../types/settings';

// =========================================================================
// 1. Module Manager View
// =========================================================================
export const ModuleManagerView: React.FC = () => {
  const [activeModules, setActiveModules] = useState<Record<SupportedModule, boolean>>({
    projects: true,
    tasks: true,
    accounts: true,
    contacts: true,
    deals: true,
  });

  const toggleModule = (mod: SupportedModule) => {
    setActiveModules((prev) => ({ ...prev, [mod]: !prev[mod] }));
  };

  const moduleList: { id: SupportedModule; name: string; desc: string; icon: string }[] = [
    { id: 'projects', name: 'Projects Hub', desc: 'Multi-agent project management & workspace registry', icon: '📁' },
    { id: 'tasks', name: 'Kanban & Tasks', desc: 'Collaborative task execution and checklist engine', icon: '📋' },
    { id: 'accounts', name: 'Client Accounts', desc: 'Firmographics, SLA tiers, and account 360 overview', icon: '🏢' },
    { id: 'contacts', name: 'Contacts Directory', desc: 'Key stakeholder relationships and lifecycle stages', icon: '👥' },
    { id: 'deals', name: 'Deals & Pipelines', desc: 'Revenue forecasting and automated project conversion', icon: '💼' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            Module Manager
          </h2>
          <p className="text-xs text-slate-400">
            Enable or disable platform modules for this tenant workspace.
          </p>
        </div>
        <button className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5">
          <Save className="w-3.5 h-3.5" />
          <span>Save Configuration</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {moduleList.map((m) => {
          const isActive = activeModules[m.id];
          return (
            <div
              key={m.id}
              className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-4 backdrop-blur-md"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{m.icon}</span>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    {m.name}
                    {isActive && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                        Active
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-400">{m.desc}</p>
                </div>
              </div>
              <button
                onClick={() => toggleModule(m.id)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                {isActive ? (
                  <ToggleRight className="w-7 h-7 text-indigo-400" />
                ) : (
                  <ToggleLeft className="w-7 h-7 text-slate-600" />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// =========================================================================
// 2. Layout & Fields Editor View
// =========================================================================
export const LayoutFieldsEditorView: React.FC = () => {
  const [selectedModule, setSelectedModule] = useState<string>('deals');

  const blocks: LayoutBlock[] = [
    { blockId: 'blk_core', label: 'Basic Information', sortOrder: 1, isCollapsible: false },
    { blockId: 'blk_financial', label: 'Financial & Pipeline Details', sortOrder: 2, isCollapsible: true },
    { blockId: 'blk_custom', label: 'Custom Attributes', sortOrder: 3, isCollapsible: true },
  ];

  const [fields, setFields] = useState<CustomField[]>([
    { fieldId: 'deal_title', blockId: 'blk_core', label: 'Deal Title', type: 'text', isRequired: true, isUnique: false, sortOrder: 1 },
    { fieldId: 'deal_value', blockId: 'blk_financial', label: 'Deal Value ($)', type: 'currency', isRequired: false, isUnique: false, defaultValue: 0, sortOrder: 2 },
    { fieldId: 'stage', blockId: 'blk_financial', label: 'Pipeline Stage', type: 'picklist', isRequired: true, isUnique: false, picklistValues: ['Discovery', 'Proposal', 'Negotiation', 'Closed Won'], sortOrder: 3 },
    { fieldId: 'lead_source', blockId: 'blk_custom', label: 'Lead Source', type: 'picklist', isRequired: false, isUnique: false, picklistValues: ['Organic', 'Outbound', 'Referral', 'Event'], sortOrder: 4 },
  ]);

  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<FieldType>('text');

  const handleAddField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFieldLabel) return;
    const newField: CustomField = {
      fieldId: `cf_${Date.now()}`,
      blockId: 'blk_custom',
      label: newFieldLabel,
      type: newFieldType,
      isRequired: false,
      isUnique: false,
      sortOrder: fields.length + 1,
    };
    setFields([...fields, newField]);
    setNewFieldLabel('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <TableProperties className="w-5 h-5 text-indigo-400" />
            Layout & Fields Editor
          </h2>
          <p className="text-xs text-slate-400">
            Design form layout blocks, custom fields, and data validation rules for each module.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white font-semibold focus:outline-none focus:border-indigo-500"
          >
            <option value="deals">Deals Module</option>
            <option value="accounts">Accounts Module</option>
            <option value="contacts">Contacts Module</option>
            <option value="projects">Projects Module</option>
            <option value="tasks">Tasks Module</option>
          </select>
          <button className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5">
            <Save className="w-3.5 h-3.5" />
            <span>Save Schema</span>
          </button>
        </div>
      </div>

      {/* Add Custom Field Bar */}
      <form onSubmit={handleAddField} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center gap-3">
        <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Add Field:
        </span>
        <input
          type="text"
          placeholder="Field Label (e.g. Contract Start Date)"
          value={newFieldLabel}
          onChange={(e) => setNewFieldLabel(e.target.value)}
          className="px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 flex-1 min-w-[200px] focus:outline-none focus:border-indigo-500"
        />
        <select
          value={newFieldType}
          onChange={(e) => setNewFieldType(e.target.value as FieldType)}
          className="px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="text">Text (Single Line)</option>
          <option value="number">Number</option>
          <option value="currency">Currency</option>
          <option value="date">Date</option>
          <option value="picklist">Picklist (Dropdown)</option>
          <option value="boolean">Checkbox (Boolean)</option>
          <option value="user">User Reference</option>
        </select>
        <button
          type="submit"
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-white transition-colors"
        >
          Insert Field
        </button>
      </form>

      {/* Layout Blocks */}
      <div className="space-y-4">
        {blocks.map((block) => {
          const blockFields = fields.filter((f) => f.blockId === block.blockId);
          return (
            <div key={block.blockId} className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden backdrop-blur-md">
              <div className="px-4 py-3 bg-slate-800/60 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  {block.label}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">{blockFields.length} fields</span>
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {blockFields.map((field) => (
                  <div
                    key={field.fieldId}
                    className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 flex items-center justify-between gap-2"
                  >
                    <div>
                      <p className="text-xs font-semibold text-white">{field.label}</p>
                      <p className="text-[10px] text-indigo-300 font-mono capitalize">{field.type}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {field.isRequired && (
                        <span className="text-[9px] px-1 rounded bg-rose-500/20 text-rose-300 font-mono">Req</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// =========================================================================
// 3. Picklist Manager View
// =========================================================================
export const PicklistManagerView: React.FC = () => {
  const [options, setOptions] = useState([
    'Discovery & Requirement',
    'Solution Proposal',
    'Executive Negotiation',
    'Closed - Won',
    'Closed - Lost',
  ]);
  const [newOption, setNewOption] = useState('');

  const handleAddOption = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOption) return;
    setOptions([...options, newOption]);
    setNewOption('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <ListFilter className="w-5 h-5 text-indigo-400" />
            Picklist Values & Dependency Manager
          </h2>
          <p className="text-xs text-slate-400">
            Define global dropdown values and option sequences across CRM modules.
          </p>
        </div>
        <button className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5">
          <Save className="w-3.5 h-3.5" />
          <span>Save Picklist</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <label className="text-xs font-bold text-slate-300">Select Field Picklist</label>
          <div className="space-y-1">
            {['deal_stage (Deals)', 'account_tier (Accounts)', 'contact_lifecycle (Contacts)', 'task_priority (Tasks)'].map(
              (p) => (
                <button
                  key={p}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium bg-slate-800/60 hover:bg-slate-800 text-slate-200 transition-colors"
                >
                  {p}
                </button>
              )
            )}
          </div>
        </div>

        <div className="md:col-span-2 p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white">Values List</h3>
          <div className="space-y-2">
            {options.map((opt, idx) => (
              <div
                key={opt}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/60 text-xs text-slate-200"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-500">{idx + 1}.</span>
                  <span>{opt}</span>
                </div>
                <button
                  onClick={() => setOptions(options.filter((_, i) => i !== idx))}
                  className="text-slate-500 hover:text-rose-400 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddOption} className="flex gap-2 pt-2">
            <input
              type="text"
              placeholder="Add new option value"
              value={newOption}
              onChange={(e) => setNewOption(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-colors"
            >
              Add Option
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// 4. Auto-Numbering Sequences View
// =========================================================================
export const AutoNumberingView: React.FC = () => {
  const [sequences, setSequences] = useState({
    deals: { prefix: 'DEAL-', nextNumber: 1042, padZeroes: 5 },
    projects: { prefix: 'PRJ-', nextNumber: 204, padZeroes: 4 },
    accounts: { prefix: 'ACC-', nextNumber: 501, padZeroes: 4 },
    tasks: { prefix: 'TSK-', nextNumber: 8901, padZeroes: 5 },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Hash className="w-5 h-5 text-indigo-400" />
            Auto-Numbering Sequences
          </h2>
          <p className="text-xs text-slate-400">
            Configure record prefix prefixes, padding and auto-incrementing serial numbers.
          </p>
        </div>
        <button className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5">
          <Save className="w-3.5 h-3.5" />
          <span>Save Sequences</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(sequences).map(([key, seq]) => (
          <div key={key} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase font-mono">{key} Sequence</h3>
              <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                Sample: {seq.prefix}{String(seq.nextNumber).padStart(seq.padZeroes, '0')}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-mono">Prefix</label>
                <input
                  type="text"
                  value={seq.prefix}
                  onChange={(e) =>
                    setSequences({
                      ...sequences,
                      [key]: { ...seq, prefix: e.target.value },
                    })
                  }
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-mono">Next Number</label>
                <input
                  type="number"
                  value={seq.nextNumber}
                  onChange={(e) =>
                    setSequences({
                      ...sequences,
                      [key]: { ...seq, nextNumber: Number(e.target.value) },
                    })
                  }
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-mono">Zero Padding</label>
                <input
                  type="number"
                  value={seq.padZeroes}
                  onChange={(e) =>
                    setSequences({
                      ...sequences,
                      [key]: { ...seq, padZeroes: Number(e.target.value) },
                    })
                  }
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white font-mono"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
