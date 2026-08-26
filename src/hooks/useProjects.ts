import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';

export interface ProjectData {
  id: string;
  title: string;
  description?: string;
  status?: string;
  budget?: number;
  actualCost?: number;
  startDate?: string;
  targetEndDate?: string;
  ownerId?: string;
  accountId?: string;
  milestones?: any[];
  tasks?: any[];
  customFields?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export function useProjects(filters?: { status?: string; search?: string }) {
  return useQuery({
    queryKey: ['projects', filters],
    queryFn: async () => {
      const res = await apiClient.get<ProjectData[]>('/projects', { params: filters });
      return res || [];
    },
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await apiClient.get<ProjectData>(`/projects/${id}`);
      return res;
    },
    enabled: Boolean(id),
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ProjectData>) => apiClient.post<ProjectData>('/projects', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProjectData> }) =>
      apiClient.put<ProjectData>(`/projects/${id}`, data),
    onSuccess: (updatedProject) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', updatedProject?.id] });
    },
  });
}
