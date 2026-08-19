"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";
import Link from "next/link";

import { PlanningStatusIcon } from "./PlanningStatusIcon";
import {
    STAFF_KIND_LABELS,
    parseStaffKind,
    type StaffKind,
} from "@/constants/staffKind";

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

function monteurNameLines(name: string | null | undefined): {
    voornaam: string;
    achternaam: string | null;
} {
    const parts = (name || "").trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
        return { voornaam: "Monteur", achternaam: null };
    }
    if (parts.length === 1) {
        return { voornaam: parts[0], achternaam: null };
    }
    return {
        voornaam: parts[0],
        achternaam: parts.slice(1).join(" "),
    };
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
    // Alle monteurs (zodat ook lege monteurs een rij krijgen)
    engineers?: { id: string; name: string | null; staffKind?: string }[];
    // Maandag van de te tonen week; standaard deze week
    weekStart?: Date;
    /** Dag om te markeren/scrollen (sidebar mini-maand ?date=) */
    focusDateIso?: string | null;
    weekNavigation?: WeekNavigation;
    view?: "week" | "month";
    onViewChange?: (view: "week" | "month") => void;
    /** Sleep een klus naar een andere dag/tijd/monteur */
    onMovePlan?: (args: {
        workorderId: string;
        dateIso: string;
        hour: number;
        engineerId: string;
        /** Kolom waarvandaan gesleept (bij multi-monteur: alleen díe slot vervangen) */
        fromEngineerId?: string;
    }) => void;
    /** Sleep boven-/onderkant van een klus om duur te wijzigen */
    onResizePlan?: (args: {
        workorderId: string;
        beginHour: number;
        endHour: number;
    }) => void;
    /** Sleep boven-/onderkant van een agenda-item om duur te wijzigen */
    onResizeAgenda?: (args: {
        eventId: string;
        beginHour: number;
        endHour: number;
    }) => void;
    /** Sleep een agenda-item naar een andere dag/tijd/monteur (null = Algemeen) */
    onMoveAgenda?: (args: {
        eventId: string;
        dateIso: string;
        hour?: number;
        engineerId: string | null;
    }) => void;
    /** Pending klus om in te plannen (banner + klik op slot) */
    pendingSchedule?: { workorderId: string; label: string } | null;
    onSchedulePending?: (args: {
        dateIso: string;
        /** Indien gezet (klik op tijdlijn): starttijd. Anders starttijd uit het voorstel. */
        hour?: number;
        engineerId: string;
    }) => void;
    /** Statusiconen (klok/mail/vink/€) — alleen voor kantoor/admin. */
    showStatusIcons?: boolean;
    /** Klik op leeg dag/tijd-vak → agenda-dialoog (office) */
    onCreateAgenda?: (args: {
        dateIso: string;
        hour?: number;
        engineerId?: string | null;
    }) => void;
    /** Enkele klik op opdracht/agenda → actiemenu (open/wijzig/verwijder) */
    onActivityMenu?: (args: {
        target:
            | { kind: "agenda"; event: any }
            | { kind: "workorder"; workorder: any };
        x: number;
        y: number;
    }) => void;
    /** IDs van opdrachten in een planningsconflict */
    conflictWorkorderIds?: string[];
    /** IDs van agenda-items in een planningsconflict */
    conflictEventIds?: string[];
}

function toIsoDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

/** Voorkom dat het OS-sleepbeeld de drop-preview bedekt. */
function hideNativeDragGhost(e: DragEvent) {
    const ghost = document.createElement("div");
    ghost.setAttribute("aria-hidden", "true");
    ghost.style.cssText =
        "position:fixed;left:0;top:0;width:1px;height:1px;opacity:0;pointer-events:none";
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
    window.setTimeout(() => ghost.remove(), 0);
}

