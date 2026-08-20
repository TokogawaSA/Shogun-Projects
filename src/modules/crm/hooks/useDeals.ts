import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
} from 'firebase/firestore';
import { db } from '../../../services/firebase';
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
  {
    id: 'del-303',
    tenantId: 'tenant-default',
    title: 'Fintech Real-Time Audit Ledger Migration',
    accountId: 'acc-vanguard-fin',
    primaryContactId: 'cnt-102',
    pipelineStage: 'proposal',
    value: 210000,
    currency: 'USD',
    winProbability: 50,
    expectedCloseDate: 'Oct 01, 2026',
    linkedProjectId: null,
    assignedRepId: 'usr-admin-master',
    createdAt: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
  },
  {
    id: 'del-304',
    tenantId: 'tenant-default',
    title: 'Cloud Functions Gen 2 Microservice Suite',
    accountId: 'acc-hyperion-tech',
    primaryContactId: 'cnt-101',
    pipelineStage: 'discovery',
    value: 42000,
    currency: 'USD',
    winProbability: 25,
    expectedCloseDate: 'Oct 20, 2026',
    linkedProjectId: null,
    assignedRepId: 'usr-admin-master',
    createdAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
  },
  {
    id: 'del-305',
    tenantId: 'tenant-default',
    title: 'Legacy Monolith Architecture Review',
    accountId: 'acc-apex-global',
    primaryContactId: 'cnt-104',
    pipelineStage: 'closed_lost',
    value: 30000,
    currency: 'USD',
    winProbability: 0,
    expectedCloseDate: 'Aug 10, 2026',
    linkedProjectId: null,
    assignedRepId: 'usr-admin-master',
    createdAt: new Date(Date.now() - 3600000 * 24 * 40).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24 * 30).toISOString(),
  }
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
}

