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
import { PERMISSIONS } from '../roles/constants/permissions.constant.js';
import { AssignRoleDto } from './dto/assign-role.dto.js';
import { TenantUser } from './entities/tenant-user.entity.js';
import { TenantUsersService } from './users.service.js';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(PermissionsGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: TenantUsersService,
    private readonly tenantContext: TenantContextService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Get()
  @Permissions(PERMISSIONS.USERS_READ)
  findAll(): Promise<TenantUser[]> {
    return this.usersService.findAll(this.tenantContext.getManager());
  }

  @Get(':id')
  @Permissions(PERMISSIONS.USERS_READ)
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<TenantUser> {
    return this.usersService.findById(this.tenantContext.getManager(), id);
  }

  @Post(':id/roles')
  @Permissions(PERMISSIONS.USERS_UPDATE)
  async assignRole(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignRoleDto,
  ): Promise<{ success: true }> {
    const manager = this.tenantContext.getManager();
    await this.usersService.assignRole(manager, id, dto.roleId);
    await this.auditLogService.record(manager, {
      actorUserId: currentUser.sub,
      action: 'user.role_assigned',
      entityType: 'tenant_user',
      entityId: id,
      metadata: { roleId: dto.roleId },
    });
    return { success: true };
  }
}
