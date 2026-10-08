import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { PermissionKey } from '../constants/permissions.constant.js';
import { Role } from './role.entity.js';

/** Tenant-scoped. Assigns a permission key (see permissions.constant.ts) to a role. */
@Entity({ name: 'role_permissions' })
@Index(['roleId', 'permissionKey'], { unique: true })
export class RolePermission {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'role_id' })
  roleId!: string;

  @ManyToOne(() => Role, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role!: Role;

  @Column({ type: 'varchar', length: 100, name: 'permission_key' })
  permissionKey!: PermissionKey;
}
