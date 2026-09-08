import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/api';

export interface Account360Summary {
  accountId: string;
  accountName: string;
  industry: string;
  rating: string;
  status: string;
  totalDealsCount: number;
  totalDealValue: number;
  activeProjectsCount: number;
  completedTasksCount: number;
  openTasksCount: number;
  contactsCount: number;
  deals: Array<{ id: string; dealName: string; amount: number; stage: string }>;
  projects: Array<{ id: string; title: string }>;
  executiveSummary: string;
}

export function useAccount360(accountId: string) {
  return useQuery({
    queryKey: ['account360', accountId],
    queryFn: async () => {
      if (!accountId) return null;
      const res = await apiClient.post<Account360Summary>('/mcp/summarize-account', {
        accountId,
      });
      return res;
    },
    enabled: Boolean(accountId),
  });
}

export default useAccount360;
