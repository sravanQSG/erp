// Explicit entity registry — deliberately NOT using TypeORM's glob-string
// `entities: ['dist/**/*.entity.js']` loading. Glob-based dynamic import
// resolves differently (and unreliably) across our three runtimes — `tsc`
// output run by plain `node`, `tsx` running TS CLI scripts directly, and
// Vitest's own module transform for tests — which caused real breakages
// (see session history). Static imports are resolved identically by all
// three, so this sidesteps the whole class of bugs.
import { RefreshToken } from '../core/auth/entities/refresh-token.entity.js';
import { User } from '../core/auth/entities/user.entity.js';
import { Tenant } from '../core/tenants/entities/tenant.entity.js';
import { AuditLog } from '../modules/audit-log/entities/audit-log.entity.js';
import { RolePermission } from '../modules/roles/entities/role-permission.entity.js';
import { Role } from '../modules/roles/entities/role.entity.js';
import { TenantUser } from '../modules/users/entities/tenant-user.entity.js';
import { UserRole } from '../modules/users/entities/user-role.entity.js';

/** Platform (public schema) entities — the only ones the CLI data-source's
 *  `migration:generate`/`migration:run` should ever diff/manage. */
export const publicEntities = [Tenant, User, RefreshToken];

/** Tenant-scoped entities (unqualified — resolved via search_path). Not
 *  managed by this DataSource's migrations (see tenantMigrations), but
 *  still need their metadata registered so `manager.getRepository(X)`
 *  works against a schema-pinned QueryRunner from this same pool. */
export const tenantScopedEntities = [
  Role,
  RolePermission,
  TenantUser,
  UserRole,
  AuditLog,
];

export const allEntities = [...publicEntities, ...tenantScopedEntities];
