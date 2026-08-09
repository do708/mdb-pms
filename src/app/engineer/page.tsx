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
            <p className="text-gray-500">Opdrachten laden…</p>
        );

}








    return (

        <div className="space-y-6 -m-2 sm:-m-0">



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

                            Geen geplande opdrachten

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
                                    flex
                                    items-center
                                    justify-center
                                    w-full
                                    mt-4
                                    bg-[#d6007e]
                                    text-white
                                    px-4
                                    py-4
                                    min-h-[48px]
                                    rounded-xl
                                    font-bold
                                    text-base
                                "

                            >

                                Open opdracht

                            </Link>





                        </div>


                    ))
                }



            </section>




        </div>

    );


}