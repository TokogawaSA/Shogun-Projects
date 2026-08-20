import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  DollarSign, 
  Plus, 
  Search, 
  Filter, 
  ArrowRight, 
  ArrowLeft, 
  Calendar, 
  Building2, 
  User, 
  TrendingUp, 
  Coins, 
  Sparkles, 
  X, 
  FolderKanban, 
  Loader2, 
  Trash2, 
  ExternalLink 
} from 'lucide-react';
import clsx from 'clsx';
import { Deal, DealStage } from '../../types';
import { useFirestoreCRM } from '../../hooks/useFirestoreCRM';
import { useProject } from '../../context/ProjectContext';
import { ConvertDealModal } from './ConvertDealModal';

interface StageColumnConfig {
  stage: DealStage;
  label: string;
  color: string;
  borderColor: string;
  badgeBg: string;
  textColor: string;
}

const stageConfigs: StageColumnConfig[] = [
  {
    stage: 'prospecting',
    label: 'Prospecting',
    color: 'bg-slate-500/10',
    borderColor: 'border-slate-700/80',
    badgeBg: 'bg-slate-800 text-slate-300',
    textColor: 'text-slate-300',
  },
  {
    stage: 'qualification',
    label: 'Qualification',
    color: 'bg-blue-500/10',
    borderColor: 'border-blue-500/60',
    badgeBg: 'bg-blue-500/20 text-blue-300',
    textColor: 'text-blue-300',
  },
  {
    stage: 'proposal',
    label: 'Proposal Sent',
    color: 'bg-amber-500/10',
    borderColor: 'border-amber-500/60',
    badgeBg: 'bg-amber-500/20 text-amber-300',
    textColor: 'text-amber-300',
  },
  {
    stage: 'closed_won',
    label: 'Closed Won',
    color: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/60',
    badgeBg: 'bg-emerald-500/20 text-emerald-300',
    textColor: 'text-emerald-300',
  },
  {
    stage: 'closed_lost',
    label: 'Closed Lost',
    color: 'bg-rose-500/10',
    borderColor: 'border-rose-500/60',
    badgeBg: 'bg-rose-500/20 text-rose-300',
    textColor: 'text-rose-300',
  },
];

const stageOrder: DealStage[] = ['prospecting', 'qualification', 'proposal', 'closed_won', 'closed_lost'];

