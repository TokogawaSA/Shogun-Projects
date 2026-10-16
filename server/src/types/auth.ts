export interface AuthUserClaims {
  userId: string;
  tenantId: string;
  email: string;
  role: string;
  isTenantAdmin: boolean;
  profileId?: string | null;
  roleId?: string | null;
}

export type TenantContext = AuthUserClaims;

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserClaims;
      tenantContext?: TenantContext;
      tenantId?: string;
    }
  }
}
