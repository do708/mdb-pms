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
