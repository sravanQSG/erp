import type { AuthenticatedUser } from '@demo-erp/shared-types';

const ACCESS_TOKEN_KEY = 'demo-erp.accessToken';
const REFRESH_TOKEN_KEY = 'demo-erp.refreshToken';

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

/**
 * Decodes the (already signature-verified-by-the-server) access token
 * client-side purely to drive UI — e.g. showing/hiding buttons based on
 * `permissions`. This is NOT a security boundary: the backend re-verifies
 * the signature and re-checks permissions on every request regardless.
 */
export function decodeAccessToken(token: string): AuthenticatedUser | null {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    );
    return JSON.parse(json) as AuthenticatedUser;
  } catch {
    return null;
  }
}

export function getCurrentUser(): AuthenticatedUser | null {
  const token = getAccessToken();
  if (!token) return null;
  const user = decodeAccessToken(token);
  if (!user) return null;
  if (user.exp && user.exp * 1000 < Date.now()) return null;
  return user;
}

export function hasPermission(
  user: AuthenticatedUser | null,
  permission: string,
): boolean {
  return !!user?.permissions.includes(permission);
}

export function hasRole(user: AuthenticatedUser | null, role: string): boolean {
  return !!user?.roles.includes(role);
}
