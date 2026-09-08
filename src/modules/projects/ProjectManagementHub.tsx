import React, { useState } from 'react';
import { WbsKanbanView } from './views/WbsKanbanView';
import { InteractiveTimelineView } from './views/InteractiveTimelineView';
import { ResourceCapacityView } from './views/ResourceCapacityView';
import { TimeSheetBillingView } from './views/TimeSheetBillingView';
import { BudgetExpensesView } from './views/BudgetExpensesView';
import { RiskDeliverablesView } from './views/RiskDeliverablesView';
import { CollaborationWikiView } from './views/CollaborationWikiView';
import { ClientPortalView } from './views/ClientPortalView';
import { AnalyticsReportsView } from './views/AnalyticsReportsView';
import { AdminWorkflowView } from './views/AdminWorkflowView';

import {
  GitBranch,
  CalendarRange,
  Gauge,
  Clock,
  DollarSign,
  ShieldAlert,
  BookOpen,
  ExternalLink,
  BarChart3,
  Settings,
} from 'lucide-react';

export const ProjectManagementHub: React.FC = () => {
  const [activeDomain, setActiveDomain] = useState<number>(1);

  const tabs = [
    { id: 1, label: '1. WBS & Kanban', icon: GitBranch },
    { id: 2, label: '2. Gantt & Critical Path', icon: CalendarRange },
    { id: 3, label: '3. Resource Capacity', icon: Gauge },
    { id: 4, label: '4. Time & Timesheets', icon: Clock },
    { id: 5, label: '5. Budget & Invoices', icon: DollarSign },
    { id: 6, label: '6. Risk & Deliverables', icon: ShieldAlert },
    { id: 7, label: '7. Wiki & Docs', icon: BookOpen },
    { id: 8, label: '8. Client Portal', icon: ExternalLink },
    { id: 9, label: '9. Analytics & EVM', icon: BarChart3 },
    { id: 10, label: '10. Admin & Workflows', icon: Settings },
  ];

  return (
    <div className="space-y-6">
      {/* Top Domain Switcher Tabs */}
      <div className="bg-slate-900/80 border border-slate-800 p-2 rounded-2xl overflow-x-auto backdrop-blur-md shadow-lg">
        <div className="flex items-center gap-1.5 min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeDomain === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveDomain(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Render Active Domain View */}
      <div className="transition-all duration-200">
        {activeDomain === 1 && <WbsKanbanView />}
        {activeDomain === 2 && <InteractiveTimelineView />}
        {activeDomain === 3 && <ResourceCapacityView />}
        {activeDomain === 4 && <TimeSheetBillingView />}
        {activeDomain === 5 && <BudgetExpensesView />}
        {activeDomain === 6 && <RiskDeliverablesView />}
        {activeDomain === 7 && <CollaborationWikiView />}
        {activeDomain === 8 && <ClientPortalView />}
        {activeDomain === 9 && <AnalyticsReportsView />}
        {activeDomain === 10 && <AdminWorkflowView />}
      </div>
    </div>
  );
};

export default ProjectManagementHub;
