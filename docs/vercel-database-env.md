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

## Runtime op Vercel

| Variabele | Build | Runtime | Opmerking |
|-----------|-------|---------|-----------|
| `DATABASE_URL` | nee (niet nodig voor build) | **ja** | Postgres-URL voor de app |
| `DIRECT_URL` | nee | optioneel | Directe URL; vooral nuttig bij `npm run db:migrate` |

Zet `DATABASE_URL` in ieder geval op **Production** (en Preview als Preview de DB moet praten).
Build Time is voor migrate niet meer verplicht.

## Aliassen

`scripts/prisma-migrate-deploy.mjs` en `prisma.config.ts` lezen ook:

- `POSTGRES_URL_NON_POOLING`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL`
