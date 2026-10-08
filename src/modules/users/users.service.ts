import { Injectable, NotFoundException } from '@nestjs/common';
import type { EntityManager } from 'typeorm';
import { In } from 'typeorm';
import { Role } from '../roles/entities/role.entity.js';
import { RolesService } from '../roles/roles.service.js';
import { TenantUserStatus } from './entities/tenant-user-status.enum.js';
import { TenantUser } from './entities/tenant-user.entity.js';
import { UserRole } from './entities/user-role.entity.js';

export interface TenantUserAccess {
  roleNames: string[];
  permissions: string[];
}

/**
 * Tenant-scoped user-profile management. Like `RolesService`, every method
 * takes the active tenant `EntityManager` explicitly — see that file for
 * why `@InjectRepository()` isn't used here.
 */
@Injectable()
export class TenantUsersService {
  constructor(private readonly rolesService: RolesService) {}

  async createProfile(
    manager: EntityManager,
    globalUserId: string,
    displayName: string,
  ): Promise<TenantUser> {
    const repo = manager.getRepository(TenantUser);
    return repo.save(
      repo.create({
        globalUserId,
        displayName,
        status: TenantUserStatus.ACTIVE,
      }),
    );
  }

  async findByGlobalUserId(
    manager: EntityManager,
    globalUserId: string,
  ): Promise<TenantUser | null> {
    return manager.getRepository(TenantUser).findOne({ where: { globalUserId } });
  }

  async findById(manager: EntityManager, id: string): Promise<TenantUser> {
    const user = await manager.getRepository(TenantUser).findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return user;
  }

  async findAll(manager: EntityManager): Promise<TenantUser[]> {
    return manager.getRepository(TenantUser).find({ order: { createdAt: 'DESC' } });
  }

  async assignRole(
    manager: EntityManager,
    tenantUserId: string,
    roleId: string,
  ): Promise<void> {
    const repo = manager.getRepository(UserRole);
    await repo.upsert(
      repo.create({ tenantUserId, roleId }),
      ['tenantUserId', 'roleId'],
    );
  }

  /** Roles + de-duplicated permission keys for a tenant user, used by
   *  AuthService to build JWT claims at login. */
  async getAccessForGlobalUser(
    manager: EntityManager,
    globalUserId: string,
  ): Promise<TenantUserAccess> {
    const tenantUser = await this.findByGlobalUserId(manager, globalUserId);
    if (!tenantUser) {
      return { roleNames: [], permissions: [] };
    }

    const userRoles = await manager
      .getRepository(UserRole)
      .find({ where: { tenantUserId: tenantUser.id } });
    const roleIds = userRoles.map((userRole) => userRole.roleId);
    if (roleIds.length === 0) {
      return { roleNames: [], permissions: [] };
    }

    const roles = await manager.getRepository(Role).find({ where: { id: In(roleIds) } });
    const permissions = await this.rolesService.getPermissionKeysForRoles(
      manager,
      roleIds,
    );

    return { roleNames: roles.map((role) => role.name), permissions };
  }
}
