-- DropForeignKey
ALTER TABLE "Workorder" DROP CONSTRAINT "Workorder_projectId_fkey";

-- AlterTable
ALTER TABLE "Workorder" ADD COLUMN     "customerId" TEXT,
ADD COLUMN     "location" TEXT,
ALTER COLUMN "status" SET DEFAULT 'ontvangen',
ALTER COLUMN "projectId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Workorder" ADD CONSTRAINT "Workorder_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workorder" ADD CONSTRAINT "Workorder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
