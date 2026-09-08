import React, { useState } from 'react';
import { X, Layers, Folder, ListFilter, Sparkles, Check, Rocket } from 'lucide-react';
import { useHierarchy } from '../../context/HierarchyContext';

const COLOR_PALETTES = [
  '#6366f1', // Indigo
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#f43f5e', // Rose
  '#f97316', // Orange
  '#eab308', // Yellow
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
];

const BLUEPRINTS = [
  {
    id: 'agile',
    name: 'Agile Software Sprint',
    description: 'Pre-configured with backlog, sprint folders, and QA review workflows.',
    color: '#6366f1',
  },
  {
    id: 'marketing',
    name: 'Marketing & Content Hub',
    description: 'Ideal for multi-channel campaigns, asset reviews, and publishing dates.',
    color: '#ec4899',
  },
  {
    id: 'crm',
    name: 'Client Deliverables Pipeline',
    description: 'Linked with client accounts, milestone billing, and contract signoffs.',
    color: '#10b981',
  },
];

export const CreateHierarchyModal: React.FC = () => {
  const {
    isCreateModalOpen,
    createModalTarget,
    closeCreateModal,
    spaces,
    createSpace,
    createFolder,
    createList,
  } = useHierarchy();

  const [activeTab, setActiveTab] = useState<'space' | 'folder' | 'list'>('space');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState('#6366f1');
  const [selectedSpaceId, setSelectedSpaceId] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [selectedBlueprint, setSelectedBlueprint] = useState('agile');
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (createModalTarget?.type) {
      setActiveTab(createModalTarget.type);
      if (createModalTarget.type === 'list') {
        // parentId can be spaceId or folderId
        const parentId = createModalTarget.parentId;
        if (parentId) {
          const matchingSpace = spaces.find((s) => s.id === parentId);
          if (matchingSpace) {
            setSelectedSpaceId(matchingSpace.id);
            setSelectedFolderId('');
          } else {
            // Check if parentId is a folder
            for (const s of spaces) {
              const matchingFolder = s.folders.find((f) => f.id === parentId);
              if (matchingFolder) {
                setSelectedSpaceId(s.id);
                setSelectedFolderId(matchingFolder.id);
                break;
              }
            }
          }
        } else if (spaces.length > 0) {
          setSelectedSpaceId(spaces[0].id);
          setSelectedFolderId('');
        }
      } else if (createModalTarget.parentId) {
        setSelectedSpaceId(createModalTarget.parentId);
      } else if (spaces.length > 0) {
        setSelectedSpaceId(spaces[0].id);
      }
    }
  }, [createModalTarget, spaces]);

  if (!isCreateModalOpen) return null;

  const currentSpace = spaces.find((s) => s.id === selectedSpaceId) || spaces[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      if (activeTab === 'space') {
        await createSpace(name.trim(), description.trim(), selectedColor);
      } else if (activeTab === 'folder') {
        const targetSpace = selectedSpaceId || (spaces.length > 0 ? spaces[0].id : '');
        if (targetSpace) {
          await createFolder(targetSpace, name.trim(), description.trim());
        }
      } else if (activeTab === 'list') {
        const targetSpace = selectedSpaceId || (spaces.length > 0 ? spaces[0].id : '');
        if (targetSpace) {
          await createList(
            targetSpace,
            selectedFolderId || null,
            name.trim(),
            selectedColor
          );
        }
      }
      setName('');
      setDescription('');
      closeCreateModal();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Create Hierarchy Element</h3>
              <p className="text-[11px] text-slate-400">Expand your workspace structure (Space, Folder, or List)</p>
            </div>
          </div>
          <button
            onClick={closeCreateModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-2 gap-1.5 bg-slate-950/40 border-b border-slate-800/80">
          <button
            type="button"
            onClick={() => setActiveTab('space')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'space'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Space
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('folder')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'folder'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
            }`}
          >
            <Folder className="w-3.5 h-3.5" />
            Folder
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'list'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            List
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Preset Blueprints for Space */}
          {activeTab === 'space' && (
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                1-Click Blueprint (Optional)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {BLUEPRINTS.map((bp) => (
                  <div
                    key={bp.id}
                    onClick={() => {
                      setSelectedBlueprint(bp.id);
                      setName(bp.name);
                      setSelectedColor(bp.color);
                      setDescription(bp.description);
                    }}
                    className={`p-2.5 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                      selectedBlueprint === bp.id
                        ? 'bg-indigo-900/30 border-indigo-500/80 text-white'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: bp.color }} />
                      {selectedBlueprint === bp.id && <Check className="w-3 h-3 text-indigo-400" />}
                    </div>
                    <span className="text-[11px] font-semibold leading-tight line-clamp-2">
                      {bp.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Target Space Selector if Folder or List */}
          {(activeTab === 'folder' || activeTab === 'list') && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Target Space</label>
              <select
                value={selectedSpaceId}
                onChange={(e) => {
                  setSelectedSpaceId(e.target.value);
                  setSelectedFolderId('');
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                {spaces.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Optional Target Folder Selector if List */}
          {activeTab === 'list' && currentSpace && currentSpace.folders.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Target Folder (Optional)</label>
              <select
                value={selectedFolderId}
                onChange={(e) => setSelectedFolderId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="">Folderless (Directly under {currentSpace.name})</option>
                {currentSpace.folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    📁 {f.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              {activeTab === 'space' ? 'Space Name' : activeTab === 'folder' ? 'Folder Name' : 'List Name'}
            </label>
            <input
              type="text"
              required
              placeholder={
                activeTab === 'space'
                  ? 'e.g. Core Engineering'
                  : activeTab === 'folder'
                  ? 'e.g. Sprint 2026.Q3'
                  : 'e.g. Backend API Tasks'
              }
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Color Picker for Space & List */}
          {(activeTab === 'space' || activeTab === 'list') && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Color Tag</label>
              <div className="flex items-center gap-2">
                {COLOR_PALETTES.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`w-6 h-6 rounded-lg transition transform ${
                      selectedColor === color ? 'scale-110 ring-2 ring-white' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Description (Optional)</label>
            <textarea
              rows={2}
              placeholder="What work lives inside this container?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={closeCreateModal}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 shadow-md shadow-indigo-500/20 disabled:opacity-50 transition flex items-center gap-1.5"
            >
              <Rocket className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Creating...' : `Create ${activeTab}`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateHierarchyModal;
