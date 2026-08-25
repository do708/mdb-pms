-- Koppeling van projecten en opdrachten aan Bunni-offertes en -facturen

ALTER TABLE "Project"
ADD COLUMN "bunniOfferteId" TEXT,
ADD COLUMN "bunniOfferteNummer" TEXT,
ADD COLUMN "bunniOffertePdfUrl" TEXT,
ADD COLUMN "bunniFactuurId" TEXT,
ADD COLUMN "bunniFactuurNummer" TEXT,
ADD COLUMN "bunniFactuurPdfUrl" TEXT;

ALTER TABLE "Workorder"
ADD COLUMN "bunniOfferteId" TEXT,
ADD COLUMN "bunniOfferteNummer" TEXT,
ADD COLUMN "bunniOffertePdfUrl" TEXT,
ADD COLUMN "bunniFactuurId" TEXT,
ADD COLUMN "bunniFactuurNummer" TEXT,
ADD COLUMN "bunniFactuurPdfUrl" TEXT;
