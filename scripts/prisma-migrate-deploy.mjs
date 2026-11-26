#!/usr/bin/env node
/**
 * Runs `prisma migrate deploy` with a resolved database URL from Vercel/local env.
 * Prisma 7 reads the URL from prisma.config.ts; we normalize env names first.
 */
import { spawnSync } from "node:child_process";

function resolveDatabaseUrl() {
    const candidates = [
        process.env.DIRECT_URL,
        process.env.DATABASE_URL,
        process.env.POSTGRES_URL_NON_POOLING,
        process.env.POSTGRES_PRISMA_URL,
        process.env.POSTGRES_URL,
    ];

    for (const value of candidates) {
        const trimmed = value?.trim();
        if (trimmed) {
            return trimmed;
        }
    }

    return "";
}

const url = resolveDatabaseUrl();

if (!url) {
    console.error(`
prisma migrate deploy mislukt: geen database-URL in de omgeving.

Zet op Vercel (Settings → Environment Variables):
  • DATABASE_URL   — verplicht, aan voor Production én Preview
  • DIRECT_URL     — optioneel, directe Postgres-URL (zonder pooler) voor migraties

Zet de vars op "Available at Build Time" (niet alleen Runtime).

Aliases die ook werken: POSTGRES_URL_NON_POOLING, POSTGRES_PRISMA_URL, POSTGRES_URL.
`);
    process.exit(1);
}

if (!process.env.DATABASE_URL?.trim()) {
    process.env.DATABASE_URL = url;
}

if (
    !process.env.DIRECT_URL?.trim()
    && process.env.POSTGRES_URL_NON_POOLING?.trim()
) {
    process.env.DIRECT_URL = process.env.POSTGRES_URL_NON_POOLING.trim();
}

const result = spawnSync(
    "npx",
    ["prisma", "migrate", "deploy"],
    {
        stdio: "inherit",
        env: process.env,
        shell: process.platform === "win32",
    }
);

process.exit(result.status === null ? 1 : result.status);
