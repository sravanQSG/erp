import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Role } from '../../roles/entities/role.entity.js';
import { TenantUser } from './tenant-user.entity.js';

/** Tenant-scoped. Assigns a role to a tenant user (many-to-many). */
@Entity({ name: 'user_roles' })
@Index(['tenantUserId', 'roleId'], { unique: true })
export class UserRole {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'tenant_user_id' })
  tenantUserId!: string;

  @ManyToOne(() => TenantUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_user_id' })
  tenantUser!: TenantUser;

  @Column({ type: 'uuid', name: 'role_id' })
  roleId!: string;

  @ManyToOne(() => Role, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role!: Role;
}
