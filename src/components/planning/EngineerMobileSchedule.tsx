"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { getStatus, migrateStatus } from "@/constants/workorderStatus";
import { formatAmsterdamHHmm } from "@/lib/datetime/amsterdam";

interface PlanningItem {
    id: string;
    number: string;
    title: string;
    status: string;
    plannedDate: string | null;
    plannedEndDate: string | null;
    location: string | null;
    straat?: string | null;
    huisnummer?: string | null;
    city: string | null;
    customer?: { name: string; color?: string } | null;
    project?: {
        name: string;
        customer?: { name: string; color?: string } | null;
    } | null;
}

interface AgendaEvent {
    id: string;
    title: string;
    notes?: string | null;
    startAt: string;
    endAt?: string | null;
    allDay?: boolean;
    assignedUserId?: string | null;
    recurrenceFreq?: string | null;
}

interface LeaveItem {
    from?: string;
    to?: string;
    userId?: string;
}

interface Props {
    items: PlanningItem[];
    leave?: LeaveItem[];
    events?: AgendaEvent[];
    engineerId: string;
    weekStart: Date;
    onPreviousWeek: () => void;
    onNextWeek: () => void;
    onThisWeek: () => void;
}

function toIsoDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function formatNlDate(
    date: Date,
    options: Intl.DateTimeFormatOptions
): string {
    return date
        .toLocaleDateString("nl-NL", options)
        .replace(/(^|[\s–-])([a-zà-ÿ])/g, (_, sep, ch) => sep + ch.toUpperCase());
}

function formatTime(iso: string | null): string | null {
    if (!iso) return null;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    const label = formatAmsterdamHHmm(d);
    if (label === "00:00") return null;
    return label;
}

/** Minuten vanaf middernacht (Amsterdam) om klussen en agenda op tijd te sorteren. */
function clockMinutes(
    iso: string | null | undefined,
    allDay = false
): number {
    if (allDay || !iso) return -1;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return -1;
    const label = formatAmsterdamHHmm(d);
    if (label === "00:00") return -1;
    const [h, m] = label.split(":").map(Number);
    return h * 60 + m;
}

function itemOnDay(item: PlanningItem, dayIso: string): boolean {
    if (!item.plannedDate) return false;
    const start = toIsoDate(new Date(item.plannedDate));
    const end = item.plannedEndDate
        ? toIsoDate(new Date(item.plannedEndDate))
        : start;
    return start <= dayIso && dayIso <= end;
}

function streetParts(item: PlanningItem): {
    straat: string;
    huisnummer: string;
} {
    let straat = (item.straat || "").trim();
    let huisnummer = (item.huisnummer || "").trim();
    const loc = (item.location || "").trim();

    if (!straat && loc) {
        if (huisnummer && loc.endsWith(huisnummer)) {
            straat = loc.slice(0, loc.length - huisnummer.length).trim();
        } else if (!huisnummer) {
            const match = loc.match(/^(.*?)\s+(\d[\d\s\-\/]*[a-zA-Z]?)$/);
            if (match) {
                straat = match[1].trim();
                huisnummer = match[2].replace(/\s+/g, "");
            } else {
                straat = loc;
            }
        } else {
            straat = loc;
        }
    } else if (straat && huisnummer && straat.endsWith(huisnummer)) {
        straat = straat.slice(0, straat.length - huisnummer.length).trim();
    }

    return { straat, huisnummer };
}

function timeLabel(item: PlanningItem): string {
    const start = formatTime(item.plannedDate);
    const end = formatTime(item.plannedEndDate);
    if (start && end) return `${start}–${end}`;
    if (start) return `vanaf ${start}`;
    return "Hele dag";
}

function eventOnDay(ev: AgendaEvent, dayIso: string): boolean {
    if (!ev.startAt) return false;
    const start = toIsoDate(new Date(ev.startAt));
    const end = ev.endAt ? toIsoDate(new Date(ev.endAt)) : start;
    return start <= dayIso && dayIso <= end;
}

