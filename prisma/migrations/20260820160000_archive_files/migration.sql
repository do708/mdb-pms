-- Losse archiefbestanden in mappen (NAS of Supabase)

CREATE TABLE IF NOT EXISTS "ArchiveFile" (
    "id" TEXT NOT NULL,
    "folderId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "storage" TEXT NOT NULL DEFAULT 'supabase',
    "storagePath" TEXT NOT NULL,
    "url" TEXT,
    "contentType" TEXT,
    "size" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArchiveFile_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ArchiveFile_folderId_idx" ON "ArchiveFile"("folderId");

ALTER TABLE "ArchiveFile" ADD CONSTRAINT "ArchiveFile_folderId_fkey"
    FOREIGN KEY ("folderId") REFERENCES "ArchiveFolder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