export const DealPipeline: React.FC = () => {
  const navigate = useNavigate();
  const { setCurrentProjectId } = useProject();

  const {
    deals,
    contacts,
    organizations,
    loading,
    addDeal,
    updateDealStage,
    deleteDeal,
    convertDealToProject,
  } = useFirestoreCRM();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrgFilter, setSelectedOrgFilter] = useState<string>('all');
  const [isNewDealModalOpen, setIsNewDealModalOpen] = useState(false);

  // Conversion Modal State
  const [dealToConvert, setDealToConvert] = useState<Deal | null>(null);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);

  // New Deal Form State
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState<number>(50000);
  const [newStage, setNewStage] = useState<DealStage>('prospecting');
  const [newOrgId, setNewOrgId] = useState('');
  const [newContactId, setNewContactId] = useState('');
  const [newCloseDate, setNewCloseDate] = useState('Sep 30, 2026');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtered Deals
  const filteredDeals = useMemo(() => {
    return deals.filter((d) => {
      const matchesSearch =
        d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesOrg =
        selectedOrgFilter === 'all' || d.organizationId === selectedOrgFilter;
      return matchesSearch && matchesOrg;
    });
  }, [deals, searchQuery, selectedOrgFilter]);

  // Telemetry Aggregates
  const totalPipelineValue = useMemo(() => {
    return deals
      .filter((d) => d.stage !== 'closed_lost')
      .reduce((sum, d) => sum + (d.amount || 0), 0);
  }, [deals]);

  const closedWonValue = useMemo(() => {
    return deals
      .filter((d) => d.stage === 'closed_won')
      .reduce((sum, d) => sum + (d.amount || 0), 0);
  }, [deals]);

  const winRate = useMemo(() => {
    const closedWon = deals.filter((d) => d.stage === 'closed_won').length;
    const closedLost = deals.filter((d) => d.stage === 'closed_lost').length;
    const totalClosed = closedWon + closedLost;
    if (totalClosed === 0) return 0;
    return Math.round((closedWon / totalClosed) * 100);
  }, [deals]);

  const handleStageTransition = (dealId: string, currentStage: DealStage, direction: 'prev' | 'next') => {
    const currentIndex = stageOrder.indexOf(currentStage);
    let nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex < 0) nextIndex = 0;
    if (nextIndex >= stageOrder.length) nextIndex = stageOrder.length - 1;

    const nextStage = stageOrder[nextIndex];
    updateDealStage(dealId, nextStage);
  };

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsSubmitting(true);
    await addDeal({
      title: newTitle.trim(),
      amount: Number(newAmount) || 0,
      stage: newStage,
      organizationId: newOrgId || undefined,
      contactId: newContactId || undefined,
      expectedCloseDate: newCloseDate.trim() || 'Q4 2026',
    });

    setIsSubmitting(false);
    setNewTitle('');
    setNewAmount(50000);
    setIsNewDealModalOpen(false);
  };

  const handleOpenLinkedProject = (projectId: string) => {
    setCurrentProjectId(projectId);
    navigate('/board');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-xl border border-slate-800 bg-slate-900/60 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Pipeline Value</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-white tracking-tight">
            ${totalPipelineValue.toLocaleString()}
          </div>
          <p className="text-[11px] text-indigo-300 mt-1">Active Deal Projections</p>
        </div>

        <div className="glass-card p-5 rounded-xl border border-slate-800 bg-slate-900/60 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Closed Won Revenue</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-400 tracking-tight">
            ${closedWonValue.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Secured Contract Value</p>
        </div>

        <div className="glass-card p-5 rounded-xl border border-slate-800 bg-slate-900/60 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Pipeline Win Rate</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-400 tracking-tight">
            {winRate}%
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Won vs. Lost ratio</p>
        </div>

        <div className="glass-card p-5 rounded-xl border border-slate-800 bg-slate-900/60 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Deals</span>
            <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-white tracking-tight">
            {deals.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{deals.filter(d => d.stage === 'closed_won').length} converted / won</p>
        </div>
      </div>

      {/* Search & Actions Bar */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-wrap items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-3 flex-1 min-w-[280px] max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search deals by title or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Org Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedOrgFilter}
              onChange={(e) => setSelectedOrgFilter(e.target.value)}
              className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Organizations</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>

          {/* Add Deal Button */}
          <button
            onClick={() => setIsNewDealModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Deal
          </button>
        </div>
      </div>

      {/* 5 Kanban Stage Columns */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto" />
          <p className="text-xs text-slate-400 font-mono">Syncing Deal Pipeline from Firestore...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {stageConfigs.map((col) => {
            const colDeals = filteredDeals.filter((d) => d.stage === col.stage);
            const colTotalAmount = colDeals.reduce((sum, d) => sum + (d.amount || 0), 0);

            const currentIndex = stageOrder.indexOf(col.stage);
            const prevStage = currentIndex > 0 ? stageOrder[currentIndex - 1] : null;
            const nextStage = currentIndex < stageOrder.length - 1 ? stageOrder[currentIndex + 1] : null;

            return (
              <div
                key={col.stage}
                className={clsx(
                  'glass-panel p-3.5 rounded-xl border bg-slate-900/40 flex flex-col min-h-[620px]',
                  col.borderColor
                )}
              >
                {/* Column Header: Stage Name, Count & Total Amount */}
                <div className="pb-3 border-b border-slate-800/80 mb-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-white tracking-tight uppercase font-mono">
                      {col.label}
                    </h3>
                    <span className={clsx('text-[10px] font-mono font-bold px-2 py-0.5 rounded-full', col.badgeBg)}>
                      {colDeals.length}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-300 font-mono">
                    ${colTotalAmount.toLocaleString()}
                  </div>
                </div>

                {/* Deal Cards */}
                <div className="flex-1 space-y-3 overflow-y-auto pr-0.5">
                  {colDeals.length === 0 ? (
                    <div className="h-28 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs text-center p-3">
                      <p>No deals in {col.label.toLowerCase()}</p>
                    </div>
                  ) : (
                    colDeals.map((deal) => {
                      const org = organizations.find((o) => o.id === deal.organizationId);
                      const contact = contacts.find((c) => c.id === deal.contactId);

                      return (
                        <div
                          key={deal.id}
                          className="glass-card rounded-xl p-3.5 border border-slate-800/80 bg-slate-900/80 hover:border-indigo-500/40 transition-all duration-150 group shadow-sm flex flex-col justify-between relative space-y-3"
                        >
                          <div className="space-y-1.5">
                            {/* Card Header: Amount & Delete Button */}
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-sm font-black text-emerald-400 font-mono">
                                ${(deal.amount ?? deal.value ?? 0).toLocaleString()}
                              </span>
                              <button
                                onClick={() => deleteDeal(deal.id)}
                                title="Delete deal"
                                className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-slate-800 transition"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Title */}
                            <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors leading-snug">
                              {deal.title}
                            </h4>

                            {/* Org & Contact Meta */}
                            <div className="space-y-1 text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                              {org && (
                                <div className="flex items-center gap-1 text-slate-300 truncate">
                                  <Building2 className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                                  <span className="truncate">{org.name}</span>
                                </div>
                              )}
                              {contact && (
                                <div className="flex items-center gap-1 text-slate-400 truncate">
                                  <User className="w-3 h-3 text-slate-500 flex-shrink-0" />
                                  <span className="truncate">{contact.firstName} {contact.lastName}</span>
                                </div>
                              )}
                              {deal.expectedCloseDate && (
                                <div className="flex items-center gap-1 text-slate-500 text-[10px]">
                                  <Calendar className="w-3 h-3 text-slate-600" />
                                  <span>{deal.expectedCloseDate}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Convert to Project Action for Won Deals */}
                          {(deal.stage === 'closed_won' || deal.pipelineStage === 'closed_won') && (
                            <div className="pt-2 border-t border-slate-800/70">
                              {deal.projectId || deal.linkedProjectId ? (
                                <button
                                  onClick={() => handleOpenLinkedProject((deal.projectId || deal.linkedProjectId)!)}
                                  className="w-full py-1.5 px-2.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-500/30 text-indigo-300 text-[11px] font-semibold flex items-center justify-between transition cursor-pointer"
                                >
                                  <span className="flex items-center gap-1">
                                    <FolderKanban className="w-3 h-3 text-indigo-400" />
                                    Project Active
                                  </span>
                                  <ExternalLink className="w-3 h-3" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setDealToConvert(deal);
                                    setIsConvertModalOpen(true);
                                  }}
                                  className="w-full py-1.5 px-2.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-500/40 text-emerald-300 hover:text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md shadow-emerald-600/10"
                                >
                                  <Sparkles className="w-3 h-3" />
                                  <span>Convert to Project</span>
                                </button>
                              )}
                            </div>
                          )}

                          {/* Stage Transition Controls */}
                          <div className="pt-2 border-t border-slate-800/70 flex items-center justify-between text-[11px]">
                            {prevStage ? (
                              <button
                                onClick={() => handleStageTransition(deal.id, (deal.stage || deal.pipelineStage || 'proposal') as DealStage, 'prev')}
                                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                                title="Move back"
                              >
                                <ArrowLeft className="w-3 h-3" />
                              </button>
                            ) : <div />}

                            <select
                              value={deal.stage || deal.pipelineStage}
                              onChange={(e) => updateDealStage(deal.id, e.target.value as DealStage)}
                              className="text-[10px] bg-slate-800 text-slate-300 rounded px-1.5 py-0.5 border border-slate-700 focus:outline-none"
                            >
                              <option value="prospecting">Prospect</option>
                              <option value="qualification">Qualify</option>
                              <option value="proposal">Proposal</option>
                              <option value="closed_won">Won</option>
                              <option value="closed_lost">Lost</option>
                            </select>

                            {nextStage ? (
                              <button
                                onClick={() => handleStageTransition(deal.id, (deal.stage || deal.pipelineStage || 'proposal') as DealStage, 'next')}
                                className="p-1 rounded bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/30 text-indigo-300 hover:text-white transition"
                                title="Move next"
                              >
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            ) : <div />}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Convert Deal Modal */}
      <ConvertDealModal
        deal={dealToConvert}
        organizations={organizations}
        isOpen={isConvertModalOpen}
        onClose={() => {
          setIsConvertModalOpen(false);
          setDealToConvert(null);
        }}
        onConvert={convertDealToProject}
      />

      {/* New Deal Modal */}
      {isNewDealModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="glass-panel p-6 rounded-2xl border border-slate-700 bg-slate-900 w-full max-w-lg shadow-2xl relative">
            <button
              onClick={() => setIsNewDealModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-indigo-400" /> Create New CRM Deal
            </h3>

            <form onSubmit={handleCreateDeal} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300">Deal Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Enterprise Architecture Support Contract"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full mt-1.5 px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Deal Value ($) *</label>
                  <input
                    type="number"
                    required
                    value={newAmount}
                    onChange={(e) => setNewAmount(Number(e.target.value))}
                    className="w-full mt-1.5 px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300">Initial Stage</label>
                  <select
                    value={newStage}
                    onChange={(e) => setNewStage(e.target.value as DealStage)}
                    className="w-full mt-1.5 px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="prospecting">Prospecting</option>
                    <option value="qualification">Qualification</option>
                    <option value="proposal">Proposal</option>
                    <option value="closed_won">Closed Won</option>
                    <option value="closed_lost">Closed Lost</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Organization</label>
                  <select
                    value={newOrgId}
                    onChange={(e) => setNewOrgId(e.target.value)}
                    className="w-full mt-1.5 px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">None (Individual Client)</option>
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300">Primary Contact</label>
                  <select
                    value={newContactId}
                    onChange={(e) => setNewContactId(e.target.value)}
                    className="w-full mt-1.5 px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">None</option>
                    {contacts.map((contact) => (
                      <option key={contact.id} value={contact.id}>
                        {contact.firstName} {contact.lastName} ({contact.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Expected Close Date</label>
                <input
                  type="text"
                  placeholder="e.g., Sep 30, 2026"
                  value={newCloseDate}
                  onChange={(e) => setNewCloseDate(e.target.value)}
                  className="w-full mt-1.5 px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewDealModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isSubmitting ? 'Saving...' : 'Create Deal'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DealPipeline;
