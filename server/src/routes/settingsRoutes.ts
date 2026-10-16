import { Router } from 'express';
import {
  getSystemConfig,
  updateSystemConfig,
  getModuleSchemas,
  getModuleSchema,
  updateModuleSchema,
  getWorkflowRules,
  createWorkflowRule,
  updateWorkflowRule,
  deleteWorkflowRule,
  executeWorkflowRule,
  getProfiles,
  createOrUpdateProfile,
  getRoles,
  createOrUpdateRole,
  deleteRole,
  getUsers,
  createOrUpdateUser,
  getEmailTemplates,
  createOrUpdateEmailTemplate,
  deleteEmailTemplate,
  getEmailConfig,
  updateEmailConfig,
  testEmailConnection,
} from '../controllers/settingsController.js';

export const settingsRouter = Router();

// 1. System Config (Branding, Fiscal, Modules, Numbering)
settingsRouter.get('/system', getSystemConfig);
settingsRouter.post('/system', updateSystemConfig);
settingsRouter.put('/system', updateSystemConfig);

// 2. Module Schemas & Custom Fields
settingsRouter.get('/schemas', getModuleSchemas);
settingsRouter.get('/schemas/:moduleName', getModuleSchema);
settingsRouter.post('/schemas/:moduleName', updateModuleSchema);
settingsRouter.put('/schemas/:moduleName', updateModuleSchema);

// 3. Automation Workflows
settingsRouter.get('/workflows', getWorkflowRules);
settingsRouter.post('/workflows', createWorkflowRule);
settingsRouter.put('/workflows/:id', updateWorkflowRule);
settingsRouter.delete('/workflows/:id', deleteWorkflowRule);
settingsRouter.post('/workflows/execute', executeWorkflowRule);

// 4. RBAC Profiles & Roles
settingsRouter.get('/profiles', getProfiles);
settingsRouter.post('/profiles', createOrUpdateProfile);
settingsRouter.put('/profiles/:id', createOrUpdateProfile);

settingsRouter.get('/roles', getRoles);
settingsRouter.post('/roles', createOrUpdateRole);
settingsRouter.put('/roles/:id', createOrUpdateRole);
settingsRouter.delete('/roles/:id', deleteRole);

// 5. Tenant Users Management
settingsRouter.get('/users', getUsers);
settingsRouter.post('/users', createOrUpdateUser);
settingsRouter.put('/users/:id', createOrUpdateUser);

// 6. Outgoing Email Credentials & Transports
settingsRouter.get('/email', getEmailConfig);
settingsRouter.get('/email/config', getEmailConfig);
settingsRouter.post('/email', updateEmailConfig);
settingsRouter.put('/email', updateEmailConfig);
settingsRouter.post('/email/config', updateEmailConfig);
settingsRouter.post('/email/test', testEmailConnection);

// 7. Email Templates
settingsRouter.get('/templates', getEmailTemplates);
settingsRouter.get('/email/templates', getEmailTemplates);
settingsRouter.post('/templates', createOrUpdateEmailTemplate);
settingsRouter.put('/templates/:id', createOrUpdateEmailTemplate);
settingsRouter.delete('/templates/:id', deleteEmailTemplate);

export default settingsRouter;
