import {
  boolean,
  index,
  jsonb,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { users } from './public.schema.js';

/**
 * Tenant-scoped tables — deliberately plain `pgTable()` (no schema wrapper),
 * so they resolve to whichever schema is current on the connection's
 * `search_path` (set per-request by TenantContextService / per-provisioning
 * by TenantProvisioningService). Column types match the hand-written raw
 * SQL migrations in src/database/tenant-migrations/ exactly (including
 * `timestamptz`, which differs from the public-schema tables' plain
 * `timestamp` — a pre-existing, harmless inconsistency preserved here for
 * a faithful migration rather than introduced).
 */

export const roles = pgTable(
  'roles',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    description: varchar('description', { length: 255 }),
    isSystem: boolean('is_system').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex('idx_roles_name').on(table.name)],
);

export const rolePermissions = pgTable(
  'role_permissions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    permissionKey: varchar('permission_key', { length: 100 }).notNull(),
  },
  (table) => [
    uniqueIndex('idx_role_permissions_role_permission').on(
      table.roleId,
      table.permissionKey,
    ),
  ],
);

export const tenantUsers = pgTable(
  'tenant_users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    // Cross-schema FK to public.users(id) — Drizzle qualifies this
    // automatically since `users` is defined via pgSchema('public').
    globalUserId: uuid('global_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    displayName: varchar('display_name', { length: 255 }).notNull(),
    // Plain varchar (not a Postgres enum type): enum types are
    // schema-scoped, so one here would need recreating in every tenant
    // schema. Validated at the application layer instead.
    status: varchar('status', { length: 20 }).notNull().default('invited'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('idx_tenant_users_global_user_id').on(table.globalUserId),
  ],
);

export const userRoles = pgTable(
  'user_roles',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantUserId: uuid('tenant_user_id')
      .notNull()
      .references(() => tenantUsers.id, { onDelete: 'cascade' }),
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
  },
  (table) => [
    uniqueIndex('idx_user_roles_user_role').on(
      table.tenantUserId,
      table.roleId,
    ),
  ],
);

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    actorUserId: uuid('actor_user_id'),
    action: varchar('action', { length: 100 }).notNull(),
    entityType: varchar('entity_type', { length: 100 }).notNull(),
    entityId: varchar('entity_id', { length: 100 }),
    metadata: jsonb('metadata').$type<Record<string, unknown> | null>(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index('idx_audit_logs_created_at').on(table.createdAt)],
);

// Inferred row types, replacing the old TypeORM entity classes.
export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;
export type RolePermission = typeof rolePermissions.$inferSelect;
export type NewRolePermission = typeof rolePermissions.$inferInsert;
export type TenantUser = typeof tenantUsers.$inferSelect;
export type NewTenantUser = typeof tenantUsers.$inferInsert;
export type UserRole = typeof userRoles.$inferSelect;
export type NewUserRole = typeof userRoles.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;

/** Plain string-literal union replacing the old TypeORM `TenantUserStatus` enum. */
export const TenantUserStatus = {
  INVITED: 'invited',
  ACTIVE: 'active',
  DISABLED: 'disabled',
} as const;
export type TenantUserStatusValue =
  (typeof TenantUserStatus)[keyof typeof TenantUserStatus];
