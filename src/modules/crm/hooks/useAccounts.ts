import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../../services/api';
import { Account, AccountStatus, AccountTier } from '../../../types/crm';

const fallbackAccounts: Account[] = [
  {
    id: 'acc-shogun-root',
    tenantId: 'tenant-default',
    name: 'Shogunate Solutions',
    domain: 'shogunatesolutions.com',
    industry: 'Enterprise AI & Agentic Orchestration',
    tier: 'enterprise',
    status: 'active_client',
    assignedOwnerId: 'usr-admin-master',
    billingDetails: { currency: 'USD', taxId: 'US-98745210' },
    customFields: { keyAccount: true, npsScore: 9.5 },
    createdAt: new Date(Date.now() - 3600000 * 24 * 60).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
  },
  {
    id: 'acc-hyperion-tech',
    tenantId: 'tenant-default',
    name: 'Hyperion Logistics Corp',
    domain: 'hyperionlogistics.io',
    industry: 'Supply Chain & IoT Automation',
    tier: 'enterprise',
    status: 'active_client',
    assignedOwnerId: 'usr-admin-master',
    billingDetails: { currency: 'USD', taxId: 'US-11223344' },
    customFields: { annualContractValue: 145000 },
    createdAt: new Date(Date.now() - 3600000 * 24 * 35).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
  },
];

export interface UseAccountsResult {
  accounts: Account[];
  loading: boolean;
  error: Error | null;
  addAccount: (data: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateAccount: (id: string, updates: Partial<Account>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export const useAccounts = (filters?: { status?: AccountStatus; tier?: AccountTier }): UseAccountsResult => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get<any[]>('/crm/accounts');
      if (data && data.length > 0) {
        const mapped: Account[] = data.map((d) => ({
          id: d.id,
          tenantId: d.tenantId,
          name: d.accountName || d.name || 'Unnamed Account',
          domain: d.domain || '',
          industry: d.industry || 'Technology',
          tier: (d.tier as AccountTier) || 'starter',
          status: (d.status as AccountStatus) || 'prospect',
          assignedOwnerId: d.assignedUserId || 'usr-admin-master',
          billingDetails: {
            currency: 'USD',
            street: d.billingStreet,
            city: d.billingCity,
            state: d.billingState,
            postalCode: d.billingPostalCode,
            country: d.billingCountry,
          },
          customFields: d.customFields || {},
          createdAt: typeof d.createdAt === 'string' ? d.createdAt : new Date().toISOString(),
          updatedAt: typeof d.updatedAt === 'string' ? d.updatedAt : new Date().toISOString(),
        }));
        setAccounts(mapped);
      } else {
        setAccounts(fallbackAccounts);
      }
    } catch (err: any) {
      console.warn('[useAccounts] REST fetch failed, using fallback:', err);
      setAccounts(fallbackAccounts);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const addAccount = useCallback(
    async (data: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
      const payload = {
        accountName: data.name,
        domain: data.domain,
        industry: data.industry,
        accountType: data.status,
        billingStreet: data.billingDetails?.street,
        billingCity: data.billingDetails?.city,
        billingState: data.billingDetails?.state,
        billingPostalCode: data.billingDetails?.postalCode,
        billingCountry: data.billingDetails?.country,
        customFields: data.customFields,
      };

      try {
        const created = await apiClient.post<any>('/crm/accounts', payload);
        await fetchAccounts();
        return created.id;
      } catch (err: any) {
        console.error('[useAccounts] Add account error:', err);
        throw err;
      }
    },
    [fetchAccounts]
  );

  const updateAccount = useCallback(
    async (id: string, updates: Partial<Account>) => {
      const payload: Record<string, any> = {};
      if (updates.name) payload.accountName = updates.name;
      if (updates.domain !== undefined) payload.domain = updates.domain;
      if (updates.industry !== undefined) payload.industry = updates.industry;
      if (updates.customFields) payload.customFields = updates.customFields;

      try {
        await apiClient.put(`/crm/accounts/${id}`, payload);
        await fetchAccounts();
      } catch (err: any) {
        console.error('[useAccounts] Update account error:', err);
        throw err;
      }
    },
    [fetchAccounts]
  );

  const deleteAccount = useCallback(
    async (id: string) => {
      try {
        await apiClient.delete(`/crm/accounts/${id}`);
        setAccounts((prev) => prev.filter((acc) => acc.id !== id));
      } catch (err: any) {
        console.error('[useAccounts] Delete account error:', err);
        throw err;
      }
    },
    []
  );

  const filteredAccounts = accounts.filter((acc) => {
    if (filters?.status && acc.status !== filters.status) return false;
    if (filters?.tier && acc.tier !== filters.tier) return false;
    return true;
  });

  return {
    accounts: filteredAccounts,
    loading,
    error,
    addAccount,
    updateAccount,
    deleteAccount,
    refetch: fetchAccounts,
  };
};

export default useAccounts;
