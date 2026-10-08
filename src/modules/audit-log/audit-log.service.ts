import { Injectable } from '@nestjs/common';
import type { EntityManager } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity.js';

export interface RecordAuditLogParams {
  actorUserId: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
}

/** Tenant-scoped, same explicit-manager pattern as RolesService/TenantUsersService. */
@Injectable()
export class AuditLogService {
  async record(manager: EntityManager, params: RecordAuditLogParams): Promise<void> {
    const repo = manager.getRepository(AuditLog);
    await repo.save(
      repo.create({
        actorUserId: params.actorUserId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId ?? null,
        metadata: params.metadata ?? null,
      }),
    );
  }

  async findRecent(manager: EntityManager, limit = 100): Promise<AuditLog[]> {
    return manager
      .getRepository(AuditLog)
      .find({ order: { createdAt: 'DESC' }, take: limit });
  }
}
