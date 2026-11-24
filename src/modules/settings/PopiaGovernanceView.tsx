import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  Clock,
  FileDown,
  UserX,
  Lock,
  RefreshCw,
  Save,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Search,
  Database,
  FileSpreadsheet,
  FileJson,
  Play,
  Scale,
} from 'lucide-react';
import clsx from 'clsx';
import { apiClient } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export type PopiaModuleName = 'leads' | 'contacts' | 'accounts' | 'deals' | 'audit_logs';
export type PopiaExpiryAction = 'anonymize' | 'hard_delete';
export type PopiaSubjectType = 'contact' | 'lead' | 'account' | 'user';

export interface PopiaRetentionPolicy {
  id?: string;
  moduleName: PopiaModuleName;
  retentionDays: number;
  actionOnExpiry: PopiaExpiryAction;
  isActive: boolean;
  updatedAt?: string;
}

export interface PopiaAuditLogEntry {
  id: string;
  tenantId: string;
  actorUserId: string | null;
  actorAgent: 'human' | 'Sentinel' | 'Worker' | 'Auditor';
  action: 'READ_PII' | 'EXPORT_PII' | 'ANONYMIZE' | 'DELETE' | 'CONSENT_CHANGE';
  entityType: string;
  entityId: string;
  fieldsAccessed: Record<string, unknown> | string[];
  ipAddress: string | null;
  createdAt: string;
}

interface SubjectLookupOption {
  id: string;
  label: string;
  sublabel: string;
}

const MODULE_LABELS: Record<
  PopiaModuleName,
  { title: string; subtitle: string; statutoryHint: string }
> = {
  leads: {
    title: 'CRM Leads (Natural Persons)',
    subtitle: 'Unconverted marketing & inbound prospect inquiries',
    statutoryHint: 'Recommended: 365 days (POPIA s14 purpose limitation)',
  },
  contacts: {
    title: 'CRM Contacts (Natural Persons)',
    subtitle: 'Stakeholder contact records & communication profiles',
    statutoryHint: 'Recommended: 1095 days (3 years post-engagement)',
  },
  accounts: {
    title: 'Client Accounts (Juristic Persons)',
    subtitle: 'South African juristic entities protected under POPIA',
    statutoryHint: 'Recommended: 1825 days (5 years SARS Tax Act s29)',
  },
  deals: {
    title: 'Commercial Deals & Pipeline',
    subtitle: 'Opportunity records & commercial negotiation history',
    statutoryHint: 'Recommended: 1825 days (5 years financial audit)',
  },
  audit_logs: {
    title: 'Mutable System Activity Trail',
    subtitle: 'Operational change logs (popia_audit_logs remains immutable)',
    statutoryHint: 'Recommended: 1825 days (5 years security retention)',
  },
};

const RETENTION_PRESETS = [
  { label: '1 Yr (365d)', days: 365 },
  { label: '3 Yrs (1095d)', days: 1095 },
  { label: '5 Yrs SARS (1825d)', days: 1825 },
  { label: '7 Yrs (2555d)', days: 2555 },
];

