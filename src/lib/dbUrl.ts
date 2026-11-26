/**
 * Postgres-URL helpers voor Vercel/Neon/Supabase.
 *
 * Belangrijk onderscheid:
 * - Runtime (app / PrismaClient): gepoolde URL (PgBouncer / Neon -pooler)
 * - Migraties / CLI: directe URL zonder pooler
 *
 * P2039 op Production kwam o.a. doordat runtime DIRECT_URL (non-pooling)
 * koos → te veel directe connecties vanaf Vercel serverless.
 */

function firstSet(...candidates: Array<string | undefined>): string {
    for (const value of candidates) {
        const trimmed = value?.trim();
        if (trimmed) return trimmed;
    }
    return "";
}

/** Geprefereerd voor Prisma Client op Vercel (serverless). */
export function resolveRuntimeDatabaseUrl(): string {
    return firstSet(
        process.env.DATABASE_URL,
        process.env.POSTGRES_PRISMA_URL,
        process.env.POSTGRES_URL,
        // Laatste redmiddel: direct — beter iets dan crashen bij import.
        process.env.DIRECT_URL,
        process.env.POSTGRES_URL_NON_POOLING
    );
}

/** Geprefereerd voor `prisma migrate deploy` / dumps. */
export function resolveMigrateDatabaseUrl(): string {
    return firstSet(
        process.env.DIRECT_URL,
        process.env.POSTGRES_URL_NON_POOLING,
        process.env.DATABASE_URL,
        process.env.POSTGRES_PRISMA_URL,
        process.env.POSTGRES_URL
    );
}

/** @deprecated Gebruik resolveRuntimeDatabaseUrl of resolveMigrateDatabaseUrl. */
export function resolveDatabaseUrl(): string {
    return resolveRuntimeDatabaseUrl();
}

export function requireDatabaseUrl(context: string): string {
    const url = resolveRuntimeDatabaseUrl();

    if (!url) {
        throw new Error(
            `${context}: geen database-URL. Zet DATABASE_URL (gepoold / Neon -pooler) ` +
                "op Vercel Runtime voor Production én Preview. " +
                "DIRECT_URL / POSTGRES_URL_NON_POOLING alleen voor migraties. " +
                "Aliassen: POSTGRES_PRISMA_URL, POSTGRES_URL."
        );
    }

    return url;
}

/** Heuristiek: Neon/Supabase pooler-hosts. */
export function looksPooledDatabaseUrl(url: string): boolean {
    try {
        const u = new URL(url);
        const host = u.hostname.toLowerCase();
        return (
            host.includes("-pooler.") ||
            host.includes("pooler.") ||
            u.port === "6543" ||
            u.searchParams.get("pgbouncer") === "true"
        );
    } catch {
        return /pooler|pgbouncer=true|:6543/i.test(url);
    }
}
