-- CreateTable
CREATE TABLE "Pakbon" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "filename" TEXT,
    "originalName" TEXT,
    "contentType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pakbon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PakbonWorkorder" (
    "pakbonId" TEXT NOT NULL,
    "workorderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PakbonWorkorder_pkey" PRIMARY KEY ("pakbonId","workorderId")
);

-- CreateIndex
CREATE INDEX "PakbonWorkorder_workorderId_idx" ON "PakbonWorkorder"("workorderId");

-- AddForeignKey
ALTER TABLE "PakbonWorkorder" ADD CONSTRAINT "PakbonWorkorder_pakbonId_fkey" FOREIGN KEY ("pakbonId") REFERENCES "Pakbon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PakbonWorkorder" ADD CONSTRAINT "PakbonWorkorder_workorderId_fkey" FOREIGN KEY ("workorderId") REFERENCES "Workorder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Bestaande formData.klaarzetMateriaal.pakbonUrl → één Pakbon per unieke URL (many-to-many).
INSERT INTO "Pakbon" ("id", "url", "originalName", "createdAt")
SELECT
    md5(src.url),
    src.url,
    NULLIF(split_part(src.url, '/', -1), ''),
    NOW()
FROM (
    SELECT DISTINCT TRIM(w."formData"#>>'{klaarzetMateriaal,pakbonUrl}') AS url
    FROM "Workorder" w
    WHERE w."formData" IS NOT NULL
      AND TRIM(COALESCE(w."formData"#>>'{klaarzetMateriaal,pakbonUrl}', '')) <> ''
) src;

INSERT INTO "PakbonWorkorder" ("pakbonId", "workorderId", "createdAt")
SELECT p."id", w."id", NOW()
FROM "Workorder" w
JOIN "Pakbon" p
  ON p."url" = TRIM(w."formData"#>>'{klaarzetMateriaal,pakbonUrl}')
WHERE TRIM(COALESCE(w."formData"#>>'{klaarzetMateriaal,pakbonUrl}', '')) <> ''
ON CONFLICT DO NOTHING;
