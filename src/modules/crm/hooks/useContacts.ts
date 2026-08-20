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
} from 'firebase/firestore';
import { db } from '../../../services/firebase';
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
  {
    id: 'cnt-103',
    tenantId: 'tenant-default',
    accountId: 'acc-shogun-root',
    firstName: 'Kenji',
    lastName: 'Sato',
    email: 'kenji.sato@shogunate.dev',
    phone: '+81 3 5555 0142',
    jobTitle: 'Chief Systems Architect',
    isPrimaryContact: true,
    lifecycleStage: 'advocate',
    lastContactedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 24 * 60).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cnt-104',
    tenantId: 'tenant-default',
    accountId: 'acc-apex-global',
    firstName: 'Aria',
    lastName: 'Sterling',
    email: 'aria.sterling@apexglobal.com',
    phone: '+1 (312) 800-9944',
    jobTitle: 'Director of Procurement',
    isPrimaryContact: false,
    lifecycleStage: 'lead',
    lastContactedAt: new Date(Date.now() - 3600000 * 24 * 46).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 24 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24 * 46).toISOString(),
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
}

export const useContacts = (accountId?: string): UseContactsResult => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLifecycle, setSelectedLifecycle] = useState<string>('all');

  useEffect(() => {
    setLoading(true);
    const contactsRef = collection(db, 'contacts');
    const q = query(contactsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const loaded: Contact[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              tenantId: data.tenantId || 'tenant-default',
              accountId: data.accountId || data.organizationId || 'acc-shogun-root',
              firstName: data.firstName || '',
              lastName: data.lastName || '',
              email: data.email || '',
              phone: data.phone,
              jobTitle: data.jobTitle || 'Stakeholder',
              isPrimaryContact: Boolean(data.isPrimaryContact),
              lifecycleStage: (data.lifecycleStage as ContactLifecycleStage) || 'lead',
              lastContactedAt: data.lastContactedAt || null,
              createdAt: typeof data.createdAt === 'object' && data.createdAt?.toDate 
                ? data.createdAt.toDate().toISOString() 
                : String(data.createdAt || new Date().toISOString()),
              updatedAt: typeof data.updatedAt === 'object' && data.updatedAt?.toDate 
                ? data.updatedAt.toDate().toISOString() 
                : String(data.updatedAt || new Date().toISOString()),
            };
          });
          setContacts(loaded);
        } else {
          setContacts(fallbackContacts);
        }
        setLoading(false);
      },
      (err) => {
        console.warn('Contacts snapshot fallback to mock data:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
        setContacts((prev) => (prev.length > 0 ? prev : fallbackContacts));
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const addContact = useCallback(async (data: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const newId = `cnt-${Date.now().toString(36)}`;
    const now = new Date().toISOString();
    const newContact: Contact = {
      ...data,
      id: newId,
      createdAt: now,
      updatedAt: now,
    };

    setContacts((prev) => [newContact, ...prev]);

    try {
      const docRef = doc(db, 'contacts', newId);
      await setDoc(docRef, newContact);
    } catch (err) {
      console.warn('Firestore addContact fallback:', err);
    }

    return newId;
  }, []);

  const updateContact = useCallback(async (id: string, updates: Partial<Contact>) => {
    const now = new Date().toISOString();
    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates, updatedAt: now } : c))
    );

    try {
      const docRef = doc(db, 'contacts', id);
      await updateDoc(docRef, { ...updates, updatedAt: now });
    } catch (err) {
      console.warn('Firestore updateContact fallback:', err);
    }
  }, []);

  const deleteContact = useCallback(async (id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));

    try {
      const docRef = doc(db, 'contacts', id);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('Firestore deleteContact fallback:', err);
    }
  }, []);

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
  };
};

export default useContacts;
