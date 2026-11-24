/**
 * Products & Services Catalog & Expanded Projects/Tasks Schema Definitions
 * Multi-Tenant Antigravity 2.0 Ecosystem
 */

import { TaskStatus, TaskPriority, TaskCategory, AgentType, SubTask } from './index';

// ==========================================
// 1. Products & Services Catalog
// ==========================================

export type ProductOrServiceType = 'product' | 'service';

export type BillingFrequency = 'one_time' | 'monthly' | 'quarterly' | 'annual';

export interface ProductOrService {
  id: string;
  tenantId: string;
  type: ProductOrServiceType;
  sku: string;
  name: string;
  description?: string;
  unitPrice: number;
  costPrice: number;
  taxRatePercent: number;
  inventoryQty?: number;
  reorderLevel?: number;
  billingFrequency?: BillingFrequency;
  isActive: boolean;
  category?: string;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 2. Price Books & Line Items
// ==========================================

export type SaTaxMode = 'EXCLUSIVE' | 'INCLUSIVE' | 'ZERO_RATED' | 'EXEMPT';
export type SupportedQuoteCurrency = 'ZAR' | 'USD' | 'EUR' | 'GBP' | string;

export interface PriceBook {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  pricingRules: Record<string, number>;
  isDefault: boolean;
  currency?: SupportedQuoteCurrency;
  exchangeRateToZar?: number;
  rateLockedAt?: string | null;
  taxMode?: SaTaxMode;
  vatRate?: number;
  subtotalExclVat?: number;
  vatAmount?: number;
  totalInclVat?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface LineItem {
  id: string;
  productId: string;
  productName: string;
  type: ProductOrServiceType;
  quantity: number;
  unitPrice: number;
  costPrice?: number;
  sourceCurrency?: SupportedQuoteCurrency;
  baseForeignUnitPrice?: number;
  baseForeignCostPrice?: number;
  discountAmount: number;
  taxAmount: number;
  taxRatePercent?: number;
  totalPrice: number;
  notes?: string;
}

export type QuoteStatus = 'draft' | 'presented' | 'approved' | 'rejected' | 'converted';

export interface Quote {
  id: string;
  tenantId: string;
  quoteNumber: string;
  title: string;
  dealId?: string | null;
  accountId?: string | null;
  contactId?: string | null;
  projectId?: string | null;
  priceBookId?: string | null;
  status: QuoteStatus;
  lineItems: LineItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  totalCost?: number;
  marginAmount?: number;
  marginPercent?: number;
  currency?: SupportedQuoteCurrency;
  exchangeRateToZar?: number;
  rateLockedAt?: string | null;
  taxMode?: SaTaxMode;
  vatRate?: number;
  subtotalExclVat?: number;
  vatAmount?: number;
  totalInclVat?: number;
  validUntil?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type TaxInvoiceStatus = 'DRAFT' | 'ISSUED' | 'PARTIALLY_PAID' | 'PAID' | 'VOID';

export interface TaxInvoice {
  id: string;
  tenantId: string;
  invoiceNumber: string;
  accountId?: string | null;
  projectId?: string | null;
  quoteId?: string | null;
  status: TaxInvoiceStatus;
  currency: SupportedQuoteCurrency;
  subtotalExclVat: number;
  vatAmount: number;
  totalInclVat: number;
  amountPaid: number;
  dueDate: string;
  externalAccountingProvider?: 'SAGE_ZA' | 'XERO' | null;
  externalAccountingId?: string | null;
  lastSyncedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectDeliverable {
  id: string;
  projectId: string;
  tenantId: string;
  title: string;
  type: ProductOrServiceType;
  lineItemId?: string | null;
  productId?: string | null;
  sku?: string;
  milestoneId?: string | null;
  estimatedCost: number;
  billableAmount: number;
  profitMarginAmount: number;
  profitMarginPercent: number;
  status: 'planned' | 'in_progress' | 'delivered' | 'accepted';
  fulfilledDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 3. Expanded Projects & Milestones
// ==========================================

export type MilestoneStatus = 'pending' | 'in_progress' | 'completed';

export interface ProjectMilestone {
  id: string;
  projectId: string;
  tenantId: string;
  title: string;
  dueDate: string;
  status: MilestoneStatus;
  completionPercentage: number;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ==========================================
// 4. Expanded Tasks, Sub-Tasks & Time Tracking
// ==========================================

export interface TimeLog {
  id: string;
  taskId: string;
  userId: string;
  userName?: string;
  hoursLogged: number;
  date: string;
  description?: string;
  isBillable: boolean;
  hourlyRate?: number;
  createdAt?: string;
}

export type RecurrenceRule = 'daily' | 'weekly' | 'monthly';

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string;
  creatorId: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;

  // Subtasks list (flat checklist items)
  subtasks?: SubTask[];

  // Multi-Level Sub-Task Hierarchy (nested parent/child tree)
  parentTaskId?: string | null;

  // Milestones & Dependencies
  milestoneId?: string | null;
  predecessorTaskIds?: string[];

  // Time Tracking & Costing
  estimatedHours?: number;
  actualHours?: number; // derived from TimeLogs rollup
  timeLogs?: TimeLog[];

  // Recurring Tasks
  isRecurring?: boolean;
  recurrenceRule?: RecurrenceRule;

  // Catalog & Deliverable Linkage
  lineItemId?: string | null;

  // Optional extensions for UI state and telemetry
  category?: TaskCategory | string;
  assignedAgent?: AgentType | string;
  progress?: number;
  optimistic?: boolean;

  // CRM & Entity Relationship Linkage
  relatedEntityType?: 'project' | 'deal' | 'account' | 'contact' | null;
  relatedEntityId?: string | null;
}
