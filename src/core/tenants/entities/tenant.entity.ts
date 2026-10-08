import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TenantStatus } from './tenant-status.enum.js';

/**
 * Platform-level record of a tenant (lives in the `public` schema). Each
 * tenant owns an isolated Postgres schema (`schemaName`) holding its
 * business data. `slug`/`schemaName` are validated at creation time
 * (CreateTenantDto) to a strict `[a-z][a-z0-9_]*` pattern so they can be
 * safely interpolated into DDL (`CREATE SCHEMA`, `SET search_path`), which
 * cannot be parameterized like regular query values.
 */
@Entity({ name: 'tenants', schema: 'public' })
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 63 })
  slug!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 63, name: 'schema_name' })
  schemaName!: string;

  @Column({
    type: 'enum',
    enum: TenantStatus,
    default: TenantStatus.PENDING,
  })
  status!: TenantStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
