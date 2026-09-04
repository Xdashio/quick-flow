# Quick Flow — Kenya M-Pesa-First POS

Single-location retail/grocery POS, offline-first, M-Pesa + cash, KRA eTIMS-ready. Greenfield monorepo: NestJS backend, Electron register, Next.js dashboard, shared types.

Target: single Nairobi retail/grocery | M-Pesa STK Push + Till fallback | no cards | PostgreSQL ledger.

> Blueprint: `pos-system-blueprint.md` (architecture, tax, offline, hardware, pitfalls)

## Stack (verified 2026-09-04)

| Layer | Choice | Version |
|---|---|---|
| Runtime | Node.js Active LTS | 24.x (requires >=20.19) |
| Backend | NestJS | 12.0.1 + Prisma 7.10 + PostgreSQL 16 |
| Types | TypeScript strict | 7.x + `@pos/shared` |
| Register | Electron 44 + React 19 + Vite 8 | SQLite + better-sqlite3 13 + SQLCipher |
| Dashboard | Next.js App Router | 16.3.4 + React 19 |
| Payments | Daraja STK Push (sandbox) + Till manual reconcile | |
| Tax | KRA eTIMS VSCU (queued when offline) | |

## Monorepo layout

```
pos-system-blueprint.md   # technical blueprint (single source of truth)
package.json              # npm workspaces: shared, backend, register, dashboard
docker-compose.yml        # postgres:16-alpine (pos_postgres)
shared/src/index.ts       # canonical types — integer cents, NUMERIC(10,3), enums
backend/                  # NestJS API (Prisma adapter-pg)
  prisma/schema.prisma    # locations, users, products, tax_categories, inventory_movements (ledger), current_inventory (matview), transactions (client-UUID, state machine), transaction_line_items (frozen price/tax), payments, customers
  src/prisma/             # PrismaModule/Service
dashboard/                # Next.js 16 manager dashboard (Phase 0 placeholder, Phase 9 live data)
register/                 # Electron + React 19 SPA (SQLite offline-first, Phase 2 catalog sync)
```

## Quick start

```bash
# DB
npm run db:up        # docker compose up -d (pos_postgres)
npm run db:ready

# Backend (needs DATABASE_URL in backend/.env — see .env.example)
npm run dev:backend  # http://localhost:3000/api  (health: /api/health)

# Dashboard
npm run dev:dashboard # http://localhost:3001

# Register
npm run dev:register  # Electron + Vite
```

Postgres: `postgresql://pos_user:pos_password@localhost:5432/pos_db` (docker-compose)

## Phase 0 — what ships

- Full Prisma schema from blueprint §3 (all tables, FKs, indexes, `inventory_movements` ledger + `current_inventory` matview)
- NestJS skeleton: `GET /api` + `GET /api/health`, Prisma connection, validation pipe, CORS
- Shared types: `UnitType`, `TransactionStatus`, `PaymentMethod`, `InventoryReason`, etc. — integer cents, basis points
- Dashboard & register shells (Phase 0 placeholders, wired to real backend health)
- CI: `.github/workflows/ci.yml` (postgres service, npm ci, build, lint)

See `pos-system-blueprint.md` § Suggested Build Sequence for phases 1-12.

## Phase 1 preview (next commit)

- `POST/GET/PATCH/DELETE /api/products` + `GET /api/products/barcode/:barcode` (real DB, SKU unique, barcode index)
- `POST/GET/PATCH/DELETE /api/tax-categories` (basis points, admin-editable VAT 16%/0%)
- `POST /api/transactions` (DRAFT, client-UUID idempotent) + `PATCH /api/transactions/:id` (guarded state machine)
- `POST /api/inventory/movements` (append-only ledger, refresh matview) + `GET /api/inventory/current/:productId`
- Anti-mock: every endpoint reads/writes real PostgreSQL via Prisma, verified with curl + psql

## Security

- No PCI-DSS (no cards), but: Daraja secrets via env, KRA DPA 2019 PII, M-Pesa receipt reconciliation, PIN + audit logs
- At-rest: Postgres volume encryption + SQLCipher; in-transit: TLS

## License

UNLICENSED (private)
