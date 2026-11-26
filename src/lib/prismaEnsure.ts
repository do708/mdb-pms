import { prisma } from "@/lib/prisma";
import { ensureUserDocumentsTable } from "@/lib/users/ensureUserDocuments";

let kolomKlaar = false;
let pakbonTabellenKlaar = false;
let gereedschapUserColsKlaar = false;
let gereedschapSchemaKlaar = false;

/** User-capability kolommen die Prisma bij `assignedUser: true` altijd SELECT't. */
export async function ensureGereedschapUserColumns(): Promise<boolean> {
    if (gereedschapUserColsKlaar) {
        return true;
    }

    try {
        await prisma.$executeRawUnsafe(
            `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "gereedschapBeheer" BOOLEAN NOT NULL DEFAULT false`
        );
        await prisma.$executeRawUnsafe(
            `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "keurmeester" BOOLEAN NOT NULL DEFAULT false`
        );
        await prisma.$executeRawUnsafe(
            `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "overzichtAlleAssets" BOOLEAN NOT NULL DEFAULT false`
        );
        gereedschapUserColsKlaar = true;
        return true;
    } catch (error) {
        console.error("ENSURE GEREEDSCHAP USER COLUMNS", error);
        return false;
    }
}

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

/**
 * Gereedschap (migratie 20261126140000 + purchasedAt).
 * Zonder deze kolommen/tabellen crasht o.a. /api/users en /gereedschap
 * als `npm run db:migrate` nog niet op de DB is gedraaid.
 */
