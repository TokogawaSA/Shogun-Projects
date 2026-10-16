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
      console.warn('[hierarchyService] REST API unavailable:', err);
      return {
        workspace: { id: '', name: 'Workspace' },
        spaces: [],
        totalTasks: 0,
        totalLists: 0,
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

