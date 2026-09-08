import {
  WbsNode,
  CriticalPathData,
  ResourceWorkloadItem,
  TimesheetItem,
  ProjectInvoiceItem,
  ProjectDocumentItem,
  WikiPageItem,
  ClientChangeRequestItem,
  PmAnalyticsMetrics,
} from '../types';

const API_BASE = '/api/pm';

async function fetchApi<T>(endpoint: string, options?: RequestInit, fallbackData?: T): Promise<T> {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': 'tenant_default_shogun',
      },
      ...options,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    return body.data !== undefined ? body.data : body;
  } catch (err) {
    console.warn(`PM API warning for ${endpoint}:`, err);
    if (fallbackData !== undefined) return fallbackData;
    throw err;
  }
}

export const projectManagementService = {
  // 1. WBS & Kanban
  async getWbsItems(projectId?: string): Promise<WbsNode[]> {
    return fetchApi<WbsNode[]>(
      `/wbs${projectId ? `?projectId=${projectId}` : ''}`,
      {},
      [
        {
          id: 'wbs-1',
          projectId: 'p-1',
          title: 'System Architecture & Data Pipelines',
          wbsCode: '1.0',
          status: 'in_progress',
          priority: 'urgent',
          assignedAgent: 'Sentinel',
          estimatedHours: 40,
          actualHours: 28,
          children: [
            {
              id: 'wbs-1-1',
              projectId: 'p-1',
              title: 'Database Schema & Indexing',
              wbsCode: '1.1',
              status: 'done',
              priority: 'high',
              assignedAgent: 'Worker',
              estimatedHours: 16,
              actualHours: 16,
            },
            {
              id: 'wbs-1-2',
              projectId: 'p-1',
              title: 'REST API & Controller Pathways',
              wbsCode: '1.2',
              status: 'in_progress',
              priority: 'high',
              assignedAgent: 'Worker',
              estimatedHours: 24,
              actualHours: 12,
            },
          ],
        },
        {
          id: 'wbs-2',
          projectId: 'p-1',
          title: 'Frontend Component Architecture',
          wbsCode: '2.0',
          status: 'in_progress',
          priority: 'high',
          assignedAgent: 'Auditor',
          estimatedHours: 35,
          actualHours: 18,
          children: [
            {
              id: 'wbs-2-1',
              projectId: 'p-1',
              title: 'Design System & Navigation Shell',
              wbsCode: '2.1',
              status: 'done',
              priority: 'medium',
              assignedAgent: 'Human',
              estimatedHours: 15,
              actualHours: 14,
            },
            {
              id: 'wbs-2-2',
              projectId: 'p-1',
              title: '10 Sub-Module View Integrations',
              wbsCode: '2.2',
              status: 'in_progress',
              priority: 'urgent',
              assignedAgent: 'Worker',
              estimatedHours: 20,
              actualHours: 4,
            },
          ],
        },
      ]
    );
  },

  // 2. Critical Path
  async getCriticalPath(projectId: string): Promise<CriticalPathData> {
    return fetchApi<CriticalPathData>(`/projects/${projectId}/critical-path`, {}, {
      projectId,
      criticalTaskIds: ['wbs-1', 'wbs-1-2', 'wbs-2-2'],
      criticalPathLengthHours: 84,
      totalTasks: 6,
    });
  },

  // 3. Resource Capacity
  async getResourceWorkload(): Promise<ResourceWorkloadItem[]> {
    return fetchApi<ResourceWorkloadItem[]>('/resources/workload', {}, [
      {
        userId: 'usr-1',
        userName: 'Alex Mercer (Lead Systems Engineer)',
        email: 'alex@shogun.io',
        department: 'Engineering',
        skills: ['TypeScript', 'Prisma', 'System Design'],
        weeklyCapacityHours: 40,
        assignedHours: 38,
        utilizationPercent: 95,
        hourlyCostRate: 85,
        hourlyBillingRate: 150,
        status: 'optimal',
      },
      {
        userId: 'usr-2',
        userName: 'Elena Rostova (UI/UX Architect)',
        email: 'elena@shogun.io',
        department: 'Product Design',
        skills: ['React', 'TailwindCSS', 'Figma', 'UI Animation'],
        weeklyCapacityHours: 40,
        assignedHours: 46,
        utilizationPercent: 115,
        hourlyCostRate: 75,
        hourlyBillingRate: 135,
        status: 'overallocated',
      },
      {
        userId: 'usr-3',
        userName: 'David Vance (QA & Security Auditor)',
        email: 'david@shogun.io',
        department: 'Security & Compliance',
        skills: ['Security Audits', 'Jest', 'Cypress', 'Code Review'],
        weeklyCapacityHours: 40,
        assignedHours: 22,
        utilizationPercent: 55,
        hourlyCostRate: 90,
        hourlyBillingRate: 160,
        status: 'underallocated',
      },
    ]);
  },

  // 4. Timesheets
  async getTimesheets(): Promise<TimesheetItem[]> {
    return fetchApi<TimesheetItem[]>('/timesheets', {}, [
      {
        id: 'ts-101',
        tenantId: 'tenant_default_shogun',
        userId: 'usr-1',
        weekStartDate: '2026-08-25',
        totalHours: 40,
        billableHours: 35,
        status: 'submitted',
        user: { displayName: 'Alex Mercer', email: 'alex@shogun.io' },
      },
      {
        id: 'ts-102',
        tenantId: 'tenant_default_shogun',
        userId: 'usr-2',
        weekStartDate: '2026-08-25',
        totalHours: 42,
        billableHours: 40,
        status: 'approved',
        user: { displayName: 'Elena Rostova', email: 'elena@shogun.io' },
      },
    ]);
  },

  async updateTimesheetStatus(id: string, status: string, rejectionNote?: string): Promise<TimesheetItem> {
    return fetchApi<TimesheetItem>(`/timesheets/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, rejectionNote }),
    }, {
      id,
      tenantId: 'tenant_default_shogun',
      userId: 'usr-1',
      weekStartDate: '2026-08-25',
      totalHours: 40,
      billableHours: 35,
      status: status as any,
      rejectionNote,
    });
  },

  // 5. Invoices
  async getInvoices(): Promise<ProjectInvoiceItem[]> {
    return fetchApi<ProjectInvoiceItem[]>('/invoices', {}, [
      {
        id: 'inv-1001',
        projectId: 'p-1',
        invoiceNumber: 'INV-2026-089',
        issueDate: '2026-08-20',
        dueDate: '2026-09-20',
        status: 'requested',
        subtotal: 12500,
        taxTotal: 1250,
        totalAmount: 13750,
        notes: 'Milestone 1 Deliverables & Architecture Phase',
      },
      {
        id: 'inv-1002',
        projectId: 'p-1',
        invoiceNumber: 'INV-2026-074',
        issueDate: '2026-08-01',
        dueDate: '2026-08-31',
        status: 'paid',
        subtotal: 8000,
        taxTotal: 800,
        totalAmount: 8800,
        notes: 'Initial Project Retainer Deposit',
      },
    ]);
  },

  async updateInvoiceStatus(id: string, status: string): Promise<ProjectInvoiceItem> {
    return fetchApi<ProjectInvoiceItem>(`/invoices/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }, {
      id,
      projectId: 'p-1',
      invoiceNumber: 'INV-2026-089',
      issueDate: '2026-08-20',
      dueDate: '2026-09-20',
      status: status as any,
      subtotal: 12500,
      taxTotal: 1250,
      totalAmount: 13750,
    });
  },

  // 6. Documents
  async getDocuments(): Promise<ProjectDocumentItem[]> {
    return fetchApi<ProjectDocumentItem[]>('/documents', {}, [
      {
        id: 'doc-1',
        projectId: 'p-1',
        fileName: 'Project_Architecture_Blueprint_v2.pdf',
        fileUrl: '#',
        fileCategory: 'spec',
        fileSize: 4200000,
        version: '2.1',
        createdAt: '2026-08-28',
        uploadedBy: { displayName: 'Alex Mercer' },
      },
      {
        id: 'doc-2',
        projectId: 'p-1',
        fileName: 'Master_Services_Agreement_Signed.pdf',
        fileUrl: '#',
        fileCategory: 'contract',
        fileSize: 1800000,
        version: '1.0',
        createdAt: '2026-08-15',
        uploadedBy: { displayName: 'Elena Rostova' },
      },
    ]);
  },

  // 7. Wiki Pages
  async getWikiPages(): Promise<WikiPageItem[]> {
    return fetchApi<WikiPageItem[]>('/wikis', {}, [
      {
        id: 'wiki-1',
        projectId: 'p-1',
        title: 'Project Onboarding & Architecture Playbook',
        slug: 'project-onboarding-architecture',
        contentMarkdown: '# Welcome to Shogun Projects 2.0\n\nThis workspace defines our engineering standards, branch strategies, and agent routing policies.',
        tags: ['Onboarding', 'Architecture', 'Standards'],
        updatedAt: '2026-09-01',
        author: { displayName: 'Alex Mercer' },
      },
      {
        id: 'wiki-2',
        projectId: 'p-1',
        title: 'API Guidelines & Security Nonce Verification',
        slug: 'api-guidelines-security',
        contentMarkdown: '# REST API Standards\n\nAll REST pathways extend strict tenant isolation and permission callback filters.',
        tags: ['Security', 'REST API', 'Backend'],
        updatedAt: '2026-08-30',
        author: { displayName: 'David Vance' },
      },
    ]);
  },

  // 8. Client Portal & Change Requests
  async getChangeRequests(): Promise<ClientChangeRequestItem[]> {
    return fetchApi<ClientChangeRequestItem[]>('/change-requests', {}, [
      {
        id: 'cr-1',
        projectId: 'p-1',
        title: 'Add Real-Time Multi-Party Video Call Portal',
        description: 'Client requested integrated webRTC video conferencing in client portal view.',
        costImpact: 4500,
        scheduleDaysImpact: 7,
        status: 'pending',
        clientNotes: 'Urgent for board presentation on Sept 15.',
        createdAt: '2026-08-31',
      },
      {
        id: 'cr-2',
        projectId: 'p-1',
        title: 'Custom Financial PDF Export Layout',
        description: 'Formatted branded PDF report generation with corporate logo watermark.',
        costImpact: 1200,
        scheduleDaysImpact: 2,
        status: 'approved',
        clientNotes: 'Approved during sprint review.',
        createdAt: '2026-08-22',
      },
    ]);
  },

  // 9. Analytics & EVM
  async getAnalytics(projectId: string): Promise<PmAnalyticsMetrics> {
    return fetchApi<PmAnalyticsMetrics>(`/analytics/${projectId}`, {}, {
      projectId,
      progressPercent: 68,
      completedTasks: 17,
      totalTasks: 25,
      plannedValue: 45000,
      earnedValue: 42500,
      actualCost: 39800,
      spi: 0.94,
      cpi: 1.07,
      scheduleVarianceHours: 32,
      costVarianceAmount: 2700,
      healthStatus: 'healthy',
    });
  },
};
