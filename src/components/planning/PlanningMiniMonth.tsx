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

/**
 * Mini-maandkalender voor in de sidebar op /planning (Outlook/Google-stijl).
 * Weeknummers links; klik op een dag springt naar die week.
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
            // Stop als de hele rij buiten de maand valt (na de eerste week)
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
        <div className="px-1 py-3 border-t border-gray-100 mt-2">
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
                    <div key={`w-${row.week}-${row.days[0]?.toISOString() ?? row.week}`} className="contents">
                        <span className="text-[9px] font-semibold text-[#0066FF]/70 tabular-nums self-center">
                            {row.week}
                        </span>
                        {row.days.map((day, i) => {
                            if (!day) {
                                return (
                                    <span
                                        key={`e-${row.week}-${i}`}
                                        className="h-7"
                                    />
                                );
                            }
                            const iso = toIsoDate(day);
                            const isToday = iso === todayIso;
                            const isSelected = selectedIso === iso;
                            const isWeekend = i >= 5;

                            return (
                                <button
                                    key={iso}
                                    type="button"
                                    onClick={() => selectDay(day)}
                                    title={iso}
                                    className={`
                                        h-7 w-full rounded-full text-[11px] tabular-nums
                                        font-medium transition
                                        ${
                                            isSelected
                                                ? "bg-[#0066FF] text-white"
                                                : isToday
                                                  ? "bg-[#d6007e] text-white"
                                                  : isWeekend
                                                    ? "text-slate-400 hover:bg-slate-100"
                                                    : "text-slate-700 hover:bg-[#e8f0ff]"
                                        }
                                    `}
                                >
                                    {day.getDate()}
                                </button>
                            );
                        })}
                    </div>
                ))}
            </div>

            <button
                type="button"
                onClick={() => {
                    setCursor(
                        new Date(today.getFullYear(), today.getMonth(), 1)
                    );
                    selectDay(today);
                }}
                className="
                    mt-2 w-full text-center text-[11px] font-semibold
                    text-[#0066FF] hover:underline py-1
                "
            >
                Vandaag
            </button>
        </div>
    );
}
