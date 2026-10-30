import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import { prisma } from '../config/db.js';
import { withTenantTx } from '../utils/tenantTx.js';

function getTenantId(req: Request): string {
  const tenantId = (req.user || req.tenantContext)?.tenantId || req.tenantId;
  if (!tenantId) {
    throw new Error('Unauthorized: Missing verified tenant context.');
  }
  return tenantId;
}

// Default seed configurations for system settings
const DEFAULT_COMPANY_DETAILS = {
  name: 'Shogunate Solutions LLC',
  domain: 'shogunate.dev',
  logoUrl: 'https://shogunate.dev/logo.png',
  timezone: 'UTC+02:00 (Europe/Berlin)',
  currency: 'USD ($)',
  fiscalYearStart: 'January',
};

const DEFAULT_ACTIVE_MODULES = {
  projects: true,
  tasks: true,
  accounts: true,
  contacts: true,
  deals: true,
};

const DEFAULT_AUTO_NUMBERING = {
  deals: { prefix: 'DEAL-', nextNumber: 1001, padZeroes: 5 },
  projects: { prefix: 'PRJ-', nextNumber: 2001, padZeroes: 4 },
  accounts: { prefix: 'ACC-', nextNumber: 5001, padZeroes: 4 },
  contacts: { prefix: 'CON-', nextNumber: 8001, padZeroes: 4 },
  tasks: { prefix: 'TSK-', nextNumber: 9001, padZeroes: 5 },
};

// ============================================================================
// 1. SYSTEM CONFIG (Branding, Active Modules, Auto-Numbering, Fiscal)
// ============================================================================

export async function getSystemConfig(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const config = await prisma.systemConfig.findUnique({
      where: { tenantId },
    });

    if (config) {
      res.json(config);
      return;
    }

    res.json({
      tenantId,
      companyDetails: DEFAULT_COMPANY_DETAILS,
      activeModules: DEFAULT_ACTIVE_MODULES,
      autoNumbering: DEFAULT_AUTO_NUMBERING,
      updatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to fetch system configuration.',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
  }
}

export async function updateSystemConfig(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const { companyDetails, activeModules, autoNumbering, updatedBy } = req.body;

    const existing = await prisma.systemConfig.findUnique({ where: { tenantId } });

    const mergedCompany = {
      ...(existing?.companyDetails as any || DEFAULT_COMPANY_DETAILS),
      ...(companyDetails || {}),
    };

    const mergedModules = {
      ...(existing?.activeModules as any || DEFAULT_ACTIVE_MODULES),
      ...(activeModules || {}),
    };

    const mergedNumbering = {
      ...(existing?.autoNumbering as any || DEFAULT_AUTO_NUMBERING),
      ...(autoNumbering || {}),
    };

    const config = await prisma.systemConfig.upsert({
      where: { tenantId },
      create: {
        tenantId,
        companyDetails: mergedCompany,
        activeModules: mergedModules,
        autoNumbering: mergedNumbering,
        updatedBy: updatedBy || req.user?.userId || (req.user as any)?.uid || 'system',
      },
      update: {
        companyDetails: mergedCompany,
        activeModules: mergedModules,
        autoNumbering: mergedNumbering,
        updatedBy: updatedBy || req.user?.userId || (req.user as any)?.uid || 'system',
      },
    });

    if (companyDetails?.currency) {
      const match = String(companyDetails.currency).match(/^[A-Z]{3}/i);
      const code = match ? match[0].toUpperCase() : String(companyDetails.currency).trim().split(/[\s(]/)[0].toUpperCase();
      try {
        await prisma.deal.updateMany({
          where: { tenantId },
          data: { currency: code },
        });
      } catch (dealErr) {
        console.warn('[updateSystemConfig] Failed to sync deal currency:', dealErr);
      }
    }

    res.json(config);
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to update system configuration.',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
  }
}

// ============================================================================
// 2. MODULE SCHEMAS & CUSTOM FIELDS
// ============================================================================

export async function getModuleSchemas(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getTenantId(req);
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

export async function getModuleSchema(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const { moduleName } = req.params;

    const schema = await prisma.moduleSchema.findFirst({
      where: { tenantId, moduleName },
      include: { fields: true, blocks: true },
    });

    if (schema) {
      res.json(schema);
    } else {
      res.status(404).json({ error: `Schema for module ${moduleName} not found.` });
    }
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to fetch module schema.',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
  }
}

export async function updateModuleSchema(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const { moduleName } = req.params;
    const { blocks, fields } = req.body;

    const schema = await prisma.moduleSchema.upsert({
      where: {
        tenantId_moduleName: { tenantId, moduleName },
      },
      create: {
        tenantId,
        moduleName,
      },
      update: {},
    });

    // Update Layout Blocks if provided
    if (Array.isArray(blocks)) {
      await prisma.layoutBlock.deleteMany({ where: { schemaId: schema.id } });
      if (blocks.length > 0) {
        await prisma.layoutBlock.createMany({
          data: blocks.map((b: any, idx: number) => ({
            schemaId: schema.id,
            blockId: b.blockId || `blk_${idx + 1}`,
            label: b.label || 'Default Block',
            sortOrder: Number(b.sortOrder ?? idx + 1),
            isCollapsible: Boolean(b.isCollapsible ?? true),
          })),
        });
      }
    }

    // Update Custom Fields if provided
    if (Array.isArray(fields)) {
      await prisma.customField.deleteMany({ where: { schemaId: schema.id } });
      if (fields.length > 0) {
        await prisma.customField.createMany({
          data: fields.map((f: any, idx: number) => ({
            schemaId: schema.id,
            blockId: f.blockId || null,
            fieldId: f.fieldId || `field_${idx + 1}`,
            label: f.label || 'Field',
            type: f.type || 'text',
            isRequired: Boolean(f.isRequired ?? false),
            isUnique: Boolean(f.isUnique ?? false),
            picklistValues: f.picklistValues || null,
            defaultValue: f.defaultValue !== undefined ? f.defaultValue : null,
            sortOrder: Number(f.sortOrder ?? idx + 1),
          })),
        });
      }
    }

    const updated = await prisma.moduleSchema.findUnique({
      where: { id: schema.id },
      include: { fields: true, blocks: true },
    });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to update module schema.',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
  }
}

