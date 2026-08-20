import React, { useState } from 'react';
import {
  Send,
  FileCode2,
  Bell,
  Save,
  CheckCircle2,
  AlertCircle,
  Plus,
  Play,
} from 'lucide-react';
import { EmailTemplate, EmailProvider } from '../../../types/settings';

// =========================================================================
// 1. Outgoing Email Server View (SMTP / SendGrid / Mailgun)
// =========================================================================
export const EmailServerView: React.FC = () => {
  const [provider, setProvider] = useState<EmailProvider>('smtp');
  const [fromEmail, setFromEmail] = useState('notifications@shogunate.dev');
  const [fromName, setFromName] = useState('Shogunate Solutions');
  const [testEmail, setTestEmail] = useState('');

  // SMTP state
  const [smtpHost, setSmtpHost] = useState('smtp.mailgun.org');
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpUser, setSmtpUser] = useState('postmaster@shogunate.dev');
  const [smtpPass, setSmtpPass] = useState('••••••••••••');

  // SendGrid / Mailgun state
  const [apiKey, setApiKey] = useState('');
  const [domain, setDomain] = useState('mg.shogunate.dev');

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTestConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    setTesting(true);
    setTestResult(null);

    // Simulate connection check
    setTimeout(() => {
      setTesting(false);
      setTestResult({
        success: true,
        message: `Successfully connected to ${provider.toUpperCase()} gateway transport.`,
      });
    }, 1200);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Send className="w-5 h-5 text-emerald-400" />
            Outgoing Email Gateway Configuration
          </h2>
          <p className="text-xs text-slate-400">
            Configure SMTP, SendGrid or Mailgun credentials for workflow email dispatch.
          </p>
        </div>
        <button className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5">
          <Save className="w-3.5 h-3.5" />
          <span>Save Credentials</span>
        </button>
      </div>

      {testResult && (
        <div
          className={`p-4 rounded-xl border text-xs font-medium flex items-center gap-2 ${
            testResult.success
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
          }`}
        >
          {testResult.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{testResult.message}</span>
        </div>
      )}

      {/* Provider Selector */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6 backdrop-blur-md">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-200">Email Service Provider</label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'smtp', label: 'Custom SMTP Server', desc: 'Port 587 / 465 TLS' },
              { id: 'sendgrid', label: 'SendGrid Web API', desc: 'v3 Mail Send API' },
              { id: 'mailgun', label: 'Mailgun REST API', desc: 'Domain API integration' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setProvider(p.id as EmailProvider)}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  provider === p.id
                    ? 'bg-emerald-600/15 border-emerald-500/40 text-emerald-300 shadow-sm'
                    : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <p className="text-xs font-bold">{p.label}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{p.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Sender Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">From Name</label>
            <input
              type="text"
              value={fromName}
              onChange={(e) => setFromName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">From Email Address</label>
            <input
              type="email"
              value={fromEmail}
              onChange={(e) => setFromEmail(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white"
            />
          </div>
        </div>

        {/* Provider Specific Inputs */}
        {provider === 'smtp' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-800">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">SMTP Host</label>
              <input
                type="text"
                value={smtpHost}
                onChange={(e) => setSmtpHost(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">SMTP Port</label>
              <input
                type="number"
                value={smtpPort}
                onChange={(e) => setSmtpPort(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Username</label>
              <input
                type="text"
                value={smtpUser}
                onChange={(e) => setSmtpUser(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Password</label>
              <input
                type="password"
                value={smtpPass}
                onChange={(e) => setSmtpPass(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white"
              />
            </div>
          </div>
        )}

        {(provider === 'sendgrid' || provider === 'mailgun') && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">API Key</label>
              <input
                type="password"
                placeholder="SG.xxxxxxxx or key-xxxxxxxx"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 font-mono"
              />
            </div>
            {provider === 'mailgun' && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Mailgun Domain</label>
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white font-mono"
                />
              </div>
            )}
          </div>
        )}

        {/* Test Connection Form */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-end gap-3">
          <div className="flex-1 space-y-1.5 w-full">
            <label className="text-xs font-semibold text-slate-300">Send Test Email (Optional)</label>
            <input
              type="email"
              placeholder="e.g. test-recipient@shogunate.dev"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500"
            />
          </div>
          <button
            onClick={handleTestConnection}
            disabled={testing}
            className="w-full sm:w-auto px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-white flex items-center justify-center gap-2 transition-colors"
          >
            <Play className="w-3.5 h-3.5 text-emerald-400" />
            <span>{testing ? 'Testing Transport...' : 'Test Connection'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// 2. Email Templates View
// =========================================================================
export const EmailTemplatesView: React.FC = () => {
  const [templates] = useState<EmailTemplate[]>([
    {
      id: 'tmpl_001',
      name: 'Deal Won - Customer Welcome & Onboarding',
      module: 'deals',
      subject: 'Welcome to Shogunate Solutions - Deal: {{deal.title}}',
      bodyHtml: '<p>Hi {{contact.firstName}},</p><p>We are delighted to partner with {{account.name}}.</p>',
    },
    {
      id: 'tmpl_002',
      name: 'Task Assigned Notification',
      module: 'tasks',
      subject: 'New Task Assigned: {{task.title}}',
      bodyHtml: '<p>You have been assigned a new task: <strong>{{task.title}}</strong>.</p>',
    },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileCode2 className="w-5 h-5 text-emerald-400" />
            Email Templates
          </h2>
          <p className="text-xs text-slate-400">
            Design HTML templates with dynamic tokens (e.g., {'{{contact.firstName}}'}, {'{{deal.amount}}'}).
          </p>
        </div>
        <button className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" />
          <span>New Template</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((tmpl) => (
          <div key={tmpl.id} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">{tmpl.name}</h3>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono capitalize">
                {tmpl.module}
              </span>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] text-slate-400 font-mono">Subject:</p>
              <p className="text-xs text-slate-200 bg-slate-800/60 px-3 py-1.5 rounded-lg font-mono truncate">
                {tmpl.subject}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] text-slate-400 font-mono">Body Preview:</p>
              <div
                className="text-xs text-slate-300 bg-slate-800/40 p-3 rounded-lg border border-slate-700/40 line-clamp-2"
                dangerouslySetInnerHTML={{ __html: tmpl.bodyHtml || tmpl.htmlBody || '' }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// =========================================================================
// 3. Notification Dispatcher View
// =========================================================================
export const NotificationDispatcherView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Bell className="w-5 h-5 text-emerald-400" />
            Notification Dispatcher & Alert Queues
          </h2>
          <p className="text-xs text-slate-400">
            Manage in-app telemetry badges and real-time WebSocket event dispatching.
          </p>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <h3 className="text-xs font-bold text-white uppercase font-mono">Active Real-Time Channels</h3>
        <div className="space-y-2">
          {['Task Assignment Queue', 'Workflow Trigger Dispatcher', 'System Security Alerts'].map((c) => (
            <div
              key={c}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 text-xs text-slate-200"
            >
              <span>{c}</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                Listening (Firestore onSnapshot)
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
