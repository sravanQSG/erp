import type { CreateTenantRequest, TenantResponse } from '@demo-erp/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

export const TENANTS_QUERY_KEY = ['tenants'] as const;

export function useTenants() {
  return useQuery({
    queryKey: TENANTS_QUERY_KEY,
    queryFn: () => api.get<TenantResponse[]>('/tenants'),
  });
}

export function useCreateTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateTenantRequest) => api.post<TenantResponse>('/tenants', dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TENANTS_QUERY_KEY }),
  });
}

interface BootstrapTenantAdminDto {
  tenantId: string;
  email: string;
  password: string;
  displayName: string;
}

export function useBootstrapTenantAdmin() {
  return useMutation({
    mutationFn: ({ tenantId, ...dto }: BootstrapTenantAdminDto) =>
      api.post<{ userId: string }>(`/auth/tenants/${tenantId}/admin-user`, dto),
  });
}
