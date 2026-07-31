-- Add plannedHours to Workorder (duur in uren voor de planning; 8 uur = volle dag)
ALTER TABLE "Workorder" ADD COLUMN "plannedHours" DOUBLE PRECISION;
