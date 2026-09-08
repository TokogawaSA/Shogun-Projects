import { Request, Response } from 'express';
import { prisma } from '../config/db.js';
import { withTenantTx } from '../utils/tenantTx.js';

function getTenantId(req: Request): string | null {
  return (req.user || req.tenantContext)?.tenantId || null;
}

// ============================================================================
// 1. MODULE SCHEMAS & CUSTOM FIELDS
// ============================================================================

export async function getModuleSchemas(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      res.status(401).json({ error: 'Unauthorized: Missing tenant context.' });
      return;
    }
    const schemas = await prisma.moduleSchema.findMany({
      where: { tenantId },
      include: { fields: true, blocks: true },
    });
    res.json(schemas);
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to fetch module schemas.',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
  }
}

export async function updateModuleSchema(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      res.status(401).json({ error: 'Unauthorized: Missing tenant context.' });
      return;
    }
    const { moduleName } = req.params;

    const schema = await prisma.moduleSchema.upsert({
      where: {
        tenantId_moduleName: { tenantId, moduleName },
      },
      create: {
        tenantId,
        moduleName,
      },
      update: {},
      include: { fields: true, blocks: true },
    });

    res.json(schema);
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to update module schema.',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
  }
}

// ============================================================================
// 2. WORKFLOW RULES
// ============================================================================

export async function getWorkflowRules(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      res.status(401).json({ error: 'Unauthorized: Missing tenant context.' });
      return;
    }
    const rules = await prisma.workflowRule.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(rules);
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to fetch workflow rules.',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
  }
}

export async function createWorkflowRule(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      res.status(401).json({ error: 'Unauthorized: Missing tenant context.' });
      return;
    }
    const { id, title, name, description, targetModule, triggerType, conditions, actions, graphData, isActive } = req.body;

    const ruleTitle = title || name || 'New Automation Rule';

    let rule;
    if (id) {
      const existing = await prisma.workflowRule.findFirst({ where: { id, tenantId } });
      if (existing) {
        rule = await prisma.workflowRule.update({
          where: { id },
          data: {
            title: ruleTitle,
            description,
            targetModule,
            triggerType,
            conditions: conditions || [],
            actions: actions || [],
            graphData: graphData || null,
            isActive: isActive !== undefined ? Boolean(isActive) : true,
          },
        });
      }
    }

    if (!rule) {
      rule = await prisma.workflowRule.create({
        data: {
          id: id || undefined,
          tenantId,
          title: ruleTitle,
          description,
          targetModule,
          triggerType,
          conditions: conditions || [],
          actions: actions || [],
          graphData: graphData || null,
          isActive: isActive !== undefined ? Boolean(isActive) : true,
        },
      });
    }

    res.status(201).json(rule);
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to save workflow rule.',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
  }
}

export async function updateWorkflowRule(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      res.status(401).json({ error: 'Unauthorized: Missing tenant context.' });
      return;
    }
    const { id } = req.params;
    const { title, name, description, targetModule, triggerType, conditions, actions, graphData, isActive } = req.body;

    const rule = await prisma.workflowRule.updateMany({
      where: { id, tenantId },
      data: {
        title: title || name,
        description,
        targetModule,
        triggerType,
        conditions,
        actions,
        graphData,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      },
    });

    res.json({ message: 'Workflow updated successfully.', id, rule });
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to update workflow rule.',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
  }
}

export async function deleteWorkflowRule(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      res.status(401).json({ error: 'Unauthorized: Missing tenant context.' });
      return;
    }
    const { id } = req.params;

    await prisma.workflowRule.deleteMany({
      where: { id, tenantId },
    });

    res.json({ message: 'Workflow rule deleted successfully.', id });
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to delete workflow rule.',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
  }
}

export async function executeWorkflowRule(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const { workflow, payload } = req.body;

    const { executeWorkflow: runWorkflow } = await import('../workflows/workflowRunner.js');
    const result = await runWorkflow(workflow, { ...payload, tenantId });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to execute workflow rule.',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
  }
}

// ============================================================================
// 3. PROFILES & ROLES HIERARCHY
// ============================================================================

export async function getProfiles(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      res.status(401).json({ error: 'Unauthorized: Missing tenant context.' });
      return;
    }
    const profiles = await prisma.profile.findMany({
      where: { tenantId },
      include: { roles: true },
    });
    res.json(profiles);
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to fetch profiles.',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
  }
}

export async function getRoles(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      res.status(401).json({ error: 'Unauthorized: Missing tenant context.' });
      return;
    }
    const roles = await prisma.role.findMany({
      where: { tenantId },
      include: { profile: true, childRoles: true },
    });
    res.json(roles);
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to fetch roles.',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
  }
}

// ============================================================================
// 4. EMAIL TEMPLATES & CONFIG
// ============================================================================

export async function getEmailTemplates(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      res.status(401).json({ error: 'Unauthorized: Missing tenant context.' });
      return;
    }
    const templates = await prisma.emailTemplate.findMany({
      where: { tenantId },
    });
    res.json(templates);
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to fetch email templates.',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
  }
}

export async function getEmailConfig(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    if (!tenantId) {
      res.status(401).json({ error: 'Unauthorized: Missing tenant context.' });
      return;
    }
    const config = await prisma.emailConfig.findUnique({
      where: { tenantId },
    });
    res.json(config || { provider: 'smtp', smtpSettings: {} });
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to fetch email configuration.',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
  }
}

