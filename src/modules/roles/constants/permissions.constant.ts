/**
 * Catalog of permission keys the application understands, checked by
 * `@Permissions()` + `PermissionsGuard`. Deliberately kept as a code
 * constant rather than a database table: it mirrors what the code actually
 * enforces, so there's no risk of the two drifting apart. `role_permissions`
 * rows store these keys as plain strings (validated against this list on
 * write), not a foreign key to a separate catalog table.
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

/** Seeded automatically for every newly provisioned tenant. */
export const DEFAULT_ROLE_SEEDS: Array<{
  name: string;
  description: string;
  isSystem: boolean;
  permissions: PermissionKey[];
}> = [
  {
    name: 'admin',
    description: 'Full access to this tenant, including user and role management.',
    isSystem: true,
    permissions: ALL_PERMISSION_KEYS,
  },
  {
    name: 'member',
    description: 'Standard member with read-only access to users.',
    isSystem: true,
    permissions: [PERMISSIONS.USERS_READ],
  },
];
