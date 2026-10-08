/**
 * Shape of the RS256-signed JWT payload issued by AuthService. Since tenant
 * resolution happens only via the JWT (no subdomain/header), `tenantId` and
 * `schemaName` are embedded here and trusted because the token is
 * signature-verified before any claim is read.
 */
export interface JwtPayload {
  /** Global user id (subject). */
  sub: string;
  /** Tenant the user belongs to; null for tenant-less platform admins. */
  tenantId: string | null;
  /** Postgres schema name for this tenant; null for tenant-less platform admins. */
  schemaName: string | null;
  email: string;
  roles: string[];
  permissions: string[];
  /**
   * Incremented to force-invalidate all previously issued tokens for a user
   * (e.g. password reset, tenant suspension). Checked against the stored
   * value on the user record.
   */
  tokenVersion: number;
  iss?: string;
  aud?: string;
  iat?: number;
  exp?: number;
}

/** `request.user` after JwtStrategy.validate() — same shape as the payload. */
export type AuthenticatedUser = JwtPayload;
