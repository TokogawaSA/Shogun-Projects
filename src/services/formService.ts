import { apiClient } from './api';
import {
  WebForm,
  FormSubmissionRecord,
} from '../types/form';
import {
  findMatchingRoutingRule,
  resolveFormMergeTags,
} from '../utils/formConditionalEngine';

const LOCAL_STORAGE_FORMS_KEY = 'shogun_web_forms_v1';
const LOCAL_STORAGE_SUBMISSIONS_KEY = 'shogun_form_submissions_v1';

// Seed default production-ready enterprise forms with full conditional logic & workflow routing
export const DEFAULT_ENTERPRISE_FORMS: WebForm[] = [
  {
    id: 'form_project_intake_2026',
    tenantId: 'tenant-default',
    title: 'Commercial Client & Project Scoping Intake',
    description:
      'Multi-stage interactive form with dynamic conditional logic (budget gates, AEC milestone phases, urgency levels) and automated workflow routing to CRM Leads, Deals, or Projects.',
    slug: 'project-intake',
    status: 'published',
    fields: [
      {
        id: 'client_name',
        label: 'Client / Contact Full Name',
        type: 'text',
        placeholder: 'e.g. Elena Rostova',
        required: true,
        width: 'half',
      },
      {
        id: 'email',
        label: 'Corporate Email Address',
        type: 'email',
        placeholder: 'elena@enterprise.com',
        required: true,
        width: 'half',
      },
      {
        id: 'company_name',
        label: 'Organization / Firm Name',
        type: 'text',
        placeholder: 'e.g. Apex Global Engineering',
        required: false,
        width: 'half',
      },
      {
        id: 'phone',
        label: 'Direct Phone Number',
        type: 'phone',
        placeholder: '+1 (555) 234-5678',
        required: false,
        width: 'half',
      },
      {
        id: 'inquiry_type',
        label: 'Inquiry & Engagement Type',
        type: 'select',
        required: true,
        width: 'full',
        options: [
          { label: 'New Enterprise Project (Design & Delivery)', value: 'new_project' },
          { label: 'Architectural / AEC Scoping (SD, DD, CD, CA)', value: 'aec_architectural' },
          { label: 'Ongoing Retainer & Support Escalation', value: 'support_task' },
          { label: 'General Partnership / Vendor Inquiry', value: 'general_inquiry' },
        ],
      },
      {
        id: 'estimated_budget',
        label: 'Estimated CapEx / Project Budget ($USD)',
        type: 'number',
        placeholder: 'e.g. 35000',
        required: false,
        width: 'half',
        helpText: 'Helps our team assign the appropriate executive project manager.',
      },
      {
        id: 'target_deadline',
        label: 'Target Completion Date',
        type: 'date',
        required: false,
        width: 'half',
      },
      {
        id: 'aec_phases',
        label: 'Required AEC Milestone Gates',
        type: 'select',
        required: false,
        width: 'full',
        options: [
          { label: 'Full Lifecycle Delivery [SD + DD + CD + CA]', value: 'full_aec_cycle' },
          { label: 'Schematic Design & Development Only [SD + DD]', value: 'design_only' },
          { label: 'Construction Administration Field Services [CA]', value: 'ca_field_only' },
        ],
      },
      {
        id: 'priority_level',
        label: 'Ticket Urgency & SLA Impact',
        type: 'select',
        required: false,
        width: 'half',
        options: [
          { label: 'Low - Advisory Question', value: 'low' },
          { label: 'Medium - Standard Follow-up', value: 'medium' },
          { label: 'High - Approaching Milestone', value: 'high' },
          { label: 'Urgent - System Blocker / Site Stop', value: 'urgent' },
        ],
      },
      {
        id: 'project_scope',
        label: 'Detailed Requirements & Project Brief',
        type: 'textarea',
        placeholder: 'Describe objectives, deliverable expectations, and site constraints...',
        required: true,
        width: 'full',
      },
    ],
    conditionalRules: [
      {
        id: 'rule_show_budget',
        targetFieldId: 'estimated_budget',
        action: 'show',
        combinator: 'OR',
        conditions: [
          { fieldId: 'inquiry_type', operator: 'equals', value: 'new_project' },
          { fieldId: 'inquiry_type', operator: 'equals', value: 'aec_architectural' },
        ],
      },
      {
        id: 'rule_show_deadline',
        targetFieldId: 'target_deadline',
        action: 'show',
        combinator: 'OR',
        conditions: [
          { fieldId: 'inquiry_type', operator: 'equals', value: 'new_project' },
          { fieldId: 'inquiry_type', operator: 'equals', value: 'aec_architectural' },
        ],
      },
      {
        id: 'rule_show_aec_phases',
        targetFieldId: 'aec_phases',
        action: 'show',
        combinator: 'AND',
        conditions: [
          { fieldId: 'inquiry_type', operator: 'equals', value: 'aec_architectural' },
        ],
      },
      {
        id: 'rule_require_aec_phases',
        targetFieldId: 'aec_phases',
        action: 'require',
        combinator: 'AND',
        conditions: [
          { fieldId: 'inquiry_type', operator: 'equals', value: 'aec_architectural' },
        ],
      },
      {
        id: 'rule_show_priority',
        targetFieldId: 'priority_level',
        action: 'show',
        combinator: 'AND',
        conditions: [
          { fieldId: 'inquiry_type', operator: 'equals', value: 'support_task' },
        ],
      },
    ],
    routing: {
      defaultRoute: {
        targetModule: 'leads',
        fieldMappings: {
          firstName: '{{client_name}}',
          company: '{{company_name}}',
          email: '{{email}}',
          phone: '{{phone}}',
          description: '{{project_scope}}',
        },
      },
      conditionalRoutes: [
        {
          id: 'route_high_value_project',
          name: 'VIP High-Budget Project Provisioning',
          priority: 100,
          combinator: 'AND',
          conditions: [
            { fieldId: 'inquiry_type', operator: 'equals', value: 'new_project' },
            { fieldId: 'estimated_budget', operator: 'greater_than', value: 20000 },
          ],
          action: {
            targetModule: 'projects',
            fieldMappings: {
              title: '{{company_name}} - Enterprise Delivery Workspace',
              description: '{{project_scope}} (CapEx: ${{estimated_budget}})',
            },
            createSecondaryProject: false,
            triggerWorkflowId: 'wf_deal_won_notify',
          },
        },
        {
          id: 'route_aec_architectural_deal',
          name: 'AEC Architectural Pipeline & Deal Matrix',
          priority: 80,
          combinator: 'AND',
          conditions: [
            { fieldId: 'inquiry_type', operator: 'equals', value: 'aec_architectural' },
          ],
          action: {
            targetModule: 'deals',
            fieldMappings: {
              title: 'AEC Architectural Contract: {{company_name}}',
              amount: '{{estimated_budget}}',
              description: 'Phases: {{aec_phases}}. Scope: {{project_scope}}',
            },
            createSecondaryProject: true,
            secondaryProjectName: 'AEC Delivery - {{company_name}}',
          },
        },
        {
          id: 'route_support_task',
          name: 'Urgent Task Dispatch to Project Backlog',
          priority: 60,
          combinator: 'AND',
          conditions: [
            { fieldId: 'inquiry_type', operator: 'equals', value: 'support_task' },
          ],
          action: {
            targetModule: 'tasks',
            fieldMappings: {
              title: 'Client Support: {{client_name}} ({{company_name}})',
              description: '{{project_scope}}',
              priority: '{{priority_level}}',
            },
            triggerWorkflowId: 'wf_task_escalation',
          },
        },
      ],
    },
    styling: {
      primaryColor: '#6366f1',
      theme: 'dark',
      layout: 'card',
    },
    submitButtonText: 'Submit Inquiry & Initialize Workflow',
    successMessage:
      'Thank you! Your inquiry has been routed into our operations matrix. A dedicated project manager and team lead have been assigned.',
    submissionsCount: 14,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'form_partner_vendor_2026',
    tenantId: 'tenant-default',
    title: 'Partner & Subconsultant Registration',
    description: 'Vendor qualification form routing verified partners into CRM Accounts and Contacts directories.',
    slug: 'partner-registration',
    status: 'published',
    fields: [
      {
        id: 'client_name',
        label: 'Authorized Representative',
        type: 'text',
        placeholder: 'Marcus Vance',
        required: true,
        width: 'half',
      },
      {
        id: 'company_name',
        label: 'Firm / Practice Legal Entity',
        type: 'text',
        placeholder: 'Vance Engineering Associates',
        required: true,
        width: 'half',
      },
      {
        id: 'email',
        label: 'Representative Email',
        type: 'email',
        required: true,
        width: 'half',
      },
      {
        id: 'specialty',
        label: 'Core Architectural / Engineering Discipline',
        type: 'select',
        required: true,
        width: 'half',
        options: [
          { label: 'Structural Engineering', value: 'structural' },
          { label: 'MEP / Electrical Systems', value: 'mep' },
          { label: 'Civil & Environmental', value: 'civil' },
          { label: 'General Contractor / CA Partner', value: 'gc' },
        ],
      },
      {
        id: 'project_scope',
        label: 'Overview of Firm Capabilities & Prior Project References',
        type: 'textarea',
        required: true,
        width: 'full',
      },
    ],
    conditionalRules: [],
    routing: {
      defaultRoute: {
        targetModule: 'leads',
        fieldMappings: {
          firstName: '{{client_name}}',
          company: '{{company_name}}',
          email: '{{email}}',
          description: 'Discipline: {{specialty}}. {{project_scope}}',
        },
      },
      conditionalRoutes: [],
    },
    styling: {
      primaryColor: '#8b5cf6',
      theme: 'dark',
      layout: 'card',
    },
    submitButtonText: 'Register Partner Profile',
    successMessage:
      'Partner credentials successfully received. Your record has been synchronized with our directory.',
    submissionsCount: 6,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function getStoredForms(): WebForm[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_FORMS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // fallback
  }
  return DEFAULT_ENTERPRISE_FORMS;
}

function setStoredForms(forms: WebForm[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_FORMS_KEY, JSON.stringify(forms));
  } catch {
    // ignore
  }
}

