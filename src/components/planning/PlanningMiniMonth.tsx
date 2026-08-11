"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { countsTowardCapacity } from "@/constants/staffKind";

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

function eachIsoInRange(startIso: string, endIso: string): string[] {
    const out: string[] = [];
    const cur = new Date(startIso + "T12:00:00");
    const end = new Date(endIso + "T12:00:00");
    while (cur <= end) {
        out.push(toIsoDate(cur));
        cur.setDate(cur.getDate() + 1);
    }
    return out;
}

const DAG_START_UUR = 7;
const DAG_EIND_UUR = 18;
const UREN_PER_DAG = DAG_EIND_UUR - DAG_START_UUR; // 11

function heeftKloktijd(d: Date): boolean {
    return d.getHours() !== 0 || d.getMinutes() !== 0;
}

function uurVan(d: Date): number {
    const u = d.getHours() + d.getMinutes() / 60;
    return Math.min(DAG_EIND_UUR, Math.max(DAG_START_UUR, u));
}

/** Geboekte uren van één item op één kalenderdag (07–18). */
function urenOpDag(
    startRaw: string | Date | null | undefined,
    endRaw: string | Date | null | undefined,
    dayIso: string,
    allDay?: boolean
): number {
    if (!startRaw) return 0;
    const start = new Date(startRaw);
    if (Number.isNaN(start.getTime())) return 0;
    const eind = endRaw ? new Date(endRaw) : null;

    const startIso = toIsoDate(start);
    const endIso = eind && !Number.isNaN(eind.getTime())
        ? toIsoDate(eind)
        : startIso;
    if (dayIso < startIso || dayIso > endIso) return 0;

    if (allDay || (!heeftKloktijd(start) && !(eind && heeftKloktijd(eind)))) {
        return UREN_PER_DAG;
    }

    const meerdaags = startIso !== endIso;
    let beginUur: number;
    let eindUur: number;

    if (meerdaags) {
        beginUur = heeftKloktijd(start) ? uurVan(start) : DAG_START_UUR;
        eindUur =
            eind && heeftKloktijd(eind) ? uurVan(eind) : DAG_EIND_UUR;
    } else {
        beginUur = heeftKloktijd(start) ? uurVan(start) : DAG_START_UUR;
        if (eind && heeftKloktijd(eind)) {
            eindUur = uurVan(eind);
        } else if (heeftKloktijd(start)) {
            eindUur = Math.min(DAG_EIND_UUR, uurVan(start) + 2);
        } else {
            eindUur = DAG_EIND_UUR;
        }
    }

    if (eindUur <= beginUur) {
        eindUur = Math.min(DAG_EIND_UUR, beginUur + 1);
    }
    return Math.max(0, eindUur - beginUur);
}

type LoadLevel = "free" | "busy" | "full";

function loadLevel(ratio: number): LoadLevel {
    if (ratio >= 0.9) return "full";
    if (ratio >= 0.6) return "busy";
    return "free";
}

function loadColor(level: LoadLevel): string {
    if (level === "full") return "bg-red-500 ring-1 ring-white/80";
    if (level === "busy") return "bg-orange-500 ring-1 ring-white/80";
    return "bg-emerald-500 ring-1 ring-white/80";
}

