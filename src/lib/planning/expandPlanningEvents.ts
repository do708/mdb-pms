/** Herhaling van vrije agenda-items (master + virtuele occurrences). */

import {
    addAmsterdamCalendarDays,
    addAmsterdamMonthsClamped,
    amsterdamIsoWeekday,
    amsterdamLocalToDate,
    formatAmsterdamDateIso,
    formatAmsterdamHHmm,
    getAmsterdamParts,
    startOfAmsterdamDay,
} from "@/lib/datetime/amsterdam";

export type RecurrenceFreq =
    | "none"
    | "weekly"
    | "monthly"
    | "monthly_weekday";

/** ISO: 1=ma … 7=zo */
export const WEEKDAY_LABELS_NL: Record<number, string> = {
    1: "maandag",
    2: "dinsdag",
    3: "woensdag",
    4: "donderdag",
    5: "vrijdag",
    6: "zaterdag",
    7: "zondag",
};

export const NTH_LABELS_NL: Record<number, string> = {
    1: "1e",
    2: "2e",
    3: "3e",
    4: "4e",
    [-1]: "laatste",
};

export type PlanningEventMaster = {
    id: string;
    title: string;
    notes: string | null;
    startAt: Date | string;
    endAt: Date | string | null;
    allDay: boolean;
    recurrenceFreq?: string | null;
    recurrenceInterval?: number | null;
    recurrenceWeekday?: number | null;
    recurrenceNth?: number | null;
    recurrenceUntil?: Date | string | null;
    assignedUserId?: string | null;
    assignedUser?: { id: string; name: string | null } | null;
    createdById?: string;
    createdBy?: { id: string; name: string | null } | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};

function toDate(value: Date | string): Date {
    return value instanceof Date ? value : new Date(value);
}

function toIsoDate(d: Date): string {
    return formatAmsterdamDateIso(d);
}

function startOfLocalDay(d: Date): Date {
    return startOfAmsterdamDay(d);
}

function addDays(d: Date, days: number): Date {
    return addAmsterdamCalendarDays(d, days);
}

function addMonthsClamped(d: Date, months: number): Date {
    return addAmsterdamMonthsClamped(d, months);
}

/** JS getDay(): 0=zo … 6=za → ISO 1=ma … 7=zo */
export function jsDayToIso(jsDay: number): number {
    return jsDay === 0 ? 7 : jsDay;
}

export function isoToJsDay(iso: number): number {
    return iso === 7 ? 0 : iso;
}

function durationMs(
    startAt: Date,
    endAt: Date | string | null | undefined
): number {
    if (!endAt) return 0;
    const end = toDate(endAt);
    const diff = end.getTime() - startAt.getTime();
    return diff > 0 ? diff : 0;
}

export function parseMasterId(eventId: string): string {
    const at = eventId.indexOf("@");
    return at >= 0 ? eventId.slice(0, at) : eventId;
}

/** Verschuif datum naar de gevraagde ISO-weekdag (zelfde of volgende), Europe/Amsterdam. */
export function alignDateToWeekday(date: Date, isoWeekday: number): Date {
    const iso = isoWeekday >= 1 && isoWeekday <= 7 ? isoWeekday : 1;
    const current = amsterdamIsoWeekday(date);
    let delta = iso - current;
    if (delta < 0) delta += 7;
    return addDays(date, delta);
}

/**
 * N-de weekdag in een maand (Europe/Amsterdam-kalender).
 * nth: 1–4 of -1 (laatste). isoWeekday: 1=ma … 7=zo.
 */
export function nthWeekdayInMonth(
    year: number,
    monthIndex: number,
    isoWeekday: number,
    nth: number,
    timeFrom: Date
): Date | null {
    const timeHHmm = formatAmsterdamHHmm(timeFrom);
    const lastDay = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();

    const matches: Date[] = [];
    for (let d = 1; d <= lastDay; d++) {
        const dayIso = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        const candidate = amsterdamLocalToDate(dayIso, timeHHmm);
        if (amsterdamIsoWeekday(candidate) === isoWeekday) {
            matches.push(candidate);
        }
    }

    if (matches.length === 0) return null;
    if (nth === -1) return matches[matches.length - 1] ?? null;
    if (nth < 1 || nth > 4) return null;
    return matches[nth - 1] ?? null;
}

function pushOccurrence(
    out: Array<
        PlanningEventMaster & {
            id: string;
            masterId: string;
            occurrenceDate: string;
            isOccurrence: boolean;
            seriesStartAt?: string;
        }
    >,
    master: PlanningEventMaster,
    startAt: Date,
    occStart: Date,
    dur: number,
    isOccurrence: boolean
) {
    const iso = toIsoDate(occStart);
    const occEnd = dur > 0 ? new Date(occStart.getTime() + dur) : null;
    out.push({
        ...master,
        id: isOccurrence ? `${master.id}@${iso}` : master.id,
        masterId: master.id,
        occurrenceDate: iso,
        isOccurrence,
        seriesStartAt: isOccurrence ? startAt.toISOString() : undefined,
        startAt: occStart.toISOString(),
        endAt: occEnd ? occEnd.toISOString() : null,
    });
}