export const PopiaGovernanceView: React.FC = () => {
  const { user, isTenantAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'policies' | 'audit' | 'dsr'>('policies');

  // Retention Policies State
  const [policies, setPolicies] = useState<PopiaRetentionPolicy[]>([]);
  const [allowOffshoreAi, setAllowOffshoreAi] = useState(false);
  const [togglingAi, setTogglingAi] = useState(false);
  const [loadingPolicies, setLoadingPolicies] = useState(true);
  const [savingPolicies, setSavingPolicies] = useState(false);
  const [sweeping, setSweeping] = useState(false);
  const [policyBanner, setPolicyBanner] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Immutable Audit Logs State
  const [auditLogs, setAuditLogs] = useState<PopiaAuditLogEntry[]>([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [actionFilter, setActionFilter] = useState('');
  const [agentFilter, setAgentFilter] = useState('');
  const [auditSearch, setAuditSearch] = useState('');

  // DSR (Export & Erasure) State
  const [subjectType, setSubjectType] = useState<PopiaSubjectType>('contact');
  const [subjectId, setSubjectId] = useState('');
  const [subjectOptions, setSubjectOptions] = useState<SubjectLookupOption[]>([]);
  const [erasureReason, setErasureReason] = useState(
    'POPIA Section 24 Data Subject Erasure Request (Form 2)'
  );
  const [confirmEraseOpen, setConfirmEraseOpen] = useState(false);
  const [dsrBusy, setDsrBusy] = useState<'export' | 'erase' | null>(null);
  const [exportResult, setExportResult] = useState<any | null>(null);
  const [erasureResult, setErasureResult] = useState<any | null>(null);
  const [dsrError, setDsrError] = useState<string | null>(null);

  const isAuthorizedOfficer =
    isTenantAdmin ||
    ['admin', 'information_officer', 'deputy_information_officer', 'compliance_officer'].includes(
      (user?.role || '').toLowerCase()
    );

  const fetchPolicies = useCallback(async () => {
    setLoadingPolicies(true);
    try {
      const [data, aiGov] = await Promise.all([
        apiClient.get<{ policies: PopiaRetentionPolicy[] }>(
          '/v1/compliance/popia/policies'
        ),
        apiClient
          .get<{ allowOffshoreAiProcessing: boolean }>(
            '/v1/compliance/popia/ai-governance'
          )
          .catch(() => ({ allowOffshoreAiProcessing: false })),
      ]);
      if (data?.policies) {
        setPolicies(data.policies);
      }
      setAllowOffshoreAi(Boolean(aiGov?.allowOffshoreAiProcessing));
    } catch (err: any) {
      setPolicyBanner({
        type: 'error',
        message:
          err?.response?.data?.error || 'Unable to load POPIA retention policies.',
      });
    } finally {
      setLoadingPolicies(false);
    }
  }, []);

  const handleToggleOffshoreAi = async (nextValue: boolean) => {
    setTogglingAi(true);
    setPolicyBanner(null);
    try {
      await apiClient.put('/v1/compliance/popia/ai-governance', {
        allowOffshoreAiProcessing: nextValue,
      });
      setAllowOffshoreAi(nextValue);
      setPolicyBanner({
        type: 'success',
        message: nextValue
          ? 'POPIA Section 72 MCP AI Processing enabled (outbound SA PII automatically redacted via local Redis vault).'
          : 'POPIA Section 72 MCP AI Processing disabled (all /api/mcp agent calls blocked with 403 Forbidden).',
      });
    } catch (err: any) {
      setPolicyBanner({
        type: 'error',
        message:
          err?.response?.data?.error || 'Failed to update Section 72 AI governance policy.',
      });
    } finally {
      setTogglingAi(false);
    }
  };

  const fetchAuditLogs = useCallback(async () => {
    setLoadingAudit(true);
    try {
      const params = new URLSearchParams();
      if (actionFilter) params.set('action', actionFilter);
      if (agentFilter) params.set('actorAgent', agentFilter);
      if (auditSearch.trim()) params.set('search', auditSearch.trim());
      params.set('limit', '100');

      const data = await apiClient.get<{ logs: PopiaAuditLogEntry[]; total: number }>(
        `/v1/compliance/popia/audit-logs?${params.toString()}`
      );
      setAuditLogs(data?.logs || []);
      setAuditTotal(data?.total || 0);
    } catch {
      setAuditLogs([]);
    } finally {
      setLoadingAudit(false);
    }
  }, [actionFilter, agentFilter, auditSearch]);

  const fetchSubjectDirectory = useCallback(async (type: PopiaSubjectType) => {
    try {
      if (type === 'contact') {
        const res = await apiClient.get<any>('/crm/contacts');
        const list = Array.isArray(res) ? res : res?.contacts || res?.data || [];
        setSubjectOptions(
          list.slice(0, 50).map((c: any) => ({
            id: c.id,
            label: `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.id,
            sublabel: c.email || c.contactNumber || '',
          }))
        );
      } else if (type === 'lead') {
        const res = await apiClient.get<any>('/crm/leads');
        const list = Array.isArray(res) ? res : res?.leads || res?.data || [];
        setSubjectOptions(
          list.slice(0, 50).map((l: any) => ({
            id: l.id,
            label: `${l.firstName || ''} ${l.lastName || ''} (${l.company || 'Lead'})`.trim(),
            sublabel: l.email || l.leadNumber || '',
          }))
        );
      } else if (type === 'account') {
        const res = await apiClient.get<any>('/crm/accounts');
        const list = Array.isArray(res) ? res : res?.accounts || res?.data || [];
        setSubjectOptions(
          list.slice(0, 50).map((a: any) => ({
            id: a.id,
            label: a.accountName || a.id,
            sublabel: a.email || a.accountNumber || 'Juristic Person',
          }))
        );
      } else {
        const res = await apiClient.get<any>('/settings/users');
        const list = Array.isArray(res) ? res : res?.users || res?.data || [];
        setSubjectOptions(
          list.slice(0, 50).map((u: any) => ({
            id: u.id,
            label: u.displayName || u.email || u.id,
            sublabel: u.email || u.role || '',
          }))
        );
      }
    } catch {
      setSubjectOptions([]);
    }
  }, []);

  useEffect(() => {
    void fetchPolicies();
  }, [fetchPolicies]);

  useEffect(() => {
    if (activeTab === 'audit') {
      void fetchAuditLogs();
    }
  }, [activeTab, fetchAuditLogs]);

  useEffect(() => {
    if (activeTab === 'dsr') {
      void fetchSubjectDirectory(subjectType);
    }
  }, [activeTab, subjectType, fetchSubjectDirectory]);

  const updatePolicyField = <K extends keyof PopiaRetentionPolicy>(
    moduleName: PopiaModuleName,
    field: K,
    value: PopiaRetentionPolicy[K]
  ) => {
    setPolicies((prev) =>
      prev.map((p) => (p.moduleName === moduleName ? { ...p, [field]: value } : p))
    );
  };

  const handleSavePolicies = async () => {
    setSavingPolicies(true);
    setPolicyBanner(null);
    try {
      const res = await apiClient.put<{ policies: PopiaRetentionPolicy[] }>(
        '/v1/compliance/popia/policies',
        { policies }
      );
      if (res?.policies) {
        setPolicies(res.policies);
      }
      setPolicyBanner({
        type: 'success',
        message: 'POPIA module retention policies saved and logged to immutable audit ledger.',
      });
    } catch (err: any) {
      setPolicyBanner({
        type: 'error',
        message: err?.response?.data?.error || 'Failed to save retention policies.',
      });
    } finally {
      setSavingPolicies(false);
    }
  };

  const handleRunSweepNow = async () => {
    setSweeping(true);
    setPolicyBanner(null);
    try {
      const res = await apiClient.post<{
        summary: { recordsAnonymized: number; recordsDeleted: number; auditLogsWritten: number };
      }>('/v1/compliance/popia/retention/sweep');
      const s = res?.summary;
      setPolicyBanner({
        type: 'success',
        message: `Retention sweep completed: ${s?.recordsAnonymized ?? 0} anonymized, ${s?.recordsDeleted ?? 0} purged, ${s?.auditLogsWritten ?? 0} audit records written.`,
      });
    } catch (err: any) {
      setPolicyBanner({
        type: 'error',
        message: err?.response?.data?.error || 'Retention sweep execution failed.',
      });
    } finally {
      setSweeping(false);
    }
  };

  const handleExportSubject = async () => {
    if (!subjectId.trim()) {
      setDsrError('Please select or enter a Data Subject ID.');
      return;
    }
    setDsrBusy('export');
    setDsrError(null);
    setErasureResult(null);
    try {
      const data = await apiClient.post<any>('/v1/compliance/popia/dsr/export', {
        subjectType,
        subjectId: subjectId.trim(),
      });
      setExportResult(data);
    } catch (err: any) {
      setDsrError(
        err?.response?.data?.error || 'Failed to export Data Subject bundle.'
      );
    } finally {
      setDsrBusy(null);
    }
  };

  const handleDownloadBundle = (format: 'json' | 'csv') => {
    if (!exportResult) return;
    const content = format === 'json' ? exportResult.json : exportResult.csv;
    const mime =
      format === 'json' ? 'application/json;charset=utf-8' : 'text/csv;charset=utf-8';
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `popia-s23-${exportResult.subjectType}-${exportResult.subjectId}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExecuteErasure = async () => {
    if (!subjectId.trim()) return;
    setDsrBusy('erase');
    setDsrError(null);
    setConfirmEraseOpen(false);
    try {
      const data = await apiClient.post<any>('/v1/compliance/popia/dsr/erase', {
        subjectType,
        subjectId: subjectId.trim(),
        reason: erasureReason,
      });
      setErasureResult(data);
      setExportResult(null);
      void fetchSubjectDirectory(subjectType);
    } catch (err: any) {
      setDsrError(
        err?.response?.data?.error || 'Failed to execute POPIA Section 24 Erasure.'
      );
    } finally {
      setDsrBusy(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Governance Header */}
      <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/50 via-slate-900/90 to-slate-950 p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                POPIA Act 4 of 2013
              </span>
              <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                PostgreSQL FORCE RLS + Immutable Trigger
              </span>
              <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                SARS 5-Yr Legal Hold Safeguard
              </span>
            </div>
            <h2 className="text-xl lg:text-2xl font-bold text-slate-100 flex items-center gap-2.5">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              POPIA Governance & Information Officer Console
            </h2>
            <p className="text-xs text-slate-300 max-w-3xl">
              Manage statutory retention schedules across natural and juristic persons, inspect the append-only PII audit ledger, and execute 1-click POPIA Section 23 Data Subject Access Exports and Section 24 Right-to-Erasure workflows.
            </p>
          </div>

          {!isAuthorizedOfficer && (
            <div className="px-3.5 py-2.5 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-200 text-xs flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>Restricted to Tenant Admins & Information Officers</span>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-slate-800/80">
          <button
            onClick={() => setActiveTab('policies')}
            className={clsx(
              'px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all',
              activeTab === 'policies'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800'
            )}
          >
            <Clock className="w-4 h-4" />
            Retention Policies
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={clsx(
              'px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all',
              activeTab === 'audit'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800'
            )}
          >
            <Database className="w-4 h-4" />
            Immutable PII Audit Ledger
          </button>
          <button
            onClick={() => setActiveTab('dsr')}
            className={clsx(
              'px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all',
              activeTab === 'dsr'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800'
            )}
          >
            <Scale className="w-4 h-4" />
            Data Subject Rights (Export & Erasure)
          </button>
        </div>
      </div>

      {/* TAB 1: RETENTION POLICIES */}
      {activeTab === 'policies' && (
        <div className="space-y-4">
          {policyBanner && (
            <div
              className={clsx(
                'p-3.5 rounded-xl border text-xs flex items-center gap-2.5',
                policyBanner.type === 'success'
                  ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-200'
                  : 'bg-rose-950/50 border-rose-500/40 text-rose-200'
              )}
            >
              {policyBanner.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              )}
              <span>{policyBanner.message}</span>
            </div>
          )}

          <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-100">
                  POPIA Section 72 – MCP Autonomous AI Offshore Processing Gate
                </span>
                <span
                  className={clsx(
                    'text-[10px] font-mono px-2 py-0.5 rounded-full border',
                    allowOffshoreAi
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  )}
                >
                  {allowOffshoreAi ? 'REDACTION GATE ACTIVE' : 'BLOCKED (403)'}
                </span>
              </div>
              <p className="text-xs text-slate-400 max-w-2xl">
                Controls whether Sentinel, Worker, and Auditor MCP agents may invoke external LLM inference. When enabled, SA IDs, +27 phone numbers, emails, CIPC registrations, SARS VAT numbers, and bank accounts are tokenized locally in Redis (5-min TTL) before leaving South Africa.
              </p>
            </div>
            <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={allowOffshoreAi}
                disabled={togglingAi || loadingPolicies}
                onChange={(e) => void handleToggleOffshoreAi(e.target.checked)}
                className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
              />
              <span className="text-xs font-semibold text-slate-200">
                Allow Redacted Offshore AI
              </span>
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                Automated Daily Retention Sweeper (02:00 SAST)
              </h3>
              <p className="text-xs text-slate-400">
                BullMQ worker evaluates inactive records with no active contracts or projects and enforces PII anonymization or deletion.
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                onClick={handleRunSweepNow}
                disabled={sweeping || loadingPolicies}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {sweeping ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span>Run Sweep Now</span>
              </button>
              <button
                onClick={handleSavePolicies}
                disabled={savingPolicies || loadingPolicies}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
              >
                {savingPolicies ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>Save Policies</span>
              </button>
            </div>
          </div>

          {loadingPolicies ? (
            <div className="p-12 flex items-center justify-center text-slate-400 text-xs gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
              <span>Loading tenant POPIA retention policies...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {policies.map((policy) => {
                const meta = MODULE_LABELS[policy.moduleName] || {
                  title: policy.moduleName,
                  subtitle: '',
                  statutoryHint: '',
                };

                return (
                  <div
                    key={policy.moduleName}
                    className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    <div className="space-y-1 max-w-xl">
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm font-bold text-slate-100">
                          {meta.title}
                        </span>
                        <span
                          className={clsx(
                            'text-[10px] font-mono px-2 py-0.5 rounded-full border',
                            policy.isActive
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          )}
                        >
                          {policy.isActive ? 'ACTIVE' : 'PAUSED'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{meta.subtitle}</p>
                      <p className="text-[11px] font-mono text-indigo-300">
                        {meta.statutoryHint}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {/* Quick Presets */}
                      <div className="flex items-center gap-1">
                        {RETENTION_PRESETS.map((preset) => (
                          <button
                            key={preset.days}
                            type="button"
                            onClick={() =>
                              updatePolicyField(
                                policy.moduleName,
                                'retentionDays',
                                preset.days
                              )
                            }
                            className={clsx(
                              'px-2 py-1 rounded-lg text-[10px] font-mono border transition-colors',
                              policy.retentionDays === preset.days
                                ? 'bg-indigo-600/30 border-indigo-400 text-indigo-200'
                                : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
                            )}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>

                      {/* Custom Days Input */}
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min={1}
                          max={36500}
                          value={policy.retentionDays}
                          onChange={(e) =>
                            updatePolicyField(
                              policy.moduleName,
                              'retentionDays',
                              Math.max(1, Number(e.target.value) || 1)
                            )
                          }
                          className="w-24 px-2.5 py-1.5 text-xs font-mono bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                        />
                        <span className="text-xs text-slate-400">days</span>
                      </div>

                      {/* Expiry Action */}
                      <select
                        value={policy.actionOnExpiry}
                        onChange={(e) =>
                          updatePolicyField(
                            policy.moduleName,
                            'actionOnExpiry',
                            e.target.value as PopiaExpiryAction
                          )
                        }
                        className="px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                      >
                        <option value="anonymize">Anonymize PII (Preserve Totals)</option>
                        <option value="hard_delete">Hard Delete (Subject to SARS Hold)</option>
                      </select>

                      {/* Active Toggle */}
                      <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={policy.isActive}
                          onChange={(e) =>
                            updatePolicyField(
                              policy.moduleName,
                              'isActive',
                              e.target.checked
                            )
                          }
                          className="rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
                        />
                        <span>Enforce</span>
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: IMMUTABLE PII AUDIT LEDGER */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search entity ID, type, actor..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-100 w-60"
                />
              </div>

              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
              >
                <option value="">All POPIA Actions</option>
                <option value="READ_PII">READ_PII</option>
                <option value="EXPORT_PII">EXPORT_PII</option>
                <option value="ANONYMIZE">ANONYMIZE</option>
                <option value="DELETE">DELETE</option>
                <option value="CONSENT_CHANGE">CONSENT_CHANGE</option>
              </select>

              <select
                value={agentFilter}
                onChange={(e) => setAgentFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
              >
                <option value="">All Actors / Agents</option>
                <option value="human">Human Operator</option>
                <option value="Sentinel">Sentinel Subagent</option>
                <option value="Worker">Worker Subagent</option>
                <option value="Auditor">Auditor Subagent</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-slate-400">
                {auditTotal} immutable entries
              </span>
              <button
                onClick={fetchAuditLogs}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1.5 border border-slate-700"
              >
                <RefreshCw className={clsx('w-3.5 h-3.5', loadingAudit && 'animate-spin')} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/90 text-[11px] font-mono uppercase text-slate-400">
                    <th className="py-3 px-4">Timestamp (SAST)</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Actor / Agent</th>
                    <th className="py-3 px-4">Entity</th>
                    <th className="py-3 px-4">Fields & Compliance Metadata</th>
                    <th className="py-3 px-4">Source IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 text-xs">
                  {loadingAudit ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-400">
                        Loading immutable audit entries...
                      </td>
                    </tr>
                  ) : auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-400">
                        No POPIA audit events recorded matching current filters.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-300 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString('en-ZA', {
                            timeZone: 'Africa/Johannesburg',
                          })}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={clsx(
                              'px-2 py-0.5 rounded font-mono text-[10px] font-bold border',
                              log.action === 'ANONYMIZE' || log.action === 'DELETE'
                                ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                                : log.action === 'EXPORT_PII'
                                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                  : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                            )}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-200">
                          <span className="font-semibold">{log.actorAgent}</span>
                          {log.actorUserId && (
                            <span className="block text-[10px] font-mono text-slate-400">
                              {log.actorUserId}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-200">
                          <span className="text-emerald-300">{log.entityType}</span>:{log.entityId}
                        </td>
                        <td className="py-3 px-4 max-w-md">
                          <pre className="text-[10px] font-mono text-slate-300 bg-slate-950/70 p-2 rounded-lg overflow-x-auto">
                            {JSON.stringify(log.fieldsAccessed)}
                          </pre>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                          {log.ipAddress || 'internal'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: 1-CLICK DATA SUBJECT RIGHTS (EXPORT & ERASURE) */}
      {activeTab === 'dsr' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-100">
                1-Click Data Subject Request (DSR) Workbench
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Execute POPIA Section 23 Portability Exports or Section 24 Erasure across natural and juristic persons.
              </p>
            </div>

            {dsrError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{dsrError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-200">
                Data Subject Category
              </label>
              <select
                value={subjectType}
                onChange={(e) => {
                  setSubjectType(e.target.value as PopiaSubjectType);
                  setSubjectId('');
                  setExportResult(null);
                  setErasureResult(null);
                }}
                className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-slate-100"
              >
                <option value="contact">Contact (Natural Person)</option>
                <option value="lead">Lead (Natural Person)</option>
                <option value="account">Account (Juristic Person - POPIA Protected)</option>
                <option value="user">Operator / User</option>
              </select>
            </div>

            {subjectOptions.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-200">
                  Quick Directory Lookup
                </label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-slate-100"
                >
                  <option value="">-- Select a {subjectType} record --</option>
                  {subjectOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label} {opt.sublabel ? `(${opt.sublabel})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-200">
                Data Subject Record ID
              </label>
              <input
                type="text"
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                placeholder={`Enter ${subjectType} ID...`}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-800 border border-slate-700 rounded-xl text-slate-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-200">
                Statutory Basis / Form 2 Reference Note
              </label>
              <input
                type="text"
                value={erasureReason}
                onChange={(e) => setErasureReason(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-slate-100"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={handleExportSubject}
                disabled={dsrBusy !== null || !subjectId.trim()}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {dsrBusy === 'export' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileDown className="w-4 h-4" />
                )}
                <span>Section 23 Export</span>
              </button>

              <button
                type="button"
                onClick={() => setConfirmEraseOpen(true)}
                disabled={dsrBusy !== null || !subjectId.trim()}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {dsrBusy === 'erase' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserX className="w-4 h-4" />
                )}
                <span>Section 24 Erase PII</span>
              </button>
            </div>

            {confirmEraseOpen && (
              <div className="p-4 rounded-xl bg-rose-950/70 border border-rose-500/50 space-y-3">
                <p className="text-xs text-rose-100 font-semibold">
                  Confirm Irreversible POPIA Section 24 Erasure?
                </p>
                <p className="text-[11px] text-rose-200/90 leading-relaxed">
                  Personal/juristic PII fields will be scrubbed immediately and active consents withdrawn. Any linked SARS tax invoices within the 5-year statutory period will be preserved under a legal-hold flag.
                </p>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmEraseOpen(false)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteErasure}
                    className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
                  >
                    Confirm & Scrub PII
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* DSR Output Panel */}
          <div className="lg:col-span-7 p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            {exportResult ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {exportResult.popiaSection}
                    </span>
                    <h4 className="text-sm font-bold text-slate-100 mt-1">
                      Portability Bundle Compiled ({exportResult.subjectType}: {exportResult.subjectId})
                    </h4>
                    <p className="text-[11px] font-mono text-slate-400">
                      Audit Log ID: {exportResult.auditLogId}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownloadBundle('json')}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5"
                    >
                      <FileJson className="w-3.5 h-3.5" />
                      <span>Download JSON</span>
                    </button>
                    <button
                      onClick={() => handleDownloadBundle('csv')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Download CSV</span>
                    </button>
                  </div>
                </div>

                <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-200 max-h-96 overflow-auto">
                  {exportResult.json}
                </pre>
              </div>
            ) : erasureResult ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                  <h4 className="text-sm font-bold text-slate-100">
                    POPIA Section 24 Erasure Executed ({erasureResult.actionTaken.toUpperCase()})
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                    <p className="text-slate-400">Immutable Audit Log ID</p>
                    <p className="font-mono text-slate-100 mt-0.5 break-all">
                      {erasureResult.auditLogId}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                    <p className="text-slate-400">SARS 5-Year Tax Legal Hold</p>
                    <p className="font-mono text-amber-300 mt-0.5">
                      {erasureResult.legalHold?.active
                        ? `ACTIVE (${erasureResult.legalHold.retainedInvoiceCount} invoices preserved)`
                        : 'NONE REQUIRED'}
                    </p>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                  <p className="text-xs font-semibold text-slate-200">
                    Scrubbed PII Attributes ({erasureResult.scrubbedFields?.length || 0})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {(erasureResult.scrubbedFields || []).map((field: string) => (
                      <span
                        key={field}
                        className="px-2 py-0.5 rounded bg-rose-500/15 border border-rose-500/30 text-rose-200 font-mono text-[10px]"
                      >
                        {field}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[260px] flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
                <ShieldCheck className="w-10 h-10 text-slate-600" />
                <p className="text-xs font-semibold text-slate-300">
                  Ready for Data Subject Access or Erasure Execution
                </p>
                <p className="text-[11px] max-w-md">
                  Select a Contact, Lead, Juristic Account, or User on the left to compile a machine-readable Section 23 JSON/CSV bundle or execute Section 24 PII anonymization.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PopiaGovernanceView;
