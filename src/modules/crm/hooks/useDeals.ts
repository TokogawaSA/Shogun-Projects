import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiClient } from '../../../services/api';
import { Deal, PipelineStage } from '../../../types/crm';
import { Project, Task } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { useProject } from '../../../context/ProjectContext';

const fallbackDeals: Deal[] = [
  {
    id: 'del-301',
    tenantId: 'tenant-default',
    title: 'Enterprise Multi-Agent Pipeline Integration',
    accountId: 'acc-hyperion-tech',
    primaryContactId: 'cnt-101',
    pipelineStage: 'negotiation',
    value: 145000,
    currency: 'USD',
    winProbability: 75,
    expectedCloseDate: 'Sep 15, 2026',
    linkedProjectId: null,
    assignedRepId: 'usr-admin-master',
    createdAt: new Date(Date.now() - 3600000 * 24 * 14).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
  },
  {
    id: 'del-302',
    tenantId: 'tenant-default',
    title: 'WooCommerce High-Scale Payment Synchronizer',
    accountId: 'acc-shogun-root',
    primaryContactId: 'cnt-103',
    pipelineStage: 'closed_won',
    value: 68000,
    currency: 'USD',
    winProbability: 100,
    expectedCloseDate: 'Aug 28, 2026',
    linkedProjectId: 'proj-shogun-1',
    assignedRepId: 'usr-admin-master',
    createdAt: new Date(Date.now() - 3600000 * 24 * 25).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24 * 10).toISOString(),
  },
];

