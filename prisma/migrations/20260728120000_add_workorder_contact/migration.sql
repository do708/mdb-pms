-- Contactgegevens per werkbon (voor de afspraakmail)
ALTER TABLE "Workorder" ADD COLUMN "contactPersoon" TEXT;
ALTER TABLE "Workorder" ADD COLUMN "contactEmail" TEXT;
ALTER TABLE "Workorder" ADD COLUMN "contactPhone" TEXT;
