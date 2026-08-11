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
