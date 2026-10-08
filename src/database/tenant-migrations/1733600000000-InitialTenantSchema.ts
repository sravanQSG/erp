import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates the core tenant-scoped RBAC tables (roles, role_permissions,
 * tenant_users, user_roles) inside whichever schema is current on the
 * query runner's connection (set via `SET search_path` by
 * TenantProvisioningService before invoking this migration — see
 * src/core/tenants/tenant-provisioning.service.ts). Table names are
 * intentionally unqualified so they resolve through search_path; the one
 * exception is the FK to `public.users`, which is always fully qualified.
 */
export class InitialTenantSchema1733600000000 implements MigrationInterface {
  name = 'InitialTenantSchema1733600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "roles" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(100) NOT NULL,
        "description" varchar(255),
        "is_system" boolean NOT NULL DEFAULT false,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_roles_name" ON "roles" ("name")`,
    );

    await queryRunner.query(`
      CREATE TABLE "role_permissions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "role_id" uuid NOT NULL REFERENCES "roles"("id") ON DELETE CASCADE,
        "permission_key" varchar(100) NOT NULL
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_role_permissions_role_permission" ON "role_permissions" ("role_id", "permission_key")`,
    );

    await queryRunner.query(`
      CREATE TABLE "tenant_users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "global_user_id" uuid NOT NULL REFERENCES "public"."users"("id") ON DELETE CASCADE,
        "display_name" varchar(255) NOT NULL,
        "status" varchar(20) NOT NULL DEFAULT 'invited',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_tenant_users_global_user_id" ON "tenant_users" ("global_user_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE "user_roles" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_user_id" uuid NOT NULL REFERENCES "tenant_users"("id") ON DELETE CASCADE,
        "role_id" uuid NOT NULL REFERENCES "roles"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_user_roles_user_role" ON "user_roles" ("tenant_user_id", "role_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "user_roles"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "tenant_users"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "role_permissions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "roles"`);
  }
}
