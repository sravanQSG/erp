import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Tenant-scoped (resolved via `search_path`, same as other tenant tables).
 * Written explicitly by services/controllers at meaningful mutation points
 * rather than via a blanket interceptor — a generic request logger can't
 * capture a meaningful before/after without entity-specific knowledge, so
 * callers pass that context directly (see AuditLogService.record()).
 */
@Entity({ name: 'audit_logs' })
@Index(['createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Global user id of whoever performed the action; null for system actions. */
  @Column({ type: 'uuid', name: 'actor_user_id', nullable: true })
  actorUserId!: string | null;

  /** e.g. 'user.created', 'role.created', 'user.role_assigned'. */
  @Column({ type: 'varchar', length: 100 })
  action!: string;

  @Column({ type: 'varchar', length: 100, name: 'entity_type' })
  entityType!: string;

  @Column({ type: 'varchar', length: 100, name: 'entity_id', nullable: true })
  entityId!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
