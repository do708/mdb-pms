-- Uitgebreide specificaties + naam aanvrager op de aanvraag.
ALTER TABLE "Aanvraag" ADD COLUMN "aanvragerNaam" TEXT;
ALTER TABLE "Aanvraag" ADD COLUMN "specificaties" JSONB;
