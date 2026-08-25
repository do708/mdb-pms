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
import { expandPlanningEvents } from "@/lib/planning/expandPlanningEvents";

const WEEKDAY_SHORT = ["ma", "di", "wo", "do", "vr", "za", "zo"] as const;

const MONTHS_NL = [
    "januari",
    "februari",
    "maart",
    "april",
    "mei",
    "juni",
    "juli",
    "augustus",
    "september",
    "oktober",
    "november",
    "december",
];

export type AgendaSearchHit = {
    id: string;
    kind: "event" | "workorder";
    title: string;
    dateIso: string;
    weekdayShort: string;
    day: number;
    monthLabel: string;
    timeLabel: string;
    technicians: string[];
    location: string | null;
    customer: string | null;
};

export function searchAgendaRange(now = new Date()): {
    rangeStart: Date;
    rangeEnd: Date;
} {
    const p = getAmsterdamParts(now);
    const monthStart = amsterdamLocalToDate(
        `${p.year}-${String(p.month).padStart(2, "0")}-01`,
        "00:00"
    );
    const rangeStart = addAmsterdamMonthsClamped(monthStart, -1);
    const endMonth = addAmsterdamMonthsClamped(monthStart, 6);
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

function monthLabelFor(date: Date): string {
    const p = getAmsterdamParts(date);
    return `${MONTHS_NL[p.month - 1]} ${p.year}`;
}

function weekdayShortFor(date: Date): string {
    return WEEKDAY_SHORT[amsterdamIsoWeekday(date) - 1] ?? "ma";
}

function uniqueNames(names: Array<string | null | undefined>): string[] {
    const seen = new Set<string>();
    const out: string[] = [];

    for (const raw of names) {
        const name = raw?.trim();

        if (!name) {
            continue;
        }

        const key = name.toLowerCase();

        if (seen.has(key)) {
            continue;
        }

        seen.add(key);
        out.push(name);
    }

    return out;
}

function timeLabel(start: Date, end: Date | null, allDay: boolean): string {
    if (allDay) {
        return "hele dag";
    }

    const from = formatAmsterdamHHmm(start);
    const to = end ? formatAmsterdamHHmm(end) : null;

    if (!to || to === from) {
        return from;
    }

    return `${from} – ${to}`;
}

function eachDayIso(start: Date, end: Date, maxDays = 31): string[] {
    const from = startOfAmsterdamDay(start);
    const to = startOfAmsterdamDay(end);
    const days: string[] = [];
    let cursor = from;
    let n = 0;

    while (cursor.getTime() <= to.getTime() && n < maxDays) {
        days.push(formatAmsterdamDateIso(cursor));
        cursor = addAmsterdamCalendarDays(cursor, 1);
        n += 1;
    }

    return days.length > 0 ? days : [formatAmsterdamDateIso(start)];
}

function hitFromParts(input: {
    id: string;
    kind: AgendaSearchHit["kind"];
    title: string;
    date: Date;
    startAt: Date;
    endAt: Date | null;
    allDay: boolean;
    technicians: Array<string | null | undefined>;
    location: string | null;
    customer: string | null;
}): AgendaSearchHit {
    const p = getAmsterdamParts(input.date);

    return {
        id: input.id,
        kind: input.kind,
        title: input.title,
        dateIso: formatAmsterdamDateIso(input.date),
        weekdayShort: weekdayShortFor(input.date),
        day: p.day,
        monthLabel: monthLabelFor(input.date),
        timeLabel: timeLabel(input.startAt, input.endAt, input.allDay),
        technicians: uniqueNames(input.technicians),
        location: input.location,
        customer: input.customer,
    };
}

export function agendaHitsFromEvents(
    masters: Parameters<typeof expandPlanningEvents>[0],
    rangeStart: Date,
    rangeEnd: Date
): AgendaSearchHit[] {
    return expandPlanningEvents(masters, rangeStart, rangeEnd).map((event) => {
        const startAt = new Date(event.startAt);
        const endAt = event.endAt ? new Date(event.endAt) : null;

        return hitFromParts({
            id: `event:${event.id}`,
            kind: "event",
            title: event.title,
            date: startAt,
            startAt,
            endAt,
            allDay: Boolean(event.allDay),
            technicians: [event.assignedUser?.name],
            location: null,
            customer: null,
        });
    });
}

export function agendaHitsFromWorkorder(workorder: {
    id: string;
    number: string;
    title: string;
    location: string | null;
    city: string | null;
    plannedDate: Date;
    plannedEndDate: Date | null;
    assignedUser: { name: string | null } | null;
    extraEngineers: Array<{ user: { name: string | null } }>;
    customer: { name: string } | null;
    project: { customer: { name: string } | null } | null;
}): AgendaSearchHit[] {
    const startAt = workorder.plannedDate;
    const endAt = workorder.plannedEndDate ?? workorder.plannedDate;
    const days = eachDayIso(startAt, endAt);
    const technicians = uniqueNames([
        workorder.assignedUser?.name,
        ...workorder.extraEngineers.map((row) => row.user.name),
    ]);
    const location = [workorder.location, workorder.city]
        .filter(Boolean)
        .join(", ") || null;
    const customer =
        workorder.customer?.name
        ?? workorder.project?.customer?.name
        ?? null;
    const title = `${workorder.number} — ${workorder.title}`;

    return days.map((dateIso) => {
        const date = amsterdamLocalToDate(dateIso, "12:00");

        return hitFromParts({
            id: `workorder:${workorder.id}:${dateIso}`,
            kind: "workorder",
            title,
            date,
            startAt,
            endAt,
            allDay: false,
            technicians,
            location,
            customer,
        });
    });
}

export function sortAndCapAgendaHits(
    hits: AgendaSearchHit[],
    limit = 40
): AgendaSearchHit[] {
    return [...hits]
        .sort((a, b) => {
            const date = a.dateIso.localeCompare(b.dateIso);

            if (date !== 0) {
                return date;
            }

            return a.timeLabel.localeCompare(b.timeLabel, "nl");
        })
        .slice(0, limit);
}
