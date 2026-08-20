import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { TaskBoardPage } from './pages/TaskBoardPage';
import { CRMDealsPage } from './pages/CRMDealsPage';
import { CRMAccountsPage } from './pages/CRMAccountsPage';
import { CRMContactsPage } from './pages/CRMContactsPage';
import { GanttPage } from './pages/GanttPage';
import { McpServersPage } from './pages/McpServersPage';
import { renderSettingsRoutes } from './routes/settingsRoutes';
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
    if (path === '/crm/deals' || path === '/deals') {
      return { 
        title: 'Deals Pipeline', 
        subtitle: 'Kanban revenue stage tracking & automated project conversion engine' 
      };
    }
    if (path === '/crm/accounts') {
      return { 
        title: 'Client Accounts', 
        subtitle: 'Account firmographics, health monitoring & Account 360 overview' 
      };
    }
    if (path === '/crm/contacts' || path === '/crm') {
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
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-950 text-white space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-xs text-slate-400 font-mono">Initializing Antigravity 2.0 Platform & Firebase Auth...</p>
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
            <Route path="/board" element={<TaskBoardPage />} />
            <Route path="/tasks" element={<TaskBoardPage />} />
            
            {/* CRM Modular Routes */}
            <Route path="/crm/deals" element={<CRMDealsPage />} />
            <Route path="/deals" element={<CRMDealsPage />} />
            <Route path="/crm/accounts" element={<CRMAccountsPage />} />
            <Route path="/crm/contacts" element={<CRMContactsPage />} />
            <Route path="/crm" element={<CRMContactsPage />} />
            
            <Route path="/gantt" element={<GanttPage />} />
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
