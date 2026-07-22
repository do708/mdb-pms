"use client";


import { useEffect, useState } from "react";

import Link from "next/link";

import {
    ClipboardList,
    CalendarDays,
    UserRound,
    FileText
} from "lucide-react";





interface Assignment {

    id:string;

    number:string;

    title:string;

    type:string;

    status:string;

    plannedDate:string | null;

    customer:{

        name:string;

    };


    users:{

        user:{

            name:string | null;

        }

    }[];


}






export default function AssignmentsPage(){


    const [assignments,setAssignments] =
        useState<Assignment[]>([]);


    const [loading,setLoading] =
        useState(true);





    useEffect(()=>{


        async function load(){


            const response =
                await fetch("/api/assignments");


            const data =
                await response.json();


            setAssignments(data);


            setLoading(false);


        }


        load();


    },[]);






    return (

        <main className="
            p-6
            space-y-6
        ">


            <div>

                <h1 className="
                    text-2xl
                    font-bold
                ">

                    Opdrachten

                </h1>


                <p className="
                    text-gray-500
                ">

                    Opnames, installaties, onderhoud en projecten

                </p>

            </div>





            {loading && (

                <p>

                    Laden...

                </p>

            )}







            <div className="
                grid
                gap-4
            ">


                {assignments.map((assignment)=>(


                    <Link

                        key={assignment.id}

                        href={`/assignments/${assignment.id}`}

                        className="
                            bg-white
                            border
                            rounded-2xl
                            p-5
                            hover:shadow
                        "

                    >



                        <div className="
                            flex
                            justify-between
                            items-start
                        ">



                            <div>


                                <div className="
                                    flex
                                    gap-2
                                    items-center
                                ">

                                    <ClipboardList size={20}/>


                                    <h2 className="
                                        font-bold
                                    ">

                                        {assignment.title}

                                    </h2>


                                </div>




                                <p className="
                                    text-sm
                                    text-gray-500
                                    mt-2
                                ">


                                    {assignment.number}


                                </p>



                            </div>






                            <span className="
                                bg-blue-100
                                text-blue-700
                                px-3
                                py-1
                                rounded-full
                                text-sm
                            ">

                                {assignment.status}

                            </span>




                        </div>








                        <div className="
                            mt-4
                            space-y-2
                            text-sm
                        ">


                            <p>

                                👤 {assignment.customer.name}

                            </p>




                            <p>

                                📌 {assignment.type}

                            </p>





                            <p className="
                                flex
                                gap-2
                                items-center
                            ">


                                <CalendarDays size={16}/>


                                {assignment.plannedDate

                                    ? new Date(
                                        assignment.plannedDate
                                    ).toLocaleDateString("nl-NL")

                                    : "Nog niet gepland"

                                }


                            </p>







                            <p className="
                                flex
                                gap-2
                                items-center
                            ">

                                <UserRound size={16}/>


                                {assignment.users.length > 0

                                    ?

                                    assignment.users
                                    .map(
                                        x=>x.user.name
                                    )
                                    .join(", ")

                                    :

                                    "Geen monteur toegewezen"

                                }


                            </p>



                        </div>







                        <div className="
                            mt-4
                            flex
                            gap-2
                            items-center
                            text-blue-700
                            text-sm
                        ">

                            <FileText size={16}/>

                            Bekijk opdracht

                        </div>




                    </Link>


                ))}


            </div>



        </main>

    );


}