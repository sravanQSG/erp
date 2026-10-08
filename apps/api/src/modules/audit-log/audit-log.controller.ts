import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../common/decorators/permissions.decorator.js';
import { PermissionsGuard } from '../../common/guards/permissions.guard.js';
import { TenantContextService } from '../../core/tenant-context/tenant-context.service.js';
import { PERMISSIONS } from '@demo-erp/shared-types';
import { AuditLogService } from './audit-log.service.js';
import type { AuditLog } from '../../database/schema/index.js';

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
    return this.auditLogService.findRecent(this.tenantContext.getDb());
  }
}
