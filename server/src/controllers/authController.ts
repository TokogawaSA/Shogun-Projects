import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../config/db.js';
import { AuthUserClaims } from '../types/auth.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_production_32chars_min';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function generateToken(claims: AuthUserClaims): string {
  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN as unknown as number | undefined,
  };
  return jwt.sign(claims, JWT_SECRET, options);
}

// Request validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  displayName: z.string().min(2, 'Display name must be at least 2 characters'),
  tenantName: z.string().min(2, 'Organization / Tenant name is required'),
  domain: z.string().optional(),
  industry: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

const inviteUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  displayName: z.string().min(2, 'Display name is required'),
  role: z.string().default('developer'),
  isTenantAdmin: z.boolean().default(false),
  profileId: z.string().optional(),
  roleId: z.string().optional(),
});

/**
 * POST /api/auth/register
 * Registers a new Tenant organization, root admin User, default Profile & SystemConfig
 */
export async function register(req: Request, res: Response): Promise<void> {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'Validation error',
        details: parseResult.error.errors,
      });
      return;
    }

    const { email, password, displayName, tenantName, domain, industry } = parseResult.data;

    // Check if user email is already registered
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(409).json({ error: 'A user with this email already exists.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Run creation in a database transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Tenant
      const tenant = await tx.tenant.create({
        data: {
          name: tenantName,
          domain: domain || null,
          industry: industry || 'Technology',
        },
      });

      // 2. Create Default Admin Profile
      const adminProfile = await tx.profile.create({
        data: {
          tenantId: tenant.id,
          name: 'Administrator Profile',
          description: 'Full system access and module administration',
          modulePermissions: {
            projects: { view: true, create: true, edit: true, delete: true },
            tasks: { view: true, create: true, edit: true, delete: true },
            leads: { view: true, create: true, edit: true, delete: true },
            accounts: { view: true, create: true, edit: true, delete: true },
            contacts: { view: true, create: true, edit: true, delete: true },
            deals: { view: true, create: true, edit: true, delete: true },
            catalog: { view: true, create: true, edit: true, delete: true },
            quotes: { view: true, create: true, edit: true, delete: true },
            ppm: { view: true, create: true, edit: true, delete: true },
            settings: { view: true, create: true, edit: true, delete: true },
          },
          fieldPermissions: {},
        },
      });

      // 3. Create Root Admin User
      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email,
          passwordHash,
          displayName,
          role: 'admin',
          isTenantAdmin: true,
          profileId: adminProfile.id,
        },
      });

      // 4. Initialize Default System Config
      await tx.systemConfig.create({
        data: {
          tenantId: tenant.id,
          companyDetails: {
            name: tenantName,
            domain: domain || '',
            timezone: 'UTC',
            currency: 'USD',
            fiscalYearStart: 'January',
          },
          activeModules: {
            projects: true,
            tasks: true,
            accounts: true,
            contacts: true,
            deals: true,
            leads: true,
            quotes: true,
            ppm: true,
          },
          autoNumbering: {
            leads: { prefix: 'LEA-', nextNumber: 1001, padZeroes: 4 },
            accounts: { prefix: 'ACC-', nextNumber: 1001, padZeroes: 4 },
            contacts: { prefix: 'CON-', nextNumber: 1001, padZeroes: 4 },
            deals: { prefix: 'OPP-', nextNumber: 1001, padZeroes: 4 },
            quotes: { prefix: 'QUO-', nextNumber: 1001, padZeroes: 4 },
          },
          updatedBy: user.id,
        },
      });

      return { tenant, user, adminProfile };
    });

    const claims: AuthUserClaims = {
      userId: result.user.id,
      tenantId: result.tenant.id,
      email: result.user.email,
      role: result.user.role,
      isTenantAdmin: result.user.isTenantAdmin,
      profileId: result.user.profileId,
    };

    const token = generateToken(claims);

    res.status(201).json({
      message: 'Tenant and Administrator successfully registered.',
      token,
      user: {
        id: result.user.id,
        email: result.user.email,
        displayName: result.user.displayName,
        role: result.user.role,
        isTenantAdmin: result.user.isTenantAdmin,
        tenantId: result.user.tenantId,
        profileId: result.user.profileId,
      },
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
        domain: result.tenant.domain,
      },
    });
  } catch (err: any) {
    console.error('[Register Error]:', err);
    res.status(500).json({ error: 'Registration failed due to server error.', details: err.message });
  }
}

/**
 * POST /api/auth/login
 * Authenticates user credentials and returns signed multi-tenant JWT
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'Validation error',
        details: parseResult.error.errors,
      });
      return;
    }

    const { email, password } = parseResult.data;

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        tenant: true,
        profile: true,
      },
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password credentials.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password credentials.' });
      return;
    }

    const claims: AuthUserClaims = {
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role,
      isTenantAdmin: user.isTenantAdmin,
      profileId: user.profileId,
      roleId: user.roleId,
    };

    const token = generateToken(claims);

    res.json({
      message: 'Authentication successful.',
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: user.role,
        isTenantAdmin: user.isTenantAdmin,
        tenantId: user.tenantId,
        profileId: user.profileId,
        profileName: user.profile?.name || null,
      },
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        domain: user.tenant.domain,
      },
    });
  } catch (err: any) {
    console.error('[Login Error]:', err);
    res.status(500).json({ error: 'Login failed due to internal error.', details: err.message });
  }
}

/**
 * GET /api/auth/me
 * Returns the currently authenticated user session, permissions, and tenant details
 */
export async function getMe(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        photoURL: true,
        role: true,
        isTenantAdmin: true,
        tenantId: true,
        profileId: true,
        roleId: true,
        createdAt: true,
        updatedAt: true,
        tenant: {
          select: {
            id: true,
            name: true,
            domain: true,
            industry: true,
            createdAt: true,
          },
        },
        profile: {
          select: {
            id: true,
            name: true,
            description: true,
            modulePermissions: true,
            fieldPermissions: true,
          },
        },
        roleHierarchy: {
          select: {
            id: true,
            name: true,
            parentRoleId: true,
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User profile not found.' });
      return;
    }

    res.json({
      user,
      tenant: user.tenant,
    });
  } catch (err: any) {
    console.error('[GetMe Error]:', err);
    res.status(500).json({ error: 'Failed to retrieve profile.', details: err.message });
  }
}

/**
 * POST /api/auth/users/invite
 * Administrator endpoint to create and assign users to the current tenant
 */
export async function inviteUser(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    const parseResult = inviteUserSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'Validation error',
        details: parseResult.error.errors,
      });
      return;
    }

    const { email, password, displayName, role, isTenantAdmin, profileId, roleId } = parseResult.data;

    // Verify email is not in use
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: 'A user with this email address already exists.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: {
        tenantId: req.user.tenantId,
        email,
        passwordHash,
        displayName,
        role,
        isTenantAdmin,
        profileId: profileId || null,
        roleId: roleId || null,
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        isTenantAdmin: true,
        tenantId: true,
        profileId: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      message: 'Team member successfully created.',
      user: newUser,
    });
  } catch (err: any) {
    console.error('[Invite User Error]:', err);
    res.status(500).json({ error: 'Failed to create team member.', details: err.message });
  }
}
