-- Snapshot van klantaanvraag-specificaties op de werkbon (gestructureerde admin-weergave).
ALTER TABLE "Workorder" ADD COLUMN "aanvraagSpecificaties" JSONB;
