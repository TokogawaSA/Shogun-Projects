/**
 * Entity Summary Widget Component (VTiger-Style)
 * Displays a 4-column key metrics highlight banner and
 * a real-time Activity Timeline stream with quick note creation.
 */

import React, { useState, useEffect } from 'react';
import { apiClient } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { EntityModuleName } from '../../../types/crmEntities';
import { getRecordSegment } from '../utils/customerSegment';
import {
  Coins,
  Briefcase,
  Layers,
  Activity,
  Send,
  MessageSquare,
  Clock,
  User,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { useCurrency } from '../../../context/CurrencyContext';

export interface EntitySummaryWidgetProps {
  moduleName: EntityModuleName;
  record: Record<string, any>;
  className?: string;
}

export interface ActivityItem {
  id: string;
  action: string;
  description: string;
  userId: string;
  userName: string;
  timestamp: any;
  notes?: string;
  metadata?: Record<string, any>;
}

export const EntitySummaryWidget: React.FC<EntitySummaryWidgetProps> = ({
  moduleName,
  record,
  className = '',
}) => {
  const { user } = useAuth();
  const { currencyCode, formatCurrency } = useCurrency();
  const tenantId = user?.tenantId || 'tenant-default';

  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loadingActivities, setLoadingActivities] = useState<boolean>(true);
  const [newNote, setNewNote] = useState<string>('');
  const [postingNote, setPostingNote] = useState<boolean>(false);

  // Subscribe to Activity Logs for this entity
  useEffect(() => {
    if (!record.id) return;

    let isMounted = true;
    setLoadingActivities(true);

    const loadActivities = async () => {
      try {
        const res = await apiClient.get<ActivityItem[]>(`/crm/activities?entityId=${record.id}`).catch(() => []);
        if (Array.isArray(res) && res.length > 0 && isMounted) {
          setActivities(res);
        } else if (isMounted) {
          const initialLog: ActivityItem = {
            id: 'init-log-01',
            action: 'created',
            description: `${moduleName.slice(0, -1).toUpperCase()} record initialized in system.`,
            userId: record.createdById || user?.uid || 'usr-admin-master',
            userName: record.assignedUserName || user?.displayName || 'CRM Admin',
            timestamp: record.createdAt || new Date().toISOString(),
          };
          setActivities([initialLog]);
        }
      } catch (err) {
        console.warn('[EntitySummaryWidget] Activity log error:', err);
        if (isMounted) {
          setActivities([]);
        }
      } finally {
        if (isMounted) setLoadingActivities(false);
      }
    };

    loadActivities();
    return () => {
      isMounted = false;
    };
  }, [moduleName, record.id, tenantId, user, record.createdById, record.assignedUserName, record.createdAt]);

  const handlePostNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || postingNote || !record.id) return;

    setPostingNote(true);
    const newLogItem: ActivityItem = {
      id: `act_${Date.now()}`,
      action: 'note_added',
      userId: user?.uid || 'usr-admin',
      userName: user?.displayName || user?.email?.split('@')[0] || 'CRM User',
      description: newNote.trim(),
      timestamp: new Date().toISOString(),
    };

    try {
      await apiClient.post('/crm/activities', {
        tenantId,
        moduleName,
        entityId: record.id,
        ...newLogItem,
      });

      setActivities((prev) => [newLogItem, ...prev]);
      setNewNote('');
    } catch (err) {
      console.error('[EntitySummaryWidget] Post note error:', err);
    } finally {
      setPostingNote(false);
    }
  };

  // 4-Column Key Metrics Configuration based on entity type & B2B/B2C segment
  const segment = getRecordSegment(record);
  const isB2C = segment === 'B2C';
  const custom = (record.customFields as Record<string, any>) || {};

  const renderMetricCards = () => {
    switch (moduleName) {
      case 'deals':
        return (
          <>
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/20 shadow-md">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>{isB2C ? 'Order / Deal Value' : 'Deal Value'}</span>
                <Coins className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xl font-bold text-emerald-400 font-mono">
                {formatCurrency(record.amount)}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 font-mono">Currency: {currencyCode}</div>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/20 shadow-md">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Sales Stage</span>
                <Briefcase className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-base font-semibold text-slate-100 capitalize">
                {String(record.stage || 'prospecting').replace(/_/g, ' ')}
              </div>
              <div className="text-[11px] text-indigo-300 mt-0.5">Win Prob: {record.probability || 20}%</div>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/20 shadow-md">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Expected Close</span>
                <Calendar className="w-4 h-4 text-sky-400" />
              </div>
              <div className="text-sm font-semibold text-slate-100">
                {record.closingDate ? new Date(record.closingDate).toLocaleDateString() : '—'}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 capitalize">
                {segment} • {String(record.dealType || (isB2C ? 'b2c_direct' : 'new_business')).replace(/_/g, ' ')}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/20 shadow-md">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>{isB2C ? 'Consumer / Buyer' : 'Primary Account'}</span>
                <User className="w-4 h-4 text-violet-400" />
              </div>
              <div className="text-sm font-semibold text-indigo-300 truncate">
                {isB2C
                  ? record.contactName || record.accountName || 'Direct Consumer'
                  : record.accountName || record.account?.accountName || 'No Linked Account'}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                {isB2C
                  ? `Account: ${record.accountName || record.account?.accountName || 'Individual'}`
                  : `Contact: ${record.contactName || 'Unassigned'}`}
              </div>
            </div>
          </>
        );

      case 'leads':
        return (
          <>
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/20 shadow-md">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Lead Status</span>
                <Sparkles className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-base font-semibold text-slate-100 capitalize">
                {String(record.leadStatus || 'unqualified').replace(/_/g, ' ')}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Rating: <span className="font-semibold text-amber-400 capitalize">{record.rating || 'warm'}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/20 shadow-md">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>{isB2C ? 'Estimated Budget' : 'Annual Revenue'}</span>
                <Coins className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-lg font-bold text-emerald-400 font-mono">
                {formatCurrency(isB2C ? custom.estimatedBudget ?? record.annualRevenue : record.annualRevenue)}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {isB2C ? 'Est. Consumer Spend' : 'Est. Budget Pool'}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/20 shadow-md">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>{isB2C ? 'Consumer Channel' : 'Company & Role'}</span>
                <Briefcase className="w-4 h-4 text-violet-400" />
              </div>
              <div className="text-sm font-semibold text-slate-100 truncate capitalize">
                {isB2C
                  ? custom.preferredChannel || 'WhatsApp / Email'
                  : record.company || 'Private Individual'}
              </div>
              <div className="text-[11px] text-indigo-300 mt-0.5 truncate">
                {isB2C
                  ? custom.marketingOptIn
                    ? 'POPIA Opted In'
                    : 'B2C Individual Lead'
                  : record.title || 'Prospect'}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/20 shadow-md">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Lead Source</span>
                <Activity className="w-4 h-4 text-sky-400" />
              </div>
              <div className="text-sm font-semibold text-slate-200 capitalize truncate">
                {String(record.leadSource || 'web_site').replace(/_/g, ' ')}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {record.isConverted
                  ? isB2C
                    ? 'Converted to Consumer'
                    : 'Converted to Account'
                  : `${segment} Pipeline Prospect`}
              </div>
            </div>
          </>
        );

      case 'accounts':
        return (
          <>
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/20 shadow-md">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>{isB2C ? 'Consumer Profile' : 'Account Type'}</span>
                <ShieldCheck className="w-4 h-4 text-teal-400" />
              </div>
              <div className="text-base font-semibold text-slate-100 capitalize">
                {record.accountType || (isB2C ? 'Individual' : 'Customer')}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {segment} • Rating: {record.rating || 'hot'}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/20 shadow-md">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>{isB2C ? 'Loyalty & Channel' : 'Annual Revenue'}</span>
                <Coins className="w-4 h-4 text-emerald-400" />
              </div>
              {isB2C ? (
                <>
                  <div className="text-base font-bold text-amber-300 capitalize">
                    {custom.loyaltyTier || 'Standard'} Tier
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 capitalize">
                    Channel: {custom.preferredChannel || 'Email'}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-lg font-bold text-emerald-400 font-mono">
                    {formatCurrency(record.annualRevenue)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Industry: {record.industry || 'Tech'}</div>
                </>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/20 shadow-md">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>{isB2C ? 'Active Orders / Deals' : 'Active Deals'}</span>
                <Briefcase className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-xl font-bold text-indigo-300">
                {record.activeDealCount ?? record.deals?.length ?? 0}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Sales Opportunities</div>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/20 shadow-md">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Linked Projects</span>
                <Layers className="w-4 h-4 text-violet-400" />
              </div>
              <div className="text-xl font-bold text-violet-300">
                {record.linkedProjectCount ?? record.projects?.length ?? 0}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Delivery Workspaces</div>
            </div>
          </>
        );

      case 'contacts':
      default:
        return (
          <>
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/20 shadow-md">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>{isB2C ? 'Customer Segment' : 'Primary Affiliation'}</span>
                <User className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-sm font-semibold text-slate-100 truncate">
                {isB2C
                  ? 'B2C Individual Consumer'
                  : record.accountName || record.account?.accountName || 'Direct Contact'}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {isB2C
                  ? `Tier: ${(custom.loyaltyTier || 'standard').toUpperCase()}`
                  : record.isPrimaryContact
                    ? 'Primary Key Contact'
                    : 'Affiliate Contact'}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/20 shadow-md">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>{isB2C ? 'Preferred Channel' : 'Department'}</span>
                <Briefcase className="w-4 h-4 text-violet-400" />
              </div>
              <div className="text-sm font-semibold text-slate-100 truncate capitalize">
                {isB2C ? custom.preferredChannel || 'WhatsApp' : record.department || 'General'}
              </div>
              <div className="text-[11px] text-indigo-300 mt-0.5 truncate">
                {isB2C
                  ? custom.marketingOptIn
                    ? 'POPIA Consent: Opted In'
                    : 'POPIA Consent: Not Opted In'
                  : record.jobTitle || 'Representative'}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/20 shadow-md">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Email Address</span>
                <MessageSquare className="w-4 h-4 text-sky-400" />
              </div>
              <div className="text-xs font-semibold text-indigo-300 truncate">
                {record.email || '—'}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                Phone: {record.mobile || record.phone || '—'}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/20 shadow-md">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Owner</span>
                <ShieldCheck className="w-4 h-4 text-teal-400" />
              </div>
              <div className="text-sm font-semibold text-slate-200 truncate">
                {record.assignedUserName || record.assignedUser?.displayName || 'CRM Admin'}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Assigned Agent</div>
            </div>
          </>
        );
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 1. 4-Column Key Metrics Highlight Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {renderMetricCards()}
      </div>

      {/* 2. Real-Time Activity Stream & Quick Notes */}
      <div className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-slate-200">Activity Timeline & Notes</h3>
          </div>
          <span className="text-xs text-slate-500">Live Real-time Sync</span>
        </div>

        {/* Quick Note Input Box */}
        <form onSubmit={handlePostNote} className="space-y-2">
          <div className="relative">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Post an update note, customer call record, or handover log..."
              rows={2}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none pr-24"
            />
            <button
              type="submit"
              disabled={!newNote.trim() || postingNote}
              className="absolute right-2.5 bottom-3 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow transition-all disabled:opacity-40"
            >
              <Send className="w-3.5 h-3.5" />
              Post
            </button>
          </div>
        </form>

        {/* Activity Stream Feed */}
        <div className="space-y-3 pt-2">
          {loadingActivities ? (
            <div className="py-6 text-center text-xs text-slate-500">
              Loading timeline stream...
            </div>
          ) : activities.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-500">
              No logged activities for this entity yet.
            </div>
          ) : (
            activities.map((item) => {
              const timeStr = item.timestamp
                ? new Date(item.timestamp).toLocaleString()
                : 'Just now';

              return (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 hover:bg-slate-950/70 transition-colors"
                >
                  <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0 mt-0.5">
                    {item.action === 'converted' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : item.action === 'note_added' ? (
                      <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
                    ) : (
                      <Clock className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-slate-200">
                        {item.userName || 'CRM User'}
                      </span>
                      <span className="text-[11px] text-slate-500">{timeStr}</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 whitespace-pre-wrap">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default EntitySummaryWidget;