export const useDeals = (): UseDealsResult => {
  const { user } = useAuth();
  const { setProjects, setCurrentProjectId } = useProject();

  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    const dealsRef = collection(db, 'deals');
    const q = query(dealsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const loaded: Deal[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            const val = Number(data.value) || Number(data.amount) || 0;
            const stage = (data.pipelineStage || data.stage || 'discovery') as PipelineStage;

            return {
              id: docSnap.id,
              tenantId: data.tenantId || 'tenant-default',
              title: data.title || 'Opportunity',
              accountId: data.accountId || data.organizationId || 'acc-shogun-root',
              primaryContactId: data.primaryContactId || data.contactId || 'cnt-101',
              pipelineStage: stage,
              value: val,
              currency: data.currency || 'USD',
              winProbability: Number(data.winProbability) || (stage === 'closed_won' ? 100 : 25),
              expectedCloseDate: data.expectedCloseDate || 'Q4 2026',
              linkedProjectId: data.linkedProjectId || data.projectId || null,
              assignedRepId: data.assignedRepId || user?.uid || 'usr-admin-master',
              createdAt: typeof data.createdAt === 'object' && data.createdAt?.toDate 
                ? data.createdAt.toDate().toISOString() 
                : String(data.createdAt || new Date().toISOString()),
              updatedAt: typeof data.updatedAt === 'object' && data.updatedAt?.toDate 
                ? data.updatedAt.toDate().toISOString() 
                : String(data.updatedAt || new Date().toISOString()),
            };
          });
          setDeals(loaded);
        } else {
          setDeals(fallbackDeals);
        }
        setLoading(false);
      },
      (err) => {
        console.warn('Deals snapshot fallback to mock data:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
        setDeals((prev) => (prev.length > 0 ? prev : fallbackDeals));
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const addDeal = useCallback(async (data: Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const newId = `del-${Date.now().toString(36)}`;
    const now = new Date().toISOString();
    const newDeal: Deal = {
      ...data,
      id: newId,
      createdAt: now,
      updatedAt: now,
    };

    setDeals((prev) => [newDeal, ...prev]);

    try {
      const docRef = doc(db, 'deals', newId);
      await setDoc(docRef, newDeal);
    } catch (err) {
      console.warn('Firestore addDeal fallback:', err);
    }

    return newId;
  }, []);

  const updateDeal = useCallback(async (id: string, updates: Partial<Deal>) => {
    const now = new Date().toISOString();
    setDeals((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...updates, updatedAt: now } : d))
    );

    try {
      const docRef = doc(db, 'deals', id);
      await updateDoc(docRef, { ...updates, updatedAt: now });
    } catch (err) {
      console.warn('Firestore updateDeal fallback:', err);
    }
  }, []);

  const updateDealStage = useCallback(async (id: string, stage: PipelineStage) => {
    const now = new Date().toISOString();
    const winProb = stage === 'closed_won' ? 100 : stage === 'closed_lost' ? 0 : stage === 'negotiation' ? 75 : stage === 'proposal' ? 50 : 25;

    setDeals((prev) =>
      prev.map((d) => (d.id === id ? { ...d, pipelineStage: stage, winProbability: winProb, updatedAt: now } : d))
    );

    try {
      const docRef = doc(db, 'deals', id);
      await updateDoc(docRef, {
        pipelineStage: stage,
        stage,
        winProbability: winProb,
        updatedAt: now,
      });
    } catch (err) {
      console.warn('Firestore updateDealStage fallback:', err);
    }
  }, []);

  const deleteDeal = useCallback(async (id: string) => {
    setDeals((prev) => prev.filter((d) => d.id !== id));

    try {
      const docRef = doc(db, 'deals', id);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('Firestore deleteDeal fallback:', err);
    }
  }, []);

  const convertDealToProject = useCallback(async (
    dealId: string,
    projectData: { title: string; description: string; accountId: string }
  ): Promise<string> => {
    const userUid = user?.uid || 'usr-admin-master';
    const newProjectId = `proj-deal-${Date.now().toString(36)}`;
    const now = new Date().toISOString();

    const createdProject: Project = {
      id: newProjectId,
      tenantId: 'tenant-default',
      title: projectData.title,
      description: projectData.description,
      organizationId: projectData.accountId || 'org-shogunate-root',
      accountId: projectData.accountId,
      dealId,
      primaryContactId: deals.find((d) => d.id === dealId)?.primaryContactId || null,
      ownerId: userUid,
      members: [userUid],
      createdAt: now,
      updatedAt: now,
    };

    // 1. Optimistically create Project in state
    setProjects((prev) => [createdProject, ...prev]);
    setCurrentProjectId(newProjectId);

    // 2. Update deal state
    await updateDeal(dealId, {
      pipelineStage: 'closed_won',
      linkedProjectId: newProjectId,
    });

    // 3. Persist to Firestore with timeout race
    try {
      const projRef = doc(db, 'projects', newProjectId);
      const projPromise = setDoc(projRef, createdProject);

      const handoverTask: Omit<Task, 'id'> = {
        projectId: newProjectId,
        title: `Sales-to-Delivery Handover: ${projectData.title}`,
        description: `Project onboarded from Closed-Won deal ${dealId}. Initialize multi-agent sprint planning.`,
        status: 'todo',
        priority: 'urgent',
        category: 'Client Interface',
        assignedAgent: 'Sentinel',
        creatorId: userUid,
        dueDate: 'Day 3 Kickoff',
        progress: 0,
        relatedEntityType: 'deal',
        relatedEntityId: dealId,
        subtasks: [
          { id: 'st-d-1', title: 'Review deal requirements & budget allocations', completed: false, createdAt: now },
          { id: 'st-d-2', title: 'Orchestrate Sentinel & Worker subagent roles', completed: false, createdAt: now },
        ],
        createdAt: now,
        updatedAt: now,
      };

      const taskPromise = addDoc(collection(db, 'projects', newProjectId, 'tasks'), handoverTask);

      await Promise.race([
        Promise.all([projPromise, taskPromise]),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Sync timeout')), 1200)),
      ]);
    } catch (err) {
      console.warn('Firestore project conversion fallback:', err);
    }

    return newProjectId;
  }, [user, deals, updateDeal, setProjects, setCurrentProjectId]);

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
  };
};

export default useDeals;
