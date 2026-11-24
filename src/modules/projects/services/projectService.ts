import { apiClient } from '../../../services/api';
import { Task, Milestone, TaskStatusColumn, DEFAULT_COLUMNS, ProjectWorkspaceMeta } from '../types';

export const projectService = {
  // --- Projects ---
  async getProject(projectId: string): Promise<ProjectWorkspaceMeta> {
    try {
      const data = await apiClient.get<any>(`/projects/${projectId}`);
      return {
        id: data.id,
        title: data.title || 'Untitled Project',
        description: data.description || '',
        ownerId: data.ownerId,
        owner: data.owner,
        members: data.members || [],
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
    } catch (err) {
      console.warn('API error fetching project, falling back to local storage:', err);
      return {
        id: projectId,
        title: 'Project Workspace',
        description: '',
      };
    }
  },

  async updateProject(projectId: string, payload: Partial<ProjectWorkspaceMeta>): Promise<void> {
    try {
      await apiClient.put(`/projects/${projectId}`, payload);
    } catch (err) {
      console.warn('Failed to update project via API:', err);
    }
  },

  // --- Tasks ---
  async getTasks(projectId: string): Promise<Task[]> {
    try {
      const data = await apiClient.get<any[]>(`/projects/tasks/all?projectId=${encodeURIComponent(projectId)}`);
      if (Array.isArray(data)) {
        return data.map((t) => {
          const cf = (typeof t.customFields === 'object' && t.customFields !== null) ? t.customFields : {};
          return {
            id: t.id,
            projectId: t.projectId || projectId,
            title: t.title,
            description: t.description || '',
            status: t.status || 'todo',
            priority: t.priority || 'medium',
            issueType: cf.issueType || (['task', 'bug', 'feature', 'improvement', 'epic'].includes(t.category) ? t.category : 'task'),
            progress: t.progress || 0,
            dueDate: t.dueDate ? String(t.dueDate).split('T')[0] : undefined,
            startDate: cf.startDate || undefined,
            assigneeId: t.assigneeId,
            assignee: t.assignee,
            creatorId: t.creatorId,
            creator: t.creator,
            estimatedHours: Number(t.estimatedHours) || 0,
            actualHours: Number(t.actualHours) || 0,
            parentTaskId: t.parentTaskId || undefined,
            milestoneId: t.milestoneId,
            predecessorTaskIds: Array.isArray(t.predecessorTaskIds) ? t.predecessorTaskIds : [],
            subtasks: Array.isArray(t.subtasks)
              ? t.subtasks.map((st: any) => ({
                  id: st.id,
                  taskId: st.taskId,
                  title: st.title,
                  completed: !!st.completed,
                }))
              : [],
            comments: Array.isArray(cf.comments) ? cf.comments : [],
            attachments: Array.isArray(t.attachments) ? t.attachments : [],
            tags: Array.isArray(cf.tags) ? cf.tags : [],
            customFields: cf,
            createdAt: t.createdAt,
            updatedAt: t.updatedAt,
          };
        });
      }
      return [];
    } catch (err) {
      console.warn('API error fetching tasks, checking local storage cache:', err);
      const cached = localStorage.getItem(`shogun_pm_tasks_${projectId}`);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (e) {
          console.warn('Error reading cached tasks:', e);
        }
      }
      return [];
    }
  },

  async createTask(task: Partial<Task>): Promise<Task> {
    const customFields = {
      ...(task.customFields || {}),
      issueType: task.issueType || 'task',
      startDate: task.startDate,
      comments: task.comments || [],
      tags: task.tags || [],
    };

    const payload = {
      projectId: task.projectId,
      title: task.title,
      description: task.description || '',
      status: task.status || 'todo',
      priority: task.priority || 'medium',
      category: task.issueType || 'task',
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString() : null,
      assigneeId: task.assigneeId || null,
      milestoneId: task.milestoneId || null,
      parentTaskId: task.parentTaskId || null,
      estimatedHours: Number(task.estimatedHours) || 0,
      customFields,
      attachments: task.attachments || [],
    };

    try {
      const created = await apiClient.post<any>('/projects/tasks', payload);
      const cf = (typeof created.customFields === 'object' && created.customFields !== null) ? created.customFields : customFields;

      return {
        id: created.id,
        projectId: created.projectId || task.projectId!,
        title: created.title,
        description: created.description || '',
        status: created.status || 'todo',
        priority: created.priority || 'medium',
        issueType: cf.issueType || task.issueType || 'task',
        progress: created.progress || 0,
        dueDate: created.dueDate ? String(created.dueDate).split('T')[0] : undefined,
        startDate: cf.startDate || task.startDate,
        assigneeId: created.assigneeId,
        assignee: created.assignee || task.assignee,
        creatorId: created.creatorId,
        creator: created.creator,
        estimatedHours: Number(created.estimatedHours) || Number(task.estimatedHours) || 0,
        actualHours: Number(created.actualHours) || 0,
        parentTaskId: created.parentTaskId || task.parentTaskId,
        milestoneId: created.milestoneId,
        subtasks: [],
        comments: Array.isArray(cf.comments) ? cf.comments : [],
        attachments: Array.isArray(created.attachments) ? created.attachments : (task.attachments || []),
        tags: Array.isArray(cf.tags) ? cf.tags : (task.tags || []),
        customFields: cf,
        createdAt: created.createdAt || new Date().toISOString(),
        updatedAt: created.updatedAt || new Date().toISOString(),
      };
    } catch (err) {
      console.warn('API error creating task, falling back to client-generated item:', err);
      const fallback: Task = {
        id: `task-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
        projectId: task.projectId!,
        title: task.title || 'New Task',
        description: task.description || '',
        status: task.status || 'todo',
        priority: task.priority || 'medium',
        issueType: task.issueType || 'task',
        dueDate: task.dueDate,
        startDate: task.startDate,
        assigneeId: task.assigneeId,
        assignee: task.assignee,
        estimatedHours: Number(task.estimatedHours) || 0,
        actualHours: 0,
        parentTaskId: task.parentTaskId,
        milestoneId: task.milestoneId,
        subtasks: [],
        comments: task.comments || [],
        attachments: task.attachments || [],
        tags: task.tags || [],
        customFields,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return fallback;
    }
  },

  async updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
    const customFields = {
      ...(updates.customFields || {}),
      ...(updates.issueType !== undefined ? { issueType: updates.issueType } : {}),
      ...(updates.startDate !== undefined ? { startDate: updates.startDate } : {}),
      ...(updates.comments !== undefined ? { comments: updates.comments } : {}),
      ...(updates.tags !== undefined ? { tags: updates.tags } : {}),
    };

    const payload: any = { 
      ...updates,
      customFields,
      category: updates.issueType || (updates as any).category,
    };

    if (updates.dueDate) {
      payload.dueDate = new Date(updates.dueDate).toISOString();
    }

    try {
      const res = await apiClient.put<any>(`/projects/tasks/${taskId}`, payload);
      const cf = (typeof res.customFields === 'object' && res.customFields !== null) ? res.customFields : customFields;

      return {
        id: res.id || taskId,
        projectId: res.projectId || updates.projectId || '',
        title: res.title || updates.title || '',
        description: res.description ?? updates.description ?? '',
        status: res.status || updates.status || 'todo',
        priority: res.priority || updates.priority || 'medium',
        issueType: cf.issueType || updates.issueType || 'task',
        progress: res.progress ?? updates.progress ?? 0,
        dueDate: res.dueDate ? String(res.dueDate).split('T')[0] : updates.dueDate,
        startDate: cf.startDate || updates.startDate,
        assigneeId: res.assigneeId ?? updates.assigneeId,
        assignee: res.assignee ?? updates.assignee,
        creatorId: res.creatorId ?? updates.creatorId,
        creator: res.creator ?? updates.creator,
        estimatedHours: Number(res.estimatedHours ?? updates.estimatedHours) || 0,
        actualHours: Number(res.actualHours ?? updates.actualHours) || 0,
        parentTaskId: res.parentTaskId ?? updates.parentTaskId,
        milestoneId: res.milestoneId ?? updates.milestoneId,
        subtasks: updates.subtasks || res.subtasks || [],
        comments: Array.isArray(cf.comments) ? cf.comments : (updates.comments || []),
        attachments: Array.isArray(res.attachments) ? res.attachments : (updates.attachments || []),
        tags: Array.isArray(cf.tags) ? cf.tags : (updates.tags || []),
        customFields: cf,
        updatedAt: new Date().toISOString(),
      };
    } catch (err) {
      console.warn('API error updating task, applying updates locally:', err);
      return {
        id: taskId,
        projectId: updates.projectId || '',
        title: updates.title || '',
        description: updates.description || '',
        status: updates.status || 'todo',
        priority: updates.priority || 'medium',
        issueType: updates.issueType || 'task',
        progress: updates.progress || 0,
        dueDate: updates.dueDate,
        startDate: updates.startDate,
        assigneeId: updates.assigneeId,
        assignee: updates.assignee,
        creatorId: updates.creatorId,
        creator: updates.creator,
        estimatedHours: updates.estimatedHours || 0,
        actualHours: updates.actualHours || 0,
        parentTaskId: updates.parentTaskId,
        milestoneId: updates.milestoneId,
        subtasks: updates.subtasks || [],
        comments: updates.comments || [],
        attachments: updates.attachments || [],
        tags: updates.tags || [],
        customFields,
        updatedAt: new Date().toISOString(),
      };
    }
  },

  async deleteTask(taskId: string): Promise<void> {
    try {
      await apiClient.delete(`/projects/tasks/${taskId}`);
    } catch (err) {
      console.warn('API error deleting task:', err);
    }
  },

  // --- Milestones ---
  async getMilestones(projectId: string): Promise<Milestone[]> {
    try {
      const data = await apiClient.get<any[]>(`/projects/${projectId}/milestones`);
      if (Array.isArray(data)) {
        return data.map((m) => ({
          id: m.id,
          projectId: m.projectId || projectId,
          title: m.title,
          description: m.description || '',
          dueDate: m.dueDate ? String(m.dueDate).split('T')[0] : undefined,
          status: m.status || 'pending',
          completionPercentage: m.completionPercentage || 0,
          tasksCount: Array.isArray(m.tasks) ? m.tasks.length : 0,
          completedTasksCount: Array.isArray(m.tasks)
            ? m.tasks.filter((t: any) => t.status === 'done').length
            : 0,
          createdAt: m.createdAt,
          updatedAt: m.updatedAt,
        }));
      }
      return [];
    } catch (err) {
      console.warn('API error fetching milestones, checking local cache:', err);
      const cached = localStorage.getItem(`shogun_pm_milestones_${projectId}`);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (e) {
          console.warn('Error reading cached milestones:', e);
        }
      }
      return [];
    }
  },

  async createMilestone(projectId: string, milestone: Partial<Milestone>): Promise<Milestone> {
    const payload = {
      title: milestone.title,
      description: milestone.description || '',
      dueDate: milestone.dueDate ? new Date(milestone.dueDate).toISOString() : null,
      status: milestone.status || 'pending',
      completionPercentage: milestone.completionPercentage || 0,
    };

    try {
      const created = await apiClient.post<any>(`/projects/${projectId}/milestones`, payload);
      return {
        id: created.id,
        projectId,
        title: created.title,
        description: created.description || '',
        dueDate: created.dueDate ? String(created.dueDate).split('T')[0] : undefined,
        status: created.status || 'pending',
        completionPercentage: created.completionPercentage || 0,
        tasksCount: 0,
        completedTasksCount: 0,
        createdAt: created.createdAt || new Date().toISOString(),
        updatedAt: created.updatedAt || new Date().toISOString(),
      };
    } catch (err) {
      console.warn('API error creating milestone, using client fallback:', err);
      const fallback: Milestone = {
        id: `ms-${Date.now().toString(36)}`,
        projectId,
        title: milestone.title || 'New Milestone',
        description: milestone.description || '',
        dueDate: milestone.dueDate,
        status: milestone.status || 'pending',
        completionPercentage: 0,
        tasksCount: 0,
        completedTasksCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return fallback;
    }
  },

  async updateMilestone(milestoneId: string, updates: Partial<Milestone>): Promise<void> {
    const payload: any = { ...updates };
    if (updates.dueDate) {
      payload.dueDate = new Date(updates.dueDate).toISOString();
    }
    try {
      await apiClient.put(`/projects/milestones/${milestoneId}`, payload);
    } catch (err) {
      console.warn('API error updating milestone:', err);
    }
  },

  async deleteMilestone(milestoneId: string): Promise<void> {
    try {
      await apiClient.delete(`/projects/milestones/${milestoneId}`);
    } catch (err) {
      console.warn('API error deleting milestone:', err);
    }
  },

  // --- Customizable Status Columns ---
  getProjectColumns(projectId: string): TaskStatusColumn[] {
    const key = `shogun_pm_columns_${projectId}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.warn('Error reading custom project columns:', e);
      }
    }
    return DEFAULT_COLUMNS;
  },

  saveProjectColumns(projectId: string, columns: TaskStatusColumn[]): void {
    const key = `shogun_pm_columns_${projectId}`;
    try {
      localStorage.setItem(key, JSON.stringify(columns));
    } catch (e) {
      console.warn('Error saving custom project columns:', e);
    }
  },
};
