import { Injectable } from '@nestjs/common';
import { desc } from 'drizzle-orm';
import type { DrizzleDb } from '../../database/drizzle-db.type.js';
import { auditLogs, type AuditLog } from '../../database/schema/index.js';

export interface RecordAuditLogParams {
  actorUserId: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
}

/** Tenant-scoped, same explicit-db pattern as RolesService/TenantUsersService. */
@Injectable()
export class AuditLogService {
  async record(db: DrizzleDb, params: RecordAuditLogParams): Promise<void> {
    await db.insert(auditLogs).values({
      actorUserId: params.actorUserId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId ?? null,
      metadata: params.metadata ?? null,
    });
  }

  async findRecent(db: DrizzleDb, limit = 100): Promise<AuditLog[]> {
    return db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);
  }
}
