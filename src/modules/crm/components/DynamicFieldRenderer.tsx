/**
 * Dynamic CRM Field Renderer Component (VTiger-Style)
 * Renders formatted Read State (badges, currency, links, lookups)
 * and active Edit State input controls inside InlineEditWrapper.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Mail, 
  Phone, 
  ExternalLink, 
  Building2, 
  User as UserIcon, 
  DollarSign, 
  Calendar, 
  Percent,
  CheckCircle2,
  XCircle,
  Hash
} from 'lucide-react';
import { FieldDefinition, PicklistOption } from '../../../types/crmEntities';
import { InlineEditWrapper } from './InlineEditWrapper';

export interface DynamicFieldRendererProps {
  field: FieldDefinition;
  value: any;
  record?: Record<string, any>;
  onUpdate?: (fieldName: string, newValue: any) => Promise<boolean | void>;
  isReadOnly?: boolean;
  className?: string;
}

/**
 * Helper to determine badge colors for picklists and entity statuses
 */
const getBadgeClasses = (val: string, customColor?: string): string => {
  if (customColor) {
    return `bg-[${customColor}]/20 text-[${customColor}] border-[${customColor}]/30`;
  }

  const normalized = String(val).toLowerCase().replace(/\s+/g, '_');

  switch (normalized) {
    // Rating
    case 'hot':
      return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
    case 'warm':
      return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    case 'cold':
      return 'bg-sky-500/20 text-sky-300 border-sky-500/30';

    // Lead Status
    case 'converted':
    case 'closed_won':
      return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 font-medium';
    case 'lost':
    case 'closed_lost':
    case 'unqualified':
      return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
    case 'pre_qualified':
    case 'qualification':
    case 'negotiation_review':
      return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
    case 'contacted':
    case 'attempted_contact':
    case 'needs_analysis':
    case 'value_proposition':
    case 'proposal_price_quote':
      return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
    case 'prospecting':
      return 'bg-purple-500/20 text-purple-300 border-purple-500/30';

    // Account Types
    case 'customer':
      return 'bg-teal-500/20 text-teal-300 border-teal-500/30';
    case 'partner':
      return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    case 'vendor':
    case 'reseller':
      return 'bg-violet-500/20 text-violet-300 border-violet-500/30';
    case 'prospect':
      return 'bg-amber-500/20 text-amber-300 border-amber-500/30';

    default:
      return 'bg-slate-700/40 text-slate-300 border-slate-600/30';
  }
};

/**
 * Formats a date string or timestamp object to local string
 */
const formatDate = (val: any, includeTime = false): string => {
  if (!val) return '';
  try {
    let dateObj: Date;
    if (typeof val === 'object' && typeof val.toDate === 'function') {
      dateObj = val.toDate();
    } else if (typeof val === 'object' && val.seconds !== undefined) {
      dateObj = new Date(val.seconds * 1000);
    } else {
      dateObj = new Date(val);
    }

    if (isNaN(dateObj.getTime())) return String(val);

    return includeTime
      ? dateObj.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
      : dateObj.toLocaleDateString(undefined, { dateStyle: 'medium' });
  } catch {
    return String(val);
  }
};

/**
 * Converts value to ISO date string for input[type="date"]
 */
const toInputDate = (val: any): string => {
  if (!val) return '';
  try {
    let dateObj: Date;
    if (typeof val === 'object' && typeof val.toDate === 'function') {
      dateObj = val.toDate();
    } else {
      dateObj = new Date(val);
    }
    if (isNaN(dateObj.getTime())) return '';
    return dateObj.toISOString().split('T')[0];
  } catch {
    return '';
  }
};

