import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserStatus } from './user-status.enum.js';

/**
 * Platform-level (public schema) identity. This is the row authenticated
 * against at login — email is globally unique and maps to exactly one
 * tenant (per the chosen multi-tenancy model: central lookup, not
 * subdomain/header-based resolution). Per-tenant profile data (display
 * name, roles) lives in the tenant's own schema as `TenantUser`.
 */
@Entity({ name: 'users', schema: 'public' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ type: 'varchar', length: 255, name: 'password_hash' })
  passwordHash!: string;

  /** Nullable: platform admins that aren't scoped to a single tenant (e.g.
   *  the bootstrap super-admin who creates tenants) have no tenant at all.
   *  Regular/tenant users always have one. */
  @Index()
  @Column({ type: 'uuid', name: 'tenant_id', nullable: true })
  tenantId!: string | null;

  /** Grants access to platform-level endpoints (e.g. tenant management)
   *  regardless of tenant-scoped roles/permissions. */
  @Column({ type: 'boolean', default: false, name: 'is_platform_admin' })
  isPlatformAdmin!: boolean;

  /** Bumped to force-invalidate all previously issued JWTs for this user
   *  (password reset, disable, etc.) — checked in JwtStrategy.validate(). */
  @Column({ type: 'int', default: 0, name: 'token_version' })
  tokenVersion!: number;

  @Column({ type: 'varchar', length: 20, default: UserStatus.ACTIVE })
  status!: UserStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
