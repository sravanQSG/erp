/**
 * Catalog of permission keys the API understands, checked by
 * `@Permissions()` + `PermissionsGuard` on the backend. Deliberately kept as
 * a code constant rather than a database table: it mirrors what the code
 * actually enforces, so there's no risk of the two drifting apart.
 *
 * Shared with the frontend so UI can do permission-based conditional
 * rendering (e.g. hide the "Manage Roles" button) using the exact same
 * keys the backend enforces, instead of a hand-duplicated string list that
 * can drift out of sync.
 *
 * Renaming a key here is a breaking change for any tenant that already
 * assigned it to a role — add a migration to rewrite existing
 * `role_permissions` rows if you do.
 */
export const PERMISSIONS = {
  USERS_READ: 'users:read',
  USERS_INVITE: 'users:invite',
  USERS_UPDATE: 'users:update',
  USERS_DISABLE: 'users:disable',
  ROLES_READ: 'roles:read',
  ROLES_MANAGE: 'roles:manage',
  AUDIT_LOG_READ: 'audit-log:read',
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSION_KEYS: PermissionKey[] = Object.values(PERMISSIONS);
