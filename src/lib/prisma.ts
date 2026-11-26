import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import {
    looksPooledDatabaseUrl,
    requireDatabaseUrl,
} from "@/lib/dbUrl";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
    pgPool: Pool | undefined;
};

/**
 * Serverless (Vercel): klein pool per isolate.
 * Default pg max=10 × veel cold starts ⇒ Neon "too many connections"
 * (vaak als Prisma P2039 / unmapped driver error).
 */
function poolMax(): number {
    const raw = process.env.PG_POOL_MAX?.trim();
    if (raw && /^\d+$/.test(raw)) {
        const n = Number(raw);
        if (n >= 1 && n <= 20) return n;
    }
    // Gepoold Neon: iets ruimer; direct: streng.
    return 3;
}

function createPool(): Pool {
    const connectionString = requireDatabaseUrl("PrismaClient");
    const max = poolMax();

    if (
        process.env.NODE_ENV === "production" &&
        !looksPooledDatabaseUrl(connectionString)
    ) {
        console.warn(
            "Prisma: DATABASE_URL lijkt niet-gepoold (geen -pooler / :6543). " +
                "Op Vercel serverless liever de Neon pooled connection string " +
                "als DATABASE_URL; DIRECT_URL alleen voor migrate."
        );
    }

    const pool = new Pool({
        connectionString,
        max,
        idleTimeoutMillis: 10_000,
        connectionTimeoutMillis: 10_000,
        allowExitOnIdle: true,
    });

    pool.on("error", (err) => {
        console.error("PG POOL ERROR", err);
    });

    return pool;
}

function getPool(): Pool {
    if (!globalForPrisma.pgPool) {
        globalForPrisma.pgPool = createPool();
    }
    return globalForPrisma.pgPool;
}

function createClient(): PrismaClient {
    const adapter = new PrismaPg(getPool());
    return new PrismaClient({ adapter });
}

function getPrisma(): PrismaClient {
    if (!globalForPrisma.prisma) {
        globalForPrisma.prisma = createClient();
    }
    return globalForPrisma.prisma;
}

/**
 * Lui: geen DB-URL nodig bij import / `next build` page collection.
 * Gooit pas bij het eerste echte databasegebruik.
 */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
    get(_target, prop, _receiver) {
        const client = getPrisma();
        const value = Reflect.get(client, prop, client);
        return typeof value === "function" ? value.bind(client) : value;
    },
});
