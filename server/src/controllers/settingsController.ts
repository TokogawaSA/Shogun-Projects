import { Request, Response } from 'express';
import { prisma } from '../config/db.js';
import { withTenantTx } from '../utils/tenantTx.js';

// ============================================================================
// 1. MODULE SCHEMAS & CUSTOM FIELDS
// ============================================================================

export async function getModuleSchemas(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.tenantContext!.tenantId;
    const schemas = await prisma.moduleSchema.findMany({
      where: { tenantId },
      include: { fields: true, blocks: true },
    });
    res.json(schemas);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch module schemas.', details: err.message });
  }
}

export async function updateModuleSchema(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.tenantContext!.tenantId;
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
    res.status(500).json({ error: 'Failed to update module schema.', details: err.message });
  }
}

// ============================================================================
// 2. WORKFLOW RULES
// ============================================================================

export async function getWorkflowRules(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.tenantContext!.tenantId;
    const rules = await prisma.workflowRule.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(rules);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch workflow rules.', details: err.message });
  }
}

export async function createWorkflowRule(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.tenantContext!.tenantId;
    const { title, description, targetModule, triggerType, conditions, actions, isActive } = req.body;

    const rule = await prisma.workflowRule.create({
      data: {
        tenantId,
        title,
        description,
        targetModule,
        triggerType,
        conditions: conditions || [],
        actions: actions || [],
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    });

    res.status(201).json(rule);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create workflow rule.', details: err.message });
  }
}

export async function deleteWorkflowRule(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.tenantContext!.tenantId;
    const { id } = req.params;

    await prisma.workflowRule.deleteMany({
      where: { id, tenantId },
    });

    res.json({ message: 'Workflow rule deleted successfully.', id });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete workflow rule.', details: err.message });
  }
}

// ============================================================================
// 3. PROFILES & ROLES HIERARCHY
// ============================================================================

export async function getProfiles(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.tenantContext!.tenantId;
    const profiles = await prisma.profile.findMany({
      where: { tenantId },
      include: { roles: true },
    });
    res.json(profiles);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch profiles.', details: err.message });
  }
}

export async function getRoles(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.tenantContext!.tenantId;
    const roles = await prisma.role.findMany({
      where: { tenantId },
      include: { profile: true, childRoles: true },
    });
    res.json(roles);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch roles.', details: err.message });
  }
}

// ============================================================================
// 4. EMAIL TEMPLATES & CONFIG
// ============================================================================

export async function getEmailTemplates(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.tenantContext!.tenantId;
    const templates = await prisma.emailTemplate.findMany({
      where: { tenantId },
    });
    res.json(templates);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch email templates.', details: err.message });
  }
}

export async function getEmailConfig(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.tenantContext!.tenantId;
    const config = await prisma.emailConfig.findUnique({
      where: { tenantId },
    });
    res.json(config || { provider: 'smtp', smtpSettings: {} });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch email configuration.', details: err.message });
  }
}
