import type { DataSourceOptions } from 'typeorm';
import type { DatabaseConfig } from '../config/configuration.js';
import { allEntities, publicEntities } from './entities.js';
import { publicMigrations } from './migrations/index.js';

/**
 * Shared TypeORM options for the platform (public schema) connection, used
 * by both the NestJS `DatabaseModule` and the standalone CLI `data-source`
 * (for `typeorm migration:*` commands) — but with different `entities`
 * scope for each, see `entitiesScope` below.
 *
 * Deliberately does NOT set a connection-level `schema` option: platform
 * (public-schema) entities explicitly declare `@Entity({ schema: 'public' })`
 * so they always resolve to `public` regardless of the current Postgres
 * `search_path`. Tenant-scoped entities declare no schema at all — they
 * resolve dynamically via `SET search_path` applied per-request by
 * `TenantContextService` (see src/core/tenant-context). This avoids
 * TypeORM hardcoding a schema prefix that would defeat per-tenant switching.
 *
 * `entitiesScope`:
 * - `'all'` (used by the running app's `DatabaseModule`) registers every
 *   entity, both platform and tenant-scoped. This is required even though
 *   tenant-scoped tables aren't managed by this connection's migrations:
 *   `queryRunner.manager.getRepository(X)` needs `X`'s metadata to exist on
 *   the DataSource, regardless of which schema a query ultimately targets
 *   via `search_path`.
 * - `'public-only'` (used by the CLI `data-source.ts`, for
 *   `migration:generate`/`migration:run` against the public schema) scopes
 *   to platform entities only, so schema-diffing never tries to create
 *   tenant tables in `public` — those are created per-tenant via
 *   TenantProvisioningService + the separate `tenantMigrations` registry.
 */
export function buildTypeOrmOptions(
  db: DatabaseConfig,
  { entitiesScope = 'all' }: { entitiesScope?: 'all' | 'public-only' } = {},
): DataSourceOptions {
  return {
    type: 'postgres',
    host: db.host,
    port: db.port,
    username: db.username,
    password: db.password,
    database: db.database,
    ssl: db.ssl ? { rejectUnauthorized: false } : false,
    logging: db.logging,
    poolSize: db.poolSize,
    synchronize: false,
    migrationsRun: false,
    entities: entitiesScope === 'public-only' ? publicEntities : allEntities,
    migrations: publicMigrations,
  };
}
