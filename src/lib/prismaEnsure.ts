import { prisma } from "@/lib/prisma";

let kolomKlaar = false;
let pakbonTabellenKlaar = false;

/** Zorgt dat productie de kolom heeft die Prisma  al in het schema verwacht. */
export async function ensureWorkorderOpdrachtnummerKolom(): Promise<void> {
    if (kolomKlaar) {
        return;
    }

    try {
        await prisma.$executeRawUnsafe(
            `ALTER TABLE "Workorder" ADD COLUMN IF NOT EXISTS "opdrachtnummerOpdrachtgever" TEXT`
        );
        kolomKlaar = true;
    } catch (error) {
        console.error("ENSURE OPDRACHTNUMMER KOLOM", error);
    }
}

/**
 * Pakbon many-to-many (migratie 20261119100000). Als die nog niet op
 * productie staat, crasht Prisma-include `pakbonnen` de hele werkbon-GET.
 */
export async function ensurePakbonTables(): Promise<void> {
    if (pakbonTabellenKlaar) {
        return;
    }

    try {
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "Pakbon" (
                "id" TEXT NOT NULL,
                "url" TEXT NOT NULL,
                "filename" TEXT,
                "originalName" TEXT,
                "contentType" TEXT,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "Pakbon_pkey" PRIMARY KEY ("id")
            )
        `);
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "PakbonWorkorder" (
                "pakbonId" TEXT NOT NULL,
                "workorderId" TEXT NOT NULL,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "PakbonWorkorder_pkey" PRIMARY KEY ("pakbonId","workorderId")
            )
        `);
        await prisma.$executeRawUnsafe(`
            CREATE INDEX IF NOT EXISTS "PakbonWorkorder_workorderId_idx"
            ON "PakbonWorkorder"("workorderId")
        `);
        try {
            await prisma.$executeRawUnsafe(`
                ALTER TABLE "PakbonWorkorder"
                ADD CONSTRAINT "PakbonWorkorder_pakbonId_fkey"
                FOREIGN KEY ("pakbonId") REFERENCES "Pakbon"("id")
                ON DELETE CASCADE ON UPDATE CASCADE
            `);
        } catch {
            // constraint bestaat al
        }
        try {
            await prisma.$executeRawUnsafe(`
                ALTER TABLE "PakbonWorkorder"
                ADD CONSTRAINT "PakbonWorkorder_workorderId_fkey"
                FOREIGN KEY ("workorderId") REFERENCES "Workorder"("id")
                ON DELETE CASCADE ON UPDATE CASCADE
            `);
        } catch {
            // constraint bestaat al
        }
        pakbonTabellenKlaar = true;
    } catch (error) {
        console.error("ENSURE PAKBON TABELLEN", error);
    }
}