export async function ensureGereedschapSchema(): Promise<void> {
    if (gereedschapSchemaKlaar) {
        return;
    }

    // User-kolommen eerst en apart: dashboard/workorders crashen hierop,
    // ook als Tool*-DDL op de pooler faalt.
    await ensureGereedschapUserColumns();

    try {
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "ToolAsset" (
                "id" TEXT NOT NULL,
                "code" TEXT NOT NULL,
                "category" TEXT NOT NULL,
                "name" TEXT NOT NULL,
                "serialNumber" TEXT,
                "photoUrl" TEXT,
                "assignedUserId" TEXT,
                "busKenteken" TEXT,
                "kantoor" BOOLEAN NOT NULL DEFAULT false,
                "status" TEXT NOT NULL DEFAULT 'nog_te_keuren',
                "nextInspectionAt" TIMESTAMP(3),
                "lastInspectionAt" TIMESTAMP(3),
                "purchasedAt" TIMESTAMP(3),
                "archivedAt" TIMESTAMP(3),
                "notes" TEXT,
                "createdById" TEXT,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "ToolAsset_pkey" PRIMARY KEY ("id")
            )
        `);
        await prisma.$executeRawUnsafe(
            `ALTER TABLE "ToolAsset" ADD COLUMN IF NOT EXISTS "purchasedAt" TIMESTAMP(3)`
        );
        await prisma.$executeRawUnsafe(
            `CREATE UNIQUE INDEX IF NOT EXISTS "ToolAsset_code_key" ON "ToolAsset"("code")`
        );
        await prisma.$executeRawUnsafe(
            `CREATE INDEX IF NOT EXISTS "ToolAsset_category_idx" ON "ToolAsset"("category")`
        );
        await prisma.$executeRawUnsafe(
            `CREATE INDEX IF NOT EXISTS "ToolAsset_status_idx" ON "ToolAsset"("status")`
        );
        await prisma.$executeRawUnsafe(
            `CREATE INDEX IF NOT EXISTS "ToolAsset_assignedUserId_idx" ON "ToolAsset"("assignedUserId")`
        );
        await prisma.$executeRawUnsafe(
            `CREATE INDEX IF NOT EXISTS "ToolAsset_busKenteken_idx" ON "ToolAsset"("busKenteken")`
        );
        await prisma.$executeRawUnsafe(
            `CREATE INDEX IF NOT EXISTS "ToolAsset_kantoor_idx" ON "ToolAsset"("kantoor")`
        );
        await prisma.$executeRawUnsafe(
            `CREATE INDEX IF NOT EXISTS "ToolAsset_name_idx" ON "ToolAsset"("name")`
        );

        await prisma.$executeRawUnsafe(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'ToolAsset_assignedUserId_fkey'
                ) THEN
                    ALTER TABLE "ToolAsset"
                        ADD CONSTRAINT "ToolAsset_assignedUserId_fkey"
                        FOREIGN KEY ("assignedUserId") REFERENCES "User"("id")
                        ON DELETE SET NULL ON UPDATE CASCADE;
                END IF;
            END $$
        `);
        await prisma.$executeRawUnsafe(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'ToolAsset_createdById_fkey'
                ) THEN
                    ALTER TABLE "ToolAsset"
                        ADD CONSTRAINT "ToolAsset_createdById_fkey"
                        FOREIGN KEY ("createdById") REFERENCES "User"("id")
                        ON DELETE SET NULL ON UPDATE CASCADE;
                END IF;
            END $$
        `);

        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "ToolInspection" (
                "id" TEXT NOT NULL,
                "assetId" TEXT NOT NULL,
                "inspectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "inspectorId" TEXT NOT NULL,
                "result" TEXT NOT NULL,
                "checklist" JSONB NOT NULL,
                "notes" TEXT,
                "validUntil" TIMESTAMP(3),
                "pdfUrl" TEXT,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "ToolInspection_pkey" PRIMARY KEY ("id")
            )
        `);
        await prisma.$executeRawUnsafe(
            `CREATE INDEX IF NOT EXISTS "ToolInspection_assetId_idx" ON "ToolInspection"("assetId")`
        );
        await prisma.$executeRawUnsafe(
            `CREATE INDEX IF NOT EXISTS "ToolInspection_inspectorId_idx" ON "ToolInspection"("inspectorId")`
        );
        await prisma.$executeRawUnsafe(
            `CREATE INDEX IF NOT EXISTS "ToolInspection_inspectedAt_idx" ON "ToolInspection"("inspectedAt")`
        );
        await prisma.$executeRawUnsafe(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'ToolInspection_assetId_fkey'
                ) THEN
                    ALTER TABLE "ToolInspection"
                        ADD CONSTRAINT "ToolInspection_assetId_fkey"
                        FOREIGN KEY ("assetId") REFERENCES "ToolAsset"("id")
                        ON DELETE CASCADE ON UPDATE CASCADE;
                END IF;
            END $$
        `);
        await prisma.$executeRawUnsafe(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'ToolInspection_inspectorId_fkey'
                ) THEN
                    ALTER TABLE "ToolInspection"
                        ADD CONSTRAINT "ToolInspection_inspectorId_fkey"
                        FOREIGN KEY ("inspectorId") REFERENCES "User"("id")
                        ON DELETE RESTRICT ON UPDATE CASCADE;
                END IF;
            END $$
        `);

        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "ToolIdSequence" (
                "category" TEXT NOT NULL,
                "nextValue" INTEGER NOT NULL DEFAULT 1,
                CONSTRAINT "ToolIdSequence_pkey" PRIMARY KEY ("category")
            )
        `);
        await prisma.$executeRawUnsafe(`
            INSERT INTO "ToolIdSequence" ("category", "nextValue") VALUES
                ('G', 1), ('L', 1), ('T', 1), ('E', 1), ('M', 1)
            ON CONFLICT ("category") DO NOTHING
        `);

        gereedschapSchemaKlaar = true;
    } catch (error) {
        console.error("ENSURE GEREEDSCHAP SCHEMA", error);
    }
}

/**
 * Alle bekende “schema achter migratie”-vangnetten in één keer.
 * Aanroepen vanuit auth-guards zodat o.a. dashboard (`assignedUser: true`)
 * niet crasht wanneer `npm run db:migrate` nog niet op Production is gedraaid.
 */
export async function ensureProductionSchema(): Promise<void> {
    // User-cols synchroon eerst — daarna parallel de rest.
    await ensureGereedschapUserColumns();
    await Promise.all([
        ensureWorkorderOpdrachtnummerKolom(),
        ensurePakbonTables(),
        ensureGereedschapSchema(),
        ensureUserDocumentsTable(),
    ]);
}
