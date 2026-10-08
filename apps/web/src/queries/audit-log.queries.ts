import type { AuditLogResponse } from '@demo-erp/shared-types';
import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';

export function useAuditLog() {
  return useQuery({
    queryKey: ['audit-log'],
    queryFn: () => api.get<AuditLogResponse[]>('/audit-log'),
  });
}
