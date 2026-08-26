import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { TaskBoardPage } from './pages/TaskBoardPage';
import { GanttChart } from './modules/projects/gantt/GanttChart';
import { McpServersPage } from './pages/McpServersPage';
import { renderSettingsRoutes } from './routes/settingsRoutes';
import { renderCrmRoutes } from './routes/crmRoutes';
import { renderPpmRoutes } from './routes/ppmRoutes';
import { renderCatalogRoutes } from './routes/catalogRoutes';
import { ProjectCosting } from './modules/projects/ProjectCosting';
import { MilestoneTracker } from './modules/projects/gantt/MilestoneTracker';
import { useAuth } from './context/AuthContext';
import { Loader2 } from 'lucide-react';

const AppLayout: React.FC = () => {
  const location = useLocation();
  const { loading: authLoading } = useAuth();
  const isSettingsActive = location.pathname.startsWith('/settings');

  const getPageInfo = () => {
    const path = location.pathname;
    if (path === '/projects') {
      return { 
        title: 'Projects Overview', 
        subtitle: 'Multi-agent project memberships & workspace registry' 
      };
    }
    if (path === '/board' || path === '/tasks') {
      return { 
        title: 'Kanban Task Board', 
        subtitle: 'Real-time collaborative task execution & Subtask checklist' 
      };
    }
    if (path.startsWith('/crm/leads')) {
      return { 
        title: 'Leads Management', 
        subtitle: 'VTiger prospect qualification, lead conversion & activity stream' 
      };
    }
    if (path.startsWith('/crm/deals') || path === '/deals') {
      return { 
        title: 'Deals & Revenue', 
        subtitle: 'Sales pipeline tracking, probability matrix & automated project conversion' 
      };
    }
    if (path.startsWith('/crm/accounts')) {
      return { 
        title: 'Client Accounts', 
        subtitle: 'Account firmographics, health monitoring & Account 360 overview' 
      };
    }
    if (path.startsWith('/crm/contacts')) {
      return { 
        title: 'Contacts Directory', 
        subtitle: 'Client stakeholder directory, lifecycle stages & project linkage' 
      };
    }
    if (path === '/gantt') {
      return { 
        title: 'Gantt Timeline', 
        subtitle: 'Project milestone scheduling & engineering pathways' 
      };
    }
    if (path === '/mcp') {
      return { 
        title: 'MCP Servers & Tools', 
        subtitle: 'Model Context Protocol server management' 
      };
    }
    if (path.startsWith('/ppm/financials/budget')) {
      return {
        title: 'Project Budget & Multi-Tier Tracker',
        subtitle: 'CapEx, OpEx & Labor cost variance monitoring and ceiling controls',
      };
    }
    if (path.startsWith('/ppm/financials/expenses')) {
      return {
        title: 'Expense Claims & Approvals',
        subtitle: 'Manager authorization workflows & project expense audit logging',
      };
    }
    if (path.startsWith('/ppm/financials')) {
      return {
        title: 'Portfolio Financial Intelligence',
        subtitle: 'Executive spend analytics, multi-tier budget variance & profit margins',
      };
    }
    if (path.startsWith('/ppm/risks/dependencies')) {
      return {
        title: 'Cross-Departmental Dependency Matrix',
        subtitle: 'Inter-team bottleneck analysis & critical-path risk propagation',
      };
    }
    if (path.startsWith('/ppm/risks/mitigation')) {
      return {
        title: 'Risk Mitigation & Action Tracker',
        subtitle: 'Active remediation workflows & action owner execution gates',
      };
    }
    if (path.startsWith('/ppm/risks')) {
      return {
        title: 'Enterprise Risk Register & Heatmap Matrix',
        subtitle: '5x5 Probability-Impact matrix scoring, critical escalation & threat controls',
      };
    }
    if (path.startsWith('/ppm/portfolio/strategic')) {
      return {
        title: 'Strategic Goal Alignment & ROI Mapping',
        subtitle: 'Corporate pillar alignment, target ROI projections & milestone delivery tracking',
      };
    }
    if (path.startsWith('/ppm/portfolio/audit')) {
      return {
        title: 'Enterprise Governance & Audit Trail Engine',
        subtitle: 'Immutable state mutations, field-level JSON state diffs & SOC 2 compliance verification',
      };
    }
    if (path.startsWith('/ppm/portfolio')) {
      return {
        title: 'Executive Portfolio Aggregator & Command Center',
        subtitle: 'High-level strategic portfolio umbrellas, cross-project budget rollups & ROI governance',
      };
    }
    if (path.startsWith('/ppm/resources/skills')) {
      return {
        title: 'Skill Matrix & Capability Registry',
        subtitle: 'Enterprise competency taxonomy, billing rate bands & resource profiles',
      };
    }
    if (path.startsWith('/ppm/resources')) {
      return {
        title: 'Resource Capacity & Workload Heatmap',
        subtitle: 'Real-time engineer workload bands, burnout risk indicators & task rebalancing',
      };
    }
    if (path === '/ppm') {
      return {
        title: 'Executive Portfolio Aggregator & Command Center',
        subtitle: 'High-level strategic portfolio umbrellas, cross-project budget rollups & ROI governance',
      };
    }
    if (path.includes('/milestones')) {
      return {
        title: 'Project Milestones & Deliverable Gates',
        subtitle: 'Strategic phase delivery gates, dynamic completion percentages & task groups',
      };
    }
    if (path.includes('/gantt')) {
      return {
        title: 'Interactive Gantt Timeline & Critical Path',
        subtitle: 'Finish-to-start dependency flow, duration bars & critical path calculation',
      };
    }
    if (path.includes('/costing')) {
      return {
        title: 'Project Deliverables & Revenue Costing',
        subtitle: 'Billable deliverables, catalog item margin tracking & milestone rollups',
      };
    }
    if (path.startsWith('/catalog/quotes')) {
      return {
        title: 'Interactive Quote Builder & Line Items',
        subtitle: 'Multi-tier PriceBook pricing, taxes, line item discounts & project scope conversion',
      };
    }
    if (path.startsWith('/catalog/price-books')) {
      return {
        title: 'Price Books & Tiers',
        subtitle: 'Enterprise customer tiers, partner discount matrices & rate overrides',
      };
    }
    if (path.startsWith('/catalog')) {
      return {
        title: 'Products & Services Catalog',
        subtitle: 'Hardware inventory, billable services, recurring SLA subscriptions & SKUs',
      };
    }
    if (path.startsWith('/settings')) {
      return { 
        title: 'Settings & Administration Hub', 
        subtitle: 'Tenant-isolated VTiger administration, workflows, schemas & access control' 
      };
    }
    return { 
      title: 'System Overview', 
      subtitle: 'Antigravity 2.0 dual-wield command center' 
    };
  };

  const { title, subtitle } = getPageInfo();

  if (authLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-xs text-slate-400 font-mono">Initializing Antigravity 2.0 Platform & Secure Auth...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header title={title} subtitle={subtitle} />
        <main className={isSettingsActive ? 'flex-1 overflow-hidden p-0' : 'flex-1 overflow-y-auto p-8'}>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:id/costing" element={<ProjectCosting />} />
            <Route path="/projects/costing" element={<ProjectCosting />} />
            <Route path="/projects/:id/milestones" element={<MilestoneTracker />} />
            <Route path="/projects/milestones" element={<MilestoneTracker />} />
            <Route path="/projects/:id/gantt" element={<GanttChart />} />
            <Route path="/projects/gantt" element={<GanttChart />} />
            <Route path="/board" element={<TaskBoardPage />} />
            <Route path="/tasks" element={<TaskBoardPage />} />
            
            {/* Enterprise PPM Routes */}
            {renderPpmRoutes()}

            {/* VTiger-Style Dynamic CRM Entity Routes */}
            {renderCrmRoutes()}

            {/* Products & Services Catalog Routes */}
            {renderCatalogRoutes()}
            
            <Route path="/gantt" element={<GanttChart />} />
            <Route path="/mcp" element={<McpServersPage />} />
            
            {/* VTiger-Style Settings & Administration Hub */}
            {renderSettingsRoutes()}
          </Routes>
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
};

export default App;
