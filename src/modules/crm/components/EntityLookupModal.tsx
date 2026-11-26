/**
 * Entity Relational Lookup Modal Component (VTiger-Style)
 * Enables searching and selecting related CRM entities (Accounts, Contacts, Deals, Leads).
 */

import React, { useState, useEffect, useMemo } from 'react';
import { apiClient } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { EntityModuleName, CustomerSegment } from '../../../types/crmEntities';
import { useCurrency } from '../../../context/CurrencyContext';
import { getRecordSegment, getSegmentMeta } from '../utils/customerSegment';
import {
  Search,
  X,
  Building2,
  Users,
  Briefcase,
  Target,
  Check,
  RefreshCw,
} from 'lucide-react';

export interface EntityLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetModule: EntityModuleName;
  title?: string;
  onSelect: (selected: { id: string; name: string; record?: any }) => void;
}

export const EntityLookupModal: React.FC<EntityLookupModalProps> = ({
  isOpen,
  onClose,
  targetModule,
  title,
  onSelect,
}) => {
  const { formatCurrency } = useCurrency();
  const { user } = useAuth();
  const tenantId = user?.tenantId || 'tenant-default';

  const [entities, setEntities] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [segmentFilter, setSegmentFilter] = useState<'ALL' | CustomerSegment>('ALL');

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoading(true);

    const loadEntities = async () => {
      try {
        const res = await apiClient.get<any[]>(`/crm/${targetModule}`).catch(() => []);
        if (Array.isArray(res) && isMounted) {
          setEntities(res);
        }
      } catch {
        if (isMounted) setEntities([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadEntities();
    return () => {
      isMounted = false;
    };
  }, [isOpen, targetModule, tenantId]);

  const getModuleIcon = () => {
    switch (targetModule) {
      case 'accounts':
        return Building2;
      case 'contacts':
        return Users;
      case 'deals':
        return Briefcase;
      case 'leads':
      default:
        return Target;
    }
  };

  const Icon = getModuleIcon();

  const getEntityName = (item: any): string => {
    switch (targetModule) {
      case 'accounts':
        return item.accountName || item.name || item.accountNumber || 'Unnamed Account';
      case 'contacts':
        return `${item.firstName || ''} ${item.lastName || ''}`.trim() || item.contactNumber || 'Unnamed Contact';
      case 'deals':
        return item.dealName || item.title || item.dealNumber || 'Unnamed Deal';
      case 'leads':
      default:
        return `${item.firstName || ''} ${item.lastName || ''}`.trim() || item.leadNumber || 'Unnamed Lead';
    }
  };

  const filteredEntities = useMemo(() => {
    let list = entities;
    if (segmentFilter !== 'ALL') {
      list = list.filter((item) => getRecordSegment(item) === segmentFilter);
    }
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter((item) => {
      const name = getEntityName(item).toLowerCase();
      const num = String(item.leadNumber || item.accountNumber || item.contactNumber || item.dealNumber || '').toLowerCase();
      const email = String(item.email || '').toLowerCase();
      const company = String(item.company || item.accountName || '').toLowerCase();
      return name.includes(q) || num.includes(q) || email.includes(q) || company.includes(q);
    });
  }, [entities, searchQuery, segmentFilter, targetModule]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                {title || `Select ${targetModule.slice(0, -1)}`}
              </h2>
              <p className="text-xs text-slate-400">
                Choose a related {targetModule.slice(0, -1)} record to link.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar & Segment Filter */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/40 flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${targetModule} by name, number, email...`}
              autoFocus
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-center bg-slate-950 border border-slate-800 p-1 rounded-xl shrink-0">
            {(['ALL', 'B2B', 'B2C'] as const).map((seg) => (
              <button
                key={seg}
                type="button"
                onClick={() => setSegmentFilter(seg)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${segmentFilter === seg
                    ? seg === 'B2C'
                      ? 'bg-teal-600 text-white'
                      : 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                  }`}
              >
                {seg === 'ALL' ? 'All' : seg}
              </button>
            ))}
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 divide-y divide-slate-800/50">
          {loading ? (
            <div className="py-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
              <span className="text-xs">Loading {targetModule}...</span>
            </div>
          ) : filteredEntities.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-1">
              <p className="text-xs font-medium text-slate-400">No {targetModule} found.</p>
              <p className="text-[11px] text-slate-500">Try a different search query.</p>
            </div>
          ) : (
            filteredEntities.map((item) => {
              const name = getEntityName(item);
              const num = item.leadNumber || item.accountNumber || item.contactNumber || item.dealNumber;
              const subText =
                targetModule === 'contacts'
                  ? item.email || item.jobTitle
                  : targetModule === 'accounts'
                    ? item.industry || item.domain
                    : targetModule === 'deals'
                      ? `${formatCurrency(Number(item.amount || 0))} • ${item.stage || ''}`
                      : item.company || item.email;

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelect({ id: item.id, name, record: item });
                    onClose();
                  }}
                  className="group flex items-center justify-between p-3 rounded-xl hover:bg-indigo-950/30 cursor-pointer border border-transparent hover:border-indigo-500/30 transition-all pt-2"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-slate-800 text-slate-400 group-hover:text-indigo-300 group-hover:bg-indigo-600/20 transition-colors shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-200 group-hover:text-indigo-200 truncate">
                          {name}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full border font-semibold ${getSegmentMeta(getRecordSegment(item)).badgeClasses
                            }`}
                        >
                          {getRecordSegment(item)}
                        </span>
                        {num && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                            {num}
                          </span>
                        )}
                      </div>
                      {subText && (
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{subText}</p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shrink-0 ml-2"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3 border-t border-slate-800 bg-slate-900/90 text-xs">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default EntityLookupModal;
