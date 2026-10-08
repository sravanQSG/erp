import { config as loadEnv } from 'dotenv';
import { defineConfig } from 'drizzle-kit';
import { databaseConfig } from './src/config/configuration.js';

// Mirrors AppModule's/data-source's envFilePath selection so
// `NODE_ENV=test npx drizzle-kit migrate` targets erp_test instead of
// always loading `.env`. `override: true` is required: drizzle-kit itself
// auto-loads plain `.env` unconditionally before this file runs, and
// dotenv's default `override: false` would otherwise silently keep those
// (wrong-database) values instead of the ones loaded here.
loadEnv({
  path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
  override: true,
});

const db = databaseConfig();

export default defineConfig({
  dialect: 'postgresql',
  // Only the platform (public-schema) tables are managed by drizzle-kit —
  // tenant-scoped tables are created per-tenant by TenantProvisioningService
  // via the raw-SQL functions in src/database/tenant-migrations/.
  schema: './src/database/schema/public.schema.ts',
  out: './src/database/migrations',
  dbCredentials: {
    host: db.host,
    port: db.port,
    user: db.username,
    password: db.password,
    database: db.database,
    ssl: db.ssl,
  },
});
