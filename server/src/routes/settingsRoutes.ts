import { Router } from 'express';
import {
  getModuleSchemas,
  updateModuleSchema,
  getWorkflowRules,
  createWorkflowRule,
  deleteWorkflowRule,
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
settingsRouter.delete('/workflows/:id', deleteWorkflowRule);

// RBAC Profiles & Roles
settingsRouter.get('/profiles', getProfiles);
settingsRouter.get('/roles', getRoles);

// Email Templates & SMTP
settingsRouter.get('/email/templates', getEmailTemplates);
settingsRouter.get('/email/config', getEmailConfig);

export default settingsRouter;
