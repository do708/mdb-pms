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

/**
 * Intern Bunni-id in de paginalink (`offerte-334165`), niet het
 * offertenummer op het formulier (`260466`).
 */
export function looksLikeInternBunniId(value: string | null | undefined): boolean {
    const n = (value || "").trim();
    return /^\d{6,}$/.test(n) && n.startsWith("33");
}

export function bunniOffertePageUrl(
    urlId: string | null | undefined
): string | null {
    const number = bunniNumericId(urlId) || (urlId || "").trim();
    if (!number) {
        return null;
    }
    return `https://mijn.bunni.nl/administratie/${BUNNI_ADMIN_SLUG}/offertemaker/offerte-${number}`;
}

export function bunniPageUrl(
    kind: "offerte" | "factuur",
    id: string | null | undefined,
    number?: string | null
): string | null {
    if (kind === "offerte") {
        const fromId = bunniNumericId(id);
        if (fromId && fromId !== (number || "").trim()) {
            return bunniOffertePageUrl(fromId);
        }
        if (fromId && looksLikeInternBunniId(fromId)) {
            return bunniOffertePageUrl(fromId);
        }
        return bunniOffertePageUrl(fromId || number);
    }

    const numeric = bunniNumericId(id);
    if (!numeric) {
        return null;
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
 * Het cijfer in de URL (`offerte-334165`) is het interne id, niet het
 * offertenummer (`260466`).
 */
export function offertenummerUitTekst(
    input: string,
    urlNumeric?: string | null
): string | null {
    const numbers = String(input).match(/\b(\d{4,8})\b/g) || [];
    const other = numbers.find((value) => value !== urlNumeric);
    return other || null;
}

export type OfferteKoppeling = {
    id: string;
    number: string;
    pageUrl: string;
};

export function parseOfferteKoppeling(input: {
    number?: string;
    url?: string;
}): OfferteKoppeling | { error: string } {
    const numberText = (input.number || "").trim();
    const urlText = (input.url || "").trim();
    const combined = `${numberText} ${urlText}`.trim();

    if (!combined) {
        return {
            error: "Plak de Bunni-paginalink en vul het offertenummer in.",
        };
    }

    const fromUrl =
        parseBunniOfferteUrl(urlText)
        || parseBunniOfferteUrl(numberText)
        || parseBunniOfferteUrl(combined);

    const typedNumber = /^\d{4,8}$/.test(numberText) ? numberText : null;
    const number = (
        (typedNumber && typedNumber !== fromUrl?.numeric ? typedNumber : null)
        || offertenummerUitTekst(combined, fromUrl?.numeric)
        || ""
    ).trim();

    if (!fromUrl) {
        return {
            error:
                "Plak de Bunni-paginalink, bijv. …/offertemaker/offerte-334165. Dat is de pagina van deze offerte.",
        };
    }

    if (!number || number === fromUrl.numeric || looksLikeInternBunniId(number)) {
        return {
            error:
                "Vul het offertenummer in dat op de offerte staat, bijv. 260466. Dat is niet het cijfer in de Bunni-URL.",
        };
    }

    return {
        id: fromUrl.id,
        number,
        pageUrl: bunniOffertePageUrl(fromUrl.numeric)!,
    };
}

/** True als het getoonde nummer het URL-id is in plaats van het formuliernummer. */
export function isBunniUrlIdAsNumber(
    documentId: string | null | undefined,
    number: string | null | undefined
): boolean {
    const n = (number || "").trim();
    if (looksLikeInternBunniId(n)) {
        return true;
    }
    const numeric = bunniNumericId(documentId);
    return Boolean(numeric && n && n === numeric && looksLikeInternBunniId(numeric));
}

/** Gekoppeld met alleen het formuliernummer, zonder echte paginalink. */
export function offertePaginaMistUrlId(
    documentId: string | null | undefined,
    number: string | null | undefined
): boolean {
    const numeric = bunniNumericId(documentId);
    const n = (number || "").trim();
    if (!numeric || !n) {
        return false;
    }
    return numeric === n;
}