/**
 * Mini-maandkalender voor in de sidebar op /planning.
 * Weeknummers links; bezettingsbolletje: groen / oranje (≥60%) / rood (≥90%).
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

    const [loadByDay, setLoadByDay] = useState<Record<string, number>>({});
    const [capacityTick, setCapacityTick] = useState(0);

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

    useEffect(() => {
        function onCapacityRefresh() {
            setCapacityTick((t) => t + 1);
        }
        window.addEventListener(
            "planning-capacity-refresh",
            onCapacityRefresh
        );
        return () => {
            window.removeEventListener(
                "planning-capacity-refresh",
                onCapacityRefresh
            );
        };
    }, []);

    const year = cursor.getFullYear();
    const month = cursor.getMonth();

    useEffect(() => {
        let cancelled = false;

        async function loadCapacity() {
            try {
                const [planningRes, engineersRes] = await Promise.all([
                    fetch("/api/planning", { cache: "no-store" }),
                    fetch("/api/engineers", { cache: "no-store" }),
                ]);
                if (!planningRes.ok) return;

                const data = await planningRes.json();
                const workorders = Array.isArray(data)
                    ? data
                    : Array.isArray(data?.workorders)
                      ? data.workorders
                      : [];
                const events = Array.isArray(data?.events)
                    ? data.events
                    : [];
                const leave = Array.isArray(data?.leave) ? data.leave : [];

                const engineersData = engineersRes.ok
                    ? await engineersRes.json()
                    : [];
                const engineersList = Array.isArray(engineersData)
                    ? engineersData
                    : [];
                const capacityIds = new Set(
                    engineersList
                        .filter((e: { staffKind?: string }) =>
                            countsTowardCapacity(e.staffKind)
                        )
                        .map((e: { id: string }) => e.id)
                );
                const engineerCount = Math.max(1, capacityIds.size);

                const capacityPerDay = engineerCount * UREN_PER_DAG;
                const booked: Record<string, number> = {};
                const add = (iso: string, hours: number) => {
                    if (hours <= 0) return;
                    booked[iso] = (booked[iso] || 0) + hours;
                };
                const countsId = (id: string | null | undefined) =>
                    !!id && capacityIds.has(id);

                for (const item of workorders) {
                    if (!item?.plannedDate) continue;
                    const start = toIsoDate(new Date(item.plannedDate));
                    const end = item.plannedEndDate
                        ? toIsoDate(new Date(item.plannedEndDate))
                        : start;
                    let monteurCount = 0;
                    if (countsId(item.assignedUser?.id)) {
                        monteurCount += 1;
                    }
                    if (Array.isArray(item.extraEngineers)) {
                        for (const extra of item.extraEngineers) {
                            if (countsId(extra?.user?.id)) {
                                monteurCount += 1;
                            }
                        }
                    }
                    if (monteurCount === 0) continue;
                    for (const iso of eachIsoInRange(start, end)) {
                        const h = urenOpDag(
                            item.plannedDate,
                            item.plannedEndDate,
                            iso
                        );
                        add(iso, h * monteurCount);
                    }
                }

                for (const ev of events) {
                    if (!ev?.startAt) continue;
                    // Agenda telt altijd als bezet (ook Algemeen / inlener / stagiaire)
                    const start = toIsoDate(new Date(ev.startAt));
                    const end = ev.endAt
                        ? toIsoDate(new Date(ev.endAt))
                        : start;
                    for (const iso of eachIsoInRange(start, end)) {
                        add(
                            iso,
                            urenOpDag(
                                ev.startAt,
                                ev.endAt,
                                iso,
                                !!ev.allDay
                            )
                        );
                    }
                }

                // Verlof: hele dag van die monteur bezet (alleen eigen monteurs)
                for (const l of leave) {
                    if (!l?.from || !countsId(l.userId)) continue;
                    const from = String(l.from).slice(0, 10);
                    const to = String(l.to || l.from).slice(0, 10);
                    for (const iso of eachIsoInRange(from, to)) {
                        add(iso, UREN_PER_DAG);
                    }
                }

                const next: Record<string, number> = {};
                for (const [iso, hours] of Object.entries(booked)) {
                    next[iso] = Math.min(1, hours / capacityPerDay);
                }

                if (!cancelled) setLoadByDay(next);
            } catch {
                if (!cancelled) setLoadByDay({});
            }
        }

        void loadCapacity();
        return () => {
            cancelled = true;
        };
    }, [year, month, capacityTick]);

    const weeks = useMemo(() => {
        const first = new Date(year, month, 1);
        const start = mondayOf(first);
        const result: {
            week: number;
            days: { date: Date; inMonth: boolean }[];
        }[] = [];
        let cursorDay = new Date(start);

        for (let w = 0; w < 6; w++) {
            const days: { date: Date; inMonth: boolean }[] = [];
            const weekNum = isoWeek(cursorDay);
            let anyInMonth = false;
            for (let i = 0; i < 7; i++) {
                const inMonth = cursorDay.getMonth() === month;
                if (inMonth) anyInMonth = true;
                days.push({
                    date: new Date(cursorDay),
                    inMonth,
                });
                cursorDay.setDate(cursorDay.getDate() + 1);
            }
            if (w > 0 && !anyInMonth) break;
            result.push({ week: weekNum, days });
        }
        return result;
    }, [year, month]);

    function goMonth(delta: number) {
        setCursor(new Date(year, month + delta, 1));
    }

    function selectDay(day: Date) {
        const iso = toIsoDate(day);
        setCursor(new Date(day.getFullYear(), day.getMonth(), 1));
        router.push(`/planning?date=${iso}`);
        // Weekwissel: opnieuw proberen tot de dagrij in het DOM staat
        window.dispatchEvent(
            new CustomEvent("planning-focus-day", { detail: iso })
        );
    }

    function selectWeek(days: { date: Date; inMonth: boolean }[]) {
        const monday = days[0]?.date;
        if (monday) selectDay(monday);
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
                        key={`w-${row.week}-${row.days[0]?.date.toISOString() ?? row.week}`}
                        className="contents"
                    >
                        <button
                            type="button"
                            onClick={() => selectWeek(row.days)}
                            title={`Week ${row.week}`}
                            className="
                                text-[9px] font-semibold text-[#0066FF] tabular-nums
                                self-center rounded hover:bg-[#e8f0ff] cursor-pointer
                            "
                        >
                            {row.week}
                        </button>
                        {row.days.map((cell, i) => {
                            const day = cell.date;
                            const iso = toIsoDate(day);
                            const isToday = iso === todayIso;
                            const isSelected = selectedIso === iso;
                            const isWeekend = i >= 5;
                            const ratio = loadByDay[iso] ?? 0;
                            const level = loadLevel(ratio);
                            const pct = Math.round(ratio * 100);

                            return (
                                <button
                                    key={iso}
                                    type="button"
                                    onClick={() => selectDay(day)}
                                    title={`${iso} · ${pct}% bezet — ga naar weekoverzicht`}
                                    className={`
                                        relative h-8 w-full rounded-lg text-[11px] tabular-nums
                                        font-semibold transition flex flex-col items-center justify-center
                                        cursor-pointer
                                        ${
                                            isSelected
                                                ? "bg-[#0066FF] text-white"
                                                : isToday
                                                  ? "bg-[#D6007E] text-white"
                                                  : !cell.inMonth
                                                    ? "text-slate-300 hover:bg-slate-50 hover:text-slate-500"
                                                    : isWeekend
                                                      ? "text-slate-400 hover:bg-slate-100"
                                                      : "text-slate-800 hover:bg-[#e8f0ff]"
                                        }
                                    `}
                                >
                                    <span className="leading-none">
                                        {day.getDate()}
                                    </span>
                                    <span
                                        className={`
                                            mt-0.5 h-1.5 w-1.5 rounded-full
                                            ${
                                                cell.inMonth
                                                    ? loadColor(level)
                                                    : "bg-transparent"
                                            }
                                        `}
                                        aria-hidden
                                    />
                                </button>
                            );
                        })}
                    </div>
                ))}
            </div>

            <div className="mt-2 flex justify-end px-1">
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
