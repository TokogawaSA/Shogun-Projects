/**
 * Unified VTiger-Style CRM Types & Schema Definitions
 * Multi-Tenant Antigravity 2.0 Ecosystem
 * 
 * Supports:
 * - ISO temporal fields and dates
 * - 2-Column collapsible block layouts & dynamic field definitions
 * - Lead conversion payloads and transition records
 */

export type Timestamp = { seconds?: number; nanoseconds?: number; toDate?: () => Date; toMillis?: () => number; toISOString?: () => string } | string | Date;

// ==========================================
// 1. Entity Module & Discriminator Types
// ==========================================

export type EntityModuleName = 'leads' | 'accounts' | 'contacts' | 'deals';

export type Salutation = 'Mr.' | 'Ms.' | 'Mrs.' | 'Dr.' | 'Prof.' | string;

export type LeadSource = 
  | 'cold_call'
  | 'existing_customer'
  | 'self_generated'
  | 'employee'
  | 'partner'
  | 'public_relations'
  | 'direct_mail'
  | 'conference'
  | 'trade_show'
  | 'web_site'
  | 'word_of_mouth'
  | 'other'
  | string;

export type LeadEntityStatus = 
  | 'unqualified'
  | 'contacted'
  | 'pre_qualified'
  | 'attempted_contact'
  | 'converted'
  | 'lost';

export type LeadRating = 'hot' | 'warm' | 'cold' | string;

export type AccountEntityType = 
  | 'prospect'
  | 'customer'
  | 'partner'
  | 'vendor'
  | 'reseller'
  | string;

export type AccountRating = 'hot' | 'warm' | 'cold' | string;

export type DealStageType = 
  | 'prospecting'
  | 'qualification'
  | 'needs_analysis'
  | 'value_proposition'
  | 'proposal_price_quote'
  | 'negotiation_review'
  | 'closed_won'
  | 'closed_lost';

export type DealEntityType = 'new_business' | 'existing_business' | string;

// ==========================================
// 2. Base CRM Entity Interface
// ==========================================

export interface BaseCRMEntity {
  id: string;
  tenantId: string;
  assignedUserId: string;
  assignedUserName?: string;
  createdById: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  customFields?: Record<string, any>;
}

// ==========================================
// 3. Domain Entity Interfaces
// ==========================================

/**
 * Lead Entity Model
 * Represents raw inbound prospects before qualification and conversion.
 */
export interface LeadEntity extends BaseCRMEntity {
  leadNumber: string;
  salutation?: Salutation;
  firstName: string;
  lastName: string;
  company: string;
  title?: string;
  email: string;
  secondaryEmail?: string;
  phone?: string;
  mobile?: string;
  website?: string;
  leadSource: LeadSource;
  leadStatus: LeadEntityStatus;
  rating?: LeadRating;
  industry?: string;
  annualRevenue?: number;
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  description?: string;
  isConverted: boolean;
  convertedAccountId?: string;
  convertedContactId?: string;
  convertedDealId?: string;
  convertedAt?: Timestamp;
}

// Alias for standard domain use
export type Lead = LeadEntity;

/**
 * Account Entity Model
 * Represents business organizations, clients, vendors, and corporate accounts.
 */
export interface AccountEntity extends BaseCRMEntity {
  accountNumber: string;
  accountName: string;
  domain?: string;
  primaryPhone?: string;
  secondaryPhone?: string;
  email?: string;
  website?: string;
  industry: string;
  accountType: AccountEntityType;
  rating: AccountRating;
  annualRevenue?: number;
  
  // Billing Address
  billingStreet?: string;
  billingCity?: string;
  billingState?: string;
  billingPostalCode?: string;
  billingCountry?: string;

  // Shipping Address
  shippingStreet?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingPostalCode?: string;
  shippingCountry?: string;

  // South African B2B Procurement & Statutory Firmographics
  cipcRegistrationNumber?: string | null;
  vatRegistrationNumber?: string | null;
  bbbeeLevel?: number | null;
  bbbeeExpiryDate?: Timestamp | null;
  csdSupplierNumber?: string | null;

  // Relational aggregates
  linkedProjectCount?: number;
  activeDealCount?: number;
  description?: string;
}

// Alias for standard domain use
export type Account = AccountEntity;

/**
 * Contact Entity Model
 * Represents individual stakeholders and persons affiliated with an Account.
 */
export interface ContactEntity extends BaseCRMEntity {
  contactNumber: string;
  salutation?: Salutation;
  firstName: string;
  lastName: string;
  accountId: string;
  accountName?: string;
  email: string;
  secondaryEmail?: string;
  phone?: string;
  mobile?: string;
  jobTitle?: string;
  department?: string;
  reportsToContactId?: string;
  reportsToContactName?: string;

  // Mailing Address
  mailingStreet?: string;
  mailingCity?: string;
  mailingState?: string;
  mailingPostalCode?: string;
  mailingCountry?: string;

