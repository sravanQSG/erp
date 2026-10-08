# demo-erp

A multi-tenant ERP backend built with NestJS, PostgreSQL, TypeORM, and RS256 JWT
authentication.

## Architecture summary

- **Multi-tenancy:** shared Postgres database, **one schema per tenant**
  (`tenant_<slug>`). Platform-level data (tenants, global user identities,
  refresh tokens) lives in the `public` schema.
- **Tenant resolution:** happens only via the signed JWT (`tenantId` +
  `schemaName` claims) — no subdomain/header involved. A request's tenant
  schema is pinned on a dedicated `QueryRunner` for the lifetime of the
  request (`SET search_path`), stored in an AsyncLocalStorage-backed context
  (`TenantContextService`, via `nestjs-cls`) so services/controllers can
  reach tenant data without prop-drilling a connection.
- **Auth:** RS256-signed JWTs (`keys/private.pem` signs, `keys/public.pem`
  verifies), Argon2id password hashing (`@node-rs/argon2`), hashed +
  rotated refresh tokens, and a `tokenVersion` claim for instant
  session revocation.
- **RBAC:** roles are tenant-scoped (`roles`, `role_permissions`,
  `user_roles` tables per tenant schema); permission keys are a code
  constant (`src/modules/roles/constants/permissions.constant.ts`), checked
  via `@Permissions()` + `PermissionsGuard`. Platform-wide actions (tenant
  management) use a separate `platform_admin` role on the global user.
- **Validation:** `class-validator`/`class-transformer` DTOs + a global
  `ValidationPipe` (whitelist, forbid unknown properties, auto-transform).

See [src/core](src/core) (platform-level: tenants, auth, tenant-context) vs
[src/modules](src/modules) (tenant-scoped: users, roles, audit-log) for how
the codebase reflects this split.

## Prerequisites

- Node.js 24+
- A local or reachable PostgreSQL 16+ instance
- No Docker required for local dev if you already have Postgres running
  natively (see `docker-compose.yml` if you'd rather run Postgres in a
  container instead)

## First-time setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Create the database + a dedicated app role** (don't use the Postgres
   superuser for the app). Example using `psql`:
   ```sql
   CREATE ROLE erp_app LOGIN PASSWORD 'change-me';
   CREATE DATABASE erp_dev OWNER erp_app;
   GRANT ALL PRIVILEGES ON DATABASE erp_dev TO erp_app;
   -- optional, for running the e2e suite against a separate DB:
   CREATE DATABASE erp_test OWNER erp_app;
   GRANT ALL PRIVILEGES ON DATABASE erp_test TO erp_app;
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # edit .env: at minimum set DB_USERNAME/DB_PASSWORD/DB_DATABASE to match step 2
   cp .env.test.example .env.test   # only needed to run the e2e suite
   ```

4. **Generate the RS256 JWT signing key pair** (gitignored, one per
   environment — never commit real keys):
   ```bash
   npm run keys:generate
   ```

5. **Run database migrations** (public/platform schema only — tenant
   schemas are created and migrated automatically when a tenant is
   provisioned, see `TenantProvisioningService`):
   ```bash
   npm run migration:run
   ```

6. **Seed the first platform admin.** There's deliberately no HTTP endpoint
   for this — creating a platform admin requires already being one:
   ```bash
   npm run seed:platform-admin -- admin@example.com "a strong password"
   ```

7. **Build and run**
   ```bash
   npm run build
   npm run start:prod   # or: npm run start:dev for a watch-mode dev loop
   ```
   The API listens on `http://localhost:3000` by default; Swagger docs are
   at `http://localhost:3000/api/docs`.

## Typical flow once running

1. `POST /auth/login` as the platform admin seeded above.
2. `POST /tenants` (platform admin only) to provision a new tenant — this
   creates its Postgres schema, runs tenant-schema migrations, and seeds
   default `admin`/`member` roles.
3. `POST /auth/tenants/:tenantId/admin-user` (platform admin only) to
   bootstrap that tenant's first admin user.
4. From then on, that tenant admin can `POST /auth/users` to invite more
   users into their own tenant, `POST /roles` to add custom roles, etc.

## Scripts

| Command | Purpose |
|---|---|
| `npm run start:dev` | Watch-mode dev server |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run start:prod` | Run the compiled app (`node dist/main.js`) |
| `npm run lint` | oxlint (type-aware) |
| `npm run test` | Unit tests (Vitest) |
| `npm run test:e2e` | e2e tests against the `erp_test` database (needs `.env.test` + migrations run with `NODE_ENV=test`) |
| `npm run keys:generate` | Generate a local RS256 key pair under `keys/` |
| `npm run seed:platform-admin -- <email> <password>` | Bootstrap the first platform admin |
| `npm run migration:generate -- src/database/migrations/<Name>` | Generate a new **public-schema** migration from entity changes |
| `npm run migration:run` / `migration:revert` | Apply/roll back public-schema migrations |

Tenant-schema migrations are a separate registry
(`src/database/tenant-migrations/index.ts`, applied by
`TenantProvisioningService` at tenant-creation time) — add new tenant-scoped
tables there, not to `src/database/migrations/`.

## Running the e2e suite

```bash
NODE_ENV=test npm run migration:run   # once, against erp_test
npm run test:e2e
```

## Project layout

```
src/
├── main.ts, app.module.ts
├── config/              # env validation (Joi) + typed config factories
├── common/              # decorators, guards, filters, interceptors, middleware
├── database/            # DataSource options, explicit entity/migration registries
├── core/                # platform-level (public schema)
│   ├── auth/             # global users, refresh tokens, JWT strategy
│   ├── tenants/           # Tenant entity + provisioning (CREATE SCHEMA + migrate)
│   └── tenant-context/     # AsyncLocalStorage + per-request schema switching
└── modules/              # tenant-scoped (resolved via search_path)
    ├── users/, roles/, audit-log/
```
