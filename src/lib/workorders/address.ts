/** Bouw legacy `location` (= straat + huisnummer) voor backwards compatibility. */
export function combineStreetAddress(
    straat?: string | null,
    huisnummer?: string | null
): string | null {
    const line = [straat?.trim(), huisnummer?.trim()]
        .filter(Boolean)
        .join(" ")
        .trim();
    return line || null;
}

/**
 * Splits "Kerkstraat 12a" in straat + huisnummer.
 * Geen nummer achteraan: alles blijft straat.
 */
export function splitStreetAddress(line: string): {
    straat: string;
    huisnummer: string;
} {
    const trimmed = line.trim();
    const match = trimmed.match(/^(.*?)\s+(\d+.*)$/);

    if (!match || !match[1].trim()) {
        return { straat: trimmed, huisnummer: "" };
    }

    return {
        straat: match[1].trim(),
        huisnummer: match[2].trim(),
    };
}

/**
 * Lees straat/huisnummer uit een payload: één gecombineerd veld, of de
 * bestaande aparte kolommen. Zo blijven oude aanvragen en werkbonnen werken.
 */
export function straatHuisnummerUitPayload(input: {
    straat?: unknown;
    huisnummer?: unknown;
    straatHuisnummer?: unknown;
}): { straat: string | null; huisnummer: string | null } {
    const combined =
        typeof input.straatHuisnummer === "string"
            ? input.straatHuisnummer.trim()
            : "";

    if (combined) {
        const parsed = splitStreetAddress(combined);
        return {
            straat: parsed.straat || null,
            huisnummer: parsed.huisnummer || null,
        };
    }

    const straat =
        typeof input.straat === "string" ? input.straat.trim() : "";
    const huisnummer =
        typeof input.huisnummer === "string" ? input.huisnummer.trim() : "";

    if (straat && !huisnummer) {
        const parsed = splitStreetAddress(straat);
        return {
            straat: parsed.straat || null,
            huisnummer: parsed.huisnummer || null,
        };
    }

    return {
        straat: straat || null,
        huisnummer: huisnummer || null,
    };
}

/** Verplichte locatievelden voor office/admin bij aanmaken en bewerken. */
export function ontbrekendeVerplichteLocatieVelden(input: {
    customerId?: string | null;
    title?: string | null;
    straat?: string | null;
    huisnummer?: string | null;
    city?: string | null;
    contactPersoon?: string | null;
}): string | null {
    if (!(input.customerId || "").trim()) {
        return "Kies een opdrachtgever";
    }
    if (!(input.title || "").trim()) {
        return "Vul de locatie / filiaalnaam in.";
    }
    if (!(input.straat || "").trim()) {
        return "Vul straat en huisnummer in.";
    }
    if (!(input.city || "").trim()) {
        return "Vul de plaats in.";
    }
    if (!(input.contactPersoon || "").trim()) {
        return "Vul de contactpersoon op locatie in.";
    }
    return null;
}
