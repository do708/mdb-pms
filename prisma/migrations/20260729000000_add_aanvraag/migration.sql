-- Publieke opdrachtaanvragen + unieke klant-token voor de aanvraaglink.
ALTER TABLE "Customer" ADD COLUMN "publicToken" TEXT;
CREATE UNIQUE INDEX "Customer_publicToken_key" ON "Customer"("publicToken");

CREATE TABLE "Aanvraag" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "locatie" TEXT,
    "straat" TEXT,
    "huisnummer" TEXT,
    "postcode" TEXT,
    "plaats" TEXT,
    "schermen" TEXT,
    "beugel" TEXT,
    "stroom" TEXT,
    "internet" TEXT,
    "opmerkingen" TEXT,
    "bijlagen" JSONB,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Aanvraag_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Aanvraag" ADD CONSTRAINT "Aanvraag_customerId_fkey"
    FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
