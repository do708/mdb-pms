"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { useSession } from "next-auth/react";

import Calendar from "@/components/planning/Calendar";

import WeekView from "@/components/planning/WeekView";
import { WorkorderStatusIconLegend } from "@/components/planning/PlanningStatusIcon";
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





export default function PlanningPage(){


    const router =
        useRouter();


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
    const [pendingAantalMonteurs, setPendingAantalMonteurs] =
        useState(1);

    const [pendingStartTime, setPendingStartTime] =
        useState("09:00");

    const [pendingDuurUren, setPendingDuurUren] =
        useState(2);

    /** Slot gekozen; nog extra monteurs kiezen als aantal > 1. */
    const [pendingSlot, setPendingSlot] =
        useState<{
            dateIso: string;
            engineerId: string;
            startHour: number;
        } | null>(null);

    const [pendingExtraIds, setPendingExtraIds] =
        useState<string[]>([]);


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
    }



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
        const startHour = parseTimeToHour(pendingStartTime);
        return (
            pendingAantalMonteurs >= 1
            && pendingAantalMonteurs <= 8
            && pendingDuurUren > 0
            && pendingDuurUren <= 16
            && startHour !== null
        );
    }

    function resetPendingVoorstel() {
        setPendingAantalMonteurs(1);
        setPendingStartTime("09:00");
        setPendingDuurUren(2);
        setPendingSlot(null);
        setPendingExtraIds([]);
    }

    /** Pending aanvraag/klus: eerst voorstel checken, daarna dag/monteur → eventueel extra monteurs. */
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
        // Klik op de tijdlijn: starttijd overnemen (bijv. middagklus).
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

        const slot = {
            dateIso: args.dateIso,
            engineerId: args.engineerId,
            startHour,
        };

        if (pendingAantalMonteurs <= 1) {
            void finalizePendingSchedule(slot, []);
            return;
        }

        setPendingSlot(slot);
        setPendingExtraIds([]);
    }

    async function finalizePendingSchedule(
        args: {
            dateIso: string;
            engineerId: string;
            startHour: number;
        },
        extraEngineerIds: string[]
    ) {
        const current = pending || getPendingSchedule();
        if (!current || scheduling || !canEdit) {
            return;
        }

        const nodigExtra = Math.max(0, pendingAantalMonteurs - 1);
        if (extraEngineerIds.length !== nodigExtra) {
            alert(
                nodigExtra === 1
                    ? "Kies nog 1 extra monteur."
                    : `Kies nog ${nodigExtra} extra monteurs.`
            );
            return;
        }

        setScheduling(true);

        const startTime = formatHour(args.startHour);
        const endTime = formatHour(args.startHour + pendingDuurUren);

        try {
            const response = await fetch(
                `/api/workorders/${current.workorderId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        plannedDate: `${args.dateIso}T${startTime}`,
                        plannedEndDate: `${args.dateIso}T${endTime}`,
                        plannedHours: pendingDuurUren,
                        assignedUserId: args.engineerId,
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

    function togglePendingExtra(id: string) {
        setPendingExtraIds((prev) => {
            if (prev.includes(id)) {
                return prev.filter((x) => x !== id);
            }
            const max = Math.max(0, pendingAantalMonteurs - 1);
            if (prev.length >= max) {
                return [...prev.slice(1), id];
            }
            return [...prev, id];
        });
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








    if(loading){


        return (

            <main className="p-6">

                Planning laden...

            </main>

        );

    }








    return (

        <main className="
            p-6
            space-y-4
        ">







            {
                pending && canEdit && (
                    <section className="
                        sticky
                        top-2
                        z-20
                        space-y-3
                        rounded-2xl
                        border
                        border-[#0066FF]/30
                        bg-[#e8f0ff]
                        px-4
                        py-3
                        shadow-sm
                    ">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-[#0066FF]">
                                    Inplannen: {pending.label}
                                </p>
                                <p className="text-xs text-slate-600 mt-0.5">
                                    {
                                        scheduling
                                        ? "Bezig met inplannen…"
                                        : pendingSlot
                                        ? "Kies de extra monteur(s) hieronder en bevestig."
                                        : "Vul monteurs, starttijd en duur in, kies daarna dag en monteur."
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
                                    type="number"
                                    min={1}
                                    max={8}
                                    step={1}
                                    value={pendingAantalMonteurs}
                                    disabled={scheduling || !!pendingSlot}
                                    onChange={(e) => {
                                        const n = Number.parseInt(e.target.value, 10);
                                        setPendingAantalMonteurs(
                                            Number.isFinite(n) ? Math.min(8, Math.max(1, n)) : 1
                                        );
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
                                    disabled={scheduling || !!pendingSlot}
                                    onChange={(e) =>
                                        setPendingStartTime(e.target.value || "09:00")
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
                                    type="number"
                                    min={0.5}
                                    max={16}
                                    step={0.5}
                                    value={pendingDuurUren}
                                    disabled={scheduling || !!pendingSlot}
                                    onChange={(e) => {
                                        const n = Number.parseFloat(e.target.value);
                                        setPendingDuurUren(
                                            Number.isFinite(n) ? Math.min(16, Math.max(0.5, n)) : 2
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
                                        return `Eindtijd: ${formatHour(start + pendingDuurUren)} · bijv. 13:00 + 1u, of 09:00 + 8u`;
                                    })()
                                }
                            </p>
                        </div>

                        {
                            pendingSlot && (
                                <div className="
                                    rounded-xl border border-[#0066FF]/25 bg-white p-3 space-y-2
                                ">
                                    <p className="text-sm text-slate-700">
                                        Hoofdmonteur:{" "}
                                        <strong>
                                            {
                                                engineers.find(
                                                    (e: { id: string }) =>
                                                        e.id === pendingSlot.engineerId
                                                )?.name
                                                || "Gekozen monteur"
                                            }
                                        </strong>
                                        {" · "}
                                        {pendingSlot.dateIso}
                                        {" · "}
                                        {formatHour(pendingSlot.startHour)}
                                        –{formatHour(pendingSlot.startHour + pendingDuurUren)}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        Kies{" "}
                                        {pendingAantalMonteurs - 1 === 1
                                            ? "1 extra monteur"
                                            : `${pendingAantalMonteurs - 1} extra monteurs`}
                                        :
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {
                                            engineers
                                                .filter(
                                                    (e: { id: string }) =>
                                                        e.id !== pendingSlot.engineerId
                                                )
                                                .map((e: { id: string; name?: string | null }) => (
                                                    <label
                                                        key={e.id}
                                                        className={`
                                                            flex items-center gap-2 rounded-lg border
                                                            px-3 py-1.5 text-sm cursor-pointer
                                                            ${
                                                                pendingExtraIds.includes(e.id)
                                                                ? "bg-blue-50 border-blue-300"
                                                                : "bg-white border-slate-200"
                                                            }
                                                        `}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={pendingExtraIds.includes(e.id)}
                                                            onChange={() => togglePendingExtra(e.id)}
                                                            disabled={scheduling}
                                                        />
                                                        {e.name || "Monteur"}
                                                    </label>
                                                ))
                                        }
                                    </div>
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        <button
                                            type="button"
                                            disabled={
                                                scheduling
                                                || pendingExtraIds.length !== pendingAantalMonteurs - 1
                                            }
                                            onClick={() =>
                                                void finalizePendingSchedule(
                                                    pendingSlot,
                                                    pendingExtraIds
                                                )
                                            }
                                            className="
                                                rounded-lg bg-[#0066FF] px-3 py-1.5 text-sm
                                                font-semibold text-white hover:bg-[#0052cc]
                                                disabled:opacity-50
                                            "
                                        >
                                            Bevestig inplannen
                                        </button>
                                        <button
                                            type="button"
                                            disabled={scheduling}
                                            onClick={() => {
                                                setPendingSlot(null);
                                                setPendingExtraIds([]);
                                            }}
                                            className="
                                                rounded-lg border border-slate-300 bg-white
                                                px-3 py-1.5 text-sm text-slate-700
                                                hover:bg-slate-50 disabled:opacity-50
                                            "
                                        >
                                            Ander moment kiezen
                                        </button>
                                    </div>
                                </div>
                            )
                        }
                    </section>
                )
            }



            {
                conflicts.length > 0 && (

                    <section className="
                        bg-red-100
                        border
                        border-red-300
                        rounded-xl
                        p-4
                    ">


                        <h2 className="
                            font-bold
                            text-red-700
                            mb-3
                        ">

                            ⚠️ Planning conflicten

                        </h2>




                        {
                            conflicts.map((conflict,index)=>(


                                <div

                                    key={index}

                                    className="
                                        mb-3
                                    "

                                >

                                    <strong>

                                        👷 {conflict.user}

                                    </strong>


                                    <p>

                                        {conflict.date}

                                    </p>


                                    <p>

                                        {conflict.workorders.join(" ↔ ")}

                                    </p>


                                </div>


                            ))

                        }


                    </section>

                )

            }









            {view === "month" ? (
                <Calendar
                    items={items}
                    leave={leave}
                    onDropDate={
                        canEdit ? updatePlanning : undefined
                    }
                    view={view}
                    onViewChange={setView}
                />
            ) : (
                <WeekView
                    items={items}
                    leave={leave}
                    engineers={engineers}
                    weekStart={weekStart}
                    view={view}
                    onViewChange={setView}
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
                />
            )}



        </main>

    );

}