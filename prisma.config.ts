import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * Prisma 7: datasource URL leeft hier (niet in schema.prisma).
 * Op Vercel komen vars via process.env; lokaal via dotenv (.env).
 * Accepteer ook Supabase/Vercel Postgres-aliassen.
 */
function datasourceUrl(): string {
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

const url = datasourceUrl();

// Zorg dat canonieke namen gezet zijn vóór migrate deploy / generate.
if (url) {
    if (!process.env.DATABASE_URL?.trim()) {
        process.env.DATABASE_URL = url;
    }
    if (
        !process.env.DIRECT_URL?.trim()
        && process.env.POSTGRES_URL_NON_POOLING?.trim()
    ) {
        process.env.DIRECT_URL = process.env.POSTGRES_URL_NON_POOLING.trim();
    }
}

export default defineConfig({
    schema: "prisma/schema.prisma",
    migrations: {
        path: "prisma/migrations",
    },
    datasource: {
        // Lege string → Prisma geeft dezelfde "url required"-fout; wrapper
        // in scripts/prisma-migrate-deploy.mjs faalt eerder met duidelijke tekst.
        url,
    },
});
