-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "location" TEXT,
ADD COLUMN     "geoffreerdeUren" DECIMAL(10,2),
ADD COLUMN     "geoffreerdBedrag" DECIMAL(12,2),
ADD COLUMN     "offerteUrl" TEXT,
ADD COLUMN     "offerteFilename" TEXT;

ALTER TABLE "Project" ALTER COLUMN "status" SET DEFAULT 'actief';

-- CreateTable
CREATE TABLE "ProjectUur" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "datum" TIMESTAMP(3) NOT NULL,
    "uren" DECIMAL(6,2) NOT NULL,
    "omschrijving" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectUur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectMateriaal" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "omschrijving" TEXT NOT NULL,
    "aantal" DECIMAL(10,2),
    "kosten" DECIMAL(12,2) NOT NULL,
    "ingekochtOp" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectMateriaal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectUur_projectId_idx" ON "ProjectUur"("projectId");

-- CreateIndex
CREATE INDEX "ProjectUur_userId_idx" ON "ProjectUur"("userId");

-- CreateIndex
CREATE INDEX "ProjectMateriaal_projectId_idx" ON "ProjectMateriaal"("projectId");

-- AddForeignKey
ALTER TABLE "ProjectUur" ADD CONSTRAINT "ProjectUur_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectUur" ADD CONSTRAINT "ProjectUur_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMateriaal" ADD CONSTRAINT "ProjectMateriaal_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