export const DynamicFieldRenderer: React.FC<DynamicFieldRendererProps> = ({
  field,
  value,
  record = {},
  onUpdate,
  isReadOnly = false,
  className = '',
}) => {
  const [draftValue, setDraftValue] = useState<any>(value);

  // Sync draft value when incoming prop changes
  useEffect(() => {
    setDraftValue(value);
  }, [value]);

  const handleSave = async () => {
    if (onUpdate && draftValue !== value) {
      await onUpdate(field.name, draftValue);
    }
  };

  const handleCancel = () => {
    setDraftValue(value);
  };

  const effectiveReadOnly = isReadOnly || field.isReadOnly;

  // Normalized picklist options
  const picklistOptions: { label: string; value: string; color?: string }[] = 
    (field.picklistValues || []).map((opt) => {
      if (typeof opt === 'string') {
        const formattedLabel = opt.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
        return { label: formattedLabel, value: opt };
      }
      return opt as PicklistOption;
    });

  return (
    <InlineEditWrapper
      label={field.label}
      tooltip={field.tooltip}
      isRequired={field.isRequired}
      isReadOnly={effectiveReadOnly}
      onSave={handleSave}
      onCancel={handleCancel}
      className={className}
    >
      {({ isEditing }) => {
        // ==========================================
        // 1. ACTIVE EDIT MODE
        // ==========================================
        if (isEditing) {
          switch (field.type) {
            case 'picklist':
              return (
                <select
                  value={draftValue ?? ''}
                  onChange={(e) => setDraftValue(e.target.value)}
                  autoFocus
                  className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-xs rounded-md px-2 py-1.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="" disabled>Select option...</option>
                  {picklistOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              );

            case 'multi_picklist':
              return (
                <div className="flex flex-wrap gap-1 max-h-36 overflow-y-auto p-1 bg-slate-900 border border-slate-700 rounded-md">
                  {picklistOptions.map((opt) => {
                    const currentArr = Array.isArray(draftValue) ? draftValue : [];
                    const isSelected = currentArr.includes(opt.value);
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setDraftValue(currentArr.filter((v: string) => v !== opt.value));
                          } else {
                            setDraftValue([...currentArr, opt.value]);
                          }
                        }}
                        className={`text-xs px-2 py-0.5 rounded border transition-all ${
                          isSelected
                            ? 'bg-indigo-600/30 text-indigo-200 border-indigo-500/50'
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              );

            case 'textarea':
              return (
                <textarea
                  value={draftValue ?? ''}
                  onChange={(e) => setDraftValue(e.target.value)}
                  placeholder={field.placeholder || `Enter ${field.label}...`}
                  rows={3}
                  autoFocus
                  className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-xs rounded-md p-2 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-y"
                />
              );

            case 'number':
            case 'percentage':
              return (
                <div className="relative">
                  <input
                    type="number"
                    value={draftValue ?? ''}
                    onChange={(e) => setDraftValue(e.target.value === '' ? null : Number(e.target.value))}
                    min={field.min}
                    max={field.max}
                    step={field.step || (field.type === 'percentage' ? 1 : 'any')}
                    placeholder={field.placeholder || '0'}
                    autoFocus
                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-xs rounded-md px-2 py-1.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                  {field.type === 'percentage' && (
                    <span className="absolute right-2.5 top-1.5 text-xs text-slate-400 pointer-events-none">
                      %
                    </span>
                  )}
                </div>
              );

            case 'currency':
              return (
                <div className="relative flex items-center">
                  <span className="absolute left-2 text-xs text-slate-400 pointer-events-none">
                    {record.currency === 'EUR' ? '€' : record.currency === 'GBP' ? '£' : '$'}
                  </span>
                  <input
                    type="number"
                    value={draftValue ?? ''}
                    onChange={(e) => setDraftValue(e.target.value === '' ? null : Number(e.target.value))}
                    min={field.min || 0}
                    step={field.step || 'any'}
                    placeholder="0.00"
                    autoFocus
                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-xs rounded-md pl-6 pr-2 py-1.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              );

            case 'date':
              return (
                <input
                  type="date"
                  value={toInputDate(draftValue)}
                  onChange={(e) => {
                    const dateVal = e.target.value;
                    setDraftValue(dateVal || null);
                  }}
                  autoFocus
                  className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-xs rounded-md px-2 py-1.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              );

            case 'datetime':
              return (
                <input
                  type="datetime-local"
                  value={draftValue ? new Date(draftValue).toISOString().slice(0, 16) : ''}
                  onChange={(e) => {
                    const dateVal = e.target.value;
                    setDraftValue(dateVal ? new Date(dateVal).toISOString() : null);
                  }}
                  autoFocus
                  className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-xs rounded-md px-2 py-1.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              );

            case 'boolean':
              return (
                <label className="flex items-center gap-2 cursor-pointer py-1">
                  <input
                    type="checkbox"
                    checked={Boolean(draftValue)}
                    onChange={(e) => setDraftValue(e.target.checked)}
                    autoFocus
                    className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700 focus:ring-indigo-500 focus:ring-offset-slate-900"
                  />
                  <span className="text-xs text-slate-200">
                    {draftValue ? 'Enabled / True' : 'Disabled / False'}
                  </span>
                </label>
              );

            case 'email':
              return (
                <input
                  type="email"
                  value={draftValue ?? ''}
                  onChange={(e) => setDraftValue(e.target.value)}
                  placeholder={field.placeholder || 'name@domain.com'}
                  autoFocus
                  className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-xs rounded-md px-2 py-1.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              );

            case 'phone':
              return (
                <input
                  type="tel"
                  value={draftValue ?? ''}
                  onChange={(e) => setDraftValue(e.target.value)}
                  placeholder={field.placeholder || '+1 (555) 000-0000'}
                  autoFocus
                  className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-xs rounded-md px-2 py-1.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              );

            case 'url':
              return (
                <input
                  type="url"
                  value={draftValue ?? ''}
                  onChange={(e) => setDraftValue(e.target.value)}
                  placeholder={field.placeholder || 'https://domain.com'}
                  autoFocus
                  className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-xs rounded-md px-2 py-1.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              );

            case 'user':
            case 'reference':
            case 'text':
            default:
              return (
                <input
                  type="text"
                  value={draftValue ?? ''}
                  onChange={(e) => setDraftValue(e.target.value)}
                  placeholder={field.placeholder || `Enter ${field.label}...`}
                  autoFocus
                  className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-xs rounded-md px-2 py-1.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              );
          }
        }

        // ==========================================
        // 2. FORMATTED READ STATE
        // ==========================================
        if (value === null || value === undefined || value === '') {
          return <span className="text-xs text-slate-500 italic">—</span>;
        }

        switch (field.type) {
          case 'picklist': {
            const matchedOpt = picklistOptions.find((o) => o.value === value);
            const labelText = matchedOpt?.label || String(value);
            const badgeCls = getBadgeClasses(String(value), matchedOpt?.color);
            return (
              <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full border ${badgeCls}`}>
                {labelText}
              </span>
            );
          }

          case 'multi_picklist': {
            const arr = Array.isArray(value) ? value : [value];
            if (arr.length === 0) return <span className="text-xs text-slate-500 italic">—</span>;
            return (
              <div className="flex flex-wrap gap-1">
                {arr.map((valItem: string) => {
                  const opt = picklistOptions.find((o) => o.value === valItem);
                  return (
                    <span
                      key={valItem}
                      className="inline-flex items-center text-[11px] px-1.5 py-0.5 rounded-md bg-slate-700/50 text-slate-300 border border-slate-600/30"
                    >
                      {opt?.label || valItem}
                    </span>
                  );
                })}
              </div>
            );
          }

          case 'currency': {
            const num = Number(value);
            if (isNaN(num)) return <span className="text-xs text-slate-300">{value}</span>;
            const formatted = new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: record.currency || 'USD',
              maximumFractionDigits: 2,
            }).format(num);

            return (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400">
                <DollarSign className="w-3 h-3 text-emerald-500" />
                {formatted}
              </span>
            );
          }

          case 'percentage': {
            const num = Number(value);
            return (
              <span className="inline-flex items-center gap-0.5 text-xs font-medium text-indigo-300">
                {isNaN(num) ? value : num}
                <Percent className="w-3 h-3 text-indigo-400" />
              </span>
            );
          }

          case 'number': {
            const num = Number(value);
            return (
              <span className="inline-flex items-center gap-1 text-xs text-slate-200">
                <Hash className="w-3 h-3 text-slate-400" />
                {isNaN(num) ? value : num.toLocaleString()}
              </span>
            );
          }

          case 'date':
            return (
              <span className="inline-flex items-center gap-1 text-xs text-slate-300">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {formatDate(value, false)}
              </span>
            );

          case 'datetime':
            return (
              <span className="inline-flex items-center gap-1 text-xs text-slate-300">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {formatDate(value, true)}
              </span>
            );

          case 'boolean':
            return value ? (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Yes
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                <XCircle className="w-3.5 h-3.5" />
                No
              </span>
            );

          case 'email':
            return (
              <a
                href={`mailto:${value}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 hover:underline"
              >
                <Mail className="w-3 h-3 text-indigo-400 shrink-0" />
                <span className="truncate">{value}</span>
              </a>
            );

          case 'phone':
            return (
              <a
                href={`tel:${value}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 hover:underline"
              >
                <Phone className="w-3 h-3 text-indigo-400 shrink-0" />
                <span>{value}</span>
              </a>
            );

          case 'url': {
            const href = String(value).startsWith('http') ? value : `https://${value}`;
            return (
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 hover:underline"
              >
                <span className="truncate max-w-[200px]">{value}</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            );
          }

          case 'reference': {
            const targetModule = field.referenceModule || 'accounts';
            const displayName =
              field.name === 'accountId'
                ? record.accountName || value
                : field.name === 'contactId'
                ? record.contactName || value
                : record[`${field.name}Name`] || value;

            return (
              <Link
                to={`/crm/${targetModule}/${value}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 hover:underline font-medium"
              >
                <Building2 className="w-3 h-3 shrink-0 text-indigo-400" />
                <span className="truncate">{displayName}</span>
              </Link>
            );
          }

          case 'user': {
            const userName = record.assignedUserName || record[`${field.name}Name`] || value;
            return (
              <span className="inline-flex items-center gap-1 text-xs text-slate-300">
                <div className="w-4 h-4 rounded-full bg-indigo-600/40 text-indigo-300 flex items-center justify-center text-[10px] font-semibold">
                  <UserIcon className="w-2.5 h-2.5" />
                </div>
                <span>{userName}</span>
              </span>
            );
          }

          case 'textarea':
            return (
              <p className="text-xs text-slate-300 whitespace-pre-wrap line-clamp-3">
                {String(value)}
              </p>
            );

          case 'text':
          default:
            return <span className="text-xs text-slate-200 truncate">{String(value)}</span>;
        }
      }}
    </InlineEditWrapper>
  );
};

export default DynamicFieldRenderer;
