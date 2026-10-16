import React, { useState } from 'react';
import {
  X,
  Layers,
  GitBranch,
  Workflow,
  Play,
  Code,
  Plus,
  Trash2,
  Check,
  Copy,
  Sliders,
  Sparkles,
} from 'lucide-react';
import {
  WebForm,
  WebFormField,
  FormConditionalRule,
  FormFieldType,
  FormRoutingRule,
  TargetModuleType,
  FormConditionPredicate,
  FormFieldOption,
} from '../../../types/form';
import { formService } from '../../../services/formService';
import {
  evaluateFormConditionalLogic,
  findMatchingRoutingRule,
  resolveFormMergeTags,
} from '../../../utils/formConditionalEngine';

interface WebFormBuilderModalProps {
  form: WebForm | null;
  onClose: () => void;
  onSave: (savedForm: WebForm) => void;
}

export const WebFormBuilderModal: React.FC<WebFormBuilderModalProps> = ({
  form: initialForm,
  onClose,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<'fields' | 'conditional' | 'routing' | 'sandbox' | 'embed'>('fields');
  const [saving, setSaving] = useState(false);
  const [copiedType, setCopiedType] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<WebForm>(
    initialForm || {
      id: `form_${Date.now()}`,
      tenantId: 'tenant-default',
      title: 'New Web Intake Form',
      description: 'Capture inbound inquiries and route conditionally to CRM or Projects.',
      slug: `form-${Date.now()}`,
      status: 'published',
      fields: [
        {
          id: 'client_name',
          label: 'Client / Contact Name',
          type: 'text',
          placeholder: 'John Doe',
          required: true,
          width: 'half',
        },
        {
          id: 'email',
          label: 'Corporate Email',
          type: 'email',
          placeholder: 'john@example.com',
          required: true,
          width: 'half',
        },
        {
          id: 'inquiry_type',
          label: 'Engagement Category',
          type: 'select',
          required: true,
          width: 'full',
          options: [
            { label: 'New Project Engagement', value: 'project' },
            { label: 'Technical Support Ticket', value: 'support' },
            { label: 'General Sales Inquiry', value: 'sales' },
          ],
        },
        {
          id: 'project_scope',
          label: 'Detailed Requirements',
          type: 'textarea',
          placeholder: 'Please describe the objectives and requirements...',
          required: true,
          width: 'full',
        },
      ],
      conditionalRules: [],
      routing: {
        defaultRoute: {
          targetModule: 'leads',
          fieldMappings: {
            firstName: '{{client_name}}',
            email: '{{email}}',
            description: '{{project_scope}}',
          },
        },
        conditionalRoutes: [],
      },
      styling: {
        primaryColor: '#6366f1',
        theme: 'dark',
        layout: 'card',
      },
      submitButtonText: 'Submit Inquiry',
      successMessage: 'Thank you! Your submission has been routed into our operations workflow.',
      submissionsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  );

  // Sandbox Live Test State
  const [sandboxValues, setSandboxValues] = useState<Record<string, any>>({});
  const [sandboxSimResult, setSandboxSimResult] = useState<any | null>(null);

  // Field editing state
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(
    formData.fields[0]?.id || null
  );

  const selectedField = formData.fields.find((f: WebFormField) => f.id === selectedFieldId);

  // Handlers for Fields
  const addField = () => {
    const newFieldId = `field_${Date.now()}`;
    const newField: WebFormField = {
      id: newFieldId,
      label: 'New Question',
      type: 'text',
      placeholder: 'Enter response...',
      required: false,
      width: 'full',
    };
    setFormData((prev: WebForm) => ({
      ...prev,
      fields: [...prev.fields, newField],
    }));
    setSelectedFieldId(newFieldId);
  };

  const removeField = (fieldId: string) => {
    setFormData((prev: WebForm) => ({
      ...prev,
      fields: prev.fields.filter((f: WebFormField) => f.id !== fieldId),
      conditionalRules: prev.conditionalRules.filter(
        (r: FormConditionalRule) =>
          r.targetFieldId !== fieldId &&
          !r.conditions.some((c: FormConditionPredicate) => c.fieldId === fieldId)
      ),
    }));
    if (selectedFieldId === fieldId) {
      setSelectedFieldId(formData.fields.find((f: WebFormField) => f.id !== fieldId)?.id || null);
    }
  };

  const updateSelectedField = (updates: Partial<WebFormField>) => {
    if (!selectedFieldId) return;
    setFormData((prev: WebForm) => ({
      ...prev,
      fields: prev.fields.map((f: WebFormField) => (f.id === selectedFieldId ? { ...f, ...updates } : f)),
    }));
  };

  // Handlers for Conditional Logic
  const addConditionalRule = () => {
    const newRule: FormConditionalRule = {
      id: `rule_${Date.now()}`,
      targetFieldId: formData.fields[0]?.id || '',
      action: 'show',
      combinator: 'AND',
      conditions: [
        {
          fieldId: formData.fields[0]?.id || '',
          operator: 'equals',
          value: '',
        },
      ],
    };
    setFormData((prev: WebForm) => ({
      ...prev,
      conditionalRules: [...prev.conditionalRules, newRule],
    }));
  };

  const updateRule = (ruleId: string, updates: Partial<FormConditionalRule>) => {
    setFormData((prev: WebForm) => ({
      ...prev,
      conditionalRules: prev.conditionalRules.map((r: FormConditionalRule) =>
        r.id === ruleId ? { ...r, ...updates } : r
      ),
    }));
  };

  const removeRule = (ruleId: string) => {
    setFormData((prev: WebForm) => ({
      ...prev,
      conditionalRules: prev.conditionalRules.filter((r: FormConditionalRule) => r.id !== ruleId),
    }));
  };

  const addRulePredicate = (ruleId: string) => {
    setFormData((prev: WebForm) => ({
      ...prev,
      conditionalRules: prev.conditionalRules.map((r: FormConditionalRule) => {
        if (r.id !== ruleId) return r;
        return {
          ...r,
          conditions: [
            ...r.conditions,
            { fieldId: formData.fields[0]?.id || '', operator: 'equals', value: '' },
          ],
        };
      }),
    }));
  };

  const removeRulePredicate = (ruleId: string, predicateIndex: number) => {
    setFormData((prev: WebForm) => ({
      ...prev,
      conditionalRules: prev.conditionalRules.map((r: FormConditionalRule) => {
        if (r.id !== ruleId) return r;
        return {
          ...r,
          conditions: r.conditions.filter((_: FormConditionPredicate, idx: number) => idx !== predicateIndex),
        };
      }),
    }));
  };

  // Handlers for Routing Rules
  const addRoutingRule = () => {
    const newRule: FormRoutingRule = {
      id: `route_${Date.now()}`,
      name: 'Custom Routing Branch',
      priority: (formData.routing.conditionalRoutes.length + 1) * 10,
      combinator: 'AND',
      conditions: [
        {
          fieldId: formData.fields[0]?.id || '',
          operator: 'equals',
          value: '',
        },
      ],
      action: {
        targetModule: 'projects',
        fieldMappings: {
          title: '{{client_name}} - Project Delivery',
          description: '{{project_scope}}',
        },
        createSecondaryProject: false,
      },
    };
    setFormData((prev: WebForm) => ({
      ...prev,
      routing: {
        ...prev.routing,
        conditionalRoutes: [...prev.routing.conditionalRoutes, newRule],
      },
    }));
  };

  const removeRoutingRule = (ruleId: string) => {
    setFormData((prev: WebForm) => ({
      ...prev,
      routing: {
        ...prev.routing,
        conditionalRoutes: prev.routing.conditionalRoutes.filter((r: FormRoutingRule) => r.id !== ruleId),
      },
    }));
  };

  const updateRoutingRule = (ruleId: string, updates: Partial<FormRoutingRule>) => {
    setFormData((prev: WebForm) => ({
      ...prev,
      routing: {
        ...prev.routing,
        conditionalRoutes: prev.routing.conditionalRoutes.map((r: FormRoutingRule) =>
          r.id === ruleId ? { ...r, ...updates } : r
        ),
      },
    }));
  };

  // Save Form
  const handleSave = async () => {
    setSaving(true);
    try {
      let saved: WebForm;
      if (initialForm?.id) {
        saved = await formService.updateForm(initialForm.id, formData);
      } else {
        saved = await formService.createForm(formData);
      }
      onSave(saved);
      onClose();
    } catch (err: any) {
      alert(`Save error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Sandbox simulation
  const runSandboxSimulation = () => {
    const evalResult = evaluateFormConditionalLogic(
      formData.fields,
      sandboxValues,
      formData.conditionalRules
    );
    const matchedRule = findMatchingRoutingRule(formData.routing, sandboxValues);
    const selectedRoute = matchedRule ? matchedRule.action : formData.routing.defaultRoute;

    setSandboxSimResult({
      evaluatedConditions: evalResult.activeRuleIds,
      visibleFields: Object.keys(evalResult.visibility).filter((k) => evalResult.visibility[k]),
      matchedRule: matchedRule ? matchedRule.name : 'Default Route (Fallback)',
      targetModule: selectedRoute.targetModule,
      resolvedMappings: Object.entries(selectedRoute.fieldMappings || {}).reduce(
        (acc: any, [k, v]) => {
          acc[k] = resolveFormMergeTags(v, sandboxValues);
          return acc;
        },
        {}
      ),
      triggerWorkflowId: selectedRoute.triggerWorkflowId,
      willCreateSecondaryProject: selectedRoute.createSecondaryProject,
    });
  };

  // Embed copy snippet
  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const publicUrl = `${window.location.origin}/forms/${formData.slug || formData.id}`;
  const iframeSnippet = `<iframe src="${publicUrl}" width="100%" height="700" frameborder="0" style="border:none; border-radius:12px; max-width:800px;"></iframe>`;

  // Dynamic evaluation for sandbox preview
  const sandboxEval = evaluateFormConditionalLogic(
    formData.fields,
    sandboxValues,
    formData.conditionalRules
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-6xl h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header Bar */}
        <div className="px-6 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="text-sm font-bold text-slate-100 bg-transparent border-b border-transparent hover:border-slate-700 focus:border-indigo-500 focus:outline-none px-1"
                />
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                  {formData.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono px-1">
                Slug: /forms/{formData.slug}
              </p>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 text-xs">
            <button
              onClick={() => setActiveTab('fields')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'fields'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              Fields ({formData.fields.length})
            </button>
            <button
              onClick={() => setActiveTab('conditional')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'conditional'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              Conditional Logic ({formData.conditionalRules.length})
            </button>
            <button
              onClick={() => setActiveTab('routing')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'routing'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Workflow className="w-3.5 h-3.5" />
              Workflow Routing ({formData.routing.conditionalRoutes.length + 1})
            </button>
            <button
              onClick={() => {
                setActiveTab('sandbox');
                runSandboxSimulation();
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'sandbox'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              Live Sandbox
            </button>
            <button
              onClick={() => setActiveTab('embed')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'embed'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              Embed & Share
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Form & Matrix'}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6 bg-slate-950/40">
          {/* ========================================================================= */}
          {/* TAB 1: FORM FIELDS CANVAS                                                 */}
          {/* ========================================================================= */}
          {activeTab === 'fields' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-full">
              {/* Left Column: Field Sequence List */}
              <div className="md:col-span-5 flex flex-col space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                    Form Questions & Inputs
                  </h3>
                  <button
                    onClick={addField}
                    className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-semibold transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Field
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {formData.fields.map((field: WebFormField, idx: number) => {
                    const isSelected = selectedFieldId === field.id;
                    const hasRule = formData.conditionalRules.some(
                      (r: FormConditionalRule) => r.targetFieldId === field.id
                    );

                    return (
                      <div
                        key={field.id}
                        onClick={() => setSelectedFieldId(field.id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-indigo-600/10 border-indigo-500 text-slate-100 shadow-sm'
                            : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/50 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-xs font-mono text-slate-500 font-bold w-4">
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold truncate">{field.label}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                                {field.type}
                              </span>
                              {field.required && (
                                <span className="text-[10px] text-rose-400 font-mono font-semibold">
                                  Required
                                </span>
                              )}
                              {hasRule && (
                                <span className="text-[10px] text-amber-400 font-mono flex items-center gap-0.5">
                                  <GitBranch className="w-2.5 h-2.5" /> Dynamic
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeField(field.id);
                            }}
                            className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Field Properties Inspector */}
              <div className="md:col-span-7 bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex flex-col space-y-4">
                {selectedField ? (
                  <>
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <h4 className="text-sm font-bold text-slate-100">{selectedField.label}</h4>
                        <p className="text-[11px] text-slate-400 font-mono">
                          ID: <span className="text-indigo-400">{selectedField.id}</span>
                        </p>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono uppercase">
                        {selectedField.type} Input
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="text-xs text-slate-400 font-medium block mb-1">
                          Field Question / Label
                        </label>
                        <input
                          type="text"
                          value={selectedField.label}
                          onChange={(e) => updateSelectedField({ label: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-slate-400 font-medium block mb-1">
                          Input Type
                        </label>
                        <select
                          value={selectedField.type}
                          onChange={(e) =>
                            updateSelectedField({ type: e.target.value as FormFieldType })
                          }
                          className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                        >
                          <option value="text">Single-line Text</option>
                          <option value="email">Email Address</option>
                          <option value="phone">Phone Number</option>
                          <option value="number">Numeric Value / Budget</option>
                          <option value="select">Dropdown Select</option>
                          <option value="textarea">Paragraph / Multi-line Text</option>
                          <option value="date">Date Picker</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs text-slate-400 font-medium block mb-1">
                          Layout Width
                        </label>
                        <select
                          value={selectedField.width || 'full'}
                          onChange={(e) =>
                            updateSelectedField({ width: e.target.value as 'half' | 'full' })
                          }
                          className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                        >
                          <option value="full">Full Width (100%)</option>
                          <option value="half">Half Width (50%)</option>
                        </select>
                      </div>

                      <div className="col-span-2">
                        <label className="text-xs text-slate-400 font-medium block mb-1">
                          Placeholder Text
                        </label>
                        <input
                          type="text"
                          value={selectedField.placeholder || ''}
                          onChange={(e) => updateSelectedField({ placeholder: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="text-xs text-slate-400 font-medium block mb-1">
                          Helper / Advisory Text
                        </label>
                        <input
                          type="text"
                          value={selectedField.helpText || ''}
                          onChange={(e) => updateSelectedField({ helpText: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                          placeholder="Displayed below field to guide respondent..."
                        />
                      </div>

                      {/* Options for Select */}
                      {selectedField.type === 'select' && (
                        <div className="col-span-2 space-y-2 pt-2 border-t border-slate-800">
                          <div className="flex items-center justify-between">
                            <label className="text-xs text-slate-300 font-semibold block">
                              Dropdown Picklist Options
                            </label>
                            <button
                              onClick={() => {
                                const cur = selectedField.options || [];
                                updateSelectedField({
                                  options: [
                                    ...cur,
                                    { label: `Option ${cur.length + 1}`, value: `opt_${Date.now()}` },
                                  ],
                                });
                              }}
                              className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" /> Add Choice
                            </button>
                          </div>

                          <div className="space-y-1.5 max-h-40 overflow-y-auto">
                            {(selectedField.options || []).map((opt: FormFieldOption, optIdx: number) => (
                              <div key={optIdx} className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={opt.label}
                                  onChange={(e) => {
                                    const next = [...(selectedField.options || [])];
                                    next[optIdx] = {
                                      ...next[optIdx],
                                      label: e.target.value,
                                      value: e.target.value.toLowerCase().replace(/\s+/g, '_'),
                                    };
                                    updateSelectedField({ options: next });
                                  }}
                                  placeholder="Option Label"
                                  className="flex-1 px-2.5 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-slate-100"
                                />
                                <span className="text-[10px] font-mono text-slate-500">
                                  val: {opt.value}
                                </span>
                                <button
                                  onClick={() => {
                                    const next = (selectedField.options || []).filter(
                                      (_: FormFieldOption, i: number) => i !== optIdx
                                    );
                                    updateSelectedField({ options: next });
                                  }}
                                  className="p-1 text-slate-500 hover:text-rose-400"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="col-span-2 pt-3 border-t border-slate-800 flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-200">
                          <input
                            type="checkbox"
                            checked={selectedField.required}
                            onChange={(e) => updateSelectedField({ required: e.target.checked })}
                            className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
                          />
                          <span>Mandatory Field (Required by default)</span>
                        </label>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono">
                    Select a field from the left to configure its schema.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: CONDITIONAL LOGIC MATRIX                                           */}
          {/* ========================================================================= */}
          {activeTab === 'conditional' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-indigo-400" />
                    Conditional Logic & Visibility Rules
                  </h3>
                  <p className="text-xs text-slate-400">
                    Dynamically show, hide, require, or populate fields based on prior responses in real time.
                  </p>
                </div>
                <button
                  onClick={addConditionalRule}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Conditional Rule
                </button>
              </div>

              {formData.conditionalRules.length === 0 ? (
                <div className="py-16 text-center border-2 border-dashed border-slate-800 rounded-2xl p-8 space-y-3">
                  <GitBranch className="w-10 h-10 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400 font-medium">
                    No conditional rules configured yet.
                  </p>
                  <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                    Create rules like: "When Engagement Category equals Architectural Scoping, SHOW Milestone Phases and REQUIRE Budget."
                  </p>
                  <button
                    onClick={addConditionalRule}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-indigo-300 font-semibold"
                  >
                    Add First Rule
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.conditionalRules.map((rule: FormConditionalRule, ruleIdx: number) => {
                    return (
                      <div
                        key={rule.id}
                        className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3"
                      >
                        {/* Rule Action Header */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-mono font-bold text-slate-400">
                              RULE #{ruleIdx + 1}:
                            </span>
                            <span className="text-xs font-semibold text-slate-200">
                              THEN perform action
                            </span>
                            <select
                              value={rule.action}
                              onChange={(e) =>
                                updateRule(rule.id, {
                                  action: e.target.value as any,
                                })
                              }
                              className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded text-xs font-bold text-indigo-400 uppercase"
                            >
                              <option value="show">SHOW</option>
                              <option value="hide">HIDE</option>
                              <option value="require">REQUIRE</option>
                              <option value="unrequire">MAKE OPTIONAL</option>
                              <option value="set_value">SET VALUE</option>
                            </select>
                            <span className="text-xs font-semibold text-slate-200">on field:</span>
                            <select
                              value={rule.targetFieldId}
                              onChange={(e) => updateRule(rule.id, { targetFieldId: e.target.value })}
                              className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded text-xs font-semibold text-slate-100"
                            >
                              {formData.fields.map((f: WebFormField) => (
                                <option key={f.id} value={f.id}>
                                  {f.label} ({f.id})
                                </option>
                              ))}
                            </select>

                            {rule.action === 'set_value' && (
                              <input
                                type="text"
                                placeholder="Value to assign..."
                                value={rule.setValue || ''}
                                onChange={(e) => updateRule(rule.id, { setValue: e.target.value })}
                                className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-slate-100"
                              />
                            )}
                          </div>

                          <button
                            onClick={() => removeRule(rule.id)}
                            className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Predicate Conditions List */}
                        <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-slate-400 font-bold uppercase font-mono">
                                IF
                              </span>
                              <select
                                value={rule.combinator}
                                onChange={(e) =>
                                  updateRule(rule.id, {
                                    combinator: e.target.value as 'AND' | 'OR',
                                  })
                                }
                                className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] font-bold text-amber-400"
                              >
                                <option value="AND">ALL (AND) CONDITIONS MATCH</option>
                                <option value="OR">ANY (OR) CONDITION MATCHES</option>
                              </select>
                            </div>

                            <button
                              onClick={() => addRulePredicate(rule.id)}
                              className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" /> Add Condition
                            </button>
                          </div>

                          <div className="space-y-1.5">
                            {rule.conditions.map((pred: FormConditionPredicate, pIdx: number) => {
                              const sourceField = formData.fields.find((f: WebFormField) => f.id === pred.fieldId);

                              return (
                                <div
                                  key={pIdx}
                                  className="flex items-center gap-2 p-2 rounded bg-slate-900/60 border border-slate-800/60 text-xs"
                                >
                                  <span className="text-[10px] font-mono text-slate-500 w-4">
                                    #{pIdx + 1}
                                  </span>

                                  {/* Field selector */}
                                  <select
                                    value={pred.fieldId}
                                    onChange={(e) => {
                                      const next = [...rule.conditions];
                                      next[pIdx] = { ...next[pIdx], fieldId: e.target.value };
                                      updateRule(rule.id, { conditions: next });
                                    }}
                                    className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-slate-100"
                                  >
                                    {formData.fields.map((f: WebFormField) => (
                                      <option key={f.id} value={f.id}>
                                        {f.label}
                                      </option>
                                    ))}
                                  </select>

                                  {/* Operator selector */}
                                  <select
                                    value={pred.operator}
                                    onChange={(e) => {
                                      const next = [...rule.conditions];
                                      next[pIdx] = { ...next[pIdx], operator: e.target.value as any };
                                      updateRule(rule.id, { conditions: next });
                                    }}
                                    className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-slate-300 font-mono"
                                  >
                                    <option value="equals">equals (==)</option>
                                    <option value="not_equals">not equals (!=)</option>
                                    <option value="contains">contains</option>
                                    <option value="not_contains">does not contain</option>
                                    <option value="greater_than">greater than (&gt;)</option>
                                    <option value="less_than">less than (&lt;)</option>
                                    <option value="is_empty">is empty</option>
                                    <option value="is_not_empty">is not empty</option>
                                  </select>

                                  {/* Value input (hidden if is_empty / is_not_empty) */}
                                  {pred.operator !== 'is_empty' && pred.operator !== 'is_not_empty' && (
                                    <>
                                      {sourceField?.type === 'select' && sourceField.options ? (
                                        <select
                                          value={pred.value}
                                          onChange={(e) => {
                                            const next = [...rule.conditions];
                                            next[pIdx] = { ...next[pIdx], value: e.target.value };
                                            updateRule(rule.id, { conditions: next });
                                          }}
                                          className="flex-1 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-slate-100"
                                        >
                                          <option value="">Select Option Value...</option>
                                          {sourceField.options.map((opt: FormFieldOption) => (
                                            <option key={opt.value} value={opt.value}>
                                              {opt.label} ({opt.value})
                                            </option>
                                          ))}
                                        </select>
                                      ) : (
                                        <input
                                          type="text"
                                          placeholder="Comparison value..."
                                          value={pred.value}
                                          onChange={(e) => {
                                            const next = [...rule.conditions];
                                            next[pIdx] = { ...next[pIdx], value: e.target.value };
                                            updateRule(rule.id, { conditions: next });
                                          }}
                                          className="flex-1 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-slate-100"
                                        />
                                      )}
                                    </>
                                  )}

                                  {rule.conditions.length > 1 && (
                                    <button
                                      onClick={() => removeRulePredicate(rule.id, pIdx)}
                                      className="p-1 text-slate-500 hover:text-rose-400"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: WORKFLOW & MODULE ROUTING                                          */}
          {/* ========================================================================= */}
          {activeTab === 'routing' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <Workflow className="w-4 h-4 text-emerald-400" />
                    Automated Workflow & Module Routing Matrix
                  </h3>
                  <p className="text-xs text-slate-400">
                    Route submissions to CRM (Leads, Deals, Accounts) or PM (Projects, Tasks) and trigger Action Scheduler workflows.
                  </p>
                </div>
                <button
                  onClick={addRoutingRule}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Conditional Route
                </button>
              </div>

              {/* Default Fallback Route */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-200">
                      Default Destination (Fallback when no rule matches):
                    </span>
                    <select
                      value={formData.routing.defaultRoute.targetModule}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          routing: {
                            ...formData.routing,
                            defaultRoute: {
                              ...formData.routing.defaultRoute,
                              targetModule: e.target.value as TargetModuleType,
                            },
                          },
                        })
                      }
                      className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-indigo-400 uppercase"
                    >
                      <option value="leads">CRM Leads Module</option>
                      <option value="deals">CRM Deals & Pipeline</option>
                      <option value="projects">Projects & Delivery Workspace</option>
                      <option value="tasks">Project Backlog Tasks</option>
                    </select>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                    Priority: 0 (Default)
                  </span>
                </div>

                {/* Default field mappings */}
                <div className="pt-2 border-t border-slate-800/80">
                  <label className="text-[11px] text-slate-400 font-semibold block mb-2">
                    Default Field Mappings (Supports merge tags like &#123;&#123;client_name&#125;&#125;)
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Record Title / Name:</span>
                      <input
                        type="text"
                        value={
                          formData.routing.defaultRoute.fieldMappings.firstName ||
                          formData.routing.defaultRoute.fieldMappings.title ||
                          ''
                        }
                        onChange={(e) => {
                          const isLead = formData.routing.defaultRoute.targetModule === 'leads';
                          setFormData({
                            ...formData,
                            routing: {
                              ...formData.routing,
                              defaultRoute: {
                                ...formData.routing.defaultRoute,
                                fieldMappings: {
                                  ...formData.routing.defaultRoute.fieldMappings,
                                  [isLead ? 'firstName' : 'title']: e.target.value,
                                },
                              },
                            },
                          });
                        }}
                        placeholder="{{client_name}}"
                        className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-slate-100"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Contact Email:</span>
                      <input
                        type="text"
                        value={formData.routing.defaultRoute.fieldMappings.email || ''}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            routing: {
                              ...formData.routing,
                              defaultRoute: {
                                ...formData.routing.defaultRoute,
                                fieldMappings: {
                                  ...formData.routing.defaultRoute.fieldMappings,
                                  email: e.target.value,
                                },
                              },
                            },
                          });
                        }}
                        placeholder="{{email}}"
                        className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-slate-100"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Description / Scope:</span>
                      <input
                        type="text"
                        value={formData.routing.defaultRoute.fieldMappings.description || ''}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            routing: {
                              ...formData.routing,
                              defaultRoute: {
                                ...formData.routing.defaultRoute,
                                fieldMappings: {
                                  ...formData.routing.defaultRoute.fieldMappings,
                                  description: e.target.value,
                                },
                              },
                            },
                          });
                        }}
                        placeholder="{{project_scope}}"
                        className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-slate-100"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Conditional Routing Rules */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                  Conditional Routing Branches ({formData.routing.conditionalRoutes.length})
                </h4>

                {formData.routing.conditionalRoutes.map((cRoute: FormRoutingRule, cIdx: number) => (
                  <div
                    key={cRoute.id}
                    className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-bold text-emerald-400">
                          BRANCH #{cIdx + 1}
                        </span>
                        <input
                          type="text"
                          value={cRoute.name}
                          onChange={(e) => updateRoutingRule(cRoute.id, { name: e.target.value })}
                          className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs font-semibold text-slate-100"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <span>Priority:</span>
                          <input
                            type="number"
                            value={cRoute.priority}
                            onChange={(e) =>
                              updateRoutingRule(cRoute.id, { priority: Number(e.target.value) })
                            }
                            className="w-14 px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-xs text-slate-100 font-mono"
                          />
                        </div>
                        <button
                          onClick={() => removeRoutingRule(cRoute.id)}
                          className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Conditions */}
                    <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 space-y-2">
                      <span className="text-[11px] font-bold text-slate-400 font-mono uppercase block">
                        Evaluation Rule (WHEN Criteria Met):
                      </span>
                      {cRoute.conditions.map((pred: FormConditionPredicate, pIdx: number) => (
                        <div key={pIdx} className="flex items-center gap-2 text-xs">
                          <select
                            value={pred.fieldId}
                            onChange={(e) => {
                              const next = [...cRoute.conditions];
                              next[pIdx] = { ...next[pIdx], fieldId: e.target.value };
                              updateRoutingRule(cRoute.id, { conditions: next });
                            }}
                            className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-slate-100"
                          >
                            {formData.fields.map((f: WebFormField) => (
                              <option key={f.id} value={f.id}>
                                {f.label}
                              </option>
                            ))}
                          </select>
                          <select
                            value={pred.operator}
                            onChange={(e) => {
                              const next = [...cRoute.conditions];
                              next[pIdx] = { ...next[pIdx], operator: e.target.value as any };
                              updateRoutingRule(cRoute.id, { conditions: next });
                            }}
                            className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-slate-300 font-mono"
                          >
                            <option value="equals">equals (==)</option>
                            <option value="not_equals">not equals (!=)</option>
                            <option value="greater_than">greater than (&gt;)</option>
                            <option value="less_than">less than (&lt;)</option>
                            <option value="contains">contains</option>
                          </select>
                          <input
                            type="text"
                            value={pred.value}
                            onChange={(e) => {
                              const next = [...cRoute.conditions];
                              next[pIdx] = { ...next[pIdx], value: e.target.value };
                              updateRoutingRule(cRoute.id, { conditions: next });
                            }}
                            placeholder="Value..."
                            className="flex-1 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-slate-100"
                          />
                        </div>
                      ))}
                    </div>

                    {/* Routing Action Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                          Target Module Destination
                        </label>
                        <select
                          value={cRoute.action.targetModule}
                          onChange={(e) => {
                            updateRoutingRule(cRoute.id, {
                              action: {
                                ...cRoute.action,
                                targetModule: e.target.value as TargetModuleType,
                              },
                            });
                          }}
                          className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-emerald-400 uppercase"
                        >
                          <option value="projects">Projects & Delivery Workspace</option>
                          <option value="deals">CRM Deals & Commercial Pipeline</option>
                          <option value="tasks">Project Backlog Tasks</option>
                          <option value="leads">CRM Leads Module</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                          Trigger Automated Workflow Rule
                        </label>
                        <select
                          value={cRoute.action.triggerWorkflowId || ''}
                          onChange={(e) => {
                            updateRoutingRule(cRoute.id, {
                              action: {
                                ...cRoute.action,
                                triggerWorkflowId: e.target.value || undefined,
                              },
                            });
                          }}
                          className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-amber-300 font-mono"
                        >
                          <option value="">None (Standard Ingestion)</option>
                          <option value="wf_deal_won_notify">wf_deal_won_notify (VIP Kickoff)</option>
                          <option value="wf_task_escalation">wf_task_escalation (Slack Alert)</option>
                        </select>
                      </div>

                      <div className="col-span-2">
                        <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                          Entity Title Template
                        </label>
                        <input
                          type="text"
                          value={cRoute.action.fieldMappings?.title || ''}
                          onChange={(e) => {
                            updateRoutingRule(cRoute.id, {
                              action: {
                                ...cRoute.action,
                                fieldMappings: {
                                  ...cRoute.action.fieldMappings,
                                  title: e.target.value,
                                },
                              },
                            });
                          }}
                          placeholder="{{company_name}} - {{inquiry_type}} Project"
                          className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: INTERACTIVE LIVE SANDBOX                                           */}
          {/* ========================================================================= */}
          {activeTab === 'sandbox' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-full">
              {/* Form Preview Client */}
              <div className="md:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col space-y-4">
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-slate-100">{formData.title}</h3>
                  <p className="text-xs text-slate-400 mt-1">{formData.description}</p>
                </div>

                {/* Form fields rendering reactively with conditional logic */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                  <div className="grid grid-cols-2 gap-4">
                    {formData.fields.map((field: WebFormField) => {
                      const isVisible = sandboxEval.visibility[field.id] !== false;
                      const isRequired = sandboxEval.required[field.id];

                      if (!isVisible) return null;

                      return (
                        <div
                          key={field.id}
                          className={`${field.width === 'half' ? 'col-span-1' : 'col-span-2'} space-y-1.5 animate-in fade-in duration-150`}
                        >
                          <label className="text-xs font-medium text-slate-200 flex items-center justify-between">
                            <span>
                              {field.label} {isRequired && <span className="text-rose-400">*</span>}
                            </span>
                            {sandboxEval.activeRuleIds.length > 0 && (
                              <span className="text-[10px] text-indigo-400 font-mono">
                                (Dynamic)
                              </span>
                            )}
                          </label>

                          {field.type === 'select' ? (
                            <select
                              value={sandboxValues[field.id] || ''}
                              onChange={(e) => {
                                setSandboxValues({ ...sandboxValues, [field.id]: e.target.value });
                              }}
                              className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                            >
                              <option value="">Select an option...</option>
                              {(field.options || []).map((opt: FormFieldOption) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          ) : field.type === 'textarea' ? (
                            <textarea
                              rows={3}
                              placeholder={field.placeholder}
                              value={sandboxValues[field.id] || ''}
                              onChange={(e) => {
                                setSandboxValues({ ...sandboxValues, [field.id]: e.target.value });
                              }}
                              className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                            />
                          ) : (
                            <input
                              type={field.type}
                              placeholder={field.placeholder}
                              value={sandboxValues[field.id] || ''}
                              onChange={(e) => {
                                setSandboxValues({ ...sandboxValues, [field.id]: e.target.value });
                              }}
                              className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                            />
                          )}

                          {field.helpText && (
                            <p className="text-[10px] text-slate-400">{field.helpText}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-mono">
                    Visible Inputs: {Object.values(sandboxEval.visibility).filter(Boolean).length}/
                    {formData.fields.length}
                  </span>
                  <button
                    onClick={runSandboxSimulation}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5" /> Trace Route & Ingest
                  </button>
                </div>
              </div>

              {/* Simulation Engine Telemetry */}
              <div className="md:col-span-5 bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-col space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Routing Telemetry & Trace
                  </h4>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">Live DAG</span>
                </div>

                {sandboxSimResult ? (
                  <div className="space-y-4 text-xs">
                    {/* Destination Banner */}
                    <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/40 space-y-1">
                      <span className="text-[10px] text-indigo-300 font-mono uppercase block">
                        Evaluated Destination Module
                      </span>
                      <p className="text-sm font-bold text-white uppercase flex items-center gap-2">
                        {sandboxSimResult.targetModule}
                        <span className="text-[10px] font-normal font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                          {sandboxSimResult.matchedRule}
                        </span>
                      </p>
                    </div>

                    {/* Mapped Output Fields */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] text-slate-400 font-semibold block">
                        Resolved Field Attributes
                      </span>
                      <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] space-y-1.5">
                        {Object.entries(sandboxSimResult.resolvedMappings).map(([k, v]) => (
                          <div key={k} className="flex justify-between border-b border-slate-900 pb-1">
                            <span className="text-indigo-400">{k}:</span>
                            <span className="text-slate-200">{String(v) || '—'}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Triggered Workflow */}
                    {sandboxSimResult.triggerWorkflowId && (
                      <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center gap-2 text-amber-300">
                        <Workflow className="w-4 h-4" />
                        <div>
                          <p className="text-xs font-bold">Action Scheduler Hook</p>
                          <p className="text-[10px] font-mono">
                            Will fire workflow: {sandboxSimResult.triggerWorkflowId}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-16 text-center text-xs text-slate-500 font-mono">
                    Fill out the form on the left and click "Trace Route & Ingest" to verify execution.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: EMBED & SHARE                                                      */}
          {/* ========================================================================= */}
          {activeTab === 'embed' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Code className="w-4 h-4 text-indigo-400" />
                  Embed, Share & Client Access
                </h3>
                <p className="text-xs text-slate-400">
                  Share direct public links with prospects, or embed this form inside WordPress, external client portals, or internal documentation.
                </p>
              </div>

              {/* Direct Link */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <label className="text-xs font-bold text-slate-200 block">
                  1. Standalone Direct Web Form URL
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={publicUrl}
                    className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-indigo-300"
                  />
                  <button
                    onClick={() => copyToClipboard(publicUrl, 'url')}
                    className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    {copiedType === 'url' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedType === 'url' ? 'Copied' : 'Copy URL'}</span>
                  </button>
                  <a
                    href={publicUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                  >
                    Open Tab
                  </a>
                </div>
              </div>

              {/* Iframe Embed */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <label className="text-xs font-bold text-slate-200 block">
                  2. Responsive HTML &lt;iframe&gt; Snippet
                </label>
                <div className="flex items-start gap-2">
                  <textarea
                    readOnly
                    rows={3}
                    value={iframeSnippet}
                    className="flex-1 p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-300"
                  />
                  <button
                    onClick={() => copyToClipboard(iframeSnippet, 'iframe')}
                    className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    {copiedType === 'iframe' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedType === 'iframe' ? 'Copied' : 'Copy Embed'}</span>
                  </button>
                </div>
              </div>

              {/* Inbound Webhook API Target */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <label className="text-xs font-bold text-slate-200 block">
                  3. Headless REST API Submission Endpoint
                </label>
                <p className="text-[11px] text-slate-400">
                  You can also dispatch raw JSON directly to this form endpoint from external backend systems or mobile apps:
                </p>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1">
                  <p className="text-emerald-400">POST {window.location.origin}/api/forms/public/{formData.slug}/submit</p>
                  <p className="text-slate-500">Content-Type: application/json</p>
                  <p className="text-slate-400">&#123; "client_name": "Elena", "email": "elena@corp.com", ... &#125;</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
