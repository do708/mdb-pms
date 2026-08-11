"use client";

import { useEffect, useState, Suspense } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { useSession } from "next-auth/react";

import Calendar from "@/components/planning/Calendar";

import WeekView from "@/components/planning/WeekView";
import EngineerMobileSchedule from "@/components/planning/EngineerMobileSchedule";
import AgendaEventDialog, {
    type AgendaEventPrefill,
    type PlanningAgendaEvent,
} from "@/components/planning/AgendaEventDialog";
import { WorkorderStatusIconLegend } from "@/components/planning/PlanningStatusIcon";
import {
    PageShell,
    SpecListRow,
    SpecPanel,
} from "@/components/ui/SpecLayout";
import {
    clearPendingSchedule,
    getPendingSchedule,
    type PendingSchedule,
} from "@/lib/planning/pendingSchedule";



interface PlanningItem {

    id:string;

    number:string;

    title:string;

    status:string;

    plannedDate:string | null;

    plannedEndDate:string | null;


    location:string | null;

    customer:{

        name:string;

        color:string;

    } | null;


    project:{

        name:string;

        customer:{

            name:string;

            color:string;

        };

    } | null;


    assignedUser:{

        id:string;

        name:string | null;

    } | null;

}



interface Conflict {

    user:string;

    date:string;

