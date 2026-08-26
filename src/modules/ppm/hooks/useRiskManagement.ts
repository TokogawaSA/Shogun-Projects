import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../../services/api';
import { RiskItem, RiskStatus, Project } from '../../../types';

export interface DepartmentRiskStats {
  department: string;
  totalRisks: number;
  criticalRisks: number;
  risks: RiskItem[];
}

export interface RiskTotalsSummary {
  totalRisks: number;
  criticalCount: number; // >= 15
  highCount: number;     // 10-14
  mediumCount: number;   // 5-9
  lowCount: number;      // 1-4
  openCount: number;
  mitigatedCount: number;
  closedCount: number;
  averageRiskScore: number;
}

export interface UseRiskManagementReturn {
  risks: RiskItem[];
  projects: Project[];
  matrixGrid: Record<string, RiskItem[]>;
  departmentStats: Record<string, DepartmentRiskStats>;
  totals: RiskTotalsSummary;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  createRisk: (risk: Omit<RiskItem, 'id' | 'tenantId'>) => Promise<string>;
  updateRiskStatus: (riskId: string, status: RiskStatus) => Promise<void>;
  updateMitigationPlan: (riskId: string, mitigationPlan: string) => Promise<void>;
  deleteRisk: (riskId: string) => Promise<void>;
}

export const useRiskManagement = (): UseRiskManagementReturn => {
  const [risks, setRisks] = useState<RiskItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRiskData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [risksData, projsData] = await Promise.all([
        apiClient.get<RiskItem[]>('/ppm/risks').catch(() => []),
        apiClient.get<Project[]>('/projects').catch(() => []),
      ]);

      setRisks(risksData || []);
      setProjects(projsData || []);
    } catch (err: any) {
      console.warn('[useRiskManagement] REST fetch error:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRiskData();
  }, [fetchRiskData]);

  // Matrix Grid (Key: "prob_impact", e.g. "5_5")
  const matrixGrid: Record<string, RiskItem[]> = {};
  for (let p = 1; p <= 5; p++) {
    for (let i = 1; i <= 5; i++) {
      matrixGrid[`${p}_${i}`] = [];
    }
  }

  const departmentStats: Record<string, DepartmentRiskStats> = {};

  let criticalCount = 0;
  let highCount = 0;
  let mediumCount = 0;
  let lowCount = 0;
  let openCount = 0;
  let mitigatedCount = 0;
  let closedCount = 0;
  let scoreSum = 0;

  risks.forEach((risk) => {
    const key = `${risk.probability}_${risk.impact}`;
    if (matrixGrid[key]) {
      matrixGrid[key].push(risk);
    }

    const score = risk.riskScore || risk.probability * risk.impact;
    scoreSum += score;

    if (score >= 15) criticalCount++;
    else if (score >= 10) highCount++;
    else if (score >= 5) mediumCount++;
    else lowCount++;

    if (risk.status === 'open') openCount++;
    else if (risk.status === 'mitigated') mitigatedCount++;
    else if (risk.status === 'closed') closedCount++;

    const deptList = risk.departmentDependencies?.length ? risk.departmentDependencies : ['General'];
    deptList.forEach((dept) => {
      if (!departmentStats[dept]) {
        departmentStats[dept] = {
          department: dept,
          totalRisks: 0,
          criticalRisks: 0,
          risks: [],
        };
      }
      departmentStats[dept].totalRisks++;
      if (score >= 15) departmentStats[dept].criticalRisks++;
      departmentStats[dept].risks.push(risk);
    });
  });

  const totals: RiskTotalsSummary = {
    totalRisks: risks.length,
    criticalCount,
    highCount,
    mediumCount,
    lowCount,
    openCount,
    mitigatedCount,
    closedCount,
    averageRiskScore: risks.length > 0 ? Number((scoreSum / risks.length).toFixed(1)) : 0,
  };

  const createRisk = async (riskData: Omit<RiskItem, 'id' | 'tenantId'>): Promise<string> => {
    const res = await apiClient.post<RiskItem>('/ppm/risks', riskData);
    await fetchRiskData();
    return res.id;
  };

  const updateRiskStatus = async (riskId: string, status: RiskStatus): Promise<void> => {
    await apiClient.put(`/ppm/risks/${riskId}`, { status });
    await fetchRiskData();
  };

  const updateMitigationPlan = async (riskId: string, mitigationPlan: string): Promise<void> => {
    await apiClient.put(`/ppm/risks/${riskId}`, { mitigationPlan });
    await fetchRiskData();
  };

  const deleteRisk = async (riskId: string): Promise<void> => {
    setRisks((prev) => prev.filter((r) => r.id !== riskId));
  };

  return {
    risks,
    projects,
    matrixGrid,
    departmentStats,
    totals,
    loading,
    error,
    refresh: fetchRiskData,
    createRisk,
    updateRiskStatus,
    updateMitigationPlan,
    deleteRisk,
  };
};

export default useRiskManagement;
