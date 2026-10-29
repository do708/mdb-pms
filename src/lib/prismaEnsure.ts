import { prisma } from "@/lib/prisma";

let kolomKlaar = false;

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