// ============================================================================
// 3. WORKFLOW RULES
// ============================================================================

export async function getWorkflowRules(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getTenantId(req);
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
    const { id } = req.params;
    const { title, name, description, targetModule, triggerType, conditions, actions, graphData, isActive } = req.body;

    const existing = await prisma.workflowRule.findFirst({ where: { id, tenantId } });
    if (!existing) {
      // Upsert if doesn't exist
      const created = await prisma.workflowRule.create({
        data: {
          id,
          tenantId,
          title: title || name || 'Automation Rule',
          description,
          targetModule: targetModule || 'deals',
          triggerType: triggerType || 'on_stage_change',
          conditions: conditions || [],
          actions: actions || [],
          graphData: graphData || null,
          isActive: isActive !== undefined ? Boolean(isActive) : true,
        },
      });
      res.json({ message: 'Workflow rule created.', id, rule: created });
      return;
    }

    const updated = await prisma.workflowRule.update({
      where: { id },
      data: {
        title: title || name || existing.title,
        description: description !== undefined ? description : existing.description,
        targetModule: targetModule || existing.targetModule,
        triggerType: triggerType || existing.triggerType,
        conditions: conditions !== undefined ? conditions : existing.conditions,
        actions: actions !== undefined ? actions : existing.actions,
        graphData: graphData !== undefined ? graphData : existing.graphData,
        isActive: isActive !== undefined ? Boolean(isActive) : existing.isActive,
      },
    });

    res.json({ message: 'Workflow updated successfully.', id, rule: updated });
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
    const { workflow, workflowId, payload } = req.body;

    let targetWorkflow = workflow;
    if (!targetWorkflow && workflowId) {
      targetWorkflow = await prisma.workflowRule.findFirst({ where: { id: workflowId, tenantId } });
    }

    if (!targetWorkflow) {
      res.status(400).json({ error: 'Missing workflow definition or valid workflowId for execution.' });
      return;
    }

    const { executeWorkflow: runWorkflow } = await import('../workflows/workflowRunner.js');
    const result = await runWorkflow(targetWorkflow, { ...(payload || {}), tenantId });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to execute workflow rule.',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
  }
}

// ============================================================================
// 4. PROFILES & ROLES HIERARCHY
// ============================================================================

export async function getProfiles(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getTenantId(req);
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

export async function createOrUpdateProfile(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const { id, name, description, modulePermissions, fieldPermissions } = req.body;

    const profileId = id || req.params.id;

    let profile;
    if (profileId) {
      const existing = await prisma.profile.findFirst({ where: { id: profileId, tenantId } });
      if (existing) {
        profile = await prisma.profile.update({
          where: { id: profileId },
          data: {
            name: name || existing.name,
            description: description !== undefined ? description : existing.description,
            modulePermissions: modulePermissions || existing.modulePermissions,
            fieldPermissions: fieldPermissions || existing.fieldPermissions,
          },
        });
      }
    }

    if (!profile) {
      profile = await prisma.profile.create({
        data: {
          id: profileId || undefined,
          tenantId,
          name: name || 'New Profile',
          description,
          modulePermissions: modulePermissions || {},
          fieldPermissions: fieldPermissions || {},
        },
      });
    }

    res.json(profile);
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to save profile.',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
  }
}

