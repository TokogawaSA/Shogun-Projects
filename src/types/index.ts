/**
 * Core TypeScript Models & Interface Contracts for Project Management System
 */

export type UserRole = 'admin' | 'project_manager' | 'developer' | 'viewer';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole | string;
  createdAt: string;
  tenantId?: string;
  isTenantAdmin?: boolean;
  profileId?: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  organizationId: string;
  ownerId: string;
  members: string[]; // Array of UIDs
  createdAt: string;
  updatedAt: string;

  // Multi-tenant & CRM Linkage
  tenantId?: string;
  accountId?: string | null;
  dealId?: string | null;
  primaryContactId?: string | null;
}

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TaskCategory =
  | 'Client Interface'
  | 'State & Synchronization'
  | 'Serverless Compute'
  | 'Database & Identity'
  | 'Agentic Orchestration'
  | 'Edge Delivery';

export type AgentType = 'Sentinel' | 'Worker' | 'Auditor' | 'Human' | 'None';

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  assigneeId?: string;
  createdAt: string;
}

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

  // Subtasks list
  subtasks?: SubTask[];

  // Multi-Level Sub-Task Hierarchy (nested parent/child tree)
  parentTaskId?: string | null;

  // Milestones & Dependencies
  milestoneId?: string | null;
  predecessorTaskIds?: string[];

  // Time Tracking & Costing
  estimatedHours?: number;
  actualHours?: number; // derived from TimeLogs
  isRecurring?: boolean;
  recurrenceRule?: 'daily' | 'weekly' | 'monthly';
  timeLogs?: import('./catalogAndProjects').TimeLog[];

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

// ==========================================
// CRM Data Models (Backwards Compatible & Modular)
// ==========================================

export interface Organization {
  id: string;
  name: string;
  domain?: string;
  industry?: string;
  createdAt: string;
}

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'unqualified';

export interface Lead {
  id: string;
  name: string;
  email: string;
  company?: string;
  source?: string;
  status: LeadStatus;
  createdAt: string;
}

// Re-export CRM Modular types
export * from './crm';
export * from './settings';
export * from './ppm';
export * from './catalogAndProjects';
