"use client";

import Link from "next/link";
import { Check } from "lucide-react";

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

interface WeekNavigation {
    rangeLabel: string;
    onPrevious: () => void;
    onNext: () => void;
    onToday: () => void;
}

interface WeekViewProps {
    items: any[];
    leave?: any[];
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

function shortMonteur(name: string | null | undefined): string {
    const parts = (name || "").trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "—";
    if (parts.length === 1) return parts[0];
    return `${parts[0]} ${parts[1][0]}.`;
}

/** Google/Office-achtige week: kolommen = dagen, links tijdlijn. */
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

    // ma–vr (werkweek), zoals Google-werkweek; za optioneel via 6 dagen
    const days = Array.from({ length: 5 }, (_, index) => {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + index);
        return date;
    });

    const DAG_START_UUR = 7;
    const DAG_EIND_UUR = 18;
    const PX_PER_UUR = 52;
    const DAG_PADDING_TOP = 8;
    const DAG_HOOGTE =
        (DAG_EIND_UUR - DAG_START_UUR) * PX_PER_UUR + DAG_PADDING_TOP;

    const uurLijnen = Array.from(
        { length: DAG_EIND_UUR - DAG_START_UUR + 1 },
        (_, i) => DAG_START_UUR + i
    );

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

    function isoDate(d: Date): string {
        return toIsoDate(d);
    }

    function heeftKloktijd(d: Date): boolean {
        return d.getHours() !== 0 || d.getMinutes() !== 0;
    }

    function uurVan(d: Date): number {
        const u = d.getHours() + d.getMinutes() / 60;
        return Math.min(DAG_EIND_UUR, Math.max(DAG_START_UUR, u));
    }

    function formatUurLabel(uur: number): string {
        const h = Math.floor(uur);
        const m = Math.round((uur - h) * 60);
        return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }

    function blokUren(
        plannedDate: string | Date | null | undefined,
        plannedEndDate: string | Date | null | undefined,
        day: Date
    ): { beginUur: number; eindUur: number; allDayLike: boolean } {
        const cellIso = isoDate(day);
        const start = plannedDate ? new Date(plannedDate) : null;
        const eind = plannedEndDate ? new Date(plannedEndDate) : null;

        if (!start) {
            return {
                beginUur: DAG_START_UUR,
                eindUur: DAG_EIND_UUR,
                allDayLike: true,
            };
        }

        const startIso = isoDate(start);
        const endIso = eind ? isoDate(eind) : startIso;
        const meerdaags = startIso !== endIso;

        if (meerdaags || (!heeftKloktijd(start) && (!eind || !heeftKloktijd(eind)))) {
            return {
                beginUur: DAG_START_UUR,
                eindUur: DAG_EIND_UUR,
                allDayLike: true,
            };
        }

        let beginUur = DAG_START_UUR;
        let eindUur = DAG_EIND_UUR;

        if (startIso === cellIso && heeftKloktijd(start)) {
            beginUur = uurVan(start);
        }
        if (eind && isoDate(eind) === cellIso && heeftKloktijd(eind)) {
            eindUur = uurVan(eind);
        } else if (startIso === cellIso && !eind && heeftKloktijd(start)) {
            eindUur = Math.min(DAG_EIND_UUR, uurVan(start) + 2);
        }

        if (eindUur <= beginUur) {
            eindUur = Math.min(DAG_EIND_UUR, beginUur + 1);
        }

        return { beginUur, eindUur, allDayLike: false };
    }

    function blokPositie(
        plannedDate: string | Date | null | undefined,
        plannedEndDate: string | Date | null | undefined,
        day: Date
    ) {
        const { beginUur, eindUur, allDayLike } = blokUren(
            plannedDate,
            plannedEndDate,
            day
        );
        const top =
            (beginUur - DAG_START_UUR) * PX_PER_UUR + DAG_PADDING_TOP;
        const height = Math.max(36, (eindUur - beginUur) * PX_PER_UUR);
        return { top, height, beginUur, eindUur, allDayLike };
    }

    function hourFromClientY(clientY: number, cellEl: HTMLElement): number {
        const rect = cellEl.getBoundingClientRect();
        const y = clientY - rect.top - DAG_PADDING_TOP;
        const raw = DAG_START_UUR + y / PX_PER_UUR;
        const snapped = Math.round(raw * 4) / 4;
        return Math.min(
            DAG_EIND_UUR - 0.25,
            Math.max(DAG_START_UUR, snapped)
        );
    }

    function itemOnDay(item: any, day: Date): boolean {
        if (!item.plannedDate) return false;
        const cellIso = isoDate(day);
        const startIso = isoDate(new Date(item.plannedDate));
        const endIso = item.plannedEndDate
            ? isoDate(new Date(item.plannedEndDate))
            : startIso;
        return startIso <= cellIso && cellIso <= endIso;
    }

    function eventOnDay(ev: any, day: Date): boolean {
        if (!ev?.startAt) return false;
        const cellIso = isoDate(day);
        const startIso = isoDate(new Date(ev.startAt));
        const endIso = ev.endAt
            ? isoDate(new Date(ev.endAt))
            : startIso;
        return startIso <= cellIso && cellIso <= endIso;
    }

    function leaveOnDay(day: Date) {
        const iso = isoDate(day);
        return leave.filter((l) => {
            const from = l.from;
            const to = l.to || l.from;
            return from && from <= iso && iso <= to;
        });
    }

    function jobsOnDay(day: Date) {
        return items.filter((item) => itemOnDay(item, day));
    }

    function eventsOnDay(day: Date) {
        return events.filter((ev) => eventOnDay(ev, day));
    }

    /** Alle actieve monteurs hebben ≥1 klus die dag. */
    function allEngineersCovered(day: Date): boolean {
        if (users.length === 0) return false;
        const dayJobs = jobsOnDay(day);
        return users.every((user) =>
            dayJobs.some((item) => {
                const primary = item.assignedUser?.id === user.id;
                const extra =
                    Array.isArray(item.extraEngineers) &&
                    item.extraEngineers.some(
                        (e: any) => e.user?.id === user.id
                    );
                return primary || extra;
            })
        );
    }

    function engineerColor(userId: string | null | undefined): string {
        if (!userId) return "#64748b";
        const palette = [
            "#0066FF",
            "#d6007e",
            "#7c3aed",
            "#059669",
            "#ea580c",
            "#0891b2",
            "#4f46e5",
            "#ca8a04",
        ];
        let hash = 0;
        for (let i = 0; i < userId.length; i++) {
            hash = (hash + userId.charCodeAt(i) * (i + 1)) % 997;
        }
        return palette[hash % palette.length];
    }

    function jobColor(item: any): string {
        return (
            item.customer?.color ??
            item.project?.customer?.color ??
            engineerColor(item.assignedUser?.id)
        );
    }

    const gridCols = `56px repeat(${days.length}, minmax(0, 1fr))`;

    return (
        <section className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
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
                    <span className="text-xs sm:text-sm font-semibold text-slate-800 tabular-nums text-center min-w-0 truncate">
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

            <div className="overflow-x-auto">
                <div
                    className="min-w-[720px] grid"
                    style={{ gridTemplateColumns: gridCols }}
                >
                    {/* Dagkoppen */}
                    <div className="border-b border-slate-200 bg-slate-50/80" />
                    {days.map((day) => {
                        const iso = isoDate(day);
                        const isToday = iso === todayIso;
                        const weekday = day.toLocaleDateString("nl-NL", {
                            weekday: "short",
                        });
                        const covered = allEngineersCovered(day);
                        const jobCount = jobsOnDay(day).length;
                        const eventCount = eventsOnDay(day).length;

                        return (
                            <button
                                key={`head-${iso}`}
                                type="button"
                                disabled={!!pendingSchedule && !onSchedulePending}
                                onClick={() => {
                                    if (pendingSchedule) return;
                                    onCreateAgenda?.({ dateIso: iso });
                                }}
                                title={
                                    onCreateAgenda
                                        ? "Klik om agenda-item of opdracht te plannen"
                                        : undefined
                                }
                                className={`
                                    border-b border-l border-slate-200 px-2 py-2.5
                                    text-center transition
                                    ${
                                        isToday
                                            ? "bg-[#fff5fa]"
                                            : "bg-slate-50/50 hover:bg-[#e8f0ff]/50"
                                    }
                                    ${onCreateAgenda && !pendingSchedule ? "cursor-pointer" : "cursor-default"}
                                `}
                            >
                                <div className="flex items-center justify-center gap-1.5">
                                    <span
                                        className={`text-xs font-medium uppercase tracking-wide ${
                                            isToday
                                                ? "text-[#d6007e]"
                                                : "text-slate-500"
                                        }`}
                                    >
                                        {weekday}
                                    </span>
                                    <span
                                        className={`
                                            inline-flex h-7 min-w-7 items-center justify-center
                                            rounded-full px-1.5 text-sm font-bold tabular-nums
                                            ${
                                                isToday
                                                    ? "bg-[#d6007e] text-white"
                                                    : "text-slate-800"
                                            }
                                        `}
                                    >
                                        {day.getDate()}
                                    </span>
                                    {covered ? (
                                        <span
                                            title="Alle monteurs hebben iets gepland"
                                            className="
                                                inline-flex h-5 w-5 items-center justify-center
                                                rounded-full bg-emerald-100 text-emerald-700
                                            "
                                        >
                                            <Check className="h-3 w-3" strokeWidth={3} />
                                        </span>
                                    ) : null}
                                </div>
                                <p className="text-[10px] text-slate-400 mt-0.5 tabular-nums">
                                    {jobCount + eventCount === 0
                                        ? "Leeg"
                                        : `${jobCount + eventCount} item${jobCount + eventCount === 1 ? "" : "s"}`}
                                </p>
                            </button>
                        );
                    })}

                    {/* Hele-dag / verlof strook */}
                    <div className="border-b border-slate-100 px-1 py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400 flex items-start justify-end pr-2">
                        Hele dag
                    </div>
                    {days.map((day) => {
                        const iso = isoDate(day);
                        const dayLeave = leaveOnDay(day);
                        const allDayEvents = eventsOnDay(day).filter(
                            (ev) =>
                                ev.allDay ||
                                blokPositie(ev.startAt, ev.endAt, day)
                                    .allDayLike
                        );
                        const allDayJobs = jobsOnDay(day).filter((item) =>
                            blokPositie(
                                item.plannedDate,
                                item.plannedEndDate,
                                day
                            ).allDayLike
                        );

                        return (
                            <div
                                key={`allday-${iso}`}
                                className="border-b border-l border-slate-100 px-1 py-1 min-h-[2.5rem] space-y-0.5 bg-slate-50/30"
                            >
                                {dayLeave.map((l) => (
                                    <div
                                        key={l.id}
                                        className="
                                            rounded-md bg-orange-50 border border-orange-100
                                            text-orange-800 text-[10px] px-1.5 py-0.5
                                            truncate font-medium
                                        "
                                        title={`Verlof: ${l.userName ?? ""}`}
                                    >
                                        🌴 {l.userName ?? "Verlof"}
                                    </div>
                                ))}
                                {allDayEvents.map((ev) => (
                                    <button
                                        key={ev.id}
                                        type="button"
                                        data-planning-agenda
                                        onClick={() => onEditAgenda?.(ev)}
                                        className="
                                            w-full text-left rounded-md px-1.5 py-0.5
                                            bg-amber-100 border border-amber-200
                                            text-amber-950 text-[10px] font-semibold
                                            truncate hover:bg-amber-200
                                        "
                                        title={ev.title}
                                    >
                                        {ev.title}
                                        {ev.recurrenceFreq &&
                                        ev.recurrenceFreq !== "none"
                                            ? " ↻"
                                            : ""}
                                    </button>
                                ))}
                                {allDayJobs.map((item) => (
                                    <Link
                                        key={item.id}
                                        href={`/workorders/${item.id}`}
                                        data-planning-job
                                        className="
                                            block rounded-md px-1.5 py-0.5 text-[10px]
                                            font-semibold text-white truncate
                                            hover:brightness-110
                                        "
                                        style={{
                                            backgroundColor: jobColor(item),
                                        }}
                                        title={item.title}
                                    >
                                        {item.number || item.title}
                                    </Link>
                                ))}
                            </div>
                        );
                    })}

                    {/* Tijdlijn + dagkolommen */}
                    <div
                        className="relative border-r border-slate-100"
                        style={{ height: DAG_HOOGTE }}
                    >
                        {uurLijnen.map((uur) => {
                            if (uur === DAG_EIND_UUR) return null;
                            const top =
                                (uur - DAG_START_UUR) * PX_PER_UUR +
                                DAG_PADDING_TOP;
                            return (
                                <div
                                    key={uur}
                                    className="absolute right-1 -translate-y-1/2 text-[10px] text-slate-400 tabular-nums"
                                    style={{ top: `${top}px` }}
                                >
                                    {String(uur).padStart(2, "0")}:00
                                </div>
                            );
                        })}
                    </div>

                    {days.map((day) => {
                        const iso = isoDate(day);
                        const isToday = iso === todayIso;
                        const timedJobs = jobsOnDay(day).filter(
                            (item) =>
                                !blokPositie(
                                    item.plannedDate,
                                    item.plannedEndDate,
                                    day
                                ).allDayLike
                        );
                        const timedEvents = eventsOnDay(day).filter(
                            (ev) =>
                                !(
                                    ev.allDay ||
                                    blokPositie(ev.startAt, ev.endAt, day)
                                        .allDayLike
                                )
                        );

                        return (
                            <div
                                key={`col-${iso}`}
                                className={`
                                    relative border-l border-slate-100
                                    ${isToday ? "bg-[#fff5fa]/40" : "bg-white"}
                                    ${
                                        pendingSchedule || onCreateAgenda
                                            ? "cursor-pointer"
                                            : ""
                                    }
                                `}
                                style={{ height: DAG_HOOGTE }}
                                onClick={(e) => {
                                    const target = e.target as HTMLElement;
                                    if (
                                        target.closest("[data-planning-job]") ||
                                        target.closest(
                                            "[data-planning-agenda]"
                                        ) ||
                                        target.closest("a") ||
                                        target.closest("button")
                                    ) {
                                        return;
                                    }
                                    const hour = hourFromClientY(
                                        e.clientY,
                                        e.currentTarget
                                    );
                                    if (
                                        pendingSchedule &&
                                        onSchedulePending &&
                                        users[0]
                                    ) {
                                        // Eerste monteur als default; banner vraagt om meerdere klikken
                                        onSchedulePending({
                                            dateIso: iso,
                                            hour,
                                            engineerId: users[0].id,
                                        });
                                        return;
                                    }
                                    onCreateAgenda?.({
                                        dateIso: iso,
                                        hour,
                                    });
                                }}
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
                                        ? (e) => {
                                              e.preventDefault();
                                              const workorderId =
                                                  e.dataTransfer.getData(
                                                      "workorderId"
                                                  );
                                              if (!workorderId) return;
                                              const item = items.find(
                                                  (i) => i.id === workorderId
                                              );
                                              const engineerId =
                                                  item?.assignedUser?.id ||
                                                  users[0]?.id;
                                              if (!engineerId) return;
                                              const hour = hourFromClientY(
                                                  e.clientY,
                                                  e.currentTarget
                                              );
                                              onMovePlan({
                                                  workorderId,
                                                  dateIso: iso,
                                                  hour,
                                                  engineerId,
                                              });
                                          }
                                        : undefined
                                }
                            >
                                {uurLijnen.map((uur) => {
                                    if (uur === DAG_EIND_UUR) return null;
                                    const top =
                                        (uur - DAG_START_UUR) * PX_PER_UUR +
                                        DAG_PADDING_TOP;
                                    return (
                                        <div
                                            key={uur}
                                            className="absolute left-0 right-0 border-t border-slate-100 pointer-events-none"
                                            style={{ top: `${top}px` }}
                                        />
                                    );
                                })}

                                {timedJobs.map((item, index) => {
                                    const pos = blokPositie(
                                        item.plannedDate,
                                        item.plannedEndDate,
                                        day
                                    );
                                    const color = jobColor(item);
                                    const monteur = shortMonteur(
                                        item.assignedUser?.name
                                    );
                                    const label =
                                        item.number ||
                                        item.project?.name ||
                                        item.title;
                                    const klant =
                                        item.customer?.name ??
                                        item.project?.customer?.name ??
                                        "";

                                    // Lichte horizontale offset bij overlap
                                    const offset = (index % 3) * 4;

                                    return (
                                        <div
                                            key={item.id}
                                            draggable={!!onMovePlan}
                                            data-planning-job
                                            onDragStart={
                                                onMovePlan
                                                    ? (e) => {
                                                          e.dataTransfer.setData(
                                                              "workorderId",
                                                              item.id
                                                          );
                                                          e.dataTransfer.effectAllowed =
                                                              "move";
                                                      }
                                                    : undefined
                                            }
                                            className={`
                                                absolute rounded-lg px-1.5 py-1 overflow-hidden
                                                text-white shadow-sm ring-1 ring-black/10
                                                hover:brightness-110 hover:shadow-md transition z-[5]
                                                ${
                                                    onMovePlan
                                                        ? "cursor-grab active:cursor-grabbing"
                                                        : ""
                                                }
                                            `}
                                            style={{
                                                backgroundColor: color,
                                                top: `${pos.top}px`,
                                                height: `${pos.height}px`,
                                                left: `${4 + offset}px`,
                                                right: `${4 + (2 - (index % 3)) * 2}px`,
                                            }}
                                        >
                                            <Link
                                                href={`/workorders/${item.id}`}
                                                draggable={false}
                                                className="block h-full"
                                                onClick={(e) => {
                                                    if (e.defaultPrevented) {
                                                        e.preventDefault();
                                                    }
                                                }}
                                            >
                                                <div className="flex items-start justify-between gap-0.5">
                                                    <span className="text-[10px] font-bold tabular-nums leading-none opacity-95 truncate">
                                                        {formatUurLabel(
                                                            pos.beginUur
                                                        )}
                                                        –
                                                        {formatUurLabel(
                                                            pos.eindUur
                                                        )}
                                                    </span>
                                                    {showStatusIcons ? (
                                                        <PlanningStatusIcon
                                                            status={item.status}
                                                            className="h-3 w-3 shrink-0"
                                                        />
                                                    ) : null}
                                                </div>
                                                <span className="text-[11px] font-semibold block truncate leading-tight mt-0.5">
                                                    {label}
                                                </span>
                                                {klant ? (
                                                    <span className="text-[10px] block truncate opacity-90">
                                                        {klant}
                                                    </span>
                                                ) : null}
                                                <span className="text-[10px] block truncate opacity-90">
                                                    ({monteur})
                                                </span>
                                            </Link>
                                        </div>
                                    );
                                })}

                                {timedEvents.map((ev) => {
                                    const pos = blokPositie(
                                        ev.startAt,
                                        ev.endAt,
                                        day
                                    );
                                    return (
                                        <button
                                            key={ev.id}
                                            type="button"
                                            data-planning-agenda
                                            onClick={() =>
                                                onEditAgenda?.(ev)
                                            }
                                            className="
                                                absolute text-left rounded-lg px-1.5 py-1
                                                overflow-hidden bg-amber-500 text-white
                                                shadow-sm ring-1 ring-amber-700/20
                                                hover:brightness-110 z-[5]
                                            "
                                            style={{
                                                top: `${pos.top}px`,
                                                height: `${pos.height}px`,
                                                left: "4px",
                                                right: "4px",
                                            }}
                                            title={ev.title}
                                        >
                                            <span className="text-[10px] font-bold tabular-nums block truncate">
                                                {formatUurLabel(pos.beginUur)}
                                                {ev.recurrenceFreq &&
                                                ev.recurrenceFreq !== "none"
                                                    ? " ↻"
                                                    : ""}
                                            </span>
                                            <strong className="text-[11px] block truncate">
                                                {ev.title}
                                            </strong>
                                        </button>
                                    );
                                })}

                                {/* Pending: monteur-chips onderaan kolom */}
                                {pendingSchedule &&
                                    onSchedulePending &&
                                    users.length > 0 && (
                                        <div className="absolute bottom-1 left-1 right-1 flex flex-wrap gap-0.5 z-10">
                                            {users.map((u) => (
                                                <button
                                                    key={u.id}
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onSchedulePending({
                                                            dateIso: iso,
                                                            engineerId: u.id,
                                                        });
                                                    }}
                                                    className="
                                                        text-[9px] font-semibold px-1.5 py-0.5
                                                        rounded bg-[#0066FF] text-white
                                                        hover:bg-[#0052cc] truncate max-w-full
                                                    "
                                                    title={`Inplannen: ${u.name || "Monteur"}`}
                                                >
                                                    {shortMonteur(u.name)}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {users.length > 0 ? (
                <div className="flex flex-wrap gap-3 px-4 py-2.5 border-t border-slate-100 bg-slate-50/60">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 self-center">
                        Monteurs
                    </span>
                    {users.map((u) => (
                        <span
                            key={u.id}
                            className="inline-flex items-center gap-1.5 text-xs text-slate-700"
                        >
                            <span
                                className="h-2.5 w-2.5 rounded-full shrink-0"
                                style={{
                                    backgroundColor: engineerColor(u.id),
                                }}
                            />
                            {u.name || "Monteur"}
                        </span>
                    ))}
                    <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 ml-auto">
                        <Check className="h-3 w-3 text-emerald-600" />
                        = alle monteurs die dag ingepland
                    </span>
                </div>
            ) : null}
        </section>
    );
}