export async function getRoles(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getTenantId(req);
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

export async function createOrUpdateRole(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const { id, name, description, parentRoleId, assignedProfileId } = req.body;
    const roleId = id || req.params.id;

    let role;
    if (roleId) {
      const existing = await prisma.role.findFirst({ where: { id: roleId, tenantId } });
      if (existing) {
        role = await prisma.role.update({
          where: { id: roleId },
          data: {
            name: name || existing.name,
            description: description !== undefined ? description : existing.description,
            parentRoleId: parentRoleId !== undefined ? parentRoleId : existing.parentRoleId,
            assignedProfileId: assignedProfileId !== undefined ? assignedProfileId : existing.assignedProfileId,
          },
        });
      }
    }

    if (!role) {
      role = await prisma.role.create({
        data: {
          id: roleId || undefined,
          tenantId,
          name: name || 'New Role',
          description,
          parentRoleId: parentRoleId || null,
          assignedProfileId: assignedProfileId || null,
        },
      });
    }

    res.json(role);
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to save role.',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
  }
}

export async function deleteRole(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const { id } = req.params;

    await prisma.role.deleteMany({
      where: { id, tenantId },
    });

    res.json({ message: 'Role deleted successfully.', id });
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to delete role.',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
  }
}

// ============================================================================
// 5. TENANT USERS & ACCESS
// ============================================================================

export async function getUsers(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const users = await prisma.user.findMany({
      where: { tenantId },
      select: {
        id: true,
        email: true,
        displayName: true,
        photoURL: true,
        role: true,
        profileId: true,
        isTenantAdmin: true,
        updatedAt: true,
      },
    });

    const mapped = users.map((u) => ({
      uid: u.id,
      email: u.email,
      displayName: u.displayName,
      photoURL: u.photoURL,
      role: u.role,
      profileId: u.profileId || 'standard_profile',
      isTenantAdmin: u.isTenantAdmin,
      updatedAt: u.updatedAt.toISOString(),
    }));

    res.json(mapped);
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to fetch users.',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
  }
}