export function expandPlanningEvents(
    masters: PlanningEventMaster[],
    rangeStart: Date,
    rangeEnd: Date
): Array<
    PlanningEventMaster & {
        id: string;
        masterId: string;
        occurrenceDate: string;
        isOccurrence: boolean;
        seriesStartAt?: string;
    }
> {
    const out: Array<
        PlanningEventMaster & {
            id: string;
            masterId: string;
            occurrenceDate: string;
            isOccurrence: boolean;
            seriesStartAt?: string;
        }
    > = [];

    const rangeFrom = startOfLocalDay(rangeStart).getTime();
    const rangeTo = startOfLocalDay(rangeEnd).getTime();

    for (const master of masters) {
        const startAt = toDate(master.startAt);
        const freq = (master.recurrenceFreq || "none") as RecurrenceFreq;
        const interval = Math.max(1, master.recurrenceInterval || 1);
        const until = master.recurrenceUntil
            ? startOfLocalDay(toDate(master.recurrenceUntil)).getTime()
            : null;
        const dur = durationMs(startAt, master.endAt);
        const weekday =
            master.recurrenceWeekday != null &&
            master.recurrenceWeekday >= 1 &&
            master.recurrenceWeekday <= 7
                ? master.recurrenceWeekday
                : amsterdamIsoWeekday(startAt);
        const nth =
            master.recurrenceNth === -1
                ? -1
                : master.recurrenceNth != null &&
                    master.recurrenceNth >= 1 &&
                    master.recurrenceNth <= 4
                  ? master.recurrenceNth
                  : 1;

        if (freq === "none") {
            const day = startOfLocalDay(startAt).getTime();
            if (day >= rangeFrom && day <= rangeTo) {
                pushOccurrence(out, master, startAt, startAt, dur, false);
            }
            continue;
        }

        if (freq === "monthly_weekday") {
            const rangeParts = getAmsterdamParts(rangeStart);
            const seriesParts = getAmsterdamParts(startAt);
            const startMonth = amsterdamLocalToDate(
                `${rangeParts.year}-${String(rangeParts.month).padStart(2, "0")}-01`,
                "12:00"
            );
            const seriesMonth = amsterdamLocalToDate(
                `${seriesParts.year}-${String(seriesParts.month).padStart(2, "0")}-01`,
                "12:00"
            );
            let cursor = new Date(
                Math.max(startMonth.getTime(), seriesMonth.getTime())
            );
            const rangeEndParts = getAmsterdamParts(rangeEnd);
            let guard = 0;
            while (guard < 60) {
                guard += 1;
                const cp = getAmsterdamParts(cursor);
                const occ = nthWeekdayInMonth(
                    cp.year,
                    cp.month - 1,
                    weekday,
                    nth,
                    startAt
                );
                if (occ) {
                    const dayMs = startOfLocalDay(occ).getTime();
                    if (until !== null && dayMs > until) break;
                    if (dayMs > rangeTo) break;
                    if (
                        dayMs >= rangeFrom &&
                        dayMs >= startOfLocalDay(startAt).getTime()
                    ) {
                        pushOccurrence(out, master, startAt, occ, dur, true);
                    }
                }
                cursor = addAmsterdamMonthsClamped(
                    amsterdamLocalToDate(
                        `${cp.year}-${String(cp.month).padStart(2, "0")}-01`,
                        "12:00"
                    ),
                    interval
                );
                const curP = getAmsterdamParts(cursor);
                if (
                    curP.year > rangeEndParts.year + 1 ||
                    (curP.year === rangeEndParts.year &&
                        curP.month > rangeEndParts.month + 1)
                ) {
                    break;
                }
            }
            continue;
        }

        // weekly / monthly: start vanaf startAt, eventueel uitgelijnd op weekdag
        let cursor =
            freq === "weekly"
                ? alignDateToWeekday(new Date(startAt), weekday)
                : new Date(startAt);
        if (
            startOfLocalDay(cursor).getTime() <
            startOfLocalDay(startAt).getTime()
        ) {
            if (freq === "weekly") {
                cursor = addDays(cursor, 7 * interval);
            } else {
                cursor = addMonthsClamped(cursor, interval);
            }
        }

        let guard = 0;
        const maxOccurrences = 520;

        while (guard < maxOccurrences) {
            guard += 1;
            const dayMs = startOfLocalDay(cursor).getTime();
            if (until !== null && dayMs > until) break;
            if (dayMs > rangeTo) break;

            if (dayMs >= rangeFrom) {
                pushOccurrence(out, master, startAt, cursor, dur, true);
            }

            if (freq === "weekly") {
                cursor = addDays(cursor, 7 * interval);
            } else {
                cursor = addMonthsClamped(cursor, interval);
            }
        }
    }

    out.sort(
        (a, b) =>
            toDate(a.startAt).getTime() - toDate(b.startAt).getTime()
    );
    return out;
}

