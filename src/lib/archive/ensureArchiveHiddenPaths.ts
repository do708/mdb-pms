import { prisma } from "@/lib/prisma";
import { archiveFolderPathKey } from "@/lib/archive/formatArchiveLocationName";

let klaar = false;

/** Runtime-vangnet als migrate deploy nog niet is gedraaid. */
export async function ensureArchiveHiddenPathsTable(): Promise<void> {
    if (klaar) {
        return;
    }

    try {
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "ArchiveHiddenPath" (
                "id" TEXT NOT NULL,
                "pathKey" TEXT NOT NULL,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "ArchiveHiddenPath_pkey" PRIMARY KEY ("id")
            )
        `);
        await prisma.$executeRawUnsafe(`
            CREATE UNIQUE INDEX IF NOT EXISTS "ArchiveHiddenPath_pathKey_key"
            ON "ArchiveHiddenPath"("pathKey")
        `);
        klaar = true;
    } catch (error) {
        console.error("ENSURE ARCHIVE HIDDEN PATHS TABLE", error);
    }
}

export async function listArchiveHiddenPathKeys(): Promise<string[]> {
    await ensureArchiveHiddenPathsTable();

    try {
        const rows = await prisma.archiveHiddenPath.findMany({
            select: { pathKey: true },
        });

        return rows.map((row) => row.pathKey);
    } catch (error) {
        console.error("LIST ARCHIVE HIDDEN PATHS", error);
        return [];
    }
}

/** Markeer een map-pad als verborgen (opdracht blijft bestaan). */
export async function hideArchiveFolderPath(path: string[]): Promise<string> {
    await ensureArchiveHiddenPathsTable();

    const pathKey = archiveFolderPathKey(path);

    if (!pathKey) {
        throw new Error("Pad ontbreekt");
    }

    await prisma.archiveHiddenPath.upsert({
        where: { pathKey },
        create: { pathKey },
        update: {},
    });

    return pathKey;
}

/** Wis verborgen-markering als de map opnieuw wordt aangemaakt. */
export async function clearArchiveHiddenPath(path: string[]): Promise<void> {
    await ensureArchiveHiddenPathsTable();

    const pathKey = archiveFolderPathKey(path);

    if (!pathKey) {
        return;
    }

    await prisma.archiveHiddenPath
        .deleteMany({ where: { pathKey } })
        .catch(() => {});
}