function eventTimeLabel(ev: AgendaEvent): string {
    if (ev.allDay) return "Hele dag";
    const start = formatTime(ev.startAt);
    const end = formatTime(ev.endAt ?? null);
    if (start && end) return `${start}–${end}`;
    if (start) return `vanaf ${start}`;
    return "Hele dag";
}

export default function EngineerMobileSchedule({
    items,
    leave = [],
    events = [],
    engineerId,
    weekStart,
    onPreviousWeek,
    onNextWeek,
    onThisWeek,
}: Props) {
    const todayIso = toIsoDate(new Date());

    const [mode, setMode] = useState<"dag" | "week">("week");
    const [dayOffset, setDayOffset] = useState(() => {
        // Start op vandaag binnen de week (ma=0 … za=5), anders maandag.
        const today = new Date();
        const monday = new Date(weekStart);
        const diff = Math.floor(
            (today.setHours(0, 0, 0, 0) - monday.setHours(0, 0, 0, 0)) /
                86400000
        );
        if (diff >= 0 && diff <= 5) return diff;
        return 0;
    });

    const days = useMemo(
        () =>
            Array.from({ length: 6 }, (_, index) => {
                const date = new Date(weekStart);
                date.setDate(weekStart.getDate() + index);
                date.setHours(0, 0, 0, 0);
                return date;
            }),
        [weekStart]
    );

    const selectedDay = days[Math.min(5, Math.max(0, dayOffset))] ?? days[0];
    const selectedIso = toIsoDate(selectedDay);

    const myItems = items;

    function jobsForDay(dayIso: string) {
        return myItems
            .filter((item) => itemOnDay(item, dayIso))
            .sort((a, b) => {
                const ta = a.plannedDate
                    ? new Date(a.plannedDate).getTime()
                    : 0;
                const tb = b.plannedDate
                    ? new Date(b.plannedDate).getTime()
                    : 0;
                return ta - tb;
            });
    }

    function eventsForDay(dayIso: string) {
        return events
            .filter((ev) => eventOnDay(ev, dayIso))
            .sort((a, b) => {
                const ta = a.startAt ? new Date(a.startAt).getTime() : 0;
                const tb = b.startAt ? new Date(b.startAt).getTime() : 0;
                return ta - tb;
            });
    }

    function leaveOnDay(dayIso: string) {
        return leave.some((l) => {
            if (l.userId && l.userId !== engineerId) return false;
            const from = l.from;
            const to = l.to || l.from;
            return !!from && from <= dayIso && dayIso <= (to || from);
        });
    }

    function shiftDay(delta: number) {
        setDayOffset((prev) => {
            const next = prev + delta;
            if (next < 0) {
                onPreviousWeek();
                return 5;
            }
            if (next > 5) {
                onNextWeek();
                return 0;
            }
            return next;
        });
    }

    function goToday() {
        onThisWeek();
        const today = new Date();
        const dow = today.getDay(); // 0=zo … 6=za
        const offset = dow === 0 ? 0 : Math.min(5, dow - 1);
        setDayOffset(offset);
        setMode("dag");
    }

    function JobCard({ item }: { item: PlanningItem }) {
        const kleur =
            item.customer?.color ||
            item.project?.customer?.color ||
            "#d6007e";
        const klant =
            item.customer?.name ||
            item.project?.customer?.name ||
            "—";
        const locatieNaam = item.title?.trim() || "—";
        const { straat, huisnummer } = streetParts(item);
        const plaats = (item.city || "").trim();
        const status = getStatus(migrateStatus(item.status));

        return (
            <div
                className="
                    rounded-xl border border-gray-200 bg-white
                    overflow-hidden border-l-4
                "
                style={{ borderLeftColor: kleur }}
            >
                <div className="p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <p className="text-xs font-semibold text-[#0066FF] tabular-nums">
                                {timeLabel(item)}
                            </p>
                            <p className="font-bold text-sm text-gray-900 mt-0.5 leading-snug">
                                {locatieNaam}
                            </p>
                            {straat || huisnummer ? (
                                <p className="text-sm text-gray-700 leading-snug mt-0.5 flex items-start gap-1 min-w-0">
                                    {straat ? (
                                        <span className="min-w-0">
                                            {straat}
                                        </span>
                                    ) : null}
                                    {huisnummer ? (
                                        <span className="shrink-0">
                                            {huisnummer}
                                        </span>
                                    ) : null}
                                </p>
                            ) : null}
                            {plaats ? (
                                <p className="text-sm text-gray-700 leading-snug">
                                    {plaats}
                                </p>
                            ) : null}
                            <p className="text-xs text-gray-500 leading-snug mt-0.5">
                                {klant}
                            </p>
                        </div>
                        <span
                            className={`
                                shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium
                                ${status.badge}
                            `}
                        >
                            {status.label}
                        </span>
                    </div>

                    <Link
                        href={`/engineer/workorders/${item.id}`}
                        className="
                            flex items-center justify-center
                            w-full mt-1
                            bg-[#d6007e] text-white
                            rounded-lg px-3 py-2.5
                            text-sm font-semibold
                        "
                    >
                        Open opdracht
                    </Link>
                </div>
            </div>
        );
    }

    function EventCard({ event }: { event: AgendaEvent }) {
        return (
            <div
                className="
                    rounded-xl border border-amber-200
                    bg-amber-50 overflow-hidden
                "
            >
                <div className="px-3 py-2.5 space-y-1">
                    <p className="text-xs font-semibold text-amber-800">
                        {eventTimeLabel(event)}
                    </p>
                    <p className="text-sm font-bold text-amber-950 leading-snug">
                        {event.title}
                        {event.recurrenceFreq &&
                        event.recurrenceFreq !== "none"
                            ? " ↻"
                            : ""}
                    </p>
                    {event.notes ? (
                        <p className="text-xs text-amber-900/80 line-clamp-2">
                            {event.notes}
                        </p>
                    ) : null}
                </div>
            </div>
        );
    }

    function DayJobs({ dayIso, emptyLabel }: { dayIso: string; emptyLabel: string }) {
        const jobs = jobsForDay(dayIso);
        const dayEvents = eventsForDay(dayIso);
        const hasLeave = leaveOnDay(dayIso);

        if (jobs.length === 0 && dayEvents.length === 0 && !hasLeave) {
            return (
                <p className="text-sm text-gray-500 py-2">{emptyLabel}</p>
            );
        }

        const timeline = [
            ...jobs.map((item) => ({
                kind: "job" as const,
                id: item.id,
                sort: clockMinutes(item.plannedDate),
                item,
            })),
            ...dayEvents.map((event) => ({
                kind: "event" as const,
                id: event.id,
                sort: clockMinutes(event.startAt, Boolean(event.allDay)),
                event,
            })),
        ].sort((a, b) => a.sort - b.sort || a.id.localeCompare(b.id));

        return (
            <div className="space-y-2">
                {hasLeave && (
                    <div className="
                        rounded-lg border border-amber-200
                        bg-amber-50 px-3 py-2 text-sm text-amber-900
                    ">
                        Verlof
                    </div>
                )}
                {timeline.map((entry) =>
                    entry.kind === "event" ? (
                        <EventCard key={entry.id} event={entry.event} />
                    ) : (
                        <JobCard key={entry.id} item={entry.item} />
                    )
                )}
            </div>
        );
    }

    const weekLabel = `${formatNlDate(days[0], {
        day: "numeric",
        month: "short",
    })} – ${formatNlDate(days[5], {
        day: "numeric",
        month: "short",
    })}`;

    return (
        <section className="space-y-3 lg:hidden">
            <div className="
                rounded-2xl border border-gray-200 bg-white
                overflow-hidden
            ">
                <div className="
                    flex items-center justify-between gap-2
                    px-3 py-2.5 border-b border-gray-100 bg-slate-50/80
                ">
                    <div className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5">
                        <button
                            type="button"
                            onClick={() => setMode("dag")}
                            className={`
                                px-3 py-1.5 rounded-md text-xs font-semibold
                                ${mode === "dag"
                                    ? "bg-[#0066FF] text-white"
                                    : "text-gray-600"}
                            `}
                        >
                            Dag
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode("week")}
                            className={`
                                px-3 py-1.5 rounded-md text-xs font-semibold
                                ${mode === "week"
                                    ? "bg-[#0066FF] text-white"
                                    : "text-gray-600"}
                            `}
                        >
                            Week
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={goToday}
                        className="text-xs font-semibold text-[#0066FF] px-2 py-1"
                    >
                        Vandaag
                    </button>
                </div>

                {mode === "dag" ? (
                    <>
                        <div className="
                            flex items-center justify-between gap-2
                            px-3 py-2 border-b border-gray-100
                        ">
                            <button
                                type="button"
                                onClick={() => shiftDay(-1)}
                                className="
                                    rounded-lg border border-gray-200
                                    px-2.5 py-1.5 text-xs font-medium
                                    text-gray-700
                                "
                            >
                                ←
                            </button>
                            <div className="text-center min-w-0">
                                <p className="text-sm font-bold text-gray-900">
                                    {formatNlDate(selectedDay, {
                                        weekday: "long",
                                        day: "numeric",
                                        month: "long",
                                    })}
                                </p>
                                {selectedIso === todayIso && (
                                    <p className="text-[11px] text-[#0066FF] font-medium">
                                        Vandaag
                                    </p>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => shiftDay(1)}
                                className="
                                    rounded-lg border border-gray-200
                                    px-2.5 py-1.5 text-xs font-medium
                                    text-gray-700
                                "
                            >
                                →
                            </button>
                        </div>

                        <div className="p-3">
                            <DayJobs
                                dayIso={selectedIso}
                                emptyLabel="Geen opdrachten vandaag."
                            />
                        </div>
                    </>
                ) : (
                    <>
                        <div className="
                            flex items-center justify-between gap-2
                            px-3 py-2 border-b border-gray-100
                        ">
                            <button
                                type="button"
                                onClick={onPreviousWeek}
                                className="
                                    rounded-lg border border-gray-200
                                    px-2.5 py-1.5 text-xs font-medium
                                    text-gray-700
                                "
                            >
                                ←
                            </button>
                            <p className="text-sm font-semibold text-gray-800 tabular-nums">
                                {weekLabel}
                            </p>
                            <button
                                type="button"
                                onClick={onNextWeek}
                                className="
                                    rounded-lg border border-gray-200
                                    px-2.5 py-1.5 text-xs font-medium
                                    text-gray-700
                                "
                            >
                                →
                            </button>
                        </div>

                        <div className="divide-y divide-gray-100">
                            {days.map((day) => {
                                const iso = toIsoDate(day);
                                const isToday = iso === todayIso;
                                const count =
                                    jobsForDay(iso).length +
                                    eventsForDay(iso).length;

                                return (
                                    <div key={iso} className="p-3 space-y-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setDayOffset(
                                                    days.findIndex(
                                                        (d) =>
                                                            toIsoDate(d) === iso
                                                    )
                                                );
                                                setMode("dag");
                                            }}
                                            className="
                                                w-full flex items-center
                                                justify-between gap-2 text-left
                                            "
                                        >
                                            <div>
                                                <p
                                                    className={`
                                                        text-sm font-bold
                                                        ${isToday
                                                            ? "text-[#0066FF]"
                                                            : "text-gray-900"}
                                                    `}
                                                >
                                                    {formatNlDate(day, {
                                                        weekday: "short",
                                                        day: "numeric",
                                                        month: "short",
                                                    })}
                                                    {isToday ? " · vandaag" : ""}
                                                </p>
                                            </div>
                                            <span className="text-xs text-gray-500">
                                                {count === 0
                                                    ? "vrij"
                                                    : `${count} opdracht${count === 1 ? "" : "en"}`}
                                            </span>
                                        </button>

                                        <DayJobs
                                            dayIso={iso}
                                            emptyLabel="Geen opdrachten."
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </section>
    );
}
