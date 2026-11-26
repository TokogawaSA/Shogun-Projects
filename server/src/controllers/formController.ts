import { Request, Response } from 'express';
import {
  routeFormSubmission,
  getFormSubmissionsFromStore,
} from '../services/formRoutingService.js';
import { findMatchingRoutingRule } from '../utils/formConditionalEngine.js';

function getTenantId(req: Request): string {
  const userTenant = (req.user || (req as any).tenantContext)?.tenantId || (req as any).tenantId;
  if (userTenant) return userTenant;
  if (process.env.NODE_ENV !== 'production') {
    return (req.headers['x-tenant-id'] as string) || 'tenant-default';
  }
  return '';
}

// In-memory tenant web forms storage (persisted alongside tenant workflows)
const formsStore = new Map<string, any[]>();

function getTenantForms(tenantId: string): any[] {
  if (!formsStore.has(tenantId)) {
    formsStore.set(tenantId, []);
  }
  return formsStore.get(tenantId)!;
}

export async function getForms(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const forms = getTenantForms(tenantId);
    res.json(forms);
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to retrieve forms.',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
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
    res.status(500).json({
      error: 'Failed to retrieve form.',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
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
    res.status(500).json({
      error: 'Failed to create form.',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
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
    res.status(500).json({
      error: 'Failed to update form.',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
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
    res.status(500).json({
      error: 'Failed to delete form.',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
  }
}

export async function getFormSubmissions(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const { id } = req.params;
    const submissions = getFormSubmissionsFromStore(id, tenantId);
    res.json(submissions);
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to retrieve submissions.',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
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
    res.status(500).json({
      error: 'Simulation failed.',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
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
    res.status(500).json({
      error: 'Failed to load public form.',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
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
    res.status(500).json({
      error: 'Failed to process form submission.',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
  }
}
