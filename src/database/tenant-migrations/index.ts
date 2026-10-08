// Registry of tenant-schema migrations, applied in order against a new
// tenant's schema by TenantProvisioningService. Populated as business
// modules (users/roles, audit-log, ...) add their tenant-scoped tables.
import type { PoolClient } from 'pg';
import { initialTenantSchema } from './1733600000000-InitialTenantSchema.js';
import { createAuditLogsTable } from './1733600001000-CreateAuditLogsTable.js';

export interface TenantMigration {
  name: string;
  up(client: PoolClient): Promise<void>;
  down(client: PoolClient): Promise<void>;
}

export const tenantMigrations: TenantMigration[] = [
  initialTenantSchema,
  createAuditLogsTable,
];
