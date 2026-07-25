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

    // Maandag van de te tonen week; standaard deze week
    weekStart?:Date;

}



export default function WeekView({

    items,

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
        {length:5},
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


    // Monteurs afleiden uit de toegewezen werkbonnen
    const users = Array.from(

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
    }[];




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
                min-w-[1100px]
            ">



                <div className="
                    grid
                    grid-cols-6
                    gap-2
                    mb-3
                ">


                    <div className="font-bold">

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
                                grid-cols-6
                                gap-2
                                border-t
                                py-3
                            "

                        >



                            <div className="
                                font-bold
                            ">

                                👷 {user.name}

                            </div>




                            {
                                days.map(day=>(


                                    <div

                                        key={day.toISOString()}

                                        className="
                                            border
                                            rounded-xl
                                            min-h-32
                                            p-2
                                        "

                                    >


                                        {
                                            items

                                            .filter(item=>{


                                                if(
                                                    item.assignedUser?.id
                                                    !==
                                                    user.id
                                                ){
                                                    return false;
                                                }



                                                if(!item.plannedDate){
                                                    return false;
                                                }



                                                const date =
                                                    new Date(
                                                        item.plannedDate
                                                    );



                                                return (

                                                    date.getDate()
                                                    ===
                                                    day.getDate()

                                                    &&

                                                    date.getMonth()
                                                    ===
                                                    day.getMonth()

                                                    &&

                                                    date.getFullYear()
                                                    ===
                                                    day.getFullYear()

                                                );


                                            })


                                            .map(item=>(


                                                <Link

                                                    key={item.id}

                                                    href={`/workorders/${item.id}`}

                                                    className="
                                                        block
                                                        text-xs
                                                        text-white
                                                        rounded-lg
                                                        p-2
                                                        mb-2
                                                    "

                                                    style={{

                                                        backgroundColor:
                                                            (item.customer?.color ?? item.project?.customer?.color)
                                                            ?? "#2563eb"

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
                                                                <span className="text-xs font-bold block">
                                                                    🕐 {label}
                                                                </span>
                                                            );
                                                        })()
                                                    }

                                                    <strong>

                                                        {item.title}

                                                    </strong>


                                                    <br/>


                                                    {
                                                        (item.customer?.name ?? item.project?.customer?.name)
                                                        ?? "Onbekende klant"
                                                    }


                                                </Link>


                                            ))

                                        }


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