    workorders:string[];

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





export default function PlanningPage() {
    return (
        <Suspense fallback={null}>
            <PlanningPageContent />
        </Suspense>
    );
}

function PlanningPageContent(){


    const router =
        useRouter();

    const searchParams = useSearchParams();


    const { data:session, status:sessionStatus } =
        useSession();


    // Monteur mag de planning inzien maar niet wijzigen
    const canEdit =
        session?.user?.role !== "engineer";

    const isEngineer =
        session?.user?.role === "engineer";


    const [items,setItems] =
        useState<PlanningItem[]>([]);


    const [leave,setLeave] =
        useState<any[]>([]);


    const [events,setEvents] =
        useState<PlanningAgendaEvent[]>([]);


    const [agendaOpen,setAgendaOpen] =
        useState(false);


    const [agendaPrefill,setAgendaPrefill] =
        useState<AgendaEventPrefill | null>(null);


    const [agendaEdit,setAgendaEdit] =
        useState<PlanningAgendaEvent | null>(null);


    const [engineers,setEngineers] =
        useState<any[]>([]);



    const [conflicts,setConflicts] =
        useState<Conflict[]>([]);



    const [view,setView] =
        useState<"month"|"week">("week");


    const [pending,setPending] =
        useState<PendingSchedule | null>(null);


    const [scheduling,setScheduling] =
        useState(false);

    /** Voorstel vóór “Hier inplannen”: monteurs, starttijd + duur. */
    const [pendingAantalTekst, setPendingAantalTekst] =
        useState("1");

    const [pendingStartTime, setPendingStartTime] =
        useState("08:00");

    const [pendingDuurTekst, setPendingDuurTekst] =
        useState("4");

    function pendingAantalMonteurs(): number {
        const n = Number.parseInt(pendingAantalTekst, 10);
        if (!Number.isFinite(n) || n < 1) return 1;
        return Math.min(8, n);
    }

    function pendingDuurUren(): number {
        const n = Number.parseFloat(pendingDuurTekst.replace(",", "."));
        if (!Number.isFinite(n) || n <= 0) return 4;
        return Math.min(16, n);
    }

    /** Slot-keuzes via “Hier inplannen” (1× per monteur). */
    const [pendingPicks, setPendingPicks] =
        useState<{
            dateIso: string;
            engineerId: string;
            startHour: number;
        }[]>([]);


    // Maandag van de getoonde week (voor de week-navigatie)
    const [weekStart,setWeekStart] =
        useState<Date>(()=>{
            const d = new Date();
            d.setDate(d.getDate() - d.getDay() + 1);
            d.setHours(0,0,0,0);
            return d;
        });


    function shiftWeek(deltaWeeks:number){
        setWeekStart(previous=>{
            const d = new Date(previous);
            d.setDate(d.getDate() + deltaWeeks * 7);
            return d;
        });
    }


    function thisWeek(){
        const d = new Date();
        d.setDate(d.getDate() - d.getDay() + 1);
        d.setHours(0,0,0,0);
        setWeekStart(d);
        router.replace("/planning");
    }


    // Mini-maand in sidebar: ?date=YYYY-MM-DD → die week tonen
    useEffect(() => {
        const raw = searchParams.get("date");
        if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return;
        const [y, m, d] = raw.split("-").map(Number);
        const date = new Date(y, m - 1, d);
        if (Number.isNaN(date.getTime())) return;
        date.setHours(0, 0, 0, 0);
        const monday = new Date(date);
        const dow = monday.getDay();
        monday.setDate(monday.getDate() - (dow === 0 ? 6 : dow - 1));
        setWeekStart(monday);
        setView("week");
    }, [searchParams]);



    const [loading,setLoading] =
        useState(true);






    async function loadPlanning(){


        const planningResponse =
            await fetch("/api/planning");


        const planningData =
            await planningResponse.json();





        const conflictResponse =
            await fetch("/api/planning/conflicts");


        const conflictData =
            await conflictResponse.json();





        // De API geeft nu { workorders, leave } terug (met terugvalop een array)
        const workordersData =
            Array.isArray(planningData)
            ?
            planningData
            :
            (planningData?.workorders ?? []);


        setItems(workordersData);


        setLeave(
            Array.isArray(planningData?.leave)
            ?
            planningData.leave
            :
            []
        );


        setEvents(
            Array.isArray(planningData?.events)
            ?
            planningData.events
            :
            []
        );


        const engineersResponse =
            await fetch("/api/engineers");

        const engineersData =
            await engineersResponse.json();

        const allEngineers =
            Array.isArray(engineersData)
            ?
            engineersData
            :
            [];

        // API filtert al voor monteurs; client-side extra zekerheid
        // (ook als sessie net geladen is).
        setEngineers(
            isEngineer && session?.user?.id
            ?
            allEngineers.filter(
                (e: { id: string }) => e.id === session.user.id
            )
            :
            allEngineers
        );


        setConflicts(
            Array.isArray(conflictData)
            ?
            conflictData
            :
            []
        );


        setLoading(false);


    }


    function formatHourForAgenda(hour: number): string {
        const h = Math.floor(hour);
        const m = Math.round((hour - h) * 60);
        return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }


    function openCreateAgenda(args: {
        dateIso: string;
        hour?: number;
        engineerId?: string | null;
    }) {
        setAgendaEdit(null);
        setAgendaPrefill({
            date: args.dateIso,
            startTime:
                typeof args.hour === "number"
                    ? formatHourForAgenda(args.hour)
                    : null,
            engineerId: args.engineerId ?? null,
        });
        setAgendaOpen(true);
    }


    function openEditAgenda(event: PlanningAgendaEvent) {
        setAgendaPrefill(null);
        setAgendaEdit(event);
        setAgendaOpen(true);
    }


    useEffect(()=>{
        // Wacht tot de sessie bekend is, anders toont de weekview
        // kort (of blijvend) alle monteurs vóór de rol-filter.
        if (sessionStatus === "loading") {
            return;
        }

        loadPlanning();
    }, [sessionStatus, session?.user?.id, session?.user?.role]);


    useEffect(()=>{
        setPending(getPendingSchedule());
    },[]);


    useEffect(()=>{
        if(pending){
            setView("week");
        }
    },[pending]);







    async function updatePlanning(
        id: string,
        date: string
    ) {
        const response = await fetch(`/api/workorders/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                plannedDate: date,
            }),
        });

        if (!response.ok) {
            alert("Planning bijwerken mislukt");
        }

        await loadPlanning();
    }

    function formatHour(hour: number): string {
        const h = Math.floor(hour);
        const m = Math.round((hour - h) * 60);
        return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }

    function parseTimeToHour(value: string): number | null {
        const m = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
        if (!m) return null;
        const h = Number(m[1]);
        const min = Number(m[2]);
        if (
            !Number.isFinite(h)
            || !Number.isFinite(min)
            || h < 0
            || h > 23
            || min < 0
            || min > 59
        ) {
            return null;
        }
        return h + min / 60;
    }

    function voorstelGeldig(): boolean {
        const aantal = pendingAantalMonteurs();
        const duur = pendingDuurUren();
        const startHour = parseTimeToHour(pendingStartTime);
        return (
            pendingAantalTekst.trim() !== ""
            && pendingDuurTekst.trim() !== ""
            && aantal >= 1
            && aantal <= 8
            && duur > 0
            && duur <= 16
            && startHour !== null
        );
    }

    function resetPendingVoorstel() {
        setPendingAantalTekst("1");
        setPendingStartTime("08:00");
        setPendingDuurTekst("4");
        setPendingPicks([]);
    }

    /** Pending aanvraag/klus: klik “Hier inplannen” per monteur (aantal×). */
    function schedulePending(args: {
        dateIso: string;
        hour?: number;
        engineerId: string;
    }) {
        const current = pending || getPendingSchedule();
        if (!current || scheduling || !canEdit) {
            return;
        }

        if (!voorstelGeldig()) {
            alert(
                "Vul eerst aantal monteurs, starttijd en duur (uren) in het voorstel hierboven."
            );
            return;
        }

        let startHour = parseTimeToHour(pendingStartTime);
        if (
            typeof args.hour === "number"
            && Number.isFinite(args.hour)
            && args.hour >= 6
            && args.hour <= 20
        ) {
            startHour = args.hour;
            setPendingStartTime(formatHour(args.hour));
        }

        if (startHour === null) {
            alert("Ongeldige starttijd. Gebruik bijv. 09:00 of 13:30.");
            return;
        }

        const aantal = pendingAantalMonteurs();
        const prev = pendingPicks;

        if (prev.some((p) => p.engineerId === args.engineerId)) {
            setPendingPicks(prev.filter((p) => p.engineerId !== args.engineerId));
            return;
        }

        if (prev.length >= aantal) {
            return;
        }

        const dateIso = prev[0]?.dateIso ?? args.dateIso;
        const hour = prev[0]?.startHour ?? startHour;

        if (prev.length > 0 && args.dateIso !== dateIso) {
            alert(
                "Kies de overige monteur(s) op dezelfde dag als de eerste keuze."
            );
            return;
        }

        const next = [
            ...prev,
            {
                dateIso,
                engineerId: args.engineerId,
                startHour: hour,
            },
        ];

        setPendingPicks(next);

        if (next.length >= aantal) {
            void finalizePendingSchedule(next);
        }
    }

    async function finalizePendingSchedule(
        picks: {
            dateIso: string;
            engineerId: string;
            startHour: number;
        }[]
    ) {
        const current = pending || getPendingSchedule();
        if (!current || scheduling || !canEdit || picks.length === 0) {
            return;
        }

        const aantal = pendingAantalMonteurs();
        if (picks.length !== aantal) {
            return;
        }

        const duur = pendingDuurUren();
        const primary = picks[0];
        const extraEngineerIds = picks.slice(1).map((p) => p.engineerId);

        setScheduling(true);

        const startTime = formatHour(primary.startHour);
        const endTime = formatHour(primary.startHour + duur);

        try {
            const response = await fetch(
                `/api/workorders/${current.workorderId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        plannedDate: `${primary.dateIso}T${startTime}`,
                        plannedEndDate: `${primary.dateIso}T${endTime}`,
                        plannedHours: duur,
                        assignedUserId: primary.engineerId,
                        extraEngineerIds,
                    }),
                }
            );

