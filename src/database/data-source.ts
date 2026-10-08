// Standalone DataSource used only by the TypeORM CLI (migration:generate /
// migration:run / migration:revert) against the platform (public) schema.
// Not used at application runtime — the app wires its own connection via
// `DatabaseModule` (src/database/database.module.ts) using ConfigService.
import { config as loadEnv } from 'dotenv';
import { DataSource } from 'typeorm';
import { databaseConfig } from '../config/configuration.js';
import { buildTypeOrmOptions } from './typeorm-options.factory.js';

// Mirrors AppModule's envFilePath selection so `NODE_ENV=test npm run
// migration:run` (etc.) targets the same erp_test database the e2e suite
// uses, instead of always loading `.env`.
loadEnv({ path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env' });

export const AppDataSource = new DataSource(
  buildTypeOrmOptions(databaseConfig(), { entitiesScope: 'public-only' }),
);
