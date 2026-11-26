/**
 * Resolves the Postgres URL from Vercel/Supabase/local env names.
 * Prefer a direct (non-pooler) URL for migrations when present.
 */
export function resolveDatabaseUrl(): string {
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

export function requireDatabaseUrl(context: string): string {
    const url = resolveDatabaseUrl();

    if (!url) {
        throw new Error(
            `${context}: geen database-URL. Zet DATABASE_URL (en optioneel DIRECT_URL) ` +
                "op Vercel voor Production én Preview, beschikbaar bij Build. " +
                "Alternatieven: POSTGRES_URL_NON_POOLING, POSTGRES_PRISMA_URL, POSTGRES_URL."
        );
    }

    return url;
}
