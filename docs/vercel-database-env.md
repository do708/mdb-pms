# Vercel: database-env voor Prisma

`npm run build` draait alleen `prisma generate` + `next build`.
**Migraties staan niet in de Vercel-build** — Preview kan zo zonder `DATABASE_URL` bouwen.

Prisma 7 leest de datasource-URL uit `prisma.config.ts` (niet uit `schema.prisma`).

## Migraties (apart van de build)

Voer migraties handmatig / in release-CI uit met een database-URL:

```bash
npm run db:migrate
# = node scripts/prisma-migrate-deploy.mjs → prisma migrate deploy
```

Benodigd: `DATABASE_URL` (én bij voorkeur `DIRECT_URL` zonder pooler).

**Na merge van gereedschap-features:** zonder `db:migrate` missen o.a. `User.gereedschapBeheer` /
`keurmeester` / `overzichtAlleAssets` en de `ToolAsset`-tabellen. Gevolgen op Production:

- **/gebruikers** crashte (API 500 → UI verwachtte een array)
- **/dashboard** toonde “Dashboardgegevens konden niet worden geladen… migraties…” omdat
  `assignedUser: true` álle User-kolommen selecteert, inclusief de nieuwe flags (Prisma P2022)

De app probeert schema runtime bij te werken via `ensureProductionSchema` (o.a. op
API-auth + dashboard), maar **`npm run db:migrate` blijft de bron van waarheid**.

## Migratie draaien (Dominic / Production)

Agent-cloud heeft **geen** Production `DATABASE_URL` — jij moet migrate zelf zetten.

### Optie A — lokaal tegen Neon/Vercel Production DB (aanbevolen)

1. Vercel → Project **mdb-pms** → **Settings** → **Environment Variables**
2. Kopieer `DATABASE_URL` (of beter `DIRECT_URL` / `POSTGRES_URL_NON_POOLING` zonder pooler)
3. Op je machine, in de repo-root:

```bash
export DATABASE_URL='postgresql://…'   # geplakte Production-URL
# optioneel:
export DIRECT_URL='postgresql://…'     # non-pooling als je die hebt
npm run db:migrate
```

Verwacht: `prisma migrate deploy` past o.a. `20261126140000_gereedschap_tools`
(en later `…_purchased_at`) toe. Daarna dashboard/gebruikers/gereedschap weer normaal.

### Optie B — Neon Console

1. Neon → jouw project → SQL Editor (of Migrations)
2. Niet nodig als Optie A werkt; anders handmatig de SQL uit
   `prisma/migrations/20261126140000_gereedschap_tools/migration.sql` (en
   `20261126150000_tool_asset_purchased_at`) uitvoeren.

### Optie C — Vercel CLI (als je die gebruikt)

```bash
vercel env pull .env.local          # haalt Production/Preview env op
npm run db:migrate                  # leest DATABASE_URL / DIRECT_URL uit env
```

Zonder migrate blijft het runtime-ensure een tijdelijk vangnet (eerste authenticated
API-call na deploy).

## Runtime op Vercel

| Variabele | Build | Runtime | Opmerking |
|-----------|-------|---------|-----------|
| `DATABASE_URL` | nee | **ja** | **Gepoolde** Neon-URL (`…-pooler…` / poort 6543) voor de app |
| `DIRECT_URL` | nee | nee (alleen migrate) | Non-pooling URL — **niet** als runtime-primary |
| `PG_POOL_MAX` | nee | optioneel | Default `3` per serverless isolate |

Zet `DATABASE_URL` op **Production** (en Preview) op de **pooled** connection string.
Zet `DIRECT_URL` alleen voor `npm run db:migrate` — de app mag die niet prefereren
(serverless × directe connecties → Neon “too many connections”, vaak als Prisma **P2039**).

## Aliassen

Runtime (`src/lib/dbUrl.ts` → `resolveRuntimeDatabaseUrl`):

- `DATABASE_URL` → `POSTGRES_PRISMA_URL` → `POSTGRES_URL` → pas daarna direct

Migrate (`scripts/prisma-migrate-deploy.mjs` / `prisma.config.ts`):

- `DIRECT_URL` / `POSTGRES_URL_NON_POOLING` eerst, dan pooled fallbacks
