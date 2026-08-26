/**
 * Enterprise Project Portfolio Management (PPM) Schema & Types
 * Multi-Tenant Antigravity 2.0 Ecosystem
 */

// ==========================================
// 1. Portfolio & Strategy
// ==========================================

export interface Portfolio {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  strategicGoal: string;
  projectIds: string[];
  budgetAllocated: number;
  targetROI?: number;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 2. Resource Capacity & Skills
// ==========================================

export interface SkillMatrix {
  skillId: string;
  name: string;
  category: string;
}

export interface ResourceProfile {
  userId: string;
  tenantId: string;
  department: string;
  skills: string[];
  weeklyCapacityHours: number;
  hourlyCostRate: number;
  hourlyBillingRate: number;
  globalWorkloadHours: Record<string, number>;
}

// ==========================================
// 3. Financials & Multi-Tier Budgeting
// ==========================================

export interface ProjectBudget {
  projectId: string;
  tenantId: string;
  capexBudget: number;
  opexBudget: number;
  laborBudget: number;
  actualLaborCost: number;
  actualExpenses: number;
  currency: string;
  profitMarginPercent: number;
}

export type ExpenseCategory = 'labor' | 'software' | 'hardware' | 'travel' | 'other';

export type ExpenseStatus = 'pending' | 'approved' | 'rejected';

export interface ExpenseEntry {
  id: string;
  projectId: string;
  tenantId: string;
  category: ExpenseCategory;
  amount: number;
  incurredDate: string;
  approvedBy?: string;
  status: ExpenseStatus;
}

// ==========================================
// 4. Risk Management & Scale
// ==========================================

export type RiskCategory = 'financial' | 'operational' | 'technical' | 'schedule' | 'compliance';

export type RiskStatus = 'open' | 'mitigated' | 'closed';

export interface RiskItem {
  id: string;
  projectId: string;
  tenantId: string;
  title: string;
  description: string;
  category: RiskCategory;
  probability: number; // 1-5
  impact: number; // 1-5
  riskScore: number; // derived: prob * impact
  mitigationPlan: string;
  departmentDependencies: string[];
  status: RiskStatus;
  ownerId: string;
}

// ==========================================
// 5. Enterprise Analytics & Audit
// ==========================================

export interface AuditTrailEntry {
  id: string;
  tenantId: string;
  entityType: string;
  entityId: string;
  action: string;
  performedBy: string;
  previousState?: Record<string, any>;
  newState?: Record<string, any>;
  timestamp: string;
}
