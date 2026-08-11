"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function toIsoDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function isoWeek(date: Date): number {
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

function mondayOf(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const dow = d.getDay(); // 0=zo
    const offset = dow === 0 ? -6 : 1 - dow;
    d.setDate(d.getDate() + offset);
    return d;
}

function formatNlMonthYear(date: Date): string {
    return date
        .toLocaleDateString("nl-NL", { month: "long", year: "numeric" })
        .replace(/^./, (c) => c.toUpperCase());
}

function eachIsoInRange(
    startIso: string,
    endIso: string
): string[] {
    const out: string[] = [];
    const cur = new Date(startIso + "T12:00:00");
    const end = new Date(endIso + "T12:00:00");
    while (cur <= end) {
        out.push(toIsoDate(cur));
        cur.setDate(cur.getDate() + 1);
    }
    return out;
}

type DayMarks = { job: boolean; agenda: boolean };

/**
 * Mini-maandkalender voor in de sidebar op /planning (Outlook/Google-stijl).
 * Weeknummers links; stippels voor klussen (blauw) en agenda (geel).
 */
export default function PlanningMiniMonth() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const selectedIso = searchParams.get("date");

    const today = useMemo(() => {
        const t = new Date();
        t.setHours(0, 0, 0, 0);
        return t;
    }, []);
    const todayIso = toIsoDate(today);

    const [cursor, setCursor] = useState(() => {
        if (selectedIso && /^\d{4}-\d{2}-\d{2}$/.test(selectedIso)) {
            const [y, m] = selectedIso.split("-").map(Number);
            return new Date(y, m - 1, 1);
        }
        return new Date(today.getFullYear(), today.getMonth(), 1);
    });

    const [marks, setMarks] = useState<Record<string, DayMarks>>({});

    useEffect(() => {
        if (!selectedIso || !/^\d{4}-\d{2}-\d{2}$/.test(selectedIso)) return;
        const [y, m] = selectedIso.split("-").map(Number);
        setCursor((prev) => {
            if (prev.getFullYear() === y && prev.getMonth() === m - 1) {
                return prev;
            }
            return new Date(y, m - 1, 1);
        });
    }, [selectedIso]);

    const year = cursor.getFullYear();
    const month = cursor.getMonth();

    useEffect(() => {
        let cancelled = false;

        async function loadMarks() {
            try {
                const res = await fetch("/api/planning", {
                    cache: "no-store",
                });
                if (!res.ok) return;
                const data = await res.json();
                const workorders = Array.isArray(data)
                    ? data
                    : Array.isArray(data?.workorders)
                      ? data.workorders
                      : [];
                const events = Array.isArray(data?.events)
                    ? data.events
                    : [];

                const next: Record<string, DayMarks> = {};
                const touch = (iso: string, kind: "job" | "agenda") => {
                    if (!next[iso]) next[iso] = { job: false, agenda: false };
                    next[iso][kind] = true;
                };

                for (const item of workorders) {
                    if (!item?.plannedDate) continue;
                    const start = toIsoDate(new Date(item.plannedDate));
                    const end = item.plannedEndDate
                        ? toIsoDate(new Date(item.plannedEndDate))
                        : start;
                    for (const iso of eachIsoInRange(start, end)) {
                        touch(iso, "job");
                    }
                }

                for (const ev of events) {
                    if (!ev?.startAt) continue;
                    const start = toIsoDate(new Date(ev.startAt));
                    const end = ev.endAt
                        ? toIsoDate(new Date(ev.endAt))
                        : start;
                    for (const iso of eachIsoInRange(start, end)) {
                        touch(iso, "agenda");
                    }
                }

                if (!cancelled) setMarks(next);
            } catch {
                if (!cancelled) setMarks({});
            }
        }

        void loadMarks();
        return () => {
            cancelled = true;
        };
    }, [year, month]);

    const weeks = useMemo(() => {
        const first = new Date(year, month, 1);
        const start = mondayOf(first);
        const result: { week: number; days: (Date | null)[] }[] = [];
        let cursorDay = new Date(start);

        for (let w = 0; w < 6; w++) {
            const days: (Date | null)[] = [];
            const weekNum = isoWeek(cursorDay);
            for (let i = 0; i < 7; i++) {
                if (cursorDay.getMonth() === month) {
                    days.push(new Date(cursorDay));
                } else {
                    days.push(null);
                }
                cursorDay.setDate(cursorDay.getDate() + 1);
            }
            if (w > 0 && days.every((d) => d === null)) break;
            result.push({ week: weekNum, days });
        }
        return result;
    }, [year, month]);

    function goMonth(delta: number) {
        setCursor(new Date(year, month + delta, 1));
    }

    function selectDay(day: Date) {
        const iso = toIsoDate(day);
        router.push(`/planning?date=${iso}`);
    }

    const weekdayLabels = ["M", "D", "W", "D", "V", "Z", "Z"];

    return (
        <div className="px-2 pb-3 border-b border-gray-100">
            <div className="flex items-center justify-between gap-1 mb-2 px-1">
                <button
                    type="button"
                    onClick={() => goMonth(-1)}
                    className="
                        h-7 w-7 rounded-lg text-slate-500
                        hover:bg-slate-100 hover:text-slate-800
                        text-sm font-medium
                    "
                    aria-label="Vorige maand"
                >
                    ‹
                </button>
                <p className="text-xs font-semibold text-slate-800 tabular-nums">
                    {formatNlMonthYear(cursor)}
                </p>
                <button
                    type="button"
                    onClick={() => goMonth(1)}
                    className="
                        h-7 w-7 rounded-lg text-slate-500
                        hover:bg-slate-100 hover:text-slate-800
                        text-sm font-medium
                    "
                    aria-label="Volgende maand"
                >
                    ›
                </button>
            </div>

            <div
                className="grid gap-y-0.5 text-center"
                style={{
                    gridTemplateColumns: "22px repeat(7, minmax(0, 1fr))",
                }}
            >
                <span className="text-[9px] font-semibold text-slate-400 pb-1">
                    Wk
                </span>
                {weekdayLabels.map((label, i) => (
                    <span
                        key={`${label}-${i}`}
                        className={`text-[9px] font-semibold pb-1 ${
                            i >= 5 ? "text-slate-300" : "text-slate-400"
                        }`}
                    >
                        {label}
                    </span>
                ))}

                {weeks.map((row) => (
                    <div
                        key={`w-${row.week}-${row.days[0]?.toISOString() ?? row.week}`}
                        className="contents"
                    >
                        <span className="text-[9px] font-semibold text-[#0066FF] tabular-nums self-center">
                            {row.week}
                        </span>
                        {row.days.map((day, i) => {
                            if (!day) {
                                return (
                                    <span
                                        key={`e-${row.week}-${i}`}
                                        className="h-8"
                                    />
                                );
                            }
                            const iso = toIsoDate(day);
                            const isToday = iso === todayIso;
                            const isSelected = selectedIso === iso;
                            const isWeekend = i >= 5;
                            const dayMarks = marks[iso];
                            const hasJob = !!dayMarks?.job;
                            const hasAgenda = !!dayMarks?.agenda;

                            return (
                                <button
                                    key={iso}
                                    type="button"
                                    onClick={() => selectDay(day)}
                                    title={
                                        hasAgenda || hasJob
                                            ? `${iso}${hasJob ? " · klus" : ""}${hasAgenda ? " · agenda" : ""}`
                                            : iso
                                    }
                                    className={`
                                        relative h-8 w-full rounded-lg text-[11px] tabular-nums
                                        font-semibold transition flex flex-col items-center justify-center
                                        ${
                                            isSelected
                                                ? "bg-[#0066FF] text-white"
                                                : isToday
                                                  ? "bg-[#D6007E] text-white"
                                                  : isWeekend
                                                    ? "text-slate-400 hover:bg-slate-100"
                                                    : "text-slate-800 hover:bg-[#e8f0ff]"
                                        }
                                    `}
                                >
                                    <span className="leading-none">
                                        {day.getDate()}
                                    </span>
                                    {(hasJob || hasAgenda) && (
                                        <span className="flex items-center gap-0.5 mt-0.5 h-1.5">
                                            {hasJob ? (
                                                <span
                                                    className={`
                                                        h-1.5 w-1.5 rounded-full
                                                        ${
                                                            isSelected ||
                                                            isToday
                                                                ? "bg-white"
                                                                : "bg-[#0066FF]"
                                                        }
                                                    `}
                                                />
                                            ) : null}
                                            {hasAgenda ? (
                                                <span
                                                    className={`
                                                        h-1.5 w-1.5 rounded-full
                                                        ${
                                                            isSelected ||
                                                            isToday
                                                                ? "bg-[#FFCC00]"
                                                                : "bg-[#e6b800]"
                                                        }
                                                    `}
                                                />
                                            ) : null}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                ))}
            </div>

            <div className="mt-2 flex items-center justify-between gap-2 px-1">
                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <span className="inline-flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#0066FF]" />
                        Klus
                    </span>
                    <span className="inline-flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#e6b800]" />
                        Agenda
                    </span>
                </div>
                <button
                    type="button"
                    onClick={() => {
                        setCursor(
                            new Date(today.getFullYear(), today.getMonth(), 1)
                        );
                        selectDay(today);
                    }}
                    className="text-[11px] font-semibold text-[#0066FF] hover:underline"
                >
                    Vandaag
                </button>
            </div>
        </div>
    );
}
