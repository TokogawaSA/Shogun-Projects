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
import { apiClient } from './api';

async function fetchApi<T>(endpoint: string, options?: RequestInit, fallbackData?: T): Promise<T> {
  const method = options?.method?.toUpperCase() || 'GET';
  const url = `/pm${endpoint}`;
  const payload = options?.body ? (typeof options.body === 'string' ? JSON.parse(options.body) : options.body) : undefined;

  try {
    let result: any;
    if (method === 'POST') {
      result = await apiClient.post(url, payload);
    } else if (method === 'PUT') {
      result = await apiClient.put(url, payload);
    } else if (method === 'DELETE') {
      result = await apiClient.delete(url);
    } else {
      result = await apiClient.get(url);
    }
    return result?.data !== undefined ? result.data : result;
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
      []
    );
  },

  // 2. Critical Path
  async getCriticalPath(projectId: string): Promise<CriticalPathData> {
    return fetchApi<CriticalPathData>(`/projects/${projectId}/critical-path`, {}, {
      projectId,
      criticalTaskIds: [],
      criticalPathLengthHours: 0,
      totalTasks: 0,
    });
  },

  // 3. Resource Capacity
  async getResourceWorkload(): Promise<ResourceWorkloadItem[]> {
    return fetchApi<ResourceWorkloadItem[]>('/resources/workload', {}, []);
  },

  // 4. Timesheets
  async getTimesheets(): Promise<TimesheetItem[]> {
    return fetchApi<TimesheetItem[]>('/timesheets', {}, []);
  },

  async updateTimesheetStatus(id: string, status: string, rejectionNote?: string): Promise<TimesheetItem> {
    return fetchApi<TimesheetItem>(`/timesheets/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, rejectionNote }),
    });
  },

  // 5. Invoices
  async getInvoices(): Promise<ProjectInvoiceItem[]> {
    return fetchApi<ProjectInvoiceItem[]>('/invoices', {}, []);
  },

  async updateInvoiceStatus(id: string, status: string): Promise<ProjectInvoiceItem> {
    return fetchApi<ProjectInvoiceItem>(`/invoices/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  // 6. Documents
  async getDocuments(): Promise<ProjectDocumentItem[]> {
    return fetchApi<ProjectDocumentItem[]>('/documents', {}, []);
  },

  // 7. Wiki Pages
  async getWikiPages(): Promise<WikiPageItem[]> {
    return fetchApi<WikiPageItem[]>('/wikis', {}, []);
  },

  // 8. Client Portal & Change Requests
  async getChangeRequests(): Promise<ClientChangeRequestItem[]> {
    return fetchApi<ClientChangeRequestItem[]>('/change-requests', {}, []);
  },

  // 9. Analytics & EVM
  async getAnalytics(projectId: string): Promise<PmAnalyticsMetrics> {
    return fetchApi<PmAnalyticsMetrics>(`/analytics/${projectId}`, {}, {
      projectId,
      progressPercent: 0,
      completedTasks: 0,
      totalTasks: 0,
      plannedValue: 0,
      earnedValue: 0,
      actualCost: 0,
      spi: 1,
      cpi: 1,
      scheduleVarianceHours: 0,
      costVarianceAmount: 0,
      healthStatus: 'healthy',
    });
  },
};

export default projectManagementService;
