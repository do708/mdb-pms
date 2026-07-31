"use client";

import Link from "next/link";



// ISO 8601 weeknummer (weken beginnen op maandag)
function isoWeek(date:Date){

    const d = new Date(
        Date.UTC(
            date.getFullYear(),
            date.getMonth(),
            date.getDate()
        )
    );

    const day = d.getUTCDay() || 7;

    d.setUTCDate(
        d.getUTCDate() + 4 - day
    );

    const yearStart = new Date(
        Date.UTC(d.getUTCFullYear(),0,1)
    );

    return Math.ceil(
        (
            (d.getTime() - yearStart.getTime())
            / 86400000
            + 1
        ) / 7
    );

}



interface WeekViewProps {

    items:any[];

    leave?:any[];

    // Alle monteurs (zodat ook lege monteurs een rij krijgen)
    engineers?:{ id:string; name:string | null }[];

    // Maandag van de te tonen week; standaard deze week
    weekStart?:Date;

}



export default function WeekView({

    items,

    leave = [],

    engineers = [],

    weekStart

}:WeekViewProps){



    const today = new Date();



    const startOfWeek =
        weekStart
        ?
        new Date(weekStart)
        :
        (()=>{
            const d = new Date(today);
            d.setDate(
                today.getDate() - today.getDay() + 1
            );
            return d;
        })();



    const days = Array.from(
        {length:6},
        (_,index)=>{

            const date = new Date(startOfWeek);

            date.setDate(
                startOfWeek.getDate() + index
            );

            return date;

        }
    );




    function isoDate(d:Date):string {

        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2,"0");
        const day = String(d.getDate()).padStart(2,"0");
        return `${y}-${m}-${day}`;

    }


    // --- Dag-as voor de agenda-weergave ---
    // De dag loopt van 08:00 tot 17:00 (9 uur). Elk uur is PX_PER_UUR hoog,
    // zodat een klok van bijvoorbeeld 14:00-16:00 onderaan de dag staat en je
    // ziet dat de ochtend nog vrij is. De schaal is ruim genoeg gekozen zodat
    // ook een blok van 1 uur genoeg ruimte heeft voor tijd, titel en klant.
    const DAG_START_UUR = 8;
    const DAG_EIND_UUR = 17;
    const PX_PER_UUR = 22;
    // Klein stukje wit boven de eerste klus.
    const DAG_PADDING_TOP = 8;
    const DAG_HOOGTE = (DAG_EIND_UUR - DAG_START_UUR) * PX_PER_UUR + DAG_PADDING_TOP;


    // Bereken de verticale positie (top) en hoogte van een klus binnen één dag,
    // op basis van de van-/tot-tijd. Geen tijd? Dan vult het blok de hele dag.
    function blokPositie(
        item:any,
        day:Date
    ):{ top:number; height:number } {

        const cellIso = isoDate(day);

        const start = item.plannedDate ? new Date(item.plannedDate) : null;
        const eind = item.plannedEndDate ? new Date(item.plannedEndDate) : null;

        const startIsDezeDag =
            start !== null && isoDate(start) === cellIso;
        const eindIsDezeDag =
            eind !== null && isoDate(eind) === cellIso;

        // Uur (als kommagetal) van een tijd, begrensd op de dag-as.
        const uurVan = (d:Date):number => {
            const u = d.getHours() + d.getMinutes() / 60;
            return Math.min(
                DAG_EIND_UUR,
                Math.max(DAG_START_UUR, u)
            );
        };

        // Beginuur: op de startdag de echte starttijd (als die er is),
        // anders (doorlopende dag) bovenaan de dag beginnen.
        let beginUur = DAG_START_UUR;

        if(startIsDezeDag && start){
            const heeftTijd =
                start.getHours() !== 0 || start.getMinutes() !== 0;
            beginUur = heeftTijd ? uurVan(start) : DAG_START_UUR;
        }

        // Einduur: op de einddag de echte eindtijd, anders onderaan de dag.
        let eindUur = DAG_EIND_UUR;

        if(eindIsDezeDag && eind){
            const heeftTijd =
                eind.getHours() !== 0 || eind.getMinutes() !== 0;
            eindUur = heeftTijd ? uurVan(eind) : DAG_EIND_UUR;
        } else if(startIsDezeDag && !eind && start){
            // Alleen een starttijd, geen eind: standaard 2 uur blok.
            const heeftTijd =
                start.getHours() !== 0 || start.getMinutes() !== 0;
            eindUur = heeftTijd
                ? Math.min(DAG_EIND_UUR, uurVan(start) + 2)
                : DAG_EIND_UUR;
        }

        const top = (beginUur - DAG_START_UUR) * PX_PER_UUR + DAG_PADDING_TOP;

        const height = Math.max(
            30,
            (eindUur - beginUur) * PX_PER_UUR
        );

        return { top, height };

    }


    // Geaccepteerd verlof van een monteur op een bepaalde dag
    function leaveOn(
        userId:string,
        day:Date
    ){

        const iso = isoDate(day);

        return leave.find(l=>{

            if(l.userId !== userId){
                return false;
            }

            const from = l.from;
            const to = l.to || l.from;

            return from <= iso && iso <= to;

        });

    }


    // Monteurs afleiden uit de toegewezen werkbonnen
    const users =
        engineers.length > 0
        ?
        engineers
        :
        (Array.from(

            new Map(

                items

                .filter(
                    item=>item.assignedUser
                )

                .map(
                    item=>[
                        item.assignedUser.id,
                        item.assignedUser
                    ]
                )

            )
            .values()

        ) as {
            id:string;
            name:string | null;
        }[]);




    return (

        <section className="
            bg-white
            border
            rounded-2xl
            p-5
            overflow-x-auto
        ">



            <h2 className="
                text-xl
                font-bold
                mb-5
            ">

                Monteur planning

                <span className="
                    text-gray-400
                    font-normal
                    ml-3
                ">

                    Week {isoWeek(startOfWeek)}

                </span>

            </h2>




            {
                users.length === 0 && (

                    <p className="text-gray-500">

                        Geen werkbonnen met monteur ingepland deze week.

                    </p>

                )
            }




            <div className="
                min-w-[900px]
            ">



                <div
                    className="
                        grid
                        gap-2
                        mb-3
                    "
                    style={{
                        gridTemplateColumns:"90px repeat(6, minmax(0, 1fr))"
                    }}
                >


                    <div className="font-bold text-sm">

                        Monteur

                    </div>


                    {
                        days.map(day=>(


                            <Link

                                key={day.toISOString()}

                                href={`/workorders/new?date=${isoDate(day)}`}

                                title="Werkbon klaarzetten op deze dag"

                                className="
                                    font-bold
                                    text-center
                                    hover:text-blue-600
                                    hover:underline
                                "

                            >

                                {
                                    day.toLocaleDateString(
                                        "nl-NL",
                                        {
                                            weekday:"short",
                                            day:"numeric"
                                        }
                                    )
                                }


                            </Link>


                        ))
                    }


                </div>




                {
                    users.map(user=>(


                        <div

                            key={user.id}

                            className="
                                grid
                                gap-2
                                border-t
                                py-3
                            "

                            style={{
                                gridTemplateColumns:"90px repeat(6, minmax(0, 1fr))"
                            }}

                        >



                            <div className="
                                font-medium
                                text-xs
                                break-words
                            ">

                                👷 {user.name}

                            </div>




                            {
                                days.map(day=>(


                                    <div

                                        key={day.toISOString()}

                                        className="
                                            flex
                                            flex-col
                                            gap-1
                                        "

                                    >

                                      <div
                                        className="
                                            border
                                            rounded-xl
                                            p-1
                                            relative
                                        "

                                        style={{
                                            minHeight:`${DAG_HOOGTE}px`
                                        }}

                                      >


                                        {
                                            (()=>{
                                                const verlof = leaveOn(user.id, day);
                                                if(!verlof){
                                                    return null;
                                                }
                                                return (
                                                    <div className="
                                                        absolute
                                                        inset-1
                                                        bg-orange-100
                                                        text-orange-800
                                                        text-xs
                                                        rounded-lg
                                                        p-2
                                                        text-center
                                                        font-medium
                                                        flex
                                                        items-center
                                                        justify-center
                                                        z-10
                                                    ">
                                                        🌴 {verlof.type || "Verlof"}
                                                    </div>
                                                );
                                            })()
                                        }


                                        {
                                            items

                                            .filter(item=>{


                                                const isPrimary =
                                                    item.assignedUser?.id === user.id;

                                                const isExtra =
                                                    Array.isArray(item.extraEngineers)
                                                    &&
                                                    item.extraEngineers.some(
                                                        (e:any)=>e.user?.id === user.id
                                                    );

                                                if(!isPrimary && !isExtra){
                                                    return false;
                                                }



                                                if(!item.plannedDate){
                                                    return false;
                                                }



                                                // Deze celdag als YYYY-MM-DD (lokaal)
                                                const cellIso =
                                                    isoDate(day);


                                                const startIso =
                                                    isoDate(new Date(item.plannedDate));


                                                // Meerdaagse klus: elke dag in het bereik
                                                const endIso =
                                                    item.plannedEndDate
                                                    ?
                                                    isoDate(new Date(item.plannedEndDate))
                                                    :
                                                    startIso;


                                                return (
                                                    startIso <= cellIso
                                                    &&
                                                    cellIso <= endIso
                                                );


                                            })


                                            .map(item=>{

                                                const pos =
                                                    blokPositie(item, day);

                                                return (

                                                <Link

                                                    key={item.id}

                                                    href={`/workorders/${item.id}`}

                                                    className="
                                                        block
                                                        text-white
                                                        rounded-md
                                                        px-1.5
                                                        py-0.5
                                                        leading-tight
                                                        overflow-hidden
                                                        absolute
                                                    "


                                                    style={{

                                                        backgroundColor:
                                                            (item.customer?.color ?? item.project?.customer?.color)
                                                            ?? "#2563eb",

                                                        // Agenda-positie: bovenkant en hoogte volgen de
                                                        // van-/tot-tijd. Een klus van 14:00-16:00 staat
                                                        // zo onderaan de dag; de ochtend blijft vrij.
                                                        top:`${pos.top}px`,
                                                        height:`${pos.height}px`,
                                                        left:"2px",
                                                        right:"2px"

                                                    }}

                                                >

                                                    {
                                                        (()=>{
                                                            const d = new Date(item.plannedDate!);
                                                            const hasTime =
                                                                d.getHours() !== 0 ||
                                                                d.getMinutes() !== 0;
                                                            if(!hasTime){
                                                                return null;
                                                            }
                                                            const hh = String(d.getHours()).padStart(2,"0");
                                                            const mm = String(d.getMinutes()).padStart(2,"0");
                                                            let label = `${hh}:${mm}`;
                                                            if(item.plannedEndDate){
                                                                const e = new Date(item.plannedEndDate);
                                                                const eh = String(e.getHours()).padStart(2,"0");
                                                                const em = String(e.getMinutes()).padStart(2,"0");
                                                                label += `–${eh}:${em}`;
                                                            }
                                                            return (
                                                                <span className="text-[10px] font-bold block">
                                                                    🕐 {label}
                                                                </span>
                                                            );
                                                        })()
                                                    }

                                                    <span className="text-[10px] block truncate font-semibold">

                                                        {
                                                            (item.customer?.name ?? item.project?.customer?.name)
                                                            ?? "Onbekende klant"
                                                        }

                                                    </span>


                                                    <strong className="text-[10px] block truncate font-normal opacity-90">

                                                        {item.title}

                                                    </strong>


                                                </Link>

                                                );

                                            })

                                        }


                                      </div>


                                        <Link

                                            href={`/workorders/new?date=${isoDate(day)}&engineer=${user.id}`}

                                            title="Werkbon klaarzetten voor deze monteur op deze dag"

                                            className="
                                                block
                                                text-center
                                                text-xs
                                                text-gray-400
                                                border
                                                border-dashed
                                                rounded-lg
                                                py-1
                                                hover:bg-blue-50
                                                hover:text-blue-600
                                            "

                                        >

                                            + plannen

                                        </Link>



                                    </div>


                                ))

                            }



                        </div>


                    ))

                }



            </div>



        </section>

    );

}
