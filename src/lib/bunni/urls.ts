const BUNNI_ADMIN_SLUG = "mdb-networks";

export function bunniNumericId(
    id: string | null | undefined
): string | null {
    if (!id) {
        return null;
    }

    const match = String(id).trim().match(/(\d+)\s*$/);
    return match ? match[1] : null;
}

export function bunniPageUrl(
    kind: "offerte" | "factuur",
    id: string | null | undefined
): string | null {
    const numeric = bunniNumericId(id);
    if (!numeric) {
        return null;
    }

    if (kind === "offerte") {
        return `https://mijn.bunni.nl/administratie/${BUNNI_ADMIN_SLUG}/offertemaker/offerte-${numeric}`;
    }

    return `https://mijn.bunni.nl/administratie/${BUNNI_ADMIN_SLUG}/facturen/factuur-${numeric}`;
}

/** Haal het interne Bunni-id uit een offertemaker-link of `offerte-123`. */
export function parseBunniOfferteUrl(
    input: string
): { id: string; numeric: string } | null {
    const match =
        input.match(/offertemaker\/offerte-(\d+)/i)
        || input.match(/\bofferte-(\d+)\b/i)
        || input.trim().match(/^in_(\d+)$/i);

    if (!match) {
        return null;
    }

    return {
        id: `in_${match[1]}`,
        numeric: match[1],
    };
}

/**
 * Offertenummer uit het Bunni-formulier.
 * Het cijfer in de URL (`offerte-334439`) is het interne id, niet het
 * offertenummer (`260470`).
 */
export function offertenummerUitTekst(
    input: string,
    urlNumeric?: string | null
): string | null {
    const numbers = String(input).match(/\b(\d{4,8})\b/g) || [];
    const other = numbers.find((value) => value !== urlNumeric);
    return other || null;
}

/** True als het getoonde nummer het URL-id is in plaats van het formuliernummer. */
export function isBunniUrlIdAsNumber(
    documentId: string | null | undefined,
    number: string | null | undefined
): boolean {
    const numeric = bunniNumericId(documentId);
    const n = (number || "").trim();
    return Boolean(numeric && n && n === numeric);
}
