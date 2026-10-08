import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Tenant-scoped (no explicit schema — resolved via the current connection's
 * `search_path`, see src/core/tenant-context). Each tenant can define its
 * own roles.
 */
@Entity({ name: 'roles' })
@Index(['name'], { unique: true })
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description!: string | null;

  /** System roles (admin/member) are seeded per-tenant and cannot be deleted. */
  @Column({ type: 'boolean', default: false, name: 'is_system' })
  isSystem!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