            if (!response.ok) {
                alert("Inplannen mislukt");
                return;
            }

            clearPendingSchedule();
            setPending(null);
            resetPendingVoorstel();
            router.push(`/workorders/${current.workorderId}/edit`);
        } finally {
            setScheduling(false);
        }
    }

    function annuleerPending() {
        clearPendingSchedule();
        setPending(null);
        resetPendingVoorstel();
    }

    /** Weekview: sleep naar andere dag/tijd/monteur; meerdaagse duur blijft behouden. */
    async function moveWeekPlan(args: {
        workorderId: string;
        dateIso: string;
        hour: number;
        engineerId: string;
    }) {
        const item = items.find((w) => w.id === args.workorderId);
        if (!item?.plannedDate) {
            return;
        }

        function dayIso(d: Date): string {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, "0");
            const day = String(d.getDate()).padStart(2, "0");
            return `${y}-${m}-${day}`;
        }

        const oldStart = new Date(item.plannedDate);
        const oldEnd = item.plannedEndDate
            ? new Date(item.plannedEndDate)
            : null;

        const hours = Math.floor(args.hour);
        const minutes = Math.round((args.hour - hours) * 60);

        const startIso = dayIso(oldStart);
        const endIso = oldEnd ? dayIso(oldEnd) : startIso;
        const inSpan =
            args.dateIso >= startIso && args.dateIso <= endIso;

        let newStart: Date;
        let newEnd: Date | null = null;

        if (inSpan) {
            // Alleen tijd verschuiven; kalenderdagen blijven gelijk
            const oldBegin =
                oldStart.getHours() + oldStart.getMinutes() / 60;
            const delta = args.hour - oldBegin;

            newStart = new Date(oldStart);
            newStart.setHours(hours, minutes, 0, 0);

            if (oldEnd) {
                newEnd = new Date(oldEnd);
                const endHour =
                    oldEnd.getHours() +
                    oldEnd.getMinutes() / 60 +
                    delta;
                const eh = Math.floor(endHour);
                const em = Math.round((endHour - eh) * 60);
                newEnd.setHours(eh, em, 0, 0);
            }
        } else {
            // Hele klus naar nieuwe startdag; aantal dagen + eindtijd behouden
            const [y, m, d] = args.dateIso.split("-").map(Number);
            newStart = new Date(y, m - 1, d, hours, minutes, 0, 0);

            if (oldEnd) {
                const startDay = new Date(
                    oldStart.getFullYear(),
                    oldStart.getMonth(),
                    oldStart.getDate()
                );
                const endDay = new Date(
                    oldEnd.getFullYear(),
                    oldEnd.getMonth(),
                    oldEnd.getDate()
                );
                const spanDays = Math.round(
                    (endDay.getTime() - startDay.getTime()) / 86400000
                );
                newEnd = new Date(newStart);
                newEnd.setDate(newEnd.getDate() + spanDays);
                newEnd.setHours(
                    oldEnd.getHours(),
                    oldEnd.getMinutes(),
                    0,
                    0
                );
            }
        }

        const body: Record<string, unknown> = {
            plannedDate: newStart.toISOString(),
            assignedUserId: args.engineerId,
        };

        if (newEnd) {
            body.plannedEndDate = newEnd.toISOString();
        }

        const response = await fetch(
            `/api/workorders/${args.workorderId}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            }
        );

        if (!response.ok) {
            alert("Verplaatsen mislukt");
        }

        await loadPlanning();
    }

    /** Weekview: sleep agenda-item naar andere dag/tijd/monteur (null = Algemeen). */
    async function moveAgenda(args: {
        eventId: string;
        dateIso: string;
        hour?: number;
        engineerId: string | null;
    }) {
        const event = events.find((ev) => ev.id === args.eventId);
        if (!event?.startAt) {
            return;
        }

        const body: Record<string, unknown> = {
            date: args.dateIso,
            assignedUserId: args.engineerId,
        };

        if (typeof args.hour === "number") {
            if (event.allDay) {
                // Hele-dag item blijft hele dag; alleen datum + monteur wijzigen
                body.allDay = true;
            } else {
                const start = new Date(event.startAt);
                const end = event.endAt ? new Date(event.endAt) : null;
                const durationMin =
                    end && !Number.isNaN(end.getTime())
                        ? Math.max(
                              15,
                              Math.round(
                                  (end.getTime() - start.getTime()) / 60000
                              )
                          )
                        : 60;

                const startMin = Math.round(args.hour * 60);
                const endMin = Math.min(23 * 60 + 45, startMin + durationMin);
                const sh = Math.floor(startMin / 60);
                const sm = startMin % 60;
                const eh = Math.floor(endMin / 60);
                const em = endMin % 60;

                body.allDay = false;
                body.startTime = `${String(sh).padStart(2, "0")}:${String(sm).padStart(2, "0")}`;
                body.endTime = `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`;
            }
        } else if (event.allDay) {
            body.allDay = true;
        }

        const response = await fetch(
            `/api/planning/events/${encodeURIComponent(args.eventId)}`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            }
        );

        if (!response.ok) {
            let message = "Agenda-item verplaatsen mislukt";
            try {
                const data = await response.json();
                if (typeof data?.error === "string") {
                    message = data.error;
                }
            } catch {
                /* ignore */
            }
            alert(message);
        }

        await loadPlanning();
    }





    if(loading){


        return (

            <PageShell>
                <p className="text-sm text-gray-500">
                    Planning laden...
                </p>
            </PageShell>

        );

    }








    return (

        <PageShell className="!space-y-4">


            {/* Pagina-titel "Planning" weggelaten; weekkop staat in WeekView. */}


            {
                pending && canEdit && (
                    <SpecPanel
                        className="
                            sticky top-2 z-20
                            !border-[#0066FF]/30
                            !bg-[#e8f0ff]
                        "
                    >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-[#0066FF]">
                                    Inplannen: {pending.label}
                                </p>
                                <p className="text-xs text-slate-600 mt-0.5">
                                    {
                                        scheduling
                                        ? "Bezig met inplannen…"
                                        : pendingPicks.length > 0
                                        ? (
                                            pendingPicks.length >= pendingAantalMonteurs()
                                            ? "Bezig met opslaan…"
                                            : `Nog ${pendingAantalMonteurs() - pendingPicks.length}× Hier inplannen bij een andere monteur.`
                                        )
                                        : (
                                            pendingAantalMonteurs() <= 1
                                            ? "Vul starttijd en duur in, klik daarna 1× Hier inplannen bij de monteur."
                                            : `Vul starttijd en duur in, klik daarna ${pendingAantalMonteurs()}× Hier inplannen (één keer per monteur).`
                                        )
                                    }
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={annuleerPending}
                                disabled={scheduling}
                                className="
                                    shrink-0
                                    rounded-lg
                                    border
                                    border-slate-300
                                    bg-white
                                    px-3
                                    py-1.5
                                    text-sm
                                    font-medium
                                    text-slate-700
                                    hover:bg-slate-50
                                    disabled:opacity-50
                                "
                            >
                                Annuleren
                            </button>
                        </div>

                        <div className="flex flex-wrap items-end gap-3">
                            <label className="block">
                                <span className="text-xs font-medium text-slate-600">
                                    Aantal monteurs *
                                </span>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={pendingAantalTekst}
                                    disabled={scheduling || pendingPicks.length > 0}
                                    onChange={(e) => {
                                        const v = e.target.value.replace(/\D/g, "").slice(0, 2);
                                        setPendingAantalTekst(v);
                                    }}
                                    onBlur={() => {
                                        setPendingAantalTekst(String(pendingAantalMonteurs()));
                                    }}
                                    className="
                                        mt-0.5 block w-24 rounded-lg border border-slate-300
                                        bg-white px-2 py-1.5 text-sm
                                        disabled:opacity-60
                                    "
                                />
                            </label>
                            <label className="block">
                                <span className="text-xs font-medium text-slate-600">
                                    Starttijd *
                                </span>
                                <input
                                    type="time"
                                    value={pendingStartTime}
                                    disabled={scheduling || pendingPicks.length > 0}
                                    onChange={(e) =>
                                        setPendingStartTime(e.target.value || "08:00")
                                    }
                                    className="
                                        mt-0.5 block w-32 rounded-lg border border-slate-300
                                        bg-white px-2 py-1.5 text-sm
                                        disabled:opacity-60
                                    "
                                />
                            </label>
                            <label className="block">
                                <span className="text-xs font-medium text-slate-600">
                                    Duur (uren) *
                                </span>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    value={pendingDuurTekst}
                                    disabled={scheduling || pendingPicks.length > 0}
                                    onChange={(e) => {
                                        const v = e.target.value
                                            .replace(/[^\d.,]/g, "")
                                            .slice(0, 5);
                                        setPendingDuurTekst(v);
                                    }}
                                    onBlur={() => {
                                        const n = pendingDuurUren();
                                        setPendingDuurTekst(
                                            Number.isInteger(n) ? String(n) : String(n)
                                        );
                                    }}
                                    className="
                                        mt-0.5 block w-24 rounded-lg border border-slate-300
                                        bg-white px-2 py-1.5 text-sm
                                        disabled:opacity-60
                                    "
                                />
                            </label>
                            <p className="text-xs text-slate-500 pb-1.5">
                                {
                                    (() => {
                                        const start = parseTimeToHour(pendingStartTime);
                                        if (start === null) return "Eindtijd: —";
                                        return `Eindtijd: ${formatHour(start + pendingDuurUren())}`;
                                    })()
                                }
                            </p>
                        </div>

                        {
                            pendingPicks.length > 0 && !scheduling && (
                                <div className="
                                    rounded-xl border border-[#0066FF]/25 bg-white p-3 space-y-2
                                ">
                                    <p className="text-sm text-slate-700">
                                        Gekozen ({pendingPicks.length}/{pendingAantalMonteurs()}):{" "}
                                        <strong>
                                            {
                                                pendingPicks
                                                    .map((p) =>
                                                        engineers.find(
                                                            (e: { id: string }) =>
                                                                e.id === p.engineerId
                                                        )?.name
                                                        || "Monteur"
                                                    )
                                                    .join(", ")
                                            }
                                        </strong>
                                        {
                                            pendingPicks[0]
                                            ? (() => {
                                                const [y, m, d] =
                                                    pendingPicks[0].dateIso.split("-");
                                                const datum =
                                                    y && m && d
                                                    ? `${d}-${m}-${y}`
                                                    : pendingPicks[0].dateIso;
                                                return ` · ${datum} · ${formatHour(pendingPicks[0].startHour)}–${formatHour(pendingPicks[0].startHour + pendingDuurUren())}`;
                                            })()
                                            : ""
                                        }
                                    </p>
                                    <button
                                        type="button"
                                        disabled={scheduling}
                                        onClick={() => setPendingPicks([])}
                                        className="
                                            rounded-lg border border-slate-300 bg-white
                                            px-3 py-1.5 text-sm text-slate-700
                                            hover:bg-slate-50 disabled:opacity-50
                                        "
                                    >
                                        Keuzes wissen
                                    </button>
                                </div>
                            )
                        }

                    </SpecPanel>
                )
            }



            {
                conflicts.length > 0 && (

                    <SpecPanel
                        title={`Planningconflicten (${conflicts.length})`}
                        tone="amber"
                    >

                        <div className="space-y-2">
                        {
                            conflicts.map((conflict,index)=>(


                                <SpecListRow key={index}>

                                    <p className="font-semibold text-sm text-gray-900">
                                        {conflict.user}
                                    </p>

                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {conflict.date}
                                    </p>

                                    <p className="text-xs text-gray-700 mt-1">
                                        {conflict.workorders.join(" ↔ ")}
                                    </p>

                                </SpecListRow>


                            ))

                        }
                        </div>


                    </SpecPanel>

                )

            }









            {isEngineer && session?.user?.id ? (
                <EngineerMobileSchedule
                    items={items}
                    leave={leave}
                    events={events}
                    engineerId={session.user.id}
                    weekStart={weekStart}
                    onPreviousWeek={() => shiftWeek(-1)}
                    onNextWeek={() => shiftWeek(1)}
                    onThisWeek={thisWeek}
                />
            ) : null}

            <div className={isEngineer ? "hidden lg:block" : undefined}>
            {view === "month" ? (
                <Calendar
                    items={items}
                    leave={leave}
                    events={events}
                    onDropDate={
                        canEdit ? updatePlanning : undefined
                    }
                    view={view}
                    onViewChange={setView}
                    showStatusIcons={canEdit}
                    onCreateAgenda={
                        canEdit ? openCreateAgenda : undefined
                    }
                    onEditAgenda={
                        canEdit ? openEditAgenda : undefined
                    }
                />
            ) : (
                <WeekView
                    items={items}
                    leave={leave}
                    events={events}
                    engineers={engineers}
                    weekStart={weekStart}
                    focusDateIso={searchParams.get("date")}
                    view={view}
                    onViewChange={setView}
                    showStatusIcons={canEdit}
                    weekNavigation={{
                        rangeLabel: `${formatNlDate(weekStart, {
                            day: "numeric",
                            month: "long",
                        })} – ${(() => {
                            const end = new Date(weekStart);
                            end.setDate(end.getDate() + 5);
                            return formatNlDate(end, {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                            });
                        })()}`,
                        onPrevious: () => shiftWeek(-1),
                        onNext: () => shiftWeek(1),
                        onToday: thisWeek,
                    }}
                    onMovePlan={
                        canEdit ? moveWeekPlan : undefined
                    }
                    onMoveAgenda={
                        canEdit ? moveAgenda : undefined
                    }
                    pendingSchedule={
                        canEdit && pending && !scheduling
                            ? pending
                            : null
                    }
                    onSchedulePending={
                        canEdit && pending && !scheduling
                            ? schedulePending
                            : undefined
                    }
                    onCreateAgenda={
                        canEdit ? openCreateAgenda : undefined
                    }
                    onEditAgenda={
                        canEdit ? openEditAgenda : undefined
                    }
                />
            )}
            </div>

            {canEdit && (
                <AgendaEventDialog
                    open={agendaOpen}
                    onClose={() => {
                        setAgendaOpen(false);
                        setAgendaEdit(null);
                        setAgendaPrefill(null);
                    }}
                    engineers={engineers}
                    prefill={agendaPrefill}
                    event={agendaEdit}
                    onSaved={() => {
                        void loadPlanning();
                    }}
                />
            )}

            {
                canEdit && (
                    <SpecPanel>
                        <WorkorderStatusIconLegend />
                    </SpecPanel>
                )
            }

        </PageShell>

    );

}