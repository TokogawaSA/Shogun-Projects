import React, { useState, useMemo } from 'react';
import {
  Search,
  RefreshCw,
  Sliders,
  Send,
  CornerDownRight,
  ExternalLink,
  FolderKanban,
  UserPlus,
  MessageSquare,
  CheckCircle,
  Flame,
  Radio,
  Sparkles,
  ShieldCheck,
  Twitter,
  Linkedin,
  Facebook,
  Instagram,
  Smile,
  Meh,
  Frown,
  HelpCircle,
  ShoppingCart,
  Heart,
  Loader2,
  Share2,
  X,
} from 'lucide-react';
import clsx from 'clsx';
import { useSocialStream } from '../hooks/useSocialStream';
import { EscalateToTaskModal } from './EscalateToTaskModal';
import { LinkContactModal } from './LinkContactModal';
import { ListeningRulesModal } from './ListeningRulesModal';
import {
  SocialInteraction,
  SocialSentiment,
  SocialIntent,
  SocialInteractionStatus,
} from '../../../types/social';
import { socialApi } from '../services/socialApi';

// Platform Icon Component
const PlatformIcon: React.FC<{ platform: string; className?: string }> = ({ platform, className = 'w-4 h-4' }) => {
  const p = (platform || '').toLowerCase();
  switch (p) {
    case 'twitter':
    case 'x':
      return <Twitter className={clsx('text-sky-400', className)} />;
    case 'linkedin':
      return <Linkedin className={clsx('text-blue-500', className)} />;
    case 'facebook':
      return <Facebook className={clsx('text-blue-600', className)} />;
    case 'instagram':
      return <Instagram className={clsx('text-pink-400', className)} />;
    case 'reddit':
      return <MessageSquare className={clsx('text-orange-500', className)} />;
    case 'youtube':
      return <Share2 className={clsx('text-red-500', className)} />;
    default:
      return <Radio className={clsx('text-indigo-400', className)} />;
  }
};

