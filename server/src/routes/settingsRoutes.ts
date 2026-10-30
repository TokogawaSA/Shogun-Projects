import { Router } from 'express';
import { requireTenantAdmin } from '../middleware/auth.js';
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
settingsRouter.post('/system', requireTenantAdmin, updateSystemConfig);
settingsRouter.put('/system', requireTenantAdmin, updateSystemConfig);

// 2. Module Schemas & Custom Fields
settingsRouter.get('/schemas', getModuleSchemas);
settingsRouter.get('/schemas/:moduleName', getModuleSchema);
settingsRouter.post('/schemas/:moduleName', requireTenantAdmin, updateModuleSchema);
settingsRouter.put('/schemas/:moduleName', requireTenantAdmin, updateModuleSchema);

// 3. Automation Workflows
settingsRouter.get('/workflows', getWorkflowRules);
settingsRouter.post('/workflows', requireTenantAdmin, createWorkflowRule);
settingsRouter.put('/workflows/:id', requireTenantAdmin, updateWorkflowRule);
settingsRouter.delete('/workflows/:id', requireTenantAdmin, deleteWorkflowRule);
settingsRouter.post('/workflows/execute', executeWorkflowRule);

// 4. RBAC Profiles & Roles
settingsRouter.get('/profiles', getProfiles);
settingsRouter.post('/profiles', requireTenantAdmin, createOrUpdateProfile);
settingsRouter.put('/profiles/:id', requireTenantAdmin, createOrUpdateProfile);

settingsRouter.get('/roles', getRoles);
settingsRouter.post('/roles', requireTenantAdmin, createOrUpdateRole);
settingsRouter.put('/roles/:id', requireTenantAdmin, createOrUpdateRole);
settingsRouter.delete('/roles/:id', requireTenantAdmin, deleteRole);

// 5. Tenant Users Management
settingsRouter.get('/users', getUsers);
settingsRouter.post('/users', requireTenantAdmin, createOrUpdateUser);
settingsRouter.put('/users/:id', requireTenantAdmin, createOrUpdateUser);

// 6. Outgoing Email Credentials & Transports
settingsRouter.get('/email', getEmailConfig);
settingsRouter.get('/email/config', getEmailConfig);
settingsRouter.post('/email', requireTenantAdmin, updateEmailConfig);
settingsRouter.put('/email', requireTenantAdmin, updateEmailConfig);
settingsRouter.post('/email/config', requireTenantAdmin, updateEmailConfig);
settingsRouter.post('/email/test', requireTenantAdmin, testEmailConnection);

// 7. Email Templates
settingsRouter.get('/templates', getEmailTemplates);
settingsRouter.get('/email/templates', getEmailTemplates);
settingsRouter.post('/templates', requireTenantAdmin, createOrUpdateEmailTemplate);
settingsRouter.put('/templates/:id', requireTenantAdmin, createOrUpdateEmailTemplate);
settingsRouter.delete('/templates/:id', requireTenantAdmin, deleteEmailTemplate);

export default settingsRouter;
