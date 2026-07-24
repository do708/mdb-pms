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

    onDropDate?:(id:string,date:string)=>void;

}




export default function Calendar({

    items,

    onDropDate

}:CalendarProps){



    const [currentDate,setCurrentDate] =
        useState(new Date());



    const year =
        currentDate.getFullYear();


    const month =
        currentDate.getMonth();





    const firstDay =
        new Date(
            year,
            month,
            1
        ).getDay();




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






            <div className="
                grid
                grid-cols-8
                gap-2
            ">



                {
                    [
                        "Wk",
                        "Zo",
                        "Ma",
                        "Di",
                        "Wo",
                        "Do",
                        "Vr",
                        "Za"
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
                                    min-h-32
                                    rounded-xl
                                    p-2
                                    text-sm
                                    text-gray-400
                                    font-bold
                                ">

                                    {weekNumber}

                                </div>


                                {
                                    week.map((day,index)=>(


                        <div

                            key={index}

                            onDragOver={
                                e=>e.preventDefault()
                            }

                            onDrop={
                                e=>handleDrop(e,day)
                            }

                            className="
                                min-h-32
                                border
                                rounded-xl
                                p-2
                            "

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
                                            items

                                            .filter(item=>{


                                                if(!item.plannedDate)

                                                    return false;



                                                const date =
                                                    new Date(
                                                        item.plannedDate
                                                    );



                                                return (

                                                    date.getDate()
                                                    === day

                                                    &&

                                                    date.getMonth()
                                                    === month

                                                    &&

                                                    date.getFullYear()
                                                    === year

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