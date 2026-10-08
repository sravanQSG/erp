import { Injectable } from '@nestjs/common';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { ClsService } from 'nestjs-cls';
import type { PoolClient } from 'pg';
import * as schema from '../../database/schema/index.js';

/**
 * Ergonomic accessor for the current request's tenant context, populated by
 * `TenantContextInterceptor`. Inject this wherever tenant-scoped data needs
 * to be read/written instead of the pool-backed `DRIZZLE_DB` (which always
 * runs against whatever the connection's default `search_path` is, not the
 * per-request schema-pinned one).
 *
 * Deliberately uses the untyped `ClsService` (not a generically-typed
 * store) — nestjs-cls's generic store typing caused "type instantiation
 * excessively deep" errors under TS 6's stricter checking during the
 * original (TypeORM-based) implementation of this class; type safety is
 * instead enforced at this class's own public API boundary.
 */
@Injectable()
export class TenantContextService {
  constructor(private readonly cls: ClsService) {}

  get tenantId(): string | undefined {
    return this.cls.get('tenantId') as string | undefined;
  }

  get schemaName(): string | undefined {
    return this.cls.get('schemaName') as string | undefined;
  }

  getClient(): PoolClient {
    const client = this.cls.get('client') as PoolClient | undefined;
    if (!client) {
      throw new Error(
        'No tenant connection in the current context. This code path must run within an authenticated, tenant-scoped request.',
      );
    }
    return client;
  }

  getDb(): NodePgDatabase<typeof schema> {
    const db = this.cls.get('db') as NodePgDatabase<typeof schema> | undefined;
    if (!db) {
      throw new Error(
        'No tenant db in the current context. This code path must run within an authenticated, tenant-scoped request.',
      );
    }
    return db;
  }
}
