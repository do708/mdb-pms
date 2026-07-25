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





export default function PlanningPage(){


    const { data:session } =
        useSession();


    // Monteur mag de planning inzien maar niet wijzigen
    const canEdit =
        session?.user?.role !== "engineer";


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

        // Een monteur ziet in de weekweergave alleen zijn eigen rij
        setEngineers(
            session?.user?.role === "engineer"
            ?
            allEngineers.filter(
                (e:any)=>e.id === session?.user?.id
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


        loadPlanning();


    },[]);







    async function updatePlanning(

        id:string,

        date:string

    ){



        const response =
            await fetch(

                `/api/workorders/${id}`,

                {

                    method:"PUT",

                    headers:{

                        "Content-Type":"application/json"

                    },

                    body:JSON.stringify({

                        plannedDate:date

                    })

                }

            );


        if(!response.ok){

            alert(
                "Planning bijwerken mislukt"
            );

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


            <header>


                <h1 className="
                    text-2xl
                    font-bold
                ">

                    Planning

                </h1>


                <p className="
                    text-gray-500
                ">

                    Wie is waar ingepland

                </p>


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









            <div className="
                flex
                gap-3
            ">


                <button

                    onClick={()=>setView("week")}

                    className={`
                        px-4
                        py-2
                        rounded-xl
                        ${
                            view==="week"
                            ?
                            "bg-blue-600 text-white"
                            :
                            "border"
                        }
                    `}

                >

                    Week

                </button>





                <button

                    onClick={()=>setView("month")}

                    className={`
                        px-4
                        py-2
                        rounded-xl
                        ${
                            view==="month"
                            ?
                            "bg-blue-600 text-white"
                            :
                            "border"
                        }
                    `}

                >

                    Maand

                </button>


            </div>







            {

                view==="month"

                ?

                <Calendar

                    items={items}

                    leave={leave}

                    onDropDate={
                        canEdit
                        ?
                        updatePlanning
                        :
                        undefined
                    }

                />


                :

                <div>

                    <div className="
                        flex
                        items-center
                        justify-between
                        mb-3
                    ">

                        <button

                            onClick={()=>shiftWeek(-1)}

                            className="
                                border
                                rounded-xl
                                px-4
                                py-2
                                hover:bg-gray-50
                            "

                        >

                            ← Vorige week

                        </button>


                        <div className="
                            flex
                            items-center
                            gap-2
                        ">

                            <span className="font-medium">

                                {
                                    weekStart.toLocaleDateString("nl-NL",{
                                        day:"numeric",
                                        month:"long"
                                    })
                                }

                                {" – "}

                                {
                                    (()=>{
                                        const end = new Date(weekStart);
                                        end.setDate(end.getDate() + 4);
                                        return end.toLocaleDateString("nl-NL",{
                                            day:"numeric",
                                            month:"long",
                                            year:"numeric"
                                        });
                                    })()
                                }

                            </span>

                            <button

                                onClick={thisWeek}

                                className="
                                    text-sm
                                    text-blue-600
                                    underline
                                "

                            >

                                Vandaag

                            </button>

                        </div>


                        <button

                            onClick={()=>shiftWeek(1)}

                            className="
                                border
                                rounded-xl
                                px-4
                                py-2
                                hover:bg-gray-50
                            "

                        >

                            Volgende week →

                        </button>

                    </div>


                    <WeekView

                        items={items}

                        leave={leave}

                        engineers={engineers}

                        weekStart={weekStart}

                    />

                </div>

            }



        </main>

    );

}