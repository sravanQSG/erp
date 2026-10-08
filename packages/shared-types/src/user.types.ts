export const UserStatus = {
  ACTIVE: 'active',
  DISABLED: 'disabled',
} as const;
export type UserStatusValue = (typeof UserStatus)[keyof typeof UserStatus];

export const TenantUserStatus = {
  INVITED: 'invited',
  ACTIVE: 'active',
  DISABLED: 'disabled',
} as const;
export type TenantUserStatusValue =
  (typeof TenantUserStatus)[keyof typeof TenantUserStatus];

export interface CreateUserRequest {
  email: string;
  password: string;
  displayName: string;
  roleNames?: string[];
}

export interface TenantUserResponse {
  id: string;
  globalUserId: string;
  displayName: string;
  status: TenantUserStatusValue;
  createdAt: string;
  updatedAt: string;
}

export interface AssignRoleRequest {
  roleId: string;
}
