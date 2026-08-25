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

/** Intern Bunni-id in de URL (`offerte-334439`), niet het formuliernummer. */
export function looksLikeInternBunniId(value: string | null | undefined): boolean {
    const n = (value || "").trim();
    return /^\d{6,}$/.test(n) && n.startsWith("33");
}

export function bunniOffertePageUrl(
    offertenummer: string | null | undefined
): string | null {
    const number = (offertenummer || "").trim();
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
        const offertenummer = (number || "").trim();
        if (offertenummer && !looksLikeInternBunniId(offertenummer)) {
            return bunniOffertePageUrl(offertenummer);
        }
        const fromId = bunniNumericId(id);
        if (fromId && !looksLikeInternBunniId(fromId)) {
            return bunniOffertePageUrl(fromId);
        }
        return bunniOffertePageUrl(offertenummer || fromId);
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
 * Het cijfer in de URL (`offerte-334439`) is het interne id, niet het
 * offertenummer (`260475`).
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

/** Eén veld: offertenummer of Bunni-link. Pagina gebruikt altijd het formuliernummer. */
export function parseOfferteKoppeling(
    input: string
): OfferteKoppeling | { error: string } {
    const text = input.trim();
    if (!text) {
        return { error: "Plak het offertenummer of de Bunni-link." };
    }

    const fromUrl = parseBunniOfferteUrl(text);
    const numbers = text.match(/\b(\d{4,8})\b/g) || [];
    const fromDigits = text.match(/^\d{4,8}$/) ? text : null;

    const number = (
        offertenummerUitTekst(text, fromUrl?.numeric)
        || (fromDigits && !looksLikeInternBunniId(fromDigits) ? fromDigits : null)
        || (fromUrl && !looksLikeInternBunniId(fromUrl.numeric)
            ? fromUrl.numeric
            : null)
        || numbers.find((value) => !looksLikeInternBunniId(value))
        || ""
    ).trim();

    if (!number || looksLikeInternBunniId(number)) {
        return {
            error:
                "Vul het offertenummer in dat op de offerte staat, bijv. 260475. Het cijfer in de Bunni-URL opent de verkeerde (bovenste) offerte.",
        };
    }

    return {
        id: fromUrl?.id ?? `in_${number}`,
        number,
        pageUrl: bunniOffertePageUrl(number)!,
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
