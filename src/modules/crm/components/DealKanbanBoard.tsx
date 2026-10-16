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
  ExternalLink,
  Info
} from 'lucide-react';
import clsx from 'clsx';
import { Deal, PipelineStage, Account } from '../../../types/crm';
import { useDeals } from '../hooks/useDeals';
import { useAccounts } from '../hooks/useAccounts';
import { useContacts } from '../hooks/useContacts';
import { Account360Drawer } from './Account360Drawer';
import { ConvertDealModal } from './ConvertDealModal';

interface StageColumnConfig {
  stage: PipelineStage;
  label: string;
  borderColor: string;
  badgeBg: string;
  textColor: string;
}

const stageConfigs: StageColumnConfig[] = [
  {
    stage: 'discovery',
    label: 'Discovery',
    borderColor: 'border-slate-700/80',
    badgeBg: 'bg-slate-800 text-slate-300',
    textColor: 'text-slate-300',
  },
  {
    stage: 'proposal',
    label: 'Proposal',
    borderColor: 'border-blue-500/60',
    badgeBg: 'bg-blue-500/20 text-blue-300',
    textColor: 'text-blue-300',
  },
  {
    stage: 'negotiation',
    label: 'Negotiation',
    borderColor: 'border-amber-500/60',
    badgeBg: 'bg-amber-500/20 text-amber-300',
    textColor: 'text-amber-300',
  },
  {
    stage: 'closed_won',
    label: 'Closed Won',
    borderColor: 'border-emerald-500/60',
    badgeBg: 'bg-emerald-500/20 text-emerald-300',
    textColor: 'text-emerald-300',
  },
  {
    stage: 'closed_lost',
    label: 'Closed Lost',
    borderColor: 'border-rose-500/60',
    badgeBg: 'bg-rose-500/20 text-rose-300',
    textColor: 'text-rose-300',
  },
];

const stageOrder: PipelineStage[] = ['discovery', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];

