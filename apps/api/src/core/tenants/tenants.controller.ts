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
import { Roles } from '../../common/decorators/roles.decorator.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { CreateTenantDto } from './dto/create-tenant.dto.js';
import type { Tenant } from '../../database/schema/index.js';
import { TenantProvisioningService } from './tenant-provisioning.service.js';
import { TenantsService } from './tenants.service.js';

/**
 * Platform-admin only: managing tenants themselves (as opposed to data
 * within a tenant). Guarded by the global JwtAuthGuard plus `platform_admin`
 * role, which AuthService grants only to users with `isPlatformAdmin=true`.
 */
@ApiTags('tenants')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles('platform_admin')
@Controller('tenants')
export class TenantsController {
  constructor(
    private readonly tenantsService: TenantsService,
    private readonly tenantProvisioningService: TenantProvisioningService,
  ) {}

  @Post()
  create(@Body() dto: CreateTenantDto): Promise<Tenant> {
    return this.tenantProvisioningService.provision(dto);
  }

  @Get()
  findAll(): Promise<Tenant[]> {
    return this.tenantsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Tenant> {
    return this.tenantsService.findById(id);
  }
}
