import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { asc, eq, inArray } from 'drizzle-orm';
import type { DrizzleDb } from '../../database/drizzle-db.type.js';
import { roles, rolePermissions, type Role } from '../../database/schema/index.js';
import { ALL_PERMISSION_KEYS, type PermissionKey } from '@demo-erp/shared-types';
import { DEFAULT_ROLE_SEEDS } from './constants/permissions.constant.js';
import { CreateRoleDto } from './dto/create-role.dto.js';

/**
 * Tenant-scoped role management. Every method takes the active tenant `db`
 * explicitly (obtained from `TenantContextService.getDb()` for normal
 * requests, or from `TenantConnectionService.runInTenantSchema()` for
 * one-off pre-auth access such as login) rather than a module-level
 * injected instance, since the correct schema is only known per-request.
 */
@Injectable()
export class RolesService {
  async findAll(db: DrizzleDb): Promise<Role[]> {
    return db.select().from(roles).orderBy(asc(roles.name));
  }

  async findById(db: DrizzleDb, id: string): Promise<Role> {
    const [role] = await db.select().from(roles).where(eq(roles.id, id)).limit(1);
    if (!role) {
      throw new NotFoundException(`Role ${id} not found`);
    }
    return role;
  }

  async createRole(db: DrizzleDb, dto: CreateRoleDto): Promise<Role> {
    const [existing] = await db
      .select()
      .from(roles)
      .where(eq(roles.name, dto.name))
      .limit(1);
    if (existing) {
      throw new ConflictException(`Role "${dto.name}" already exists`);
    }

    return db.transaction(async (trx) => {
      const [role] = await trx
        .insert(roles)
        .values({ name: dto.name, description: dto.description ?? null, isSystem: false })
        .returning();
      if (dto.permissions?.length) {
        await this.assignPermissions(trx, role.id, dto.permissions);
      }
      return role;
    });
  }

  async assignPermissions(
    db: DrizzleDb,
    roleId: string,
    permissionKeys: PermissionKey[],
  ): Promise<void> {
    if (permissionKeys.length === 0) {
      return;
    }
    await db
      .insert(rolePermissions)
      .values(permissionKeys.map((permissionKey) => ({ roleId, permissionKey })))
      // roleId/permissionKey pairs are unique-indexed; do-nothing avoids
      // duplicate-key errors on re-assignment (same semantics as the
      // previous TypeORM `repo.upsert(..., ['roleId','permissionKey'])`).
      .onConflictDoNothing({
        target: [rolePermissions.roleId, rolePermissions.permissionKey],
      });
  }

  async getPermissionKeysForRoles(
    db: DrizzleDb,
    roleIds: string[],
  ): Promise<PermissionKey[]> {
    if (roleIds.length === 0) {
      return [];
    }
    const rows = await db
      .select()
      .from(rolePermissions)
      .where(inArray(rolePermissions.roleId, roleIds));
    return [...new Set(rows.map((row) => row.permissionKey as PermissionKey))];
  }

  /** Idempotently seeds the default `admin`/`member` roles for a new tenant. */
  async seedDefaultRoles(db: DrizzleDb): Promise<void> {
    for (const seed of DEFAULT_ROLE_SEEDS) {
      let [role] = await db.select().from(roles).where(eq(roles.name, seed.name)).limit(1);
      if (!role) {
        [role] = await db
          .insert(roles)
          .values({ name: seed.name, description: seed.description, isSystem: seed.isSystem })
          .returning();
      }
      await this.assignPermissions(
        db,
        role.id,
        seed.permissions ?? (ALL_PERMISSION_KEYS as PermissionKey[]),
      );
    }
  }
}
