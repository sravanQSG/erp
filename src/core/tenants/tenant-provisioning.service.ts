import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { tenantMigrations } from '../../database/tenant-migrations/index.js';
import { RolesService } from '../../modules/roles/roles.service.js';
import { CreateTenantDto } from './dto/create-tenant.dto.js';
import { Tenant } from './entities/tenant.entity.js';
import { TenantStatus } from './entities/tenant-status.enum.js';
import { TenantsService } from './tenants.service.js';

const SCHEMA_PREFIX = 'tenant_';

@Injectable()
export class TenantProvisioningService {
  private readonly logger = new Logger(TenantProvisioningService.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    private readonly tenantsService: TenantsService,
    private readonly rolesService: RolesService,
  ) {}

  /**
   * Creates the tenant record, provisions its dedicated Postgres schema, and
   * applies all tenant-schema migrations. `dto.slug` is already strictly
   * validated (`[a-z][a-z0-9_]*`) by CreateTenantDto, which is what makes it
   * safe to interpolate into the `CREATE SCHEMA`/`SET search_path` DDL below
   * (Postgres cannot parameterize identifiers).
   */
  async provision(dto: CreateTenantDto): Promise<Tenant> {
    await this.tenantsService.assertSlugAvailable(dto.slug);
    const schemaName = `${SCHEMA_PREFIX}${dto.slug}`;

    const tenant = this.tenantRepository.create({
      name: dto.name,
      slug: dto.slug,
      schemaName,
      status: TenantStatus.PENDING,
    });
    await this.tenantRepository.save(tenant);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    try {
      await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
      await queryRunner.query(`SET search_path TO "${schemaName}", public`);

      for (const Migration of tenantMigrations) {
        const migration = new Migration();
        this.logger.log(
          `Applying tenant migration ${migration.name} to schema ${schemaName}`,
        );
        await migration.up(queryRunner);
      }

      await this.rolesService.seedDefaultRoles(queryRunner.manager);

      tenant.status = TenantStatus.ACTIVE;
      await this.tenantRepository.save(tenant);
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
      await queryRunner.query('SET search_path TO "$user", public');
      await queryRunner.release();
    }

    return tenant;
  }
}
