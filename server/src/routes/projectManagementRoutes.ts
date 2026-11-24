import { Router } from 'express';
import {
  getWbsItems,
  getCriticalPath,
  cascadeProjectSchedule,
  getResourceWorkload,
  getTimesheets,
  submitTimesheet,
  updateTimesheetStatus,
  getInvoices,
  generateInvoice,
  updateInvoiceStatus,
  getDocuments,
  createDocument,
  getWikiPages,
  upsertWikiPage,
  getClientPortalData,
  createChangeRequest,
  updateChangeRequestStatus,
  getAnalyticsMetrics,
  evaluateWorkflowRules,
} from '../controllers/projectManagementController.js';

export const projectManagementRouter = Router();

// 1. Task & WBS
projectManagementRouter.get('/wbs', getWbsItems);

// 2. Gantt & Critical Path
projectManagementRouter.get('/projects/:projectId/critical-path', getCriticalPath);
projectManagementRouter.post('/projects/:projectId/schedule/cascade', cascadeProjectSchedule);

// 3. Resource Workload & Capacity
projectManagementRouter.get('/resources/workload', getResourceWorkload);

// 4. Time Tracking & Timesheets
projectManagementRouter.get('/timesheets', getTimesheets);
projectManagementRouter.post('/timesheets/submit', submitTimesheet);
projectManagementRouter.put('/timesheets/:id/status', updateTimesheetStatus);

// 5. Financial Invoices
projectManagementRouter.get('/invoices', getInvoices);
projectManagementRouter.post('/invoices/generate', generateInvoice);
projectManagementRouter.put('/invoices/:id/status', updateInvoiceStatus);

// 6. Documents & File Sync
projectManagementRouter.get('/documents', getDocuments);
projectManagementRouter.post('/documents', createDocument);

// 7. Wiki & Shared Workspaces
projectManagementRouter.get('/wikis', getWikiPages);
projectManagementRouter.post('/wikis', upsertWikiPage);

// 8. Client Portal & Change Requests
projectManagementRouter.get('/client-portal/:projectId', getClientPortalData);
projectManagementRouter.post('/change-requests', createChangeRequest);
projectManagementRouter.put('/change-requests/:id/status', updateChangeRequestStatus);

// 9. Analytics & Dashboards
projectManagementRouter.get('/analytics/:projectId', getAnalyticsMetrics);

// 10. Workflow Engine
projectManagementRouter.post('/workflows/evaluate', evaluateWorkflowRules);

export default projectManagementRouter;
