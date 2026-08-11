"use client";

import { useState } from "react";
import Link from "next/link";

import DraggableAssignment from "./DraggableAssignment";
import { dutchHolidays } from "@/lib/holidays";

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

/** nl-NL zet maandnamen vaak in kleine letters; maak eerste letter hoofdletter. */
function formatNlDate(
    date: Date,
    options: Intl.DateTimeFormatOptions
): string {
    return date
        .toLocaleDateString("nl-NL", options)
        .replace(/(^|[\s–-])([a-zà-ÿ])/g, (_, sep, ch) => sep + ch.toUpperCase());
}

interface CalendarProps {
    items: any[];
    leave?: any[];
    events?: any[];
    onDropDate?: (id: string, date: string) => void;
    view?: "week" | "month";
    onViewChange?: (view: "week" | "month") => void;
    showStatusIcons?: boolean;
    onCreateAgenda?: (args: { dateIso: string }) => void;
    onActivityMenu?: (args: {
        target:
            | { kind: "agenda"; event: any }
            | { kind: "workorder"; workorder: any };
        x: number;
        y: number;
    }) => void;
}

export default function Calendar({
    items,
    leave = [],
    events = [],
    onDropDate,
    view = "month",
    onViewChange,
    showStatusIcons = true,
    onCreateAgenda,
    onActivityMenu,
}: CalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date());

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const today = new Date();
    const isCurrentMonth =
        today.getFullYear() === year && today.getMonth() === month;
    const todayDay = isCurrentMonth ? today.getDate() : null;

    const holidayLookup: Record<string, string> = {};
    for (const h of dutchHolidays(year)) {
        holidayLookup[h.date] = h.name;
    }

    function isoDateOf(d: number): string {
        const mm = String(month + 1).padStart(2, "0");
        const dd = String(d).padStart(2, "0");
        return `${year}-${mm}-${dd}`;
    }

    function localIso(value: string | Date): string {
        const d = new Date(value);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
    }

    function leaveOnDay(d: number) {
        const iso = isoDateOf(d);
        return leave.filter((l) => {
            const from = l.from;
            const to = l.to || l.from;
            return from && from <= iso && iso <= to;
        });
    }

    function itemsOnDay(d: number) {
        const cellIso = isoDateOf(d);
        return items.filter((item) => {
            if (!item.plannedDate) return false;
            const startIso = localIso(item.plannedDate);
            const endIso = item.plannedEndDate
                ? localIso(item.plannedEndDate)
                : startIso;
            return startIso <= cellIso && cellIso <= endIso;
        });
    }

    function eventsOnDay(d: number) {
        const cellIso = isoDateOf(d);
        return events.filter((ev) => {
            if (!ev?.startAt) return false;
            const startIso = localIso(ev.startAt);
            const endIso = ev.endAt ? localIso(ev.endAt) : startIso;
            return startIso <= cellIso && cellIso <= endIso;
        });
    }

    const firstDay =
        (new Date(year, month, 1).getDay() + 6) % 7;

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: number[] = [];
    for (let i = 0; i < firstDay; i++) days.push(0);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    while (days.length % 7 !== 0) days.push(0);

    const weeks: number[][] = [];
    for (let i = 0; i < days.length; i += 7) {
        weeks.push(days.slice(i, i + 7));
    }

    const monthJobCount = items.filter((item) => {
        if (!item.plannedDate) return false;
        const d = new Date(item.plannedDate);
        return d.getFullYear() === year && d.getMonth() === month;
    }).length;

    function previousMonth() {
        setCurrentDate(new Date(year, month - 1, 1));
    }

    function nextMonth() {
        setCurrentDate(new Date(year, month + 1, 1));
    }

    function goToday() {
        setCurrentDate(new Date());
    }

    function handleDrop(event: React.DragEvent, day: number) {
        event.preventDefault();
        if (!day) return;

        const id = event.dataTransfer.getData("workorderId");
        const newDate = new Date(year, month, day, 12);

        if (onDropDate) {
            onDropDate(id, newDate.toISOString());
        }
    }

    const weekdayLabels = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];

    return (
        <section className="bg-white border border-gray-200 rounded-2xl overflow-hidden w-full max-w-full">
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-5 pt-3 pb-2.5 border-b border-slate-100 bg-slate-50/60">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-bold text-slate-900">
                            {formatNlDate(currentDate, {
                                month: "long",
                                year: "numeric",
                            })}
                        </h2>
                        <span className="inline-flex items-center rounded-full bg-[#0066FF]/10 text-[#0066FF] text-xs font-semibold px-2.5 py-0.5">
                            Maandoverzicht
                        </span>
                        {onViewChange ? (
                            <div className="inline-flex rounded-lg border border-slate-200 bg-white/80 p-0.5">
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
                    <p className="text-xs text-slate-500 mt-0.5">
                        {monthJobCount === 0
                            ? "Nog geen opdrachten deze maand."
                            : `${monthJobCount} opdracht${monthJobCount === 1 ? "" : "en"} deze maand.`}
                        {onDropDate
                            ? " Sleep een klus naar een andere dag of klik op plannen."
                            : ""}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                        type="button"
                        onClick={previousMonth}
                        className="
                            inline-flex items-center rounded-lg
                            border border-slate-200 bg-white
                            px-2.5 py-1.5 text-sm font-medium text-slate-700
                            hover:bg-slate-50 transition
                        "
                    >
                        ←
                    </button>
                    <button
                        type="button"
                        onClick={goToday}
                        className="
                            text-xs sm:text-sm font-semibold text-[#0066FF]
                            rounded-lg px-2 py-1
                            hover:bg-[#e8f0ff] transition
                        "
                    >
                        Vandaag
                    </button>
                    <button
                        type="button"
                        onClick={nextMonth}
                        className="
                            inline-flex items-center rounded-lg
                            border border-slate-200 bg-white
                            px-2.5 py-1.5 text-sm font-medium text-slate-700
                            hover:bg-slate-50 transition
                        "
                    >
                        →
                    </button>
                </div>
            </div>

            <div className="p-3 sm:p-4 overflow-x-auto">
                <div
                    className="grid gap-1.5 min-w-[720px]"
                    style={{
                        gridTemplateColumns:
                            "40px repeat(7, minmax(0, 1fr))",
                    }}
                >
                    <div className="flex items-end justify-center pb-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                            Wk
                        </span>
                    </div>
                    {weekdayLabels.map((label, i) => (
                        <div
                            key={label}
                            className={`
                                text-center rounded-lg py-2 mb-1
                                text-[11px] font-semibold uppercase tracking-wide
                                ${
                                    i >= 5
                                        ? "text-slate-400 bg-slate-50"
                                        : "text-[#0066FF] bg-[#e8f0ff]/60"
                                }
                            `}
                        >
                            {label}
                        </div>
                    ))}

                    {weeks.map((week, weekIndex) => {
                        const first = week.find((d) => d > 0);
                        const weekNumber = first
                            ? isoWeek(new Date(year, month, first))
                            : null;

                        return (
                            <div key={weekIndex} className="contents">
                                <div className="min-h-[7.5rem] rounded-xl py-2 text-xs text-[#0066FF]/70 font-bold text-center flex items-start justify-center pt-3">
                                    {weekNumber}
                                </div>

                                {week.map((day, index) => {
                                    const isToday = day > 0 && day === todayDay;
                                    const isWeekend = index >= 5;
                                    const dayItems =
                                        day > 0 ? itemsOnDay(day) : [];
                                    const dayEvents =
                                        day > 0 ? eventsOnDay(day) : [];
                                    const dayLeave =
                                        day > 0 ? leaveOnDay(day) : [];
                                    const holiday =
                                        day > 0
                                            ? holidayLookup[isoDateOf(day)]
                                            : undefined;
                                    const dayCount =
                                        dayItems.length + dayEvents.length;

                                    return (
                                        <div
                                            key={index}
                                            onDragOver={
                                                day > 0
                                                    ? (e) =>
                                                          e.preventDefault()
                                                    : undefined
                                            }
                                            onDrop={
                                                day > 0
                                                    ? (e) =>
                                                          handleDrop(e, day)
                                                    : undefined
                                            }
                                            onClick={
                                                day > 0 && onCreateAgenda
                                                    ? (e) => {
                                                          const target =
                                                              e.target as HTMLElement;
                                                          if (
                                                              target.closest(
                                                                  "a"
                                                              ) ||
                                                              target.closest(
                                                                  "button"
                                                              ) ||
                                                              target.closest(
                                                                  "[data-planning-job]"
                                                              ) ||
                                                              target.closest(
                                                                  "[data-planning-agenda]"
                                                              )
                                                          ) {
                                                              return;
                                                          }
                                                          onCreateAgenda({
                                                              dateIso:
                                                                  isoDateOf(
                                                                      day
                                                                  ),
                                                          });
                                                      }
                                                    : undefined
                                            }
                                            className={`
                                                min-h-[7.5rem] min-w-0 overflow-hidden
                                                rounded-xl p-1.5 flex flex-col gap-1
                                                border transition
                                                ${
                                                    day === 0
                                                        ? "bg-slate-50/80 border-slate-100"
                                                        : isToday
                                                          ? "border-[#d6007e]/40 bg-[#fff5fa] shadow-sm shadow-[#d6007e]/10"
                                                          : isWeekend
                                                            ? "border-slate-100 bg-slate-50/50"
                                                            : "border-slate-200/80 bg-white hover:border-[#0066FF]/25"
                                                }
                                                ${
                                                    day > 0 && onCreateAgenda
                                                        ? "cursor-pointer"
                                                        : ""
                                                }
                                            `}
                                        >
                                            {day > 0 ? (
                                                <>
                                                    <div className="flex items-start justify-between gap-1 mb-0.5">
                                                        <span
                                                            className={`
                                                                inline-flex items-center justify-center
                                                                min-w-[1.6rem] h-6 px-1 rounded-full
                                                                text-xs font-bold tabular-nums
                                                                ${
                                                                    isToday
                                                                        ? "bg-[#d6007e] text-white"
                                                                        : "text-slate-700"
                                                                }
                                                            `}
                                                        >
                                                            {day}
                                                        </span>
                                                        {holiday ? (
                                                            <span
                                                                className="text-[9px] text-[#d6007e] font-medium truncate text-right leading-tight max-w-[60%]"
                                                                title={holiday}
                                                            >
                                                                {holiday}
                                                            </span>
                                                        ) : dayCount >
                                                          0 ? (
                                                            <span className="text-[10px] font-semibold text-[#0066FF]/80 tabular-nums">
                                                                {dayCount}
                                                            </span>
                                                        ) : null}
                                                    </div>

                                                    <div className="flex-1 min-h-0 space-y-1 overflow-hidden">
                                                        {dayLeave.map((l) => (
                                                            <div
                                                                key={l.id}
                                                                className="
                                                                    bg-orange-50 border border-orange-100
                                                                    text-orange-800 text-[10px]
                                                                    rounded-md px-1.5 py-1
                                                                    truncate leading-tight font-medium
                                                                "
                                                                title={`Verlof: ${l.userName ?? ""}`}
                                                            >
                                                                🌴{" "}
                                                                {l.userName ??
                                                                    "Verlof"}
                                                            </div>
                                                        ))}

                                                        {dayItems.map(
                                                            (item) => (
                                                                <DraggableAssignment
                                                                    key={
                                                                        item.id
                                                                    }
                                                                    item={
                                                                        item
                                                                    }
                                                                    draggable={
                                                                        !!onDropDate
                                                                    }
                                                                    showStatusIcon={
                                                                        showStatusIcons
                                                                    }
                                                                    onMenu={
                                                                        onActivityMenu
                                                                            ? ({
                                                                                  item: wo,
                                                                                  x,
                                                                                  y,
                                                                              }) =>
                                                                                  onActivityMenu(
                                                                                      {
                                                                                          target: {
                                                                                              kind: "workorder",
                                                                                              workorder:
                                                                                                  wo,
                                                                                          },
                                                                                          x,
                                                                                          y,
                                                                                      }
                                                                                  )
                                                                            : undefined
                                                                    }
                                                                />
                                                            )
                                                        )}

                                                        {dayEvents.map((ev) => {
                                                            const who =
                                                                ev.assignedUser
                                                                    ?.name ||
                                                                "Algemeen";
                                                            const label = `${who}, ${ev.title}`;
                                                            const recur =
                                                                ev.recurrenceFreq &&
                                                                ev.recurrenceFreq !==
                                                                    "none"
                                                                    ? " ↻"
                                                                    : "";

                                                            return (
                                                            <button
                                                                key={ev.id}
                                                                type="button"
                                                                data-planning-agenda
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
                                                                className="
                                                                    w-full text-left
                                                                    bg-amber-100 border border-amber-200
                                                                    text-amber-950 text-[10px]
                                                                    rounded-md px-1.5 py-1
                                                                    truncate leading-tight font-semibold
                                                                    hover:bg-amber-200 transition
                                                                    cursor-pointer
                                                                "
                                                                title={label}
                                                            >
                                                                {label}
                                                                {recur}
                                                            </button>
                                                            );
                                                        })}
                                                    </div>

                                                    {onCreateAgenda || onDropDate ? (
                                                        onCreateAgenda ? (
                                                        <button
                                                            type="button"
                                                            title="Agenda-item of opdracht op deze dag"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onCreateAgenda({
                                                                    dateIso: isoDateOf(day),
                                                                });
                                                            }}
                                                            className="
                                                                group/plan mt-auto flex items-center justify-center gap-1
                                                                rounded-lg py-1 text-[10px] font-medium
                                                                text-slate-400 bg-transparent
                                                                hover:bg-[#e8f0ff] hover:text-[#0066FF]
                                                                transition
                                                            "
                                                        >
                                                            <span
                                                                className="
                                                                    inline-flex h-3.5 w-3.5 items-center justify-center
                                                                    rounded-full bg-slate-100 text-slate-500
                                                                    group-hover/plan:bg-[#0066FF] group-hover/plan:text-white
                                                                    text-[9px] font-bold leading-none transition
                                                                "
                                                            >
                                                                +
                                                            </span>
                                                            Plannen
                                                        </button>
                                                        ) : (
                                                        <Link
                                                            href={`/workorders/new?date=${isoDateOf(day)}`}
                                                            title="Opdracht inplannen op deze dag"
                                                            className="
                                                                group/plan mt-auto flex items-center justify-center gap-1
                                                                rounded-lg py-1 text-[10px] font-medium
                                                                text-slate-400 bg-transparent
                                                                hover:bg-[#e8f0ff] hover:text-[#0066FF]
                                                                transition
                                                            "
                                                        >
                                                            <span
                                                                className="
                                                                    inline-flex h-3.5 w-3.5 items-center justify-center
                                                                    rounded-full bg-slate-100 text-slate-500
                                                                    group-hover/plan:bg-[#0066FF] group-hover/plan:text-white
                                                                    text-[9px] font-bold leading-none transition
                                                                "
                                                            >
                                                                +
                                                            </span>
                                                            Plannen
                                                        </Link>
                                                        )
                                                    ) : null}
                                                </>
                                            ) : null}
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
