import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';

export interface DealData {
  id: string;
  dealName: string;
  amount: number;
  currency?: string;
  stage: string;
  probability?: number;
  expectedCloseDate?: string;
  accountId?: string;
  contactId?: string;
  ownerId?: string;
  linkedProjectId?: string;
  customFields?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export function useDeals(stage?: string) {
  return useQuery({
    queryKey: ['deals', stage],
    queryFn: async () => {
      const res = await apiClient.get<DealData[]>('/crm/deals', {
        params: stage ? { stage } : undefined,
      });
      return res || [];
    },
  });
}

export function useDeal(id: string) {
  return useQuery({
    queryKey: ['deal', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await apiClient.get<DealData>(`/crm/deals/${id}`);
      return res;
    },
    enabled: Boolean(id),
  });
}

export function useUpdateDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<DealData> }) =>
      apiClient.put<DealData>(`/crm/deals/${id}`, data),
    onSuccess: (updatedDeal) => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['deal', updatedDeal?.id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}
