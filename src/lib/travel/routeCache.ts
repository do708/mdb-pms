import { createHash } from "crypto";

import { prisma } from "@/lib/prisma";

export function normalizeAddress(address: string): string {
    return address.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Cache Sleutel = MD5(Vertrekadres + "_" + Aankomstadres) */
export function routePairCacheKey(
    fromAddress: string,
    toAddress: string
): string {
    const from = normalizeAddress(fromAddress);
    const to = normalizeAddress(toAddress);
    return createHash("md5").update(`${from}_${to}`).digest("hex");
}

/** Multi-stop: MD5 van genormaliseerde stops gescheiden door "_" */
export function routePathCacheKey(addresses: string[]): string {
    const joined = addresses.map(normalizeAddress).join("_");
    return createHash("md5").update(joined).digest("hex");
}

export async function getCachedGeocode(
    query: string
): Promise<{ lat: number; lon: number } | null | "miss"> {
    const queryKey = normalizeAddress(query);

    const row = await prisma.travelGeocodeCache.findUnique({
        where: { queryKey },
    });

    if (!row) {
        return null;
    }

    if (row.missed || row.lat == null || row.lon == null) {
        return "miss";
    }

    return { lat: row.lat, lon: row.lon };
}

export async function setCachedGeocode(
    query: string,
    coords: { lat: number; lon: number } | null
): Promise<void> {
    const queryKey = normalizeAddress(query);

    await prisma.travelGeocodeCache.upsert({
        where: { queryKey },
        create: {
            queryKey,
            lat: coords?.lat ?? null,
            lon: coords?.lon ?? null,
            missed: coords == null,
        },
        update: {
            lat: coords?.lat ?? null,
            lon: coords?.lon ?? null,
            missed: coords == null,
        },
    });
}

export async function getCachedRoute(
    cacheKey: string
): Promise<{ kilometers: number; reisuren: number } | null> {
    const row = await prisma.travelRouteCache.findUnique({
        where: { cacheKey },
    });

    if (!row) {
        return null;
    }

    return {
        kilometers: row.kilometers,
        reisuren: row.durationHours,
    };
}

export async function setCachedRoute(
    cacheKey: string,
    fromAddress: string,
    toAddress: string,
    result: { kilometers: number; reisuren: number }
): Promise<void> {
    await prisma.travelRouteCache.upsert({
        where: { cacheKey },
        create: {
            cacheKey,
            fromAddress: normalizeAddress(fromAddress),
            toAddress: normalizeAddress(toAddress),
            kilometers: result.kilometers,
            durationHours: result.reisuren,
        },
        update: {
            kilometers: result.kilometers,
            durationHours: result.reisuren,
        },
    });
}