export const SocialListeningHub: React.FC = () => {
  // Filter States
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [sentimentFilter, setSentimentFilter] = useState<SocialSentiment | 'all'>('all');
  const [intentFilter, setIntentFilter] = useState<SocialIntent | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<SocialInteractionStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Reply Draft
  const [replyText, setReplyText] = useState<string>('');

  // Modals
  const [isEscalateModalOpen, setIsEscalateModalOpen] = useState<boolean>(false);
  const [isLinkContactModalOpen, setIsLinkContactModalOpen] = useState<boolean>(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState<boolean>(false);
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState<boolean>(false);

  // Simulation Form State
  const [simContent, setSimContent] = useState<string>('Our production server is broken and we cannot login! Please help fix this issue urgently.');
  const [simPlatform, setSimPlatform] = useState<string>('twitter');
  const [simAuthorHandle, setSimAuthorHandle] = useState<string>('@tech_director');
  const [simAuthorName, setSimAuthorName] = useState<string>('Sarah Connor');
  const [simulating, setSimulating] = useState<boolean>(false);

  // Active Query
  const filterParams = useMemo(
    () => ({
      platform: platformFilter !== 'all' ? platformFilter : undefined,
      sentiment: sentimentFilter !== 'all' ? sentimentFilter : undefined,
      intent: intentFilter !== 'all' ? intentFilter : undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      search: searchQuery.trim() !== '' ? searchQuery.trim() : undefined,
    }),
    [platformFilter, sentimentFilter, intentFilter, statusFilter, searchQuery]
  );

  const {
    interactions,
    total,
    isLoading,
    isFetching,
    refetch,
    newMentionsCount,
    clearNewMentionsCount,
    replyMutation,
    escalateMutation,
    linkContactMutation,
  } = useSocialStream(filterParams);

  // Selected item reference
  const selectedInteraction: SocialInteraction | null = useMemo(() => {
    if (selectedId) {
      const found = interactions.find((i) => i.id === selectedId);
      if (found) return found;
    }
    return interactions.length > 0 ? interactions[0] : null;
  }, [interactions, selectedId]);

  // Reply quick snippets
  const quickReplies = [
    "We are investigating this right now! Thanks for flagging.",
    "Thanks for your feedback! Our support team has created an urgent ticket.",
    "Glad you're enjoying Shogun Projects! We appreciate the shoutout.",
    "Please send us a direct message with your account email so we can look into this.",
  ];

  const handleSendReply = async () => {
    if (!selectedInteraction || !replyText.trim()) return;
    try {
      await replyMutation.mutateAsync({
        id: selectedInteraction.id,
        replyText: replyText.trim(),
      });
      setReplyText('');
    } catch (err: any) {
      console.error('Failed to send reply:', err);
    }
  };

  const handleSimulateInbound = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simContent.trim()) return;
    setSimulating(true);
    try {
      await socialApi.simulateInbound({
        platform: simPlatform,
        authorHandle: simAuthorHandle.trim(),
        authorName: simAuthorName.trim(),
        content: simContent.trim(),
        isVerified: true,
      });
      setIsSimulateModalOpen(false);
      refetch();
    } catch (err: any) {
      console.error('Simulation failed:', err);
    } finally {
      setSimulating(false);
    }
  };

  const getSentimentPill = (sentiment: string, score?: number | null) => {
    switch (sentiment) {
      case 'positive':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Smile className="w-3 h-3" /> Positive {score ? `(${score})` : ''}
          </span>
        );
      case 'negative':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Frown className="w-3 h-3" /> Negative {score ? `(${score})` : ''}
          </span>
        );
      case 'neutral':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            <Meh className="w-3 h-3" /> Neutral
          </span>
        );
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-600/20 text-red-400 border border-red-500/30 animate-pulse">
            <Flame className="w-3 h-3" /> Critical
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
            High
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
            Medium
          </span>
        );
      case 'low':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
            Low
          </span>
        );
    }
  };

  const getIntentBadge = (intent: string) => {
    switch (intent) {
      case 'support_issue':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-rose-500/10 text-rose-300 border border-rose-500/20">
            <HelpCircle className="w-3 h-3" /> Support Issue
          </span>
        );
      case 'purchase_intent':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
            <ShoppingCart className="w-3 h-3" /> Purchase Intent
          </span>
        );
      case 'praise':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-purple-500/10 text-purple-300 border border-purple-500/20">
            <Heart className="w-3 h-3" /> Praise
          </span>
        );
      case 'general':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
            General
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Real-time incoming mentions notification bar */}
      {newMentionsCount > 0 && (
        <div className="bg-gradient-to-r from-indigo-900/90 to-purple-900/90 border-b border-indigo-500/40 px-6 py-2 flex items-center justify-between text-xs text-indigo-200 animate-slideDown">
          <div className="flex items-center gap-2 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>
              <strong>{newMentionsCount} new mention{newMentionsCount > 1 ? 's' : ''}</strong> captured by live stream!
            </span>
          </div>
          <button
            onClick={() => {
              clearNewMentionsCount();
              refetch();
            }}
            className="px-2.5 py-1 rounded-lg bg-indigo-500/30 hover:bg-indigo-500/50 text-white font-semibold text-[11px] transition"
          >
            Refresh Feed
          </button>
        </div>
      )}

      {/* Top Action Bar */}
      <div className="h-14 px-6 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between gap-4 backdrop-blur-md flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white flex items-center gap-2">
              Social Listening Hub
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {total} Total Mentions
              </span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Quick Simulation Button */}
          <button
            onClick={() => setIsSimulateModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Simulate Mention
          </button>

          {/* Manage Keyword Rules Button */}
          <button
            onClick={() => setIsRulesModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition"
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
            Listening Rules
          </button>

          {/* Refresh button */}
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            title="Refresh feed"
          >
            <RefreshCw className={clsx('w-3.5 h-3.5', isFetching && 'animate-spin text-indigo-400')} />
          </button>
        </div>
      </div>

      {/* Main 3-Pane Layout */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* ================================================================= */}
        {/* LEFT PANE: Filter Drawer */}
        {/* ================================================================= */}
        <aside className="w-64 border-r border-slate-800 bg-slate-900/30 p-4 space-y-6 overflow-y-auto flex-shrink-0">
          {/* Search Input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              Search Content
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Keywords or @handle..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Platform Filters */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              Platform
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {['all', 'twitter', 'linkedin', 'facebook', 'reddit'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPlatformFilter(p)}
                  className={clsx(
                    'px-2.5 py-1.5 rounded-lg text-xs font-medium text-left flex items-center gap-2 transition border',
                    platformFilter === p
                      ? 'bg-indigo-600 text-white border-indigo-500 font-semibold shadow-sm'
                      : 'bg-slate-900/50 text-slate-400 border-slate-800/80 hover:bg-slate-800 hover:text-slate-200'
                  )}
                >
                  {p !== 'all' && <PlatformIcon platform={p} className="w-3.5 h-3.5" />}
                  <span className="capitalize">{p === 'all' ? 'All Platforms' : p}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Sentiment Filters */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              Sentiment
            </label>
            <div className="space-y-1">
              {[
                { id: 'all', label: 'All Sentiments', icon: Radio },
                { id: 'positive', label: 'Positive', icon: Smile, color: 'text-emerald-400' },
                { id: 'neutral', label: 'Neutral', icon: Meh, color: 'text-slate-400' },
                { id: 'negative', label: 'Negative', icon: Frown, color: 'text-rose-400' },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = sentimentFilter === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSentimentFilter(item.id as any)}
                    className={clsx(
                      'w-full px-3 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition border',
                      isSelected
                        ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 font-semibold'
                        : 'bg-slate-900/40 text-slate-400 border-slate-800/60 hover:bg-slate-800 hover:text-slate-200'
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <Icon className={clsx('w-3.5 h-3.5', item.color)} />
                      {item.label}
                    </span>
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Intent Filters */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              Detected Intent
            </label>
            <div className="space-y-1">
              {[
                { id: 'all', label: 'All Intents' },
                { id: 'support_issue', label: 'Support Issues' },
                { id: 'purchase_intent', label: 'Purchase Intent' },
                { id: 'praise', label: 'Brand Praise' },
                { id: 'general', label: 'General / Other' },
              ].map((item) => {
                const isSelected = intentFilter === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setIntentFilter(item.id as any)}
                    className={clsx(
                      'w-full px-3 py-1.5 rounded-lg text-xs font-medium text-left transition border',
                      isSelected
                        ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 font-semibold'
                        : 'bg-slate-900/40 text-slate-400 border-slate-800/60 hover:bg-slate-800 hover:text-slate-200'
                    )}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status Filters */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              Workflow Status
            </label>
            <div className="space-y-1">
              {[
                { id: 'all', label: 'All Statuses' },
                { id: 'new', label: 'New / Unhandled' },
                { id: 'replied', label: 'Replied' },
                { id: 'escalated', label: 'Escalated to Task' },
              ].map((item) => {
                const isSelected = statusFilter === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setStatusFilter(item.id as any)}
                    className={clsx(
                      'w-full px-3 py-1.5 rounded-lg text-xs font-medium text-left transition border',
                      isSelected
                        ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 font-semibold'
                        : 'bg-slate-900/40 text-slate-400 border-slate-800/60 hover:bg-slate-800 hover:text-slate-200'
                    )}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* ================================================================= */}
        {/* CENTER PANE: Interactive Social Timeline */}
        {/* ================================================================= */}
        <section className="flex-1 flex flex-col min-w-0 border-r border-slate-800 overflow-hidden bg-slate-950/40">
          {/* Timeline Feed Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                <p className="text-xs font-medium">Loading social timeline...</p>
              </div>
            ) : interactions.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/20 space-y-3 max-w-md mx-auto my-12">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-400 mx-auto flex items-center justify-center">
                  <Radio className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white">No mentions matching filters</h3>
                <p className="text-xs text-slate-400">
                  Try adjusting your filters, or use "Simulate Mention" to inject a live sample interaction.
                </p>
                <button
                  onClick={() => setIsSimulateModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition"
                >
                  Simulate Inbound Mention
                </button>
              </div>
            ) : (
              interactions.map((interaction) => {
                const isSelected = selectedInteraction?.id === interaction.id;

                return (
                  <div
                    key={interaction.id}
                    onClick={() => setSelectedId(interaction.id)}
                    className={clsx(
                      'p-4 rounded-2xl border transition-all cursor-pointer relative group',
                      isSelected
                        ? 'bg-slate-900 border-indigo-500/60 shadow-lg shadow-indigo-950/20 ring-1 ring-indigo-500/30'
                        : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-900/80 hover:border-slate-700'
                    )}
                  >
                    {/* Header: Author + Badges */}
                    <div className="flex items-start justify-between gap-3 mb-2.5">
                      <div className="flex items-center gap-2.5 truncate">
                        <img
                          src={
                            interaction.authorAvatar ||
                            `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(
                              interaction.authorHandle
                            )}`
                          }
                          alt={interaction.authorName}
                          className="w-9 h-9 rounded-xl border border-slate-700 object-cover bg-slate-800 flex-shrink-0"
                        />
                        <div className="truncate">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="text-xs font-bold text-white truncate">
                              {interaction.authorName}
                            </span>
                            {interaction.isVerified && (
                              <ShieldCheck className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                            )}
                            <span className="text-[11px] text-slate-400 truncate">
                              @{interaction.authorHandle.replace('@', '')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                            <PlatformIcon platform={interaction.platform} className="w-3 h-3" />
                            <span className="capitalize">{interaction.platform}</span>
                            <span>•</span>
                            <span>
                              {new Date(interaction.publishedAt).toLocaleDateString([], {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Urgency & Sentiment Badges */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {getUrgencyBadge(interaction.urgency)}
                        {getSentimentPill(interaction.sentiment, interaction.sentimentScore)}
                      </div>
                    </div>

                    {/* Post Content */}
                    <p className="text-xs text-slate-200 leading-relaxed font-normal mb-3 whitespace-pre-wrap">
                      {interaction.content}
                    </p>

                    {/* Bottom Metadata & Status Links */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[11px]">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getIntentBadge(interaction.intent)}

                        {/* Escalated Task Badge */}
                        {interaction.escalatedTaskId && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-semibold text-[10px]">
                            <FolderKanban className="w-3 h-3" /> Task Linked
                          </span>
                        )}

                        {/* Linked CRM Contact Badge */}
                        {interaction.linkedContactId && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-semibold text-[10px]">
                            <CheckCircle className="w-3 h-3" /> CRM Contact
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-[10px] text-slate-500">
                        {Array.isArray(interaction.threadHistory) && interaction.threadHistory.length > 1 && (
                          <span className="flex items-center gap-1 text-indigo-400 font-medium">
                            <MessageSquare className="w-3 h-3" />
                            {interaction.threadHistory.length} messages
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* ================================================================= */}
        {/* RIGHT PANE: Detail & Quick Action Drawer */}
        {/* ================================================================= */}
        <aside className="w-96 border-l border-slate-800 bg-slate-900/50 flex flex-col min-h-0 flex-shrink-0">
          {selectedInteraction ? (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Detail Header */}
              <div className="p-4 border-b border-slate-800 bg-slate-900/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PlatformIcon platform={selectedInteraction.platform} className="w-4 h-4" />
                    <span className="text-xs font-bold text-white capitalize">
                      {selectedInteraction.platform} Thread
                    </span>
                  </div>

                  {selectedInteraction.postUrl && (
                    <a
                      href={selectedInteraction.postUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" /> Original
                    </a>
                  )}
                </div>

                {/* Quick Action Escalation Bar */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setIsEscalateModalOpen(true)}
                    className={clsx(
                      'px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition border shadow-sm',
                      selectedInteraction.escalatedTaskId
                        ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white border-transparent'
                    )}
                  >
                    <FolderKanban className="w-3.5 h-3.5" />
                    <span>{selectedInteraction.escalatedTaskId ? 'View Task' : 'Escalate to Task'}</span>
                  </button>

                  <button
                    onClick={() => setIsLinkContactModalOpen(true)}
                    className={clsx(
                      'px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition border shadow-sm',
                      selectedInteraction.linkedContactId
                        ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                    )}
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{selectedInteraction.linkedContactId ? 'Contact Linked' : 'Link Contact'}</span>
                  </button>
                </div>
              </div>

              {/* Thread History Stream */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                  Conversation Thread
                </h4>

                {Array.isArray(selectedInteraction.threadHistory) &&
                selectedInteraction.threadHistory.length > 0 ? (
                  selectedInteraction.threadHistory.map((msg, idx) => {
                    const isOutbound = msg.isOutbound;
                    return (
                      <div
                        key={msg.id || idx}
                        className={clsx(
                          'p-3.5 rounded-2xl border text-xs space-y-1.5',
                          isOutbound
                            ? 'bg-indigo-950/40 border-indigo-500/30 text-indigo-100 ml-4'
                            : 'bg-slate-950/60 border-slate-800 text-slate-200 mr-4'
                        )}
                      >
                        <div className="flex items-center justify-between text-[10px]">
                          <span className={clsx('font-bold', isOutbound ? 'text-indigo-300' : 'text-slate-300')}>
                            {msg.author} ({msg.handle})
                          </span>
                          <span className="text-slate-500 font-mono">
                            {new Date(msg.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs">
                    {selectedInteraction.content}
                  </div>
                )}
              </div>

              {/* Inline Reply Textarea */}
              <div className="p-4 border-t border-slate-800 bg-slate-900/80 space-y-2.5">
                {/* Quick response templates */}
                <div className="flex flex-wrap gap-1.5">
                  {quickReplies.slice(0, 2).map((snippet, idx) => (
                    <button
                      key={idx}
                      onClick={() => setReplyText(snippet)}
                      className="px-2 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-[10px] text-slate-300 border border-slate-700 transition truncate max-w-[170px]"
                      title={snippet}
                    >
                      {snippet}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <textarea
                    rows={3}
                    placeholder={`Reply in-thread to @${selectedInteraction.authorHandle}...`}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none font-sans"
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={replyMutation.isPending || !replyText.trim()}
                    className="absolute right-2.5 bottom-3 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1.5 shadow"
                  >
                    {replyMutation.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>Reply</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 space-y-2">
              <CornerDownRight className="w-8 h-8 text-slate-600" />
              <p className="text-xs font-medium">Select an interaction from the timeline to view details and reply.</p>
            </div>
          )}
        </aside>
      </div>

      {/* ================================================================= */}
      {/* MODALS */}
      {/* ================================================================= */}

      {/* 1. Escalate to Project Task Modal */}
      <EscalateToTaskModal
        isOpen={isEscalateModalOpen}
        onClose={() => setIsEscalateModalOpen(false)}
        interaction={selectedInteraction}
        onEscalate={async (payload) => {
          if (selectedInteraction) {
            await escalateMutation.mutateAsync({
              id: selectedInteraction.id,
              payload,
            });
          }
        }}
      />

      {/* 2. Link CRM Contact Modal */}
      <LinkContactModal
        isOpen={isLinkContactModalOpen}
        onClose={() => setIsLinkContactModalOpen(false)}
        interaction={selectedInteraction}
        onLinkContact={async (payload) => {
          if (selectedInteraction) {
            await linkContactMutation.mutateAsync({
              id: selectedInteraction.id,
              payload,
            });
          }
        }}
      />

      {/* 3. Listening Rules Modal */}
      <ListeningRulesModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
        onRulesChanged={() => refetch()}
      />

      {/* 4. Simulate Inbound Mention Modal */}
      {isSimulateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Simulate Inbound Social Mention</h3>
              </div>
              <button
                onClick={() => setIsSimulateModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSimulateInbound} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-semibold">Platform</label>
                  <select
                    value={simPlatform}
                    onChange={(e) => setSimPlatform(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="twitter">Twitter / X</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="facebook">Facebook</option>
                    <option value="reddit">Reddit</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-semibold">Author Handle</label>
                  <input
                    type="text"
                    value={simAuthorHandle}
                    onChange={(e) => setSimAuthorHandle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-semibold">Author Display Name</label>
                <input
                  type="text"
                  value={simAuthorName}
                  onChange={(e) => setSimAuthorName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-semibold">Post Content</label>
                <textarea
                  rows={4}
                  value={simContent}
                  onChange={(e) => setSimContent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 resize-none font-sans"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSimulateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={simulating}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition flex items-center gap-2"
                >
                  {simulating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Inject Mention
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialListeningHub;
