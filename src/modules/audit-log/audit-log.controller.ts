import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../common/decorators/permissions.decorator.js';
import { PermissionsGuard } from '../../common/guards/permissions.guard.js';
import { TenantContextService } from '../../core/tenant-context/tenant-context.service.js';
import { PERMISSIONS } from '../roles/constants/permissions.constant.js';
import { AuditLogService } from './audit-log.service.js';
import { AuditLog } from './entities/audit-log.entity.js';

@ApiTags('audit-log')
@ApiBearerAuth()
@UseGuards(PermissionsGuard)
@Controller('audit-log')
export class AuditLogController {
  constructor(
    private readonly auditLogService: AuditLogService,
    private readonly tenantContext: TenantContextService,
  ) {}

  @Get()
  @Permissions(PERMISSIONS.AUDIT_LOG_READ)
  findRecent(): Promise<AuditLog[]> {
    return this.auditLogService.findRecent(this.tenantContext.getManager());
  }
}
