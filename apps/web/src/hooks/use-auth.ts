import type { AuthenticatedUser, LoginRequest, TokenPair } from '@demo-erp/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';

import { api } from '@/lib/api-client';
import {
  clearTokens,
  getCurrentUser,
  getRefreshToken,
  setTokens,
} from '@/lib/auth';

export const CURRENT_USER_QUERY_KEY = ['auth', 'currentUser'] as const;

/** Reactive wrapper around the decoded access token. Login/logout mutations
 *  below update this query's cache directly so the whole app re-renders. */
export function useCurrentUser() {
  return useQuery<AuthenticatedUser | null>({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: () => getCurrentUser(),
    initialData: getCurrentUser,
    staleTime: Infinity,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (dto: LoginRequest) => api.post<TokenPair>('/auth/login', dto),
    onSuccess: (tokens) => {
      setTokens(tokens.accessToken, tokens.refreshToken);
      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, getCurrentUser());
      void navigate({ to: '/' });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async () => {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        // Best-effort: still log out locally even if this fails (e.g. the
        // token was already revoked/expired).
        await api.post('/auth/logout', { refreshToken }).catch(() => undefined);
      }
    },
    onSettled: () => {
      clearTokens();
      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, null);
      queryClient.clear();
      void navigate({ to: '/login' });
    },
  });
}
