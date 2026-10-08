import { Global, Inject, Logger, Module, OnModuleDestroy } from '@nestjs/common';
import { ConfigModule, type ConfigType } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import type { Logger as DrizzleLogger } from 'drizzle-orm';
import { Pool } from 'pg';
import { databaseConfig } from '../config/configuration.js';
import { DRIZZLE_DB, DRIZZLE_POOL } from './drizzle.constants.js';
import * as schema from './schema/index.js';

/**
 * Wires the platform (public schema) Postgres connection pool and the
 * pool-backed Drizzle `db` instance used for straightforward public-schema
 * queries (Tenant/User/RefreshToken). Tenant-scoped, schema-pinned access
 * goes through `TenantConnectionService`, which checks out an individual
 * client from this same pool — see src/core/tenant-context. Marked
 * `@Global()` so any module can inject `DRIZZLE_DB`/`DRIZZLE_POOL` without
 * re-importing this module (mirrors how `@nestjs/typeorm`'s core module
 * worked previously).
 */
@Global()
@Module({
  imports: [ConfigModule.forFeature(databaseConfig)],
  providers: [
    {
      provide: DRIZZLE_POOL,
      inject: [databaseConfig.KEY],
      useFactory: (db: ConfigType<typeof databaseConfig>) =>
        new Pool({
          host: db.host,
          port: db.port,
          user: db.username,
          password: db.password,
          database: db.database,
          ssl: db.ssl ? { rejectUnauthorized: false } : false,
          max: db.poolSize,
        }),
    },
    {
      provide: DRIZZLE_DB,
      inject: [DRIZZLE_POOL, databaseConfig.KEY],
      useFactory: (pool: Pool, db: ConfigType<typeof databaseConfig>) => {
        const logger = new Logger('Drizzle');
        const drizzleLogger: DrizzleLogger | boolean = db.logging
          ? { logQuery: (query, params) => logger.debug({ query, params }) }
          : false;
        return drizzle(pool, { schema, logger: drizzleLogger });
      },
    },
  ],
  exports: [DRIZZLE_POOL, DRIZZLE_DB],
})
export class DatabaseModule implements OnModuleDestroy {
  constructor(@Inject(DRIZZLE_POOL) private readonly pool: Pool) {}

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
