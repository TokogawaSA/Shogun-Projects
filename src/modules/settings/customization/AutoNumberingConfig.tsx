import React, { useState, useEffect } from 'react';
import { Hash, Save, CheckCircle2, Loader2 } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { useAuth } from '../../../context/AuthContext';
import { AutoNumberingConfig, AutoNumberingRule } from '../../../types/settings';

export const AutoNumberingConfigView: React.FC = () => {
  const { user } = useAuth();
  const tenantId = user?.tenantId || 'tenant-default';

  const [sequences, setSequences] = useState<AutoNumberingConfig>({
    deals: { prefix: 'DEAL-', nextNumber: 1001, padZeroes: 5 },
    projects: { prefix: 'PRJ-', nextNumber: 2001, padZeroes: 4 },
    accounts: { prefix: 'ACC-', nextNumber: 5001, padZeroes: 4 },
    contacts: { prefix: 'CON-', nextNumber: 8001, padZeroes: 4 },
    tasks: { prefix: 'TSK-', nextNumber: 9001, padZeroes: 5 },
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      setLoading(true);
      try {
        const configDoc = await getDoc(doc(db, `tenants/${tenantId}/config/system`));
        if (configDoc.exists()) {
          const data = configDoc.data();
          if (data.autoNumbering) {
            setSequences(data.autoNumbering as AutoNumberingConfig);
          }
        }
      } catch (err) {
        console.warn('Using default auto-numbering sequences:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, [tenantId]);

  const updateSequence = (moduleKey: string, field: keyof AutoNumberingRule, value: any) => {
    setSequences((prev) => ({
      ...prev,
      [moduleKey]: {
        ...prev[moduleKey],
        [field]: value,
      },
    }));
  };

  const handleSaveSequences = async () => {
    setSaving(true);
    setSaveSuccess(false);

    try {
      await setDoc(
        doc(db, `tenants/${tenantId}/config/system`),
        {
          autoNumbering: sequences,
          updatedAt: new Date().toISOString(),
          updatedBy: user?.uid || 'system',
        },
        { merge: true }
      );
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save auto-numbering sequences:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Hash className="w-5 h-5 text-indigo-400" />
            Auto-Numbering Sequences & Serial IDs
          </h2>
          <p className="text-xs text-slate-400">
            Define custom prefixes, numerical padding, and auto-increment sequence counters for CRM entities.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
              <CheckCircle2 className="w-4 h-4" /> Sequences Saved!
            </span>
          )}
          <button
            onClick={handleSaveSequences}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>{saving ? 'Saving...' : 'Save Sequences'}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-400 mx-auto mb-2" />
          <p className="text-xs">Loading numbering configuration...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(sequences).map(([key, seq]) => {
            const sampleId = `${seq.prefix || ''}${String(seq.nextNumber || 1).padStart(
              seq.padZeroes || 4,
              '0'
            )}`;

            return (
              <div
                key={key}
                className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 backdrop-blur-md hover:border-slate-700 transition-all shadow-md"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wide">
                    {key} Module Sequence
                  </h3>
                  <div className="px-2.5 py-1 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-mono text-[11px] font-bold">
                    Next ID: <span className="text-white">{sampleId}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-mono uppercase">Prefix</label>
                    <input
                      type="text"
                      value={seq.prefix}
                      onChange={(e) => updateSequence(key, 'prefix', e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-mono uppercase">Next Number</label>
                    <input
                      type="number"
                      value={seq.nextNumber}
                      onChange={(e) => updateSequence(key, 'nextNumber', Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-mono uppercase">Padding Length</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={seq.padZeroes}
                      onChange={(e) => updateSequence(key, 'padZeroes', Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AutoNumberingConfigView;
