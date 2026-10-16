import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Coins
} from 'lucide-react';
import { Deal, Organization } from '../../../types';

interface ConvertDealModalProps {
  deal: Deal | null;
  organizations: Organization[];
  isOpen: boolean;
  onClose: () => void;
  onConvert: (dealId: string, projectData: { title: string; description: string; organizationId: string }) => Promise<string>;
}

export const ConvertDealModal: React.FC<ConvertDealModalProps> = ({
  deal,
  organizations,
  isOpen,
  onClose,
  onConvert,
}) => {
  const navigate = useNavigate();

  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [organizationId, setOrganizationId] = useState('');
  const [isConverting, setIsConverting] = useState(false);

  useEffect(() => {
    if (deal) {
      setProjectTitle(deal.title || '');
      const org = organizations.find((o) => o.id === (deal.organizationId || deal.accountId));
      const amountVal = deal.amount ?? deal.value ?? 0;
      setProjectDescription(
        `Project delivered for ${org?.name || 'Client'}. Deal amount: $${amountVal.toLocaleString()}. Managed via Antigravity 2.0 multi-agent pipelines.`
      );
      setOrganizationId(deal.organizationId || deal.accountId || organizations[0]?.id || 'org-shogunate-root');
    }
  }, [deal, organizations]);

  if (!isOpen || !deal) return null;

  const orgName = organizations.find((o) => o.id === deal.organizationId)?.name || 'Direct Client';

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectTitle.trim()) return;

    setIsConverting(true);
    try {
      await onConvert(deal.id, {
        title: projectTitle.trim(),
        description: projectDescription.trim(),
        organizationId: organizationId || 'org-shogunate-root',
      });

      onClose();
      // Navigate to project workspace tasks
      navigate('/pm?tab=tasks');
    } catch (err) {
      console.warn('Deal conversion failed:', err);
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                  Closed Won Deal
                </span>
                <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                  <Coins className="w-3 h-3 text-amber-400" />
                  ${(deal.amount ?? deal.value ?? 0).toLocaleString()}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight mt-1">
                Convert Deal to Project Workspace
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 text-xs space-y-1">
            <p className="text-slate-400">
              Converting this deal will automatically initialize a new <strong className="text-white">Workspace Project</strong> with sprint architecture tasks, link the project ID to this deal, and navigate directly to the Kanban Board.
            </p>
            <p className="text-indigo-400 font-medium">Associated Client: {orgName}</p>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300">Project Title *</label>
            <input
              type="text"
              required
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              placeholder="e.g., Cloud Scale Deployment Phase 1"
              className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300">Project Description</label>
            <textarea
              rows={3}
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              placeholder="Scope, architecture specs, and goals..."
              className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300">Target Organization</label>
            <select
              value={organizationId}
              onChange={(e) => setOrganizationId(e.target.value)}
              className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
            >
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name} ({org.id})
                </option>
              ))}
            </select>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isConverting || !projectTitle.trim()}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isConverting ? 'Initializing Project...' : 'Convert & Launch Project'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConvertDealModal;
