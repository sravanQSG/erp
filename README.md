# demo-erp

A multi-tenant ERP application: NestJS + PostgreSQL + Drizzle ORM backend,
RS256 JWT authentication, and a React 19 + Vite frontend — managed as a
pnpm workspace monorepo.

## Workspace layout

```
apps/
├── api/              # NestJS backend — see apps/api/README.md for full details
└── web/               # React 19 + Vite SPA — see apps/web/README.md
packages/
└── shared-types/     # Shared TypeScript types (JWT payload, permission keys,
                        # API request/response DTOs) imported by both apps
```

- **`@demo-erp/api`** ([apps/api](apps/api)) — the backend. Multi-tenant
  (schema-per-tenant Postgres), Drizzle ORM, RS256-signed JWTs, RBAC. See
  [apps/api/README.md](apps/api/README.md) for architecture, setup, and the
  full script reference.
- **`@demo-erp/web`** ([apps/web](apps/web)) — the frontend. Plain React
  SPA (no SSR needed — the API is a separate, already-authenticated-via-
  Bearer-token service) using TanStack Router/Query, React Hook Form + Zod,
  shadcn/ui + Tailwind, and TanStack Table.
- **`@demo-erp/shared-types`** ([packages/shared-types](packages/shared-types))
  — the single source of truth for types shared across the boundary (JWT
  payload shape, permission keys, DTO-shaped request/response types), so
  the frontend and backend can't silently drift apart.

## Prerequisites

- Node.js 24+
- [pnpm](https://pnpm.io/) (via [Corepack](https://nodejs.org/api/corepack.html):
  `corepack enable` then `corepack prepare pnpm@latest --activate`)
- A local or reachable PostgreSQL 16+ instance (see
  [apps/api/README.md](apps/api/README.md#prerequisites))

## Getting started

```bash
# from the repo root
pnpm install
```

Then follow [apps/api/README.md](apps/api/README.md) to create the
database, environment files, JWT signing keys, run migrations, and seed the
first platform admin.

### Running both apps

```bash
pnpm dev:api    # NestJS backend, watch mode — http://localhost:3001
pnpm dev:web    # Vite dev server — http://localhost:3000
```

The backend's `CORS_ORIGIN` (`apps/api/.env`) must match the frontend's dev
origin (`http://localhost:3000` by default) for browser requests to
succeed.

- API: `http://localhost:3001`
- Swagger docs: `http://localhost:3001/api/docs`
- Frontend: `http://localhost:3000`

## Local dev credentials

> ⚠️ **Local development only.** These are seeded/reset values for the
> `erp_dev` database on this machine — never use these values, or commit
> real credentials, for a shared/production environment.

**Database** (`apps/api/.env`):

| | |
|---|---|
| Host / port | `localhost:5432` |
| Database | `erp_dev` |
| User | `erp_app` |
| Password | `erp_app_dev_pw` |

**Login accounts** (`POST /auth/login` via the UI or API):

| Email | Password | Role |
|---|---|---|
| `admin@platform.local` | `DevPassword123!` | Platform admin (manages tenants) |
| `owner@globex.com` | `DevPassword123!` | Tenant admin — Globex Corp (`tenant_globex`) |

Other seeded tenant users (`owner@acme.com`, `owner@beta.com`,
`staffer@acme.com`) exist in the dev database but keep whatever password
they were created with locally — reset them the same way if needed (see
[apps/api/README.md](apps/api/README.md#resetting-a-local-password)).

## Root scripts

These fan out to every workspace package via `pnpm -r` (recursive), or
target a single app directly:

| Command | Purpose |
|---|---|
| `pnpm dev:api` | Start the backend in watch mode |
| `pnpm dev:web` | Start the frontend dev server |
| `pnpm build` | Build every package (`shared-types` → `api` → `web`) |
| `pnpm lint` | Lint every package |
| `pnpm test` | Run every package's test suite |
| `pnpm format` | Format every package with Prettier |

To target a single package directly, use pnpm's `--filter`:

```bash
pnpm --filter @demo-erp/api test:e2e
pnpm --filter @demo-erp/web build
```

## Why a monorepo + pnpm

- A shared `packages/shared-types` package keeps the JWT payload shape,
  permission keys, and DTO contracts in sync between frontend and backend
  at compile time — a mismatch becomes a type error instead of a runtime
  surprise.
- pnpm's content-addressable store + strict `node_modules` symlinking keeps
  install fast and avoids phantom dependencies (a package can only import
  what it actually declares as a dependency).
- `pnpm -r`/`--filter` give per-package or whole-workspace script fan-out
  without extra tooling (no Turborepo/Nx needed at this scale).

## Why not Next.js for the frontend

The frontend is a plain React SPA (Vite), not a server-rendered framework.
There's no SEO requirement (it's an internal/authenticated ERP tool) and
auth is Bearer-token-based against an already-separate API, so
server-side rendering would add deployment/infra complexity (a Node
server, hydration, RSC data-fetching conventions) without a matching
benefit here.
