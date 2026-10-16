import { apiClient } from './api';
import {
  AecPhase,
  DrawingSheet,
  RfiItem,
  SubmittalItem,
  SiteReportItem,
  SubConsultant,
  StudioCapacityMember,
  NetMultiplierReport,
} from '../types/aec';

// ==========================================
// Service Client Functions
// ==========================================

export const aecService = {
  async getPhases(projectId: string): Promise<AecPhase[]> {
    try {
      const data = await apiClient.get<AecPhase[]>(`/projects/${projectId}/phases`);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  async signOffPhase(phaseId: string, signOffBy: string): Promise<AecPhase> {
    return await apiClient.post<AecPhase>(`/projects/phases/${phaseId}/sign-off`, { signOffBy });
  },

  async getDrawings(projectId: string): Promise<DrawingSheet[]> {
    try {
      const data = await apiClient.get<DrawingSheet[]>(`/projects/${projectId}/drawings`);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  async createDrawing(projectId: string, sheetData: Partial<DrawingSheet>): Promise<DrawingSheet> {
    return await apiClient.post<DrawingSheet>(`/projects/${projectId}/drawings`, sheetData);
  },

  async getRfis(projectId: string): Promise<RfiItem[]> {
    try {
      const data = await apiClient.get<RfiItem[]>(`/projects/${projectId}/rfis`);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  async createRfi(projectId: string, rfiData: Partial<RfiItem>): Promise<RfiItem> {
    return await apiClient.post<RfiItem>(`/projects/${projectId}/rfis`, rfiData);
  },

  async respondToRfi(rfiId: string, response: string, status: string = 'RESPONDED'): Promise<any> {
    return await apiClient.put(`/projects/rfis/${rfiId}/respond`, { response, status });
  },

  async getSubmittals(projectId: string): Promise<SubmittalItem[]> {
    try {
      const data = await apiClient.get<SubmittalItem[]>(`/projects/${projectId}/submittals`);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  async getSiteReports(projectId: string): Promise<SiteReportItem[]> {
    try {
      const data = await apiClient.get<SiteReportItem[]>(`/projects/${projectId}/site-reports`);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  async createSiteReport(projectId: string, reportData: Partial<SiteReportItem>): Promise<SiteReportItem> {
    return await apiClient.post<SiteReportItem>(`/projects/${projectId}/site-reports`, reportData);
  },

  async getSubConsultants(projectId: string): Promise<SubConsultant[]> {
    try {
      const data = await apiClient.get<SubConsultant[]>(`/projects/${projectId}/subconsultants`);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  async getStudioCapacity(): Promise<{
    studioCapacityData: StudioCapacityMember[];
    overallocationThresholdHours: number;
    activeDisciplines: string[];
    totalStudioWeeklyCapacityHours: number;
  }> {
    try {
      const data = await apiClient.get('/ppm/studio-capacity');
      if (data && Array.isArray(data.studioCapacityData)) return data;
      return {
        studioCapacityData: [],
        overallocationThresholdHours: 40,
        activeDisciplines: ['Architectural', 'Structural', 'MEP', 'BIM / Computational', 'Civil'],
        totalStudioWeeklyCapacityHours: 0,
      };
    } catch {
      return {
        studioCapacityData: [],
        overallocationThresholdHours: 40,
        activeDisciplines: ['Architectural', 'Structural', 'MEP', 'BIM / Computational', 'Civil'],
        totalStudioWeeklyCapacityHours: 0,
      };
    }
  },

  async getStudioNetMultiplier(): Promise<NetMultiplierReport> {
    const defaultReport: NetMultiplierReport = {
      grossInvoicedFees: 0,
      subConsultantPassThroughs: 0,
      netRevenue: 0,
      directLaborCost: 0,
      currentMultiplier: 0,
      targetBenchmarkRange: { min: 2.8, max: 3.2 },
      healthStatus: 'HEALTHY_ON_TARGET',
      unbilledScopeHours: 0,
      unbilledScopeCostRisk: 0,
      projectBreakdown: [],
    };

    try {
      const data = await apiClient.get<NetMultiplierReport>('/ppm/net-multiplier');
      if (data && typeof data.currentMultiplier === 'number') return data;
      return defaultReport;
    } catch {
      return defaultReport;
    }
  },
};

export default aecService;
