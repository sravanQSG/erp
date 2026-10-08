import type { PoolClient } from 'pg';

/** Creates the tenant-scoped audit_logs table. See InitialTenantSchema for
 *  the search_path-based schema resolution this relies on. */
export const createAuditLogsTable = {
  name: 'CreateAuditLogsTable1733600001000',

  async up(client: PoolClient): Promise<void> {
    await client.query(`
      CREATE TABLE "audit_logs" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "actor_user_id" uuid,
        "action" varchar(100) NOT NULL,
        "entity_type" varchar(100) NOT NULL,
        "entity_id" varchar(100),
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await client.query(
      `CREATE INDEX "idx_audit_logs_created_at" ON "audit_logs" ("created_at")`,
    );
  },

  async down(client: PoolClient): Promise<void> {
    await client.query(`DROP TABLE IF EXISTS "audit_logs"`);
  },
};