function getStoredSubmissions(formId?: string): FormSubmissionRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SUBMISSIONS_KEY);
    if (raw) {
      const parsed: FormSubmissionRecord[] = JSON.parse(raw);
      if (formId) return parsed.filter((s) => s.formId === formId);
      return parsed;
    }
  } catch {
    // fallback
  }
  return [];
}

function addStoredSubmission(record: FormSubmissionRecord) {
  try {
    const existing = getStoredSubmissions();
    existing.unshift(record);
    localStorage.setItem(LOCAL_STORAGE_SUBMISSIONS_KEY, JSON.stringify(existing.slice(0, 300)));
  } catch {
    // ignore
  }
}

export const formService = {
  async getForms(): Promise<WebForm[]> {
    try {
      const res = await apiClient.get<WebForm[]>('/forms');
      if (Array.isArray(res) && res.length > 0) {
        setStoredForms(res);
        return res;
      }
    } catch {
      // Fallback to local store
    }
    return getStoredForms();
  },

  async getFormById(idOrSlug: string): Promise<WebForm | null> {
    try {
      const res = await apiClient.get<WebForm>(`/forms/${idOrSlug}`);
      if (res && res.id) return res;
    } catch {
      // Fallback to local store
    }
    const local = getStoredForms().find((f) => f.id === idOrSlug || f.slug === idOrSlug);
    return local || null;
  },

  async createForm(form: Partial<WebForm>): Promise<WebForm> {
    try {
      const res = await apiClient.post<WebForm>('/forms', form);
      if (res && res.id) {
        const all = getStoredForms();
        setStoredForms([res, ...all]);
        return res;
      }
    } catch {
      // Local fallback
    }

    const newForm: WebForm = {
      id: form.id || `form_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      tenantId: form.tenantId || 'tenant-default',
      title: form.title || 'Untitled Web Form',
      description: form.description || '',
      slug: form.slug || `form-${Date.now()}`,
      status: form.status || 'published',
      fields: form.fields || [],
      conditionalRules: form.conditionalRules || [],
      routing: form.routing || {
        defaultRoute: { targetModule: 'leads', fieldMappings: {} },
        conditionalRoutes: [],
      },
      styling: form.styling || { primaryColor: '#6366f1', theme: 'dark', layout: 'card' },
      submitButtonText: form.submitButtonText || 'Submit Form',
      successMessage: form.successMessage || 'Form submitted successfully!',
      redirectUrl: form.redirectUrl || '',
      submissionsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const all = getStoredForms();
    setStoredForms([newForm, ...all]);
    return newForm;
  },

  async updateForm(id: string, updates: Partial<WebForm>): Promise<WebForm> {
    try {
      const res = await apiClient.put<WebForm>(`/forms/${id}`, updates);
      if (res && res.id) {
        const all = getStoredForms().map((f) => (f.id === id ? { ...f, ...res } : f));
        setStoredForms(all);
        return res;
      }
    } catch {
      // Local fallback
    }

    const all = getStoredForms();
    const index = all.findIndex((f) => f.id === id);
    if (index === -1) throw new Error('Form not found');

    const updated = {
      ...all[index],
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    };
    all[index] = updated;
    setStoredForms(all);
    return updated;
  },

  async deleteForm(id: string): Promise<boolean> {
    try {
      await apiClient.delete(`/forms/${id}`);
    } catch {
      // ignore
    }
    const all = getStoredForms().filter((f) => f.id !== id);
    setStoredForms(all);
    return true;
  },

  async getFormSubmissions(formId: string): Promise<FormSubmissionRecord[]> {
    try {
      const res = await apiClient.get<FormSubmissionRecord[]>(`/forms/${formId}/submissions`);
      if (Array.isArray(res) && res.length > 0) return res;
    } catch {
      // ignore
    }
    return getStoredSubmissions(formId);
  },

  async simulateRouting(
    form: WebForm,
    submissionData: Record<string, any>
  ): Promise<{
    matchedRule: any;
    targetModule: string;
    fieldMappings: Record<string, string>;
    triggerWorkflowId?: string;
    willCreateSecondaryProject?: boolean;
    simulatedOutcome: string;
  }> {
    try {
      const res = await apiClient.post(`/forms/${form.id}/simulate-route`, {
        form,
        submissionData,
      });
      if (res && res.targetModule) return res;
    } catch {
      // Local calculation fallback
    }

    const matchedRule = findMatchingRoutingRule(form.routing, submissionData);
    const selectedRoute = matchedRule ? matchedRule.action : form.routing?.defaultRoute;

    return {
      matchedRule: matchedRule ? { id: matchedRule.id, name: matchedRule.name } : null,
      targetModule: selectedRoute?.targetModule || 'leads',
      fieldMappings: selectedRoute?.fieldMappings || {},
      triggerWorkflowId: selectedRoute?.triggerWorkflowId,
      willCreateSecondaryProject: Boolean(selectedRoute?.createSecondaryProject),
      simulatedOutcome: `Will route submission to [${(selectedRoute?.targetModule || 'leads').toUpperCase()}] module with ${Object.keys(selectedRoute?.fieldMappings || {}).length} mapped fields.`,
    };
  },

  async submitPublicForm(
    slugOrId: string,
    submissionData: Record<string, any>
  ): Promise<{
    success: boolean;
    message: string;
    submissionId: string;
    routedModule?: string;
    createdEntityIds?: any[];
    redirectUrl?: string;
  }> {
    try {
      const res = await apiClient.post(`/forms/public/${slugOrId}/submit`, submissionData);
      if (res && res.success) {
        return res;
      }
    } catch {
      // Local simulated submission fallback
    }

    const form = await this.getFormById(slugOrId);
    if (!form) throw new Error('Form not found');

    const matchedRule = findMatchingRoutingRule(form.routing, submissionData);
    const selectedRoute = matchedRule ? matchedRule.action : form.routing.defaultRoute;
    const targetModule = selectedRoute.targetModule || 'leads';

    const submissionId = `sub_${Date.now()}`;
    const createdEntities = [
      {
        module: targetModule,
        id: `${targetModule.substring(0, 3)}_${Date.now()}`,
        title: resolveFormMergeTags(
          selectedRoute.fieldMappings?.title ||
            selectedRoute.fieldMappings?.company ||
            '{{client_name}}',
          submissionData
        ) || `${form.title} Submission`,
      },
    ];

    if (selectedRoute.createSecondaryProject) {
      createdEntities.push({
        module: 'projects',
        id: `prj_${Date.now()}`,
        title: `Project: ${submissionData.company_name || 'Delivery'}`,
      });
    }

    const record: FormSubmissionRecord = {
      id: submissionId,
      formId: form.id,
      formTitle: form.title,
      tenantId: form.tenantId,
      data: submissionData,
      routedModule: targetModule,
      createdEntityIds: createdEntities,
      workflowExecuted: Boolean(selectedRoute.triggerWorkflowId),
      workflowId: selectedRoute.triggerWorkflowId,
      matchedRuleId: matchedRule?.id,
      matchedRuleName: matchedRule?.name,
      status: 'success',
      createdAt: new Date().toISOString(),
    };

    addStoredSubmission(record);
    form.submissionsCount = (form.submissionsCount || 0) + 1;
    await this.updateForm(form.id, { submissionsCount: form.submissionsCount });

    return {
      success: true,
      message: form.successMessage,
      submissionId,
      routedModule: targetModule,
      createdEntityIds: createdEntities,
      redirectUrl: form.redirectUrl,
    };
  },
};
