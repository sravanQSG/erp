import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TenantUserStatus } from './tenant-user-status.enum.js';

/**
 * Tenant-scoped profile (no explicit schema — resolved via `search_path`).
 * Links to the platform-wide identity (`public.users`, see
 * src/core/auth/entities/user.entity.ts) via `globalUserId`. The FK
 * constraint to `public.users(id)` is declared explicitly (fully-qualified)
 * in the tenant migration, since the referencing table itself resolves
 * into the current tenant schema through `search_path`.
 */
@Entity({ name: 'tenant_users' })
@Index(['globalUserId'], { unique: true })
export class TenantUser {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'global_user_id' })
  globalUserId!: string;

  @Column({ type: 'varchar', length: 255, name: 'display_name' })
  displayName!: string;

  /** Plain varchar (not a Postgres enum type) because enum types are
   *  schema-scoped in Postgres — using one here would require re-creating
   *  the type in every tenant schema. Validated at the application layer
   *  via the TenantUserStatus TS enum instead. */
  @Column({
    type: 'varchar',
    length: 20,
    default: TenantUserStatus.INVITED,
  })
  status!: TenantUserStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
