export const TenantStatus = {
  PENDING: 'pending',
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
} as const;
export type TenantStatusValue = (typeof TenantStatus)[keyof typeof TenantStatus];

export interface CreateTenantRequest {
  name: string;
  slug: string;
}

export interface TenantResponse {
  id: string;
  name: string;
  slug: string;
  schemaName: string;
  status: TenantStatusValue;
  createdAt: string;
  updatedAt: string;
}
