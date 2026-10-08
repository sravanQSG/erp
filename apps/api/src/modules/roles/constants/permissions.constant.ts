import { ALL_PERMISSION_KEYS, PERMISSIONS, type PermissionKey } from '@demo-erp/shared-types';

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
