import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { Account, AccountStatus, AccountTier } from '../../../types/crm';
import { useAuth } from '../../../context/AuthContext';

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
  {
    id: 'acc-vanguard-fin',
    tenantId: 'tenant-default',
    name: 'Vanguard Fintech Systems',
    domain: 'vanguardfin.net',
    industry: 'Financial Technology & Security',
    tier: 'growth',
    status: 'prospect',
    assignedOwnerId: 'usr-admin-master',
    billingDetails: { currency: 'USD' },
    customFields: { complianceTier: 'SOC2_Type2' },
    createdAt: new Date(Date.now() - 3600000 * 24 * 20).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
  },
  {
    id: 'acc-apex-global',
    tenantId: 'tenant-default',
    name: 'Apex Global Enterprises',
    domain: 'apexglobal.com',
    industry: 'Global Retail & E-Commerce',
    tier: 'starter',
    status: 'churn_risk',
    assignedOwnerId: 'usr-admin-master',
    billingDetails: { currency: 'USD' },
    customFields: { lastAuditDays: 48 },
    createdAt: new Date(Date.now() - 3600000 * 24 * 50).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24 * 46).toISOString(),
  },
];

export interface UseAccountsResult {
  accounts: Account[];
  loading: boolean;
  error: Error | null;
  addAccount: (data: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateAccount: (id: string, updates: Partial<Account>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
}

export const useAccounts = (filters?: { status?: AccountStatus; tier?: AccountTier }): UseAccountsResult => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    const accountsRef = collection(db, 'accounts');
    const q = query(accountsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const loaded: Account[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              tenantId: data.tenantId || 'tenant-default',
              name: data.name || 'Unnamed Account',
              domain: data.domain || '',
              industry: data.industry || 'Technology',
              tier: (data.tier as AccountTier) || 'starter',
              status: (data.status as AccountStatus) || 'prospect',
              assignedOwnerId: data.assignedOwnerId || user?.uid || 'usr-admin-master',
              billingDetails: data.billingDetails || { currency: 'USD' },
              customFields: data.customFields || {},
              createdAt: typeof data.createdAt === 'object' && data.createdAt?.toDate 
                ? data.createdAt.toDate().toISOString() 
                : String(data.createdAt || new Date().toISOString()),
              updatedAt: typeof data.updatedAt === 'object' && data.updatedAt?.toDate 
                ? data.updatedAt.toDate().toISOString() 
                : String(data.updatedAt || new Date().toISOString()),
            };
          });
          setAccounts(loaded);
        } else {
          setAccounts(fallbackAccounts);
        }
        setLoading(false);
      },
      (err) => {
        console.warn('Accounts snapshot fallback to mock data:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
        setAccounts((prev) => (prev.length > 0 ? prev : fallbackAccounts));
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const addAccount = useCallback(async (data: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const newId = `acc-${Date.now().toString(36)}`;
    const now = new Date().toISOString();
    const newAccount: Account = {
      ...data,
      id: newId,
      createdAt: now,
      updatedAt: now,
    };

    setAccounts((prev) => [newAccount, ...prev]);

    try {
      const docRef = doc(db, 'accounts', newId);
      await setDoc(docRef, newAccount);
    } catch (err) {
      console.warn('Firestore addAccount fallback:', err);
    }

    return newId;
  }, []);

  const updateAccount = useCallback(async (id: string, updates: Partial<Account>) => {
    const now = new Date().toISOString();
    setAccounts((prev) =>
      prev.map((acc) => (acc.id === id ? { ...acc, ...updates, updatedAt: now } : acc))
    );

    try {
      const docRef = doc(db, 'accounts', id);
      await updateDoc(docRef, { ...updates, updatedAt: now });
    } catch (err) {
      console.warn('Firestore updateAccount fallback:', err);
    }
  }, []);

  const deleteAccount = useCallback(async (id: string) => {
    setAccounts((prev) => prev.filter((acc) => acc.id !== id));

    try {
      const docRef = doc(db, 'accounts', id);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('Firestore deleteAccount fallback:', err);
    }
  }, []);

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
  };
};

export default useAccounts;
