import { apiClient } from './api';
import { Space, Folder, TaskList, HierarchyTreeResponse } from '../types';

export const hierarchyService = {
  /**
   * Fetch full organizational hierarchy tree (Spaces -> Folders -> Lists)
   */
  async getHierarchyTree(): Promise<HierarchyTreeResponse> {
    try {
      const data = await apiClient.get<HierarchyTreeResponse>('/hierarchy/tree');
      if (data && Array.isArray(data.spaces)) {
        return data;
      }
      throw new Error('Malformed hierarchy tree response');
    } catch (err) {
      console.warn('[hierarchyService] REST API unavailable, synthesizing default hierarchy:', err);
      // Fallback default state
      return {
        workspace: { id: 'ws-default', name: 'Shogun Workspace' },
        spaces: [
          {
            id: 'proj-shogun-1',
            workspaceId: 'ws-default',
            name: 'Core Engineering',
            description: 'Antigravity 2.0 platform development & sub-agent orchestration',
            avatarColor: '#6366f1',
            icon: 'folder-kanban',
            features: {
              timeTracking: true,
              timeEstimates: true,
              customFields: true,
              priorities: true,
              sprints: true,
              dependencies: true,
              subtasksInMultipleLists: false,
            },
            statuses: [
              { id: 'st-1', name: 'To Do', type: 'open', colorHex: '#64748b', sortOrder: 0 },
              { id: 'st-2', name: 'In Progress', type: 'active', colorHex: '#3b82f6', sortOrder: 1 },
              { id: 'st-3', name: 'Review', type: 'active', colorHex: '#8b5cf6', sortOrder: 2 },
              { id: 'st-4', name: 'Done', type: 'done', colorHex: '#10b981', sortOrder: 3 },
            ],
            folders: [
              {
                id: 'fl-sprint-1',
                spaceId: 'proj-shogun-1',
                name: 'Sprint Q3 - Core API',
                isArchived: false,
                colorHex: '#8b5cf6',
                lists: [
                  {
                    id: 'ls-auth',
                    spaceId: 'proj-shogun-1',
                    folderId: 'fl-sprint-1',
                    name: 'Auth & Multi-Tenancy',
                    colorHex: '#8b5cf6',
                    taskCount: 4,
                    completedTaskCount: 2,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  },
                ],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ],
            lists: [
              {
                id: 'list-gen-proj-shogun-1',
                spaceId: 'proj-shogun-1',
                folderId: null,
                name: 'General Backlog',
                colorHex: '#6366f1',
                taskCount: 8,
                completedTaskCount: 3,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        totalTasks: 12,
        totalLists: 2,
      };
    }
  },

  /**
   * Create a new Space
   */
  async createSpace(payload: {
    name: string;
    description?: string;
    avatarColor?: string;
    features?: any;
  }): Promise<Space> {
    return await apiClient.post<Space>('/hierarchy/spaces', payload);
  },

  /**
   * Create a new Folder under a Space
   */
  async createFolder(payload: {
    spaceId: string;
    name: string;
    description?: string;
    dueDate?: string;
  }): Promise<Folder> {
    return await apiClient.post<Folder>('/hierarchy/folders', payload);
  },

  /**
   * Create a new List under a Space or Folder
   */
  async createList(payload: {
    spaceId: string;
    folderId?: string | null;
    name: string;
    colorHex?: string;
  }): Promise<TaskList> {
    return await apiClient.post<TaskList>('/hierarchy/lists', payload);
  },

  /**
   * Nest a task under a parent task (updates materialized treePath)
   */
  async nestTask(payload: {
    taskId: string;
    parentTaskId: string | null;
  }): Promise<any> {
    return await apiClient.post('/hierarchy/tasks/nest', payload);
  },
};

