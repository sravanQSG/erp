import type {
  AssignRoleRequest,
  CreateUserRequest,
  TenantUserResponse,
} from '@demo-erp/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

export const USERS_QUERY_KEY = ['users'] as const;

export function useTenantUsers() {
  return useQuery({
    queryKey: USERS_QUERY_KEY,
    queryFn: () => api.get<TenantUserResponse[]>('/users'),
  });
}

/** Invites a new user into the caller's own tenant (POST /auth/users). */
export function useInviteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateUserRequest) =>
      api.post<{ userId: string }>('/auth/users', dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY }),
  });
}

export function useAssignRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, roleId }: { userId: string } & AssignRoleRequest) =>
      api.post(`/users/${userId}/roles`, { roleId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY }),
  });
}
