-- Verborgen archiefpaden: map wissen zonder opdracht te verwijderen
CREATE TABLE IF NOT EXISTS "ArchiveHiddenPath" (
    "id" TEXT NOT NULL,
    "pathKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ArchiveHiddenPath_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ArchiveHiddenPath_pathKey_key"
    ON "ArchiveHiddenPath"("pathKey");
