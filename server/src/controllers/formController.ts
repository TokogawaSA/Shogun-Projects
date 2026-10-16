import { Request, Response } from 'express';
import {
  routeFormSubmission,
  getFormSubmissionsFromStore,
} from '../services/formRoutingService.js';
import { findMatchingRoutingRule } from '../utils/formConditionalEngine.js';

function getTenantId(req: Request): string {
  const userTenant = (req.user || (req as any).tenantContext)?.tenantId;
  return userTenant || (req.headers['x-tenant-id'] as string) || 'tenant-default';
}

// In-memory tenant web forms storage (persisted alongside tenant workflows)
const formsStore = new Map<string, any[]>();

// Seed default rich enterprise forms for tenant
function getInitialForms(tenantId: string): any[] {
  return [
    {
      id: 'form_project_intake_2026',
      tenantId,
      title: 'Commercial Client & Project Scoping Intake',
      description:
        'Interactive client onboarding form with conditional phase selection, budget qualification, and automated workflow routing to CRM Leads, Deals, or Projects.',
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
            { label: 'Full Lifecycle [SD + DD + CD + CA]', value: 'full_aec_cycle' },
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
                title: '{{company_name}} - Enterprise Delivery',
                description: '{{project_scope}} (Budget: ${{estimated_budget}})',
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
                title: 'AEC Architecture Contract: {{company_name}}',
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
      submissionsCount: 12,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'form_partner_vendor_2026',
      tenantId,
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
      submitButtonText: 'Register Partner Profile',
      successMessage: 'Partner credentials successfully received. Your record has been synchronized with our directory.',
      submissionsCount: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}

function getTenantForms(tenantId: string): any[] {
  if (!formsStore.has(tenantId)) {
    formsStore.set(tenantId, getInitialForms(tenantId));
  }
  return formsStore.get(tenantId)!;
}

export async function getForms(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const forms = getTenantForms(tenantId);
    res.json(forms);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve forms.', details: err.message });
  }
}

export async function getFormById(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const { id } = req.params;
    const forms = getTenantForms(tenantId);
    const form = forms.find((f) => f.id === id || f.slug === id);

    if (!form) {
      res.status(404).json({ error: 'Web form not found.' });
      return;
    }
    res.json(form);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve form.', details: err.message });
  }
}

