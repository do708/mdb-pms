/**
 * Nederlandse wall-clock tijden veilig omzetten naar UTC Date-instanties.
 * Nodig omdat Vercel in UTC draait: `new Date("2026-08-10T08:00")` wordt
 * daar 08:00 UTC (= 10:00 NL zomertijd), terwijl kantoor 08:00 NL bedoelt.
 */

const TZ = "Europe/Amsterdam";

function amsterdamParts(date: Date): {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
} {
    const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: TZ,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
    }).formatToParts(date);

    const get = (type: string) =>
        Number(parts.find((p) => p.type === type)?.value ?? "0");

    return {
        year: get("year"),
        month: get("month"),
        day: get("day"),
        hour: get("hour"),
        minute: get("minute"),
        second: get("second"),
    };
}

/**
 * Interpreteer YYYY-MM-DD + HH:mm als lokale tijd in Europe/Amsterdam.
 */
export function amsterdamLocalToDate(
    dateIso: string,
    timeHHmm: string
): Date {
    const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateIso.trim());
    const timeMatch = /^(\d{1,2}):(\d{2})$/.exec(timeHHmm.trim());
    if (!dateMatch || !timeMatch) {
        return new Date(`${dateIso}T${timeHHmm}`);
    }

    const year = Number(dateMatch[1]);
    const month = Number(dateMatch[2]);
    const day = Number(dateMatch[3]);
    const hour = Number(timeMatch[1]);
    const minute = Number(timeMatch[2]);

    const desiredAsUtcMs = Date.UTC(year, month - 1, day, hour, minute, 0);

    // Zoek het UTC-moment waarvan de Amsterdam-klok gelijk is aan de gewenste tijd.
    let guess = desiredAsUtcMs;
    for (let i = 0; i < 3; i++) {
        const p = amsterdamParts(new Date(guess));
        const shownAsUtcMs = Date.UTC(
            p.year,
            p.month - 1,
            p.day,
            p.hour,
            p.minute,
            p.second
        );
        guess += desiredAsUtcMs - shownAsUtcMs;
    }

    return new Date(guess);
}

/**
 * Formatteer een Date als HH:mm in Europe/Amsterdam.
 */
export function formatAmsterdamHHmm(date: Date): string {
    const p = amsterdamParts(date);
    return `${String(p.hour).padStart(2, "0")}:${String(p.minute).padStart(2, "0")}`;
}

/**
 * Formatteer een Date als YYYY-MM-DD in Europe/Amsterdam.
 */
export function formatAmsterdamDateIso(date: Date): string {
    const p = amsterdamParts(date);
    return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

/** ISO-weekdag in Europe/Amsterdam: 1=ma … 7=zo */
export function amsterdamIsoWeekday(date: Date): number {
    const wd = new Intl.DateTimeFormat("en-US", {
        timeZone: TZ,
        weekday: "short",
    }).format(date);
    const map: Record<string, number> = {
        Mon: 1,
        Tue: 2,
        Wed: 3,
        Thu: 4,
        Fri: 5,
        Sat: 6,
        Sun: 7,
    };
    return map[wd] ?? 1;
}

/** Middernacht (00:00) Europe/Amsterdam van de kalenderdag van `date`. */
export function startOfAmsterdamDay(date: Date): Date {
    return amsterdamLocalToDate(formatAmsterdamDateIso(date), "00:00");
}

/**
 * Tel kalenderdagen op in Europe/Amsterdam, behoud wall-clock tijd.
 * Gebruikt UTC-kalenderrekenen op de Amsterdam Y-M-D (geen server-TZ).
 */
export function addAmsterdamCalendarDays(date: Date, days: number): Date {
    const p = amsterdamParts(date);
    const shifted = new Date(Date.UTC(p.year, p.month - 1, p.day + days, 12, 0, 0));
    const iso = `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, "0")}-${String(shifted.getUTCDate()).padStart(2, "0")}`;
    return amsterdamLocalToDate(
        iso,
        `${String(p.hour).padStart(2, "0")}:${String(p.minute).padStart(2, "0")}`
    );
}

/**
 * Tel maanden op in Europe/Amsterdam, met geklemde dag (31 jan + 1m → 28/29 feb).
 */
export function addAmsterdamMonthsClamped(date: Date, months: number): Date {
    const p = amsterdamParts(date);
    const target = new Date(Date.UTC(p.year, p.month - 1 + months, 1, 12, 0, 0));
    const y = target.getUTCFullYear();
    const m = target.getUTCMonth(); // 0-based
    const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    const day = Math.min(p.day, lastDay);
    const iso = `${y}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return amsterdamLocalToDate(
        iso,
        `${String(p.hour).padStart(2, "0")}:${String(p.minute).padStart(2, "0")}`
    );
}

/** Amsterdam jaar/maand/dag van een Date (maand 1–12). */
export function getAmsterdamParts(date: Date) {
    return amsterdamParts(date);
}

/**
 * Parseer API-input voor plannedDate / plannedEndDate.
 * - Met Z of ±offset: normale ISO
 * - `YYYY-MM-DDTHH:mm` zonder zone: Europe/Amsterdam
 * - Alleen `YYYY-MM-DD`: middaghulp (12:00 Amsterdam) om dagverschuiving te vermijden
 */
export function parsePlanningDateInput(
    value: string | Date | null | undefined
): Date | null {
    if (value == null || value === "") return null;
    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value;
    }

    const raw = String(value).trim();
    if (!raw) return null;

    if (/[zZ]$|[+-]\d{2}:\d{2}$/.test(raw)) {
        const d = new Date(raw);
        return Number.isNaN(d.getTime()) ? null : d;
    }

    const withTime = /^(\d{4}-\d{2}-\d{2})T(\d{1,2}:\d{2})(?::\d{2})?/.exec(
        raw
    );
    if (withTime) {
        return amsterdamLocalToDate(withTime[1], withTime[2]);
    }

    const dateOnly = /^(\d{4}-\d{2}-\d{2})$/.exec(raw);
    if (dateOnly) {
        return amsterdamLocalToDate(dateOnly[1], "12:00");
    }

    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
}
