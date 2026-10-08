import { Inject, Injectable } from '@nestjs/common';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool, type PoolClient } from 'pg';
import { DRIZZLE_POOL } from '../../database/drizzle.constants.js';
import * as schema from '../../database/schema/index.js';

/** Only lowercase letters, digits and underscores, starting with a letter. */
const SAFE_SCHEMA_NAME = /^[a-z][a-z0-9_]*$/;

export interface TenantConnection {
  /** The checked-out pool client — release it back via `release()`. */
  client: PoolClient;
  /** Drizzle instance bound to that same client, so queries run on the
   *  connection whose session has `search_path` pinned to the tenant. */
  db: NodePgDatabase<typeof schema>;
}

/**
 * Low-level primitive for acquiring a Postgres connection pinned (via
 * `SET search_path`) to a specific tenant's schema. Used both by the
 * per-request `TenantContextInterceptor` (keeps the connection open for the
 * whole request) and by one-off call sites outside the HTTP pipeline, e.g.
 * `AuthService` reading tenant-scoped roles at login time before any
 * request-scoped tenant context exists.
 */
@Injectable()
export class TenantConnectionService {
  constructor(@Inject(DRIZZLE_POOL) private readonly pool: Pool) {}

  async acquire(schemaName: string): Promise<TenantConnection> {
    if (!SAFE_SCHEMA_NAME.test(schemaName)) {
      throw new Error(`Refusing to use unsafe schema name: "${schemaName}"`);
    }
    const client = await this.pool.connect();
    await client.query(`SET search_path TO "${schemaName}", public`);
    const db = drizzle(client, { schema });
    return { client, db };
  }

  async release(connection: TenantConnection): Promise<void> {
    try {
      // Reset before returning to the shared pool so a future borrower
      // never inherits a stale tenant search_path.
      await connection.client.query('SET search_path TO "$user", public');
    } finally {
      connection.client.release();
    }
  }

  /** One-off helper for code paths outside the HTTP request pipeline. */
  async runInTenantSchema<T>(
    schemaName: string,
    fn: (db: NodePgDatabase<typeof schema>) => Promise<T>,
  ): Promise<T> {
    const connection = await this.acquire(schemaName);
    try {
      return await fn(connection.db);
    } finally {
      await this.release(connection);
    }
  }
}
