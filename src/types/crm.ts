/**
 * Core CRM TypeScript Interfaces & Domain Models
 * Antigravity 2.0 Multi-Tenant Schema
 */

export type AccountTier = 'starter' | 'growth' | 'enterprise';
export type AccountStatus = 'prospect' | 'active_client' | 'churn_risk' | 'former_client';

export interface BillingDetails {
  currency: string;
  taxId?: string;
  billingEmail?: string;
  address?: string;
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface Account {
  id: string;
  tenantId: string;
  name: string;
  domain: string;
  industry: string;
  tier: AccountTier;
  status: AccountStatus;
  assignedOwnerId: string; // User UID
  billingDetails: BillingDetails;
  customFields?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export type ContactLifecycleStage = 'lead' | 'mql' | 'sql' | 'customer' | 'advocate';

export interface Contact {
  id: string;
  tenantId?: string;
  accountId?: string; // Foreign key to accounts
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  jobTitle?: string;
  isPrimaryContact?: boolean;
  lifecycleStage?: ContactLifecycleStage;
  lastContactedAt?: string | null;
  createdAt: string;
  updatedAt?: string;

  // Legacy field
  organizationId?: string;
}

export type PipelineStage = 
  | 'discovery' 
  | 'proposal' 
  | 'negotiation' 
  | 'closed_won' 
  | 'closed_lost'
  | 'prospecting'
  | 'qualification';

export type DealStage = PipelineStage; // Alias for compatibility

export interface Deal {
  id: string;
  tenantId?: string;
  title: string;
  accountId?: string;
  primaryContactId?: string;
  pipelineStage?: PipelineStage;
  value?: number;
  currency?: string;
  winProbability?: number; // 0-100
  expectedCloseDate?: string;
  linkedProjectId?: string | null; // Populated upon Closed-Won
  assignedRepId?: string;
  createdAt: string;
  updatedAt?: string;

  // Legacy fields alias
  amount?: number;
  stage?: PipelineStage | string;
  organizationId?: string;
  contactId?: string;
  projectId?: string;
}

export type RelatedEntityType = 'project' | 'deal' | 'account' | 'contact' | null;

export interface InboundLeadPayload {
  email: string;
  firstName: string;
  lastName: string;
  companyName: string;
  notes?: string;
  leadSource?: string;
  tenantId?: string;
}
