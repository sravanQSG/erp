import { Injectable } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import type {
  EntityManager,
  EntityTarget,
  ObjectLiteral,
  QueryRunner,
  Repository,
} from 'typeorm';

/**
 * Ergonomic accessor for the current request's tenant context, populated by
 * `TenantContextInterceptor`. Inject this wherever tenant-scoped data needs
 * to be read/written instead of the standard `@InjectRepository()` (which
 * always binds to the main pooled connection's default manager, not the
 * per-request schema-pinned one).
 *
 * Deliberately uses the untyped `ClsService` (not `ClsService<TenantClsStore>`)
 * — nestjs-cls's generic store typing causes "type instantiation excessively
 * deep" errors with our store shape under TS 6's stricter checking. Type
 * safety is instead enforced at this class's own public API boundary.
 */
@Injectable()
export class TenantContextService {
  constructor(private readonly cls: ClsService) {}

  get tenantId(): string | undefined {
    return this.cls.get('tenantId') as string | undefined;
  }

  get schemaName(): string | undefined {
    return this.cls.get('schemaName') as string | undefined;
  }

  getQueryRunner(): QueryRunner {
    const queryRunner = this.cls.get('queryRunner') as QueryRunner | undefined;
    if (!queryRunner) {
      throw new Error(
        'No tenant query runner in the current context. This code path must run within an authenticated, tenant-scoped request.',
      );
    }
    return queryRunner;
  }

  getManager(): EntityManager {
    return this.getQueryRunner().manager;
  }

  getRepository<Entity extends ObjectLiteral>(
    entity: EntityTarget<Entity>,
  ): Repository<Entity> {
    return this.getManager().getRepository(entity);
  }
}