  isPrimaryContact: boolean;
  description?: string;
}

// Alias for standard domain use
export type Contact = ContactEntity;

/**
 * Deal (Opportunity) Entity Model
 * Represents commercial opportunities, sales pipeline deals, and revenue milestones.
 */
export interface DealEntity extends BaseCRMEntity {
  dealNumber: string;
  dealName: string;
  accountId: string;
  accountName?: string;
  contactId?: string;
  contactName?: string;
  amount: number;
  currency: string;
  closingDate: Timestamp;
  stage: DealStageType;
  probability: number;
  dealType: DealEntityType;
  leadSource?: LeadSource;
  linkedProjectId?: string;
  lostReason?: string;
  description?: string;
}

// Alias for standard domain use
export type Deal = DealEntity;

/**
 * Union type representing any CRM Entity
 */
export type CRMEntity = Lead | Account | Contact | Deal;

// ==========================================
// 4. VTiger-Style Block & Field Layout Schemas
// ==========================================

export type CRMFieldType = 
  | 'text'
  | 'textarea'
  | 'number'
  | 'currency'
  | 'picklist'
  | 'multi_picklist'
  | 'date'
  | 'datetime'
  | 'boolean'
  | 'email'
  | 'phone'
  | 'url'
  | 'user'
  | 'reference'
  | 'percentage';

export interface PicklistOption {
  label: string;
  value: string;
  color?: string;
  isDefault?: boolean;
}

export interface FieldDefinition {
  name: string;
  label: string;
  type: CRMFieldType;
  isRequired?: boolean;
  isUnique?: boolean;
  isReadOnly?: boolean;
  picklistValues?: PicklistOption[] | string[];
  defaultValue?: any;
  placeholder?: string;
  column: 1 | 2;
  sortOrder: number;
  referenceModule?: EntityModuleName;
  tooltip?: string;
  validationRegex?: string;
  step?: number;
  min?: number;
  max?: number;
}

export interface BlockLayout {
  id: string;
  label: string;
  sortOrder: number;
  isCollapsible: boolean;
  isCollapsedByDefault?: boolean;
  fields: FieldDefinition[];
}

export interface EntityLayoutConfig {
  moduleName: EntityModuleName;
  blocks: BlockLayout[];
}

// ==========================================
// 5. Query, Filter & List View Definitions
// ==========================================

export type FilterOperator = 
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'does_not_contain'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than'
  | 'less_than'
  | 'greater_or_equal'
  | 'less_or_equal'
  | 'is_empty'
  | 'is_not_empty'
  | 'in'
  | 'between';

export interface EntityFilterRule {
  id: string;
  field: string;
  operator: FilterOperator;
  value: any;
}

export interface EntityFilterGroup {
  conjunction: 'AND' | 'OR';
  rules: EntityFilterRule[];
}

export interface EntitySortOption {
  field: string;
  direction: 'asc' | 'desc';
}

export interface EntityPaginationState {
  page: number;
  pageSize: number;
  totalCount: number;
}

export interface EntityColumnConfig {
  field: string;
  label: string;
  width?: number;
  visible: boolean;
  sortable?: boolean;
}

// ==========================================
// 6. Lead Conversion Specification
// ==========================================

export interface LeadConversionOptions {
  leadId: string;
  tenantId: string;
  assignedUserId: string;

  // Account Conversion Rules
  createAccount: boolean;
  existingAccountId?: string;
  accountName?: string;
  industry?: string;

  // Contact Conversion Rules
  createContact: boolean;
  existingContactId?: string;
  isPrimaryContact?: boolean;

  // Deal (Opportunity) Conversion Rules
  createDeal: boolean;
  dealName?: string;
  dealAmount?: number;
  dealClosingDate?: Timestamp | string;
  dealStage?: DealStageType;

  // Migration & Record Linking
  transferRelatedRecords?: boolean;
  transferNotesAndFiles?: boolean;
}

export interface LeadConversionResult {
  success: boolean;
  leadId: string;
  accountId?: string;
  contactId?: string;
  dealId?: string;
  error?: string;
}

// ==========================================
// 7. Mass Actions & Audit Trail
// ==========================================

export interface MassEditPayload {
  moduleName: EntityModuleName;
  entityIds: string[];
  updates: Record<string, any>;
  tenantId: string;
}

export interface MassDeletePayload {
  moduleName: EntityModuleName;
  entityIds: string[];
  tenantId: string;
}

export interface EntityActivityLog {
  id: string;
  tenantId: string;
  moduleName: EntityModuleName;
  entityId: string;
  action: 'created' | 'updated' | 'deleted' | 'converted' | 'assigned' | 'mass_updated';
  userId: string;
  userName: string;
  timestamp: Timestamp;
  fieldChanges?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  description?: string;
}
