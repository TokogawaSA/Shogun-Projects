import React, { useState, useEffect, useCallback } from 'react';
import {
  Landmark,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Play,
  Save,
  Loader2,
  RotateCcw,
  Lock,
  Activity,
} from 'lucide-react';
import clsx from 'clsx';
import { apiClient } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

type AccountingProvider = 'SAGE_ZA' | 'XERO';

interface VatCodeMap {
  standard15: string;
  zeroRated: string;
  exempt: string;
}

export const AccountingIntegrationsView: React.FC = () => {
  const { isTenantAdmin } = useAuth();
  const [selectedProvider, setSelectedProvider] = useState<AccountingProvider>('SAGE_ZA');

  // Sage SA State
  const [sageActive, setSageActive] = useState(true);
  const [sageSalesAccount, setSageSalesAccount] = useState('1');
  const [sageVatMap, setSageVatMap] = useState<VatCodeMap>({
    standard15: '1',
    zeroRated: '2',
    exempt: '3',
  });
  const [sageCreds, setSageCreds] = useState({
    username: '',
    password: '',
    apiKey: '',
    companyId: '',
  });
  const [sageMasked, setSageMasked] = useState<Record<string, string>>({});

  // Xero State
  const [xeroActive, setXeroActive] = useState(false);
  const [xeroSalesAccount, setXeroSalesAccount] = useState('200');
  const [xeroVatMap, setXeroVatMap] = useState<VatCodeMap>({
    standard15: 'OUTPUT3',
    zeroRated: 'ZERORATEDOUTPUT',
    exempt: 'EXEMPTOUTPUT',
  });
  const [xeroCreds, setXeroCreds] = useState({
    xeroTenantId: '',
    accessToken: '',
    refreshToken: '',
    clientId: '',
    clientSecret: '',
  });
  const [xeroMasked, setXeroMasked] = useState<Record<string, string>>({});

  // Monitor State
  const [monitor, setMonitor] = useState<{
    rateLimiter?: { maxPerMinute: number; maxPerDaySageZa: number; retryAttempts: number };
    queueCounts?: Record<string, number>;
    recentHistory?: Array<any>;
    invoices?: Array<any>;
  }>({});

  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  const parseVatMapping = (raw: string | undefined, fallback: VatCodeMap): VatCodeMap => {
    if (!raw) return fallback;
    if (raw.startsWith('{')) {
      try {
        const p = JSON.parse(raw);
        return {
          standard15: p.standard15 || fallback.standard15,
          zeroRated: p.zeroRated || fallback.zeroRated,
          exempt: p.exempt || fallback.exempt,
        };
      } catch {
        return fallback;
      }
    }
    return { ...fallback, standard15: raw };
  };

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [connRes, monRes] = await Promise.all([
        apiClient.get<{ connections: Array<any> }>('/v1/accounting/connections'),
        apiClient.get<any>('/v1/accounting/queue-monitor'),
      ]);

      for (const conn of connRes?.connections || []) {
        if (conn.provider === 'SAGE_ZA') {
          setSageActive(Boolean(conn.isActive));
          setSageSalesAccount(conn.defaultSalesAccountCode || '1');
          setSageVatMap((prev) => parseVatMapping(conn.defaultVatTaxTypeId, prev));
          setSageMasked(conn.maskedCredentials || {});
          if (conn.maskedCredentials?.companyId) {
            setSageCreds((prev) => ({
              ...prev,
              companyId: conn.maskedCredentials.companyId,
              username: conn.maskedCredentials.username || prev.username,
            }));
          }
        } else if (conn.provider === 'XERO') {
          setXeroActive(Boolean(conn.isActive));
          setXeroSalesAccount(conn.defaultSalesAccountCode || '200');
          setXeroVatMap((prev) => parseVatMapping(conn.defaultVatTaxTypeId, prev));
          setXeroMasked(conn.maskedCredentials || {});
          if (conn.maskedCredentials?.xeroTenantId) {
            setXeroCreds((prev) => ({
              ...prev,
              xeroTenantId: conn.maskedCredentials.xeroTenantId,
            }));
          }
        }
      }

      if (monRes) {
        setMonitor(monRes);
      }
    } catch (err: any) {
      setBanner({
        type: 'error',
        message:
          err?.response?.data?.error || 'Unable to load outbound accounting integrations.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const handleSaveProvider = async (provider: AccountingProvider) => {
    setBusyAction(`save-${provider}`);
    setBanner(null);
    try {
      const isSage = provider === 'SAGE_ZA';
      await apiClient.put(`/v1/accounting/connections/${provider}`, {
        isActive: isSage ? sageActive : xeroActive,
        defaultSalesAccountCode: isSage ? sageSalesAccount : xeroSalesAccount,
        defaultVatTaxTypeId: JSON.stringify(isSage ? sageVatMap : xeroVatMap),
        credentials: isSage ? sageCreds : xeroCreds,
      });

      setBanner({
        type: 'success',
        message: `${
          isSage ? 'Sage Business Cloud Accounting (South Africa)' : 'Xero'
        } credentials encrypted (AES-256-GCM) and saved.`,
      });
      await loadAll();
    } catch (err: any) {
      setBanner({
        type: 'error',
        message: err?.response?.data?.error || 'Failed to save accounting connection.',
      });
    } finally {
      setBusyAction(null);
    }
  };

  const handleTestProvider = async (provider: AccountingProvider) => {
    setBusyAction(`test-${provider}`);
    setBanner(null);
    try {
      const res = await apiClient.post<{ ok: boolean; companyName?: string }>(
        `/v1/accounting/connections/${provider}/test`
      );
      setBanner({
        type: 'success',
        message: `Connection verified: ${res.companyName || provider}`,
      });
      await loadAll();
    } catch (err: any) {
      setBanner({
        type: 'error',
        message:
          err?.response?.data?.error || `Failed to verify ${provider} API credentials.`,
      });
    } finally {
      setBusyAction(null);
    }
  };

  const handleRetryInvoiceSync = async (
    taxInvoiceId: string,
    invoiceStatus: string,
    provider?: AccountingProvider
  ) => {
    setBusyAction(`retry-${taxInvoiceId}`);
    setBanner(null);
    try {
      const eventType =
        invoiceStatus === 'PAID' || invoiceStatus === 'PARTIALLY_PAID'
          ? 'invoice.paid'
          : 'invoice.issued';
      await apiClient.post('/v1/accounting/sync/retry', {
        eventType,
        taxInvoiceId,
        provider,
      });
      setBanner({
        type: 'success',
        message: `Triggered ${eventType} sync retry for invoice ${taxInvoiceId}.`,
      });
      await loadAll();
    } catch (err: any) {
      setBanner({
        type: 'error',
        message: err?.response?.data?.error || 'Manual sync retry failed.',
      });
    } finally {
      setBusyAction(null);
    }
  };

  if (!isTenantAdmin) {
    return (
      <div className="p-8 rounded-2xl bg-slate-900/70 border border-slate-800 text-center space-y-2">
        <Lock className="w-8 h-8 text-amber-400 mx-auto" />
        <h3 className="text-sm font-bold text-slate-100">
          Tenant Administrator Privileges Required
        </h3>
        <p className="text-xs text-slate-400">
          Only Tenant Administrators (`isTenantAdmin: true`) may configure General Ledger and SARS VAT accounting connectors.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="p-6 rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/60 via-slate-900/90 to-slate-950 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                AES-256-GCM Encrypted Vault
              </span>
              <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                BullMQ 60 req/min Rate-Limited • 5x Retry
              </span>
            </div>
            <h2 className="text-xl lg:text-2xl font-bold text-slate-100 flex items-center gap-2">
              <Landmark className="w-6 h-6 text-indigo-400" />
              Outbound Accounting & SARS 15% VAT Ledger Sync
            </h2>
            <p className="text-xs text-slate-300 max-w-3xl">
              Connect Sage Business Cloud Accounting South Africa (v2.0.0) or Xero (OAuth 2.0) to automatically synchronize CRM Accounts, 15% VAT Tax Invoices, Peach Payments ZAR settlements, and approved project expenses.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-950/90 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setSelectedProvider('SAGE_ZA')}
              className={clsx(
                'px-3.5 py-2 rounded-lg text-xs font-bold transition',
                selectedProvider === 'SAGE_ZA'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              Sage Accounting SA
            </button>
            <button
              type="button"
              onClick={() => setSelectedProvider('XERO')}
              className={clsx(
                'px-3.5 py-2 rounded-lg text-xs font-bold transition',
                selectedProvider === 'XERO'
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              Xero South Africa
            </button>
          </div>
        </div>
      </div>

      {banner && (
        <div
          className={clsx(
            'p-3.5 rounded-xl border text-xs flex items-center gap-2.5',
            banner.type === 'success'
              ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/50 border-rose-500/40 text-rose-200'
          )}
        >
          {banner.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{banner.message}</span>
        </div>
      )}

      {/* Provider Configuration Card */}
      {selectedProvider === 'SAGE_ZA' ? (
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-100">
                Sage Business Cloud Accounting South Africa (`accounting.sageone.co.za/api/2.0.0`)
              </h3>
              <p className="text-xs text-slate-400">
                Authenticates via HTTP Basic (`username:password`) + `?apikey=...&companyid=...` and maps SARS VAT # to `TaxReference` and CIPC # to `TextField1`.
              </p>
            </div>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={sageActive}
                onChange={(e) => setSageActive(e.target.checked)}
                className="rounded border-slate-700 bg-slate-800 text-emerald-500"
              />
              <span>Active Connector</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Sage Username (Email)</label>
              <input
                type="text"
                value={sageCreds.username}
                onChange={(e) => setSageCreds({ ...sageCreds, username: e.target.value })}
                placeholder="accounts@company.co.za"
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                Sage Password {sageMasked.password ? `(${sageMasked.password})` : ''}
              </label>
              <input
                type="password"
                value={sageCreds.password}
                onChange={(e) => setSageCreds({ ...sageCreds, password: e.target.value })}
                placeholder="Enter password to update..."
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                Sage API Key (`{sageMasked.apiKey || 'unconfigured'}`)
              </label>
              <input
                type="password"
                value={sageCreds.apiKey}
                onChange={(e) => setSageCreds({ ...sageCreds, apiKey: e.target.value })}
                placeholder="{GUID-API-KEY}"
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-slate-100"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Sage Company ID</label>
              <input
                type="text"
                value={sageCreds.companyId}
                onChange={(e) => setSageCreds({ ...sageCreds, companyId: e.target.value })}
                placeholder="e.g. 104829"
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-slate-100"
              />
            </div>
          </div>

          {/* 15% VAT & Ledger Account Mapping */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2 border-t border-slate-800">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                Sales Category ID
              </label>
              <input
                type="text"
                value={sageSalesAccount}
                onChange={(e) => setSageSalesAccount(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-slate-100"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-emerald-300">
                15% Standard VAT TaxTypeId
              </label>
              <input
                type="text"
                value={sageVatMap.standard15}
                onChange={(e) => setSageVatMap({ ...sageVatMap, standard15: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-slate-100"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                Zero-Rated (0%) TaxTypeId
              </label>
              <input
                type="text"
                value={sageVatMap.zeroRated}
                onChange={(e) => setSageVatMap({ ...sageVatMap, zeroRated: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-slate-100"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                VAT Exempt TaxTypeId
              </label>
              <input
                type="text"
                value={sageVatMap.exempt}
                onChange={(e) => setSageVatMap({ ...sageVatMap, exempt: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-slate-100"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => void handleTestProvider('SAGE_ZA')}
              disabled={busyAction !== null}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5"
            >
              {busyAction === 'test-SAGE_ZA' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span>Test Sage SA Connection</span>
            </button>
            <button
              type="button"
              onClick={() => void handleSaveProvider('SAGE_ZA')}
              disabled={busyAction !== null}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5"
            >
              {busyAction === 'save-SAGE_ZA' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>Encrypt & Save Sage SA</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-100">
                Xero Accounting South Africa (`api.xero.com/api.xro/2.0`)
              </h3>
              <p className="text-xs text-slate-400">
                Concurrency-locked OAuth 2.0 token rotation mapping SARS Tax Invoices to Xero `ACCREC` (`OUTPUT3` 15% SA VAT).
              </p>
            </div>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={xeroActive}
                onChange={(e) => setXeroActive(e.target.checked)}
                className="rounded border-slate-700 bg-slate-800 text-sky-500"
              />
              <span>Active Connector</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Xero Tenant ID</label>
              <input
                type="text"
                value={xeroCreds.xeroTenantId}
                onChange={(e) =>
                  setXeroCreds({ ...xeroCreds, xeroTenantId: e.target.value })
                }
                placeholder="e.g. d92a10c4-..."
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-slate-100"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                OAuth Access Token ({xeroMasked.accessToken || 'unconfigured'})
              </label>
              <input
                type="password"
                value={xeroCreds.accessToken}
                onChange={(e) =>
                  setXeroCreds({ ...xeroCreds, accessToken: e.target.value })
                }
                placeholder="Paste initial OAuth2 access token..."
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-slate-100"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                OAuth Refresh Token ({xeroMasked.refreshToken || 'unconfigured'})
              </label>
              <input
                type="password"
                value={xeroCreds.refreshToken}
                onChange={(e) =>
                  setXeroCreds({ ...xeroCreds, refreshToken: e.target.value })
                }
                placeholder="Paste OAuth2 refresh token..."
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2 border-t border-slate-800">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                Sales GL Account Code
              </label>
              <input
                type="text"
                value={xeroSalesAccount}
                onChange={(e) => setXeroSalesAccount(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-slate-100"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-sky-300">
                15% SA VAT TaxType
              </label>
              <input
                type="text"
                value={xeroVatMap.standard15}
                onChange={(e) => setXeroVatMap({ ...xeroVatMap, standard15: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-slate-100"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                Zero-Rated TaxType
              </label>
              <input
                type="text"
                value={xeroVatMap.zeroRated}
                onChange={(e) => setXeroVatMap({ ...xeroVatMap, zeroRated: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-slate-100"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                Exempt TaxType
              </label>
              <input
                type="text"
                value={xeroVatMap.exempt}
                onChange={(e) => setXeroVatMap({ ...xeroVatMap, exempt: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-slate-100"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => void handleTestProvider('XERO')}
              disabled={busyAction !== null}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5"
            >
              {busyAction === 'test-XERO' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 text-sky-400" />
              )}
              <span>Test Xero Connection</span>
            </button>
            <button
              type="button"
              onClick={() => void handleSaveProvider('XERO')}
              disabled={busyAction !== null}
              className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5"
            >
              {busyAction === 'save-XERO' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>Encrypt & Save Xero</span>
            </button>
          </div>
        </div>
      )}

      {/* Live Sync Queue Monitor & Retry Console */}
      <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-100">
              Live BullMQ Accounting Sync Queue Monitor
            </h3>
          </div>
          <button
            type="button"
            onClick={() => void loadAll()}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1.5 border border-slate-700"
          >
            <RefreshCw className={clsx('w-3.5 h-3.5', loading && 'animate-spin')} />
            <span>Refresh Monitor</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs font-mono">
          {(['waiting', 'active', 'completed', 'failed', 'delayed'] as const).map((k) => (
            <div key={k} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
              <p className="text-[10px] uppercase text-slate-400">{k}</p>
              <p className="text-lg font-bold text-slate-100 mt-0.5">
                {monitor.queueCounts?.[k] ?? 0}
              </p>
            </div>
          ))}
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-mono uppercase text-slate-400">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Provider</th>
                <th className="py-3 px-4">External Ledger ID</th>
                <th className="py-3 px-4">Last Synced</th>
                <th className="py-3 px-4 text-right">Manual Sync</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {(monitor.invoices || []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No Tax Invoices queued for external ledger synchronization yet.
                  </td>
                </tr>
              ) : (
                (monitor.invoices || []).map((inv: any) => (
                  <tr key={inv.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-slate-100">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">{inv.status}</td>
                    <td className="py-3 px-4 font-mono text-indigo-300">
                      {inv.externalAccountingProvider || selectedProvider}
                    </td>
                    <td className="py-3 px-4 font-mono text-emerald-300">
                      {inv.externalAccountingId || 'Pending Sync'}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {inv.lastSyncedAt
                        ? new Date(inv.lastSyncedAt).toLocaleString('en-ZA', {
                            timeZone: 'Africa/Johannesburg',
                          })
                        : '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        disabled={busyAction === `retry-${inv.id}`}
                        onClick={() =>
                          void handleRetryInvoiceSync(
                            inv.id,
                            inv.status,
                            (inv.externalAccountingProvider as AccountingProvider) ||
                              selectedProvider
                          )
                        }
                        className="px-3 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-200 text-[11px] font-semibold inline-flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Retry Sync</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AccountingIntegrationsView;
