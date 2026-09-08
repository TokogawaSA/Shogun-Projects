/**
 * ClickUp-Style Structural Hierarchy Domain Contracts
 * Workspace -> Space -> Folder -> List -> Task -> Subtask (Recursive N-Depth)
 */

export interface SpaceStatusConfig {
  id: string;
  name: string;
  type: 'open' | 'active' | 'done' | 'closed';
  colorHex: string;
  sortOrder: number;
}

export interface SpaceClickApps {
  timeTracking: boolean;
  timeEstimates: boolean;
  customFields: boolean;
  priorities: boolean;
  sprints: boolean;
  dependencies: boolean;
  subtasksInMultipleLists: boolean;
}

export interface Space {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  avatarColor: string;
  icon?: string;
  features: SpaceClickApps;
  statuses: SpaceStatusConfig[];
  folders: Folder[];
  lists: TaskList[]; // Folderless lists directly under Space
  isArchived?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Folder {
  id: string;
  spaceId: string;
  name: string;
  colorHex?: string;
  isArchived: boolean;
  lists: TaskList[];
  createdAt: string;
  updatedAt: string;
}

export interface TaskList {
  id: string;
  spaceId: string;
  folderId?: string | null;
  name: string;
  colorHex?: string;
  isArchived?: boolean;
  taskCount?: number;
  completedTaskCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface HierarchyScope {
  level: 'workspace' | 'space' | 'folder' | 'list';
  workspaceId?: string;
  spaceId?: string;
  folderId?: string;
  listId?: string;
  title: string;
  colorHex?: string;
}

export interface HierarchyBreadcrumbItem {
  id: string;
  level: 'workspace' | 'space' | 'folder' | 'list' | 'task';
  name: string;
  icon?: string;
  colorHex?: string;
}

export interface HierarchyTreeResponse {
  workspace: {
    id: string;
    name: string;
  };
  spaces: Space[];
  totalTasks: number;
  totalLists: number;
}
