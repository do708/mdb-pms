-- Intake-notities op het project + soort bijlage (plattegrond of intake)

ALTER TABLE "Project" ADD COLUMN "intakeTekst" TEXT;

ALTER TABLE "ProjectAttachment" ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'plattegrond';
