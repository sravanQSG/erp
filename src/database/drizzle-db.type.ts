import type { NodePgQueryResultHKT } from 'drizzle-orm/node-postgres';
import type { PgDatabase } from 'drizzle-orm/pg-core';
import type * as schema from './schema/index.js';

/**
 * Structural type covering the pool-backed `DRIZZLE_DB` instance, a
 * schema-pinned per-request instance (`TenantContextService.getDb()`), and
 * a `db.transaction(async (tx) => ...)` callback's `tx` — all three expose
 * the same query-builder surface (`NodePgDatabase`/`PgTransaction` both
 * extend `PgDatabase`), so service methods can accept this one type
 * regardless of which of the three the caller passes in.
 */
export type DrizzleDb = PgDatabase<NodePgQueryResultHKT, typeof schema>;
