/** Minimaal e-mail of telefoon (of beide) bij opdrachtgever-aanvraag. */
export const CONTACT_EMAIL_OF_TELEFOON_FOUT =
    "Vul e-mail of telefoon in.";

export function heeftEmailOfTelefoon(
    email?: string | null,
    telefoon?: string | null
): boolean {
    return Boolean(String(email || "").trim() || String(telefoon || "").trim());
}
