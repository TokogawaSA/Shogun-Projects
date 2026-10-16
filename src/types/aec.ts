/**
 * Architectural Project Management (AEC) Domain Types
 * Adheres to /project-management-builder specifications
 */

export type ProjectPhaseType = 'SD' | 'DD' | 'CD' | 'CA' | string;

export type FeeModel =
  | 'FIXED_FEE_PHASE_CAP'
  | 'HOURLY_CAPPED'
  | 'PERCENTAGE_CONSTRUCTION_COST'
  | 'RETAINER_PASS_THROUGH';

export type RfiStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'RESPONDED' | 'CLOSED';

export type SubmittalStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'APPROVED_AS_NOTED'
  | 'REVISE_RESUBMIT'
  | 'REJECTED';

export type AecDiscipline =
  | 'Architectural'
  | 'Structural'
  | 'MEP'
  | 'Civil'
  | 'BIM / Computational'
  | 'Landscape'
  | 'Acoustic';

export type AecStaffRole =
  | 'Principal Architect'
  | 'Project Architect'
  | 'Registered Architect'
  | 'BIM Specialist / Tech'
  | 'Architectural Trainee'
  | 'Consultant Lead';

export interface AecTask {
  id: string;
  phaseId?: string;
  title: string;
  discipline: AecDiscipline | string;
  requiredRole: AecStaffRole | string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  isGatekeeper: boolean;
  prerequisiteTaskId?: string | null;
  estimatedHours?: number;
  actualHours?: number;
  dueDate?: string;
}

export interface AecPhase {
  id: string;
  projectId: string;
  phaseType: ProjectPhaseType;
  name?: string;
  order?: number;
  feeModel?: FeeModel;
  allocatedFee: number;
  spentFee: number;
  signOffDate?: string | null;
  signOffBy?: string | null;
  isCompleted: boolean;
  startDate?: string;
  targetDate?: string;
  tasks?: AecTask[];
}

export interface SheetVersion {
  id: string;
  revision: string; // e.g. "Rev 01"
  fileUrl?: string | null;
  markupUrl?: string | null; // e.g. Bluebeam Studio markup URL
  issueDate: string;
  notes?: string | null;
}

export interface DrawingSheet {
  id: string;
  projectId: string;
  sheetNumber: string; // e.g. "A-101"
  title: string; // e.g. "Ground Level Floor & Egress Plan"
  discipline: AecDiscipline | string;
  currentRevision: string; // e.g. "Rev 02"
  issueStatus: 'Issued for Review' | 'Permit Issue' | 'Issued for Construction' | 'Draft';
  versions: SheetVersion[];
}

export interface RfiItem {
  id: string;
  projectId: string;
  rfiNumber: number;
  subject: string;
  disciplineTag: string;
  question: string;
  response?: string | null;
  impactCost: boolean;
  impactSchedule: boolean;
  status: RfiStatus;
  submittedAt: string;
  dueDate: string; // Turnaround SLA deadline
  resolvedAt?: string | null;
}

export interface SubmittalItem {
  id: string;
  projectId: string;
  submittalNumber: number;
  title: string;
  specSection: string; // e.g. "08 44 00 - Curtain Wall"
  status: SubmittalStatus;
  dueDate: string;
  returnedDate?: string | null;
}

export interface PunchItem {
  id: string;
  item: string;
  status: 'open' | 'resolved';
}

export interface SitePhoto {
  caption: string;
  url: string;
}

export interface SiteReportItem {
  id: string;
  projectId: string;
  reportNumber: number;
  visitDate: string;
  weather?: string | null;
  attendees?: string[];
  observations: string;
  punchList?: PunchItem[];
  photos?: SitePhoto[];
}

export interface SubConsultant {
  id: string;
  projectId: string;
  consultantName: string;
  discipline: 'Structural' | 'MEP' | 'Acoustic' | 'Façade' | 'Civil' | string;
  allocatedBudget: number;
  invoicedAmount: number;
  contractStatus: 'active' | 'completed' | 'on_hold';
  notes?: string | null;
}

export interface StudioCapacityMember {
  userId: string;
  name: string;
  role: AecStaffRole | string;
  discipline: AecDiscipline | string;
  weeklyAllocations: {
    week: string;
    hours: number;
    isOverallocated?: boolean;
    projectSplit: { project: string; hours: number }[];
  }[];
}

export interface NetMultiplierReport {
  grossInvoicedFees: number;
  subConsultantPassThroughs: number;
  netRevenue: number;
  directLaborCost: number;
  currentMultiplier: number; // AEC Benchmark: 2.8x - 3.2x
  targetBenchmarkRange: { min: number; max: number };
  healthStatus: 'HEALTHY_ON_TARGET' | 'MODERATE_WATCH' | 'CRITICAL_UNDERPERFORMING';
  unbilledScopeHours: number;
  unbilledScopeCostRisk: number;
  projectBreakdown: {
    code: string;
    name: string;
    netRevenue: number;
    directLabor: number;
    multiplier: number;
    status: string;
  }[];
}
