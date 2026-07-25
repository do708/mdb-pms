"use client";

import { useState } from "react";
import Link from "next/link";

import DraggableAssignment from "./DraggableAssignment";



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


interface CalendarProps {

    items:any[];

    leave?:any[];

    onDropDate?:(id:string,date:string)=>void;

}




export default function Calendar({

    items,

    leave = [],

    onDropDate

}:CalendarProps){



    const [currentDate,setCurrentDate] =
        useState(new Date());



    const year =
        currentDate.getFullYear();


    const month =
        currentDate.getMonth();


    function isoDateOf(d:number):string {
        const mm = String(month + 1).padStart(2,"0");
        const dd = String(d).padStart(2,"0");
        return `${year}-${mm}-${dd}`;
    }


    // Lokale datum (geen UTC-shift) als YYYY-MM-DD
    function localIso(value:string | Date):string {
        const d = new Date(value);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2,"0");
        const day = String(d.getDate()).padStart(2,"0");
        return `${y}-${m}-${day}`;
    }


    // Geaccepteerd verlof dat op een bepaalde dag valt
    function leaveOnDay(d:number){
        const iso = isoDateOf(d);
        return leave.filter(l=>{
            const from = l.from;
            const to = l.to || l.from;
            return from && from <= iso && iso <= to;
        });
    }





    const firstDay =
        (
            new Date(
                year,
                month,
                1
            ).getDay()
            + 6
        ) % 7;




    const daysInMonth =
        new Date(
            year,
            month + 1,
            0
        ).getDate();





    const days:number[] = [];



    for(let i=0;i<firstDay;i++){

        days.push(0);

    }



    for(let i=1;i<=daysInMonth;i++){

        days.push(i);

    }



    // Opvullen tot volledige weken en opdelen in rijen
    while(days.length % 7 !== 0){

        days.push(0);

    }


    const weeks:number[][] = [];


    for(let i=0;i<days.length;i+=7){

        weeks.push(
            days.slice(i,i+7)
        );

    }






    function previousMonth(){

        setCurrentDate(

            new Date(
                year,
                month - 1,
                1
            )

        );

    }






    function nextMonth(){

        setCurrentDate(

            new Date(
                year,
                month + 1,
                1
            )

        );

    }






    function today(){

        setCurrentDate(
            new Date()
        );

    }







    function handleDrop(

        event:React.DragEvent,

        day:number

    ){


        event.preventDefault();



        if(!day)

            return;



        const id =
            event.dataTransfer.getData(
                "workorderId"
            );



        // 12:00 zodat de dag in UTC en lokale tijd gelijk blijft
        const newDate =
            new Date(
                year,
                month,
                day,
                12
            );



        if(onDropDate){

            onDropDate(

                id,

                newDate.toISOString()

            );

        }


    }








    return (

        <section className="
            bg-white
            border
            rounded-2xl
            p-5
            overflow-x-auto
        ">



            <div className="
                flex
                justify-between
                items-center
                mb-5
            ">


                <button

                    onClick={previousMonth}

                    className="
                        border
                        px-3
                        py-2
                        rounded-xl
                    "

                >

                    ◀

                </button>



                <h2 className="
                    text-xl
                    font-bold
                ">


                    {
                        currentDate.toLocaleDateString(
                            "nl-NL",
                            {
                                month:"long",
                                year:"numeric"
                            }
                        )
                    }


                </h2>




                <button

                    onClick={nextMonth}

                    className="
                        border
                        px-3
                        py-2
                        rounded-xl
                    "

                >

                    ▶

                </button>


            </div>





            <button

                onClick={today}

                className="
                    border
                    rounded-xl
                    px-4
                    py-2
                    mb-4
                "

            >

                Vandaag

            </button>






            <div
                className="
                    grid
                    gap-2
                    min-w-[760px]
                "
                style={{
                    gridTemplateColumns:"44px repeat(7, 1fr)"
                }}
            >



                {
                    [
                        "Wk",
                        "Ma",
                        "Di",
                        "Wo",
                        "Do",
                        "Vr",
                        "Za",
                        "Zo"
                    ]

                    .map(day=>(

                        <div

                            key={day}

                            className="
                                text-center
                                font-bold
                            "

                        >

                            {day}

                        </div>

                    ))

                }





                {
                    weeks.map((week,weekIndex)=>{


                        const firstDay =
                            week.find(d=>d>0);


                        const weekNumber =
                            firstDay
                            ?
                            isoWeek(
                                new Date(
                                    year,
                                    month,
                                    firstDay
                                )
                            )
                            :
                            null;


                        return (

                            <div

                                key={weekIndex}

                                className="
                                    contents
                                "

                            >


                                <div className="
                                    min-h-28
                                    rounded-xl
                                    py-2
                                    text-xs
                                    text-gray-400
                                    font-bold
                                    text-center
                                ">

                                    {weekNumber}

                                </div>


                                {
                                    week.map((day,index)=>(


                        <div

                            key={index}

                            onDragOver={
                                day > 0
                                ?
                                (e=>e.preventDefault())
                                :
                                undefined
                            }

                            onDrop={
                                day > 0
                                ?
                                (e=>handleDrop(e,day))
                                :
                                undefined
                            }

                            className={`
                                min-h-28
                                border
                                rounded-xl
                                p-1.5
                                ${
                                    day > 0
                                    ?
                                    ""
                                    :
                                    "bg-gray-50 border-gray-100"
                                }
                            `}

                        >



                            {
                                day > 0 && (

                                    <>

                                        <div className="
                                            font-bold
                                            mb-2
                                        ">

                                            {day}

                                        </div>


                                        {
                                            leaveOnDay(day).map(l=>(

                                                <div

                                                    key={l.id}

                                                    className="
                                                        bg-orange-100
                                                        text-orange-800
                                                        text-[10px]
                                                        rounded-md
                                                        px-1.5
                                                        py-1
                                                        mb-1
                                                        truncate
                                                        leading-tight
                                                    "

                                                    title={`Verlof: ${l.userName ?? ""}`}

                                                >

                                                    🌴 {l.userName ?? "Verlof"}

                                                </div>

                                            ))
                                        }


                                        {
                                            items

                                            .filter(item=>{


                                                if(!item.plannedDate)

                                                    return false;



                                                // Deze cel als YYYY-MM-DD
                                                const cellIso =
                                                    isoDateOf(day);


                                                const startIso =
                                                    localIso(item.plannedDate);


                                                // Meerdaagse klus: toon op elke dag
                                                // tussen start en eind (inclusief)
                                                const endIso =
                                                    item.plannedEndDate
                                                    ?
                                                    localIso(item.plannedEndDate)
                                                    :
                                                    startIso;


                                                return (
                                                    startIso <= cellIso
                                                    &&
                                                    cellIso <= endIso
                                                );

                                            })


                                            .map(item=>(


                                                <DraggableAssignment

                                                    key={item.id}

                                                    item={item}

                                                    draggable={
                                                        !!onDropDate
                                                    }

                                                />


                                            ))

                                        }


                                        {
                                            onDropDate && (

                                                <Link

                                                    href={`/workorders/new?date=${isoDateOf(day)}`}

                                                    title="Werkbon klaarzetten op deze dag"

                                                    className="
                                                        block
                                                        text-center
                                                        text-[10px]
                                                        text-gray-400
                                                        border
                                                        border-dashed
                                                        rounded-md
                                                        py-0.5
                                                        mt-1
                                                        hover:bg-blue-50
                                                        hover:text-blue-600
                                                    "

                                                >

                                                    + plannen

                                                </Link>

                                            )
                                        }


                                    </>

                                )

                            }



                        </div>


                                    ))
                                }


                            </div>

                        );


                    })

                }



            </div>



        </section>

    );

}