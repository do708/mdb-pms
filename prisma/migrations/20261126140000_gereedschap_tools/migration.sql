-- Gereedschap capability flags op User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "gereedschapBeheer" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "keurmeester" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "overzichtAlleAssets" BOOLEAN NOT NULL DEFAULT false;

-- ToolAsset
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
    "archivedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ToolAsset_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ToolAsset_code_key" ON "ToolAsset"("code");
CREATE INDEX IF NOT EXISTS "ToolAsset_category_idx" ON "ToolAsset"("category");
CREATE INDEX IF NOT EXISTS "ToolAsset_status_idx" ON "ToolAsset"("status");
CREATE INDEX IF NOT EXISTS "ToolAsset_assignedUserId_idx" ON "ToolAsset"("assignedUserId");
CREATE INDEX IF NOT EXISTS "ToolAsset_busKenteken_idx" ON "ToolAsset"("busKenteken");
CREATE INDEX IF NOT EXISTS "ToolAsset_kantoor_idx" ON "ToolAsset"("kantoor");
CREATE INDEX IF NOT EXISTS "ToolAsset_name_idx" ON "ToolAsset"("name");

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
END $$;

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
END $$;

-- ToolInspection
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
);

CREATE INDEX IF NOT EXISTS "ToolInspection_assetId_idx" ON "ToolInspection"("assetId");
CREATE INDEX IF NOT EXISTS "ToolInspection_inspectorId_idx" ON "ToolInspection"("inspectorId");
CREATE INDEX IF NOT EXISTS "ToolInspection_inspectedAt_idx" ON "ToolInspection"("inspectedAt");

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
END $$;

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
END $$;

-- ToolIdSequence
CREATE TABLE IF NOT EXISTS "ToolIdSequence" (
    "category" TEXT NOT NULL,
    "nextValue" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "ToolIdSequence_pkey" PRIMARY KEY ("category")
);

INSERT INTO "ToolIdSequence" ("category", "nextValue") VALUES
    ('G', 1),
    ('L', 1),
    ('T', 1),
    ('E', 1),
    ('M', 1)
ON CONFLICT ("category") DO NOTHING;
