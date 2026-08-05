-- AlterTable
ALTER TABLE "ProjectUur" ADD COLUMN "bookedByUserId" TEXT;

-- CreateIndex
CREATE INDEX "ProjectUur_bookedByUserId_idx" ON "ProjectUur"("bookedByUserId");

-- AddForeignKey
ALTER TABLE "ProjectUur" ADD CONSTRAINT "ProjectUur_bookedByUserId_fkey" FOREIGN KEY ("bookedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
