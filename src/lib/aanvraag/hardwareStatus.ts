/** Opties voor hardware-status op de installatie-aanvraag (opgeslagen = label of array van labels). */
export const PROJECT_HARDWARE_STATUS_OPTIONS = [
    "Besteld / Onderweg",
    "Op voorraad bij MDB Networks",
    "Wordt verzorgd door MDB Networks",
] as const;

export type ProjectHardwareStatus =
    (typeof PROJECT_HARDWARE_STATUS_OPTIONS)[number];

export const PROJECT_HARDWARE_STATUS_BESTELD =
    "Besteld / Onderweg" as const;

/** Oude opgeslagen waarden → nieuwe labels (alleen weergave / normalisatie). */
const LEGACY_HARDWARE_STATUS: Record<string, string> = {
    "Al besteld / verstuurd": PROJECT_HARDWARE_STATUS_BESTELD,
    "Op voorraad MDB Networks": "Op voorraad bij MDB Networks",
    "Op voorraad bij MDB Networks": "Op voorraad bij MDB Networks",
    "Regelt MDB Networks": "Wordt verzorgd door MDB Networks",
    "Verzorgd door MDB Networks": "Wordt verzorgd door MDB Networks",
};

export function formatProjectHardwareStatus(
    value: string | null | undefined,
): string {
    if(!value) return "";
    return LEGACY_HARDWARE_STATUS[value] ?? value;
}

/**
 * Accepteert legacy string of array van statuslabels.
 * Geeft genormaliseerde unieke labels terug.
 */
export function normalizeProjectHardwareStatuses(
    value: unknown,
): string[] {
    const raw: string[] =
        Array.isArray(value)
            ? value.map((v) => String(v ?? "").trim()).filter(Boolean)
            : typeof value === "string" && value.trim()
                ? [value.trim()]
                : [];

    const seen = new Set<string>();
    const out: string[] = [];

    for(const item of raw){
        const label = formatProjectHardwareStatus(item);
        if(!label || seen.has(label)) continue;
        seen.add(label);
        out.push(label);
    }

    return out;
}

/** Leesbare weergave (komma-gescheiden) voor dashboard e.d. */
export function formatProjectHardwareStatuses(
    value: unknown,
): string {
    return normalizeProjectHardwareStatuses(value).join(", ");
}

/** Levering-follow-up geldt als Besteld / Onderweg (incl. legacy) geselecteerd is. */
export function isProjectHardwareBesteld(
    value: unknown,
): boolean {
    return normalizeProjectHardwareStatuses(value).includes(
        PROJECT_HARDWARE_STATUS_BESTELD,
    );
}

export function toggleProjectHardwareStatus(
    current: string[],
    optie: ProjectHardwareStatus,
): string[] {
    if(current.includes(optie)){
        return current.filter((s) => s !== optie);
    }
    return [...current, optie];
}