export async function createOrUpdateUser(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const { uid, email, displayName, role, profileId, isTenantAdmin } = req.body;

    const userId = uid || req.params.id;

    let user;
    if (userId) {
      const existing = await prisma.user.findFirst({ where: { id: userId, tenantId } });
      if (existing) {
        user = await prisma.user.update({
          where: { id: userId },
          data: {
            email: email || existing.email,
            displayName: displayName || existing.displayName,
            role: role || existing.role,
            profileId: profileId !== undefined ? profileId : existing.profileId,
            isTenantAdmin: isTenantAdmin !== undefined ? Boolean(isTenantAdmin) : existing.isTenantAdmin,
          },
        });
      }
    }

    if (!user) {
      // Check if user with email already exists in THIS tenant only
      const existingEmail = email
        ? await prisma.user.findFirst({ where: { email, tenantId } })
        : null;

      if (existingEmail) {
        user = await prisma.user.update({
          where: { id: existingEmail.id },
          data: {
            displayName: displayName || existingEmail.displayName,
            role: role || existingEmail.role,
            profileId: profileId || existingEmail.profileId,
            isTenantAdmin: isTenantAdmin !== undefined ? Boolean(isTenantAdmin) : existingEmail.isTenantAdmin,
          },
        });
      } else {
        // Ensure email is not owned by a different tenant
        if (email) {
          const crossTenantUser = await prisma.user.findUnique({ where: { email } });
          if (crossTenantUser && crossTenantUser.tenantId !== tenantId) {
            res.status(409).json({ error: 'A user with this email address already belongs to another organization.' });
            return;
          }
        }
        const rawPassword = req.body.password || `Tmp_${Date.now()}_${Math.random().toString(36).slice(2, 10)}!`;
        const passwordHash = await bcrypt.hash(rawPassword, 10);
        user = await prisma.user.create({
          data: {
            id: userId || undefined,
            tenantId,
            email: email || `user_${Date.now()}@shogunate.dev`,
            passwordHash,
            displayName: displayName || email?.split('@')[0] || 'Team Member',
            role: role || 'developer',
            profileId: profileId || null,
            isTenantAdmin: Boolean(isTenantAdmin),
          },
        });
      }
    }

    res.json({
      uid: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      profileId: user.profileId,
      isTenantAdmin: user.isTenantAdmin,
      updatedAt: user.updatedAt.toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to save user.',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
  }
}

// ============================================================================
// 6. EMAIL CONFIG & TEMPLATES
// ============================================================================

export async function getEmailConfig(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const config = await prisma.emailConfig.findUnique({
      where: { tenantId },
    });

    if (config) {
      res.json({
        ...config,
        smtp: config.smtpSettings || undefined,
      });
      return;
    }

    res.json({
      provider: 'smtp',
      senderName: 'Shogun Automation Gateway',
      senderEmail: 'notifications@shogunate.dev',
      smtp: {
        host: 'smtp.mailtrap.io',
        port: 587,
        encryption: 'tls',
      },
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to fetch email configuration.',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
  }
}

export async function updateEmailConfig(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const { provider, senderName, fromName, senderEmail, fromEmail, apiKey, domain, smtp, smtpSettings, updatedBy } = req.body;

    const resolvedSmtp = smtp || smtpSettings || null;

    const config = await prisma.emailConfig.upsert({
      where: { tenantId },
      create: {
        tenantId,
        provider: provider || 'smtp',
        senderName: senderName || fromName || 'Shogun Automation Gateway',
        fromName: senderName || fromName || 'Shogun Automation Gateway',
        senderEmail: senderEmail || fromEmail || 'notifications@shogunate.dev',
        fromEmail: senderEmail || fromEmail || 'notifications@shogunate.dev',
        apiKey: apiKey || null,
        domain: domain || null,
        smtpSettings: resolvedSmtp,
        updatedBy: updatedBy || req.user?.userId || (req.user as any)?.uid || 'system',
      },
      update: {
        provider: provider || undefined,
        senderName: senderName || fromName || undefined,
        fromName: senderName || fromName || undefined,
        senderEmail: senderEmail || fromEmail || undefined,
        fromEmail: senderEmail || fromEmail || undefined,
        apiKey: apiKey !== undefined ? apiKey : undefined,
        domain: domain !== undefined ? domain : undefined,
        smtpSettings: resolvedSmtp !== undefined ? resolvedSmtp : undefined,
        updatedBy: updatedBy || req.user?.userId || (req.user as any)?.uid || 'system',
      },
    });

    res.json({
      ...config,
      smtp: config.smtpSettings || undefined,
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to save email configuration.',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
  }
}

export async function testEmailConnection(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const { config, testRecipient } = req.body;
    const storedConfig = await prisma.emailConfig.findUnique({ where: { tenantId } });
    const provider = config?.provider || storedConfig?.provider || 'smtp';
    const smtp = config?.smtp || config?.smtpSettings || (storedConfig?.smtpSettings as any) || {};

    if (provider === 'smtp' && smtp.host && smtp.username && smtp.password) {
      const transporter = nodemailer.createTransport({
        host: smtp.host,
        port: Number(smtp.port) || 587,
        secure: Boolean(smtp.secure) || Number(smtp.port) === 465,
        auth: {
          user: smtp.username,
          pass: smtp.password,
        },
        connectionTimeout: 5000,
        greetingTimeout: 5000,
      });
      await transporter.verify();
    }

    res.json({
      success: true,
      message: `Transport handshake successfully verified for ${provider.toUpperCase()} provider targeting ${testRecipient || 'gateway'}.`,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: 'Transport connection failed.',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
  }
}

export async function getEmailTemplates(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const templates = await prisma.emailTemplate.findMany({
      where: { tenantId },
      orderBy: { updatedAt: 'desc' },
    });
    res.json(templates);
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to fetch email templates.',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
  }
}

export async function createOrUpdateEmailTemplate(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const { id, name, module, targetModule, subject, bodyHtml, htmlBody, updatedBy } = req.body;

    const templateId = id || req.params.id;
    const resolvedModule = targetModule || module || 'deals';
    const resolvedBody = htmlBody || bodyHtml || '';

    let template;
    if (templateId) {
      const existing = await prisma.emailTemplate.findFirst({ where: { id: templateId, tenantId } });
      if (existing) {
        template = await prisma.emailTemplate.update({
          where: { id: templateId },
          data: {
            name: name || existing.name,
            targetModule: resolvedModule,
            module: resolvedModule,
            subject: subject || existing.subject,
            htmlBody: resolvedBody,
            bodyHtml: resolvedBody,
            updatedBy: updatedBy || req.user?.userId || (req.user as any)?.uid || 'system',
          },
        });
      }
    }

    if (!template) {
      template = await prisma.emailTemplate.create({
        data: {
          id: templateId || undefined,
          tenantId,
          name: name || 'New Email Template',
          targetModule: resolvedModule,
          module: resolvedModule,
          subject: subject || 'Notification',
          htmlBody: resolvedBody,
          bodyHtml: resolvedBody,
          updatedBy: updatedBy || req.user?.userId || (req.user as any)?.uid || 'system',
        },
      });
    }

    res.json(template);
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to save email template.',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
  }
}

export async function deleteEmailTemplate(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = getTenantId(req);
    const { id } = req.params;

    await prisma.emailTemplate.deleteMany({
      where: { id, tenantId },
    });

    res.json({ message: 'Email template deleted successfully.', id });
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to delete email template.',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
  }
}
