// Registry of tenant-schema migrations, applied in order against a new
// tenant's schema by TenantProvisioningService. Populated as business
// modules (users/roles, audit-log, ...) add their tenant-scoped tables.
import type { MigrationInterface } from 'typeorm';
import { InitialTenantSchema1733600000000 } from './1733600000000-InitialTenantSchema.js';
import { CreateAuditLogsTable1733600001000 } from './1733600001000-CreateAuditLogsTable.js';

type MigrationClass = new () => MigrationInterface;

export const tenantMigrations: MigrationClass[] = [
  InitialTenantSchema1733600000000,
  CreateAuditLogsTable1733600001000,
];
