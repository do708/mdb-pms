"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import {
    parseMasterId,
    jsDayToIso,
    WEEKDAY_LABELS_NL,
    NTH_LABELS_NL,
} from "@/lib/planning/expandPlanningEvents";

export interface PlanningAgendaEvent {
    id: string;
    title: string;
    notes: string | null;
    startAt: string;
    endAt: string | null;
    allDay: boolean;
    assignedUserId: string | null;
    assignedUser?: { id: string; name: string | null } | null;
    recurrenceFreq?: string | null;
    recurrenceInterval?: number | null;
    recurrenceWeekday?: number | null;
    recurrenceNth?: number | null;
    recurrenceUntil?: string | null;
    seriesStartAt?: string | null;
    masterId?: string | null;
    isOccurrence?: boolean;
}


interface EngineerOption {
    id: string;
    name: string | null;
}

export interface AgendaEventPrefill {
    date: string;
    startTime?: string | null;
    engineerId?: string | null;
}

interface AgendaEventDialogProps {
    open: boolean;
    onClose: () => void;
    engineers: EngineerOption[];
    prefill?: AgendaEventPrefill | null;
    event?: PlanningAgendaEvent | null;
    onSaved: () => void;
}

function toTimeInput(iso: string | null | undefined): string {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    if (d.getHours() === 0 && d.getMinutes() === 0) return "";
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function toDateInput(iso: string | null | undefined): string {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function weekdayFromDateIso(dateIso: string): number {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateIso)) return 1;
    const [y, m, d] = dateIso.split("-").map(Number);
    return jsDayToIso(new Date(y, m - 1, d).getDay());
}

/** Welke "N-de" weekdag is deze datum in de maand (1–4 of -1 = laatste). */
function nthOfMonthFromDateIso(dateIso: string): number {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateIso)) return 1;
    const [y, m, d] = dateIso.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    const weekday = date.getDay();
    let nth = 0;
    for (let day = 1; day <= d; day++) {
        if (new Date(y, m - 1, day).getDay() === weekday) nth += 1;
    }
    const lastDay = new Date(y, m, 0).getDate();
    let isLast = true;
    for (let day = d + 1; day <= lastDay; day++) {
        if (new Date(y, m - 1, day).getDay() === weekday) {
            isLast = false;
            break;
        }
    }
    if (isLast) return -1;
    return Math.min(4, Math.max(1, nth));
}

type RecurrencePreset =
    | "none"
    | "weekly"
    | "monthly_weekday"
    | "monthly"
    | "custom";

