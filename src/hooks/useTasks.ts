import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../services/api';
import { Task, TaskStatus } from '../types';

export interface UseTasksResult {
  tasks: Task[];
  loading: boolean;
  error: Error | null;
  fetchTasks: () => Promise<void>;
  createTask: (data: Partial<Task>) => Promise<Task>;
  updateTaskStatus: (taskId: string, status: TaskStatus) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<Task>;
  deleteTask: (taskId: string) => Promise<void>;
  logTime: (
    taskId: string,
    log: {
      hoursLogged: number;
      description?: string;
      date?: string;
      isBillable?: boolean;
      hourlyRate?: number;
    }
  ) => Promise<any>;
}

export const useTasks = (projectId?: string): UseTasksResult => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = projectId ? `/projects/tasks/all?projectId=${projectId}` : '/projects/tasks/all';
      const data = await apiClient.get<Task[]>(url);
      setTasks(data || []);
    } catch (err: any) {
      console.error('[useTasks] Error fetching tasks:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const createTask = async (data: Partial<Task>): Promise<Task> => {
    const tempId = `temp_${Date.now()}`;
    const optimisticTask: Task = {
      id: tempId,
      projectId: data.projectId || projectId || '',
      title: data.title || 'New Task',
      description: data.description || '',
      status: data.status || 'todo',
      priority: data.priority || 'medium',
      assigneeId: data.assigneeId,
      creatorId: data.creatorId || '',
      dueDate: data.dueDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      estimatedHours: data.estimatedHours || 0,
      actualHours: 0,
      optimistic: true,
      ...data,
    } as Task;

    setTasks((prev) => [optimisticTask, ...prev]);

    try {
      const created = await apiClient.post<Task>('/projects/tasks', data);
      setTasks((prev) => prev.map((t) => (t.id === tempId ? created : t)));
      return created;
    } catch (err: any) {
      setTasks((prev) => prev.filter((t) => t.id !== tempId));
      throw err;
    }
  };

  const updateTaskStatus = async (taskId: string, status: TaskStatus): Promise<void> => {
    const previousTasks = [...tasks];
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status, updatedAt: new Date().toISOString() } : t))
    );

    try {
      await apiClient.put(`/projects/tasks/${taskId}`, { status });
    } catch (err: any) {
      setTasks(previousTasks);
      throw err;
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>): Promise<Task> => {
    const previousTasks = [...tasks];
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t))
    );

    try {
      const updated = await apiClient.put<Task>(`/projects/tasks/${taskId}`, updates);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      return updated;
    } catch (err: any) {
      setTasks(previousTasks);
      throw err;
    }
  };

  const deleteTask = async (taskId: string): Promise<void> => {
    const previousTasks = [...tasks];
    setTasks((prev) => prev.filter((t) => t.id !== taskId));

    try {
      await apiClient.delete(`/projects/tasks/${taskId}`);
    } catch (err: any) {
      setTasks(previousTasks);
      throw err;
    }
  };

  const logTime = async (
    taskId: string,
    log: {
      hoursLogged: number;
      description?: string;
      date?: string;
      isBillable?: boolean;
      hourlyRate?: number;
    }
  ): Promise<any> => {
    const targetProject = projectId || tasks.find((t) => t.id === taskId)?.projectId;
    if (!targetProject) {
      throw new Error('Project ID required to log time against task.');
    }

    const res = await apiClient.post(`/projects/${targetProject}/tasks/${taskId}/time-logs`, log);
    // Refresh tasks to get rolled up actualHours
    await fetchTasks();
    return res;
  };

  return {
    tasks,
    loading,
    error,
    fetchTasks,
    createTask,
    updateTaskStatus,
    updateTask,
    deleteTask,
    logTime,
  };
};

export default useTasks;
