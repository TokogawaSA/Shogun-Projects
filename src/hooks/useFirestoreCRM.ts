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
  addDoc,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { 
  Deal, 
  DealStage, 
  Contact, 
  Lead, 
  Organization, 
  Project,
  Task 
} from '../types';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';

// Rich fallback datasets for initial hydration and offline resiliency
const fallbackOrganizations: Organization[] = [
  {
    id: 'org-shogunate-root',
    name: 'Shogunate Solutions',
    domain: 'shogunatesolutions.com',
    industry: 'Enterprise AI & Agentic Orchestration',
    createdAt: new Date(Date.now() - 3600000 * 24 * 30).toISOString(),
  },
  {
    id: 'org-hyperion-tech',
    name: 'Hyperion Logistics Corp',
    domain: 'hyperionlogistics.io',
    industry: 'Supply Chain & IoT Automation',
    createdAt: new Date(Date.now() - 3600000 * 24 * 18).toISOString(),
  },
  {
    id: 'org-vanguard-fin',
    name: 'Vanguard Fintech Systems',
    domain: 'vanguardfin.net',
    industry: 'Financial Technology & Security',
    createdAt: new Date(Date.now() - 3600000 * 24 * 10).toISOString(),
  },
];

const fallbackContacts: Contact[] = [
  {
    id: 'cnt-101',
    organizationId: 'org-hyperion-tech',
    firstName: 'Marcus',
    lastName: 'Vance',
    email: 'marcus.vance@hyperionlogistics.io',
    phone: '+1 (415) 890-2341',
    createdAt: new Date(Date.now() - 3600000 * 24 * 15).toISOString(),
  },
  {
    id: 'cnt-102',
    organizationId: 'org-vanguard-fin',
    firstName: 'Elena',
    lastName: 'Rostova',
    email: 'e.rostova@vanguardfin.net',
    phone: '+1 (212) 555-0199',
    createdAt: new Date(Date.now() - 3600000 * 24 * 9).toISOString(),
  },
  {
    id: 'cnt-103',
    organizationId: 'org-shogunate-root',
    firstName: 'Kenji',
    lastName: 'Sato',
    email: 'kenji.sato@shogunate.dev',
    phone: '+81 3 5555 0142',
    createdAt: new Date(Date.now() - 3600000 * 24 * 25).toISOString(),
  },
];

