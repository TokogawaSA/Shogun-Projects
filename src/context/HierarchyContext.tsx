import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Space, Folder, TaskList, HierarchyScope, HierarchyBreadcrumbItem } from '../types';
import { hierarchyService } from '../services/hierarchyService';
import { useAuth } from './AuthContext';
import { useProject } from './ProjectContext';

interface HierarchyContextType {
  spaces: Space[];
  loading: boolean;
  activeScope: HierarchyScope;
  activeSpace: Space | null;
  activeFolder: Folder | null;
  activeList: TaskList | null;
  breadcrumbs: HierarchyBreadcrumbItem[];
  setActiveScope: (scope: HierarchyScope) => void;
  selectSpace: (spaceId: string) => void;
  selectFolder: (spaceId: string, folderId: string) => void;
  selectList: (spaceId: string, listId: string, folderId?: string | null) => void;
  selectEverything: () => void;
  refreshHierarchy: () => Promise<void>;
  createSpace: (name: string, description?: string, avatarColor?: string) => Promise<Space | null>;
  createFolder: (spaceId: string, name: string, description?: string) => Promise<Folder | null>;
  createList: (
    spaceId: string,
    folderId: string | null | undefined,
    name: string,
    colorHex?: string
  ) => Promise<TaskList | null>;
  isCreateModalOpen: boolean;
  createModalTarget: { type: 'space' | 'folder' | 'list'; parentId?: string } | null;
  openCreateModal: (type: 'space' | 'folder' | 'list', parentId?: string) => void;
  closeCreateModal: () => void;
}

const HierarchyContext = createContext<HierarchyContextType | undefined>(undefined);