export async function createForm(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const data = req.body;
    const forms = getTenantForms(tenantId);

    const newForm = {
      id: data.id || `form_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      tenantId,
      title: data.title || 'Untitled Web Form',
      description: data.description || '',
      slug: data.slug || `form-${Date.now()}`,
      status: data.status || 'published',
      fields: data.fields || [],
      conditionalRules: data.conditionalRules || [],
      routing: data.routing || {
        defaultRoute: { targetModule: 'leads', fieldMappings: {} },
        conditionalRoutes: [],
      },
      styling: data.styling || { primaryColor: '#6366f1', theme: 'dark', layout: 'card' },
      submitButtonText: data.submitButtonText || 'Submit Form',
      successMessage: data.successMessage || 'Form submitted successfully!',
      redirectUrl: data.redirectUrl || '',
      submissionsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    forms.unshift(newForm);
    res.status(201).json(newForm);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create form.', details: err.message });
  }
}

export async function updateForm(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const { id } = req.params;
    const data = req.body;
    const forms = getTenantForms(tenantId);
    const index = forms.findIndex((f) => f.id === id);

    if (index === -1) {
      res.status(404).json({ error: 'Web form not found.' });
      return;
    }

    forms[index] = {
      ...forms[index],
      ...data,
      id: forms[index].id,
      tenantId,
      updatedAt: new Date().toISOString(),
    };

    res.json(forms[index]);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update form.', details: err.message });
  }
}

export async function deleteForm(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const { id } = req.params;
    const forms = getTenantForms(tenantId);
    const updated = forms.filter((f) => f.id !== id);
    formsStore.set(tenantId, updated);
    res.json({ success: true, message: 'Web form deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete form.', details: err.message });
  }
}

export async function getFormSubmissions(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const { id } = req.params;
    const submissions = getFormSubmissionsFromStore(id, tenantId);
    res.json(submissions);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve submissions.', details: err.message });
  }
}

export async function simulateFormRoute(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const { form, submissionData } = req.body;

    if (!form || !submissionData) {
      res.status(400).json({ error: 'Missing form definition or submission payload.' });
      return;
    }

    const matchedRule = findMatchingRoutingRule(form.routing, submissionData);
    const selectedRoute = matchedRule ? matchedRule.action : form.routing?.defaultRoute;

    res.json({
      matchedRule: matchedRule ? { id: matchedRule.id, name: matchedRule.name } : null,
      targetModule: selectedRoute?.targetModule || 'leads',
      fieldMappings: selectedRoute?.fieldMappings || {},
      triggerWorkflowId: selectedRoute?.triggerWorkflowId || null,
      willCreateSecondaryProject: Boolean(selectedRoute?.createSecondaryProject),
      simulatedOutcome: `Will route submission to [${(selectedRoute?.targetModule || 'leads').toUpperCase()}] module with ${Object.keys(selectedRoute?.fieldMappings || {}).length} mapped fields.`,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Simulation failed.', details: err.message });
  }
}

// ============================================================================
// PUBLIC ANONYMOUS FORM ACCESS & INGESTION
// ============================================================================

export async function getPublicForm(req: Request, res: Response): Promise<void> {
  try {
    const { slugOrId } = req.params;

    // Search across tenants for published form matching slug or ID
    let matchedForm: any = null;
    for (const [_, forms] of formsStore.entries()) {
      const found = forms.find(
        (f) => (f.id === slugOrId || f.slug === slugOrId) && f.status === 'published'
      );
      if (found) {
        matchedForm = found;
        break;
      }
    }

    // If not found in memory, check initial forms
    if (!matchedForm) {
      const defaultForms = getInitialForms('tenant-default');
      matchedForm = defaultForms.find((f) => f.id === slugOrId || f.slug === slugOrId);
    }

    if (!matchedForm) {
      res.status(404).json({ error: 'Requested form is unavailable or unpublished.' });
      return;
    }

    // Return sanitized public definition (excludes internal tenant secrets)
    res.json({
      id: matchedForm.id,
      title: matchedForm.title,
      description: matchedForm.description,
      slug: matchedForm.slug,
      fields: matchedForm.fields,
      conditionalRules: matchedForm.conditionalRules,
      submitButtonText: matchedForm.submitButtonText,
      successMessage: matchedForm.successMessage,
      styling: matchedForm.styling,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load public form.', details: err.message });
  }
}

export async function submitPublicForm(req: Request, res: Response): Promise<void> {
  try {
    const { slugOrId } = req.params;
    const submissionData = req.body;

    let matchedForm: any = null;
    let foundTenantId = 'tenant-default';

    for (const [tId, forms] of formsStore.entries()) {
      const found = forms.find((f) => f.id === slugOrId || f.slug === slugOrId);
      if (found) {
        matchedForm = found;
        foundTenantId = tId;
        break;
      }
    }

    if (!matchedForm) {
      const defaultForms = getInitialForms('tenant-default');
      matchedForm = defaultForms.find((f) => f.id === slugOrId || f.slug === slugOrId);
    }

    if (!matchedForm) {
      res.status(404).json({ error: 'Form not found or no longer active.' });
      return;
    }

    // Increment submissions count
    matchedForm.submissionsCount = (matchedForm.submissionsCount || 0) + 1;

    // Execute full conditional workflow routing
    const clientIp = req.ip || (req.headers['x-forwarded-for'] as string);
    const routingResult = await routeFormSubmission({
      tenantId: foundTenantId,
      form: matchedForm,
      submissionData,
      clientIp,
    });

    res.json({
      success: true,
      message: matchedForm.successMessage,
      submissionId: routingResult.submissionId,
      routedModule: routingResult.routedModule,
      createdEntityIds: routingResult.createdEntityIds,
      redirectUrl: matchedForm.redirectUrl,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to process form submission.', details: err.message });
  }
}
