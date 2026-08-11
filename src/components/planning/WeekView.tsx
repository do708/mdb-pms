"use client";

import type { DragEvent } from "react";
import Link from "next/link";
import { Repeat2 } from "lucide-react";

import { PlanningStatusIcon } from "./PlanningStatusIcon";

// ISO 8601 weeknummer (weken beginnen op maandag)
function isoWeek(date: Date) {
    const d = new Date(
        Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
    );
    const day = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(
        ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
    );
}

function shortMonteur(name: string | null | undefined): string {
    const parts = (name || "").trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "Monteur";
    if (parts.length === 1) return parts[0];
    return `${parts[0]} ${parts[1][0]}.`;
}

interface WeekNavigation {
    rangeLabel: string;
    onPrevious: () => void;
    onNext: () => void;
    onToday: () => void;
}

interface WeekViewProps {
    items: any[];
    leave?: any[];
    /** Vrije agenda-items (geen werkbon) */
    events?: any[];
    engineers?: { id: string; name: string | null }[];
    weekStart?: Date;
    weekNavigation?: WeekNavigation;
    view?: "week" | "month";
    onViewChange?: (view: "week" | "month") => void;
    onMovePlan?: (args: {
        workorderId: string;
        dateIso: string;
        hour: number;
        engineerId: string;
    }) => void;
    pendingSchedule?: { workorderId: string; label: string } | null;
    onSchedulePending?: (args: {
        dateIso: string;
        hour?: number;
        engineerId: string;
    }) => void;
    showStatusIcons?: boolean;
    onCreateAgenda?: (args: {
        dateIso: string;
        hour?: number;
        engineerId?: string | null;
    }) => void;
    onEditAgenda?: (event: any) => void;
}

function toIsoDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function formatTime(iso: string | null | undefined): string | null {
    if (!iso) return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    if (d.getHours() === 0 && d.getMinutes() === 0) return null;
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatUurLabel(uur: number): string {
    const h = Math.floor(uur);
    const m = Math.round((uur - h) * 60);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

type RowEntry =
    | { kind: "job"; sort: number; item: any }
    | { kind: "event"; sort: number; event: any };

/**
 * Weekplanning: gestapelde dagblokken (ma–za), per monteur een rij
 * met niet-overlappende lijstkaarten + Algemeen voor notities.
 */
export default function WeekView({
    items,
    leave = [],
    events = [],
    engineers = [],
    weekStart,
    weekNavigation,
    view = "week",
    onViewChange,
    onMovePlan,
    pendingSchedule = null,
    onSchedulePending,
    showStatusIcons = true,
    onCreateAgenda,
    onEditAgenda,
}: WeekViewProps) {
    const today = new Date();
    const todayIso = toIsoDate(today);

    const startOfWeek = weekStart
        ? new Date(weekStart)
        : (() => {
              const d = new Date(today);
              d.setDate(today.getDate() - today.getDay() + 1);
              return d;
          })();

    const days = Array.from({ length: 6 }, (_, index) => {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + index);
        date.setHours(0, 0, 0, 0);
        return date;
    });

    const DAG_START_UUR = 7;
    const DAG_EIND_UUR = 18;

    function heeftKloktijd(d: Date): boolean {
        return d.getHours() !== 0 || d.getMinutes() !== 0;
    }

    function uurVan(d: Date): number {
        const u = d.getHours() + d.getMinutes() / 60;
        return Math.min(DAG_EIND_UUR, Math.max(DAG_START_UUR, u));
    }

    function blokUren(
        item: any,
        day: Date
    ): { beginUur: number; eindUur: number; heleDag: boolean } {
        const cellIso = toIsoDate(day);
        const start = item.plannedDate ? new Date(item.plannedDate) : null;
        const eind = item.plannedEndDate
            ? new Date(item.plannedEndDate)
            : null;

        if (!start) {
            return {
                beginUur: DAG_START_UUR,
                eindUur: DAG_EIND_UUR,
                heleDag: true,
            };
        }

        const startIso = toIsoDate(start);
        const endIso = eind ? toIsoDate(eind) : startIso;
        const meerdaags = startIso !== endIso;

        if (meerdaags) {
            const beginUur = heeftKloktijd(start)
                ? uurVan(start)
                : DAG_START_UUR;
            let eindUur =
                eind && heeftKloktijd(eind)
                    ? uurVan(eind)
                    : DAG_EIND_UUR;
            if (eindUur <= beginUur) {
                eindUur = Math.min(DAG_EIND_UUR, beginUur + 2);
            }
            return {
                beginUur,
                eindUur,
                heleDag: !heeftKloktijd(start) && !(eind && heeftKloktijd(eind)),
            };
        }

        const startIsDezeDag = startIso === cellIso;
        let beginUur = DAG_START_UUR;
        let eindUur = DAG_EIND_UUR;
        let heleDag = true;

        if (startIsDezeDag && heeftKloktijd(start)) {
            beginUur = uurVan(start);
            heleDag = false;
        }

        if (eind && toIsoDate(eind) === cellIso && heeftKloktijd(eind)) {
            eindUur = uurVan(eind);
            heleDag = false;
        } else if (startIsDezeDag && !eind && heeftKloktijd(start)) {
            eindUur = Math.min(DAG_EIND_UUR, uurVan(start) + 2);
            heleDag = false;
        }

        if (eindUur <= beginUur) {
            eindUur = Math.min(DAG_EIND_UUR, beginUur + 1);
        }

        return { beginUur, eindUur, heleDag };
    }

    function leaveOn(userId: string, day: Date) {
        const iso = toIsoDate(day);
        return leave.find((l) => {
            if (l.userId !== userId) return false;
            const from = l.from;
            const to = l.to || l.from;
            return from <= iso && iso <= to;
        });
    }

    function itemsForUserDay(userId: string, day: Date) {
        return items.filter((item) => {
            const isPrimary = item.assignedUser?.id === userId;
            const isExtra =
                Array.isArray(item.extraEngineers) &&
                item.extraEngineers.some(
                    (e: any) => e.user?.id === userId
                );
            if (!isPrimary && !isExtra) return false;
            if (!item.plannedDate) return false;

            const cellIso = toIsoDate(day);
            const startIso = toIsoDate(new Date(item.plannedDate));
            const endIso = item.plannedEndDate
                ? toIsoDate(new Date(item.plannedEndDate))
                : startIso;
            return startIso <= cellIso && cellIso <= endIso;
        });
    }

    const users =
        engineers.length > 0
            ? engineers
            : (Array.from(
                  new Map(
                      items
                          .filter((item) => item.assignedUser)
                          .map((item) => [
                              item.assignedUser.id,
                              item.assignedUser,
                          ])
                  ).values()
              ) as { id: string; name: string | null }[]);

    function eventOnDay(ev: any, day: Date): boolean {
        if (!ev?.startAt) return false;
        const cellIso = toIsoDate(day);
        const startIso = toIsoDate(new Date(ev.startAt));
        const endIso = ev.endAt
            ? toIsoDate(new Date(ev.endAt))
            : startIso;
        return startIso <= cellIso && cellIso <= endIso;
    }

    function eventsForUserDay(userId: string, day: Date) {
        return events.filter(
            (ev) =>
                ev.assignedUserId === userId && eventOnDay(ev, day)
        );
    }

    function unassignedEventsOnDay(day: Date) {
        return events.filter(
            (ev) => !ev.assignedUserId && eventOnDay(ev, day)
        );
    }

    function dayJobCount(day: Date): number {
        const jobs = users.reduce(
            (sum, user) => sum + itemsForUserDay(user.id, day).length,
            0
        );
        const assignedEvents = users.reduce(
            (sum, user) =>
                sum + eventsForUserDay(user.id, day).length,
            0
        );
        return jobs + assignedEvents + unassignedEventsOnDay(day).length;
    }

    function entriesForUserDay(userId: string, day: Date): RowEntry[] {
        const jobs: RowEntry[] = itemsForUserDay(userId, day).map(
            (item) => ({
                kind: "job",
                sort: item.plannedDate
                    ? new Date(item.plannedDate).getTime()
                    : 0,
                item,
            })
        );
        const evs: RowEntry[] = eventsForUserDay(userId, day).map(
            (event) => ({
                kind: "event",
                sort: event.startAt
                    ? new Date(event.startAt).getTime()
                    : 0,
                event,
            })
        );
        return [...jobs, ...evs].sort((a, b) => a.sort - b.sort);
    }

    function jobTimeLabel(item: any, day: Date): string {
        const { beginUur, eindUur, heleDag } = blokUren(item, day);
        if (heleDag) return "Hele dag";
        return `${formatUurLabel(beginUur)}–${formatUurLabel(eindUur)}`;
    }

    function eventTimeLabel(ev: any): string {
        if (ev.allDay) return "Hele dag";
        const start = formatTime(ev.startAt);
        const end = formatTime(ev.endAt ?? null);
        if (start && end) return `${start}–${end}`;
        if (start) return `vanaf ${start}`;
        return "Hele dag";
    }

    function customerColor(item: any): string {
        return (
            item.customer?.color ??
            item.project?.customer?.color ??
            "#2563eb"
        );
    }

    function handleDropOnMonteur(
        e: DragEvent,
        dateIso: string,
        engineerId: string
    ) {
        e.preventDefault();
        if (!onMovePlan) return;
        const workorderId = e.dataTransfer.getData("workorderId");
        if (!workorderId) return;
        onMovePlan({
            workorderId,
            dateIso,
            hour: DAG_START_UUR + 1,
            engineerId,
        });
    }

    return (
        <section className="bg-white border border-gray-200 rounded-2xl">
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-5 pt-3 pb-2.5 border-b border-slate-100 bg-slate-50/60">
                <div className="flex flex-wrap items-center gap-2 min-w-0">
                    <h2 className="text-lg font-bold text-slate-900">
                        Weekoverzicht
                    </h2>
                    <span className="inline-flex items-center rounded-full bg-[#0066FF]/10 text-[#0066FF] text-xs font-semibold px-2.5 py-0.5">
                        Week {isoWeek(startOfWeek)}
                    </span>
                    {onViewChange ? (
                        <div className="inline-flex rounded-lg border border-slate-200 bg-white/80 p-0.5 shrink-0">
                            <button
                                type="button"
                                onClick={() => onViewChange("week")}
                                className={`
                                    px-3 py-1.5 rounded-md text-xs sm:text-sm font-semibold transition
                                    ${
                                        view === "week"
                                            ? "bg-[#0066FF] text-white shadow-sm"
                                            : "text-slate-600 hover:text-slate-900"
                                    }
                                `}
                            >
                                Week
                            </button>
                            <button
                                type="button"
                                onClick={() => onViewChange("month")}
                                className={`
                                    px-3 py-1.5 rounded-md text-xs sm:text-sm font-semibold transition
                                    ${
                                        view === "month"
                                            ? "bg-[#0066FF] text-white shadow-sm"
                                            : "text-slate-600 hover:text-slate-900"
                                    }
                                `}
                            >
                                Maand
                            </button>
                        </div>
                    ) : null}
                </div>

                {weekNavigation ? (
                    <button
                        type="button"
                        onClick={weekNavigation.onToday}
                        className="
                            shrink-0 text-sm font-semibold text-[#0066FF]
                            rounded-lg border border-[#0066FF]/25 bg-white
                            px-3 py-1.5 hover:bg-[#e8f0ff] transition
                        "
                    >
                        Vandaag
                    </button>
                ) : null}
            </div>

            {weekNavigation ? (
                <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-2 border-b border-slate-100 bg-slate-50/80">
                    <button
                        type="button"
                        onClick={weekNavigation.onPrevious}
                        className="
                            inline-flex items-center gap-1
                            rounded-lg border border-slate-200 bg-white
                            px-2.5 py-1.5 text-xs sm:text-sm font-medium text-slate-700
                            hover:bg-slate-50 transition shrink-0
                        "
                    >
                        ← Vorige
                    </button>

                    <span className="
                        text-xs sm:text-sm font-semibold text-slate-800
                        tabular-nums leading-tight text-center min-w-0 truncate
                    ">
                        {weekNavigation.rangeLabel}
                    </span>

                    <button
                        type="button"
                        onClick={weekNavigation.onNext}
                        className="
                            inline-flex items-center gap-1
                            rounded-lg border border-slate-200 bg-white
                            px-2.5 py-1.5 text-xs sm:text-sm font-medium text-slate-700
                            hover:bg-slate-50 transition shrink-0
                        "
                    >
                        Volgende →
                    </button>
                </div>
            ) : null}

            {pendingSchedule ? (
                <div className="mx-3 sm:mx-4 mt-3 rounded-xl border border-[#0066FF]/25 bg-[#e8f0ff] px-3 py-2 text-sm text-[#0047b3]">
                    Klik op een monteurrij of op{" "}
                    <strong className="font-semibold">Inplannen</strong> om{" "}
                    <strong className="font-semibold">
                        {pendingSchedule.label}
                    </strong>{" "}
                    te plaatsen.
                </div>
            ) : null}

            <div className="max-h-[min(72vh,calc(100dvh-14rem))] overflow-auto p-3 sm:p-4 space-y-3">
                {days.map((day) => {
                    const iso = toIsoDate(day);
                    const isToday = iso === todayIso;
                    const weekday = day.toLocaleDateString("nl-NL", {
                        weekday: "long",
                    });
                    const dayLabel = day.toLocaleDateString("nl-NL", {
                        day: "numeric",
                        month: "long",
                    });
                    const count = dayJobCount(day);
                    const generalEvents = unassignedEventsOnDay(day).sort(
                        (a, b) =>
                            new Date(a.startAt).getTime() -
                            new Date(b.startAt).getTime()
                    );

                    return (
                        <section
                            key={iso}
                            className={`
                                rounded-2xl border overflow-hidden
                                ${
                                    isToday
                                        ? "border-[#D6007E]/35 shadow-sm ring-1 ring-[#D6007E]/15"
                                        : "border-slate-200"
                                }
                            `}
                        >
                            <header
                                className={`
                                    sticky top-0 z-20 flex flex-wrap items-center justify-between gap-2
                                    px-3 sm:px-4 py-2.5 border-b
                                    ${
                                        isToday
                                            ? "bg-[#fff5fa] border-[#D6007E]/20"
                                            : "bg-slate-50/90 border-slate-100 backdrop-blur-sm"
                                    }
                                `}
                            >
                                <div className="flex items-baseline gap-2 min-w-0">
                                    <h3
                                        className={`
                                            text-base font-bold capitalize
                                            ${isToday ? "text-[#D6007E]" : "text-slate-900"}
                                        `}
                                    >
                                        {weekday}
                                    </h3>
                                    <span className="text-sm text-slate-500 tabular-nums">
                                        {dayLabel}
                                    </span>
                                    {isToday ? (
                                        <span className="text-[10px] font-semibold uppercase tracking-wide text-[#D6007E] bg-white/80 px-1.5 py-0.5 rounded">
                                            Vandaag
                                        </span>
                                    ) : null}
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-xs text-slate-500">
                                        {count === 0
                                            ? "Leeg"
                                            : `${count} item${count === 1 ? "" : "s"}`}
                                    </span>
                                    {onCreateAgenda ? (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                onCreateAgenda({
                                                    dateIso: iso,
                                                    engineerId: null,
                                                })
                                            }
                                            className="
                                                text-xs font-semibold text-[#0066FF]
                                                rounded-lg border border-[#0066FF]/25 bg-white
                                                px-2.5 py-1 hover:bg-[#e8f0ff] transition
                                            "
                                        >
                                            + Agenda
                                        </button>
                                    ) : null}
                                    {!pendingSchedule ? (
                                        <Link
                                            href={`/workorders/new?date=${iso}`}
                                            className="
                                                text-xs font-semibold text-slate-600
                                                rounded-lg border border-slate-200 bg-white
                                                px-2.5 py-1 hover:bg-slate-50 transition
                                            "
                                        >
                                            + Opdracht
                                        </Link>
                                    ) : null}
                                </div>
                            </header>

                            <div className="divide-y divide-slate-100 bg-white">
                                {/* Algemeen: notities / terugkerend zonder monteur */}
                                <div className="flex gap-3 px-3 sm:px-4 py-2.5 bg-amber-50/40">
                                    <div className="w-28 sm:w-36 shrink-0 pt-0.5">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-amber-800/80">
                                            Algemeen
                                        </p>
                                        <p className="text-[11px] text-amber-700/70">
                                            Notities &amp; terugkeer
                                        </p>
                                    </div>
                                    <div className="flex-1 min-w-0 space-y-1.5">
                                        {generalEvents.length === 0 ? (
                                            onCreateAgenda ? (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        onCreateAgenda({
                                                            dateIso: iso,
                                                            engineerId: null,
                                                        })
                                                    }
                                                    className="
                                                        w-full text-left text-xs text-amber-800/60
                                                        rounded-lg border border-dashed border-amber-300/60
                                                        px-3 py-2 hover:bg-amber-50 hover:text-amber-900 transition
                                                    "
                                                >
                                                    + Notitie of terugkerend item
                                                </button>
                                            ) : (
                                                <p className="text-xs text-slate-400 py-1">
                                                    Geen algemene items
                                                </p>
                                            )
                                        ) : (
                                            generalEvents.map((ev) => (
                                                <AgendaCard
                                                    key={ev.id}
                                                    event={ev}
                                                    timeLabel={eventTimeLabel(
                                                        ev
                                                    )}
                                                    onEdit={onEditAgenda}
                                                />
                                            ))
                                        )}
                                    </div>
                                </div>

                                {users.length === 0 ? (
                                    <p className="px-4 py-6 text-sm text-slate-500">
                                        Geen monteurs om te tonen.
                                    </p>
                                ) : (
                                    users.map((user) => {
                                        const verlof = leaveOn(user.id, day);
                                        const entries = entriesForUserDay(
                                            user.id,
                                            day
                                        );
                                        const name = shortMonteur(user.name);

                                        return (
                                            <div
                                                key={user.id}
                                                className={`
                                                    flex gap-3 px-3 sm:px-4 py-2.5
                                                    ${
                                                        pendingSchedule
                                                            ? "cursor-pointer hover:bg-[#e8f0ff]/50"
                                                            : ""
                                                    }
                                                `}
                                                onDragOver={
                                                    onMovePlan
                                                        ? (e) => {
                                                              e.preventDefault();
                                                              e.dataTransfer.dropEffect =
                                                                  "move";
                                                          }
                                                        : undefined
                                                }
                                                onDrop={
                                                    onMovePlan
                                                        ? (e) =>
                                                              handleDropOnMonteur(
                                                                  e,
                                                                  iso,
                                                                  user.id
                                                              )
                                                        : undefined
                                                }
                                                onClick={
                                                    pendingSchedule &&
                                                    onSchedulePending
                                                        ? () =>
                                                              onSchedulePending(
                                                                  {
                                                                      dateIso:
                                                                          iso,
                                                                      engineerId:
                                                                          user.id,
                                                                  }
                                                              )
                                                        : undefined
                                                }
                                            >
                                                <div className="w-28 sm:w-36 shrink-0 pt-0.5">
                                                    <p className="text-sm font-semibold text-slate-800 leading-snug">
                                                        {name}
                                                    </p>
                                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                                        {verlof
                                                            ? verlof.type ||
                                                              "Verlof"
                                                            : entries.length ===
                                                                0
                                                              ? "Vrij"
                                                              : `${entries.length}×`}
                                                    </p>
                                                </div>

                                                <div className="flex-1 min-w-0 space-y-1.5">
                                                    {verlof ? (
                                                        <div
                                                            className="
                                                                rounded-lg px-3 py-2 text-xs font-medium
                                                                bg-gradient-to-r from-orange-50 to-orange-100/80
                                                                text-orange-800 border border-orange-200/60
                                                            "
                                                        >
                                                            🌴{" "}
                                                            {verlof.type ||
                                                                "Verlof"}
                                                        </div>
                                                    ) : null}

                                                    {entries.map((entry) =>
                                                        entry.kind ===
                                                        "job" ? (
                                                            <JobCard
                                                                key={
                                                                    entry.item
                                                                        .id
                                                                }
                                                                item={
                                                                    entry.item
                                                                }
                                                                timeLabel={jobTimeLabel(
                                                                    entry.item,
                                                                    day
                                                                )}
                                                                color={customerColor(
                                                                    entry.item
                                                                )}
                                                                showStatusIcons={
                                                                    showStatusIcons
                                                                }
                                                                draggable={
                                                                    !!onMovePlan
                                                                }
                                                            />
                                                        ) : (
                                                            <AgendaCard
                                                                key={
                                                                    entry
                                                                        .event
                                                                        .id
                                                                }
                                                                event={
                                                                    entry.event
                                                                }
                                                                timeLabel={eventTimeLabel(
                                                                    entry.event
                                                                )}
                                                                onEdit={
                                                                    onEditAgenda
                                                                }
                                                            />
                                                        )
                                                    )}

                                                    {!verlof &&
                                                    entries.length ===
                                                        0 ? (
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {pendingSchedule &&
                                                            onSchedulePending ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={(
                                                                        e
                                                                    ) => {
                                                                        e.stopPropagation();
                                                                        onSchedulePending(
                                                                            {
                                                                                dateIso:
                                                                                    iso,
                                                                                engineerId:
                                                                                    user.id,
                                                                            }
                                                                        );
                                                                    }}
                                                                    className="
                                                                        text-xs font-semibold text-white
                                                                        rounded-lg bg-[#0066FF] px-2.5 py-1.5
                                                                        hover:bg-[#0052cc] transition
                                                                    "
                                                                >
                                                                    Inplannen:{" "}
                                                                    {
                                                                        pendingSchedule.label
                                                                    }
                                                                </button>
                                                            ) : null}
                                                            {onCreateAgenda ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={(
                                                                        e
                                                                    ) => {
                                                                        e.stopPropagation();
                                                                        onCreateAgenda(
                                                                            {
                                                                                dateIso:
                                                                                    iso,
                                                                                engineerId:
                                                                                    user.id,
                                                                            }
                                                                        );
                                                                    }}
                                                                    className="
                                                                        text-xs font-medium text-slate-500
                                                                        rounded-lg border border-dashed border-slate-200
                                                                        px-2.5 py-1.5 hover:border-[#0066FF]/40
                                                                        hover:text-[#0066FF] hover:bg-[#e8f0ff]/50
                                                                        transition
                                                                    "
                                                                >
                                                                    + Plannen
                                                                </button>
                                                            ) : onMovePlan ? (
                                                                <Link
                                                                    href={`/workorders/new?date=${iso}&engineer=${user.id}`}
                                                                    onClick={(
                                                                        e
                                                                    ) =>
                                                                        e.stopPropagation()
                                                                    }
                                                                    className="
                                                                        text-xs font-medium text-slate-500
                                                                        rounded-lg border border-dashed border-slate-200
                                                                        px-2.5 py-1.5 hover:border-[#0066FF]/40
                                                                        hover:text-[#0066FF] hover:bg-[#e8f0ff]/50
                                                                        transition
                                                                    "
                                                                >
                                                                    + Plannen
                                                                </Link>
                                                            ) : (
                                                                <p className="text-xs text-slate-400 py-1">
                                                                    Niets
                                                                    gepland
                                                                </p>
                                                            )}
                                                        </div>
                                                    ) : !verlof &&
                                                      onCreateAgenda ? (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onCreateAgenda({
                                                                    dateIso:
                                                                        iso,
                                                                    engineerId:
                                                                        user.id,
                                                                });
                                                            }}
                                                            className="
                                                                text-[11px] font-medium text-slate-400
                                                                hover:text-[#0066FF] transition
                                                            "
                                                        >
                                                            + Item toevoegen
                                                        </button>
                                                    ) : null}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </section>
                    );
                })}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-4 py-2.5 border-t border-slate-100 bg-slate-50/60 text-[11px] text-slate-600">
                <span>
                    <strong className="font-semibold text-slate-700">
                        Kleur
                    </strong>{" "}
                    = opdrachtgever
                </span>
                <span>
                    Per dag een rij per monteur — klussen onder elkaar, geen
                    overlap
                </span>
                <span className="text-slate-500">
                    Algemeen = notities &amp; terugkerende items zonder monteur
                </span>
            </div>
        </section>
    );
}

function JobCard({
    item,
    timeLabel,
    color,
    showStatusIcons,
    draggable,
}: {
    item: any;
    timeLabel: string;
    color: string;
    showStatusIcons: boolean;
    draggable: boolean;
}) {
    const number =
        item.workorderNumber || item.number || item.code || item.id;
    const customer =
        item.customer?.name ||
        item.project?.customer?.name ||
        item.title ||
        "Opdracht";

    return (
        <div
            draggable={draggable}
            onDragStart={
                draggable
                    ? (e) => {
                          e.dataTransfer.setData("workorderId", item.id);
                          e.dataTransfer.effectAllowed = "move";
                      }
                    : undefined
            }
            className={`
                rounded-lg px-2.5 py-1.5 text-white shadow-sm ring-1 ring-black/10
                hover:brightness-110 transition
                ${draggable ? "cursor-grab active:cursor-grabbing" : ""}
            `}
            style={{ backgroundColor: color }}
            data-planning-job
        >
            <Link
                href={`/workorders/${item.id}`}
                draggable={false}
                className="block min-w-0"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold opacity-95">
                            <span className="tabular-nums">{timeLabel}</span>
                            {showStatusIcons ? (
                                <PlanningStatusIcon
                                    status={item.status}
                                    className="h-3 w-3"
                                />
                            ) : null}
                        </div>
                        <div className="text-xs font-bold truncate leading-snug mt-0.5">
                            {number}
                        </div>
                        <div className="text-[11px] opacity-90 truncate">
                            {customer}
                        </div>
                    </div>
                </div>
            </Link>
        </div>
    );
}

function AgendaCard({
    event,
    timeLabel,
    onEdit,
}: {
    event: any;
    timeLabel: string;
    onEdit?: (event: any) => void;
}) {
    const recurring =
        event.recurrenceFreq && event.recurrenceFreq !== "none";

    const inner = (
        <div className="flex items-start gap-2 min-w-0">
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-900/80">
                    <span className="tabular-nums">{timeLabel}</span>
                    {recurring ? (
                        <Repeat2
                            className="h-3 w-3 shrink-0"
                            aria-label="Terugkerend"
                        />
                    ) : null}
                </div>
                <div className="text-xs font-semibold text-amber-950 truncate mt-0.5">
                    {event.title}
                </div>
                {event.notes ? (
                    <div className="text-[11px] text-amber-900/70 line-clamp-2 mt-0.5">
                        {event.notes}
                    </div>
                ) : null}
            </div>
        </div>
    );

    if (onEdit) {
        return (
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    onEdit(event);
                }}
                className="
                    w-full text-left rounded-lg px-2.5 py-1.5
                    bg-amber-50 border border-amber-200/80
                    hover:bg-amber-100/80 hover:border-amber-300 transition
                "
                title={event.title}
            >
                {inner}
            </button>
        );
    }

    return (
        <div
            className="
                rounded-lg px-2.5 py-1.5
                bg-amber-50 border border-amber-200/80
            "
            title={event.title}
        >
            {inner}
        </div>
    );
}
