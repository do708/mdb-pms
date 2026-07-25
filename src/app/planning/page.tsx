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



    const [conflicts,setConflicts] =
        useState<Conflict[]>([]);



    const [view,setView] =
        useState<"month"|"week">("month");



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





        setItems(
            Array.isArray(planningData)
            ?
            planningData
            :
            []
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
                    text-3xl
                    font-bold
                ">

                    Planning

                </h1>


                <p className="
                    text-gray-500
                ">

                    Werkplanning MDB PMS

                </p>


            </header>







            {
                conflicts.length > 0 && (

                    <section className="
                        bg-red-100
                        border
                        border-red-300
                        rounded-2xl
                        p-5
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

                    onClick={()=>setView("month")}

                    className={`
                        px-4
                        py-2
                        rounded-xl
                        ${
                            view==="month"
                            ?
                            "bg-black text-white"
                            :
                            "border"
                        }
                    `}

                >

                    Maand

                </button>





                <button

                    onClick={()=>setView("week")}

                    className={`
                        px-4
                        py-2
                        rounded-xl
                        ${
                            view==="week"
                            ?
                            "bg-black text-white"
                            :
                            "border"
                        }
                    `}

                >

                    Week

                </button>


            </div>







            {

                view==="month"

                ?

                <Calendar

                    items={items}

                    onDropDate={
                        canEdit
                        ?
                        updatePlanning
                        :
                        undefined
                    }

                />


                :

                <WeekView

                    items={items}

                />

            }



        </main>

    );

}