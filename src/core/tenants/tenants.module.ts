import { Module } from '@nestjs/common';
import { RolesModule } from '../../modules/roles/roles.module.js';
import { TenantProvisioningService } from './tenant-provisioning.service.js';
import { TenantsController } from './tenants.controller.js';
import { TenantsService } from './tenants.service.js';

@Module({
  imports: [RolesModule],
  controllers: [TenantsController],
  providers: [TenantsService, TenantProvisioningService],
  exports: [TenantsService, TenantProvisioningService],
})
export class TenantsModule {}
