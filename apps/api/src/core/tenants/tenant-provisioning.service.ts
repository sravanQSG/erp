import { Inject, Injectable, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { DRIZZLE_DB, DRIZZLE_POOL } from '../../database/drizzle.constants.js';
import { tenants, TenantStatus, type Tenant } from '../../database/schema/index.js';
import * as schema from '../../database/schema/index.js';
import { tenantMigrations } from '../../database/tenant-migrations/index.js';
import { RolesService } from '../../modules/roles/roles.service.js';
import { CreateTenantDto } from './dto/create-tenant.dto.js';
import { TenantsService } from './tenants.service.js';

const SCHEMA_PREFIX = 'tenant_';

@Injectable()
export class TenantProvisioningService {
  private readonly logger = new Logger(TenantProvisioningService.name);

  constructor(
    @Inject(DRIZZLE_POOL) private readonly pool: Pool,
    @Inject(DRIZZLE_DB) private readonly db: NodePgDatabase<typeof schema>,
    private readonly tenantsService: TenantsService,
    private readonly rolesService: RolesService,
  ) {}

  /**
   * Creates the tenant record, provisions its dedicated Postgres schema, and
   * applies all tenant-schema migrations. The schema-safe slug is derived
   * from `dto.name` (see `TenantsService.generateUniqueSlug`/`slugify`),
   * which is what makes it safe to interpolate into the `CREATE SCHEMA`/
   * `SET search_path` DDL below (Postgres cannot parameterize identifiers).
   */
  async provision(dto: CreateTenantDto): Promise<Tenant> {
    const slug = await this.tenantsService.generateUniqueSlug(dto.name);
    const schemaName = `${SCHEMA_PREFIX}${slug}`;

    const [tenant] = await this.db
      .insert(tenants)
      .values({
        name: dto.name,
        slug,
        schemaName,
        status: TenantStatus.PENDING,
      })
      .returning();

    const client = await this.pool.connect();
    try {
      await client.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
      await client.query(`SET search_path TO "${schemaName}", public`);

      for (const migration of tenantMigrations) {
        this.logger.log(
          `Applying tenant migration ${migration.name} to schema ${schemaName}`,
        );
        await migration.up(client);
      }

      const tenantDb = drizzle(client, { schema });
      await this.rolesService.seedDefaultRoles(tenantDb);

      const [activated] = await this.db
        .update(tenants)
        .set({ status: TenantStatus.ACTIVE })
        .where(eq(tenants.id, tenant.id))
        .returning();

      return activated;
    } catch (error) {
      this.logger.error(
        `Failed to provision tenant schema ${schemaName}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    } finally {
      // Defense in depth: this connection returns to the shared pool, so
      // reset its session search_path rather than leaving it pointed at a
      // tenant schema for whoever acquires it next.
      await client.query('SET search_path TO "$user", public');
      client.release();
    }
  }
}
