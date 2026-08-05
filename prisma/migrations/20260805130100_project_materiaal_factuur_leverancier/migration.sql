-- ProjectMateriaal: aantal vervangen door factuurnummer + leverancier
ALTER TABLE "ProjectMateriaal" DROP COLUMN IF EXISTS "aantal";
ALTER TABLE "ProjectMateriaal" ADD COLUMN IF NOT EXISTS "factuurnummer" TEXT;
ALTER TABLE "ProjectMateriaal" ADD COLUMN IF NOT EXISTS "leverancier" TEXT;
