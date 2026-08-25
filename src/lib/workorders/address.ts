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
