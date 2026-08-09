/** Pending klus om in te plannen via de planningkalender (sessionStorage). */

export const PENDING_SCHEDULE_KEY = "mdb-pending-schedule";

export interface PendingSchedule {
    workorderId: string;
    /** Korte label, bijv. "Comsysco · Almere Centrum" */
    label: string;
}

export function setPendingSchedule(
    pending: PendingSchedule
): void {
    if (typeof window === "undefined") return;
    try {
        sessionStorage.setItem(
            PENDING_SCHEDULE_KEY,
            JSON.stringify(pending)
        );
    } catch {
        // stil
    }
}

export function getPendingSchedule(): PendingSchedule | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = sessionStorage.getItem(PENDING_SCHEDULE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as PendingSchedule;
        if (
            !parsed
            || typeof parsed.workorderId !== "string"
            || !parsed.workorderId
        ) {
            return null;
        }
        return {
            workorderId: parsed.workorderId,
            label:
                typeof parsed.label === "string" && parsed.label.trim()
                    ? parsed.label.trim()
                    : "Klus",
        };
    } catch {
        return null;
    }
}

export function clearPendingSchedule(): void {
    if (typeof window === "undefined") return;
    try {
        sessionStorage.removeItem(PENDING_SCHEDULE_KEY);
    } catch {
        // stil
    }
}
