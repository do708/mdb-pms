/** Type monteur voor planning/bezetting (role blijft "engineer"). */

export const STAFF_KINDS = [
    "monteur",
    "inlener",
    "stagiaire",
] as const;

export type StaffKind = (typeof STAFF_KINDS)[number];

export const STAFF_KIND_LABELS: Record<StaffKind, string> = {
    monteur: "Eigen monteur",
    inlener: "Inlener (ZZP)",
    stagiaire: "Stagiair",
};

export function parseStaffKind(value: unknown): StaffKind {
    if (
        typeof value === "string" &&
        (STAFF_KINDS as readonly string[]).includes(value)
    ) {
        return value as StaffKind;
    }
    return "monteur";
}

/** Alleen eigen monteurs tellen mee in capaciteit/bezetting. */
export function countsTowardCapacity(staffKind: string | null | undefined): boolean {
    return parseStaffKind(staffKind) === "monteur";
}
