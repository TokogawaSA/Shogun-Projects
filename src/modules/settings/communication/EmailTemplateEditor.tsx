import React, { useState, useEffect } from 'react';
import {
  FileCode,
  Plus,
  Trash2,
  Save,
  Eye,
  Code2,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { apiClient } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { EmailTemplate, SupportedModule } from '../../../types/settings';

export const EmailTemplateEditor: React.FC = () => {
  const { user } = useAuth();
  const tenantId = user?.tenantId || 'tenant-default';

  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  // Template Form State
  const [templateName, setTemplateName] = useState('');
  const [targetModule, setTargetModule] = useState<SupportedModule>('deals');
  const [subject, setSubject] = useState('');
  const [htmlBody, setHtmlBody] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Dynamic Merge Tokens
  const availableTokens: Record<SupportedModule, { label: string; token: string }[]> = {
    deals: [
      { label: 'Deal Title', token: '{{deal.title}}' },
      { label: 'Deal Amount', token: '{{deal.value}}' },
      { label: 'Pipeline Stage', token: '{{deal.pipelineStage}}' },
      { label: 'Close Date', token: '{{deal.expectedCloseDate}}' },
      { label: 'Rep Name', token: '{{user.displayName}}' },
    ],
    projects: [
      { label: 'Project Name', token: '{{project.title}}' },
      { label: 'Organization', token: '{{project.organizationId}}' },
      { label: 'Owner Email', token: '{{project.ownerEmail}}' },
    ],
    tasks: [
      { label: 'Task Title', token: '{{task.title}}' },
      { label: 'Priority', token: '{{task.priority}}' },
      { label: 'Due Date', token: '{{task.dueDate}}' },
      { label: 'Status', token: '{{task.status}}' },
    ],
    accounts: [
      { label: 'Account Name', token: '{{account.name}}' },
      { label: 'Domain', token: '{{account.domain}}' },
      { label: 'Industry', token: '{{account.industry}}' },
      { label: 'Tier', token: '{{account.tier}}' },
    ],
    contacts: [
      { label: 'First Name', token: '{{contact.firstName}}' },
      { label: 'Last Name', token: '{{contact.lastName}}' },
      { label: 'Email', token: '{{contact.email}}' },
      { label: 'Job Title', token: '{{contact.jobTitle}}' },
    ],
  };

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const loadTemplates = async () => {
      try {
        const res = await apiClient.get<EmailTemplate[]>('/settings/templates').catch(() => []);
        if (Array.isArray(res) && res.length > 0 && isMounted) {
          setTemplates(res);
          if (!selectedTemplateId) {
            loadTemplateIntoEditor(res[0]);
          }
        } else if (isMounted) {
          setTemplates([]);
        }
      } catch {
        // Continue
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadTemplates();
    return () => {
      isMounted = false;
    };
  }, [tenantId]);

  const loadTemplateIntoEditor = (tpl: EmailTemplate) => {
    setSelectedTemplateId(tpl.id);
    setTemplateName(tpl.name || '');
    setTargetModule((tpl.targetModule as SupportedModule) || (tpl.module as SupportedModule) || 'deals');
    setSubject(tpl.subject || '');
    setHtmlBody(tpl.htmlBody || tpl.bodyHtml || '');
    setPreviewMode(false);
  };

  const handleNewTemplate = () => {
    const newId = `tpl_${Date.now()}`;
    setSelectedTemplateId(newId);
    setTemplateName('New Transactional Template');
    setTargetModule('deals');
    setSubject('Update regarding {{deal.title}}');
    setHtmlBody(
      `<div style="font-family: sans-serif; padding: 20px; color: #1e293b;">\n  <h2>Notification</h2>\n  <p>Details for {{deal.title}} valued at \${{deal.value}}.</p>\n</div>`
    );
    setPreviewMode(false);
  };

  const insertToken = (token: string) => {
    setHtmlBody((prev) => `${prev} ${token}`);
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim() || !selectedTemplateId) return;

    setSaving(true);
    setSaveSuccess(false);

    const templateData: EmailTemplate = {
      id: selectedTemplateId,
      name: templateName.trim(),
      targetModule,
      subject,
      htmlBody,
      updatedAt: new Date().toISOString(),
      updatedBy: user?.uid || 'system',
    };

    try {
      await apiClient.post('/settings/templates', templateData);
      setTemplates((prev) => {
        const existing = prev.some((t) => t.id === selectedTemplateId);
        if (existing) {
          return prev.map((t) => (t.id === selectedTemplateId ? templateData : t));
        }
        return [...prev, templateData];
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save email template:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this email template?')) return;
    try {
      await apiClient.delete(`/settings/templates/${templateId}`);
      setTemplates(templates.filter((t) => t.id !== templateId));
      if (selectedTemplateId === templateId) {
        setSelectedTemplateId(null);
      }
    } catch (err) {
      console.error('Failed to delete template:', err);
    }
  };

  // Generate Sample Substituted Preview HTML
  const getRenderedPreview = () => {
    let rendered = htmlBody;
    const sampleData: Record<string, string> = {
      '{{deal.title}}': 'Acme Enterprise Cloud Migration',
      '{{deal.value}}': '45,000',
      '{{deal.pipelineStage}}': 'Closed Won',
      '{{deal.expectedCloseDate}}': '2026-09-30',
      '{{user.displayName}}': user?.displayName || 'Jane Doe (Account Exec)',
      '{{project.title}}': 'SaaS Mobile App Sprint 4',
      '{{project.organizationId}}': 'Shogunate Tech Org',
      '{{project.ownerEmail}}': 'alex@shogunate.dev',
      '{{task.title}}': 'Integrate Multi-Tenant Webhook Broker',
      '{{task.priority}}': 'Urgent',
      '{{task.dueDate}}': '2026-08-30',
      '{{task.status}}': 'In Progress',
      '{{account.name}}': 'Apex Global Holdings LLC',
      '{{account.domain}}': 'apexglobal.com',
      '{{account.industry}}': 'FinTech & Banking',
      '{{account.tier}}': 'Tier 1 Enterprise',
      '{{contact.firstName}}': 'Michael',
      '{{contact.lastName}}': 'Vance',
      '{{contact.email}}': 'm.vance@apexglobal.com',
      '{{contact.jobTitle}}': 'VP of Product Architecture',
    };

    Object.entries(sampleData).forEach(([key, val]) => {
      rendered = rendered.split(key).join(val);
    });

    return rendered;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileCode className="w-5 h-5 text-sky-400" />
            Email Templates & Token Designer
          </h2>
          <p className="text-xs text-slate-400">
            Create reusable HTML email templates with dynamic merge tokens and real-time preview rendering.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
              <CheckCircle2 className="w-4 h-4" /> Template Saved!
            </span>
          )}

          <button
            type="button"
            onClick={handleNewTemplate}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sky-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Template</span>
          </button>

          <button
            type="button"
            onClick={handleSaveTemplate}
            disabled={saving || !selectedTemplateId}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all shadow-lg shadow-sky-600/20 flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>{saving ? 'Saving...' : 'Save Template'}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-sky-400 mx-auto mb-2" />
          <p className="text-xs">Loading templates catalogue...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar: Templates List */}
          <div className="lg:col-span-1 space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase font-mono px-1">
              Template Roster ({templates.length})
            </h3>
            <div className="space-y-1.5">
              {templates.map((tpl) => (
                <div
                  key={tpl.id}
                  onClick={() => loadTemplateIntoEditor(tpl)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between group ${selectedTemplateId === tpl.id
                      ? 'bg-sky-500/10 border-sky-500/40 text-white shadow-md shadow-sky-500/10'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate">{tpl.name}</p>
                    <span className="text-[10px] px-2 py-0.2 rounded bg-slate-800 text-slate-400 font-mono uppercase mt-1 inline-block">
                      {tpl.targetModule}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTemplate(tpl.id);
                    }}
                    className="p-1 text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete Template"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Right Editor & Preview Pane */}
          {selectedTemplateId ? (
            <div className="lg:col-span-3 space-y-4">
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 backdrop-blur-md">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Template Title</label>
                    <input
                      type="text"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Target Module</label>
                    <select
                      value={targetModule}
                      onChange={(e) => setTargetModule(e.target.value as SupportedModule)}
                      className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-sky-500 font-sans"
                    >
                      <option value="deals">Deals</option>
                      <option value="projects">Projects</option>
                      <option value="tasks">Tasks</option>
                      <option value="accounts">Accounts</option>
                      <option value="contacts">Contacts</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Email Subject Line</label>
                  <input
                    type="text"
                    placeholder="Subject with tokens, e.g. Deal {{deal.title}} Won"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>

                {/* Merge Token Picker Chips */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase font-mono">
                    Available Merge Tokens for {targetModule.toUpperCase()}
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {(availableTokens[targetModule] || []).map((t) => (
                      <button
                        key={t.token}
                        type="button"
                        onClick={() => insertToken(t.token)}
                        className="px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/25 text-sky-300 text-[11px] font-mono transition-colors flex items-center gap-1"
                      >
                        <span>+</span>
                        <span>{t.token}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Editor Tabs */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                      <button
                        type="button"
                        onClick={() => setPreviewMode(false)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${!previewMode ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                          }`}
                      >
                        <Code2 className="w-3.5 h-3.5" />
                        <span>HTML Source</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewMode(true)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${previewMode ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                          }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Live Merged Preview</span>
                      </button>
                    </div>
                  </div>

                  {!previewMode ? (
                    <textarea
                      rows={12}
                      value={htmlBody}
                      onChange={(e) => setHtmlBody(e.target.value)}
                      placeholder="<html><body><h1>Your HTML email here...</h1></body></html>"
                      className="w-full p-4 text-xs font-mono bg-slate-950 border border-slate-800 rounded-xl text-sky-200 focus:outline-none focus:border-sky-500 leading-relaxed"
                    />
                  ) : (
                    <div className="p-5 rounded-xl bg-white border border-slate-300 min-h-[300px] text-slate-900 shadow-inner">
                      <div
                        dangerouslySetInnerHTML={{
                          __html: getRenderedPreview(),
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="lg:col-span-3 p-12 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-slate-500">
              Select or create a template to begin editing.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EmailTemplateEditor;
