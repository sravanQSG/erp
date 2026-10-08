import { Module } from '@nestjs/common';
import { AuditLogModule } from '../audit-log/audit-log.module.js';
import { RolesModule } from '../roles/roles.module.js';
import { UsersController } from './users.controller.js';
import { TenantUsersService } from './users.service.js';

@Module({
  imports: [RolesModule, AuditLogModule],
  controllers: [UsersController],
  providers: [TenantUsersService],
  exports: [TenantUsersService],
})
export class UsersModule {}
