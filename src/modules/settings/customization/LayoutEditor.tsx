import React, { useState, useEffect } from 'react';
import {
  TableProperties,
  Plus,
  Save,
  Trash2,
  ListFilter,
  CheckCircle2,
  Loader2,
  Edit3,
} from 'lucide-react';
import { onSnapshot, doc, setDoc } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { useAuth } from '../../../context/AuthContext';
import {
  LayoutBlock,
  CustomField,
  FieldType,
  ModuleSchema,
  SupportedModule,
} from '../../../types/settings';
import { PicklistEditorModal } from './PicklistEditorModal';

export const LayoutEditor: React.FC = () => {
  const { user } = useAuth();
  const tenantId = user?.tenantId || 'tenant-default';

  const [selectedModule, setSelectedModule] = useState<SupportedModule>('deals');
  const [blocks, setBlocks] = useState<LayoutBlock[]>([]);
  const [fields, setFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // New Block Form
  const [newBlockLabel, setNewBlockLabel] = useState('');

  // New Field Form
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<FieldType>('text');
  const [newFieldBlockId, setNewFieldBlockId] = useState('');
  const [newFieldRequired, setNewFieldRequired] = useState(false);

  // Picklist Modal State
  const [picklistModalOpen, setPicklistModalOpen] = useState(false);
  const [activePicklistField, setActivePicklistField] = useState<CustomField | null>(null);

  // Load Schema for Selected Module
  useEffect(() => {
    setLoading(true);
    const schemaDocRef = doc(db, `tenants/${tenantId}/module_schemas`, selectedModule);

    const unsubscribe = onSnapshot(
      schemaDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as ModuleSchema;
          setBlocks(data.blocks || []);
          setFields(data.fields || []);
          if (data.blocks && data.blocks.length > 0 && !newFieldBlockId) {
            setNewFieldBlockId(data.blocks[0].blockId);
          }
        } else {
          // Default initial schema layout
          const defaultBlocks: LayoutBlock[] = [
            { blockId: 'blk_core', label: 'Primary Information', sortOrder: 1, isCollapsible: false },
            { blockId: 'blk_details', label: 'Detailed & Financial Specifications', sortOrder: 2, isCollapsible: true },
            { blockId: 'blk_custom', label: 'Custom Attributes & Notes', sortOrder: 3, isCollapsible: true },
          ];

          const defaultFields: CustomField[] = [
            { fieldId: 'field_title', blockId: 'blk_core', label: 'Record Title / Name', type: 'text', isRequired: true, isUnique: false, sortOrder: 1 },
            { fieldId: 'field_status', blockId: 'blk_core', label: 'Lifecycle Status', type: 'picklist', isRequired: true, isUnique: false, picklistValues: ['Active', 'Pending', 'Archived'], sortOrder: 2 },
            { fieldId: 'field_value', blockId: 'blk_details', label: 'Estimated Value ($)', type: 'currency', isRequired: false, isUnique: false, defaultValue: 0, sortOrder: 3 },
            { fieldId: 'field_target_date', blockId: 'blk_details', label: 'Target Completion Date', type: 'date', isRequired: false, isUnique: false, sortOrder: 4 },
            { fieldId: 'field_is_flagged', blockId: 'blk_custom', label: 'Priority Escalation Flag', type: 'boolean', isRequired: false, isUnique: false, defaultValue: false, sortOrder: 5 },
          ];

          setBlocks(defaultBlocks);
          setFields(defaultFields);
          setNewFieldBlockId(defaultBlocks[0].blockId);
        }
        setLoading(false);
      },
      () => {
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [tenantId, selectedModule, newFieldBlockId]);

  const handleAddBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlockLabel.trim()) return;

    const newBlock: LayoutBlock = {
      blockId: `blk_${Date.now()}`,
      label: newBlockLabel.trim(),
      sortOrder: blocks.length + 1,
      isCollapsible: true,
    };

    setBlocks([...blocks, newBlock]);
    setNewBlockLabel('');
    if (!newFieldBlockId) {
      setNewFieldBlockId(newBlock.blockId);
    }
  };

  const handleRemoveBlock = (blockId: string) => {
    setBlocks(blocks.filter((b) => b.blockId !== blockId));
    setFields(fields.filter((f) => f.blockId !== blockId));
  };

  const handleAddField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFieldLabel.trim() || !newFieldBlockId) return;

    const newField: CustomField = {
      fieldId: `cf_${Date.now()}`,
      blockId: newFieldBlockId,
      label: newFieldLabel.trim(),
      type: newFieldType,
      isRequired: newFieldRequired,
      isUnique: false,
      sortOrder: fields.length + 1,
      picklistValues: newFieldType === 'picklist' ? ['Option 1', 'Option 2'] : undefined,
    };

    setFields([...fields, newField]);
    setNewFieldLabel('');
    setNewFieldRequired(false);
  };

  const handleRemoveField = (fieldId: string) => {
    setFields(fields.filter((f) => f.fieldId !== fieldId));
  };

  const openPicklistModalForField = (field: CustomField) => {
    setActivePicklistField(field);
    setPicklistModalOpen(true);
  };

  const handleSavePicklistOptions = (updatedValues: string[]) => {
    if (!activePicklistField) return;
    setFields(
      fields.map((f) =>
        f.fieldId === activePicklistField.fieldId ? { ...f, picklistValues: updatedValues } : f
      )
    );
  };

  const handleSaveSchema = async () => {
    setSaving(true);
    setSaveSuccess(false);

    const schemaData: ModuleSchema = {
      moduleName: selectedModule,
      blocks,
      fields,
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(
        doc(db, `tenants/${tenantId}/module_schemas`, selectedModule),
        schemaData,
        { merge: true }
      );
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save module schema:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Module Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <TableProperties className="w-5 h-5 text-indigo-400" />
            Layout & Custom Fields Designer
          </h2>
          <p className="text-xs text-slate-400">
            Configure section blocks, custom field schemas, picklist dependencies, and validation rules.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-xl">
            <span className="text-xs text-slate-400 font-medium">Editing:</span>
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value as SupportedModule)}
              className="bg-transparent text-xs font-bold text-indigo-300 focus:outline-none cursor-pointer"
            >
              <option value="deals">Deals Pipeline</option>
              <option value="accounts">Client Accounts</option>
              <option value="contacts">Contacts Directory</option>
              <option value="projects">Projects Hub</option>
              <option value="tasks">Tasks Board</option>
            </select>
          </div>

          {saveSuccess && (
            <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
              <CheckCircle2 className="w-4 h-4" /> Saved!
            </span>
          )}

          <button
            onClick={handleSaveSchema}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>{saving ? 'Saving Schema...' : 'Save Schema Layout'}</span>
          </button>
        </div>
      </div>

      {/* Add Block & Add Field Toolbars */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Create Block */}
        <form
          onSubmit={handleAddBlock}
          className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-3 backdrop-blur-md"
        >
          <div className="flex-1 space-y-1">
            <label className="text-[11px] font-semibold text-slate-300 font-mono uppercase">
              Add Layout Block
            </label>
            <input
              type="text"
              placeholder="e.g. Warranty & Contract Terms"
              value={newBlockLabel}
              onChange={(e) => setNewBlockLabel(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="mt-4 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-white transition-all flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-400" />
            <span>Create Block</span>
          </button>
        </form>

        {/* Create Custom Field */}
        <form
          onSubmit={handleAddField}
          className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center gap-3 backdrop-blur-md"
        >
          <div className="flex-1 min-w-[140px] space-y-1">
            <label className="text-[11px] font-semibold text-slate-300 font-mono uppercase">
              Field Label
            </label>
            <input
              type="text"
              placeholder="e.g. SLA Response Tier"
              value={newFieldLabel}
              onChange={(e) => setNewFieldLabel(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-300 font-mono uppercase">Type</label>
            <select
              value={newFieldType}
              onChange={(e) => setNewFieldType(e.target.value as FieldType)}
              className="px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-sans"
            >
              <option value="text">Text</option>
              <option value="number">Number</option>
              <option value="currency">Currency ($)</option>
              <option value="date">Date</option>
              <option value="picklist">Picklist</option>
              <option value="boolean">Checkbox</option>
              <option value="user">User Ref</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-300 font-mono uppercase">Block</label>
            <select
              value={newFieldBlockId}
              onChange={(e) => setNewFieldBlockId(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 font-sans"
            >
              {blocks.map((b) => (
                <option key={b.blockId} value={b.blockId}>
                  {b.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="mt-4 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-all flex items-center gap-1 shadow-md shadow-indigo-600/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Insert Field</span>
          </button>
        </form>
      </div>

      {/* Render Layout Blocks */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-400 mx-auto mb-2" />
          <p className="text-xs">Loading schema blocks and attributes...</p>
        </div>
      ) : blocks.length === 0 ? (
        <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-slate-400">
          No layout blocks configured. Create a block above to organize custom fields.
        </div>
      ) : (
        <div className="space-y-5">
          {blocks.map((block) => {
            const blockFields = fields.filter((f) => f.blockId === block.blockId);

            return (
              <div
                key={block.blockId}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden backdrop-blur-md shadow-lg"
              >
                {/* Block Header */}
                <div className="px-5 py-3.5 bg-slate-800/60 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-400" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                      {block.label}
                    </h3>
                    <span className="text-[10px] px-2 py-0.2 rounded-full bg-slate-800 text-slate-400 font-mono">
                      {blockFields.length} field{blockFields.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <button
                    onClick={() => handleRemoveBlock(block.blockId)}
                    className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                    title="Delete Block"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Block Fields Grid */}
                <div className="p-5">
                  {blockFields.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center text-[11px] text-slate-500 font-mono">
                      Drag or insert custom fields into this block.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                      {blockFields.map((field) => (
                        <div
                          key={field.fieldId}
                          className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 hover:border-indigo-500/40 transition-all flex flex-col justify-between gap-3 group/field"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-xs font-bold text-white">{field.label}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] px-2 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono uppercase">
                                  {field.type}
                                </span>
                                {field.isRequired && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-mono font-semibold">
                                    Required
                                  </span>
                                )}
                              </div>
                            </div>

                            <button
                              onClick={() => handleRemoveField(field.fieldId)}
                              className="text-slate-500 hover:text-rose-400 p-1 opacity-60 group-hover/field:opacity-100 transition-opacity"
                              title="Delete Field"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Picklist Option Summary / Trigger */}
                          {field.type === 'picklist' && (
                            <button
                              onClick={() => openPicklistModalForField(field)}
                              className="w-full py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-[11px] font-semibold text-indigo-300 hover:text-white flex items-center justify-between transition-colors"
                            >
                              <span className="flex items-center gap-1.5">
                                <ListFilter className="w-3 h-3 text-indigo-400" />
                                <span>Options ({field.picklistValues?.length || 0})</span>
                              </span>
                              <Edit3 className="w-3 h-3 text-slate-400" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Picklist Editor Modal */}
      {picklistModalOpen && activePicklistField && (
        <PicklistEditorModal
          isOpen={picklistModalOpen}
          onClose={() => setPicklistModalOpen(false)}
          fieldName={activePicklistField.label}
          initialValues={activePicklistField.picklistValues || []}
          onSave={handleSavePicklistOptions}
        />
      )}
    </div>
  );
};

export default LayoutEditor;
