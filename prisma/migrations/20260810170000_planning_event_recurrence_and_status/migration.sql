-- AlterTable
ALTER TABLE "PlanningEvent" ADD COLUMN "recurrenceFreq" TEXT NOT NULL DEFAULT 'none';
ALTER TABLE "PlanningEvent" ADD COLUMN "recurrenceInterval" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "PlanningEvent" ADD COLUMN "recurrenceUntil" TIMESTAMP(3);

-- Migrate workorder status afgerond → gefactureerd
UPDATE "Workorder" SET "status" = 'gefactureerd' WHERE "status" = 'afgerond';
