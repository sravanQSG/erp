import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { EntityManager } from 'typeorm';
import { In } from 'typeorm';
import {
  ALL_PERMISSION_KEYS,
  DEFAULT_ROLE_SEEDS,
  type PermissionKey,
} from './constants/permissions.constant.js';
import { CreateRoleDto } from './dto/create-role.dto.js';
import { RolePermission } from './entities/role-permission.entity.js';
import { Role } from './entities/role.entity.js';

/**
 * Tenant-scoped role management. Every method takes the active tenant
 * `EntityManager` explicitly (obtained from `TenantContextService.getManager()`
 * for normal requests, or from `TenantConnectionService.runInTenantSchema()`
 * for one-off pre-auth access such as login) rather than using
 * `@InjectRepository()`, since the correct schema is only known per-request.
 */
@Injectable()
export class RolesService {
  async findAll(manager: EntityManager): Promise<Role[]> {
    return manager.getRepository(Role).find({ order: { name: 'ASC' } });
  }

  async findById(manager: EntityManager, id: string): Promise<Role> {
    const role = await manager.getRepository(Role).findOne({ where: { id } });
    if (!role) {
      throw new NotFoundException(`Role ${id} not found`);
    }
    return role;
  }

  async createRole(manager: EntityManager, dto: CreateRoleDto): Promise<Role> {
    const existing = await manager
      .getRepository(Role)
      .findOne({ where: { name: dto.name } });
    if (existing) {
      throw new ConflictException(`Role "${dto.name}" already exists`);
    }

    return manager.transaction(async (trx) => {
      const role = await trx.getRepository(Role).save(
        trx.getRepository(Role).create({
          name: dto.name,
          description: dto.description ?? null,
          isSystem: false,
        }),
      );
      if (dto.permissions?.length) {
        await this.assignPermissions(trx, role.id, dto.permissions);
      }
      return role;
    });
  }

  async assignPermissions(
    manager: EntityManager,
    roleId: string,
    permissionKeys: PermissionKey[],
  ): Promise<void> {
    const repo = manager.getRepository(RolePermission);
    const rows = permissionKeys.map((permissionKey) =>
      repo.create({ roleId, permissionKey }),
    );
    // name/permission pairs are unique-indexed; upsert avoids duplicate errors.
    await repo.upsert(rows, ['roleId', 'permissionKey']);
  }

  async getPermissionKeysForRoles(
    manager: EntityManager,
    roleIds: string[],
  ): Promise<PermissionKey[]> {
    if (roleIds.length === 0) {
      return [];
    }
    const rows = await manager
      .getRepository(RolePermission)
      .find({ where: { roleId: In(roleIds) } });
    return [...new Set(rows.map((row) => row.permissionKey))];
  }

  /** Idempotently seeds the default `admin`/`member` roles for a new tenant. */
  async seedDefaultRoles(manager: EntityManager): Promise<void> {
    const roleRepo = manager.getRepository(Role);
    for (const seed of DEFAULT_ROLE_SEEDS) {
      let role = await roleRepo.findOne({ where: { name: seed.name } });
      if (!role) {
        role = await roleRepo.save(
          roleRepo.create({
            name: seed.name,
            description: seed.description,
            isSystem: seed.isSystem,
          }),
        );
      }
      await this.assignPermissions(
        manager,
        role.id,
        seed.permissions ?? (ALL_PERMISSION_KEYS as PermissionKey[]),
      );
    }
  }
}