function capitalize(s: string): string {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

export default function AgendaEventDialog({
    open,
    onClose,
    engineers,
    prefill = null,
    event = null,
    onSaved,
}: AgendaEventDialogProps) {
    const isEdit = Boolean(event?.id);

    const [title, setTitle] = useState("");
    const [date, setDate] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [allDay, setAllDay] = useState(false);
    const [assignedUserId, setAssignedUserId] = useState("");
    const [notes, setNotes] = useState("");
    const [recurrenceFreq, setRecurrenceFreq] = useState<
        "none" | "weekly" | "monthly" | "monthly_weekday"
    >("none");
    const [recurrenceInterval, setRecurrenceInterval] = useState("1");
    const [recurrenceWeekday, setRecurrenceWeekday] = useState("4");
    const [recurrenceNth, setRecurrenceNth] = useState("2");
    const [recurrenceUntil, setRecurrenceUntil] = useState("");
    const [customRecurrence, setCustomRecurrence] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!open) return;
        setError(null);
        if (event) {
            const seriesStart = event.seriesStartAt || event.startAt;
            setTitle(event.title || "");
            setDate(toDateInput(seriesStart));
            setAllDay(event.allDay);
            setStartTime(event.allDay ? "" : toTimeInput(seriesStart));
            setEndTime(event.allDay ? "" : toTimeInput(event.endAt));
            setAssignedUserId(event.assignedUserId || "");
            setNotes(event.notes || "");
            const freq =
                event.recurrenceFreq === "weekly" ||
                event.recurrenceFreq === "monthly" ||
                event.recurrenceFreq === "monthly_weekday"
                    ? event.recurrenceFreq
                    : "none";
            setRecurrenceFreq(freq);
            setRecurrenceInterval(
                String(Math.max(1, event.recurrenceInterval || 1))
            );
            setRecurrenceWeekday(
                String(
                    event.recurrenceWeekday &&
                        event.recurrenceWeekday >= 1 &&
                        event.recurrenceWeekday <= 7
                        ? event.recurrenceWeekday
                        : weekdayFromDateIso(toDateInput(seriesStart))
                )
            );
            setRecurrenceNth(
                String(
                    event.recurrenceNth === -1
                        ? -1
                        : event.recurrenceNth &&
                            event.recurrenceNth >= 1 &&
                            event.recurrenceNth <= 4
                          ? event.recurrenceNth
                          : 2
                )
            );
            setRecurrenceUntil(
                event.recurrenceUntil
                    ? toDateInput(event.recurrenceUntil)
                    : ""
            );
            const isSimpleWeekly =
                freq === "weekly" &&
                Math.max(1, event.recurrenceInterval || 1) === 1;
            const isSimpleMonthly =
                freq === "monthly" &&
                Math.max(1, event.recurrenceInterval || 1) === 1;
            setCustomRecurrence(
                freq !== "none" &&
                    !isSimpleWeekly &&
                    !isSimpleMonthly &&
                    freq !== "monthly_weekday"
                    ? true
                    : freq === "weekly" &&
                          Math.max(1, event.recurrenceInterval || 1) > 1
            );
        } else {
            const prefDate = prefill?.date || "";
            setTitle("");
            setDate(prefDate);
            setAllDay(false);
            setStartTime(prefill?.startTime || "");
            setEndTime("");
            setAssignedUserId(prefill?.engineerId || "");
            setNotes("");
            setRecurrenceFreq("none");
            setRecurrenceInterval("1");
            setRecurrenceWeekday(String(weekdayFromDateIso(prefDate) || 4));
            setRecurrenceNth("2");
            setRecurrenceUntil("");
            setCustomRecurrence(false);
        }
    }, [open, event, prefill]);

    if (!open) return null;

    const newWorkorderHref = (() => {
        const params = new URLSearchParams();
        if (date) params.set("date", date);
        if (assignedUserId) params.set("engineer", assignedUserId);
        const q = params.toString();
        return q ? `/workorders/new?${q}` : "/workorders/new";
    })();

    const eventApiId = event?.id ? parseMasterId(event.id) : "";

    async function save() {
        if (!title.trim()) {
            setError("Titel is verplicht");
            return;
        }
        if (!date) {
            setError("Datum is verplicht");
            return;
        }

        const interval = Math.max(
            1,
            Math.min(52, parseInt(recurrenceInterval, 10) || 1)
        );

        setSaving(true);
        setError(null);
        try {
            const payload = {
                title: title.trim(),
                date,
                allDay,
                startTime: allDay ? null : startTime || null,
                endTime: allDay ? null : endTime || null,
                assignedUserId: assignedUserId || null,
                notes: notes.trim() || null,
                recurrenceFreq,
                recurrenceInterval: recurrenceFreq === "none" ? 1 : interval,
                recurrenceWeekday:
                    recurrenceFreq === "weekly" ||
                    recurrenceFreq === "monthly_weekday"
                        ? Number(recurrenceWeekday)
                        : null,
                recurrenceNth:
                    recurrenceFreq === "monthly_weekday"
                        ? Number(recurrenceNth)
                        : null,
                recurrenceUntil:
                    recurrenceFreq === "none" ? null : recurrenceUntil || null,
            };

            const response = await fetch(
                isEdit
                    ? `/api/planning/events/${eventApiId}`
                    : "/api/planning/events",
                {
                    method: isEdit ? "PATCH" : "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                }
            );

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                const base =
                    typeof data.error === "string"
                        ? data.error
                        : "Opslaan mislukt";
                const detail =
                    typeof data.detail === "string" ? data.detail : "";
                setError(detail ? `${base}\n${detail}` : base);
                return;
            }

            onSaved();
            onClose();
        } catch {
            setError("Opslaan mislukt");
        } finally {
            setSaving(false);
        }
    }

    async function remove() {
        if (!event?.id) return;
        const isSeries =
            event.recurrenceFreq && event.recurrenceFreq !== "none";
        if (
            !window.confirm(
                isSeries
                    ? "Hele reeks verwijderen (alle herhalingen)?"
                    : "Agenda-item verwijderen?"
            )
        ) {
            return;
        }

        setDeleting(true);
        setError(null);
        try {
            const response = await fetch(
                `/api/planning/events/${eventApiId}`,
                { method: "DELETE" }
            );
            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                setError(
                    typeof data.error === "string"
                        ? data.error
                        : "Verwijderen mislukt"
                );
                return;
            }
            onSaved();
            onClose();
        } catch {
            setError("Verwijderen mislukt");
        } finally {
            setDeleting(false);
        }
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={onClose}
        >
            <div
                className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sticky top-0 bg-white z-10">
                    <h2 className="text-lg font-bold text-slate-900">
                        {isEdit ? "Agenda-item bewerken" : "Agenda-item"}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full bg-slate-100 p-2 text-slate-600 hover:bg-slate-200"
                        aria-label="Sluiten"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="space-y-4 px-5 py-4">
                    {isEdit &&
                        event?.recurrenceFreq &&
                        event.recurrenceFreq !== "none" && (
                            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                                Wijzigingen gelden voor de hele reeks.
                            </p>
                        )}

                    <label className="block">
                        <span className="text-xs font-medium text-slate-600">
                            Titel *
                        </span>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            autoComplete="off"
                            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            autoFocus
                        />
                    </label>

                    <label className="block">
                        <span className="text-xs font-medium text-slate-600">
                            Datum *
                        </span>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            autoComplete="off"
                            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        />
                    </label>

                    <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                            type="checkbox"
                            checked={allDay}
                            onChange={(e) => setAllDay(e.target.checked)}
                            className="rounded border-slate-300"
                        />
                        Hele dag
                    </label>

                    {!allDay && (
                        <div className="grid grid-cols-2 gap-3">
                            <label className="block">
                                <span className="text-xs font-medium text-slate-600">
                                    Starttijd
                                </span>
                                <input
                                    type="time"
                                    value={startTime}
                                    onChange={(e) =>
                                        setStartTime(e.target.value)
                                    }
                                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                />
                            </label>
                            <label className="block">
                                <span className="text-xs font-medium text-slate-600">
                                    Eindtijd
                                </span>
                                <input
                                    type="time"
                                    value={endTime}
                                    onChange={(e) =>
                                        setEndTime(e.target.value)
                                    }
                                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                />
                            </label>
                        </div>
                    )}

                    <label className="block">
                        <span className="text-xs font-medium text-slate-600">
                            Monteur (optioneel)
                        </span>
                        <select
                            value={assignedUserId}
                            onChange={(e) =>
                                setAssignedUserId(e.target.value)
                            }
                            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                        >
                            <option value="">Geen monteur</option>
                            {engineers.map((e) => (
                                <option key={e.id} value={e.id}>
                                    {e.name || "Monteur"}
                                </option>
                            ))}
                        </select>
                    </label>

                    <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                        {(() => {
                            const wd = weekdayFromDateIso(date || "");
                            const wdLabel = capitalize(
                                WEEKDAY_LABELS_NL[wd] || "dag"
                            );
                            const nth = nthOfMonthFromDateIso(date || "");
                            const nthLabel =
                                NTH_LABELS_NL[nth] || "1e";
                            const dayNum = date
                                ? Number(date.split("-")[2])
                                : 0;

                            const selectValue: RecurrencePreset =
                                customRecurrence
                                    ? "custom"
                                    : recurrenceFreq === "none"
                                      ? "none"
                                      : recurrenceFreq === "weekly"
                                        ? "weekly"
                                        : recurrenceFreq ===
                                            "monthly_weekday"
                                          ? "monthly_weekday"
                                          : recurrenceFreq === "monthly"
                                            ? "monthly"
                                            : "custom";

                            return (
                                <>
                                    <label className="block">
                                        <span className="text-xs font-medium text-slate-600">
                                            Herhaling
                                        </span>
                                        <select
                                            value={selectValue}
                                            onChange={(e) => {
                                                const v = e.target
                                                    .value as RecurrencePreset;
                                                const w =
                                                    weekdayFromDateIso(
                                                        date
                                                    ) || 1;
                                                const n =
                                                    nthOfMonthFromDateIso(
                                                        date
                                                    );
                                                if (v === "none") {
                                                    setCustomRecurrence(
                                                        false
                                                    );
                                                    setRecurrenceFreq(
                                                        "none"
                                                    );
                                                    setRecurrenceInterval(
                                                        "1"
                                                    );
                                                } else if (v === "weekly") {
                                                    setCustomRecurrence(
                                                        false
                                                    );
                                                    setRecurrenceFreq(
                                                        "weekly"
                                                    );
                                                    setRecurrenceWeekday(
                                                        String(w)
                                                    );
                                                    setRecurrenceInterval(
                                                        "1"
                                                    );
                                                } else if (
                                                    v === "monthly_weekday"
                                                ) {
                                                    setCustomRecurrence(
                                                        false
                                                    );
                                                    setRecurrenceFreq(
                                                        "monthly_weekday"
                                                    );
                                                    setRecurrenceWeekday(
                                                        String(w)
                                                    );
                                                    setRecurrenceNth(
                                                        String(n)
                                                    );
                                                    setRecurrenceInterval(
                                                        "1"
                                                    );
                                                } else if (v === "monthly") {
                                                    setCustomRecurrence(
                                                        false
                                                    );
                                                    setRecurrenceFreq(
                                                        "monthly"
                                                    );
                                                    setRecurrenceInterval(
                                                        "1"
                                                    );
                                                } else {
                                                    setCustomRecurrence(
                                                        true
                                                    );
                                                    if (
                                                        recurrenceFreq ===
                                                        "none"
                                                    ) {
                                                        setRecurrenceFreq(
                                                            "weekly"
                                                        );
                                                        setRecurrenceWeekday(
                                                            String(w)
                                                        );
                                                        setRecurrenceInterval(
                                                            "2"
                                                        );
                                                    }
                                                }
                                            }}
                                            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                                        >
                                            <option value="none">
                                                Niet herhaald
                                            </option>
                                            <option value="weekly">
                                                Wekelijks op{" "}
                                                {wdLabel.toLowerCase()}
                                            </option>
                                            <option value="monthly_weekday">
                                                Maandelijks op de {nthLabel}{" "}
                                                {wdLabel.toLowerCase()}
                                            </option>
                                            <option value="monthly">
                                                Maandelijks op dag{" "}
                                                {dayNum || "…"}
                                            </option>
                                            <option value="custom">
                                                Aangepast…
                                            </option>
                                        </select>
                                    </label>

                                    {customRecurrence && (
                                        <>
                                            <label className="block">
                                                <span className="text-xs font-medium text-slate-600">
                                                    Type
                                                </span>
                                                <select
                                                    value={
                                                        recurrenceFreq ===
                                                        "none"
                                                            ? "weekly"
                                                            : recurrenceFreq
                                                    }
                                                    onChange={(e) =>
                                                        setRecurrenceFreq(
                                                            e.target
                                                                .value as
                                                                | "weekly"
                                                                | "monthly"
                                                                | "monthly_weekday"
                                                        )
                                                    }
                                                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                                                >
                                                    <option value="weekly">
                                                        Wekelijks
                                                    </option>
                                                    <option value="monthly_weekday">
                                                        N-de weekdag / maand
                                                    </option>
                                                    <option value="monthly">
                                                        Maandelijks (datum)
                                                    </option>
                                                </select>
                                            </label>

                                            {(recurrenceFreq === "weekly" ||
                                                recurrenceFreq ===
                                                    "monthly_weekday") && (
                                                <label className="block">
                                                    <span className="text-xs font-medium text-slate-600">
                                                        Weekdag
                                                    </span>
                                                    <select
                                                        value={
                                                            recurrenceWeekday
                                                        }
                                                        onChange={(e) =>
                                                            setRecurrenceWeekday(
                                                                e.target
                                                                    .value
                                                            )
                                                        }
                                                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                                                    >
                                                        <option value="1">
                                                            Maandag
                                                        </option>
                                                        <option value="2">
                                                            Dinsdag
                                                        </option>
                                                        <option value="3">
                                                            Woensdag
                                                        </option>
                                                        <option value="4">
                                                            Donderdag
                                                        </option>
                                                        <option value="5">
                                                            Vrijdag
                                                        </option>
                                                        <option value="6">
                                                            Zaterdag
                                                        </option>
                                                        <option value="7">
                                                            Zondag
                                                        </option>
                                                    </select>
                                                </label>
                                            )}

                                            {recurrenceFreq ===
                                                "monthly_weekday" && (
                                                <label className="block">
                                                    <span className="text-xs font-medium text-slate-600">
                                                        Welke in de maand
                                                    </span>
                                                    <select
                                                        value={
                                                            recurrenceNth
                                                        }
                                                        onChange={(e) =>
                                                            setRecurrenceNth(
                                                                e.target
                                                                    .value
                                                            )
                                                        }
                                                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                                                    >
                                                        <option value="1">
                                                            1e
                                                        </option>
                                                        <option value="2">
                                                            2e
                                                        </option>
                                                        <option value="3">
                                                            3e
                                                        </option>
                                                        <option value="4">
                                                            4e
                                                        </option>
                                                        <option value="-1">
                                                            Laatste
                                                        </option>
                                                    </select>
                                                </label>
                                            )}

                                            {(recurrenceFreq === "weekly" ||
                                                recurrenceFreq ===
                                                    "monthly") && (
                                                <label className="block">
                                                    <span className="text-xs font-medium text-slate-600">
                                                        Elke N{" "}
                                                        {recurrenceFreq ===
                                                        "weekly"
                                                            ? "weken"
                                                            : "maanden"}
                                                    </span>
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        max={52}
                                                        value={
                                                            recurrenceInterval
                                                        }
                                                        onChange={(e) =>
                                                            setRecurrenceInterval(
                                                                e.target
                                                                    .value
                                                            )
                                                        }
                                                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                                                    />
                                                    <span className="text-[11px] text-slate-500">
                                                        Bijv. 2 = om de{" "}
                                                        {recurrenceFreq ===
                                                        "weekly"
                                                            ? "week"
                                                            : "maand"}
                                                    </span>
                                                </label>
                                            )}
                                        </>
                                    )}

                                    {recurrenceFreq !== "none" && (
                                        <label className="block">
                                            <span className="text-xs font-medium text-slate-600">
                                                Einddatum (optioneel)
                                            </span>
                                            <input
                                                type="date"
                                                value={recurrenceUntil}
                                                onChange={(e) =>
                                                    setRecurrenceUntil(
                                                        e.target.value
                                                    )
                                                }
                                                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                                            />
                                        </label>
                                    )}
                                </>
                            );
                        })()}
                    </div>

                    <label className="block">
                        <span className="text-xs font-medium text-slate-600">
                            Notitie
                        </span>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm resize-y"
                            placeholder="Optioneel"
                        />
                    </label>

                    {error && (
                        <p className="text-sm text-red-600 whitespace-pre-wrap">
                            {error}
                        </p>
                    )}
                </div>

                <div className="space-y-3 border-t border-slate-100 px-5 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={save}
                            disabled={saving || deleting}
                            className="
                                rounded-lg bg-[#0066FF] px-4 py-2
                                text-sm font-semibold text-white
                                hover:bg-[#0052cc] disabled:opacity-50
                            "
                        >
                            {saving ? "Opslaan…" : "Opslaan"}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={saving || deleting}
                            className="
                                rounded-lg border border-slate-300 bg-white
                                px-4 py-2 text-sm font-medium text-slate-700
                                hover:bg-slate-50 disabled:opacity-50
                            "
                        >
                            Annuleren
                        </button>
                        {isEdit && (
                            <button
                                type="button"
                                onClick={remove}
                                disabled={saving || deleting}
                                className="
                                    ml-auto rounded-lg border border-red-200
                                    bg-red-50 px-3 py-2 text-sm font-medium
                                    text-red-700 hover:bg-red-100
                                    disabled:opacity-50
                                "
                            >
                                {deleting ? "Verwijderen…" : "Verwijderen"}
                            </button>
                        )}
                    </div>

                    {!isEdit && (
                        <p className="text-xs text-slate-500">
                            Of{" "}
                            <Link
                                href={newWorkorderHref}
                                className="font-medium text-[#0066FF] hover:underline"
                                onClick={onClose}
                            >
                                Nieuwe opdracht…
                            </Link>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
