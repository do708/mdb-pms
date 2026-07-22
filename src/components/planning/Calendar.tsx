"use client";

import { useState } from "react";
import Link from "next/link";

import DraggableAssignment from "./DraggableAssignment";


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
                "assignmentId"
            );



        const newDate =
            new Date(
                year,
                month,
                day
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
                grid-cols-7
                gap-2
            ">



                {
                    [
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
                    days.map((day,index)=>(


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

                                                    onDropDate={
                                                        onDropDate ||
                                                        (()=>{})
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



        </section>

    );

}