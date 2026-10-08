import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ClsModule } from 'nestjs-cls';
import { TenantConnectionService } from './tenant-connection.service.js';
import { TenantContextInterceptor } from './tenant-context.interceptor.js';
import { TenantContextService } from './tenant-context.service.js';

/**
 * Global module providing tenant-aware database access. Exported services
 * can be injected anywhere without re-importing this module. Relies on
 * `DatabaseModule` (also `@Global()`) being instantiated somewhere in the
 * graph (it's imported in AppModule) to provide `DRIZZLE_POOL`.
 */
@Global()
@Module({
  imports: [ClsModule.forRoot({ global: true })],
  providers: [
    TenantConnectionService,
    TenantContextService,
    { provide: APP_INTERCEPTOR, useClass: TenantContextInterceptor },
  ],
  exports: [TenantConnectionService, TenantContextService],
})
export class TenantContextModule {}
