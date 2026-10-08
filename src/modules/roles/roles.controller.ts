import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Permissions } from '../../common/decorators/permissions.decorator.js';
import { PermissionsGuard } from '../../common/guards/permissions.guard.js';
import type { AuthenticatedUser } from '../../common/types/jwt-payload.interface.js';
import { TenantContextService } from '../../core/tenant-context/tenant-context.service.js';
import { AuditLogService } from '../audit-log/audit-log.service.js';
import { PERMISSIONS } from './constants/permissions.constant.js';
import { CreateRoleDto } from './dto/create-role.dto.js';
import type { Role } from '../../database/schema/index.js';
import { RolesService } from './roles.service.js';

@ApiTags('roles')
@ApiBearerAuth()
@UseGuards(PermissionsGuard)
@Controller('roles')
export class RolesController {
  constructor(
    private readonly rolesService: RolesService,
    private readonly tenantContext: TenantContextService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Get()
  @Permissions(PERMISSIONS.ROLES_READ)
  findAll(): Promise<Role[]> {
    return this.rolesService.findAll(this.tenantContext.getDb());
  }

  @Get(':id')
  @Permissions(PERMISSIONS.ROLES_READ)
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Role> {
    return this.rolesService.findById(this.tenantContext.getDb(), id);
  }

  @Post()
  @Permissions(PERMISSIONS.ROLES_MANAGE)
  async create(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CreateRoleDto,
  ): Promise<Role> {
    const db = this.tenantContext.getDb();
    const role = await this.rolesService.createRole(db, dto);
    await this.auditLogService.record(db, {
      actorUserId: currentUser.sub,
      action: 'role.created',
      entityType: 'role',
      entityId: role.id,
      metadata: { name: role.name },
    });
    return role;
  }
}