const fallbackLeads: Lead[] = [
  {
    id: 'led-201',
    name: 'Aria Sterling',
    email: 'aria.sterling@apexglobal.com',
    company: 'Apex Global Enterprises',
    source: 'Website Inbound Demo',
    status: 'qualified',
    createdAt: new Date(Date.now() - 3600000 * 24 * 4).toISOString(),
  },
  {
    id: 'led-202',
    name: 'Darius Thorne',
    email: 'd.thorne@novasystems.tech',
    company: 'Nova Systems Tech',
    source: 'LinkedIn Agent Referral',
    status: 'contacted',
    createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
  },
  {
    id: 'led-203',
    name: 'Sophia Patel',
    email: 'sophia@cloudscale.ai',
    company: 'CloudScale AI Labs',
    source: 'Firebase MCP Community',
    status: 'new',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
];

const fallbackDeals: Deal[] = [
  {
    id: 'del-301',
    title: 'Enterprise Multi-Agent Pipeline Integration',
    amount: 145000,
    stage: 'proposal',
    organizationId: 'org-hyperion-tech',
    contactId: 'cnt-101',
    expectedCloseDate: 'Sep 15, 2026',
    createdAt: new Date(Date.now() - 3600000 * 24 * 12).toISOString(),
  },
  {
    id: 'del-302',
    title: 'WooCommerce High-Scale Payment Synchronizer',
    amount: 68000,
    stage: 'closed_won',
    organizationId: 'org-shogunate-root',
    contactId: 'cnt-103',
    expectedCloseDate: 'Aug 28, 2026',
    projectId: 'proj-shogun-1',
    createdAt: new Date(Date.now() - 3600000 * 24 * 20).toISOString(),
  },
  {
    id: 'del-303',
    title: 'Fintech Real-Time Audit Ledger Migration',
    amount: 210000,
    stage: 'qualification',
    organizationId: 'org-vanguard-fin',
    contactId: 'cnt-102',
    expectedCloseDate: 'Oct 01, 2026',
    createdAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
  },
  {
    id: 'del-304',
    title: 'Cloud Functions Gen 2 Microservice Suite',
    amount: 42000,
    stage: 'prospecting',
    organizationId: 'org-hyperion-tech',
    expectedCloseDate: 'Oct 20, 2026',
    createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
  },
];

export interface UseFirestoreCRMResult {
  deals: Deal[];
  contacts: Contact[];
  leads: Lead[];
  organizations: Organization[];
  loading: boolean;
  error: Error | null;

  // Deal CRUD & Conversions
  addDeal: (dealData: Omit<Deal, 'id' | 'createdAt'>) => Promise<string>;
  updateDeal: (dealId: string, updates: Partial<Deal>) => Promise<void>;
  updateDealStage: (dealId: string, stage: DealStage) => Promise<void>;
  deleteDeal: (dealId: string) => Promise<void>;
  convertDealToProject: (dealId: string, projectData: { title: string; description: string; organizationId: string }) => Promise<string>;

  // Contact CRUD
  addContact: (contactData: Omit<Contact, 'id' | 'createdAt'>) => Promise<string>;
  updateContact: (contactId: string, updates: Partial<Contact>) => Promise<void>;
  deleteContact: (contactId: string) => Promise<void>;

  // Lead CRUD
  addLead: (leadData: Omit<Lead, 'id' | 'createdAt'>) => Promise<string>;
  updateLead: (leadId: string, updates: Partial<Lead>) => Promise<void>;
  deleteLead: (leadId: string) => Promise<void>;

  // Organization CRUD
  addOrganization: (orgData: Omit<Organization, 'id' | 'createdAt'>) => Promise<string>;
  updateOrganization: (orgId: string, updates: Partial<Organization>) => Promise<void>;
  deleteOrganization: (orgId: string) => Promise<void>;
}

export const useFirestoreCRM = (): UseFirestoreCRMResult => {
  const { user } = useAuth();
  const { setProjects, setCurrentProjectId } = useProject();

  const [deals, setDeals] = useState<Deal[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Synchronize with Firestore real-time snapshot listeners
  useEffect(() => {
    setLoading(true);
    setError(null);

    const unsubs: (() => void)[] = [];

    try {
      // 1. Deals Listener
      const dealsRef = collection(db, 'deals');
      const dealsQuery = query(dealsRef, orderBy('createdAt', 'desc'));
      const unsubDeals = onSnapshot(
        dealsQuery,
        (snap) => {
          if (!snap.empty) {
            const list: Deal[] = snap.docs.map((docSnap) => {
              const d = docSnap.data();
              return {
                id: docSnap.id,
                title: d.title || 'Untitled Deal',
                amount: Number(d.amount) || 0,
                stage: (d.stage as DealStage) || 'prospecting',
                organizationId: d.organizationId,
                contactId: d.contactId,
                expectedCloseDate: d.expectedCloseDate,
                projectId: d.projectId,
                createdAt: typeof d.createdAt === 'object' && d.createdAt?.toDate 
                  ? d.createdAt.toDate().toISOString() 
                  : String(d.createdAt || new Date().toISOString()),
              };
            });
            setDeals(list);
          } else {
            setDeals(fallbackDeals);
          }
        },
        (err) => {
          console.warn('Deals snapshot fallback to mock state:', err);
          setDeals((prev) => (prev.length > 0 ? prev : fallbackDeals));
        }
      );
      unsubs.push(unsubDeals);

      // 2. Contacts Listener
      const contactsRef = collection(db, 'contacts');
      const contactsQuery = query(contactsRef, orderBy('createdAt', 'desc'));
      const unsubContacts = onSnapshot(
        contactsQuery,
        (snap) => {
          if (!snap.empty) {
            const list: Contact[] = snap.docs.map((docSnap) => {
              const c = docSnap.data();
              return {
                id: docSnap.id,
                organizationId: c.organizationId,
                firstName: c.firstName || '',
                lastName: c.lastName || '',
                email: c.email || '',
                phone: c.phone,
                createdAt: typeof c.createdAt === 'object' && c.createdAt?.toDate 
                  ? c.createdAt.toDate().toISOString() 
                  : String(c.createdAt || new Date().toISOString()),
              };
            });
            setContacts(list);
          } else {
            setContacts(fallbackContacts);
          }
        },
        (err) => {
          console.warn('Contacts snapshot fallback to mock state:', err);
          setContacts((prev) => (prev.length > 0 ? prev : fallbackContacts));
        }
      );
      unsubs.push(unsubContacts);

      // 3. Leads Listener
      const leadsRef = collection(db, 'leads');
      const leadsQuery = query(leadsRef, orderBy('createdAt', 'desc'));
      const unsubLeads = onSnapshot(
        leadsQuery,
        (snap) => {
          if (!snap.empty) {
            const list: Lead[] = snap.docs.map((docSnap) => {
              const l = docSnap.data();
              return {
                id: docSnap.id,
                name: l.name || '',
                email: l.email || '',
                company: l.company,
                source: l.source,
                status: l.status || 'new',
                createdAt: typeof l.createdAt === 'object' && l.createdAt?.toDate 
                  ? l.createdAt.toDate().toISOString() 
                  : String(l.createdAt || new Date().toISOString()),
              };
            });
            setLeads(list);
          } else {
            setLeads(fallbackLeads);
          }
        },
        (err) => {
          console.warn('Leads snapshot fallback to mock state:', err);
          setLeads((prev) => (prev.length > 0 ? prev : fallbackLeads));
        }
      );
      unsubs.push(unsubLeads);

      // 4. Organizations Listener
      const orgsRef = collection(db, 'organizations');
      const orgsQuery = query(orgsRef, orderBy('createdAt', 'desc'));
      const unsubOrgs = onSnapshot(
        orgsQuery,
        (snap) => {
          if (!snap.empty) {
            const list: Organization[] = snap.docs.map((docSnap) => {
              const o = docSnap.data();
              return {
                id: docSnap.id,
                name: o.name || 'Unnamed Org',
                domain: o.domain,
                industry: o.industry,
                createdAt: typeof o.createdAt === 'object' && o.createdAt?.toDate 
                  ? o.createdAt.toDate().toISOString() 
                  : String(o.createdAt || new Date().toISOString()),
              };
            });
            setOrganizations(list);
          } else {
            setOrganizations(fallbackOrganizations);
          }
          setLoading(false);
        },
        (err) => {
          console.warn('Organizations snapshot fallback to mock state:', err);
          setOrganizations((prev) => (prev.length > 0 ? prev : fallbackOrganizations));
          setLoading(false);
        }
      );
      unsubs.push(unsubOrgs);

    } catch (err: unknown) {
      console.warn('Firestore CRM initialization error:', err);
      setDeals(fallbackDeals);
      setContacts(fallbackContacts);
      setLeads(fallbackLeads);
      setOrganizations(fallbackOrganizations);
      setError(err instanceof Error ? err : new Error(String(err)));
      setLoading(false);
    }

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, []);

  // ----------------------------------------------------
  // Deal Operations
  // ----------------------------------------------------

  const addDeal = useCallback(async (dealData: Omit<Deal, 'id' | 'createdAt'>): Promise<string> => {
    const newId = `del-${Date.now().toString(36)}`;
    const newDeal: Deal = {
      ...dealData,
      id: newId,
      createdAt: new Date().toISOString(),
    };

    // Optimistic update
    setDeals((prev) => [newDeal, ...prev]);

    try {
      const dealDocRef = doc(db, 'deals', newId);
      await setDoc(dealDocRef, newDeal);
    } catch (err) {
      console.warn('Firestore deal write completed with local fallback:', err);
    }

    return newId;
  }, []);

  const updateDeal = useCallback(async (dealId: string, updates: Partial<Deal>) => {
    setDeals((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, ...updates } : d))
    );

    try {
      const dealDocRef = doc(db, 'deals', dealId);
      await updateDoc(dealDocRef, { ...updates });
    } catch (err) {
      console.warn('Firestore deal update fallback:', err);
    }
  }, []);

  const updateDealStage = useCallback(async (dealId: string, stage: DealStage) => {
    setDeals((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, stage } : d))
    );

    try {
      const dealDocRef = doc(db, 'deals', dealId);
      await updateDoc(dealDocRef, { stage });
    } catch (err) {
      console.warn('Firestore deal stage update fallback:', err);
    }
  }, []);

  const deleteDeal = useCallback(async (dealId: string) => {
    setDeals((prev) => prev.filter((d) => d.id !== dealId));

    try {
      const dealDocRef = doc(db, 'deals', dealId);
      await deleteDoc(dealDocRef);
    } catch (err) {
      console.warn('Firestore deal delete fallback:', err);
    }
  }, []);

  const convertDealToProject = useCallback(async (
    dealId: string, 
    projectData: { title: string; description: string; organizationId: string }
  ): Promise<string> => {
    const userUid = user?.uid || 'usr-admin-master';
    const newProjectId = `proj-${Date.now().toString(36)}`;

    const createdProject: Project = {
      id: newProjectId,
      title: projectData.title,
      description: projectData.description,
      organizationId: projectData.organizationId || 'org-shogunate-root',
      ownerId: userUid,
      members: [userUid],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 1. Create project document in Firestore
    try {
      const projRef = doc(db, 'projects', newProjectId);
      const projPromise = setDoc(projRef, createdProject);

      // Seed initial starter tasks for the converted project
      const initialTask: Omit<Task, 'id'> = {
        projectId: newProjectId,
        title: `Kickoff & Architecture: ${projectData.title}`,
        description: `Project onboarded from CRM deal ${dealId}. Initialize multi-agent sprint planning.`,
        status: 'todo',
        priority: 'high',
        category: 'Client Interface',
        assignedAgent: 'Sentinel',
        creatorId: userUid,
        dueDate: 'Sprint 1',
        progress: 0,
        subtasks: [
          { id: 'sub-init-1', title: 'Review deal handover and requirements', completed: false, createdAt: new Date().toISOString() },
          { id: 'sub-init-2', title: 'Assign Sentinel and Worker subagents', completed: false, createdAt: new Date().toISOString() },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const taskPromise = addDoc(collection(db, 'projects', newProjectId, 'tasks'), initialTask);

      await Promise.race([
        Promise.all([projPromise, taskPromise]),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Sync timeout')), 1200))
      ]);
    } catch (err) {
      console.warn('Firestore project conversion saved to local context:', err);
    }

    // 2. Update Deal to Closed Won and set projectId
    await updateDeal(dealId, {
      stage: 'closed_won',
      projectId: newProjectId,
    });

    // 3. Update global project context
    setProjects((prev) => [createdProject, ...prev]);
    setCurrentProjectId(newProjectId);

    return newProjectId;
  }, [user, updateDeal, setProjects, setCurrentProjectId]);

  // ----------------------------------------------------
  // Contact Operations
  // ----------------------------------------------------

  const addContact = useCallback(async (contactData: Omit<Contact, 'id' | 'createdAt'>): Promise<string> => {
    const newId = `cnt-${Date.now().toString(36)}`;
    const newContact: Contact = {
      ...contactData,
      id: newId,
      createdAt: new Date().toISOString(),
    };

    setContacts((prev) => [newContact, ...prev]);

    try {
      const docRef = doc(db, 'contacts', newId);
      await setDoc(docRef, newContact);
    } catch (err) {
      console.warn('Firestore contact write fallback:', err);
    }

    return newId;
  }, []);

  const updateContact = useCallback(async (contactId: string, updates: Partial<Contact>) => {
    setContacts((prev) =>
      prev.map((c) => (c.id === contactId ? { ...c, ...updates } : c))
    );

    try {
      const docRef = doc(db, 'contacts', contactId);
      await updateDoc(docRef, { ...updates });
    } catch (err) {
      console.warn('Firestore contact update fallback:', err);
    }
  }, []);

  const deleteContact = useCallback(async (contactId: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== contactId));

    try {
      const docRef = doc(db, 'contacts', contactId);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('Firestore contact delete fallback:', err);
    }
  }, []);

  // ----------------------------------------------------
  // Lead Operations
  // ----------------------------------------------------

  const addLead = useCallback(async (leadData: Omit<Lead, 'id' | 'createdAt'>): Promise<string> => {
    const newId = `led-${Date.now().toString(36)}`;
    const newLead: Lead = {
      ...leadData,
      id: newId,
      createdAt: new Date().toISOString(),
    };

    setLeads((prev) => [newLead, ...prev]);

    try {
      const docRef = doc(db, 'leads', newId);
      await setDoc(docRef, newLead);
    } catch (err) {
      console.warn('Firestore lead write fallback:', err);
    }

    return newId;
  }, []);

  const updateLead = useCallback(async (leadId: string, updates: Partial<Lead>) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, ...updates } : l))
    );

    try {
      const docRef = doc(db, 'leads', leadId);
      await updateDoc(docRef, { ...updates });
    } catch (err) {
      console.warn('Firestore lead update fallback:', err);
    }
  }, []);

  const deleteLead = useCallback(async (leadId: string) => {
    setLeads((prev) => prev.filter((l) => l.id !== leadId));

    try {
      const docRef = doc(db, 'leads', leadId);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('Firestore lead delete fallback:', err);
    }
  }, []);

  // ----------------------------------------------------
  // Organization Operations
  // ----------------------------------------------------

  const addOrganization = useCallback(async (orgData: Omit<Organization, 'id' | 'createdAt'>): Promise<string> => {
    const newId = `org-${Date.now().toString(36)}`;
    const newOrg: Organization = {
      ...orgData,
      id: newId,
      createdAt: new Date().toISOString(),
    };

    setOrganizations((prev) => [newOrg, ...prev]);

    try {
      const docRef = doc(db, 'organizations', newId);
      await setDoc(docRef, newOrg);
    } catch (err) {
      console.warn('Firestore org write fallback:', err);
    }

    return newId;
  }, []);

  const updateOrganization = useCallback(async (orgId: string, updates: Partial<Organization>) => {
    setOrganizations((prev) =>
      prev.map((o) => (o.id === orgId ? { ...o, ...updates } : o))
    );

    try {
      const docRef = doc(db, 'organizations', orgId);
      await updateDoc(docRef, { ...updates });
    } catch (err) {
      console.warn('Firestore org update fallback:', err);
    }
  }, []);

  const deleteOrganization = useCallback(async (orgId: string) => {
    setOrganizations((prev) => prev.filter((o) => o.id !== orgId));

    try {
      const docRef = doc(db, 'organizations', orgId);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('Firestore org delete fallback:', err);
    }
  }, []);

  return {
    deals,
    contacts,
    leads,
    organizations,
    loading,
    error,
    addDeal,
    updateDeal,
    updateDealStage,
    deleteDeal,
    convertDealToProject,
    addContact,
    updateContact,
    deleteContact,
    addLead,
    updateLead,
    deleteLead,
    addOrganization,
    updateOrganization,
    deleteOrganization,
  };
};

export default useFirestoreCRM;