/** Standaardvenster voor planning-API: ±3 maanden rond vandaag (Amsterdam). */
export function defaultPlanningEventRange(now = new Date()): {
    rangeStart: Date;
    rangeEnd: Date;
} {
    const p = getAmsterdamParts(now);
    const monthStart = amsterdamLocalToDate(
        `${p.year}-${String(p.month).padStart(2, "0")}-01`,
        "00:00"
    );
    const rangeStart = addAmsterdamMonthsClamped(monthStart, -3);
    const endMonth = addAmsterdamMonthsClamped(monthStart, 3);
    const endParts = getAmsterdamParts(endMonth);
    const lastDay = new Date(
        Date.UTC(endParts.year, endParts.month, 0)
    ).getUTCDate();
    const rangeEnd = amsterdamLocalToDate(
        `${endParts.year}-${String(endParts.month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`,
        "23:59"
    );
    return { rangeStart, rangeEnd };
}

export function parseRecurrenceBody(body: Record<string, unknown>):
    | {
          recurrenceFreq: string;
          recurrenceInterval: number;
          recurrenceWeekday: number | null;
          recurrenceNth: number | null;
          recurrenceUntil: Date | null;
      }
    | { error: string } {
    const rawFreq =
        typeof body.recurrenceFreq === "string"
            ? body.recurrenceFreq.trim()
            : "none";
    const recurrenceFreq =
        rawFreq === "weekly" ||
        rawFreq === "monthly" ||
        rawFreq === "monthly_weekday"
            ? rawFreq
            : "none";

    let recurrenceInterval = 1;
    if (
        body.recurrenceInterval !== undefined &&
        body.recurrenceInterval !== null
    ) {
        const n = Number(body.recurrenceInterval);
        if (!Number.isFinite(n) || n < 1 || n > 52) {
            return { error: "Herhaalinterval moet tussen 1 en 52 liggen" };
        }
        recurrenceInterval = Math.floor(n);
    }

    let recurrenceWeekday: number | null = null;
    if (
        body.recurrenceWeekday !== undefined &&
        body.recurrenceWeekday !== null &&
        body.recurrenceWeekday !== ""
    ) {
        const n = Number(body.recurrenceWeekday);
        if (!Number.isFinite(n) || n < 1 || n > 7) {
            return { error: "Weekdag moet tussen 1 (ma) en 7 (zo) liggen" };
        }
        recurrenceWeekday = Math.floor(n);
    }

    let recurrenceNth: number | null = null;
    if (
        body.recurrenceNth !== undefined &&
        body.recurrenceNth !== null &&
        body.recurrenceNth !== ""
    ) {
        const n = Number(body.recurrenceNth);
        if (n !== -1 && (!Number.isFinite(n) || n < 1 || n > 4)) {
            return {
                error: "Kies 1e–4e of laatste weekdag van de maand",
            };
        }
        recurrenceNth = Math.floor(n);
    }

    let recurrenceUntil: Date | null = null;
    if (
        typeof body.recurrenceUntil === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(body.recurrenceUntil.trim())
    ) {
        recurrenceUntil = amsterdamLocalToDate(
            body.recurrenceUntil.trim(),
            "23:59"
        );
    }

    if (recurrenceFreq === "none") {
        return {
            recurrenceFreq: "none",
            recurrenceInterval: 1,
            recurrenceWeekday: null,
            recurrenceNth: null,
            recurrenceUntil: null,
        };
    }

    if (recurrenceFreq === "weekly" && recurrenceWeekday == null) {
        return { error: "Kies een weekdag voor wekelijkse herhaling" };
    }

    if (recurrenceFreq === "monthly_weekday") {
        if (recurrenceWeekday == null) {
            return { error: "Kies een weekdag" };
        }
        if (recurrenceNth == null) {
            return { error: "Kies 1e, 2e, 3e, 4e of laatste" };
        }
    }

    if (recurrenceFreq === "monthly") {
        recurrenceWeekday = null;
        recurrenceNth = null;
    }

    if (recurrenceFreq === "weekly") {
        recurrenceNth = null;
    }

    return {
        recurrenceFreq,
        recurrenceInterval,
        recurrenceWeekday,
        recurrenceNth,
        recurrenceUntil,
    };
}
