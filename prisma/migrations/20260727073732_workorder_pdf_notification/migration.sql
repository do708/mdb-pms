-- AlterTable
ALTER TABLE "Workorder" ADD COLUMN     "pdfData" BYTEA,
ADD COLUMN     "pdfGeneratedAt" TIMESTAMP(3),
ADD COLUMN     "sentAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'workorder_sent',
    "title" TEXT NOT NULL,
    "message" TEXT,
    "workorderId" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);
