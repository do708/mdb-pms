import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { requireDatabaseUrl } from "@/lib/dbUrl";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

function createClient() {
    const adapter = new PrismaPg({
        connectionString: requireDatabaseUrl("PrismaClient"),
    });

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
