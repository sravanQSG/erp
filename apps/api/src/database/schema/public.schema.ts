import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

/**
 * Platform-level tables. Plain `pgTable()` — Drizzle explicitly disallows
 * wrapping tables in `pgSchema('public')` (it errors: use `pgTable()`
 * directly, since that's already unqualified/public by convention). This is
 * safe for us because none of these table names collide with any
 * tenant-scoped table name (see tenant.schema.ts): `tenants`/`users`/
 * `refresh_tokens` vs. `roles`/`role_permissions`/`tenant_users`/
 * `user_roles`/`audit_logs`.
 *
 * Column types/names/defaults are kept bug-for-bug identical to the
 * TypeORM entities they replace, since this is a live database with
 * existing data (see also tenant.schema.ts).
 */

export const tenantStatusEnum = pgEnum('tenants_status_enum', [
  'pending',
  'active',
  'suspended',
]);

export const tenants = pgTable(
  'tenants',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 63 }).notNull(),
    schemaName: varchar('schema_name', { length: 63 }).notNull(),
    status: tenantStatusEnum('status').notNull().default('pending'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('idx_tenants_slug').on(table.slug),
    uniqueIndex('idx_tenants_schema_name').on(table.schemaName),
  ],
);

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: varchar('email', { length: 255 }).notNull(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    // Nullable: tenant-less platform admins (see session notes) have no
    // tenant at all; regular tenant users always have one.
    tenantId: uuid('tenant_id'),
    isPlatformAdmin: boolean('is_platform_admin').notNull().default(false),
    tokenVersion: integer('token_version').notNull().default(0),
    status: varchar('status', { length: 20 }).notNull().default('active'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('idx_users_email').on(table.email),
    index('idx_users_tenant_id').on(table.tenantId),
  ],
);

export const refreshTokens = pgTable(
  'refresh_tokens',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull(),
    tokenHash: varchar('token_hash', { length: 64 }).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('idx_refresh_tokens_user_id').on(table.userId),
    uniqueIndex('idx_refresh_tokens_token_hash').on(table.tokenHash),
  ],
);

// Inferred row types, replacing the old TypeORM entity classes.
export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type RefreshToken = typeof refreshTokens.$inferSelect;
export type NewRefreshToken = typeof refreshTokens.$inferInsert;

/** Plain string-literal union replacing the old TypeORM `TenantStatus` enum. */
export const TenantStatus = {
  PENDING: 'pending',
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
} as const;
export type TenantStatusValue = (typeof TenantStatus)[keyof typeof TenantStatus];

/** Plain string-literal union replacing the old TypeORM `UserStatus` enum. */
export const UserStatus = {
  ACTIVE: 'active',
  DISABLED: 'disabled',
} as const;
export type UserStatusValue = (typeof UserStatus)[keyof typeof UserStatus];
