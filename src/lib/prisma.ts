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

// Zonder singleton maakt Next tijdens hot-reload steeds nieuwe
// connectiepools aan -> "too many connections" in Postgres.
export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}
