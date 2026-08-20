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

/** Verplichte locatievelden voor office/admin bij aanmaken en bewerken. */
export function ontbrekendeVerplichteLocatieVelden(input: {
    customerId?: string | null;
    title?: string | null;
    straat?: string | null;
    huisnummer?: string | null;
    city?: string | null;
}): string | null {
    if (!(input.customerId || "").trim()) {
        return "Kies een opdrachtgever";
    }
    if (!(input.title || "").trim()) {
        return "Vul de locatie / filiaalnaam in.";
    }
    if (!(input.straat || "").trim()) {
        return "Vul de straat in.";
    }
    if (!(input.huisnummer || "").trim()) {
        return "Vul het huisnummer in.";
    }
    if (!(input.city || "").trim()) {
        return "Vul de plaats in.";
    }
    return null;
}
