import type { CreateRoleRequest, RoleResponse } from '@demo-erp/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

export const ROLES_QUERY_KEY = ['roles'] as const;

export function useRoles() {
  return useQuery({
    queryKey: ROLES_QUERY_KEY,
    queryFn: () => api.get<RoleResponse[]>('/roles'),
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateRoleRequest) => api.post<RoleResponse>('/roles', dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ROLES_QUERY_KEY }),
  });
}