export const HierarchyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { currentProjectId, setCurrentProjectId } = useProject();

  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeScope, setActiveScopeState] = useState<HierarchyScope>({
    level: 'workspace',
    title: 'Everything',
    colorHex: '#6366f1',
  });

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalTarget, setCreateModalTarget] = useState<{
    type: 'space' | 'folder' | 'list';
    parentId?: string;
  } | null>(null);

  const refreshHierarchy = async () => {
    setLoading(true);
    try {
      const data = await hierarchyService.getHierarchyTree();
      setSpaces(data.spaces);

      // Synchronize with active project if set
      if (currentProjectId && data.spaces.some((s) => s.id === currentProjectId)) {
        const found = data.spaces.find((s) => s.id === currentProjectId)!;
        setActiveScopeState({
          level: 'space',
          spaceId: found.id,
          title: found.name,
          colorHex: found.avatarColor,
        });
      } else if (data.spaces.length > 0 && activeScope.level === 'workspace') {
        // Keep everything view or default to first space
      }
    } catch (err) {
      console.warn('[HierarchyContext] Error loading hierarchy tree:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshHierarchy();
  }, [user]);

  // Derived Active entities
  const activeSpace = spaces.find((s) => s.id === activeScope.spaceId) || null;

  const activeFolder =
    activeSpace && activeScope.folderId
      ? activeSpace.folders.find((f) => f.id === activeScope.folderId) || null
      : null;

  const activeList = React.useMemo(() => {
    if (!activeSpace || !activeScope.listId) return null;
    if (activeFolder) {
      return activeFolder.lists.find((l) => l.id === activeScope.listId) || null;
    }
    return activeSpace.lists.find((l) => l.id === activeScope.listId) || null;
  }, [activeSpace, activeFolder, activeScope.listId]);

  // Derived Breadcrumbs
  const breadcrumbs = React.useMemo<HierarchyBreadcrumbItem[]>(() => {
    const items: HierarchyBreadcrumbItem[] = [
      { id: 'ws-root', level: 'workspace', name: 'Workspace', colorHex: '#6366f1' },
    ];

    if (activeScope.level === 'workspace') {
      items.push({ id: 'everything', level: 'workspace', name: 'Everything', colorHex: '#a855f7' });
      return items;
    }

    if (activeSpace) {
      items.push({
        id: activeSpace.id,
        level: 'space',
        name: activeSpace.name,
        colorHex: activeSpace.avatarColor,
      });
    }

    if (activeFolder) {
      items.push({
        id: activeFolder.id,
        level: 'folder',
        name: activeFolder.name,
        colorHex: activeFolder.colorHex || '#8b5cf6',
      });
    }

    if (activeList) {
      items.push({
        id: activeList.id,
        level: 'list',
        name: activeList.name,
        colorHex: activeList.colorHex || '#3b82f6',
      });
    }

    return items;
  }, [activeScope, activeSpace, activeFolder, activeList]);

  // Navigation handlers
  const selectSpace = (spaceId: string) => {
    const space = spaces.find((s) => s.id === spaceId);
    if (!space) return;
    setCurrentProjectId(spaceId);
    setActiveScopeState({
      level: 'space',
      spaceId: space.id,
      title: space.name,
      colorHex: space.avatarColor,
    });
  };

  const selectFolder = (spaceId: string, folderId: string) => {
    const space = spaces.find((s) => s.id === spaceId);
    const folder = space?.folders.find((f) => f.id === folderId);
    if (!space || !folder) return;
    setCurrentProjectId(spaceId);
    setActiveScopeState({
      level: 'folder',
      spaceId: space.id,
      folderId: folder.id,
      title: folder.name,
      colorHex: folder.colorHex || space.avatarColor,
    });
  };

  const selectList = (spaceId: string, listId: string, folderId?: string | null) => {
    const space = spaces.find((s) => s.id === spaceId);
    if (!space) return;
    setCurrentProjectId(spaceId);
    setActiveScopeState({
      level: 'list',
      spaceId: space.id,
      folderId: folderId || undefined,
      listId,
      title: space.name,
      colorHex: space.avatarColor,
    });
  };

  const selectEverything = () => {
    setActiveScopeState({
      level: 'workspace',
      title: 'Everything',
      colorHex: '#6366f1',
    });
  };

  // Creation handlers
  const createSpace = async (name: string, description?: string, avatarColor?: string) => {
    try {
      const created = await hierarchyService.createSpace({ name, description, avatarColor });
      setSpaces((prev) => [created, ...prev]);
      selectSpace(created.id);
      return created;
    } catch (err) {
      console.error('Failed to create space:', err);
      return null;
    }
  };

  const createFolder = async (spaceId: string, name: string, description?: string) => {
    try {
      const created = await hierarchyService.createFolder({ spaceId, name, description });
      setSpaces((prev) =>
        prev.map((s) => {
          if (s.id === spaceId) {
            return {
              ...s,
              folders: [...s.folders, created],
            };
          }
          return s;
        })
      );
      selectFolder(spaceId, created.id);
      return created;
    } catch (err) {
      console.error('Failed to create folder:', err);
      return null;
    }
  };

  const createList = async (
    spaceId: string,
    folderId: string | null | undefined,
    name: string,
    colorHex?: string
  ) => {
    try {
      const created = await hierarchyService.createList({ spaceId, folderId, name, colorHex });
      setSpaces((prev) =>
        prev.map((s) => {
          if (s.id === spaceId) {
            if (folderId) {
              return {
                ...s,
                folders: s.folders.map((f) =>
                  f.id === folderId ? { ...f, lists: [...f.lists, created] } : f
                ),
              };
            } else {
              return {
                ...s,
                lists: [...s.lists, created],
              };
            }
          }
          return s;
        })
      );
      selectList(spaceId, created.id, folderId);
      return created;
    } catch (err) {
      console.error('Failed to create list:', err);
      return null;
    }
  };

  const openCreateModal = (type: 'space' | 'folder' | 'list', parentId?: string) => {
    setCreateModalTarget({ type, parentId });
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setCreateModalTarget(null);
  };

  return (
    <HierarchyContext.Provider
      value={{
        spaces,
        loading,
        activeScope,
        activeSpace,
        activeFolder,
        activeList,
        breadcrumbs,
        setActiveScope: setActiveScopeState,
        selectSpace,
        selectFolder,
        selectList,
        selectEverything,
        refreshHierarchy,
        createSpace,
        createFolder,
        createList,
        isCreateModalOpen,
        createModalTarget,
        openCreateModal,
        closeCreateModal,
      }}
    >
      {children}
    </HierarchyContext.Provider>
  );
};

export const useHierarchy = (): HierarchyContextType => {
  const context = useContext(HierarchyContext);
  if (!context) {
    throw new Error('useHierarchy must be used within a HierarchyProvider');
  }
  return context;
};

export default HierarchyContext;
