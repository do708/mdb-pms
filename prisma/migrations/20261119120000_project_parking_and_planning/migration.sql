-- AlterTable
ALTER TABLE "ProjectUur" ADD COLUMN IF NOT EXISTS "parkeerkosten" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "PlanningEvent" ADD COLUMN IF NOT EXISTS "projectId" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PlanningEvent_projectId_idx" ON "PlanningEvent"("projectId");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'PlanningEvent_projectId_fkey'
    ) THEN
        ALTER TABLE "PlanningEvent"
            ADD CONSTRAINT "PlanningEvent_projectId_fkey"
            FOREIGN KEY ("projectId") REFERENCES "Project"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
