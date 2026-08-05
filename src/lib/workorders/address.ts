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
