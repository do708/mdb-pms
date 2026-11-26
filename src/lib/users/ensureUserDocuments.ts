import { prisma } from "@/lib/prisma";

let klaar = false;

/** Runtime-vangnet als migrate deploy nog niet is gedraaid. */
export async function ensureUserDocumentsTable(): Promise<void> {
    if (klaar) {
        return;
    }

    try {
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "UserDocument" (
                "id" TEXT NOT NULL,
                "userId" TEXT NOT NULL,
                "type" TEXT NOT NULL,
                "number" TEXT,
                "expiresAt" TIMESTAMP(3),
                "neverExpires" BOOLEAN NOT NULL DEFAULT false,
                "fileUrl" TEXT NOT NULL,
                "fileName" TEXT,
                "originalName" TEXT,
                "contentType" TEXT,
                "expiryNotifiedAt" TIMESTAMP(3),
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "UserDocument_pkey" PRIMARY KEY ("id")
            )
        `);
        await prisma.$executeRawUnsafe(
            `CREATE INDEX IF NOT EXISTS "UserDocument_userId_idx" ON "UserDocument"("userId")`
        );
        await prisma.$executeRawUnsafe(
            `CREATE INDEX IF NOT EXISTS "UserDocument_expiresAt_idx" ON "UserDocument"("expiresAt")`
        );
        await prisma.$executeRawUnsafe(
            `CREATE INDEX IF NOT EXISTS "UserDocument_expiryNotifiedAt_idx" ON "UserDocument"("expiryNotifiedAt")`
        );
        try {
            await prisma.$executeRawUnsafe(`
                ALTER TABLE "UserDocument"
                ADD CONSTRAINT "UserDocument_userId_fkey"
                FOREIGN KEY ("userId") REFERENCES "User"("id")
                ON DELETE CASCADE ON UPDATE CASCADE
            `);
        } catch {
            // constraint bestaat al
        }
        klaar = true;
    } catch (error) {
        console.error("ENSURE USER DOCUMENT TABLE", error);
    }
}
