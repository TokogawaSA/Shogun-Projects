/**
 * Entity Header & Action Toolbar Component (VTiger-Style)
 * Displays entity identifier, title, status badges, assigned user,
 * and quick actions (Edit, Convert Lead, Add Task, Delete).
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../../services/api';
import { EntityModuleName } from '../../../types/crmEntities';
import { getRecordSegment, getSegmentMeta } from '../utils/customerSegment';
import {
  ArrowLeft,
  Edit,
  UserCheck,
  PlusCircle,
  Trash2,
  Building2,
  Users,
  Briefcase,
  Target,
  User as UserIcon,
  AlertTriangle,
  FileSpreadsheet,
  Receipt,
} from 'lucide-react';

export interface EntityHeaderProps {
  moduleName: EntityModuleName;
  recordId: string;
  record: Record<string, any>;
  onOpenConvertLead?: () => void;
  onOpenAddTask?: () => void;
  onOpenCreateQuote?: () => void;
  onOpenCreateInvoice?: () => void;
  className?: string;
}

export const EntityHeader: React.FC<EntityHeaderProps> = ({
  moduleName,
  recordId,
  record,
  onOpenConvertLead,
  onOpenAddTask,
  onOpenCreateQuote,
  onOpenCreateInvoice,
  className = '',
}) => {
  const navigate = useNavigate();

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const segment = getRecordSegment(record);
  const segmentMeta = getSegmentMeta(segment);

  const getModuleIcon = () => {
    switch (moduleName) {
      case 'leads':
        return Target;
      case 'accounts':
        return segment === 'B2C' ? UserIcon : Building2;
      case 'contacts':
        return Users;
      case 'deals':
        return Briefcase;
    }
  };

  const Icon = getModuleIcon();

  // Formatted title and number display
  const recordNumber =
    record.leadNumber || record.accountNumber || record.contactNumber || record.dealNumber || record.id;

  const primaryTitle =
    moduleName === 'leads'
      ? `${record.firstName || ''} ${record.lastName || ''}`.trim() || 'Unnamed Lead'
      : moduleName === 'accounts'
        ? record.accountName || record.name || 'Unnamed Account'
        : moduleName === 'contacts'
          ? `${record.firstName || ''} ${record.lastName || ''}`.trim() || 'Unnamed Contact'
          : record.dealName || record.title || 'Unnamed Deal';

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await apiClient.delete(`/crm/${moduleName}/${recordId}`);
    } catch (err) {
      console.error('[EntityHeader] Delete error:', err);
    } finally {
      setIsDeleting(false);
      navigate(`/crm/${moduleName}`);
    }
  };

  return (
    <div
      className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-sm ${className}`}
    >
      {/* 1. Left: Back Button, Icon, Number & Title */}
      <div className="flex items-start md:items-center gap-4">
        <button
          onClick={() => navigate(`/crm/${moduleName}`)}
          title={`Back to ${moduleName}`}
          className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors mt-0.5 md:mt-0 shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-600/20 to-violet-600/20 border border-indigo-500/30 text-indigo-400 shrink-0">
          <Icon className="w-6 h-6" />
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold text-slate-400 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800 uppercase tracking-wide">
              {recordNumber}
            </span>

            {/* B2B / B2C Customer Segment Badge */}
            <span
              className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-semibold border ${segmentMeta.badgeClasses}`}
              title={segmentMeta.description}
            >
              {segment === 'B2B' ? (
                <Building2 className="w-3 h-3" />
              ) : (
                <UserIcon className="w-3 h-3" />
              )}
              {segmentMeta.fullLabel}
            </span>

            {/* Status / Stage Badges */}
            {record.leadStatus && (
              <span
                className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium border ${record.leadStatus === 'converted'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : record.leadStatus === 'lost'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                  }`}
              >
                {String(record.leadStatus).replace(/_/g, ' ')}
              </span>
            )}

            {record.stage && (
              <span
                className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium border ${record.stage === 'closed_won'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : record.stage === 'closed_lost'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                  }`}
              >
                {String(record.stage).replace(/_/g, ' ')}
              </span>
            )}

            {record.rating && (
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full font-medium border ${record.rating === 'hot'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                    : record.rating === 'warm'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                  }`}
              >
                {record.rating}
              </span>
            )}
          </div>

          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            {primaryTitle}
          </h1>

          {/* Assigned Owner sub-text */}
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full bg-indigo-600/30 text-indigo-300 flex items-center justify-center text-[10px]">
                <UserIcon className="w-2.5 h-2.5" />
              </div>
              <span>Assigned: <strong className="text-slate-300">{record.assignedUserName || 'CRM Admin'}</strong></span>
            </div>
            {moduleName === 'leads' && segment === 'B2B' && record.company && (
              <>
                <span>•</span>
                <span>Company: <strong className="text-slate-300">{record.company}</strong></span>
              </>
            )}
            {moduleName === 'leads' && segment === 'B2C' && (
              <>
                <span>•</span>
                <span>Profile: <strong className="text-teal-300">Individual Consumer</strong></span>
              </>
            )}
            {(record.accountName || record.account?.accountName) && (moduleName === 'contacts' || moduleName === 'deals') && (
              <>
                <span>•</span>
                <span>
                  {segment === 'B2C' ? 'Consumer Account' : 'Account'}:{' '}
                  <strong className="text-slate-300">{record.accountName || record.account?.accountName}</strong>
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. Right: Action Toolbar */}
      <div className="flex flex-wrap items-center gap-2 self-end md:self-auto">
        {/* Convert Lead Action Button (Visible for unconverted leads) */}
        {moduleName === 'leads' && !record.isConverted && (
          <button
            onClick={onOpenConvertLead}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl shadow-md shadow-emerald-600/20 transition-all"
          >
            <UserCheck className="w-3.5 h-3.5" />
            Convert Lead
          </button>
        )}

        {/* Create Quote & Invoice Shortcuts for Accounts, Deals, and B2C Contacts */}
        {(moduleName === 'accounts' || moduleName === 'deals' || (moduleName === 'contacts' && segment === 'B2C')) && onOpenCreateQuote && (
          <button
            onClick={onOpenCreateQuote}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            New Quote
          </button>
        )}

        {(moduleName === 'accounts' || moduleName === 'deals' || (moduleName === 'contacts' && segment === 'B2C')) && onOpenCreateInvoice && (
          <button
            onClick={onOpenCreateInvoice}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-sm"
          >
            <Receipt className="w-3.5 h-3.5" />
            New Invoice
          </button>
        )}

        {/* Add Task Shortcut */}
        <button
          onClick={onOpenAddTask}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-all"
        >
          <PlusCircle className="w-3.5 h-3.5 text-indigo-400" />
          Add Task
        </button>

        {/* Full Edit View */}
        <button
          onClick={() => navigate(`/crm/${moduleName}/${recordId}/edit`)}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-all"
        >
          <Edit className="w-3.5 h-3.5 text-slate-400" />
          Edit Record
        </button>

        {/* Delete Record */}
        <button
          onClick={() => setDeleteConfirmOpen(true)}
          className="p-2 text-slate-400 hover:text-rose-400 bg-slate-800 hover:bg-rose-500/10 rounded-xl border border-slate-700 transition-all"
          title="Delete Record"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-100">
                  Delete {primaryTitle}?
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Are you sure you want to permanently delete this {moduleName.slice(0, -1)}?
                </p>
              </div>
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
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-lg shadow-rose-600/25 transition-all disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EntityHeader;
