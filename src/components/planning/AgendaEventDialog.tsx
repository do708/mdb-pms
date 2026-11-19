"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import {
    parseMasterId,
    WEEKDAY_LABELS_NL,
    NTH_LABELS_NL,
} from "@/lib/planning/expandPlanningEvents";
import {
    addAmsterdamCalendarDays,
    amsterdamIsoWeekday,
    amsterdamLocalToDate,
    formatAmsterdamDateIso,
    formatAmsterdamHHmm,
} from "@/lib/datetime/amsterdam";
import {
    PROJECT_PLAN_END,
    PROJECT_PLAN_START,
} from "@/lib/planning/projectPlanHours";

export interface PlanningAgendaEvent {
    id: string;
    title: string;
    notes: string | null;
    startAt: string;
    endAt: string | null;
    allDay: boolean;
    assignedUserId: string | null;
    assignedUser?: { id: string; name: string | null } | null;
    projectId?: string | null;
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

interface ProjectOption {
    id: string;
    number: string;
    name: string;
    status: string;
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
    const hhmm = formatAmsterdamHHmm(d);
    if (hhmm === "00:00") return "";
    return hhmm;
}

function toDateInput(iso: string | null | undefined): string {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return formatAmsterdamDateIso(d);
}

function addDaysIso(iso: string, days: number): string {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
    return formatAmsterdamDateIso(
        addAmsterdamCalendarDays(amsterdamLocalToDate(iso, "12:00"), days)
    );
}

function mondayOfIso(iso: string): string {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
        return formatAmsterdamDateIso(new Date());
    }
    const wd = amsterdamIsoWeekday(amsterdamLocalToDate(iso, "12:00"));
    return addDaysIso(iso, 1 - wd);
}

const WEEKDAY_SHORT = ["ma", "di", "wo", "do", "vr", "za", "zo"];

function weekdayFromDateIso(dateIso: string): number {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateIso)) return 1;
    return amsterdamIsoWeekday(amsterdamLocalToDate(dateIso, "12:00"));
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
    | "yearly"
    | "custom";

