-- Modulaire oplever-onderdelen per opdracht (i.p.v. één heel formuliertype)

ALTER TABLE "Workorder" ADD COLUMN "opleverModules" JSONB;
