import React, { useState } from 'react';
import {
  Building,
  Coins,
  History,
  Save,
} from 'lucide-react';
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
        <button className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm">
          <Save className="w-3.5 h-3.5" />
          <span>Save Changes</span>
        </button>
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
              value={details.logoUrl}
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
        <button className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm">
          <Save className="w-3.5 h-3.5" />
          <span>Save Fiscal Settings</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <h3 className="text-xs font-bold text-slate-100 uppercase font-mono">Corporate Base Currency</h3>
          <select className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-100">
            <option>USD ($) - United States Dollar</option>
            <option>EUR (€) - Euro</option>
            <option>GBP (£) - British Pound</option>
            <option>JPY (¥) - Japanese Yen</option>
          </select>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <h3 className="text-xs font-bold text-slate-100 uppercase font-mono">Fiscal Year Commencement</h3>
          <select className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-100">
            <option>January 1st (Calendar Year)</option>
            <option>April 1st</option>
            <option>July 1st</option>
            <option>October 1st</option>
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
  const mockAuditLogs = [
    {
      id: 'aud_101',
      actor: 'admin@shogunate.dev',
      action: 'Updated Workflow Rule (wf_001)',
      module: 'workflows',
      timestamp: '2026-08-20 13:15:22',
      status: 'SUCCESS',
    },
    {
      id: 'aud_102',
      actor: 'admin@shogunate.dev',
      action: 'Modified Deal Layout Schema (blk_financial)',
      module: 'module_schemas',
      timestamp: '2026-08-20 13:02:10',
      status: 'SUCCESS',
    },
    {
      id: 'aud_103',
      actor: 'system',
      action: 'Dispatched Scheduled Health Check',
      module: 'accounts',
      timestamp: '2026-08-20 12:00:00',
      status: 'SUCCESS',
    },
  ];

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
            {mockAuditLogs.map((log) => (
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
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono font-semibold">
                    {log.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
