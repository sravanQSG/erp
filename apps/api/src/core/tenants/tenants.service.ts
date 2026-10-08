import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_DB } from '../../database/drizzle.constants.js';
import { tenants, type Tenant } from '../../database/schema/index.js';
import * as schema from '../../database/schema/index.js';
import { slugify, withSlugSuffix } from './slug.util.js';

const MAX_SLUG_ATTEMPTS = 50;

@Injectable()
export class TenantsService {
  constructor(
    @Inject(DRIZZLE_DB) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async findAll(): Promise<Tenant[]> {
    return this.db.select().from(tenants).orderBy(desc(tenants.createdAt));
  }

  async findById(id: string): Promise<Tenant> {
    const [tenant] = await this.db
      .select()
      .from(tenants)
      .where(eq(tenants.id, id))
      .limit(1);
    if (!tenant) {
      throw new NotFoundException(`Tenant ${id} not found`);
    }
    return tenant;
  }

  async findBySlug(slug: string): Promise<Tenant | null> {
    const [tenant] = await this.db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, slug))
      .limit(1);
    return tenant ?? null;
  }

  async assertSlugAvailable(slug: string): Promise<void> {
    const existing = await this.findBySlug(slug);
    if (existing) {
      throw new ConflictException(`Tenant slug "${slug}" is already taken`);
    }
  }

  /**
   * Derives a Postgres-schema-safe slug from the tenant's display name and
   * disambiguates it against existing tenants (appending `_2`, `_3`, ... on
   * collision) so callers never have to pick a schema-safe identifier by
   * hand.
   */
  async generateUniqueSlug(name: string): Promise<string> {
    const base = slugify(name);
    if (!(await this.findBySlug(base))) {
      return base;
    }

    for (let attempt = 2; attempt <= MAX_SLUG_ATTEMPTS; attempt++) {
      const candidate = withSlugSuffix(base, attempt);
      if (!(await this.findBySlug(candidate))) {
        return candidate;
      }
    }

    throw new ConflictException(
      `Could not derive a unique slug for tenant name "${name}" after ${MAX_SLUG_ATTEMPTS} attempts`,
    );
  }
}
