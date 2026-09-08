/**
 * Enterprise Project Management Subsystem Domain Interfaces
 */

export interface WbsNode {
  id: string;
  projectId: string;
  title: string;
  wbsCode: string;
  status: 'todo' | 'in_progress' | 'review' | 'done' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedAgent?: string;
  estimatedHours?: number;
  actualHours?: number;
  assignee?: {
    id: string;
    displayName: string;
    email: string;
  };
  subtasks?: any[];
  children?: WbsNode[];
}

export interface CriticalPathData {
  projectId: string;
  criticalTaskIds: string[];
  criticalPathLengthHours: number;
  totalTasks: number;
}

export interface ResourceWorkloadItem {
  userId: string;
  userName: string;
  email: string;
  department: string;
  skills: string[];
  weeklyCapacityHours: number;
  assignedHours: number;
  utilizationPercent: number;
  hourlyCostRate: number;
  hourlyBillingRate: number;
  status: 'underallocated' | 'optimal' | 'overallocated';
}

export interface TimesheetItem {
  id: string;
  tenantId: string;
  userId: string;
  weekStartDate: string;
  totalHours: number;
  billableHours: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  rejectionNote?: string;
  user?: {
    displayName: string;
    email: string;
  };
  timeLogs?: any[];
}

export interface ProjectInvoiceItem {
  id: string;
  projectId: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  status: 'requested' | 'accepted' | 'paid';
  subtotal: number;
  taxTotal: number;
  totalAmount: number;
  lineItems?: any[];
  notes?: string;
}

export interface ProjectDocumentItem {
  id: string;
  projectId: string;
  fileName: string;
  fileUrl: string;
  fileCategory: 'spec' | 'design' | 'contract' | 'report' | 'general';
  fileSize: number;
  version: string;
  createdAt: string;
  uploadedBy?: {
    displayName: string;
  };
}

export interface WikiPageItem {
  id: string;
  projectId: string;
  title: string;
  slug: string;
  contentMarkdown: string;
  tags?: string[];
  updatedAt: string;
  author?: {
    displayName: string;
  };
}

export interface ClientChangeRequestItem {
  id: string;
  projectId: string;
  title: string;
  description: string;
  costImpact: number;
  scheduleDaysImpact: number;
  status: 'pending' | 'approved' | 'rejected';
  clientNotes?: string;
  createdAt: string;
}

export interface PmAnalyticsMetrics {
  projectId: string;
  progressPercent: number;
  completedTasks: number;
  totalTasks: number;
  plannedValue: number;
  earnedValue: number;
  actualCost: number;
  spi: number; // Schedule Performance Index
  cpi: number; // Cost Performance Index
  scheduleVarianceHours: number;
  costVarianceAmount: number;
  healthStatus: 'healthy' | 'warning' | 'critical';
}
