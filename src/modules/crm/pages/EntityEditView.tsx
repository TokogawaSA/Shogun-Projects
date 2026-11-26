/**
 * Full Entity Edit & Create Form View Component (VTiger-Style)
 * Supports full-page 2-column block layouts for creating and editing Leads, Accounts, Contacts, Deals.
 * Integrates EntityLookupModal for relational lookups and REST API persistence.
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { EntityModuleName, FieldDefinition, PicklistOption, CustomerSegment } from '../../../types/crmEntities';
import { useCurrency } from '../../../context/CurrencyContext';
import { DEFAULT_MODULE_LAYOUTS, getModuleLayoutForSegment } from '../utils/moduleLayouts';
import {
  getRecordSegment,
  getEntityFieldValue,
  setEntityFieldValue,
} from '../utils/customerSegment';
import { EntityLookupModal } from '../components/EntityLookupModal';
import {
  Save,
  ArrowLeft,
  Loader2,
  Building2,
  Users,
  User,
  Briefcase,
  Target,
  Search,
  AlertCircle,
  Layers,
  Sparkles,
} from 'lucide-react';

export const EntityEditView: React.FC = () => {
  const { currencyCode, currencySymbol } = useCurrency();
  const { module: routeModule, id: recordId } = useParams<{ module: string; id?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const tenantId = user?.tenantId || 'tenant-enterprise-root';

  const isCreate = !recordId || recordId === 'new';

  const currentModule: EntityModuleName = (
    ['leads', 'accounts', 'contacts', 'deals'].includes(routeModule || '')
      ? routeModule
      : 'leads'
  ) as EntityModuleName;

  // Form Field State
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<boolean>(!isCreate);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const activeSegment: CustomerSegment = getRecordSegment(formData);
  const layoutBlocks = getModuleLayoutForSegment(currentModule, activeSegment);

  // Relational Lookup State
  const [lookupField, setLookupField] = useState<FieldDefinition | null>(null);
  const [isLookupOpen, setIsLookupOpen] = useState<boolean>(false);

  // 1. If Edit Mode, Load Initial Entity Record
  useEffect(() => {
    if (isCreate) {
      // Set defaults for Create Mode
      let defaults: Record<string, any> = {
        tenantId,
        assignedUserId: user?.uid || undefined,
        assignedUserName: user?.displayName || user?.email?.split('@')[0] || 'CRM Admin',
        currency: currencyCode,
        customFields: {
          customerSegment: 'B2B',
        },
      };

      // Set default picklist values from schema
      const allBlocks = DEFAULT_MODULE_LAYOUTS[currentModule] || DEFAULT_MODULE_LAYOUTS.leads;
      allBlocks.forEach((block) => {
        block.fields.forEach((field) => {
          if (field.defaultValue !== undefined) {
            defaults = setEntityFieldValue(defaults, field.name, field.defaultValue);
          } else if (field.type === 'picklist' && field.picklistValues && field.picklistValues.length > 0) {
            const first = field.picklistValues[0];
            const firstVal = typeof first === 'string' ? first : (first as PicklistOption).value;
            defaults = setEntityFieldValue(defaults, field.name, firstVal);
          } else if (field.type === 'boolean') {
            defaults = setEntityFieldValue(defaults, field.name, false);
          }
        });
      });

      setFormData(defaults);
      setLoading(false);
      return;
    }

    const fetchRecord = async () => {
      setLoading(true);
      try {
        const data = await apiClient.get<any>(`/crm/${currentModule}/${recordId}`).catch(() => null);

        if (data) {
          setFormData({ id: recordId, ...data });
        } else {
          setError(`Record ${recordId} was not found.`);
        }
      } catch (err: any) {
        console.error('[EntityEditView Error]:', err);
        setError(err?.message || 'Failed to load record.');
      } finally {
        setLoading(false);
      }
    };

    fetchRecord();
  }, [isCreate, currentModule, recordId, tenantId, user]);

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData((prev) => setEntityFieldValue(prev, fieldName, value));
  };

  const handleSegmentChange = (nextSegment: CustomerSegment) => {
    setFormData((prev) => {
      let updated = setEntityFieldValue(prev, 'customFields.customerSegment', nextSegment);
      if (isCreate) {
        if (currentModule === 'accounts') {
          if (nextSegment === 'B2C' && (!updated.accountType || updated.accountType === 'customer' || updated.accountType === 'prospect')) {
            updated = { ...updated, accountType: 'individual' };
          } else if (nextSegment === 'B2B' && ['individual', 'consumer', 'household'].includes(updated.accountType)) {
            updated = { ...updated, accountType: 'prospect' };
          }
        }
        if (currentModule === 'deals') {
          if (nextSegment === 'B2C' && (!updated.dealType || updated.dealType === 'new_business')) {
            updated = { ...updated, dealType: 'b2c_direct' };
          } else if (nextSegment === 'B2B' && ['b2c_direct', 'b2c_subscription'].includes(updated.dealType)) {
            updated = { ...updated, dealType: 'new_business' };
          }
        }
      }
      return updated;
    });
  };

  // 2. Open Relational Lookup Modal
  const openLookup = (field: FieldDefinition) => {
    setLookupField(field);
    setIsLookupOpen(true);
  };

  const handleLookupSelect = (selected: { id: string; name: string; record?: any }) => {
    if (!lookupField) return;

    setFormData((prev) => {
      const updated = {
        ...prev,
        [lookupField.name]: selected.name,
      };

      // Also set ID foreign key if field is named accountName or contactName
      if (lookupField.name === 'accountName') {
        updated.accountId = selected.id;
      } else if (lookupField.name === 'contactName') {
        updated.contactId = selected.id;
      }
      return updated;
    });

    setIsLookupOpen(false);
    setLookupField(null);
  };

  // 3. Save Form Submission
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      if (isCreate) {
        let resolvedAccountId = formData.accountId;
        let resolvedAccountName = formData.accountName;

        // Validate relational links (B2B requires explicit Account; B2C auto-provisions Individual Account if omitted)
        if ((currentModule === 'contacts' || currentModule === 'deals') && !resolvedAccountId) {
          if (activeSegment === 'B2B') {
            throw new Error(
              `Please select an Account for this B2B ${currentModule.slice(0, -1)} using the lookup field.`
            );
          }

          // B2C: Auto-provision a lightweight Individual Consumer Account so relational FKs stay valid
          const consumerAccountName =
            currentModule === 'contacts'
              ? `${formData.firstName || ''} ${formData.lastName || ''}`.trim() || 'Individual Consumer'
              : formData.contactName || formData.dealName || 'Individual Consumer';

          const autoAccount = await apiClient.post<any>('/crm/accounts', {
            tenantId,
            accountName: consumerAccountName,
            accountType: 'individual',
            industry: 'Consumer',
            rating: 'warm',
            email: formData.email || undefined,
            primaryPhone: formData.mobile || formData.phone || undefined,
            assignedUserId: formData.assignedUserId || user?.uid || undefined,
            customFields: {
              ...(formData.customFields || {}),
              customerSegment: 'B2C',
            },
          });

          if (autoAccount?.id) {
            resolvedAccountId = autoAccount.id;
            resolvedAccountName = autoAccount.accountName || consumerAccountName;
          }
        }

        const newEntity: Record<string, any> = {
          ...formData,
          tenantId,
          assignedUserId: formData.assignedUserId || user?.uid || undefined,
          customFields: {
            ...(formData.customFields || {}),
            customerSegment: activeSegment,
          },
        };

        if (resolvedAccountId) {
          newEntity.accountId = resolvedAccountId;
          newEntity.accountName = resolvedAccountName;
        }

        if (currentModule === 'leads') {
          newEntity.isConverted = false;
          if (activeSegment === 'B2C' && !String(newEntity.company || '').trim()) {
            newEntity.company = 'Individual';
          }
        }

        if (currentModule === 'accounts' && activeSegment === 'B2C') {
          if (!String(newEntity.industry || '').trim()) {
            newEntity.industry = 'Consumer';
          }
          if (!newEntity.accountType) {
            newEntity.accountType = 'individual';
          }
        }

        const created = await apiClient.post<any>(`/crm/${currentModule}`, newEntity);

        setIsSaving(false);
        navigate(`/crm/${currentModule}/${created?.id}`);
      } else {
        // Update Existing Record
        const updatePayload = {
          ...formData,
          customFields: {
            ...(formData.customFields || {}),
            customerSegment: activeSegment,
          },
          updatedAt: new Date().toISOString(),
        };

        await apiClient.put(`/crm/${currentModule}/${recordId}`, updatePayload);

        setIsSaving(false);
        navigate(`/crm/${currentModule}/${recordId}`);
      }
    } catch (err: any) {
      console.error('[EntityEditView Save Error]:', err);
      setIsSaving(false);
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.details ||
        err?.message ||
        'Failed to save entity record to database.';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  };

  const getModuleIcon = () => {
    switch (currentModule) {
      case 'leads':
        return Target;
      case 'accounts':
        return Building2;
      case 'contacts':
        return Users;
      case 'deals':
        return Briefcase;
    }
  };

  const Icon = getModuleIcon();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-sm font-medium">Loading form layout...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-6 bg-slate-950 text-slate-100 space-y-6 animate-fadeIn">
      {/* 1. Form Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(isCreate ? `/crm/${currentModule}` : `/crm/${currentModule}/${recordId}`)}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-600/20 to-violet-600/20 border border-indigo-500/30 text-indigo-400 shrink-0">
            <Icon className="w-6 h-6" />
          </div>

          <div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              {isCreate ? `Create New ${currentModule.slice(0, -1).toUpperCase()}` : `Edit ${currentModule.slice(0, -1).toUpperCase()}`}
              <Sparkles className="w-4 h-4 text-indigo-400" />
            </h1>
            <p className="text-xs text-slate-400">
              {isCreate
                ? `Enter details to create a new ${currentModule.slice(0, -1)} record.`
                : `Update 2-column layout blocks and field attributes.`}
            </p>
          </div>
        </div>

        {/* Top Save & Cancel Actions */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => navigate(isCreate ? `/crm/${currentModule}` : `/crm/${currentModule}/${recordId}`)}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-xl shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                Save Record
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* B2B / B2C Customer Segment Switcher */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => handleSegmentChange('B2B')}
          className={`flex items-center gap-3 p-4 rounded-2xl border text-left transition-all ${
            activeSegment === 'B2B'
              ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-100 shadow-lg shadow-indigo-500/10'
              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
          }`}
        >
          <div
            className={`p-2.5 rounded-xl ${
              activeSegment === 'B2B'
                ? 'bg-indigo-500/25 text-indigo-300'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold flex items-center gap-2">
              B2B — Business / Organization
              {activeSegment === 'B2B' && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200">
                  Active
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Corporate firmographics, company accounts, procurement &amp; SA statutory compliance.
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleSegmentChange('B2C')}
          className={`flex items-center gap-3 p-4 rounded-2xl border text-left transition-all ${
            activeSegment === 'B2C'
              ? 'bg-teal-600/20 border-teal-500/50 text-teal-100 shadow-lg shadow-teal-500/10'
              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
          }`}
        >
          <div
            className={`p-2.5 rounded-xl ${
              activeSegment === 'B2C'
                ? 'bg-teal-500/25 text-teal-300'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            <User className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold flex items-center gap-2">
              B2C — Individual / Consumer
              {activeSegment === 'B2C' && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/30 text-teal-200">
                  Active
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Direct consumer profile, preferred channel, loyalty tier &amp; POPIA consent (no company required).
            </p>
          </div>
        </button>
      </div>

      {/* 2. Main 2-Column Block Layout Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {layoutBlocks.map((block) => {
          const sortedFields = [...block.fields].sort((a, b) => a.sortOrder - b.sortOrder);
          const col1Fields = sortedFields.filter((f) => f.column === 1 && f.type !== 'textarea');
          const col2Fields = sortedFields.filter((f) => f.column === 2 && f.type !== 'textarea');
          const fullWidthFields = sortedFields.filter((f) => f.type === 'textarea');

          return (
            <div
              key={block.id}
              className="bg-slate-900/70 border border-slate-800/90 rounded-2xl overflow-hidden shadow-xl"
            >
              {/* Block Title Header */}
              <div className="flex items-center gap-2 px-6 py-3.5 bg-slate-900/90 border-b border-slate-800 select-none">
                <Layers className="w-4 h-4 text-indigo-400" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                  {block.label}
                </h2>
              </div>

              {/* 2-Column Inputs Grid */}
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                  {/* Left Column */}
                  <div className="space-y-4">
                    {col1Fields.map((field) => renderFieldControl(field))}
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    {col2Fields.map((field) => renderFieldControl(field))}
                  </div>
                </div>

                {/* Full Width Textarea Fields */}
                {fullWidthFields.length > 0 && (
                  <div className="pt-2 border-t border-slate-800/60 space-y-4">
                    {fullWidthFields.map((field) => renderFieldControl(field))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Bottom Save & Cancel CTA */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(isCreate ? `/crm/${currentModule}` : `/crm/${currentModule}/${recordId}`)}
            className="px-5 py-2.5 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-7 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-xl shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Record
              </>
            )}
          </button>
        </div>
      </form>

      {/* 3. Relational Lookup Modal */}
      {lookupField && (
        <EntityLookupModal
          isOpen={isLookupOpen}
          onClose={() => {
            setIsLookupOpen(false);
            setLookupField(null);
          }}
          targetModule={lookupField.referenceModule || 'accounts'}
          title={`Lookup ${lookupField.label}`}
          onSelect={handleLookupSelect}
        />
      )}
    </div>
  );

  /**
   * Helper to render input controls according to field definition
   */
  function renderFieldControl(field: FieldDefinition) {
    const value = getEntityFieldValue(formData, field.name);
    const isReadOnly = field.isReadOnly;

    // Picklist options
    const picklistOptions: { label: string; value: string }[] = (field.picklistValues || []).map((opt) => {
      if (typeof opt === 'string') {
        return {
          label: opt.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          value: opt,
        };
      }
      return opt as PicklistOption;
    });

    return (
      <div key={field.name} className="space-y-1">
        <label className="block text-xs font-medium text-slate-300">
          {field.label} {field.isRequired && <span className="text-rose-400 font-bold">*</span>}
        </label>

        {isReadOnly ? (
          <div className="p-2.5 bg-slate-950/60 border border-slate-800/80 rounded-xl text-xs text-slate-400 select-none">
            {value || <span className="italic text-slate-600">Auto-generated upon save</span>}
          </div>
        ) : field.type === 'reference' ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={value ?? ''}
              readOnly
              placeholder={`Select ${field.label}...`}
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => openLookup(field)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-indigo-300 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 rounded-xl transition-all shrink-0"
            >
              <Search className="w-3.5 h-3.5" />
              Choose
            </button>
          </div>
        ) : field.type === 'picklist' ? (
          <select
            value={value ?? ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            required={field.isRequired}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="" disabled>-- Select {field.label} --</option>
            {picklistOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : field.type === 'boolean' ? (
          <label className="flex items-center gap-2 py-1 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => handleFieldChange(field.name, e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 bg-slate-950 border-slate-700 focus:ring-indigo-500"
            />
            <span className="text-xs text-slate-300">Yes / Active</span>
          </label>
        ) : field.type === 'textarea' ? (
          <textarea
            value={value ?? ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            rows={3}
            placeholder={field.placeholder || `Enter ${field.label}...`}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 resize-y"
          />
        ) : field.type === 'currency' || field.type === 'number' || field.type === 'percentage' ? (
          <div className="relative">
            {field.type === 'currency' && (
              <span className="absolute left-3 top-2 text-xs text-slate-400 pointer-events-none font-mono font-medium">
                {currencySymbol}
              </span>
            )}
            <input
              type="number"
              value={value ?? ''}
              onChange={(e) => handleFieldChange(field.name, e.target.value === '' ? '' : Number(e.target.value))}
              min={field.min}
              max={field.max}
              step={field.step || 'any'}
              placeholder="0.00"
              required={field.isRequired}
              className={`w-full bg-slate-950 border border-slate-700 rounded-xl py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 ${
                field.type === 'currency' ? 'pl-7 pr-3' : 'px-3'
              }`}
            />
          </div>
        ) : field.type === 'date' ? (
          <input
            type="date"
            value={
              typeof value === 'string'
                ? value.split('T')[0]
                : value
                ? new Date(value).toISOString().split('T')[0]
                : ''
            }
            onChange={(e) => {
              handleFieldChange(field.name, e.target.value || null);
            }}
            required={field.isRequired}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        ) : (
          <input
            type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : field.type === 'url' ? 'url' : 'text'}
            value={value ?? ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder || `Enter ${field.label}...`}
            required={field.isRequired}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        )}
      </div>
    );
  }
};

export default EntityEditView;
