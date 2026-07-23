"use client";

import { useEffect, useState } from "react";
import { canAccessOffice } from "@/lib/auth/checkRole";


interface DashboardData {

    counters:{

        open:number;

        inProgress:number;

        completed:number;

    };


    recent:any[];

}






export default function DashboardPage(){


    const [data,setData] =
        useState<DashboardData | null>(null);



    const [loading,setLoading] =
        useState(true);







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

const user = getCurrentUser();

const userRole = user?.role || "";

if(!canAccessOffice(userRole)){


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

                    📊 MDB PMS Dashboard

                </h1>


                <p className="text-gray-500">

                    Overzicht projecten en werkbonnen

                </p>


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

                        Open

                    </p>


                    <p className="text-3xl font-bold">

                        {data?.counters.open}

                    </p>

                </div>







                <div className="
                    bg-white
                    border
                    rounded-2xl
                    p-5
                ">

                    <p className="text-gray-500">

                        In uitvoering

                    </p>


                    <p className="text-3xl font-bold">

                        {data?.counters.inProgress}

                    </p>

                </div>







                <div className="
                    bg-white
                    border
                    rounded-2xl
                    p-5
                ">

                    <p className="text-gray-500">

                        Afgerond

                    </p>


                    <p className="text-3xl font-bold">

                        {data?.counters.completed}

                    </p>

                </div>




            </section>









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
                                        workorder.project.customer.name
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