/**
 * Web Forms & Workflow Routing Type Definitions
 * Antigravity 2.0 Operations Suite - Shogun Projects
 */

export type FormFieldType =
  | 'text'
  | 'email'
  | 'phone'
  | 'number'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'textarea'
  | 'date';

export interface FormFieldOption {
  label: string;
  value: string;
}

export interface WebFormField {
  id: string;
  label: string;
  type: FormFieldType;
  placeholder?: string;
  defaultValue?: any;
  options?: FormFieldOption[];
  required: boolean;
  helpText?: string;
  width?: 'half' | 'full';
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'greater_than'
  | 'less_than'
  | 'is_empty'
  | 'is_not_empty'
  | 'in';

export interface FormConditionPredicate {
  fieldId: string;
  operator: ConditionOperator;
  value: any;
}

export type ConditionalActionType =
  | 'show'
  | 'hide'
  | 'require'
  | 'unrequire'
  | 'set_value';

export interface FormConditionalRule {
  id: string;
  targetFieldId: string;
  action: ConditionalActionType;
  setValue?: any;
  combinator: 'AND' | 'OR';
  conditions: FormConditionPredicate[];
}

export type TargetModuleType =
  | 'leads'
  | 'deals'
  | 'projects'
  | 'tasks'
  | 'accounts'
  | 'contacts';

export interface FormRoutingRuleAction {
  targetModule: TargetModuleType;
  fieldMappings: Record<string, string>; // e.g. { title: "{{project_title}}", email: "{{email}}", budget: "{{budget}}" }
  autoAssignUserId?: string;
  defaultStatus?: string;
  tags?: string[];
  triggerWorkflowId?: string; // Links to existing DAG/Linear WorkflowRule
  createSecondaryProject?: boolean; // When routing to deal, also auto-spin project workspace
  secondaryProjectName?: string;
}

export interface FormRoutingRule {
  id: string;
  name: string;
  description?: string;
  priority: number;
  combinator: 'AND' | 'OR';
  conditions: FormConditionPredicate[];
  action: FormRoutingRuleAction;
}

export interface FormRoutingConfig {
  defaultRoute: {
    targetModule: TargetModuleType;
    fieldMappings: Record<string, string>;
    triggerWorkflowId?: string;
    autoAssignUserId?: string;
    defaultStatus?: string;
    createSecondaryProject?: boolean;
    secondaryProjectName?: string;
  };
  conditionalRoutes: FormRoutingRule[];
}

export interface WebFormStyleConfig {
  primaryColor?: string;
  theme?: 'dark' | 'light';
  layout?: 'card' | 'minimal' | 'bordered';
  bannerUrl?: string;
}

export interface WebForm {
  id: string;
  tenantId: string;
  title: string;
  description: string;
  slug: string;
  status: 'published' | 'draft' | 'archived';
  fields: WebFormField[];
  conditionalRules: FormConditionalRule[];
  routing: FormRoutingConfig;
  styling?: WebFormStyleConfig;
  submitButtonText: string;
  successMessage: string;
  redirectUrl?: string;
  submissionsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface FormSubmissionRecord {
  id: string;
  formId: string;
  formTitle?: string;
  tenantId: string;
  data: Record<string, any>;
  routedModule: TargetModuleType;
  createdEntityIds: Array<{
    module: string;
    id: string;
    title: string;
    viewUrl?: string;
  }>;
  workflowExecuted?: boolean;
  workflowId?: string;
  workflowResult?: any;
  matchedRuleId?: string;
  matchedRuleName?: string;
  status: 'success' | 'warning' | 'failed';
  ip?: string;
  createdAt: string;
}

export interface FormEvaluationResult {
  visibility: Record<string, boolean>;
  required: Record<string, boolean>;
  values: Record<string, any>;
  activeRuleIds: string[];
}
