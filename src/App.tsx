import React from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectWorkspace } from './modules/projects';
import { McpServersPage } from './pages/McpServersPage';
import { renderSettingsRoutes } from './routes/settingsRoutes';
import { renderCrmRoutes } from './routes/crmRoutes';
import { renderPpmRoutes } from './routes/ppmRoutes';
import { renderCatalogRoutes } from './routes/catalogRoutes';
import { renderPmRoutes } from './routes/projectManagementRoutes';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { PublicWebFormPage } from './pages/PublicWebFormPage';
import { useAuth } from './context/AuthContext';
import { Loader2 } from 'lucide-react';

const AppLayout: React.FC = () => {
  const location = useLocation();
  const { loading: authLoading } = useAuth();
  const isSettingsActive = location.pathname.startsWith('/settings');
  const isAuthRoute = location.pathname === '/login' || location.pathname === '/register';

  const getPageInfo = () => {
    const path = location.pathname;
    if (path === '/projects' || path === '/portfolio') {
      return { 
        title: 'Projects & Portfolio Vitals', 
        subtitle: 'Zoho-model multi-project aggregator, lifecycle stages & active workspaces' 
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
    if (path.startsWith('/ppm')) {
      return {
        title: 'Project Workspace & Modular AEC Engine',
        subtitle: 'Phase-gated [SD/DD/CD/CA] delivery, drawings, CA RFIs & admin-modular tabs',
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
    if (path.startsWith('/pm') || (path.startsWith('/projects/') && !path.includes('/costing') && !path.includes('/milestones') && !path.includes('/gantt'))) {
      return {
        title: 'Project Workspace & Modular AEC Engine',
        subtitle: 'Phase-gated [SD/DD/CD/CA] delivery, drawings, CA RFIs & admin-modular tabs',
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
    if (path.startsWith('/settings/automation/forms')) {
      return { 
        title: 'Web Forms & Workflow Routing', 
        subtitle: 'Dynamic web forms with full conditional logic matrix and automated routing to CRM & Projects' 
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

  const isPublicFormRoute = location.pathname.startsWith('/forms/') || location.pathname.startsWith('/public/forms/');

  const { title, subtitle } = getPageInfo();

  if (isPublicFormRoute) {
    return (
      <Routes>
        <Route path="/forms/:formId" element={<PublicWebFormPage />} />
        <Route path="/public/forms/:formId" element={<PublicWebFormPage />} />
      </Routes>
    );
  }

  if (authLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-xs text-slate-400 font-mono">Initializing Antigravity 2.0 Platform & Secure Auth...</p>
      </div>
    );
  }

  if (isAuthRoute) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
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
            <Route path="/portfolio" element={<ProjectsPage />} />
            <Route path="/projects/:id" element={<ProjectWorkspace />} />
            <Route path="/projects/:id/workspace" element={<ProjectWorkspace />} />
            <Route path="/projects/:id/*" element={<ProjectWorkspace />} />
            <Route path="/projects/costing" element={<Navigate to="/projects" replace />} />
            <Route path="/projects/milestones" element={<Navigate to="/projects" replace />} />
            <Route path="/projects/gantt" element={<Navigate to="/projects" replace />} />
            <Route path="/gantt" element={<Navigate to="/projects" replace />} />
            
            {/* General Project Management Routes */}
            {renderPmRoutes()}

            {/* Enterprise PPM Routes */}
            {renderPpmRoutes()}

            {/* VTiger-Style Dynamic CRM Entity Routes */}
            {renderCrmRoutes()}

            {/* Products & Services Catalog Routes */}
            {renderCatalogRoutes()}
            
            <Route path="/mcp" element={<McpServersPage />} />
            <Route path="/forms" element={<Navigate to="/settings/automation/forms" replace />} />
            
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
