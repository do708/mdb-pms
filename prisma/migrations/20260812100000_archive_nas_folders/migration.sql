-- Archiefmappen (1-op-1 met NAS) + archiefstatus op opdrachten

ALTER TABLE "Workorder" ADD COLUMN IF NOT EXISTS "archiveNasPath" TEXT;
ALTER TABLE "Workorder" ADD COLUMN IF NOT EXISTS "archiveLocationLabel" TEXT;
ALTER TABLE "Workorder" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);
ALTER TABLE "Workorder" ADD COLUMN IF NOT EXISTS "archiveStatus" TEXT;
ALTER TABLE "Workorder" ADD COLUMN IF NOT EXISTS "archiveError" TEXT;

CREATE TABLE IF NOT EXISTS "ArchiveFolder" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nasPath" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "parentId" TEXT,
    "customerId" TEXT,
    "locationKey" TEXT,
    "workorderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArchiveFolder_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ArchiveFolder_nasPath_key" ON "ArchiveFolder"("nasPath");
CREATE UNIQUE INDEX IF NOT EXISTS "ArchiveFolder_workorderId_key" ON "ArchiveFolder"("workorderId");
CREATE UNIQUE INDEX IF NOT EXISTS "ArchiveFolder_parentId_slug_key" ON "ArchiveFolder"("parentId", "slug");
CREATE UNIQUE INDEX IF NOT EXISTS "ArchiveFolder_customerId_locationKey_key" ON "ArchiveFolder"("customerId", "locationKey");
CREATE INDEX IF NOT EXISTS "ArchiveFolder_kind_idx" ON "ArchiveFolder"("kind");
CREATE INDEX IF NOT EXISTS "ArchiveFolder_customerId_idx" ON "ArchiveFolder"("customerId");

ALTER TABLE "ArchiveFolder" ADD CONSTRAINT "ArchiveFolder_parentId_fkey"
    FOREIGN KEY ("parentId") REFERENCES "ArchiveFolder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ArchiveFolder" ADD CONSTRAINT "ArchiveFolder_customerId_fkey"
    FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ArchiveFolder" ADD CONSTRAINT "ArchiveFolder_workorderId_fkey"
    FOREIGN KEY ("workorderId") REFERENCES "Workorder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
