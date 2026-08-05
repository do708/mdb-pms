-- CreateTable
CREATE TABLE "TravelGeocodeCache" (
    "id" TEXT NOT NULL,
    "queryKey" TEXT NOT NULL,
    "lat" DOUBLE PRECISION,
    "lon" DOUBLE PRECISION,
    "missed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TravelGeocodeCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TravelRouteCache" (
    "id" TEXT NOT NULL,
    "cacheKey" TEXT NOT NULL,
    "fromAddress" TEXT NOT NULL,
    "toAddress" TEXT NOT NULL,
    "kilometers" DOUBLE PRECISION NOT NULL,
    "durationHours" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TravelRouteCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TravelGeocodeCache_queryKey_key" ON "TravelGeocodeCache"("queryKey");

-- CreateIndex
CREATE UNIQUE INDEX "TravelRouteCache_cacheKey_key" ON "TravelRouteCache"("cacheKey");
