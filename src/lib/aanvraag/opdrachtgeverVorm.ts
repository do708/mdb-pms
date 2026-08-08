/**
 * Welke aanvraag-variant per opdrachtgever.
 */

export function normaliseerOpdrachtgever(naam: string): string {
    return naam.trim().toLowerCase().replace(/\s+/g, "");
}

export function isEvalue8Opdrachtgever(naam: string): boolean {
    return normaliseerOpdrachtgever(naam) === "evalue8";
}

/** Alleen uren-aanvraag (geen installatie/storing). */
export function isUrenOnlyOpdrachtgever(naam: string): boolean {
    const n = normaliseerOpdrachtgever(naam);
    return n === "axians" || n === "hofcon";
}