export const DealKanbanBoard: React.FC = () => {
  const navigate = useNavigate();

  const {
    deals,
    loading: dealsLoading,
    totalPipelineValue,
    closedWonRevenue,
    winRate,
    addDeal,
    updateDealStage,
    deleteDeal,
    convertDealToProject,
  } = useDeals();

  const { accounts, loading: accountsLoading } = useAccounts();
  const { contacts } = useContacts();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAccountFilter, setSelectedAccountFilter] = useState<string>('all');
  const [isNewDealModalOpen, setIsNewDealModalOpen] = useState(false);
  const [draggedOverStage, setDraggedOverStage] = useState<PipelineStage | null>(null);

  // Drawer and Conversion Modals
  const [selectedAccountFor360, setSelectedAccountFor360] = useState<Account | null>(null);
  const [isAccountDrawerOpen, setIsAccountDrawerOpen] = useState(false);

  const [dealToConvert, setDealToConvert] = useState<Deal | null>(null);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);

  // New Deal Form State
  const [newTitle, setNewTitle] = useState('');
  const [newValue, setNewValue] = useState<number>(65000);
  const [newStage, setNewStage] = useState<PipelineStage>('discovery');
  const [newAccountId, setNewAccountId] = useState('');
  const [newContactId, setNewContactId] = useState('');
  const [newCloseDate, setNewCloseDate] = useState('Oct 15, 2026');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtered Deals
  const filteredDeals = useMemo(() => {
    return deals.filter((d) => {
      const matchesSearch =
        d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesAccount =
        selectedAccountFilter === 'all' || d.accountId === selectedAccountFilter;
      return matchesSearch && matchesAccount;
    });
  }, [deals, searchQuery, selectedAccountFilter]);

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    e.dataTransfer.setData('text/plain', dealId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, stage: PipelineStage) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedOverStage !== stage) {
      setDraggedOverStage(stage);
    }
  };

  const handleDragLeave = () => {
    setDraggedOverStage(null);
  };

  const handleDrop = (e: React.DragEvent, stage: PipelineStage) => {
    e.preventDefault();
    setDraggedOverStage(null);
    const dealId = e.dataTransfer.getData('text/plain');
    if (dealId) {
      updateDealStage(dealId, stage);
    }
  };

  const handleStageTransition = (dealId: string, currentStage: PipelineStage, direction: 'prev' | 'next') => {
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
    const defaultAccId = newAccountId || accounts[0]?.id || 'acc-shogun-root';
    const defaultCntId = newContactId || contacts.find(c => c.accountId === defaultAccId)?.id || 'cnt-101';

    await addDeal({
      tenantId: 'tenant-default',
      title: newTitle.trim(),
      value: Number(newValue) || 0,
      currency: 'USD',
      winProbability: newStage === 'closed_won' ? 100 : newStage === 'negotiation' ? 75 : newStage === 'proposal' ? 50 : 25,
      pipelineStage: newStage,
      accountId: defaultAccId,
      primaryContactId: defaultCntId,
      expectedCloseDate: newCloseDate.trim() || 'Q4 2026',
      linkedProjectId: null,
      assignedRepId: 'usr-admin-master',
    });

    setIsSubmitting(false);
    setNewTitle('');
    setNewValue(65000);
    setIsNewDealModalOpen(false);
  };

  const handleInspectAccount = (accountId: string) => {
    const acc = accounts.find((a) => a.id === accountId);
    if (acc) {
      setSelectedAccountFor360(acc);
      setIsAccountDrawerOpen(true);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-xl border border-slate-800 bg-slate-900/60 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Pipeline Value</span>
            <div className="p-2 rounded-lg bg-indigo-950/60 text-indigo-400 border border-indigo-500/30">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-100 tracking-tight font-mono">
            ${totalPipelineValue.toLocaleString()}
          </div>
          <p className="text-[11px] text-indigo-400 mt-1 font-medium">Weighted Opportunity Pool</p>
        </div>

        <div className="glass-card p-5 rounded-xl border border-slate-800 bg-slate-900/60 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Closed Won Revenue</span>
            <div className="p-2 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-400 tracking-tight font-mono">
            ${closedWonRevenue.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Converted into Deliveries</p>
        </div>

        <div className="glass-card p-5 rounded-xl border border-slate-800 bg-slate-900/60 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Win Probability Rate</span>
            <div className="p-2 rounded-lg bg-amber-950/60 text-amber-400 border border-amber-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-400 tracking-tight font-mono">
            {winRate}%
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Won vs. Lost Ratio</p>
        </div>

        <div className="glass-card p-5 rounded-xl border border-slate-800 bg-slate-900/60 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Active Deals</span>
            <div className="p-2 rounded-lg bg-violet-950/60 text-violet-400 border border-violet-500/30">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-100 tracking-tight font-mono">
            {deals.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{accounts.length} Target Client Accounts</p>
        </div>
      </div>

      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex flex-1 w-full sm:max-w-xl gap-2 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search deals, contacts, or values..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-900/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm"
            />
          </div>

          <div className="relative min-w-[160px]">
            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <Filter className="w-3.5 h-3.5" />
            </div>
            <select
              value={selectedAccountFilter}
              onChange={(e) => setSelectedAccountFilter(e.target.value)}
              aria-label="Filter by Account"
              className="w-full pl-8 pr-4 py-2 text-xs bg-slate-900/80 border border-slate-700/80 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-sm"
            >
              <option value="all">All Accounts ({accounts.length})</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          {(dealsLoading || accountsLoading) && (
            <span className="flex items-center gap-1.5 text-xs text-slate-400 font-mono mr-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
              Syncing...
            </span>
          )}
          <button
            onClick={() => setIsNewDealModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Opportunity</span>
          </button>
        </div>
      </div>

      {/* Kanban Stages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start">
        {stageConfigs.map((col) => {
          const colDeals = filteredDeals.filter((d) => d.pipelineStage === col.stage);
          const colTotalValue = colDeals.reduce((sum, d) => sum + (d.value || 0), 0);
          const isTargeted = draggedOverStage === col.stage;

          const currentIndex = stageOrder.indexOf(col.stage);
          const prevStage = currentIndex > 0 ? stageOrder[currentIndex - 1] : null;
          const nextStage = currentIndex < stageOrder.length - 1 ? stageOrder[currentIndex + 1] : null;

          return (
            <div
              key={col.stage}
              onDragOver={(e) => handleDragOver(e, col.stage)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.stage)}
              className={clsx(
                'glass-panel rounded-2xl p-3.5 border flex flex-col min-h-[500px] transition-all duration-200 shadow-sm',
                isTargeted
                  ? 'border-indigo-500 bg-indigo-950/40 shadow-md ring-2 ring-indigo-500/20'
                  : 'border-slate-800/80 bg-slate-900/40'
              )}
            >
              {/* Column Header */}
              <div className="pb-3 border-b border-slate-800/80 mb-3 space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-100 tracking-tight uppercase font-mono">
                    {col.label}
                  </h3>
                  <span className={clsx('text-[10px] font-mono font-bold px-2 py-0.5 rounded-full', col.badgeBg)}>
                    {colDeals.length}
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-400 font-mono">
                  ${colTotalValue.toLocaleString()}
                </div>
              </div>

              {/* Deal Cards */}
              <div className="flex-1 space-y-3 overflow-y-auto pr-0.5">
                {colDeals.length === 0 ? (
                  <div className="h-28 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-xl text-slate-400 text-xs text-center p-3">
                    <p>Drop deals here</p>
                  </div>
                ) : (
                  colDeals.map((deal) => {
                    const account = accounts.find((a) => a.id === deal.accountId);
                    const contact = contacts.find((c) => c.id === deal.primaryContactId);
                    const currentDealStage = (deal.pipelineStage || 'discovery') as PipelineStage;

                    return (
                      <div
                        key={deal.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, deal.id)}
                        className="glass-card rounded-xl p-3.5 border border-slate-800/80 bg-slate-900/85 hover:border-indigo-500/50 transition-all duration-150 group shadow-sm flex flex-col justify-between relative space-y-3 cursor-grab active:cursor-grabbing"
                      >
                        <div className="space-y-1.5">
                          {/* Value & Delete */}
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-sm font-black text-emerald-400 font-mono flex items-center gap-0.5">
                              <DollarSign className="w-3.5 h-3.5" />
                              {(deal.value || 0).toLocaleString()}
                            </span>
                            <button
                              onClick={() => deleteDeal(deal.id)}
                              title="Delete deal"
                              className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-400 p-1 rounded hover:bg-slate-800 transition"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Title */}
                          <h4 className="text-xs font-bold text-slate-100 group-hover:text-indigo-400 transition-colors leading-snug">
                            {deal.title}
                          </h4>

                          {/* Account & Contact Meta */}
                          <div className="space-y-1 text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                            {account && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleInspectAccount(account.id);
                                }}
                                className="flex items-center gap-1 text-slate-300 hover:text-indigo-300 transition truncate text-left w-full cursor-pointer"
                              >
                                <Building2 className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                                <span className="truncate font-medium">{account.name}</span>
                                <Info className="w-2.5 h-2.5 opacity-60 ml-auto" />
                              </button>
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

                        {/* Convert to Project Button for Closed Won */}
                        {deal.pipelineStage === 'closed_won' && (
                          <div className="pt-2 border-t border-slate-800/70">
                            {deal.linkedProjectId ? (
                              <button
                                onClick={() => {
                                  navigate(deal.linkedProjectId ? `/projects/${deal.linkedProjectId}?tab=tasks` : '/pm?tab=tasks');
                                }}
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

                        {/* Quick Stage Transition Buttons */}
                        <div className="pt-2 border-t border-slate-800/70 flex items-center justify-between text-[11px]">
                          {prevStage ? (
                            <button
                              onClick={() => handleStageTransition(deal.id, currentDealStage, 'prev')}
                              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                              title={`Move to ${prevStage}`}
                            >
                              <ArrowLeft className="w-3 h-3" />
                            </button>
                          ) : <div />}

                          <select
                            value={deal.pipelineStage || 'discovery'}
                            onChange={(e) => updateDealStage(deal.id, e.target.value as PipelineStage)}
                            className="text-[10px] bg-slate-800 text-slate-300 rounded px-1.5 py-0.5 border border-slate-700 focus:outline-none"
                          >
                            <option value="discovery">Discovery</option>
                            <option value="proposal">Proposal</option>
                            <option value="negotiation">Negotiation</option>
                            <option value="closed_won">Won</option>
                            <option value="closed_lost">Lost</option>
                          </select>

                          {nextStage ? (
                            <button
                              onClick={() => handleStageTransition(deal.id, currentDealStage, 'next')}
                              className="p-1 rounded bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/30 text-indigo-300 hover:text-white transition"
                              title={`Move to ${nextStage}`}
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

      {/* Account 360 Drawer */}
      <Account360Drawer
        account={selectedAccountFor360}
        contacts={contacts}
        deals={deals}
        isOpen={isAccountDrawerOpen}
        onClose={() => {
          setIsAccountDrawerOpen(false);
          setSelectedAccountFor360(null);
        }}
        onOpenCreateDeal={(accId) => {
          setNewAccountId(accId);
          setIsAccountDrawerOpen(false);
          setIsNewDealModalOpen(true);
        }}
      />

      {/* Convert Deal Modal */}
      <ConvertDealModal
        deal={dealToConvert as any}
        organizations={accounts as any}
        isOpen={isConvertModalOpen}
        onClose={() => {
          setIsConvertModalOpen(false);
          setDealToConvert(null);
        }}
        onConvert={async (dealId: string, pData: { title: string; description: string; organizationId: string }) => {
          return convertDealToProject(dealId, {
            title: pData.title,
            description: pData.description,
            accountId: pData.organizationId,
          });
        }}
      />

      {/* New Deal Modal */}
      {isNewDealModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="glass-panel p-6 rounded-2xl border border-slate-700 bg-slate-900 w-full max-w-lg shadow-2xl relative">
            <button
              onClick={() => setIsNewDealModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-indigo-600" /> Create New Opportunity / Deal
            </h3>

            <form onSubmit={handleCreateDeal} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-200">Opportunity Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Multi-Agent Microservice Implementation"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full mt-1.5 px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-200">Opportunity Value ($) *</label>
                  <input
                    type="number"
                    required
                    value={newValue}
                    onChange={(e) => setNewValue(Number(e.target.value))}
                    className="w-full mt-1.5 px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-200">Pipeline Stage</label>
                  <select
                    value={newStage}
                    onChange={(e) => setNewStage(e.target.value as PipelineStage)}
                    className="w-full mt-1.5 px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="discovery">Discovery</option>
                    <option value="proposal">Proposal</option>
                    <option value="negotiation">Negotiation</option>
                    <option value="closed_won">Closed Won</option>
                    <option value="closed_lost">Closed Lost</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-200">Client Account</label>
                  <select
                    value={newAccountId}
                    onChange={(e) => setNewAccountId(e.target.value)}
                    className="w-full mt-1.5 px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-200">Primary Contact</label>
                  <select
                    value={newContactId}
                    onChange={(e) => setNewContactId(e.target.value)}
                    className="w-full mt-1.5 px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    {contacts.map((contact) => (
                      <option key={contact.id} value={contact.id}>
                        {contact.firstName} {contact.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-200">Expected Close Date</label>
                <input
                  type="text"
                  placeholder="e.g., Oct 15, 2026"
                  value={newCloseDate}
                  onChange={(e) => setNewCloseDate(e.target.value)}
                  className="w-full mt-1.5 px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
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
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 flex items-center gap-2 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isSubmitting ? 'Saving...' : 'Create Opportunity'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DealKanbanBoard;
