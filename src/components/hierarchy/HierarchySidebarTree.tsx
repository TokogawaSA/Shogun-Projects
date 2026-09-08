import React, { useState } from 'react';
import {
  Layers,
  Folder,
  FolderOpen,
  ListFilter,
  Plus,
  ChevronRight,
  ChevronDown,
  Sparkles,
  FolderPlus,
  Compass,
} from 'lucide-react';
import clsx from 'clsx';
import { useHierarchy } from '../../context/HierarchyContext';

export const HierarchySidebarTree: React.FC = () => {
  const {
    spaces,
    loading,
    activeScope,
    selectEverything,
    selectSpace,
    selectFolder,
    selectList,
    openCreateModal,
  } = useHierarchy();

  // Track expanded spaces & folders
  const [expandedSpaces, setExpandedSpaces] = useState<Record<string, boolean>>({});
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  const toggleSpace = (spaceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedSpaces((prev) => ({ ...prev, [spaceId]: !prev[spaceId] }));
  };

  const toggleFolder = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolders((prev) => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  if (loading && spaces.length === 0) {
    return (
      <div className="w-64 border-r border-slate-800 bg-slate-950/90 p-4 space-y-3 animate-pulse">
        <div className="h-6 bg-slate-800 rounded w-3/4"></div>
        <div className="h-4 bg-slate-800/60 rounded w-1/2"></div>
        <div className="h-4 bg-slate-800/40 rounded w-5/6"></div>
      </div>
    );
  }

  return (
    <aside className="w-72 flex-shrink-0 flex flex-col bg-slate-950/80 border-r border-slate-800/80 backdrop-blur-xl h-full select-none text-xs">
      {/* Header & Quick Creation */}
      <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Compass className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
            Hierarchy Engine
          </span>
        </div>

        <button
          onClick={() => openCreateModal('space')}
          className="p-1 rounded-md bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white transition flex items-center gap-1 px-2 py-0.5 border border-indigo-500/30 font-medium"
          title="Create new Space"
        >
          <Plus className="w-3 h-3" />
          <span>Space</span>
        </button>
      </div>

      {/* Tree Content */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        {/* Everything View (Workspace Scope) */}
        <button
          onClick={selectEverything}
          className={clsx(
            'w-full flex items-center justify-between px-2.5 py-2 rounded-xl transition font-medium group',
            activeScope.level === 'workspace'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
              : 'text-slate-300 hover:bg-slate-900/80 hover:text-white'
          )}
        >
          <div className="flex items-center gap-2">
            <Layers className={clsx('w-4 h-4', activeScope.level === 'workspace' ? 'text-white' : 'text-indigo-400')} />
            <span className="text-xs font-semibold">Everything</span>
          </div>
          <span
            className={clsx(
              'px-1.5 py-0.5 rounded-full text-[10px] font-mono',
              activeScope.level === 'workspace'
                ? 'bg-white/20 text-white'
                : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'
            )}
          >
            All Spaces
          </span>
        </button>

        <div className="pt-2 pb-1 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Spaces & Sprints
        </div>

        {/* Spaces List */}
        {spaces.map((space) => {
          const isSpaceActive = activeScope.level === 'space' && activeScope.spaceId === space.id;
          const isExpanded = expandedSpaces[space.id] ?? true;

          return (
            <div key={space.id} className="space-y-0.5">
              {/* Space Item */}
              <div
                onClick={() => selectSpace(space.id)}
                className={clsx(
                  'group flex items-center justify-between px-2 py-1.5 rounded-xl cursor-pointer transition',
                  isSpaceActive
                    ? 'bg-slate-800/90 text-white border border-slate-700'
                    : 'text-slate-300 hover:bg-slate-900/60 hover:text-white'
                )}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <button
                    onClick={(e) => toggleSpace(space.id, e)}
                    className="p-0.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <div
                    className="w-3.5 h-3.5 rounded-md flex-shrink-0"
                    style={{ backgroundColor: space.avatarColor || '#6366f1' }}
                  />

                  <span className="truncate font-semibold text-xs">{space.name}</span>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openCreateModal('folder', space.id);
                    }}
                    title="Add Folder"
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                  >
                    <FolderPlus className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openCreateModal('list', space.id);
                    }}
                    title="Add List"
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Space Children (Folders & Folderless Lists) */}
              {isExpanded && (
                <div className="pl-4 space-y-0.5 border-l border-slate-800/60 ml-3 mt-0.5">
                  {/* Folders */}
                  {space.folders.map((folder) => {
                    const isFolderActive =
                      activeScope.level === 'folder' && activeScope.folderId === folder.id;
                    const isFolderExpanded = expandedFolders[folder.id] ?? true;

                    return (
                      <div key={folder.id} className="space-y-0.5">
                        <div
                          onClick={() => selectFolder(space.id, folder.id)}
                          className={clsx(
                            'group flex items-center justify-between px-2 py-1 rounded-lg cursor-pointer transition',
                            isFolderActive
                              ? 'bg-purple-900/30 text-purple-200 border border-purple-800/50'
                              : 'text-slate-400 hover:bg-slate-900/50 hover:text-slate-200'
                          )}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <button
                              onClick={(e) => toggleFolder(folder.id, e)}
                              className="p-0.5 rounded text-slate-400 hover:text-slate-200"
                            >
                              {isFolderExpanded ? (
                                <ChevronDown className="w-3 h-3" />
                              ) : (
                                <ChevronRight className="w-3 h-3" />
                              )}
                            </button>

                            {isFolderExpanded ? (
                              <FolderOpen className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                            ) : (
                              <Folder className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                            )}

                            <span className="truncate font-medium">{folder.name}</span>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openCreateModal('list', folder.id);
                            }}
                            title="Add List to Folder"
                            className="p-0.5 opacity-0 group-hover:opacity-100 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Folder's Lists */}
                        {isFolderExpanded && (
                          <div className="pl-4 space-y-0.5 border-l border-purple-900/30 ml-3">
                            {folder.lists.map((list) => {
                              const isListActive =
                                activeScope.level === 'list' && activeScope.listId === list.id;

                              return (
                                <div
                                  key={list.id}
                                  onClick={() => selectList(space.id, list.id, folder.id)}
                                  className={clsx(
                                    'flex items-center justify-between px-2 py-1 rounded-lg cursor-pointer transition',
                                    isListActive
                                      ? 'bg-indigo-600/30 text-indigo-300 font-semibold border border-indigo-500/40'
                                      : 'text-slate-400 hover:bg-slate-900/50 hover:text-slate-200'
                                  )}
                                >
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <ListFilter className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                    <span className="truncate">{list.name}</span>
                                  </div>

                                  {list.taskCount !== undefined && (
                                    <span className="text-[10px] font-mono text-slate-400">
                                      {list.taskCount}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Folderless Lists */}
                  {space.lists.map((list) => {
                    const isListActive =
                      activeScope.level === 'list' && activeScope.listId === list.id;

                    return (
                      <div
                        key={list.id}
                        onClick={() => selectList(space.id, list.id, null)}
                        className={clsx(
                          'flex items-center justify-between px-2 py-1 rounded-lg cursor-pointer transition',
                          isListActive
                            ? 'bg-indigo-600/30 text-indigo-300 font-semibold border border-indigo-500/40'
                            : 'text-slate-400 hover:bg-slate-900/50 hover:text-slate-200'
                        )}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <ListFilter className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                          <span className="truncate">{list.name}</span>
                        </div>

                        {list.taskCount !== undefined && (
                          <span className="text-[10px] font-mono text-slate-400">
                            {list.taskCount}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-900/40 flex items-center justify-between text-[11px] text-slate-400">
        <span>ClickUp Hierarchy v2</span>
        <span className="flex items-center gap-1 text-indigo-400">
          <Sparkles className="w-3 h-3" />
          Adaptive
        </span>
      </div>
    </aside>
  );
};