export interface UseDealsResult {
  deals: Deal[];
  loading: boolean;
  error: Error | null;
  totalPipelineValue: number;
  closedWonRevenue: number;
  winRate: number;
  addDeal: (data: Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateDeal: (id: string, updates: Partial<Deal>) => Promise<void>;
  updateDealStage: (id: string, stage: PipelineStage) => Promise<void>;
  deleteDeal: (id: string) => Promise<void>;
  convertDealToProject: (dealId: string, projectData: { title: string; description: string; accountId: string }) => Promise<string>;
  refetch: () => Promise<void>;
}

export const useDeals = (): UseDealsResult => {
  const { user } = useAuth();
  const { setProjects, setCurrentProjectId } = useProject();

  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchDeals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get<any[]>('/crm/deals');
      if (data && data.length > 0) {
        const mapped: Deal[] = data.map((d) => {
          const val = Number(d.amount) || Number(d.value) || 0;
          const stage = (d.stage || d.pipelineStage || 'discovery') as PipelineStage;

          return {
            id: d.id,
            tenantId: d.tenantId,
            title: d.dealName || d.title || 'Opportunity',
            accountId: d.accountId || 'acc-shogun-root',
            primaryContactId: d.contactId || d.primaryContactId || 'cnt-101',
            pipelineStage: stage,
            value: val,
            currency: d.currency || 'USD',
            winProbability: Number(d.probability) || (stage === 'closed_won' ? 100 : 25),
            expectedCloseDate: typeof d.closingDate === 'string' ? d.closingDate.slice(0, 10) : 'Q4 2026',
            linkedProjectId: d.linkedProjectId || null,
            assignedRepId: d.assignedUserId || 'usr-admin-master',
            createdAt: typeof d.createdAt === 'string' ? d.createdAt : new Date().toISOString(),
            updatedAt: typeof d.updatedAt === 'string' ? d.updatedAt : new Date().toISOString(),
          };
        });
        setDeals(mapped);
      } else {
        setDeals(fallbackDeals);
      }
    } catch (err: any) {
      console.warn('[useDeals] REST fetch failed, using fallback:', err);
      setDeals(fallbackDeals);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  const addDeal = useCallback(
    async (data: Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
      const payload = {
        dealName: data.title,
        accountId: data.accountId,
        contactId: data.primaryContactId,
        amount: data.value,
        currency: data.currency,
        stage: data.pipelineStage,
        probability: data.winProbability,
      };

      try {
        const created = await apiClient.post<any>('/crm/deals', payload);
        await fetchDeals();
        return created.id;
      } catch (err: any) {
        console.error('[useDeals] Add deal error:', err);
        throw err;
      }
    },
    [fetchDeals]
  );

  const updateDeal = useCallback(
    async (id: string, updates: Partial<Deal>) => {
      const payload: Record<string, any> = {};
      if (updates.title) payload.dealName = updates.title;
      if (updates.value !== undefined) payload.amount = updates.value;
      if (updates.pipelineStage) payload.stage = updates.pipelineStage;
      if (updates.winProbability !== undefined) payload.probability = updates.winProbability;
      if (updates.linkedProjectId !== undefined) payload.linkedProjectId = updates.linkedProjectId;

      try {
        await apiClient.put(`/crm/deals/${id}`, payload);
        await fetchDeals();
      } catch (err: any) {
        console.error('[useDeals] Update deal error:', err);
        throw err;
      }
    },
    [fetchDeals]
  );

  const updateDealStage = useCallback(
    async (id: string, stage: PipelineStage) => {
      const winProb =
        stage === 'closed_won'
          ? 100
          : stage === 'closed_lost'
          ? 0
          : stage === 'negotiation'
          ? 75
          : stage === 'proposal'
          ? 50
          : 25;

      try {
        await apiClient.put(`/crm/deals/${id}`, {
          stage,
          probability: winProb,
        });
        await fetchDeals();
      } catch (err: any) {
        console.error('[useDeals] Update deal stage error:', err);
        throw err;
      }
    },
    [fetchDeals]
  );

  const deleteDeal = useCallback(
    async (id: string) => {
      try {
        await apiClient.delete(`/crm/deals/${id}`);
        setDeals((prev) => prev.filter((d) => d.id !== id));
      } catch (err: any) {
        console.error('[useDeals] Delete deal error:', err);
        throw err;
      }
    },
    []
  );

  const convertDealToProject = useCallback(
    async (
      dealId: string,
      projectData: { title: string; description: string; accountId: string }
    ): Promise<string> => {
      const userUid = user?.uid || 'usr-admin-master';

      try {
        // 1. Create Project via REST API
        const projectPayload = {
          title: projectData.title,
          description: projectData.description,
          accountId: projectData.accountId,
          dealId,
          ownerId: userUid,
          members: [userUid],
        };

        const createdProject = await apiClient.post<Project>('/projects', projectPayload);
        const newProjectId = createdProject.id;

        // 2. Update deal state
        await updateDeal(dealId, {
          pipelineStage: 'closed_won',
          linkedProjectId: newProjectId,
        });

        // 3. Create handover task
        const handoverTask: Partial<Task> = {
          projectId: newProjectId,
          title: `Sales-to-Delivery Handover: ${projectData.title}`,
          description: `Project onboarded from Closed-Won deal ${dealId}. Initialize multi-agent sprint planning.`,
          status: 'todo',
          priority: 'urgent',
          category: 'Client Interface',
          assignedAgent: 'Sentinel',
          creatorId: userUid,
          dueDate: new Date(Date.now() + 3 * 86400000).toISOString(),
          relatedEntityType: 'deal',
          relatedEntityId: dealId,
        };

        await apiClient.post('/projects/tasks', handoverTask);

        setProjects((prev) => [createdProject, ...prev]);
        setCurrentProjectId(newProjectId);

        return newProjectId;
      } catch (err: any) {
        console.error('[useDeals] Convert deal to project error:', err);
        throw err;
      }
    },
    [user, updateDeal, setProjects, setCurrentProjectId]
  );

  const totalPipelineValue = useMemo(() => {
    return deals
      .filter((d) => d.pipelineStage !== 'closed_lost')
      .reduce((sum, d) => sum + (d.value || 0), 0);
  }, [deals]);

  const closedWonRevenue = useMemo(() => {
    return deals
      .filter((d) => d.pipelineStage === 'closed_won')
      .reduce((sum, d) => sum + (d.value || 0), 0);
  }, [deals]);

  const winRate = useMemo(() => {
    const won = deals.filter((d) => d.pipelineStage === 'closed_won').length;
    const lost = deals.filter((d) => d.pipelineStage === 'closed_lost').length;
    const total = won + lost;
    if (total === 0) return 0;
    return Math.round((won / total) * 100);
  }, [deals]);

  return {
    deals,
    loading,
    error,
    totalPipelineValue,
    closedWonRevenue,
    winRate,
    addDeal,
    updateDeal,
    updateDealStage,
    deleteDeal,
    convertDealToProject,
    refetch: fetchDeals,
  };
};

export default useDeals;
