import React, { useState, useEffect } from 'react';
import {
  Building,
  Coins,
  History,
  Save,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { apiClient } from '../../../services/api';
import { CompanyDetails } from '../../../types/settings';

// =========================================================================
// 1. Company Branding View
// =========================================================================
export const CompanyBrandingView: React.FC = () => {
  const [details, setDetails] = useState<CompanyDetails>({
    name: 'Shogunate Solutions LLC',
    domain: 'shogunate.dev',
    logoUrl: 'https://shogunate.dev/logo.png',
    timezone: 'UTC+02:00 (Europe/Berlin)',
    currency: 'USD ($)',
    fiscalYearStart: 'January',
  });
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    let isMounted = true;
    apiClient.get<any>('/settings/system').then((data) => {
      if (isMounted && data && data.companyDetails) {
        setDetails(data.companyDetails);
      }
    }).catch(() => {});
    return () => { isMounted = false; };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      await apiClient.post('/settings/system', {
        companyDetails: details,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save company branding:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <Building className="w-5 h-5 text-purple-600" />
            Company Branding & Profile
          </h2>
          <p className="text-xs text-slate-400">
            Tenant organization branding, logo, primary domain and default timezones.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
              <CheckCircle2 className="w-4 h-4" /> Branding Saved!
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 backdrop-blur-md">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-200">Company Name</label>
            <input
              type="text"
              value={details.name}
              onChange={(e) => setDetails({ ...details, name: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-200">Primary Domain</label>
            <input
              type="text"
              value={details.domain}
              onChange={(e) => setDetails({ ...details, domain: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-200">Organization Timezone</label>
            <select
              value={details.timezone}
              onChange={(e) => setDetails({ ...details, timezone: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
            >
              <option>UTC+00:00 (GMT / London)</option>
              <option>UTC+01:00 (Europe/Paris)</option>
              <option>UTC+02:00 (Europe/Berlin)</option>
              <option>UTC-05:00 (US Eastern)</option>
              <option>UTC-08:00 (US Pacific)</option>
              <option>UTC+09:00 (Asia/Tokyo)</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-200">Brand Logo URL</label>
            <input
              type="text"
              value={details.logoUrl || ''}
              onChange={(e) => setDetails({ ...details, logoUrl: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// 2. Currency & Fiscal Settings View
// =========================================================================
export const CurrencyFiscalView: React.FC = () => {
  const [currency, setCurrency] = useState('USD ($)');
  const [fiscalYearStart, setFiscalYearStart] = useState('January');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    let isMounted = true;
    apiClient.get<any>('/settings/system').then((data) => {
      if (isMounted && data && data.companyDetails) {
        if (data.companyDetails.currency) setCurrency(data.companyDetails.currency);
        if (data.companyDetails.fiscalYearStart) setFiscalYearStart(data.companyDetails.fiscalYearStart);
      }
    }).catch(() => {});
    return () => { isMounted = false; };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      await apiClient.post('/settings/system', {
        companyDetails: {
          currency,
          fiscalYearStart,
        },
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save currency & fiscal settings:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <Coins className="w-5 h-5 text-purple-600" />
            Currency & Fiscal Settings
          </h2>
          <p className="text-xs text-slate-400">
            Define corporate base currency, multi-currency conversion tables and financial calendar start.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
              <CheckCircle2 className="w-4 h-4" /> Fiscal Settings Saved!
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>{saving ? 'Saving...' : 'Save Fiscal Settings'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <h3 className="text-xs font-bold text-slate-100 uppercase font-mono">Corporate Base Currency</h3>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
          >
            <option value="USD ($)">USD ($) - United States Dollar</option>
            <option value="EUR (€)">EUR (€) - Euro</option>
            <option value="GBP (£)">GBP (£) - British Pound</option>
            <option value="JPY (¥)">JPY (¥) - Japanese Yen</option>
            <option value="ZAR (R)">ZAR (R) - South African Rand</option>
          </select>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <h3 className="text-xs font-bold text-slate-100 uppercase font-mono">Fiscal Year Commencement</h3>
          <select
            value={fiscalYearStart}
            onChange={(e) => setFiscalYearStart(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
          >
            <option value="January">January 1st (Calendar Year)</option>
            <option value="April">April 1st</option>
            <option value="July">July 1st</option>
            <option value="October">October 1st</option>
          </select>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// 3. Audit Trail Logs View
// =========================================================================
export const AuditTrailView: React.FC = () => {
  const [logs] = useState<Array<{
    id: string;
    actor: string;
    action: string;
    module: string;
    timestamp: string;
    status: string;
  }>>([]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-purple-600" />
            Audit Trail & Mutation Logs
          </h2>
          <p className="text-xs text-slate-400">
            Immutable serverless event audit trail recording administrative configuration changes.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden backdrop-blur-md">
        <table className="w-full text-left text-xs text-slate-200">
          <thead className="bg-slate-800/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
            <tr>
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">Actor</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Module</th>
              <th className="px-4 py-3 text-right">Result</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {logs.length > 0 ? (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">{log.timestamp}</td>
                  <td className="px-4 py-3 font-semibold text-slate-100">{log.actor}</td>
                  <td className="px-4 py-3 text-slate-200">{log.action}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[10px]">
                      {log.module}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono font-semibold">
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500 text-xs">
                  No administrative audit records logged yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
