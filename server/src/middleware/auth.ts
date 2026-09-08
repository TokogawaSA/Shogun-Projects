import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthUserClaims } from '../types/auth.js';

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('[FATAL SECURITY EXCEPTION] JWT_SECRET must be explicitly defined in environment variables for production execution.');
}

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_production_32chars_min';

/**
 * Middleware: Extract and verify multi-tenant JWT token
 */
export function authenticateTenant(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Unauthorized: Missing or malformed Authorization header. Expected Bearer token.',
    });
    return;
  }

  const token = authHeader.substring(7).trim();

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUserClaims;

    if (!decoded || !decoded.userId || !decoded.tenantId) {
      res.status(401).json({
        error: 'Unauthorized: Invalid token payload. Missing tenantId or userId.',
      });
      return;
    }

    const claims = {
      userId: decoded.userId,
      tenantId: decoded.tenantId,
      email: decoded.email,
      role: decoded.role || 'developer',
      isTenantAdmin: Boolean(decoded.isTenantAdmin),
      profileId: decoded.profileId || null,
      roleId: decoded.roleId || null,
    };

    req.user = claims;
    req.tenantContext = claims;

    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({
        error: 'Unauthorized: Authentication token has expired. Please re-authenticate.',
      });
      return;
    }

    res.status(401).json({
      error: 'Unauthorized: Invalid or tampered authentication token.',
    });
  }
}

/**
 * Middleware: Guard administrative endpoints to require isTenantAdmin: true
 */
export function requireTenantAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized: Authentication required.' });
    return;
  }

  if (!req.user.isTenantAdmin) {
    res.status(403).json({
      error: 'Forbidden: Tenant Administrator privileges required to access this resource.',
    });
    return;
  }

  next();
}

/**
 * Middleware: Guard endpoints by allowed user roles
 */
export function requireRoles(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized: Authentication required.' });
      return;
    }

    if (req.user.isTenantAdmin || roles.includes(req.user.role)) {
      next();
      return;
    }

    res.status(403).json({
      error: `Forbidden: Requires one of the following roles: ${roles.join(', ')}`,
    });
  };
}