export default function WeekView({
    items,
    leave = [],
    events = [],
    engineers = [],
    weekStart,
    focusDateIso = null,
    weekNavigation,
    view = "week",
    onViewChange,
    onMovePlan,
    onResizePlan,
    onResizeAgenda,
    onMoveAgenda,
    pendingSchedule = null,
    onSchedulePending,
    showStatusIcons = true,
    onCreateAgenda,
    onActivityMenu,
    conflictWorkorderIds = [],
    conflictEventIds = [],
}: WeekViewProps) {
    const conflictWoSet = new Set(conflictWorkorderIds);
    const conflictEvSet = new Set(conflictEventIds);
    const [dragPreview, setDragPreview] = useState<{
        cellKey: string;
        hour: number;
        durationHours: number;
    } | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragItem, setDragItem] = useState<{
        kind: "workorder" | "agenda";
        id: string;
        durationHours: number;
        color: string;
        title: string;
        subtitle?: string | null;
    } | null>(null);
    const dragMetaRef = useRef<{
        durationHours: number;
    } | null>(null);
    const [resizeOverride, setResizeOverride] = useState<{
        kind: "workorder" | "agenda";
        id: string;
        beginUur: number;
        eindUur: number;
    } | null>(null);
    const resizeOverrideRef = useRef(resizeOverride);
    resizeOverrideRef.current = resizeOverride;
    const resizingRef = useRef<{
        kind: "workorder" | "agenda";
        id: string;
        edge: "start" | "end";
        cellKey: string;
        beginUur: number;
        eindUur: number;
    } | null>(null);
    /** Na resize: blokkeer nagekomen click die dialoog/navigatie opent */
    const suppressClickUntilRef = useRef(0);
    const headerScrollRef = useRef<HTMLDivElement>(null);
    const bodyScrollRef = useRef<HTMLDivElement>(null);
    const syncingScroll = useRef(false);

    function syncHorizontalScroll(source: "header" | "body") {
        if (syncingScroll.current) return;
        const from =
            source === "header"
                ? headerScrollRef.current
                : bodyScrollRef.current;
        const to =
            source === "header"
                ? bodyScrollRef.current
                : headerScrollRef.current;
        if (!from || !to) return;
        syncingScroll.current = true;
        to.scrollLeft = from.scrollLeft;
        syncingScroll.current = false;
    }

    useEffect(() => {
        function clearPreview() {
            setDragPreview(null);
            setIsDragging(false);
            setDragItem(null);
            dragMetaRef.current = null;
        }
        window.addEventListener("dragend", clearPreview);
        return () => window.removeEventListener("dragend", clearPreview);
    }, []);

    useEffect(() => {
        function onPointerMove(e: PointerEvent) {
            const active = resizingRef.current;
            if (!active) return;
            const cell = document.querySelector(
                `[data-planning-cell="${active.cellKey}"]`
            );
            if (!(cell instanceof HTMLElement)) return;
            const hour = hourFromClientY(e.clientY, cell);
            if (active.edge === "start") {
                const beginUur = Math.min(
                    hour,
                    active.eindUur - 0.25
                );
                setResizeOverride({
                    kind: active.kind,
                    id: active.id,
                    beginUur,
                    eindUur: active.eindUur,
                });
            } else {
                const eindUur = Math.max(
                    hour,
                    active.beginUur + 0.25
                );
                setResizeOverride({
                    kind: active.kind,
                    id: active.id,
                    beginUur: active.beginUur,
                    eindUur: Math.min(DAG_EIND_UUR, eindUur),
                });
            }
        }

        function onPointerUp() {
            const active = resizingRef.current;
            const override = resizeOverrideRef.current;
            resizingRef.current = null;
            if (active && override) {
                const changed =
                    override.beginUur !== active.beginUur ||
                    override.eindUur !== active.eindUur;
                if (changed) {
                    suppressClickUntilRef.current = Date.now() + 500;
                    const blockClick = (e: MouseEvent) => {
                        if (Date.now() < suppressClickUntilRef.current) {
                            e.preventDefault();
                            e.stopPropagation();
                        }
                    };
                    window.addEventListener("click", blockClick, true);
                    window.setTimeout(() => {
                        window.removeEventListener(
                            "click",
                            blockClick,
                            true
                        );
                    }, 500);

                    if (
                        active.kind === "workorder" &&
                        onResizePlan
                    ) {
                        onResizePlan({
                            workorderId: active.id,
                            beginHour: override.beginUur,
                            endHour: override.eindUur,
                        });
                    } else if (
                        active.kind === "agenda" &&
                        onResizeAgenda
                    ) {
                        onResizeAgenda({
                            eventId: active.id,
                            beginHour: override.beginUur,
                            endHour: override.eindUur,
                        });
                    }
                }
            }
            setResizeOverride(null);
            setIsDragging(false);
        }

        window.addEventListener("pointermove", onPointerMove);
        window.addEventListener("pointerup", onPointerUp);
        window.addEventListener("pointercancel", onPointerUp);
        return () => {
            window.removeEventListener("pointermove", onPointerMove);
            window.removeEventListener("pointerup", onPointerUp);
            window.removeEventListener("pointercancel", onPointerUp);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [onResizePlan, onResizeAgenda]);

    useEffect(() => {
        function scrollToDay(iso: string, attempt = 0) {
            if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return;
            const el = document.querySelector(`[data-planning-day="${iso}"]`);
            if (el instanceof HTMLElement) {
                el.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                });
                return;
            }
            // Na weekwissel staat de rij soms nog niet in de DOM
            if (attempt < 20) {
                window.setTimeout(
                    () => scrollToDay(iso, attempt + 1),
                    50
                );
            }
        }

        function onFocusDay(e: Event) {
            const iso = (e as CustomEvent<string>).detail;
            scrollToDay(iso, 0);
        }

        window.addEventListener("planning-focus-day", onFocusDay);

        if (focusDateIso) {
            const t = window.setTimeout(
                () => scrollToDay(focusDateIso, 0),
                50
            );
            return () => {
                window.clearTimeout(t);
                window.removeEventListener("planning-focus-day", onFocusDay);
            };
        }

        return () => {
            window.removeEventListener("planning-focus-day", onFocusDay);
        };
    }, [focusDateIso, weekStart]);

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
            return date;
    });

    function isoDate(d: Date): string {
        return toIsoDate(d);
    }

    // De dag loopt van 07:00 tot 18:00. Elk uur is PX_PER_UUR hoog.
    const DAG_START_UUR = 7;
    const DAG_EIND_UUR = 18;
    const PX_PER_UUR = 26;
    const DAG_PADDING_TOP = 10;
    const DAG_HOOGTE =
        (DAG_EIND_UUR - DAG_START_UUR) * PX_PER_UUR + DAG_PADDING_TOP;

    const uurLijnen = Array.from(
        { length: DAG_EIND_UUR - DAG_START_UUR + 1 },
        (_, i) => DAG_START_UUR + i
    );

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

    /**
     * Meerdaagse klus: elke dag dezelfde dagelijkse van-/tot-tijd
     * (starttijd uit plannedDate, eindtijd uit plannedEndDate).
     * Zo begint dag 2 niet stiekem om 08:00.
     */
    function blokUren(
        item: any,
        day: Date
    ): { beginUur: number; eindUur: number } {
        const cellIso = isoDate(day);
        const start = item.plannedDate ? new Date(item.plannedDate) : null;
        const eind = item.plannedEndDate
            ? new Date(item.plannedEndDate)
            : null;

        if (!start) {
            return { beginUur: DAG_START_UUR, eindUur: DAG_EIND_UUR };
        }

        const startIso = isoDate(start);
        const endIso = eind ? isoDate(eind) : startIso;
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

            return { beginUur, eindUur };
        }

        // Één dag
        const startIsDezeDag = startIso === cellIso;
        let beginUur = DAG_START_UUR;
        let eindUur = DAG_EIND_UUR;

        if (startIsDezeDag && heeftKloktijd(start)) {
            beginUur = uurVan(start);
        }

        if (eind && isoDate(eind) === cellIso && heeftKloktijd(eind)) {
            eindUur = uurVan(eind);
        } else if (startIsDezeDag && !eind && heeftKloktijd(start)) {
            eindUur = Math.min(DAG_EIND_UUR, uurVan(start) + 2);
        }

        if (eindUur <= beginUur) {
            eindUur = Math.min(DAG_EIND_UUR, beginUur + 1);
        }

        return { beginUur, eindUur };
    }

    function blokPositie(
        item: any,
        day: Date
    ): { top: number; height: number; beginUur: number; eindUur: number } {
        const { beginUur, eindUur } = blokUren(item, day);

        const top =
            (beginUur - DAG_START_UUR) * PX_PER_UUR + DAG_PADDING_TOP;

        const height = Math.max(40, (eindUur - beginUur) * PX_PER_UUR);

        return { top, height, beginUur, eindUur };
    }

    function hourFromClientY(
        clientY: number,
        cellEl: HTMLElement
    ): number {
        const rect = cellEl.getBoundingClientRect();
        const y = clientY - rect.top - DAG_PADDING_TOP;
        const raw = DAG_START_UUR + y / PX_PER_UUR;
        const snapped = Math.round(raw * 4) / 4;
        return Math.min(
            DAG_EIND_UUR - 0.25,
            Math.max(DAG_START_UUR, snapped)
        );
    }

    function leaveOn(userId: string, day: Date) {
        const iso = isoDate(day);

        return leave.find((l) => {
            if (l.userId !== userId) {
                return false;
            }

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

            if (!isPrimary && !isExtra) {
                return false;
            }

            if (!item.plannedDate) {
                return false;
            }

            const cellIso = isoDate(day);
            const startIso = isoDate(new Date(item.plannedDate));
            const endIso = item.plannedEndDate
                ? isoDate(new Date(item.plannedEndDate))
                : startIso;

            return startIso <= cellIso && cellIso <= endIso;
        });
    }

    function weekJobCount(userId: string): number {
        return days.reduce(
            (sum, day) => sum + itemsForUserDay(userId, day).length,
            0
        );
    }

    const users = (() => {
        const list =
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
                  ) as {
                      id: string;
                      name: string | null;
                      staffKind?: string;
        }[]);

        const byName = (
            a: { name: string | null },
            b: { name: string | null }
        ) =>
            (a.name || "").localeCompare(b.name || "", "nl", {
                sensitivity: "base",
            });

        const eigen = list
            .filter((u) => parseStaffKind(u.staffKind) === "monteur")
            .sort(byName);
        const extern = list
            .filter((u) => parseStaffKind(u.staffKind) !== "monteur")
            .sort(byName);

        return [...eigen, ...extern];
    })();

    function eventOnDay(ev: any, day: Date): boolean {
        if (!ev?.startAt) return false;
        const cellIso = isoDate(day);
        const startIso = isoDate(new Date(ev.startAt));
        const endIso = ev.endAt
            ? isoDate(new Date(ev.endAt))
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

    function eventAsBlock(ev: any) {
        return {
            plannedDate: ev.startAt,
            plannedEndDate: ev.endAt ?? (ev.allDay ? ev.startAt : null),
        };
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

    const gridCols =
        `120px repeat(${Math.max(users.length, 1)}, minmax(110px, 1fr))`;

    const minGridWidth =
        120 + Math.max(users.length, 1) * 110;

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

            {users.length === 0 ? (
                <p className="text-slate-500 p-6">
                    Geen opdrachten met monteur ingepland deze week.
                </p>
            ) : (
                <div className="p-3 sm:p-4">
                    {/* Sticky namen t.o.v. main-scroll; overflow-x alleen op kind */}
                    <div
                        className={`
                            sticky top-0 z-30
                            -mx-3 sm:-mx-4 px-3 sm:px-4
                            bg-white border-b border-slate-200 shadow-sm
                            ${isDragging ? "pointer-events-none" : ""}
                        `}
                        data-planning-sticky-header
                    >
                        <div
                            ref={headerScrollRef}
                            className="
                                overflow-x-auto
                                [scrollbar-width:none]
                                [-ms-overflow-style:none]
                                [&::-webkit-scrollbar]:hidden
                            "
                            onScroll={() => syncHorizontalScroll("header")}
                        >
                            <div
                                className="grid gap-2 px-1 pb-2 pt-1"
                                style={{
                                    gridTemplateColumns: gridCols,
                                    minWidth: `${minGridWidth}px`,
                                }}
                            >
                                <div className="flex items-center justify-center px-2 pb-1 text-center">
                                    <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                        Dag
                                    </span>
                                </div>

                                {users.map((user) => {
                                    const jobs = weekJobCount(user.id);
                                    const { voornaam, achternaam } =
                                        monteurNameLines(user.name);
                                    const kind = parseStaffKind(
                                        (user as { staffKind?: string })
                                            .staffKind
                                    );
                                    const kindLabel =
                                        kind === "monteur"
                                            ? null
                                            : STAFF_KIND_LABELS[
                                                  kind as StaffKind
                                              ];

                                    return (
                                        <div
                                            key={user.id}
                                            className="px-1.5 py-1 min-w-0 text-center"
                                        >
                                            <p className="text-sm font-semibold text-slate-800 leading-snug">
                                                {voornaam}
                                                {achternaam ? (
                                                    <>
                                                        <br />
                                                        {achternaam}
                                                    </>
                                                ) : null}
                                            </p>
                                            {kindLabel ? (
                                                <p className="text-[10px] font-semibold text-amber-700 mt-0.5">
                                                    {kind === "inlener"
                                                        ? "Inlener"
                                                        : "Stagiair"}
                                                </p>
                                            ) : null}
                                            <p className="text-[11px] text-slate-400 mt-0.5">
                                                {jobs === 0
                                                    ? "Niets gepland"
                                                    : `${jobs}× deze week`}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Dagen: horizontaal scrollen synchroon met kop */}
                    <div
                        ref={bodyScrollRef}
                        className="overflow-x-auto mt-2"
                        onScroll={() => syncHorizontalScroll("body")}
                    >
                        <div
                            className="space-y-2"
                            style={{ minWidth: `${minGridWidth}px` }}
                        >
                            {days.map((day) => {
                                const iso = isoDate(day);
                                const isToday = iso === todayIso;
                                const isFocused =
                                    !!focusDateIso && iso === focusDateIso;
                                const weekday = day.toLocaleDateString(
                                    "nl-NL",
                                    { weekday: "short" }
                                );
                                const dayNum = day.getDate();
                                const jobsDay = dayJobCount(day);

                                return (
                                    <div
                                        key={day.toISOString()}
                                        data-planning-day={iso}
                                        className={`
                                            grid gap-2 rounded-2xl border p-2 transition
                                            scroll-mt-24
                                            ${
                                                isFocused
                                                    ? "border-[#0066FF] bg-[#e8f0ff]/70 ring-2 ring-[#0066FF]/25"
                                                    : isToday
                                                      ? "border-[#d6007e]/25 bg-slate-50/40"
                                                      : "border-slate-100 bg-slate-50/40 hover:border-slate-200 hover:bg-white"
                                            }
                                        `}
                                        style={{
                                            gridTemplateColumns: gridCols,
                                        }}
                                    >
                                        <div
                                            className="flex flex-col gap-1 min-w-0"
                                            onDragOver={
                                                onMoveAgenda
                                                    ? (e) => {
                                                          e.preventDefault();
                                                          e.dataTransfer.dropEffect =
                                                              "move";
                                                      }
                                                    : undefined
                                            }
                                            onDrop={
                                                onMoveAgenda
                                                    ? (e) => {
                                                          e.preventDefault();
                                                          const eventId =
                                                              e.dataTransfer.getData(
                                                                  "agendaEventId"
                                                              );
                                                          if (!eventId)
                                                              return;
                                                          onMoveAgenda({
                                                              eventId,
                                                              dateIso: iso,
                                                              engineerId: null,
                                                          });
                                                      }
                                                    : undefined
                                            }
                                        >
                                        <Link
                                            href={
                                                pendingSchedule
                                                ? "#"
                                                : `/workorders/new?date=${iso}`
                                            }
                                            onClick={(e)=>{
                                                if(pendingSchedule){
                                                    e.preventDefault();
                                                    return;
                                                }
                                                if(onCreateAgenda){
                                                    e.preventDefault();
                                                    onCreateAgenda({ dateIso: iso });
                                                }
                                            }}
                                            title={
                                                pendingSchedule
                                                ? "Kies een monteurkolom hiernaast om in te plannen"
                                                : onCreateAgenda
                                                ? "Agenda-item of opdracht op deze dag"
                                                : "Opdracht inplannen op deze dag"
                                            }
                                            className={`
                                                group flex flex-col items-center justify-center
                                                rounded-xl px-2 py-2.5 transition min-h-[4rem]
                                                ${
                                                    isToday
                                                        ? "bg-[#d6007e] text-white shadow-sm shadow-[#d6007e]/25"
                                                        : "bg-[#e8f0ff]/70 text-slate-700 hover:bg-[#e8f0ff]"
                                                }
                                                ${
                                                    pendingSchedule
                                                        ? "opacity-80 cursor-default"
                                                        : ""
                                                }
                                            `}
                                        >
                                            <span
                                                className={`text-[11px] font-medium uppercase tracking-wide ${
                                                    isToday
                                                        ? "text-white/80"
                                                        : "text-[#0066FF]/70"
                                                }`}
                                            >
                                                {weekday}
                                            </span>
                                            <span className="text-lg font-bold leading-none mt-0.5 tabular-nums">
                                                {dayNum}
                                            </span>
                                            <span
                                                className={`text-[10px] mt-1 ${
                                                    isToday
                                                        ? "text-white/75"
                                                        : "text-slate-400"
                                                }`}
                                            >
                                                {jobsDay === 0
                                                    ? "Geen klussen"
                                                    : `${jobsDay} klus${jobsDay === 1 ? "" : "sen"}`}
                                            </span>
                            </Link>

                                        {unassignedEventsOnDay(day).map((ev) => (
                                            <button
                                                key={ev.id}
                                                type="button"
                                                data-planning-agenda
                                                draggable={!!onMoveAgenda}
                                                onDragStart={
                                                    onMoveAgenda
                                                        ? (e) => {
                                                              setIsDragging(true);
                                                              e.dataTransfer.setData(
                                                                  "agendaEventId",
                                                                  ev.id
                                                              );
                                                              e.dataTransfer.setData(
                                                                  "text/plain",
                                                                  `agenda:${ev.id}`
                                                              );
                                                              e.dataTransfer.effectAllowed =
                                                                  "move";
                                                          }
                                                        : undefined
                                                }
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onActivityMenu?.({
                                                        target: {
                                                            kind: "agenda",
                                                            event: ev,
                                                        },
                                                        x: e.clientX,
                                                        y: e.clientY,
                                                    });
                                                }}
                                                className={`
                                                    w-full text-left rounded-lg px-1.5 py-1
                                                    bg-[#FFCC00] border-2 border-[#e6b800]
                                                    text-slate-900 text-[10px] font-bold
                                                    shadow-sm ring-1 ring-black/10
                                                    hover:brightness-95 transition
                                                    whitespace-normal break-words leading-snug
                                                    ${
                                                        onMoveAgenda
                                                            ? "cursor-grab active:cursor-grabbing"
                                                            : "cursor-pointer"
                                                    }
                                                `}
                                            >
                                                {ev.title}
                                                {ev.recurrenceFreq &&
                                                ev.recurrenceFreq !== "none"
                                                    ? " ↻"
                                                    : ""}
                                                {ev.notes ? (
                                                    <span className="block font-medium opacity-90 mt-0.5">
                                                        {ev.notes}
                                                    </span>
                                                ) : null}
                                            </button>
                                        ))}
                </div>

                                        {users.map((user) => {
                                            const verlof = leaveOn(
                                                user.id,
                                                day
                                            );
                                            const dayItems =
                                                itemsForUserDay(
                                                    user.id,
                                                    day
                                                );
                                            const dayEvents =
                                                eventsForUserDay(
                                                    user.id,
                                                    day
                                                );

                                            return (
                                                <div
                            key={user.id}
                                                    className="flex flex-col gap-1.5 min-w-0"
                                                >
                                                    <div
                                                        data-planning-cell={`${iso}:${user.id}`}
                                                        className={`
                                                            relative rounded-xl overflow-visible
                                                            border transition
                                                            ${
                                                                isToday
                                                                    ? "border-[#d6007e]/35 bg-[#fff5fa]"
                                                                    : "border-slate-200/80 bg-white"
                                                            }
                                                            ${
                                                                verlof
                                                                    ? "border-orange-200"
                                                                    : ""
                                                            }
                                                            ${
                                                                pendingSchedule
                                                                && onSchedulePending
                                                                && !verlof
                                                                    ? "cursor-pointer ring-1 ring-[#0066FF]/20 hover:ring-[#0066FF]/45"
                                                                    : onCreateAgenda && !verlof
                                                                    ? "cursor-pointer"
                                                                    : ""
                                                            }
                                                        `}
                            style={{
                                                            minHeight: `${DAG_HOOGTE}px`,
                                                        }}
                                                        onClick={
                                                            pendingSchedule
                                                            && onSchedulePending
                                                            && !verlof
                                                                ? (e) => {
                                                                      const target =
                                                                          e.target as HTMLElement;
                                                                      if (
                                                                          target.closest(
                                                                              "[data-planning-job]"
                                                                          )
                                                                          || target.closest(
                                                                              "[data-planning-agenda]"
                                                                          )
                                                                          || target.closest(
                                                                              "a"
                                                                          )
                                                                          || target.closest(
                                                                              "button"
                                                                          )
                                                                      ) {
                                                                          return;
                                                                      }
                                                                      const hour =
                                                                          hourFromClientY(
                                                                              e.clientY,
                                                                              e.currentTarget
                                                                          );
                                                                      onSchedulePending(
                                                                          {
                                                                              dateIso:
                                                                                  iso,
                                                                              hour,
                                                                              engineerId:
                                                                                  user.id,
                                                                          }
                                                                      );
                                                                  }
                                                                : onCreateAgenda && !verlof
                                                                ? (e) => {
                                                                      const target =
                                                                          e.target as HTMLElement;
                                                                      if (
                                                                          target.closest(
                                                                              "[data-planning-job]"
                                                                          )
                                                                          || target.closest(
                                                                              "[data-planning-agenda]"
                                                                          )
                                                                          || target.closest(
                                                                              "a"
                                                                          )
                                                                          || target.closest(
                                                                              "button"
                                                                          )
                                                                      ) {
                                                                          return;
                                                                      }
                                                                      const hour =
                                                                          hourFromClientY(
                                                                              e.clientY,
                                                                              e.currentTarget
                                                                          );
                                                                      onCreateAgenda({
                                                                          dateIso: iso,
                                                                          hour,
                                                                          engineerId: user.id,
                                                                      });
                                                                  }
                                                                : undefined
                                                        }
                                                        onDragOver={
                                                            (onMovePlan ||
                                                                onMoveAgenda) &&
                                                            !verlof
                                                                ? (e) => {
                                                                      e.preventDefault();
                                                                      e.dataTransfer.dropEffect =
                                                                          "move";
                                                                      const hour =
                                                                          hourFromClientY(
                                                                              e.clientY,
                                                                              e.currentTarget
                                                                          );
                                                                      const cellKey = `${iso}:${user.id}`;
                                                                      const durationHours =
                                                                          dragMetaRef
                                                                              .current
                                                                              ?.durationHours ??
                                                                          1;
                                                                      setDragPreview(
                                                                          (
                                                                              prev
                                                                          ) =>
                                                                              prev &&
                                                                              prev.cellKey ===
                                                                                  cellKey &&
                                                                              prev.hour ===
                                                                                  hour &&
                                                                              prev.durationHours ===
                                                                                  durationHours
                                                                                  ? prev
                                                                                  : {
                                                                                        cellKey,
                                                                                        hour,
                                                                                        durationHours,
                                                                                    }
                                                                      );
                                                                  }
                                                                : undefined
                                                        }
                                                        onDragLeave={
                                                            (onMovePlan ||
                                                                onMoveAgenda) &&
                                                            !verlof
                                                                ? (e) => {
                                                                      const related =
                                                                          e.relatedTarget as Node | null;
                                                                      if (
                                                                          related &&
                                                                          e.currentTarget.contains(
                                                                              related
                                                                          )
                                                                      ) {
                                                                          return;
                                                                      }
                                                                      setDragPreview(
                                                                          (
                                                                              prev
                                                                          ) =>
                                                                              prev?.cellKey ===
                                                                              `${iso}:${user.id}`
                                                                                  ? null
                                                                                  : prev
                                                                      );
                                                                  }
                                                                : undefined
                                                        }
                                                        onDrop={
                                                            (onMovePlan ||
                                                                onMoveAgenda) &&
                                                            !verlof
                                                                ? (e) => {
                                                                      e.preventDefault();
                                                                      setDragPreview(
                                                                          null
                                                                      );
                                                                      const hour =
                                                                          hourFromClientY(
                                                                              e.clientY,
                                                                              e.currentTarget
                                                                          );
                                                                      const agendaEventId =
                                                                          e.dataTransfer.getData(
                                                                              "agendaEventId"
                                                                          );
                                                                      if (
                                                                          agendaEventId &&
                                                                          onMoveAgenda
                                                                      ) {
                                                                          onMoveAgenda(
                                                                              {
                                                                                  eventId:
                                                                                      agendaEventId,
                                                                                  dateIso:
                                                                                      iso,
                                                                                  hour,
                                                                                  engineerId:
                                                                                      user.id,
                                                                              }
                                                                          );
                                                                          return;
                                                                      }
                                                                      const workorderId =
                                                                          e.dataTransfer.getData(
                                                                              "workorderId"
                                                                          );
                                                                      if (
                                                                          !workorderId ||
                                                                          !onMovePlan
                                                                      ) {
                                                                          return;
                                                                      }
                                                                      const fromEngineerId =
                                                                          e.dataTransfer.getData(
                                                                              "fromEngineerId"
                                                                          ) ||
                                                                          undefined;
                                                                      onMovePlan(
                                                                          {
                                                                              workorderId,
                                                                              dateIso:
                                                                                  iso,
                                                                              hour,
                                                                              engineerId:
                                                                                  user.id,
                                                                              fromEngineerId,
                                                                          }
                                                                      );
                                                                  }
                                                                : undefined
                                                        }
                                                    >
                                                        {!verlof &&
                                                            uurLijnen.map(
                                                                (uur) => {
                                                                    if (
                                                                        uur ===
                                                                        DAG_EIND_UUR
                                                                    ) {
                                                    return null;
                                                }
                                                                    const top =
                                                                        (uur -
                                                                            DAG_START_UUR) *
                                                                            PX_PER_UUR +
                                                                        DAG_PADDING_TOP;
                                                return (
                                                                        <div
                                                                            key={
                                                                                uur
                                                                            }
                                                                            className="absolute left-0 right-0 border-t border-dashed border-slate-100 pointer-events-none"
                                                                            style={{
                                                                                top: `${top}px`,
                                                                            }}
                                                                        >
                                                                            <span className="absolute left-1 -top-2 text-[9px] text-slate-300 tabular-nums select-none">
                                                                                {String(
                                                                                    uur
                                                                                ).padStart(
                                                                                    2,
                                                                                    "0"
                                                                                )}
                                                                            </span>
                                                    </div>
                                                );
                                                                }
                                                            )}

                                                        {verlof ? (
                                                            <div
                                                                className="
                                                                    absolute inset-1
                                                                    bg-gradient-to-b from-orange-50 to-orange-100/80
                                                                    text-orange-800 text-xs
                                                                    rounded-lg px-2
                                                                    text-center font-medium
                                                                    flex flex-col items-center justify-center gap-0.5
                                                                    z-10
                                                                "
                                                            >
                                                                <span className="text-base leading-none">
                                                                    🌴
                                                                </span>
                                                                <span>
                                                                    {verlof.type ||
                                                                        "Verlof"}
                                                                </span>
                                                            </div>
                                                        ) : null}

                                                        {dayItems.map(
                                                            (item) => {
                                                                const basePos =
                                                                    blokPositie(
                                                                        item,
                                                                        day
                                                                    );
                                                                const override =
                                                                    resizeOverride?.kind ===
                                                                        "workorder" &&
                                                                    resizeOverride.id ===
                                                                        item.id
                                                                        ? resizeOverride
                                                                        : null;
                                                                const pos =
                                                                    override
                                                                        ? {
                                                                              beginUur:
                                                                                  override.beginUur,
                                                                              eindUur:
                                                                                  override.eindUur,
                                                                              top:
                                                                                  (override.beginUur -
                                                                                      DAG_START_UUR) *
                                                                                      PX_PER_UUR +
                                                                                  DAG_PADDING_TOP,
                                                                              height: Math.max(
                                                                                  40,
                                                                                  (override.eindUur -
                                                                                      override.beginUur) *
                                                                                      PX_PER_UUR
                                                                              ),
                                                                          }
                                                                        : basePos;
                                                                const color =
                                                                    (item
                                                                        .customer
                                                                        ?.color ??
                                                                        item
                                                                            .project
                                                                            ?.customer
                                                                            ?.color) ??
                                                                    "#2563eb";

                                                                const timeLabel = `${formatUurLabel(pos.beginUur)}–${formatUurLabel(pos.eindUur)}`;
                                                                const cellKey = `${iso}:${user.id}`;
                                                                const plaatsnaam =
                                                                    String(
                                                                        item.city ||
                                                                            item
                                                                                .project
                                                                                ?.plaats ||
                                                                            ""
                                                                    ).trim() ||
                                                                    null;
                                                                const hasConflict =
                                                                    conflictWoSet.has(
                                                                        item.id
                                                                    );

                                                                return (
                                                                    <div
                                                                        key={
                                                                            item.id
                                                                        }
                                                                        draggable={
                                                                            !!onMovePlan &&
                                                                            !resizingRef.current
                                                                        }
                                                                        onDragStart={
                                                                            onMovePlan
                                                                                ? (e) => {
                                                                                      if (
                                                                                          resizingRef.current
                                                                                      ) {
                                                                                          e.preventDefault();
                                                                                          return;
                                                                                      }
                                                                                      hideNativeDragGhost(
                                                                                          e
                                                                                      );
                                                                                      setIsDragging(
                                                                                          true
                                                                                      );
                                                                                      const durationHours =
                                                                                          Math.max(
                                                                                              0.25,
                                                                                              pos.eindUur -
                                                                                                  pos.beginUur
                                                                                          );
                                                                                      dragMetaRef.current =
                                                                                          {
                                                                                              durationHours,
                                                                                          };
                                                                                      setDragItem(
                                                                                          {
                                                                                              kind: "workorder",
                                                                                              id: item.id,
                                                                                              durationHours,
                                                                                              color,
                                                                                              title:
                                                                                                  (item
                                                                                                      .customer
                                                                                                      ?.name ??
                                                                                                      item
                                                                                                          .project
                                                                                                          ?.customer
                                                                                                          ?.name) ??
                                                                                                  "Onbekende klant",
                                                                                              subtitle:
                                                                                                  item
                                                                                                      .project
                                                                                                      ?.name ??
                                                                                                  item.title,
                                                                                          }
                                                                                      );
                                                                                      e.dataTransfer.setData(
                                                                                          "workorderId",
                                                                                          item.id
                                                                                      );
                                                                                      e.dataTransfer.setData(
                                                                                          "fromEngineerId",
                                                                                          user.id
                                                                                      );
                                                                                      e.dataTransfer.setData(
                                                                                          "text/plain",
                                                                                          `workorder:${item.id}`
                                                                                      );
                                                                                      e.dataTransfer.effectAllowed =
                                                                                          "move";
                                                                                  }
                                                                                : undefined
                                                                        }
                                                                        title={
                                                                            hasConflict
                                                                                ? "Planningsconflict"
                                                                                : undefined
                                                                        }
                                                                        className={`
                                                                            group/job absolute text-white
                                                                            rounded-lg px-2 py-1
                                                                            leading-tight overflow-hidden
                                                                            shadow-sm
                                                                            hover:brightness-110 hover:shadow-md
                                                                            transition z-[5]
                                                                            ${
                                                                                hasConflict
                                                                                    ? "ring-2 ring-[#d6007e] ring-offset-1 ring-offset-white z-[6]"
                                                                                    : "ring-1 ring-black/10"
                                                                            }
                                                                            ${
                                                                                onMovePlan
                                                                                    ? "cursor-grab active:cursor-grabbing"
                                                                                    : ""
                                                                            }
                                                                            ${
                                                                                dragItem?.kind ===
                                                                                    "workorder" &&
                                                                                dragItem.id ===
                                                                                    item.id
                                                                                    ? "opacity-30"
                                                                                    : ""
                                                                            }
                                                                        `}
                                                                        data-planning-job
                                                                        data-planning-conflict={
                                                                            hasConflict
                                                                                ? "true"
                                                                                : undefined
                                                                        }
                                                                        style={{
                                                                            backgroundColor:
                                                                                color,
                                                                            top: `${pos.top}px`,
                                                                            height: `${pos.height}px`,
                                                                            left: "4px",
                                                                            right: "4px",
                                                                        }}
                                                                    >
                                                                        {onResizePlan ? (
                                                                            <>
                                                                                <button
                                                                                    type="button"
                                                                                    aria-label="Starttijd aanpassen"
                                                                                    className="
                                                                                        absolute left-1/2 -translate-x-1/2 -top-0.5 z-20
                                                                                        flex h-2 w-3.5 items-center justify-center
                                                                                        rounded bg-white/95 text-slate-600
                                                                                        shadow-sm ring-1 ring-black/10
                                                                                        cursor-ns-resize
                                                                                        opacity-80 hover:opacity-100
                                                                                    "
                                                                                    onMouseDown={(e) => {
                                                                                        e.preventDefault();
                                                                                        e.stopPropagation();
                                                                                    }}
                                                                                    onPointerDown={(e) => {
                                                                                        e.preventDefault();
                                                                                        e.stopPropagation();
                                                                                        resizingRef.current =
                                                                                            {
                                                                                                kind: "workorder",
                                                                                                id: item.id,
                                                                                                edge: "start",
                                                                                                cellKey,
                                                                                                beginUur:
                                                                                                    pos.beginUur,
                                                                                                eindUur:
                                                                                                    pos.eindUur,
                                                                                            };
                                                                                        setResizeOverride(
                                                                                            {
                                                                                                kind: "workorder",
                                                                                                id: item.id,
                                                                                                beginUur:
                                                                                                    pos.beginUur,
                                                                                                eindUur:
                                                                                                    pos.eindUur,
                                                                                            }
                                                                                        );
                                                                                        setIsDragging(
                                                                                            true
                                                                                        );
                                                                                    }}
                                                                                >
                                                                                    <span className="text-[6px] leading-none">
                                                                                        ▲
                                                                                    </span>
                                                                                </button>
                                                                                <button
                                                                                    type="button"
                                                                                    aria-label="Eindtijd aanpassen"
                                                                                    className="
                                                                                        absolute left-1/2 -translate-x-1/2 -bottom-0.5 z-20
                                                                                        flex h-2 w-3.5 items-center justify-center
                                                                                        rounded bg-white/95 text-slate-600
                                                                                        shadow-sm ring-1 ring-black/10
                                                                                        cursor-ns-resize
                                                                                        opacity-80 hover:opacity-100
                                                                                    "
                                                                                    onMouseDown={(e) => {
                                                                                        e.preventDefault();
                                                                                        e.stopPropagation();
                                                                                    }}
                                                                                    onPointerDown={(e) => {
                                                                                        e.preventDefault();
                                                                                        e.stopPropagation();
                                                                                        resizingRef.current =
                                                                                            {
                                                                                                kind: "workorder",
                                                                                                id: item.id,
                                                                                                edge: "end",
                                                                                                cellKey,
                                                                                                beginUur:
                                                                                                    pos.beginUur,
                                                                                                eindUur:
                                                                                                    pos.eindUur,
                                                                                            };
                                                                                        setResizeOverride(
                                                                                            {
                                                                                                kind: "workorder",
                                                                                                id: item.id,
                                                                                                beginUur:
                                                                                                    pos.beginUur,
                                                                                                eindUur:
                                                                                                    pos.eindUur,
                                                                                            }
                                                                                        );
                                                                                        setIsDragging(
                                                                                            true
                                                                                        );
                                                                                    }}
                                                                                >
                                                                                    <span className="text-[6px] leading-none">
                                                                                        ▼
                                                                                    </span>
                                                                                </button>
                                                                            </>
                                                                        ) : null}

                                                                        <div
                                                                            role="button"
                                                                            tabIndex={0}
                                                                            className="block h-full overflow-hidden cursor-pointer"
                                                                            onClick={(e) => {
                                                                                if (
                                                                                    Date.now() <
                                                                                        suppressClickUntilRef.current ||
                                                                                    resizeOverride
                                                                                ) {
                                                                                    e.preventDefault();
                                                                                    e.stopPropagation();
                                                                                    return;
                                                                                }
                                                                                e.stopPropagation();
                                                                                onActivityMenu?.({
                                                                                    target: {
                                                                                        kind: "workorder",
                                                                                        workorder: item,
                                                                                    },
                                                                                    x: e.clientX,
                                                                                    y: e.clientY,
                                                                                });
                                                                            }}
                                                                        >
                                                                            <div className="flex items-start justify-between gap-1">
                                                                                <span className="text-[11px] font-bold opacity-95 tabular-nums leading-none pt-0.5 min-w-0 truncate flex items-center gap-1">
                                                                                    {hasConflict ? (
                                                                                        <span
                                                                                            className="
                                                                                                shrink-0 inline-flex h-3.5 min-w-3.5
                                                                                                items-center justify-center
                                                                                                rounded bg-white text-[#d6007e]
                                                                                                text-[9px] font-black leading-none
                                                                                            "
                                                                                            aria-label="Planningsconflict"
                                                                                        >
                                                                                            !
                                                                                        </span>
                                                                                    ) : null}
                                                                                    {timeLabel}
                                                                                </span>
                                                                                {showStatusIcons ? (
                                                                                    <PlanningStatusIcon
                                                                                        status={
                                                                                            item.status
                                                                                        }
                                                                                    />
                                                                                ) : null}
                                                                            </div>

                                                                            <span className="text-[12px] block truncate font-semibold">
                                                                                {(item
                                                                                    .customer
                                                                                    ?.name ??
                                                                                    item
                                                                                        .project
                                                                                        ?.customer
                                                                                        ?.name) ??
                                                                                    "Onbekende klant"}
                                                                            </span>

                                                                            <strong className="text-[11px] block truncate font-medium opacity-90">
                                                                                {item
                                                                                    .project
                                                                                    ?.name ??
                                                                                    item.title}
                                                                            </strong>

                                                                            {item.project
                                                                                ?.name &&
                                                                            item.title ? (
                                                                                <span className="text-[10px] block truncate opacity-90 mt-0.5">
                                                                                    {
                                                                                        item.title
                                                                                    }
                                                                                </span>
                                                                            ) : null}

                                                                            {plaatsnaam ? (
                                                                                <span
                                                                                    className="text-[10px] block break-words line-clamp-2 leading-snug opacity-90 mt-0.5 min-w-0"
                                                                                    title={
                                                                                        plaatsnaam
                                                                                    }
                                                                                >
                                                                                    {
                                                                                        plaatsnaam
                                                                                    }
                                                                                </span>
                                                                            ) : null}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            }
                                                        )}

                                                        {dayEvents.map((ev) => {
                                                            const basePos =
                                                                blokPositie(
                                                                    eventAsBlock(
                                                                        ev
                                                                    ),
                                                                    day
                                                                );
                                                            const override =
                                                                resizeOverride?.kind ===
                                                                    "agenda" &&
                                                                resizeOverride.id ===
                                                                    ev.id
                                                                    ? resizeOverride
                                                                    : null;
                                                            const pos = override
                                                                ? {
                                                                      beginUur:
                                                                          override.beginUur,
                                                                      eindUur:
                                                                          override.eindUur,
                                                                      top:
                                                                          (override.beginUur -
                                                                              DAG_START_UUR) *
                                                                              PX_PER_UUR +
                                                                          DAG_PADDING_TOP,
                                                                      height: Math.max(
                                                                          40,
                                                                          (override.eindUur -
                                                                              override.beginUur) *
                                                                              PX_PER_UUR
                                                                      ),
                                                                  }
                                                                : basePos;
                                                            const timeLabel =
                                                                !override &&
                                                                ev.allDay
                                                                    ? "Hele dag"
                                                                    : `${formatUurLabel(pos.beginUur)}${
                                                                          ev.endAt ||
                                                                          override
                                                                              ? `–${formatUurLabel(pos.eindUur)}`
                                                                              : ""
                                                                      }`;
                                                            const cellKey = `${iso}:${user.id}`;
                                                            const canResize =
                                                                !!onResizeAgenda;
                                                            const hasConflict =
                                                                conflictEvSet.has(
                                                                    ev.id
                                                                );

                                                            return (
                                                                <div
                                                                    key={ev.id}
                                                                    data-planning-agenda
                                                                    data-planning-conflict={
                                                                        hasConflict
                                                                            ? "true"
                                                                            : undefined
                                                                    }
                                                                    draggable={
                                                                        !!onMoveAgenda &&
                                                                        !resizingRef.current
                                                                    }
                                                                    onDragStart={
                                                                        onMoveAgenda
                                                                            ? (e) => {
                                                                                  if (
                                                                                      resizingRef.current
                                                                                  ) {
                                                                                      e.preventDefault();
                                                                                      return;
                                                                                  }
                                                                                  hideNativeDragGhost(
                                                                                      e
                                                                                  );
                                                                                  setIsDragging(
                                                                                      true
                                                                                  );
                                                                                  const durationHours =
                                                                                      Math.max(
                                                                                          0.25,
                                                                                          pos.eindUur -
                                                                                              pos.beginUur
                                                                                      );
                                                                                  dragMetaRef.current =
                                                                                      {
                                                                                          durationHours,
                                                                                      };
                                                                                  setDragItem(
                                                                                      {
                                                                                          kind: "agenda",
                                                                                          id: ev.id,
                                                                                          durationHours,
                                                                                          color: "#FFCC00",
                                                                                          title: ev.title,
                                                                                          subtitle:
                                                                                              ev.notes ||
                                                                                              null,
                                                                                      }
                                                                                  );
                                                                                  e.dataTransfer.setData(
                                                                                      "agendaEventId",
                                                                                      ev.id
                                                                                  );
                                                                                  e.dataTransfer.setData(
                                                                                      "text/plain",
                                                                                      `agenda:${ev.id}`
                                                                                  );
                                                                                  e.dataTransfer.effectAllowed =
                                                                                      "move";
                                                                              }
                                                                            : undefined
                                                                    }
                                                                    onClick={(e) => {
                                                                        if (
                                                                            Date.now() <
                                                                                suppressClickUntilRef.current ||
                                                                            resizeOverride
                                                                        ) {
                                                                            e.preventDefault();
                                                                            e.stopPropagation();
                                                                            return;
                                                                        }
                                                                        e.stopPropagation();
                                                                        onActivityMenu?.({
                                                                            target: {
                                                                                kind: "agenda",
                                                                                event: ev,
                                                                            },
                                                                            x: e.clientX,
                                                                            y: e.clientY,
                                                                        });
                                                                    }}
                                                                    title={
                                                                        hasConflict
                                                                            ? `Planningsconflict · ${ev.title}`
                                                                            : ev.title
                                                                    }
                                                                    className={`
                                                                        absolute text-left
                                                                        rounded-lg px-2 py-1
                                                                        leading-tight
                                                                        bg-[#FFCC00] text-slate-900
                                                                        border-2
                                                                        shadow-sm
                                                                        hover:brightness-95 hover:shadow-md
                                                                        transition z-[5] cursor-pointer
                                                                        ${
                                                                            hasConflict
                                                                                ? "border-[#d6007e] ring-2 ring-[#d6007e] z-[6]"
                                                                                : "border-[#e6b800] ring-1 ring-black/10"
                                                                        }
                                                                        ${
                                                                            onMoveAgenda
                                                                                ? "cursor-grab active:cursor-grabbing"
                                                                                : "cursor-pointer"
                                                                        }
                                                                        ${
                                                                            dragItem?.kind ===
                                                                                "agenda" &&
                                                                            dragItem.id ===
                                                                                ev.id
                                                                                ? "opacity-30"
                                                                                : ""
                                                                        }
                                                                    `}
                                                                    style={{
                                                                        top: `${pos.top}px`,
                                                                        height: `${pos.height}px`,
                                                                        left: "4px",
                                                                        right: "4px",
                                                                    }}
                                                                >
                                                                    {canResize ? (
                                                                        <>
                                                                            <button
                                                                                type="button"
                                                                                aria-label="Starttijd aanpassen"
                                                                                className="
                                                                                    absolute left-1/2 -translate-x-1/2 -top-0.5 z-20
                                                                                    flex h-2 w-3.5 items-center justify-center
                                                                                    rounded bg-white/95 text-slate-600
                                                                                    shadow-sm ring-1 ring-black/10
                                                                                    cursor-ns-resize
                                                                                    opacity-80 hover:opacity-100
                                                                                "
                                                                                onMouseDown={(
                                                                                    e
                                                                                ) => {
                                                                                    e.preventDefault();
                                                                                    e.stopPropagation();
                                                                                }}
                                                                                onPointerDown={(
                                                                                    e
                                                                                ) => {
                                                                                    e.preventDefault();
                                                                                    e.stopPropagation();
                                                                                    resizingRef.current =
                                                                                        {
                                                                                            kind: "agenda",
                                                                                            id: ev.id,
                                                                                            edge: "start",
                                                                                            cellKey,
                                                                                            beginUur:
                                                                                                pos.beginUur,
                                                                                            eindUur:
                                                                                                pos.eindUur,
                                                                                        };
                                                                                    setResizeOverride(
                                                                                        {
                                                                                            kind: "agenda",
                                                                                            id: ev.id,
                                                                                            beginUur:
                                                                                                pos.beginUur,
                                                                                            eindUur:
                                                                                                pos.eindUur,
                                                                                        }
                                                                                    );
                                                                                    setIsDragging(
                                                                                        true
                                                                                    );
                                                                                }}
                                                                            >
                                                                                <span className="text-[6px] leading-none">
                                                                                    ▲
                                                                                </span>
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                aria-label="Eindtijd aanpassen"
                                                                                className="
                                                                                    absolute left-1/2 -translate-x-1/2 -bottom-0.5 z-20
                                                                                    flex h-2 w-3.5 items-center justify-center
                                                                                    rounded bg-white/95 text-slate-600
                                                                                    shadow-sm ring-1 ring-black/10
                                                                                    cursor-ns-resize
                                                                                    opacity-80 hover:opacity-100
                                                                                "
                                                                                onMouseDown={(
                                                                                    e
                                                                                ) => {
                                                                                    e.preventDefault();
                                                                                    e.stopPropagation();
                                                                                }}
                                                                                onPointerDown={(
                                                                                    e
                                                                                ) => {
                                                                                    e.preventDefault();
                                                                                    e.stopPropagation();
                                                                                    resizingRef.current =
                                                                                        {
                                                                                            kind: "agenda",
                                                                                            id: ev.id,
                                                                                            edge: "end",
                                                                                            cellKey,
                                                                                            beginUur:
                                                                                                pos.beginUur,
                                                                                            eindUur:
                                                                                                pos.eindUur,
                                                                                        };
                                                                                    setResizeOverride(
                                                                                        {
                                                                                            kind: "agenda",
                                                                                            id: ev.id,
                                                                                            beginUur:
                                                                                                pos.beginUur,
                                                                                            eindUur:
                                                                                                pos.eindUur,
                                                                                        }
                                                                                    );
                                                                                    setIsDragging(
                                                                                        true
                                                                                    );
                                                                                }}
                                                                            >
                                                                                <span className="text-[6px] leading-none">
                                                                                    ▼
                                                                                </span>
                                                                            </button>
                                                                        </>
                                                                    ) : null}
                                                                    <div className="h-full overflow-hidden">
                                                                        <span className="text-[11px] font-bold tabular-nums leading-none block truncate">
                                                                            {
                                                                                timeLabel
                                                                            }
                                                                            {ev.recurrenceFreq &&
                                                                            ev.recurrenceFreq !==
                                                                                "none"
                                                                                ? " ↻"
                                                                                : ""}
                                                                        </span>
                                                                        <strong className="text-[12px] block truncate font-semibold mt-0.5">
                                                                            {
                                                                                ev.title
                                                                            }
                                                                        </strong>
                                                                        {ev.notes ? (
                                                                            <span className="text-[10px] block truncate opacity-90">
                                                                                {
                                                                                    ev.notes
                                                                                }
                                                                            </span>
                                                                        ) : null}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                        {dragPreview?.cellKey ===
                                                        `${iso}:${user.id}` ? (
                                                            (() => {
                                                                const startUur =
                                                                    dragPreview.hour;
                                                                const eindUur =
                                                                    Math.min(
                                                                        DAG_EIND_UUR,
                                                                        dragPreview.hour +
                                                                            dragPreview.durationHours
                                                                    );
                                                                const tijdLabel = `${formatUurLabel(startUur)}–${formatUurLabel(eindUur)}`;
                                                                const isAgenda =
                                                                    dragItem?.kind ===
                                                                    "agenda";
                                                                const bg =
                                                                    dragItem?.color ||
                                                                    "#0066FF";

                                                                return (
                                                                    <div
                                                                        className="
                                                                            pointer-events-none absolute left-1 right-1 z-[80]
                                                                            overflow-hidden rounded-lg px-2 py-1
                                                                            shadow-lg ring-2 ring-white
                                                                            leading-tight
                                                                        "
                                                                        style={{
                                                                            top: `${
                                                                                (startUur -
                                                                                    DAG_START_UUR) *
                                                                                    PX_PER_UUR +
                                                                                DAG_PADDING_TOP
                                                                            }px`,
                                                                            height: `${Math.max(
                                                                                40,
                                                                                dragPreview.durationHours *
                                                                                    PX_PER_UUR
                                                                            )}px`,
                                                                            backgroundColor:
                                                                                bg,
                                                                            color: isAgenda
                                                                                ? "#0f172a"
                                                                                : "#ffffff",
                                                                        }}
                                                                    >
                                                                        <span className="text-[11px] font-bold tabular-nums leading-none block">
                                                                            {
                                                                                tijdLabel
                                                                            }
                                                                        </span>
                                                                        {dragItem?.title ? (
                                                                            <strong className="text-[12px] block truncate font-semibold mt-0.5">
                                                                                {
                                                                                    dragItem.title
                                                                                }
                                                                            </strong>
                                                                        ) : null}
                                                                        {dragItem?.subtitle ? (
                                                                            <span className="text-[10px] block truncate opacity-90">
                                                                                {
                                                                                    dragItem.subtitle
                                                                                }
                                                                            </span>
                                                                        ) : null}
                                                                    </div>
                                                                );
                                                            })()
                                                        ) : null}
                                      </div>

                                                    {onMovePlan || onSchedulePending || onCreateAgenda ? (
                                                        pendingSchedule && onSchedulePending && !verlof ? (
                                                            <button
                                                                type="button"
                                                                title={`Inplannen: ${pendingSchedule.label}`}
                                                                onClick={() =>
                                                                    onSchedulePending({
                                                                        dateIso: iso,
                                                                        engineerId: user.id,
                                                                    })
                                                                }
                                                                className="
                                                                    group/plan flex items-center justify-center gap-1
                                                                    rounded-lg py-1.5 text-[11px] font-semibold
                                                                    text-white bg-[#0066FF] border border-[#0066FF]
                                                                    hover:bg-[#0052cc] transition
                                                                "
                                                            >
                                                                <span
                                                                    className="
                                                                        inline-flex h-4 w-4 items-center justify-center
                                                                        rounded-full bg-white/20 text-white
                                                                        text-[10px] font-bold leading-none
                                                                    "
                                                                >
                                                                    ✓
                                                                </span>
                                                                Hier inplannen
                                                            </button>
                                                        ) : onCreateAgenda ? (
                                                        <button
                                                            type="button"
                                                            title="Agenda-item of opdracht plannen"
                                                            onClick={() =>
                                                                onCreateAgenda({
                                                                    dateIso: iso,
                                                                    engineerId: user.id,
                                                                })
                                                            }
                                                            className="
                                                                group/plan flex items-center justify-center gap-1
                                                                rounded-lg py-1.5 text-[11px] font-medium
                                                                text-slate-400 bg-white border border-transparent
                                                                hover:border-[#0066FF]/30 hover:bg-[#e8f0ff]
                                                                hover:text-[#0066FF] transition
                                                            "
                                                        >
                                                            <span
                                                                className="
                                                                    inline-flex h-4 w-4 items-center justify-center
                                                                    rounded-full bg-slate-100 text-slate-500
                                                                    group-hover/plan:bg-[#0066FF] group-hover/plan:text-white
                                                                    text-[10px] font-bold leading-none transition
                                                                "
                                                            >
                                                                +
                                                            </span>
                                                            Plannen
                                                        </button>
                                                        ) : onMovePlan ? (
                                        <Link
                                                            href={`/workorders/new?date=${iso}&engineer=${user.id}`}
                                                            title="Opdracht inplannen voor deze monteur op deze dag"
                                            className="
                                                                group/plan flex items-center justify-center gap-1
                                                                rounded-lg py-1.5 text-[11px] font-medium
                                                                text-slate-400 bg-white border border-transparent
                                                                hover:border-[#0066FF]/30 hover:bg-[#e8f0ff]
                                                                hover:text-[#0066FF] transition
                                                            "
                                                        >
                                                            <span
                                                                className="
                                                                    inline-flex h-4 w-4 items-center justify-center
                                                                    rounded-full bg-slate-100 text-slate-500
                                                                    group-hover/plan:bg-[#0066FF] group-hover/plan:text-white
                                                                    text-[10px] font-bold leading-none transition
                                                                "
                                                            >
                                                                +
                                                            </span>
                                                            Plannen
                                        </Link>
                                                        ) : null
                                                    ) : null}
                                    </div>
                                            );
                                        })}
                        </div>
                                );
                            })}
            </div>
                    </div>
                </div>
            )}
        </section>
    );
}
