import { Router } from 'express';
import {
  getModuleSchemas,
  updateModuleSchema,
  getWorkflowRules,
  createWorkflowRule,
  updateWorkflowRule,
  deleteWorkflowRule,
  executeWorkflowRule,
  getProfiles,
  getRoles,
  getEmailTemplates,
  getEmailConfig,
} from '../controllers/settingsController.js';

export const settingsRouter = Router();

// Module Schemas & Layouts
settingsRouter.get('/schemas', getModuleSchemas);
settingsRouter.put('/schemas/:moduleName', updateModuleSchema);

// Workflows
settingsRouter.get('/workflows', getWorkflowRules);
settingsRouter.post('/workflows', createWorkflowRule);
settingsRouter.put('/workflows/:id', updateWorkflowRule);
settingsRouter.delete('/workflows/:id', deleteWorkflowRule);
settingsRouter.post('/workflows/execute', executeWorkflowRule);

// RBAC Profiles & Roles
settingsRouter.get('/profiles', getProfiles);
settingsRouter.get('/roles', getRoles);

// Email Templates & SMTP
settingsRouter.get('/email/templates', getEmailTemplates);
settingsRouter.get('/email/config', getEmailConfig);

export default settingsRouter;
