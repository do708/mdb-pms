/** Herhaling van vrije agenda-items (master + virtuele occurrences). */

export type RecurrenceFreq = "none" | "weekly" | "monthly";

export type PlanningEventMaster = {
    id: string;
    title: string;
    notes: string | null;
    startAt: Date | string;
    endAt: Date | string | null;
    allDay: boolean;
    recurrenceFreq?: string | null;
    recurrenceInterval?: number | null;
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
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function startOfLocalDay(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

function addDays(d: Date, days: number): Date {
    const next = new Date(d);
    next.setDate(next.getDate() + days);
    return next;
}

function addMonthsClamped(d: Date, months: number): Date {
    const day = d.getDate();
    const next = new Date(d.getFullYear(), d.getMonth() + months, 1);
    const lastDay = new Date(
        next.getFullYear(),
        next.getMonth() + 1,
        0
    ).getDate();
    next.setDate(Math.min(day, lastDay));
    next.setHours(
        d.getHours(),
        d.getMinutes(),
        d.getSeconds(),
        d.getMilliseconds()
    );
    return next;
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

        if (freq === "none") {
            const day = startOfLocalDay(startAt).getTime();
            if (day >= rangeFrom && day <= rangeTo) {
                const iso = toIsoDate(startAt);
                out.push({
                    ...master,
                    id: master.id,
                    masterId: master.id,
                    occurrenceDate: iso,
                    isOccurrence: false,
                    startAt:
                        startAt instanceof Date
                            ? startAt.toISOString()
                            : String(master.startAt),
                    endAt: master.endAt
                        ? toDate(master.endAt).toISOString()
                        : null,
                });
            }
            continue;
        }

        let cursor = new Date(startAt);
        let guard = 0;
        const maxOccurrences = 520; // ~10 jaar wekelijks

        while (guard < maxOccurrences) {
            guard += 1;
            const dayMs = startOfLocalDay(cursor).getTime();
            if (until !== null && dayMs > until) break;
            if (dayMs > rangeTo) break;

            if (dayMs >= rangeFrom) {
                const iso = toIsoDate(cursor);
                const occStart = new Date(cursor);
                const occEnd =
                    dur > 0 ? new Date(occStart.getTime() + dur) : null;
                out.push({
                    ...master,
                    id: `${master.id}@${iso}`,
                    masterId: master.id,
                    occurrenceDate: iso,
                    isOccurrence: true,
                    seriesStartAt: startAt.toISOString(),
                    startAt: occStart.toISOString(),
                    endAt: occEnd ? occEnd.toISOString() : null,
                });
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

/** Standaardvenster voor planning-API: ±3 maanden rond vandaag. */
export function defaultPlanningEventRange(now = new Date()): {
    rangeStart: Date;
    rangeEnd: Date;
} {
    const rangeStart = new Date(
        now.getFullYear(),
        now.getMonth() - 3,
        1
    );
    const rangeEnd = new Date(
        now.getFullYear(),
        now.getMonth() + 4,
        0
    );
    return { rangeStart, rangeEnd };
}