const MAANDNAMEN_NL = [
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
    const [dates, setDates] = useState<string[]>([]);
    const [weekAnchor, setWeekAnchor] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [allDay, setAllDay] = useState(false);
    const [assignedUserId, setAssignedUserId] = useState("");
    const [assignedUserIds, setAssignedUserIds] = useState<string[]>([]);
    const [projectId, setProjectId] = useState("");
    const [projects, setProjects] = useState<ProjectOption[]>([]);
    const [notes, setNotes] = useState("");
    const [recurrenceFreq, setRecurrenceFreq] = useState<
        "none" | "weekly" | "monthly" | "monthly_weekday" | "yearly"
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
            const dateIso = toDateInput(seriesStart);
            setTitle(event.title || "");
            setDate(dateIso);
            setDates(dateIso ? [dateIso] : []);
            setWeekAnchor(mondayOfIso(dateIso));
            setAllDay(event.allDay);
            setStartTime(event.allDay ? "" : toTimeInput(seriesStart));
            setEndTime(event.allDay ? "" : toTimeInput(event.endAt));
            setAssignedUserId(event.assignedUserId || "");
            setAssignedUserIds(
                event.assignedUserId ? [event.assignedUserId] : []
            );
            setProjectId(event.projectId || "");
            setNotes(event.notes || "");
            const freq =
                event.recurrenceFreq === "weekly" ||
                event.recurrenceFreq === "monthly" ||
                event.recurrenceFreq === "monthly_weekday" ||
                event.recurrenceFreq === "yearly"
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
            const isSimpleYearly =
                freq === "yearly" &&
                Math.max(1, event.recurrenceInterval || 1) === 1;
            setCustomRecurrence(
                freq !== "none" &&
                    !isSimpleWeekly &&
                    !isSimpleMonthly &&
                    !isSimpleYearly &&
                    freq !== "monthly_weekday"
                    ? true
                    : freq === "weekly" &&
                          Math.max(1, event.recurrenceInterval || 1) > 1
            );
        } else {
            const prefDate =
                prefill?.date || formatAmsterdamDateIso(new Date());
            setTitle("");
            setDate(prefDate);
            setDates(prefDate ? [prefDate] : []);
            setWeekAnchor(mondayOfIso(prefDate));
            setAllDay(false);
            setStartTime(prefill?.startTime || "");
            setEndTime("");
            setAssignedUserId(prefill?.engineerId || "");
            setAssignedUserIds(
                prefill?.engineerId ? [prefill.engineerId] : []
            );
            setProjectId("");
            setNotes("");
            setRecurrenceFreq("none");
            setRecurrenceInterval("1");
            setRecurrenceWeekday(String(weekdayFromDateIso(prefDate) || 4));
            setRecurrenceNth("2");
            setRecurrenceUntil("");
            setCustomRecurrence(false);
        }
    }, [open, event, prefill]);

    useEffect(() => {
        if (!open) return;
        fetch("/api/projects")
            .then((r) => r.json())
            .then((list) => {
                const rows = Array.isArray(list) ? list : [];
                setProjects(
                    rows.filter(
                        (p: ProjectOption) =>
                            p.status === "actief" || p.status === "new"
                    )
                );
            })
            .catch(() => setProjects([]));
    }, [open]);

    if (!open) return null;

    const newWorkorderHref = (() => {
        const params = new URLSearchParams();
        if (date) params.set("date", date);
        if (assignedUserId) params.set("engineer", assignedUserId);
        const q = params.toString();
        return q ? `/workorders/new?${q}` : "/workorders/new";
    })();

    const eventApiId = event?.id ? parseMasterId(event.id) : "";

    const isProjectPlan = Boolean(projectId);
    const selectedProject = projects.find((p) => p.id === projectId) || null;

    function toggleDate(iso: string) {
        setDates((prev) => {
            const next = prev.includes(iso)
                ? prev.filter((d) => d !== iso)
                : [...prev, iso].sort();
            if (next[0]) setDate(next[0]);
            return next;
        });
    }

    function toggleEngineer(id: string) {
        setAssignedUserIds((prev) => {
            const next = prev.includes(id)
                ? prev.filter((x) => x !== id)
                : [...prev, id];
            setAssignedUserId(next[0] || "");
            return next;
        });
    }

    function applyProject(id: string) {
        setProjectId(id);
        const p = projects.find((row) => row.id === id);
        if (p) {
            setTitle(`${p.number} · ${p.name}`);
            setAllDay(false);
            setStartTime((t) => t || PROJECT_PLAN_START);
            setEndTime((t) => t || PROJECT_PLAN_END);
            setRecurrenceFreq("none");
            setCustomRecurrence(false);
        } else {
            setTitle("");
        }
    }

    async function save() {
        const chosenDates = isEdit
            ? date
                ? [date]
                : []
            : dates.length > 0
              ? dates
              : date
                ? [date]
                : [];
        const chosenUsers = isEdit
            ? assignedUserId
                ? [assignedUserId]
                : []
            : assignedUserIds;

        if (!isProjectPlan && !title.trim()) {
            setError("Titel is verplicht");
            return;
        }
        if (chosenDates.length === 0) {
            setError("Kies minstens één datum");
            return;
        }
        if (isProjectPlan && chosenUsers.length === 0) {
            setError("Selecteer minimaal één monteur");
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
                title: title.trim() || undefined,
                date: chosenDates[0],
                dates: chosenDates,
                allDay: isProjectPlan ? false : allDay,
                startTime:
                    isProjectPlan || !allDay
                        ? startTime || (isProjectPlan ? PROJECT_PLAN_START : null)
                        : null,
                endTime:
                    isProjectPlan || !allDay
                        ? endTime || (isProjectPlan ? PROJECT_PLAN_END : null)
                        : null,
                assignedUserId: chosenUsers[0] || null,
                userIds: chosenUsers,
                projectId: projectId || null,
                notes: notes.trim() || null,
                recurrenceFreq:
                    isProjectPlan || chosenDates.length > 1
                        ? "none"
                        : recurrenceFreq,
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
                className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="sticky top-0 z-10 border-b border-slate-100 bg-white">
                    <div className="flex items-center justify-between gap-3 px-5 py-4">
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
                    {!isEdit && (
                        <div className="px-5 pb-4">
                            <Link
                                href={newWorkorderHref}
                                onClick={onClose}
                                className="
                                    inline-flex items-center justify-center
                                    bg-[#d6007e] px-4 py-2 rounded-xl
                                    text-sm font-bold text-white
                                    hover:bg-[#b8006a]
                                "
                            >
                                Nieuwe opdracht
                            </Link>
                        </div>
                    )}
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
                            Lopende projecten
                        </span>
                        <select
                            value={projectId}
                            onChange={(e) => applyProject(e.target.value)}
                            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                        >
                            <option value="">Geen project (vrij item)</option>
                            {projects.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.number} · {p.name}
                                </option>
                            ))}
                        </select>
                        {isProjectPlan ? (
                            <p className="mt-1 text-xs text-slate-500">
                                Komt in de urenvakken van de gekozen monteurs
                                (niet in de dagbalk).
                            </p>
                        ) : null}
                    </label>

                    {!isProjectPlan ? (
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
                    ) : selectedProject ? (
                        <p className="text-sm font-semibold text-slate-800">
                            {selectedProject.number} · {selectedProject.name}
                        </p>
                    ) : null}

                    {isEdit ? (
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
                    ) : (
                        <div>
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-medium text-slate-600">
                                    Dagen *
                                </span>
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setWeekAnchor(
                                                addDaysIso(
                                                    weekAnchor ||
                                                        mondayOfIso(date),
                                                    -7
                                                )
                                            )
                                        }
                                        className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                    >
                                        Vorige week
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setWeekAnchor(
                                                addDaysIso(
                                                    weekAnchor ||
                                                        mondayOfIso(date),
                                                    7
                                                )
                                            )
                                        }
                                        className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                    >
                                        Volgende
                                    </button>
                                </div>
                            </div>
                            <p className="mt-1 text-xs text-slate-500">
                                Klik dagen aan. Meerdere dagen tegelijk
                                mogelijk.
                            </p>
                            <div className="mt-2 grid grid-cols-7 gap-1.5">
                                {Array.from({ length: 14 }, (_, i) => {
                                    const iso = addDaysIso(
                                        weekAnchor || mondayOfIso(date),
                                        i
                                    );
                                    const selected = dates.includes(iso);
                                    const wd = i % 7;
                                    const dayNum = iso.slice(8);
                                    return (
                                        <button
                                            key={iso}
                                            type="button"
                                            onClick={() => toggleDate(iso)}
                                            className={`
                                                rounded-xl border px-1 py-2 text-center
                                                min-h-[52px]
                                                ${
                                                    selected
                                                        ? "bg-[#0066FF] border-[#0066FF] text-white"
                                                        : "bg-white border-slate-200 text-slate-800 hover:bg-slate-50"
                                                }
                                            `}
                                        >
                                            <span className="block text-[10px] uppercase opacity-80">
                                                {WEEKDAY_SHORT[wd]}
                                            </span>
                                            <span className="block text-sm font-bold leading-none mt-0.5">
                                                {Number(dayNum)}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                            {dates.length > 0 ? (
                                <p className="mt-1.5 text-xs text-slate-500">
                                    {dates.length} dag
                                    {dates.length === 1 ? "" : "en"} gekozen
                                </p>
                            ) : null}
                        </div>
                    )}

                    {!isProjectPlan ? (
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                            type="checkbox"
                            checked={allDay}
                            onChange={(e) => setAllDay(e.target.checked)}
                            className="rounded border-slate-300"
                        />
                        Hele dag
                    </label>
                    ) : null}

                    {(!allDay || isProjectPlan) && (
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

                    {isEdit ? (
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
                    ) : (
                    <div>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-xs font-medium text-slate-600">
                                Monteurs
                                {isProjectPlan ? " *" : " (meerdere mogelijk)"}
                            </span>
                            {engineers.length > 0 ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        const ids = engineers.map((e) => e.id);
                                        const all =
                                            assignedUserIds.length ===
                                            ids.length;
                                        setAssignedUserIds(all ? [] : ids);
                                        setAssignedUserId(
                                            all ? "" : ids[0] || ""
                                        );
                                    }}
                                    className="text-xs font-medium text-[#d6007e]"
                                >
                                    {assignedUserIds.length ===
                                    engineers.length
                                        ? "Niets selecteren"
                                        : "Alles selecteren"}
                                </button>
                            ) : null}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {engineers.map((eng) => {
                                const checked = assignedUserIds.includes(
                                    eng.id
                                );
                                return (
                                    <label
                                        key={eng.id}
                                        className={`
                                            inline-flex items-center gap-2
                                            px-3 py-2 rounded-xl border
                                            cursor-pointer text-sm min-h-[44px]
                                            ${
                                                checked
                                                    ? "bg-[#e8f0ff] border-[#0066FF] text-[#0066FF]"
                                                    : "bg-white border-slate-200"
                                            }
                                        `}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() =>
                                                toggleEngineer(eng.id)
                                            }
                                            className="rounded"
                                        />
                                        {eng.name || "Monteur"}
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                    )}

                    {isEdit || (!isProjectPlan && dates.length <= 1) ? (
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
                                            : recurrenceFreq === "yearly"
                                              ? "yearly"
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
                                                } else if (v === "yearly") {
                                                    setCustomRecurrence(
                                                        false
                                                    );
                                                    setRecurrenceFreq(
                                                        "yearly"
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
                                            <option value="yearly">
                                                Jaarlijks op {dayNum || "…"}{" "}
                                                {date
                                                    ? MAANDNAMEN_NL[
                                                          Math.max(
                                                              0,
                                                              Number(
                                                                  date.split(
                                                                      "-"
                                                                  )[1]
                                                              ) - 1
                                                          )
                                                      ] || ""
                                                    : ""}
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
                                                                | "yearly"
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
                                                    <option value="yearly">
                                                        Jaarlijks
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
                                                    "monthly" ||
                                                recurrenceFreq ===
                                                    "yearly") && (
                                                <label className="block">
                                                    <span className="text-xs font-medium text-slate-600">
                                                        Elke N{" "}
                                                        {recurrenceFreq ===
                                                        "weekly"
                                                            ? "weken"
                                                            : recurrenceFreq ===
                                                                "yearly"
                                                              ? "jaren"
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
                                                            : recurrenceFreq ===
                                                              "yearly"
                                                              ? "jaar"
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
                    ) : null}

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

                <div className="border-t border-slate-100 px-5 py-4">
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
                </div>
            </div>
        </div>
    );
}
