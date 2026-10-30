/**
 * Quote-to-Project Scope Converter Modal
 * Multi-Tenant Antigravity 2.0 Ecosystem
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, 
  Sparkles, 
  FolderKanban, 
  CheckCircle2, 
  Layers, 
  Package, 
  Wrench, 
  AlertCircle
} from 'lucide-react';
import { apiClient } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { useCurrency } from '../../../context/CurrencyContext';
import { Quote, Project, Task } from '../../../types';

interface QuoteToProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  quote: Quote;
  onConverted?: (projectId: string) => void;
}

export const QuoteToProjectModal: React.FC<QuoteToProjectModalProps> = ({
  isOpen,
  onClose,
  quote,
  onConverted,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { formatCurrency } = useCurrency();
  const tenantId = user?.tenantId || 'tenant-default';

  const [mode, setMode] = useState<'create_new' | 'link_existing'>('create_new');
  const [existingProjects, setExistingProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [projectTitle, setProjectTitle] = useState<string>(`${quote.title} - Delivery`);
  const [projectDescription, setProjectDescription] = useState<string>(
    `Project deliverables provisioned automatically from Approved Quote ${quote.quoteNumber}.`
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const fetchProjects = async () => {
        try {
          const res = await apiClient.get<Project[]>('/projects');
          if (Array.isArray(res) && res.length > 0) {
            setExistingProjects(res);
            setSelectedProjectId(res[0].id);
          }
        } catch (e) {
          console.warn('[QuoteToProjectModal] Project fetch note:', e);
        }
      };
      fetchProjects();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const serviceLines = quote.lineItems.filter((i) => i.type === 'service');
  const productLines = quote.lineItems.filter((i) => i.type === 'product');

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      let targetProjectId = selectedProjectId;
      const nowIso = new Date().toISOString();

      if (mode === 'create_new') {
        targetProjectId = `proj-${Date.now().toString(36)}`;
        const newProject: Project = {
          id: targetProjectId,
          title: projectTitle.trim() || `${quote.title} Delivery`,
          description: projectDescription.trim(),
          organizationId: quote.accountId || 'org-root',
          ownerId: user?.uid || 'usr-admin',
          members: [user?.uid || 'usr-admin'],
          tenantId,
          dealId: quote.dealId || null,
          accountId: quote.accountId || null,
          createdAt: nowIso,
          updatedAt: nowIso,
        };

        // Create Project via API
        await apiClient.post('/projects', newProject).catch(() => {});
      }

      // Convert Line Items into Project Deliverables & Tasks
      for (const item of quote.lineItems) {
        const deliverableId = `deliv-${Date.now().toString(36)}-${Math.floor(100 + Math.random() * 900)}`;
        const cost = (item.costPrice || 0) * item.quantity;
        const billable = item.totalPrice;
        const margin = billable - cost;
        const marginPct = billable > 0 ? (margin / billable) * 100 : 0;

        // 1. Deliverable doc
        const deliverableData = {
          id: deliverableId,
          projectId: targetProjectId,
          tenantId,
          title: item.productName,
          type: item.type,
          lineItemId: item.id,
          productId: item.productId,
          estimatedCost: cost,
          billableAmount: billable,
          profitMarginAmount: margin,
          profitMarginPercent: Number(marginPct.toFixed(1)),
          status: 'planned',
          createdAt: nowIso,
          updatedAt: nowIso,
        };

        await apiClient.post(`/projects/${targetProjectId}/deliverables`, deliverableData).catch(() => {});

        // 2. If it's a service, generate engineering scope task with estimated hours
        if (item.type === 'service') {
          const taskId = `TSK-SCOPE-${Math.floor(100 + Math.random() * 900)}`;
          const estimatedHours = item.quantity > 0 ? item.quantity : 10;

          const scopeTask: Partial<Task> = {
            id: taskId,
            projectId: targetProjectId,
            title: `Deliverable Scope: ${item.productName}`,
            description: item.notes || `Implement quoted deliverable: ${item.productName}. Budgeted hours: ${estimatedHours}h.`,
            status: 'todo',
            priority: 'high',
            category: 'Serverless Compute',
            assignedAgent: 'Worker',
            creatorId: user?.uid || 'usr-admin',
            estimatedHours,
            actualHours: 0,
            lineItemId: item.id,
            subtasks: [
              { id: 'st-1', title: 'Scope architectural specifications', completed: false, createdAt: nowIso },
              { id: 'st-2', title: 'Implement deliverable components', completed: false, createdAt: nowIso },
              { id: 'st-3', title: 'Client acceptance verification & signoff', completed: false, createdAt: nowIso },
            ],
            createdAt: nowIso,
            updatedAt: nowIso,
          };

          await apiClient.post('/projects/tasks', scopeTask).catch(() => {});
        }
      }

      // Update quote status to converted
      await apiClient.put(`/crm/quotes/${quote.id}`, {
        status: 'converted',
        projectId: targetProjectId,
        updatedAt: new Date().toISOString(),
      }).catch(() => {});

      if (onConverted) {
        onConverted(targetProjectId);
      }

      onClose();
      navigate(`/projects/${targetProjectId}?tab=overview`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to convert quote into project scope.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Convert Quote to Project Scope
              </h2>
              <p className="text-xs text-slate-400">
                Transform {quote.lineItems.length} quoted deliverables into active project tasks and costing items
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-2 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleConvert} className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Mode Selector */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setMode('create_new')}
              className={`p-3.5 rounded-xl border text-left transition flex items-center gap-3 ${
                mode === 'create_new'
                  ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 shadow-sm'
                  : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <FolderKanban className="w-5 h-5 flex-shrink-0" />
              <div>
                <div className="text-xs font-bold text-slate-100">Create New Project</div>
                <div className="text-[11px] text-slate-400">Provision fresh project workspace</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setMode('link_existing')}
              className={`p-3.5 rounded-xl border text-left transition flex items-center gap-3 ${
                mode === 'link_existing'
                  ? 'bg-indigo-500/15 border-indigo-500 text-indigo-300 shadow-sm'
                  : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <Layers className="w-5 h-5 flex-shrink-0" />
              <div>
                <div className="text-xs font-bold text-slate-100">Link Existing Project</div>
                <div className="text-[11px] text-slate-400">Append to ongoing delivery stream</div>
              </div>
            </button>
          </div>

          {/* Project Details Fields */}
          {mode === 'create_new' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Project Workspace Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Delivery Scope & Mission
                </label>
                <textarea
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Select Destination Project Workspace <span className="text-rose-400">*</span>
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500"
              >
                {existingProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.id})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Scope Breakdown Preview */}
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 space-y-2.5">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center justify-between">
              <span>Conversion Summary</span>
              <span className="text-emerald-400 font-bold">{formatCurrency(quote.grandTotal, quote.currency)}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-emerald-400" />
                <div>
                  <div className="text-slate-200 font-bold">{serviceLines.length} Tasks Created</div>
                  <div className="text-[10px] text-slate-400">
                    {serviceLines.reduce((acc, i) => acc + i.quantity, 0)} est. hours populated
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center gap-2">
                <Package className="w-4 h-4 text-indigo-400" />
                <div>
                  <div className="text-slate-200 font-bold">{productLines.length} Physical Deliverables</div>
                  <div className="text-[10px] text-slate-400">Linked to SKU fulfillment</div>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConvert}
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-500/20 disabled:opacity-50 transition flex items-center gap-2"
          >
            {isSubmitting ? (
              <>Provisioning Deliverables...</>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Execute Project Conversion
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
export default QuoteToProjectModal;
