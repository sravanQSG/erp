import { Injectable, NotFoundException } from '@nestjs/common';
import { eq, inArray } from 'drizzle-orm';
import type { DrizzleDb } from '../../database/drizzle-db.type.js';
import {
  roles,
  tenantUsers,
  userRoles,
  TenantUserStatus,
  type TenantUser,
} from '../../database/schema/index.js';
import { RolesService } from '../roles/roles.service.js';

export interface TenantUserAccess {
  roleNames: string[];
  permissions: string[];
}

/**
 * Tenant-scoped user-profile management. Like `RolesService`, every method
 * takes the active tenant `db` explicitly — see that file for why.
 */
@Injectable()
export class TenantUsersService {
  constructor(private readonly rolesService: RolesService) {}

  async createProfile(
    db: DrizzleDb,
    globalUserId: string,
    displayName: string,
  ): Promise<TenantUser> {
    const [profile] = await db
      .insert(tenantUsers)
      .values({ globalUserId, displayName, status: TenantUserStatus.ACTIVE })
      .returning();
    return profile;
  }

  async findByGlobalUserId(
    db: DrizzleDb,
    globalUserId: string,
  ): Promise<TenantUser | null> {
    const [user] = await db
      .select()
      .from(tenantUsers)
      .where(eq(tenantUsers.globalUserId, globalUserId))
      .limit(1);
    return user ?? null;
  }

  async findById(db: DrizzleDb, id: string): Promise<TenantUser> {
    const [user] = await db
      .select()
      .from(tenantUsers)
      .where(eq(tenantUsers.id, id))
      .limit(1);
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return user;
  }

  async findAll(db: DrizzleDb): Promise<TenantUser[]> {
    return db.select().from(tenantUsers).orderBy(tenantUsers.createdAt);
  }

  async assignRole(db: DrizzleDb, tenantUserId: string, roleId: string): Promise<void> {
    await db
      .insert(userRoles)
      .values({ tenantUserId, roleId })
      .onConflictDoNothing({ target: [userRoles.tenantUserId, userRoles.roleId] });
  }

  /** Roles + de-duplicated permission keys for a tenant user, used by
   *  AuthService to build JWT claims at login. */
  async getAccessForGlobalUser(
    db: DrizzleDb,
    globalUserId: string,
  ): Promise<TenantUserAccess> {
    const tenantUser = await this.findByGlobalUserId(db, globalUserId);
    if (!tenantUser) {
      return { roleNames: [], permissions: [] };
    }

    const assignedRoles = await db
      .select()
      .from(userRoles)
      .where(eq(userRoles.tenantUserId, tenantUser.id));
    const roleIds = assignedRoles.map((userRole) => userRole.roleId);
    if (roleIds.length === 0) {
      return { roleNames: [], permissions: [] };
    }

    const roleRows = await db.select().from(roles).where(inArray(roles.id, roleIds));
    const permissions = await this.rolesService.getPermissionKeysForRoles(db, roleIds);

    return { roleNames: roleRows.map((role) => role.name), permissions };
  }
}
