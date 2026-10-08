/**
 * Shape of the RS256-signed JWT payload issued by the API's AuthService.
 * Since tenant resolution happens only via the JWT (no subdomain/header),
 * `tenantId` and `schemaName` are embedded here and trusted because the
 * token is signature-verified before any claim is read.
 *
 * Shared between backend (issues/verifies) and frontend (decodes the
 * access token client-side to drive conditional UI, e.g. hiding buttons
 * for permissions the user doesn't have) — this is the single source of
 * truth for that shape.
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

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}
