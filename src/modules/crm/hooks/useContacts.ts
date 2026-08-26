import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiClient } from '../../../services/api';
import { Contact, ContactLifecycleStage } from '../../../types/crm';

const fallbackContacts: Contact[] = [
  {
    id: 'cnt-101',
    tenantId: 'tenant-default',
    accountId: 'acc-hyperion-tech',
    firstName: 'Marcus',
    lastName: 'Vance',
    email: 'marcus.vance@hyperionlogistics.io',
    phone: '+1 (415) 890-2341',
    jobTitle: 'VP of Engineering & Automation',
    isPrimaryContact: true,
    lifecycleStage: 'customer',
    lastContactedAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 24 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
  },
  {
    id: 'cnt-102',
    tenantId: 'tenant-default',
    accountId: 'acc-vanguard-fin',
    firstName: 'Elena',
    lastName: 'Rostova',
    email: 'e.rostova@vanguardfin.net',
    phone: '+1 (212) 555-0199',
    jobTitle: 'Head of Infrastructure Architecture',
    isPrimaryContact: true,
    lifecycleStage: 'sql',
    lastContactedAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 24 * 18).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
  },
];

export interface UseContactsResult {
  contacts: Contact[];
  loading: boolean;
  error: Error | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedLifecycle: string;
  setSelectedLifecycle: (stage: string) => void;
  addContact: (data: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateContact: (id: string, updates: Partial<Contact>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export const useContacts = (accountId?: string): UseContactsResult => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLifecycle, setSelectedLifecycle] = useState<string>('all');

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get<any[]>('/crm/contacts');
      if (data && data.length > 0) {
        const mapped: Contact[] = data.map((d) => ({
          id: d.id,
          tenantId: d.tenantId,
          accountId: d.accountId || 'acc-shogun-root',
          firstName: d.firstName || '',
          lastName: d.lastName || '',
          email: d.email || '',
          phone: d.phone,
          jobTitle: d.jobTitle || 'Stakeholder',
          isPrimaryContact: Boolean(d.isPrimaryContact),
          lifecycleStage: (d.lifecycleStage as ContactLifecycleStage) || 'lead',
          lastContactedAt: d.lastContactedAt || null,
          createdAt: typeof d.createdAt === 'string' ? d.createdAt : new Date().toISOString(),
          updatedAt: typeof d.updatedAt === 'string' ? d.updatedAt : new Date().toISOString(),
        }));
        setContacts(mapped);
      } else {
        setContacts(fallbackContacts);
      }
    } catch (err: any) {
      console.warn('[useContacts] REST fetch failed, using fallback:', err);
      setContacts(fallbackContacts);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const addContact = useCallback(
    async (data: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
      try {
        const created = await apiClient.post<any>('/crm/contacts', data);
        await fetchContacts();
        return created.id;
      } catch (err: any) {
        console.error('[useContacts] Add contact error:', err);
        throw err;
      }
    },
    [fetchContacts]
  );

  const updateContact = useCallback(
    async (id: string, updates: Partial<Contact>) => {
      try {
        await apiClient.put(`/crm/contacts/${id}`, updates);
        await fetchContacts();
      } catch (err: any) {
        console.error('[useContacts] Update contact error:', err);
        throw err;
      }
    },
    [fetchContacts]
  );

  const deleteContact = useCallback(
    async (id: string) => {
      try {
        await apiClient.delete(`/crm/contacts/${id}`);
        setContacts((prev) => prev.filter((c) => c.id !== id));
      } catch (err: any) {
        console.error('[useContacts] Delete contact error:', err);
        throw err;
      }
    },
    []
  );

  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      if (accountId && c.accountId !== accountId) return false;
      if (selectedLifecycle !== 'all' && c.lifecycleStage !== selectedLifecycle) return false;
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
      return (
        fullName.includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.jobTitle && c.jobTitle.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q))
      );
    });
  }, [contacts, accountId, selectedLifecycle, searchQuery]);

  return {
    contacts: filteredContacts,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    selectedLifecycle,
    setSelectedLifecycle,
    addContact,
    updateContact,
    deleteContact,
    refetch: fetchContacts,
  };
};

export default useContacts;
