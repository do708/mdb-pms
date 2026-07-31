-- Correspondentie / bijlagen bij een werkbon (mails, PDF's, afbeeldingen, ...)
CREATE TABLE "WorkorderAttachment" (
    "id" TEXT NOT NULL,
    "workorderId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "filename" TEXT,
    "originalName" TEXT,
    "contentType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkorderAttachment_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "WorkorderAttachment" ADD CONSTRAINT "WorkorderAttachment_workorderId_fkey" FOREIGN KEY ("workorderId") REFERENCES "Workorder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
