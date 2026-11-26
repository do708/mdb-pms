# Vercel: database-env voor Prisma-build

`npm run build` draait `prisma generate` + `prisma migrate deploy` + `next build`.
Prisma 7 leest de URL uit `prisma.config.ts` (niet uit `schema.prisma`).

## Verplicht op Vercel

| Variabele | Build | Runtime | Opmerking |
|-----------|-------|---------|-----------|
| `DATABASE_URL` | ja | ja | Postgres-URL (pooler mag voor de app) |
| `DIRECT_URL` | aanbevolen | optioneel | Directe URL zonder pooler voor migraties |

Zet beide op **Production** en **Preview**, en vink **Available at Build Time** aan.
Zonder URL faalt de build met een duidelijke fout uit `scripts/prisma-migrate-deploy.mjs`.

## Aliassen

Als alleen Supabase/Vercel-Postgres-integratievars bestaan, worden ook gelezen:

- `POSTGRES_URL_NON_POOLING`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL`
