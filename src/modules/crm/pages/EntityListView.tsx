/**
 * Generic CRM Entity List View Component (VTiger-Style)
 * Unified filterable, sortable, and selectable table for Leads, Accounts, Contacts, Deals.
 * Includes debounced search, picklist filter pills, column visibility menu,
 * and sticky Mass Action Toolbar (Mass Edit, Mass Delete, Export CSV).
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import {
  EntityModuleName,
  FieldDefinition,
  CustomerSegment,
} from '../../../types/crmEntities';
import { useCurrency } from '../../../context/CurrencyContext';
import { MassEditModal } from '../components/MassEditModal';
import {
  getRecordSegment,
  getEntityFieldValue,
  getSegmentMeta,
} from '../utils/customerSegment';
import {
  Search,
  Plus,
  Filter,
  Columns,
  Download,
  Trash2,
  Edit3,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Building2,
  Users,
  Briefcase,
  Target,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Square,
  MoreHorizontal,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';

// ==========================================
// Default Field Schemas per Module
// ==========================================

const SEGMENT_COLUMN_FIELD: FieldDefinition = {
  name: 'customFields.customerSegment',
  label: 'Segment',
  type: 'picklist',
  column: 1,
  sortOrder: 1.5,
  picklistValues: [
    { label: 'B2B', value: 'B2B' },
    { label: 'B2C', value: 'B2C' },
  ],
};

const MODULE_SCHEMAS: Record<EntityModuleName, { title: string; singular: string; icon: any; fields: FieldDefinition[] }> = {
  leads: {
    title: 'Leads',
    singular: 'Lead',
    icon: Target,
    fields: [
      { name: 'leadNumber', label: 'Lead No', type: 'text', column: 1, sortOrder: 1, isReadOnly: true },
      SEGMENT_COLUMN_FIELD,
      { name: 'firstName', label: 'First Name', type: 'text', column: 1, sortOrder: 2, isRequired: true },
      { name: 'lastName', label: 'Last Name', type: 'text', column: 1, sortOrder: 3, isRequired: true },
      { name: 'company', label: 'Company', type: 'text', column: 1, sortOrder: 4, isRequired: true },
      { name: 'title', label: 'Title', type: 'text', column: 1, sortOrder: 5 },
      { name: 'email', label: 'Email', type: 'email', column: 1, sortOrder: 6, isRequired: true },
      { name: 'phone', label: 'Phone', type: 'phone', column: 1, sortOrder: 7 },
      {
        name: 'leadStatus',
        label: 'Status',
        type: 'picklist',
        column: 2,
        sortOrder: 8,
        isRequired: true,
        picklistValues: [
          { label: 'Unqualified', value: 'unqualified' },
          { label: 'Contacted', value: 'contacted' },
          { label: 'Pre Qualified', value: 'pre_qualified' },
          { label: 'Attempted Contact', value: 'attempted_contact' },
          { label: 'Converted', value: 'converted', color: '#10b981' },
          { label: 'Lost', value: 'lost', color: '#f43f5e' },
        ],
      },
      {
        name: 'rating',
        label: 'Rating',
        type: 'picklist',
        column: 2,
        sortOrder: 9,
        picklistValues: [
          { label: 'Hot', value: 'hot', color: '#f43f5e' },
          { label: 'Warm', value: 'warm', color: '#f59e0b' },
          { label: 'Cold', value: 'cold', color: '#0284c7' },
        ],
      },
      {
        name: 'leadSource',
        label: 'Source',
        type: 'picklist',
        column: 2,
        sortOrder: 10,
        picklistValues: ['cold_call', 'existing_customer', 'self_generated', 'employee', 'partner', 'public_relations', 'web_site', 'other'],
      },
      { name: 'industry', label: 'Industry', type: 'text', column: 2, sortOrder: 11 },
      { name: 'annualRevenue', label: 'Annual Revenue', type: 'currency', column: 2, sortOrder: 12 },
      { name: 'city', label: 'City', type: 'text', column: 2, sortOrder: 13 },
      { name: 'country', label: 'Country', type: 'text', column: 2, sortOrder: 14 },
      { name: 'assignedUserName', label: 'Assigned User', type: 'user', column: 2, sortOrder: 15 },
    ],
  },
  accounts: {
    title: 'Accounts',
    singular: 'Account',
    icon: Building2,
    fields: [
      { name: 'accountNumber', label: 'Account No', type: 'text', column: 1, sortOrder: 1, isReadOnly: true },
      SEGMENT_COLUMN_FIELD,
      { name: 'accountName', label: 'Account Name', type: 'text', column: 1, sortOrder: 2, isRequired: true },
      { name: 'domain', label: 'Domain', type: 'text', column: 1, sortOrder: 3 },
      { name: 'industry', label: 'Industry', type: 'text', column: 1, sortOrder: 4, isRequired: true },
      {
        name: 'accountType',
        label: 'Type',
        type: 'picklist',
        column: 1,
        sortOrder: 5,
        picklistValues: ['customer', 'prospect', 'partner', 'vendor', 'reseller', 'individual', 'consumer', 'household'],
      },
      {
        name: 'rating',
        label: 'Rating',
        type: 'picklist',
        column: 1,
        sortOrder: 6,
        picklistValues: ['hot', 'warm', 'cold'],
      },
      { name: 'annualRevenue', label: 'Annual Revenue', type: 'currency', column: 1, sortOrder: 7 },
      { name: 'primaryPhone', label: 'Phone', type: 'phone', column: 2, sortOrder: 8 },
      { name: 'email', label: 'Email', type: 'email', column: 2, sortOrder: 9 },
      { name: 'billingCity', label: 'City', type: 'text', column: 2, sortOrder: 10 },
      { name: 'billingCountry', label: 'Country', type: 'text', column: 2, sortOrder: 11 },
      { name: 'linkedProjectCount', label: 'Projects', type: 'number', column: 2, sortOrder: 12, isReadOnly: true },
      { name: 'activeDealCount', label: 'Deals', type: 'number', column: 2, sortOrder: 13, isReadOnly: true },
      { name: 'assignedUserName', label: 'Assigned User', type: 'user', column: 2, sortOrder: 14 },
    ],
  },
  contacts: {
    title: 'Contacts',
    singular: 'Contact',
    icon: Users,
    fields: [
      { name: 'contactNumber', label: 'Contact No', type: 'text', column: 1, sortOrder: 1, isReadOnly: true },
      SEGMENT_COLUMN_FIELD,
      { name: 'firstName', label: 'First Name', type: 'text', column: 1, sortOrder: 2, isRequired: true },
      { name: 'lastName', label: 'Last Name', type: 'text', column: 1, sortOrder: 3, isRequired: true },
      { name: 'accountName', label: 'Account', type: 'reference', referenceModule: 'accounts', column: 1, sortOrder: 4 },
      { name: 'email', label: 'Email', type: 'email', column: 1, sortOrder: 5, isRequired: true },
      { name: 'phone', label: 'Phone', type: 'phone', column: 1, sortOrder: 6 },
      { name: 'mobile', label: 'Mobile', type: 'phone', column: 1, sortOrder: 7 },
      { name: 'jobTitle', label: 'Job Title', type: 'text', column: 2, sortOrder: 8 },
      { name: 'department', label: 'Department', type: 'text', column: 2, sortOrder: 9 },
      { name: 'isPrimaryContact', label: 'Primary', type: 'boolean', column: 2, sortOrder: 10 },
      { name: 'mailingCity', label: 'City', type: 'text', column: 2, sortOrder: 11 },
      { name: 'mailingCountry', label: 'Country', type: 'text', column: 2, sortOrder: 12 },
      { name: 'assignedUserName', label: 'Assigned User', type: 'user', column: 2, sortOrder: 13 },
    ],
  },
  deals: {
    title: 'Opportunities & Deals',
    singular: 'Deal',
    icon: Briefcase,
    fields: [
      { name: 'dealNumber', label: 'Deal No', type: 'text', column: 1, sortOrder: 1, isReadOnly: true },
      SEGMENT_COLUMN_FIELD,
      { name: 'dealName', label: 'Deal Name', type: 'text', column: 1, sortOrder: 2, isRequired: true },
      { name: 'accountName', label: 'Account', type: 'reference', referenceModule: 'accounts', column: 1, sortOrder: 3 },
      { name: 'contactName', label: 'Contact', type: 'reference', referenceModule: 'contacts', column: 1, sortOrder: 4 },
      { name: 'amount', label: 'Amount', type: 'currency', column: 1, sortOrder: 5, isRequired: true },
      {
        name: 'stage',
        label: 'Stage',
        type: 'picklist',
        column: 1,
        sortOrder: 6,
        isRequired: true,
        picklistValues: [
          { label: 'Prospecting', value: 'prospecting' },
          { label: 'Qualification', value: 'qualification' },
          { label: 'Needs Analysis', value: 'needs_analysis' },
          { label: 'Value Proposition', value: 'value_proposition' },
          { label: 'Proposal / Price Quote', value: 'proposal_price_quote' },
          { label: 'Negotiation / Review', value: 'negotiation_review' },
          { label: 'Closed Won', value: 'closed_won', color: '#10b981' },
          { label: 'Closed Lost', value: 'closed_lost', color: '#f43f5e' },
        ],
      },
      { name: 'probability', label: 'Probability (%)', type: 'percentage', column: 2, sortOrder: 7 },
      {
        name: 'dealType',
        label: 'Type',
        type: 'picklist',
        column: 2,
        sortOrder: 8,
        picklistValues: ['new_business', 'existing_business'],
      },
      { name: 'closingDate', label: 'Close Date', type: 'date', column: 2, sortOrder: 9, isRequired: true },
      { name: 'leadSource', label: 'Source', type: 'picklist', column: 2, sortOrder: 10, picklistValues: ['cold_call', 'existing_customer', 'self_generated', 'web_site', 'other'] },
      { name: 'assignedUserName', label: 'Assigned User', type: 'user', column: 2, sortOrder: 11 },
    ],
  },
};


export const EntityListView: React.FC = () => {
  const { formatCurrency } = useCurrency();
  const { module: routeModule } = useParams<{ module: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const tenantId = user?.tenantId || 'tenant-enterprise-root';

  // Determine current active entity module
  const currentModule: EntityModuleName = (
    ['leads', 'accounts', 'contacts', 'deals'].includes(routeModule || '')
      ? routeModule
      : 'leads'
  ) as EntityModuleName;

  const schema = MODULE_SCHEMAS[currentModule] || MODULE_SCHEMAS.leads;
  const ModuleIcon = schema.icon;

  // Local State
  const [entities, setEntities] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeFilterPill, setActiveFilterPill] = useState<string>('all');
  const [segmentFilter, setSegmentFilter] = useState<'ALL' | CustomerSegment>('ALL');
  const [reloadTick, setReloadTick] = useState<number>(0);
  const [isMassEditOpen, setIsMassEditOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);
  const [columnMenuOpen, setColumnMenuOpen] = useState<boolean>(false);

  // Sorting
  const [sortField, setSortField] = useState<string>(
    currentModule === 'deals' ? 'amount' : currentModule === 'leads' ? 'createdAt' : 'accountName'
  );
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Column Visibility Persistence
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`crm_cols_${currentModule}`);
      if (saved) return JSON.parse(saved);
    } catch { }
    // Default: first 6-7 fields
    return schema.fields.slice(0, 7).map((f) => f.name);
  });

  // Reset page & filters when module changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`crm_cols_${currentModule}`);
      if (saved) {
        setVisibleColumns(JSON.parse(saved));
      } else {
        setVisibleColumns(schema.fields.slice(0, 7).map((f) => f.name));
      }
    } catch {
      setVisibleColumns(schema.fields.slice(0, 7).map((f) => f.name));
    }
    setSelectedIds([]);
    setActiveFilterPill('all');
    setSegmentFilter('ALL');
    setCurrentPage(1);
    setSearchQuery('');
  }, [currentModule]);

  // Save Column Preference
  const toggleColumn = (fieldName: string) => {
    setVisibleColumns((prev) => {
      const updated = prev.includes(fieldName)
        ? prev.filter((name) => name !== fieldName)
        : [...prev, fieldName];
      try {
        localStorage.setItem(`crm_cols_${currentModule}`, JSON.stringify(updated));
      } catch { }
      return updated;
    });
  };

  // Load entities via REST API
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const loadEntities = async () => {
      try {
        const res = await apiClient.get<any[]>(`/crm/${currentModule}`);
        if (Array.isArray(res) && isMounted) {
          setEntities(res);
        }
      } catch (err) {
        console.warn(`[EntityListView] API fetch error for ${currentModule}:`, err);
        if (isMounted) setEntities([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadEntities();
    return () => {
      isMounted = false;
    };
  }, [currentModule, tenantId, reloadTick]);

  // Primary Picklist Filter definition for pills
  const filterPillOptions = useMemo(() => {
    if (currentModule === 'leads') {
      return [
        { label: 'All Leads', value: 'all' },
        { label: 'Unqualified', value: 'unqualified' },
        { label: 'Contacted', value: 'contacted' },
        { label: 'Pre Qualified', value: 'pre_qualified' },
        { label: 'Converted', value: 'converted' },
        { label: 'Lost', value: 'lost' },
      ];
    }
    if (currentModule === 'deals') {
      return [
        { label: 'All Deals', value: 'all' },
        { label: 'Prospecting', value: 'prospecting' },
        { label: 'Qualification', value: 'qualification' },
        { label: 'Proposal', value: 'proposal_price_quote' },
        { label: 'Negotiation', value: 'negotiation_review' },
        { label: 'Closed Won', value: 'closed_won' },
        { label: 'Closed Lost', value: 'closed_lost' },
      ];
    }
    if (currentModule === 'accounts') {
      return [
        { label: 'All Accounts', value: 'all' },
        { label: 'Customers', value: 'customer' },
        { label: 'Individuals (B2C)', value: 'individual' },
        { label: 'Prospects', value: 'prospect' },
        { label: 'Partners', value: 'partner' },
        { label: 'Vendors', value: 'vendor' },
      ];
    }
    if (currentModule === 'contacts') {
      return [
        { label: 'All Contacts', value: 'all' },
        { label: 'Primary Contacts', value: 'primary_only' },
      ];
    }
    return [{ label: 'All', value: 'all' }];
  }, [currentModule]);

  const segmentCounts = useMemo(() => {
    let b2b = 0;
    let b2c = 0;
    entities.forEach((e) => {
      if (getRecordSegment(e) === 'B2C') b2c += 1;
      else b2b += 1;
    });
    return { all: entities.length, b2b, b2c };
  }, [entities]);

  // Filtered & Searched Data
  const filteredEntities = useMemo(() => {
    let result = entities;

    // B2B / B2C segment filter
    if (segmentFilter !== 'ALL') {
      result = result.filter((e) => getRecordSegment(e) === segmentFilter);
    }

    // Filter pill logic
    if (activeFilterPill !== 'all') {
      if (currentModule === 'leads') {
        result = result.filter((e) => e.leadStatus === activeFilterPill);
      } else if (currentModule === 'deals') {
        result = result.filter((e) => e.stage === activeFilterPill);
      } else if (currentModule === 'accounts') {
        if (activeFilterPill === 'individual') {
          result = result.filter((e) =>
            ['individual', 'consumer', 'household'].includes(String(e.accountType || '').toLowerCase()) ||
            getRecordSegment(e) === 'B2C'
          );
        } else {
          result = result.filter((e) => e.accountType === activeFilterPill);
        }
      } else if (currentModule === 'contacts' && activeFilterPill === 'primary_only') {
        result = result.filter((e) => e.isPrimaryContact === true);
      }
    }

    // Search query logic
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((e) => {
        return Object.values(e).some((val) => {
          if (val === null || val === undefined) return false;
          if (typeof val === 'string' || typeof val === 'number') {
            return String(val).toLowerCase().includes(q);
          }
          return false;
        });
      });
    }

    // Sorting logic
    result = [...result].sort((a, b) => {
      const valA = getEntityFieldValue(a, sortField);
      const valB = getEntityFieldValue(b, sortField);

      if (valA === valB) return 0;
      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortAsc ? valA - valB : valB - valA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      return sortAsc ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });

    return result;
  }, [entities, segmentFilter, activeFilterPill, searchQuery, sortField, sortAsc, currentModule]);

  // Paginated Slices
  const totalCount = filteredEntities.length;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const paginatedEntities = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredEntities.slice(start, start + pageSize);
  }, [filteredEntities, currentPage, pageSize]);

  // Checkbox Selection
  const allCurrentPageSelected =
    paginatedEntities.length > 0 &&
    paginatedEntities.every((e) => selectedIds.includes(e.id));

  const toggleSelectAllCurrentPage = () => {
    if (allCurrentPageSelected) {
      const pageIds = new Set(paginatedEntities.map((e) => e.id));
      setSelectedIds((prev) => prev.filter((id) => !pageIds.has(id)));
    } else {
      const newSelected = new Set(selectedIds);
      paginatedEntities.forEach((e) => newSelected.add(e.id));
      setSelectedIds(Array.from(newSelected));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Mass Delete Execution
  const handleMassDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsDeleting(true);
    try {
      await Promise.all(
        selectedIds.map((recordId) =>
          apiClient.delete(`/crm/${currentModule}/${recordId}`).catch(() => { })
        )
      );

      setEntities((prev) => prev.filter((e) => !selectedIds.includes(e.id)));
      setSelectedIds([]);
      setDeleteConfirmOpen(false);
    } catch (err) {
      console.error('[MassDelete Error]:', err);
      // Fallback local remove
      setEntities((prev) => prev.filter((e) => !selectedIds.includes(e.id)));
      setSelectedIds([]);
      setDeleteConfirmOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  // CSV Export Utility
  const handleExportCSV = useCallback(() => {
    if (selectedIds.length === 0) return;

    const exportRows = entities.filter((e) => selectedIds.includes(e.id));
    const activeCols = schema.fields.filter((f) => visibleColumns.includes(f.name));

    const headers = activeCols.map((c) => `"${c.label.replace(/"/g, '""')}"`).join(',');
    const rows = exportRows.map((row) => {
      return activeCols
        .map((col) => {
          let val = getEntityFieldValue(row, col.name);
          if (typeof val === 'object' && val !== null) {
            val = JSON.stringify(val);
          }
          const sanitized = val !== undefined && val !== null ? String(val) : '';
          return `"${sanitized.replace(/"/g, '""')}"`;
        })
        .join(',');
    });

    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${currentModule}_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [entities, selectedIds, schema.fields, visibleColumns, currentModule]);

  // Handle Sort Header Click
  const handleHeaderSort = (fieldName: string) => {
    if (sortField === fieldName) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(fieldName);
      setSortAsc(true);
    }
  };

  // Helper for row title / primary link
  const getPrimaryDisplay = (item: any) => {
    switch (currentModule) {
      case 'leads':
        return `${item.firstName || ''} ${item.lastName || ''}`.trim() || item.leadNumber || 'Untitled Lead';
      case 'accounts':
        return item.accountName || item.name || item.accountNumber || 'Untitled Account';
      case 'contacts':
        return `${item.firstName || ''} ${item.lastName || ''}`.trim() || item.contactNumber || 'Untitled Contact';
      case 'deals':
        return item.dealName || item.title || item.dealNumber || 'Untitled Deal';
      default:
        return item.name || item.id;
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4 p-6 bg-slate-950 text-slate-100 animate-fadeIn">
      {/* 1. Page Header & Module Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-600/20 to-violet-600/20 border border-indigo-500/30 text-indigo-400">
            <ModuleIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              {schema.title}
              <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                {totalCount} {totalCount === 1 ? schema.singular : schema.title}
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Manage multi-tenant {schema.title.toLowerCase()}, layouts, and sales workflows.
            </p>
          </div>
        </div>

        {/* Module Switcher Buttons & New Record CTA */}
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl">
            {(['leads', 'accounts', 'contacts', 'deals'] as EntityModuleName[]).map((mod) => (
              <button
                key={mod}
                onClick={() => navigate(`/crm/${mod}`)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${currentModule === mod
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
              >
                {MODULE_SCHEMAS[mod].title}
              </button>
            ))}
          </div>

          <button
            onClick={() => navigate(`/crm/${currentModule}/new`)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-xl shadow-lg shadow-indigo-500/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            New {schema.singular}
          </button>
        </div>
      </div>

      {/* 2. Search Bar & Filter Pills Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${schema.title.toLowerCase()} by name, email, number...`}
            className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* B2B / B2C Segment Filter Toggle */}
        <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl shrink-0">
          {(
            [
              { key: 'ALL', label: `All (${segmentCounts.all})` },
              { key: 'B2B', label: `B2B (${segmentCounts.b2b})` },
              { key: 'B2C', label: `B2C (${segmentCounts.b2c})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setSegmentFilter(tab.key);
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${segmentFilter === tab.key
                  ? tab.key === 'B2C'
                    ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/20'
                    : 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full">
          {filterPillOptions.map((pill) => (
            <button
              key={pill.value}
              onClick={() => setActiveFilterPill(pill.value)}
              className={`text-xs px-3 py-1.5 rounded-xl border whitespace-nowrap transition-all ${activeFilterPill === pill.value
                  ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 font-medium'
                  : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:bg-slate-800/80 hover:text-slate-200'
                }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Column Visibility Menu Button */}
        <div className="relative">
          <button
            onClick={() => setColumnMenuOpen(!columnMenuOpen)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl transition-all"
          >
            <Columns className="w-3.5 h-3.5 text-indigo-400" />
            Columns ({visibleColumns.length})
          </button>

          {columnMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2 z-40 space-y-1 max-h-72 overflow-y-auto">
              <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                Visible Columns
              </div>
              {schema.fields.map((f) => (
                <label
                  key={f.name}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-800/60 cursor-pointer text-xs text-slate-300 select-none"
                >
                  <input
                    type="checkbox"
                    checked={visibleColumns.includes(f.name)}
                    onChange={() => toggleColumn(f.name)}
                    className="w-3.5 h-3.5 rounded text-indigo-600 bg-slate-950 border-slate-700 focus:ring-indigo-500"
                  />
                  <span>{f.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. STICKY MASS ACTION TOOLBAR (When rows are selected) */}
      {selectedIds.length > 0 && (
        <div className="sticky top-2 z-30 flex items-center justify-between p-3 bg-gradient-to-r from-indigo-950/90 to-slate-900/95 border border-indigo-500/40 rounded-2xl shadow-2xl backdrop-blur-md animate-slideDown">
          <div className="flex items-center gap-2 text-xs text-indigo-200 font-medium pl-2">
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 font-bold">
              {selectedIds.length}
            </span>
            <span>{currentModule} selected</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Mass Edit */}
            <button
              onClick={() => setIsMassEditOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-200 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 rounded-xl transition-all"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Mass Edit
            </button>

            {/* Export CSV */}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-200 bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/30 rounded-xl transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>

            {/* Mass Delete */}
            <button
              onClick={() => setDeleteConfirmOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-200 bg-rose-600/20 hover:bg-rose-600/40 border border-rose-500/30 rounded-xl transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Mass Delete
            </button>

            {/* Clear Selection */}
            <button
              onClick={() => setSelectedIds([])}
              title="Clear selection"
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 4. Table Container */}
      <div className="flex-1 min-h-0 bg-slate-900/60 border border-slate-800/90 rounded-2xl overflow-hidden shadow-xl flex flex-col">
        <div className="flex-1 overflow-x-auto overflow-y-auto">
          <table className="w-full text-left text-xs text-slate-300 border-collapse">
            {/* Table Header */}
            <thead className="bg-slate-900/95 sticky top-0 z-20 border-b border-slate-800 text-slate-400 select-none backdrop-blur-sm">
              <tr>
                {/* Select All Checkbox */}
                <th className="w-10 px-4 py-3 text-center">
                  <button
                    type="button"
                    onClick={toggleSelectAllCurrentPage}
                    className="text-slate-400 hover:text-indigo-400 focus:outline-none"
                  >
                    {allCurrentPageSelected ? (
                      <CheckSquare className="w-4 h-4 text-indigo-400" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>

                {/* Primary Title Column */}
                <th
                  onClick={() => handleHeaderSort(currentModule === 'deals' ? 'dealName' : currentModule === 'accounts' ? 'accountName' : 'lastName')}
                  className="px-4 py-3 font-semibold text-slate-200 cursor-pointer hover:text-indigo-400 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{schema.singular} Name</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>

                {/* Active Dynamic Columns */}
                {schema.fields
                  .filter((f) => visibleColumns.includes(f.name))
                  .map((field) => (
                    <th
                      key={field.name}
                      onClick={() => handleHeaderSort(field.name)}
                      className="px-4 py-3 font-semibold text-slate-200 cursor-pointer hover:text-indigo-400 transition-colors whitespace-nowrap"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{field.label}</span>
                        {sortField === field.name ? (
                          sortAsc ? (
                            <ArrowUp className="w-3 h-3 text-indigo-400" />
                          ) : (
                            <ArrowDown className="w-3 h-3 text-indigo-400" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-30" />
                        )}
                      </div>
                    </th>
                  ))}

                {/* Action Col */}
                <th className="w-16 px-4 py-3 text-right">Action</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td
                    colSpan={visibleColumns.length + 3}
                    className="py-16 text-center text-slate-400"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
                      <span>Loading {schema.title.toLowerCase()}...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedEntities.length === 0 ? (
                <tr>
                  <td
                    colSpan={visibleColumns.length + 3}
                    className="py-16 text-center text-slate-500"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Filter className="w-8 h-8 opacity-40 text-slate-400" />
                      <p className="text-sm font-medium text-slate-300">
                        No {schema.title.toLowerCase()} match your filters.
                      </p>
                      <p className="text-xs text-slate-500">
                        Try adjusting your search criteria or create a new record.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedEntities.map((item) => {
                  const isSelected = selectedIds.includes(item.id);
                  const titleDisplay = getPrimaryDisplay(item);

                  return (
                    <tr
                      key={item.id}
                      className={`group transition-colors ${isSelected
                          ? 'bg-indigo-950/30 hover:bg-indigo-950/40'
                          : 'hover:bg-slate-800/40'
                        }`}
                    >
                      {/* Checkbox */}
                      <td className="w-10 px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => toggleSelectRow(item.id)}
                          className="text-slate-400 hover:text-indigo-400 focus:outline-none"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-indigo-400" />
                          ) : (
                            <Square className="w-4 h-4 opacity-50 group-hover:opacity-100" />
                          )}
                        </button>
                      </td>

                      {/* Primary Name Link */}
                      <td className="px-4 py-3 font-medium text-indigo-300 hover:text-indigo-200">
                        <Link
                          to={`/crm/${currentModule}/${item.id}`}
                          className="flex items-center gap-2 group-hover:underline"
                        >
                          <span className="truncate max-w-[220px]">{titleDisplay}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full border font-semibold shrink-0 ${getSegmentMeta(getRecordSegment(item)).badgeClasses
                              }`}
                          >
                            {getRecordSegment(item)}
                          </span>
                          {item.isConverted && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              Converted
                            </span>
                          )}
                        </Link>
                      </td>

                      {/* Dynamic Field Values */}
                      {schema.fields
                        .filter((f) => visibleColumns.includes(f.name))
                        .map((field) => {
                          const val = getEntityFieldValue(item, field.name);

                          if (val === null || val === undefined || val === '') {
                            return (
                              <td key={field.name} className="px-4 py-3 text-slate-500 italic">
                                —
                              </td>
                            );
                          }

                          if (field.type === 'currency') {
                            return (
                              <td key={field.name} className="px-4 py-3 text-emerald-400 font-medium font-mono">
                                {formatCurrency(val)}
                              </td>
                            );
                          }

                          if (field.type === 'percentage') {
                            return (
                              <td key={field.name} className="px-4 py-3 text-indigo-300 font-medium">
                                {val}%
                              </td>
                            );
                          }

                          if (field.type === 'picklist') {
                            return (
                              <td key={field.name} className="px-4 py-3">
                                <span className="inline-flex text-[11px] px-2 py-0.5 rounded-full border border-slate-700 bg-slate-800 text-slate-200 capitalize">
                                  {String(val).replace(/_/g, ' ')}
                                </span>
                              </td>
                            );
                          }

                          if (field.type === 'boolean') {
                            return (
                              <td key={field.name} className="px-4 py-3">
                                <span
                                  className={`text-[11px] px-2 py-0.5 rounded ${val
                                      ? 'bg-emerald-500/20 text-emerald-300'
                                      : 'bg-slate-800 text-slate-400'
                                    }`}
                                >
                                  {val ? 'Yes' : 'No'}
                                </span>
                              </td>
                            );
                          }

                          return (
                            <td key={field.name} className="px-4 py-3 text-slate-300 truncate max-w-[180px]">
                              {String(val)}
                            </td>
                          );
                        })}

                      {/* Row Action Link */}
                      <td className="px-4 py-3 text-right">
                        <Link
                          to={`/crm/${currentModule}/${item.id}`}
                          className="p-1 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg inline-flex items-center justify-center transition-colors"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 5. Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-3 border-t border-slate-800 bg-slate-900/80 text-xs text-slate-400 select-none">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="pl-2">
              Showing {totalCount > 0 ? (currentPage - 1) * pageSize + 1 : 0} -{' '}
              {Math.min(currentPage * pageSize, totalCount)} of {totalCount}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span>
              Page <strong className="text-slate-200">{currentPage}</strong> of{' '}
              <strong className="text-slate-200">{totalPages}</strong>
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 6. Mass Edit Modal */}
      <MassEditModal
        isOpen={isMassEditOpen}
        onClose={() => setIsMassEditOpen(false)}
        moduleName={currentModule}
        selectedIds={selectedIds}
        selectedRecords={entities.filter((e) => selectedIds.includes(e.id))}
        fields={schema.fields}
        onSuccess={() => {
          setSelectedIds([]);
          setReloadTick((t) => t + 1);
        }}
      />

      {/* 7. Mass Delete Confirmation Modal */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-100">
                  Delete {selectedIds.length} {currentModule}?
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  This action is permanent and cannot be undone.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
              You are about to delete <strong className="text-rose-300">{selectedIds.length}</strong> selected records from the database.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(false)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleMassDelete}
                disabled={isDeleting}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-lg shadow-rose-600/25 transition-all disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : `Confirm Delete (${selectedIds.length})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EntityListView;
