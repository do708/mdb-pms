export const USER_DOCUMENT_TYPES = [
    "id_kaart",
    "rijbewijs",
    "certificaat",
    "vog",
    "anders",
] as const;

export type UserDocumentType = (typeof USER_DOCUMENT_TYPES)[number];

export const USER_DOCUMENT_TYPE_LABELS: Record<UserDocumentType, string> = {
    id_kaart: "ID / paspoort",
    rijbewijs: "Rijbewijs",
    certificaat: "Certificaat",
    vog: "VOG",
    anders: "Anders",
};

export function parseUserDocumentType(value: unknown): UserDocumentType {
    const raw = String(value ?? "").trim().toLowerCase();
    if ((USER_DOCUMENT_TYPES as readonly string[]).includes(raw)) {
        return raw as UserDocumentType;
    }
    return "anders";
}

export function userDocumentTypeLabel(type: string): string {
    const parsed = parseUserDocumentType(type);
    return USER_DOCUMENT_TYPE_LABELS[parsed];
}
