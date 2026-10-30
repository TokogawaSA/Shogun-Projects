import React, { useState, useEffect } from 'react';
import {
  X,
  Sliders,
  Plus,
  Trash2,
  Check,
  Loader2,
  AlertCircle,
  Radio,
  CheckCircle2,
} from 'lucide-react';
import { socialApi } from '../services/socialApi';
import { SocialListeningRule } from '../../../types/social';

interface ListeningRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRulesChanged?: () => void;
}

const AVAILABLE_PLATFORMS = [
  { id: 'twitter', label: 'Twitter / X' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'reddit', label: 'Reddit' },
  { id: 'youtube', label: 'YouTube' },
];

export const ListeningRulesModal: React.FC<ListeningRulesModalProps> = ({
  isOpen,
  onClose,
  onRulesChanged,
}) => {
  const [rules, setRules] = useState<SocialListeningRule[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);

  // Form states
  const [ruleName, setRuleName] = useState<string>('');
  const [keywordsInput, setKeywordsInput] = useState<string>('');
  const [excludedInput, setExcludedInput] = useState<string>('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([
    'twitter',
    'linkedin',
    'facebook',
    'reddit',
  ]);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const loadRules = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const data = await socialApi.getRules();
      setRules(data);
    } catch (err: any) {
      console.warn('[ListeningRulesModal] Failed to load rules:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadRules();
      setShowCreateForm(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePlatformToggle = (platformId: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId)
        ? prev.filter((p) => p !== platformId)
        : [...prev, platformId]
    );
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    const keywords = keywordsInput
      .split(',')
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    const excludedWords = excludedInput
      .split(',')
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    if (!ruleName.trim()) {
      setErrorMsg('Rule name is required.');
      return;
    }
    if (keywords.length === 0) {
      setErrorMsg('At least one keyword is required.');
      return;
    }
    if (selectedPlatforms.length === 0) {
      setErrorMsg('At least one platform must be selected.');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');
    try {
      await socialApi.createRule({
        name: ruleName.trim(),
        keywords,
        excludedWords,
        platforms: selectedPlatforms,
        isActive: true,
      });

      setRuleName('');
      setKeywordsInput('');
      setExcludedInput('');
      setShowCreateForm(false);
      await loadRules();
      onRulesChanged?.();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create rule.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (rule: SocialListeningRule) => {
    try {
      await socialApi.updateRule(rule.id, { isActive: !rule.isActive });
      await loadRules();
      onRulesChanged?.();
    } catch (err: any) {
      setErrorMsg('Failed to update rule status.');
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this listening rule?')) return;
    try {
      await socialApi.deleteRule(ruleId);
      await loadRules();
      onRulesChanged?.();
    } catch (err: any) {
      setErrorMsg('Failed to delete rule.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Keyword Listening Rules</h2>
              <p className="text-xs text-slate-400">
                Track brand mentions, competitor alerts, and keyword topics
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Rules List Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-indigo-400" />
                Active Listening Rules ({rules.length})
              </h3>
              {!showCreateForm && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Rule
                </button>
              )}
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8 text-xs text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading rules...
              </div>
            ) : rules.length === 0 && !showCreateForm ? (
              <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl bg-slate-950/30">
                No keyword listening rules established yet. Click "New Rule" to start monitoring mentions.
              </div>
            ) : (
              <div className="space-y-2.5">
                {rules.map((rule) => {
                  const keywords = (rule.keywords as string[]) || [];
                  const excluded = (rule.excludedWords as string[]) || [];
                  const platforms = (rule.platforms as string[]) || [];

                  return (
                    <div
                      key={rule.id}
                      className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/80 flex items-start justify-between gap-4 hover:border-slate-700 transition"
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="text-xs font-bold text-white">{rule.name}</span>
                          <button
                            onClick={() => handleToggleActive(rule)}
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border transition ${
                              rule.isActive
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            {rule.isActive ? 'Active' : 'Paused'}
                          </button>
                          {rule._count?.interactions !== undefined && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              {rule._count.interactions} mentions captured
                            </span>
                          )}
                        </div>

                        {/* Keyword Pills */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] text-slate-400 font-medium">Keywords:</span>
                          {keywords.map((kw, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-mono"
                            >
                              {kw}
                            </span>
                          ))}
                        </div>

                        {excluded.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] text-slate-400 font-medium">Exclude:</span>
                            {excluded.map((ex, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[10px] font-mono"
                              >
                                -{ex}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-1 text-[10px] text-slate-400">
                          <span>Platforms:</span>
                          <span className="font-semibold text-slate-300 capitalize">
                            {platforms.join(', ')}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleDeleteRule(rule.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                          title="Delete rule"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Create New Rule Drawer / Inline Form */}
          {showCreateForm && (
            <form
              onSubmit={handleCreateRule}
              className="p-5 rounded-2xl bg-slate-950 border border-indigo-500/30 space-y-4 animate-fadeIn shadow-lg shadow-indigo-950/20"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-indigo-400" /> Create Keyword Tracking Rule
                </h4>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="text-xs text-slate-500 hover:text-slate-300"
                >
                  Cancel
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Rule Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Brand Name & Core Product"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Tracked Keywords (Comma-separated) *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Shogun, Shogun Projects, Shogunate"
                  value={keywordsInput}
                  onChange={(e) => setKeywordsInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Negative Exclude-Words (Comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. anime, videogame, shogun tv series"
                  value={excludedInput}
                  onChange={(e) => setExcludedInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              {/* Target Platforms Checkboxes */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Target Platforms *</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {AVAILABLE_PLATFORMS.map((p) => {
                    const isChecked = selectedPlatforms.includes(p.id);
                    return (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => handlePlatformToggle(p.id)}
                        className={`px-3 py-2 rounded-xl border text-xs font-medium flex items-center justify-between transition ${
                          isChecked
                            ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-900'
                        }`}
                      >
                        <span>{p.label}</span>
                        {isChecked && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition flex items-center gap-2"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  Save Rule
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default ListeningRulesModal;
