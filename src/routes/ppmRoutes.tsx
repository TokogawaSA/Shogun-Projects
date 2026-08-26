/**
 * Enterprise PPM Route Registry
 * Multi-Tenant Antigravity 2.0 Ecosystem
 * 
 * Phase 3, 4, 5 & 6 Routes:
 * - /ppm/portfolio           -> PortfolioDashboard (Executive portfolio aggregator & health cards)
 * - /ppm/portfolio/strategic -> StrategicAlignment (Strategic goal alignment & ROI mapping)
 * - /ppm/portfolio/audit     -> AuditTrailViewer (Enterprise governance & JSON state diff engine)
 * - /ppm/resources           -> ResourceCapacityPlanner (Workload heatmap & capacity management)
 * - /ppm/resources/skills    -> SkillMatrixEditor (Skill matrices & resource profile rates)
 * - /ppm/financials          -> FinancialDashboard (Executive portfolio financial intelligence)
 * - /ppm/financials/budget   -> ProjectBudgetTracker (Multi-tier CapEx/OpEx/Labor tracker)
 * - /ppm/financials/expenses -> ExpenseManager (Expense logging & manager approval)
 * - /ppm/risks               -> RiskRegister (5x5 Risk matrix heatmap & register)
 * - /ppm/risks/matrix        -> RiskRegister (Direct heatmap matrix alias)
 * - /ppm/risks/dependencies  -> DependencyMatrix (Cross-departmental bottleneck matrix)
 * - /ppm/risks/mitigation    -> MitigationTracker (Active mitigation workflows & action plans)
 */

import { Route } from 'react-router-dom';
import { ResourceCapacityPlanner } from '../modules/ppm/resources/ResourceCapacityPlanner';
import { SkillMatrixEditor } from '../modules/ppm/resources/SkillMatrixEditor';
import { FinancialDashboard } from '../modules/ppm/financials/FinancialDashboard';
import { ProjectBudgetTracker } from '../modules/ppm/financials/ProjectBudgetTracker';
import { ExpenseManager } from '../modules/ppm/financials/ExpenseManager';
import { RiskRegister } from '../modules/ppm/risk/RiskRegister';
import { DependencyMatrix } from '../modules/ppm/risk/DependencyMatrix';
import { MitigationTracker } from '../modules/ppm/risk/MitigationTracker';
import { PortfolioDashboard } from '../modules/ppm/portfolio/PortfolioDashboard';
import { StrategicAlignment } from '../modules/ppm/portfolio/StrategicAlignment';
import { AuditTrailViewer } from '../modules/ppm/portfolio/AuditTrailViewer';

export const renderPpmRoutes = () => {
  return (
    <>
      {/* Executive Portfolio Hub & Governance */}
      <Route path="/ppm/portfolio" element={<PortfolioDashboard />} />
      <Route path="/ppm/portfolio/strategic" element={<StrategicAlignment />} />
      <Route path="/ppm/portfolio/audit" element={<AuditTrailViewer />} />

      {/* Resource Capacity & Workload Heatmap */}
      <Route path="/ppm/resources" element={<ResourceCapacityPlanner />} />
      <Route path="/ppm/resources/skills" element={<SkillMatrixEditor />} />

      {/* Multi-Tier Financials & Budget Controls */}
      <Route path="/ppm/financials" element={<FinancialDashboard />} />
      <Route path="/ppm/financials/budget" element={<ProjectBudgetTracker />} />
      <Route path="/ppm/financials/expenses" element={<ExpenseManager />} />

      {/* Enterprise Risk Management & Dependency Matrices */}
      <Route path="/ppm/risks" element={<RiskRegister />} />
      <Route path="/ppm/risks/matrix" element={<RiskRegister />} />
      <Route path="/ppm/risks/dependencies" element={<DependencyMatrix />} />
      <Route path="/ppm/risks/mitigation" element={<MitigationTracker />} />

      {/* Root PPM Alias -> Executive Portfolio Dashboard */}
      <Route path="/ppm" element={<PortfolioDashboard />} />
    </>
  );
};

export default renderPpmRoutes;
