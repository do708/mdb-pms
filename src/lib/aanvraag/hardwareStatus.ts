/** Opties voor hardware-status op de installatie-aanvraag (opgeslagen string = label). */
export const PROJECT_HARDWARE_STATUS_OPTIONS = [
    "Besteld / Onderweg",
    "Op voorraad MDB Networks",
    "Verzorgd door MDB Networks",
] as const;

export type ProjectHardwareStatus =
    (typeof PROJECT_HARDWARE_STATUS_OPTIONS)[number];

export const PROJECT_HARDWARE_STATUS_BESTELD =
    "Besteld / Onderweg" as const;

/** Oude opgeslagen waarden → nieuwe labels (alleen weergave). */
const LEGACY_HARDWARE_STATUS: Record<string, string> = {
    "Al besteld / verstuurd": PROJECT_HARDWARE_STATUS_BESTELD,
    "Op voorraad bij MDB Networks": "Op voorraad MDB Networks",
    "Regelt MDB Networks": "Verzorgd door MDB Networks",
};

export function formatProjectHardwareStatus(
    value: string | null | undefined,
): string {
    if(!value) return "";
    return LEGACY_HARDWARE_STATUS[value] ?? value;
}

/** Levering-follow-up geldt alleen bij Besteld / Onderweg (incl. legacy). */
export function isProjectHardwareBesteld(
    value: string | null | undefined,
): boolean {
    if(!value) return false;
    return (
        value === PROJECT_HARDWARE_STATUS_BESTELD
        || value === "Al besteld / verstuurd"
    );
}
