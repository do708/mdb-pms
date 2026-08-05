"use client";

import { useEffect, useState } from "react";

import { useSession } from "next-auth/react";

import Calendar from "@/components/planning/Calendar";

import WeekView from "@/components/planning/WeekView";



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
            space-y-6
        ">


            <header className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Planning
                    </h1>
                </div>

                <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                    <button
                        type="button"
                        onClick={() => setView("week")}
                        className={`
                            px-4 py-2 rounded-lg text-sm font-semibold transition
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
                        onClick={() => setView("month")}
                        className={`
                            px-4 py-2 rounded-lg text-sm font-semibold transition
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
            </header>







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
                />
            ) : (
                <div className="space-y-4">
                    <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm space-y-3">
                        <div className="flex items-center justify-between gap-3">
                            <button
                                type="button"
                                onClick={() => shiftWeek(-1)}
                                className="
                                    inline-flex items-center gap-1.5
                                    rounded-xl border border-slate-200
                                    px-3.5 py-2 text-sm font-medium text-slate-700
                                    hover:bg-slate-50 transition
                                    shrink-0
                                "
                            >
                                ← Vorige
                            </button>

                            <button
                                type="button"
                                onClick={() => shiftWeek(1)}
                                className="
                                    inline-flex items-center gap-1.5
                                    rounded-xl border border-slate-200
                                    px-3.5 py-2 text-sm font-medium text-slate-700
                                    hover:bg-slate-50 transition
                                    shrink-0
                                "
                            >
                                Volgende →
                            </button>
                        </div>

                        <div className="flex flex-col items-center gap-1.5 text-center">
                            <span className="text-sm sm:text-base font-semibold text-slate-800 tabular-nums">
                                {formatNlDate(weekStart, {
                                    day: "numeric",
                                    month: "long",
                                })}
                                {" – "}
                                {(() => {
                                    const end = new Date(weekStart);
                                    end.setDate(end.getDate() + 5);
                                    return formatNlDate(end, {
                                        day: "numeric",
                                        month: "long",
                                        year: "numeric",
                                    });
                                })()}
                            </span>
                            <button
                                type="button"
                                onClick={thisWeek}
                                className="
                                    text-sm font-semibold
                                    text-[#0066FF]
                                    rounded-lg px-2.5 py-1
                                    hover:bg-[#e8f0ff] transition
                                "
                            >
                                Vandaag
                            </button>
                        </div>
                    </div>

                    <WeekView
                        items={items}
                        leave={leave}
                        engineers={engineers}
                        weekStart={weekStart}
                        onMovePlan={
                            canEdit ? moveWeekPlan : undefined
                        }
                    />
                </div>
            )}



        </main>

    );

}