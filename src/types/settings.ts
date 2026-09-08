/**
 * VTiger-Style Settings & Administration Hub Type Definitions
 * Antigravity 2.0 Multi-Tenant Schema
 * 
 * Target collections:
 * - System Config: tenants/{tenantId}/config/system
 * - Roles & Profiles: tenants/{tenantId}/profiles & tenants/{tenantId}/roles
 * - Module Custom Fields & Layouts: tenants/{tenantId}/module_schemas/{moduleName}
 * - Workflow Rules: tenants/{tenantId}/workflows
 * - Email Configuration & Templates: tenants/{tenantId}/email_config & tenants/{tenantId}/templates
 */

// ==========================================
// Module Names & Base Identifiers
// ==========================================

export type SupportedModule = 'projects' | 'tasks' | 'accounts' | 'contacts' | 'deals';
export type ModuleName = SupportedModule | (string & {});
export type FieldName = string;

// ==========================================
// 1. System Config (tenants/{tenantId}/config/system)
// ==========================================

export interface CompanyDetails {
  name: string;
  domain: string;
  logoUrl?: string;
  timezone: string;
  currency: string;
  fiscalYearStart: string; // e.g. 'January' or '01-01'
}

export type ActiveModules = Record<SupportedModule, boolean> & Record<string, boolean>;

export interface AutoNumberingRule {
  prefix: string;
  nextNumber: number;
  padZeroes: number;
}

export type AutoNumberingConfig = Record<string, AutoNumberingRule>;

export interface SystemConfig {
  companyDetails: CompanyDetails;
  activeModules: ActiveModules;
  autoNumbering: AutoNumberingConfig;
  updatedAt?: string;
  updatedBy?: string;
}

// ==========================================
// 2. Roles & Profiles (tenants/{tenantId}/profiles & roles)
// ==========================================

export interface ModuleCrudPermissions {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

export type FieldPermissionLevel = 'read_write' | 'read_only' | 'hidden';

export interface Profile {
  id: string;
  name: string;
  description?: string;
  modulePermissions: Record<string, ModuleCrudPermissions>;
  fieldPermissions: Record<string, Record<FieldName, FieldPermissionLevel>>;
  createdAt?: string;
  updatedAt?: string;
}

export interface Role {
  id: string;
  name: string;
  parentRoleId: string | null;
  assignedProfileId: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ==========================================
// 3. Module Custom Fields & Layouts (tenants/{tenantId}/module_schemas/{moduleName})
// ==========================================

export type FieldType = 
  | 'text' 
  | 'number' 
  | 'picklist' 
  | 'date' 
  | 'boolean' 
  | 'user' 
  | 'currency';

export interface LayoutBlock {
  blockId: string;
  label: string;
  sortOrder: number;
  isCollapsible: boolean;
}

export interface CustomField {
  fieldId: string;
  blockId: string;
  label: string;
  type: FieldType;
  isRequired: boolean;
  isUnique: boolean;
  picklistValues?: string[];
  defaultValue?: any;
  sortOrder: number;
}

export interface ModuleSchema {
  moduleName: ModuleName;
  blocks: LayoutBlock[];
  fields: CustomField[];
  updatedAt?: string;
}

// ==========================================
// 4. Workflow Rules (tenants/{tenantId}/workflows)
// ==========================================

export type WorkflowConditionOperator = 
  | 'equals' 
  | 'not_equals' 
  | 'greater_than' 
  | 'less_than'
  | 'contains' 
  | 'starts_with'
  | 'is_empty'
  | 'is_not_empty';

export type ConditionOperator = WorkflowConditionOperator;

export interface WorkflowCondition {
  field: string;
  operator: WorkflowConditionOperator;
  value: any;
}

export type WorkflowTriggerType = 
  | 'on_create' 
  | 'on_update' 
  | 'on_stage_change' 
  | 'time_based_cron';

export interface SendEmailActionPayload {
  type: 'send_email';
  templateId?: string;
  recipientField?: string;
  customRecipient?: string;
  subject?: string;
  bodyHtml?: string;
  config?: {
    templateId?: string;
    recipientField?: string;
    customRecipient?: string;
    subject?: string;
    bodyHtml?: string;
  };
}

export interface CreateTaskActionPayload {
  type: 'create_task';
  title?: string;
  taskTitle?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent' | string;
  dueDaysFromTrigger?: number;
  dueInDays?: number;
  assignedUserId?: string;
  config?: {
    taskTitle?: string;
    title?: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent' | string;
    dueInDays?: number;
    dueDaysFromTrigger?: number;
    assignedUserId?: string;
  };
}

export interface UpdateFieldActionPayload {
  type: 'update_field';
  fieldName?: string;
  targetField?: string;
  value?: any;
  newValue?: any;
  config?: {
    targetField?: string;
    fieldName?: string;
    newValue?: any;
    value?: any;
  };
}

export interface CallWebhookActionPayload {
  type: 'call_webhook';
  url?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | string;
  headers?: Record<string, string>;
  payloadTemplate?: string;
  config?: {
    url?: string;
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | string;
    headers?: Record<string, string>;
    payloadTemplate?: string;
  };
}

export type WorkflowAction = 
  | SendEmailActionPayload 
  | CreateTaskActionPayload 
  | UpdateFieldActionPayload 
  | CallWebhookActionPayload;

export interface WorkflowRule {
  id: string;
  title?: string;
  name?: string;
  description?: string;
  targetModule: ModuleName;
  triggerType: WorkflowTriggerType;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  isActive: boolean;
  graphData?: any; // Intermediate Representation (IR): { trigger, nodes, edges }
  createdAt?: string;
  updatedAt?: string;
}

// ==========================================
// 5. Email Configuration & Templates (tenants/{tenantId}/email_config & templates)
// ==========================================

export type EmailProvider = 'smtp' | 'sendgrid' | 'mailgun';

export interface SmtpSettings {
  host: string;
  port: number;
  secure?: boolean;
  username: string;
  password?: string;
  encryption?: 'tls' | 'ssl' | 'none';
}

export interface EmailConfig {
  provider: EmailProvider;
  fromEmail?: string;
  senderEmail?: string;
  fromName?: string;
  senderName?: string;
  apiKey?: string;
  domain?: string;
  smtpSettings?: SmtpSettings;
  smtp?: SmtpSettings;
  updatedAt?: string;
  updatedBy?: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  module?: ModuleName;
  targetModule?: ModuleName;
  subject: string;
  bodyHtml?: string;
  htmlBody?: string;
  createdAt?: string;
  updatedAt?: string;
  updatedBy?: string;
}
