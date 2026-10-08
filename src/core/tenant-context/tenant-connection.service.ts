import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, QueryRunner } from 'typeorm';

/** Only lowercase letters, digits and underscores, starting with a letter. */
const SAFE_SCHEMA_NAME = /^[a-z][a-z0-9_]*$/;

/**
 * Low-level primitive for acquiring a Postgres connection pinned (via
 * `SET search_path`) to a specific tenant's schema. Used both by the
 * per-request `TenantContextInterceptor` (keeps the connection open for the
 * whole request) and by one-off call sites outside the HTTP pipeline, e.g.
 * `AuthService` reading tenant-scoped roles at login time before any
 * request-scoped tenant context exists.
 */
@Injectable()
export class TenantConnectionService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async acquire(schemaName: string): Promise<QueryRunner> {
    if (!SAFE_SCHEMA_NAME.test(schemaName)) {
      throw new Error(`Refusing to use unsafe schema name: "${schemaName}"`);
    }
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.query(`SET search_path TO "${schemaName}", public`);
    return queryRunner;
  }

  async release(queryRunner: QueryRunner): Promise<void> {
    try {
      // Reset before returning to the shared pool so a future borrower
      // never inherits a stale tenant search_path.
      await queryRunner.query('SET search_path TO "$user", public');
    } finally {
      await queryRunner.release();
    }
  }

  /** One-off helper for code paths outside the HTTP request pipeline. */
  async runInTenantSchema<T>(
    schemaName: string,
    fn: (queryRunner: QueryRunner) => Promise<T>,
  ): Promise<T> {
    const queryRunner = await this.acquire(schemaName);
    try {
      return await fn(queryRunner);
    } finally {
      await this.release(queryRunner);
    }
  }
}
