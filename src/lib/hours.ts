/**
 * Uren: intern altijd decimale uren (1.5 = 90 min).
 * Kloknotatie 1.30 (= 1u30) alleen in UI / PDF / Excel via formatHoursDisplay.
 */

import {
    formatClockHours,
    parseClockHours,
} from "@/types/oplever";

/** Decimale uren → hele minuten (afgerond). */
export function hoursToMinutes(decimalHours: number): number {
    if (!Number.isFinite(decimalHours) || decimalHours <= 0) {
        return 0;
    }
    return Math.round(decimalHours * 60);
}

/** Minuten → decimale uren. */
export function minutesToHours(minutes: number): number {
    if (!Number.isFinite(minutes) || minutes <= 0) {
        return 0;
    }
    return minutes / 60;
}

/**
 * Parseert invoer naar decimale uren voor opslag.
 * - Klokkwarten: 1.00 / 1.15 / 1.30 / 1.45 → via parseClockHours
 * - Anders decimaal: 1.5, 0.25, 8 (ook met komma)
 * Nooit klokstrings optellen — altijd eerst deze functie.
 */
export function parseHoursInput(value: unknown): number {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value > 0 ? value : 0;
    }

    if (typeof value !== "string") {
        return 0;
    }

    const cleaned = value.trim();
    if (!cleaned) {
        return 0;
    }

    const clock = cleaned.match(/^(\d+)[.,](\d{2})$/);
    if (clock) {
        const minutes = Number(clock[2]);
        if (
            minutes === 0 ||
            minutes === 15 ||
            minutes === 30 ||
            minutes === 45
        ) {
            return parseClockHours(cleaned);
        }
    }

    const asDecimal = parseFloat(cleaned.replace(",", "."));
    if (!Number.isNaN(asDecimal) && asDecimal > 0) {
        return asDecimal;
    }

    return parseClockHours(cleaned);
}

/** Presentatie: kloknotatie 1.30 / 2 / 1.15 */
export function formatHoursDisplay(decimalHours: number): string {
    return formatClockHours(decimalHours);
}

/** Sommeer alleen decimale uren (veilig voor exports/rapportages). */
export function sumDecimalHours(values: number[]): number {
    return values.reduce((sum, v) => {
        const n = typeof v === "number" && Number.isFinite(v) ? v : 0;
        return sum + n;
    }, 0);
}
