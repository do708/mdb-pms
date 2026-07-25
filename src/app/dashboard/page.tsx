"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { canAccessOffice } from "@/lib/auth/checkRole";


interface DashboardData {

    counters:{

        ingepland:number;

        uitgevoerd:number;

        teLaat:number;

    };


    teLaat:any[];


    recent:any[];

}






export default function DashboardPage(){


    const [data,setData] =
        useState<DashboardData | null>(null);



    const [loading,setLoading] =
        useState(true);


    const { data: session, status } = useSession();

    const userRole = session?.user?.role ?? "";







    useEffect(()=>{


        async function load(){


            const response =
                await fetch(

                    "/api/dashboard"

                );


            const result =
                await response.json();



            setData(result);


            setLoading(false);


        }



        load();


    },[]);








    if(loading){


        return (

            <main className="p-6">

                Dashboard laden...

            </main>

        );

    }

    if (status !== "loading" && !canAccessOffice(userRole)) {

        return (

            <main className="p-6">

                Geen toegang

            </main>

        );

    }






    return (

        <main className="
            p-6
            space-y-6
            bg-gray-50
            min-h-screen
        ">


            <header>


                <h1 className="
                    text-3xl
                    font-bold
                ">

                    Dashboard

                </h1>


            </header>








            <section className="
                grid
                grid-cols-1
                md:grid-cols-3
                gap-5
            ">



                <div className="
                    bg-white
                    border
                    rounded-2xl
                    p-5
                ">

                    <p className="text-gray-500">

                        Ingepland

                    </p>


                    <p className="text-3xl font-bold text-blue-600">

                        {data?.counters.ingepland ?? 0}

                    </p>

                </div>



                <div className="
                    bg-white
                    border
                    rounded-2xl
                    p-5
                ">

                    <p className="text-gray-500">

                        Uitgevoerd

                    </p>


                    <p className="text-3xl font-bold text-indigo-600">

                        {data?.counters.uitgevoerd ?? 0}

                    </p>

                </div>



                <div className={`
                    border
                    rounded-2xl
                    p-5
                    ${
                        (data?.counters.teLaat ?? 0) > 0
                        ?
                        "bg-red-50 border-red-300"
                        :
                        "bg-white"
                    }
                `}>

                    <p className={
                        (data?.counters.teLaat ?? 0) > 0
                        ?
                        "text-red-700 font-medium"
                        :
                        "text-gray-500"
                    }>

                        Nog in te vullen

                    </p>


                    <p className={`
                        text-3xl
                        font-bold
                        ${
                            (data?.counters.teLaat ?? 0) > 0
                            ?
                            "text-red-600"
                            :
                            ""
                        }
                    `}>

                        {data?.counters.teLaat ?? 0}

                    </p>


                    <p className="text-xs text-gray-500 mt-1">

                        Datum verstreken, monteur nog niet ingevuld

                    </p>

                </div>




            </section>




            {
                (data?.teLaat?.length ?? 0) > 0 && (

                    <section className="
                        bg-red-50
                        border
                        border-red-300
                        rounded-2xl
                        p-5
                    ">

                        <h2 className="
                            text-xl
                            font-bold
                            mb-4
                            text-red-700
                        ">

                            ⚠️ Nog in te vullen ({data?.teLaat?.length})

                        </h2>


                        <div className="space-y-3">

                            {
                                data?.teLaat?.map(workorder=>(

                                    <a

                                        key={workorder.id}

                                        href={`/workorders/${workorder.id}`}

                                        className="
                                            flex
                                            justify-between
                                            items-center
                                            bg-white
                                            border
                                            border-red-200
                                            rounded-xl
                                            p-3
                                            hover:bg-red-50
                                        "

                                    >

                                        <div>

                                            <p className="font-bold">

                                                {workorder.number} — {workorder.title}

                                            </p>

                                            <p className="text-sm text-gray-500">

                                                🏢 {
                                                    workorder.customer?.name
                                                    ?? workorder.project?.customer?.name
                                                    ?? "—"
                                                }

                                                {" · "}

                                                👷 {workorder.assignedUser?.name ?? "Geen monteur"}

                                            </p>

                                        </div>


                                        <span className="text-sm text-red-600 font-medium">

                                            Gepland:
                                            {" "}
                                            {
                                                workorder.plannedDate
                                                ?
                                                new Date(workorder.plannedDate)
                                                    .toLocaleDateString("nl-NL")
                                                :
                                                "—"
                                            }

                                        </span>

                                    </a>

                                ))
                            }

                        </div>

                    </section>

                )
            }




            <section className="
                bg-white
                border
                rounded-2xl
                p-5
            ">


                <h2 className="
                    text-xl
                    font-bold
                    mb-4
                ">

                    Laatste werkbonnen

                </h2>





                <div className="space-y-3">


                    {
                        data?.recent.map(workorder=>(


                            <div

                                key={workorder.id}

                                className="
                                    border
                                    rounded-xl
                                    p-4
                                "

                            >

                                <p className="font-bold">

                                    {workorder.number}

                                </p>


                                <p>

                                    {workorder.title}

                                </p>


                                <p className="text-sm text-gray-500">

                                    {
                                        (workorder.customer?.name ?? workorder.project?.customer?.name ?? "—")
                                    }

                                    {" - "}

                                    {
                                        workorder.status
                                    }

                                </p>


                            </div>


                        ))
                    }


                </div>





            </section>





        </main>

    );


}