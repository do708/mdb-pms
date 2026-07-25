"use client";

import { useEffect, useState } from "react";

import Link from "next/link";



interface WorkorderWithNote {

    id:string;

    number:string;

    title:string;

    status:string;

    internalNotes:string | null;

    location:string | null;

    customer:{
        name:string;
    } | null;

    project:{

        name:string;

        customer:{

            name:string;

        };

    } | null;

    assignedUser:{

        name:string | null;

    } | null;

}



export default function NotesPage(){


    const [workorders,setWorkorders] =
        useState<WorkorderWithNote[]>([]);


    const [loading,setLoading] =
        useState(true);




    useEffect(()=>{


        async function load(){


            const response =
                await fetch("/api/workorders");


            const data =
                await response.json();


            setWorkorders(
                Array.isArray(data)
                ?
                data.filter(
                    (item:WorkorderWithNote)=>
                        item.internalNotes
                )
                :
                []
            );


            setLoading(false);


        }


        load();


    },[]);




    if(loading){

        return (

            <main className="p-6">

                Notities laden...

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

                    Interne notities

                </h1>


                <p className="
                    text-gray-500
                ">

                    Alle werkbonnen met een interne notitie

                </p>


            </header>




            {
                workorders.length === 0 && (

                    <p className="text-gray-500">

                        Geen werkbonnen met interne notities.

                    </p>

                )
            }




            <div className="space-y-4">

                {
                    workorders.map(workorder=>(


                        <Link

                            key={workorder.id}

                            href={`/workorders/${workorder.id}`}

                            className="
                                block
                                bg-amber-50
                                border
                                border-amber-300
                                rounded-xl
                                p-4
                                hover:bg-amber-100
                            "

                        >


                            <div className="
                                flex
                                justify-between
                                mb-2
                            ">


                                <strong>

                                    {workorder.number}
                                    {" · "}
                                    {workorder.title}

                                </strong>


                                <span className="
                                    text-sm
                                    text-gray-500
                                ">

                                    {workorder.status}

                                </span>


                            </div>


                            <p className="
                                text-sm
                                text-gray-500
                                mb-2
                            ">

                                🏢 {workorder.customer?.name ?? workorder.project?.customer.name ?? "—"}
                                {" · "}
                                📍 {workorder.location ?? workorder.project?.name ?? ""}

                                {
                                    workorder.assignedUser?.name && (

                                        <>
                                            {" · "}
                                            👷 {workorder.assignedUser.name}
                                        </>

                                    )
                                }

                            </p>


                            <p className="whitespace-pre-wrap">

                                🔒 {workorder.internalNotes}

                            </p>


                        </Link>


                    ))
                }

            </div>


        </main>

    );

}
