-- AlterTable
ALTER TABLE "Project" ADD COLUMN "termijn1Gefactureerd" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Project" ADD COLUMN "termijn2Gefactureerd" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Project" ADD COLUMN "termijn3Gefactureerd" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Project" ADD COLUMN "termijn4Gefactureerd" BOOLEAN NOT NULL DEFAULT false;
