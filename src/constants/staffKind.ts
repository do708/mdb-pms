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

/** YYYY-MM-DD uit Date of ISO-string (lokale kalenderdag). */
export function toIsoDay(value: string | Date | null | undefined): string | null {
    if (!value) return null;
    if (typeof value === "string") {
        const m = /^(\d{4}-\d{2}-\d{2})/.exec(value);
        if (m) return m[1];
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return null;
        value = d;
    }
    const d = value as Date;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

/**
 * Mag deze monteur op `dayIso` (YYYY-MM-DD) nog in de planning?
 * Niet-stagiairs: altijd. Stagiair zonder einddatum: wel (legacy).
 * Stagiair met einddatum: alleen t/m die dag.
 */
export function isSchedulableOnDay(
    staffKind: string | null | undefined,
    stagiaireUntil: string | Date | null | undefined,
    dayIso: string
): boolean {
    if (parseStaffKind(staffKind) !== "stagiaire") {
        return true;
    }
    const until = toIsoDay(stagiaireUntil);
    if (!until) {
        return true;
    }
    return dayIso <= until;
}

/** Zichtbaar in een week als nog inplanbaar op de maandag van die week. */
export function isSchedulableInWeek(
    staffKind: string | null | undefined,
    stagiaireUntil: string | Date | null | undefined,
    weekStartIso: string
): boolean {
    return isSchedulableOnDay(staffKind, stagiaireUntil, weekStartIso);
}
