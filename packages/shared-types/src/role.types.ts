import type { PermissionKey } from './permissions.js';

export interface CreateRoleRequest {
  name: string;
  description?: string;
  permissions?: PermissionKey[];
}

export interface RoleResponse {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}
