"use client";

import { useEffect, useState } from "react";

import Link from "next/link";



interface EngineerWorkorder {


    id:string;

    number:string;

    title:string;

    status:string;

    plannedDate:string | null;


    customer?:{

        name:string;

        color?:string | null;

    } | null;


    project?:{

        name:string;

        customer?:{

            name:string;

            color?:string | null;

        } | null;


    } | null;



    assignedUser?:{

        name:string | null;

    } | null;


}







export default function EngineerPage(){



    const [workorders,setWorkorders] =
        useState<EngineerWorkorder[]>([]);



    const [loading,setLoading] =
        useState(true);







    useEffect(()=>{


        async function load(){


            const response =
                await fetch(

                    "/api/engineer"

                );



            const data =
                await response.json();



            if(Array.isArray(data)){


                setWorkorders(data);


            }


            setLoading(false);


        }



        load();


    },[]);








    if(loading){


        return (

            <main className="p-6">

                Werkbonnen laden...

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
                    text-2xl
                    font-bold
                ">

                    👷 Monteur omgeving

                </h1>


                <p className="text-gray-500">

                    Mijn geplande werkzaamheden

                </p>


            </header>









            <section className="space-y-4">


                {
                    workorders.length === 0 && (


                        <div className="
                            bg-white
                            border
                            rounded-2xl
                            p-5
                        ">

                            Geen geplande werkbonnen

                        </div>


                    )
                }







                {
                    workorders.map(item=>(


                        <div

                            key={item.id}

                            className="
                                bg-white
                                border
                                rounded-2xl
                                p-5
                                border-l-8
                            "

                            style={{

                                borderLeftColor:
                                    item.project?.customer?.color
                                    ||
                                    "#000000"

                            }}

                        >


                            <h2 className="
                                text-xl
                                font-bold
                            ">

                                {item.number}

                            </h2>





                            <p>

                                {item.title}

                            </p>





                            <p className="mt-2">

                                🏢{" "}

                                {
                                    item.customer?.name
                                    ||
                                    item.project?.customer?.name
                                    ||
                                    "Geen klant"
                                }


                            </p>





                            <p>

                                📁{" "}

                                {
                                    item.project?.name
                                    ||
                                    item.title
                                    ||
                                    "Geen project"
                                }

                            </p>





                            <p>

                                Status:
                                {" "}
                                {item.status}

                            </p>





                            <p>

                                👷{" "}

                                {
                                    item.assignedUser?.name
                                    ||
                                    "Niet toegewezen"
                                }

                            </p>








                            <Link

                                href={`/engineer/workorders/${item.id}`}

                                className="
                                    inline-block
                                    mt-4
                                    bg-black
                                    text-white
                                    px-4
                                    py-3
                                    rounded-xl
                                "

                            >

                                Open werkbon

                            </Link>





                        </div>


                    ))
                }



            </section>




        </main>

    );


}