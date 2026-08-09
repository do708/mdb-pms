"use client";


import { useEffect, useState } from "react";

import Link from "next/link";

import {
    CalendarDays,
    UserRound,
    FileText,
    ClipboardCheck,
    StickyNote
} from "lucide-react";



interface Assignment {

    id:string;

    number:string;

    title:string;

    type:string;

    status:string;

    internalNotes:string | null;

    plannedDate:string | null;


    customer:{
        name:string;
        email:string | null;
        phone:string | null;
    };


    users:{
        user:{
            name:string | null;
        }
    }[];


    workorders:{

        id:string;

        number:string;

        documents:{
            id:string;
            name:string;
            url:string;
        }[];

    }[];


    invoices:{
        number:string;
        status:string;
        amount:number | null;
    }[];

}





export default function AssignmentDetailPage({

    params

}:{

    params:{
        id:string
    }

}){


    const [assignment,setAssignment] =
        useState<Assignment | null>(null);


    const [loading,setLoading] =
        useState(true);





    useEffect(()=>{


        async function load(){


            const response =
                await fetch(
                    `/api/assignments/${params.id}`
                );


            const data =
                await response.json();



            setAssignment(data);


            setLoading(false);


        }


        load();


    },[params.id]);






    if(loading){

        return (

            <main className="p-6">

                Laden...

            </main>

        );

    }





    if(!assignment){

        return (

            <main className="p-6">

                Opdracht niet gevonden

            </main>

        );

    }





    return (

        <main className="
            p-6
            space-y-6
        ">



            <section className="
                bg-white
                border
                rounded-2xl
                p-6
            ">


                <h1 className="
                    text-2xl
                    font-bold
                ">

                    {assignment.title}

                </h1>


                <p className="
                    text-gray-500
                ">

                    {assignment.number}

                </p>



                <div className="
                    mt-4
                    flex
                    gap-3
                    flex-wrap
                ">


                    <span className="
                        bg-blue-100
                        px-3
                        py-1
                        rounded-full
                    ">

                        {assignment.status}

                    </span>


                    <span className="
                        bg-gray-100
                        px-3
                        py-1
                        rounded-full
                    ">

                        {assignment.type}

                    </span>


                </div>


            </section>







            <section className="
                grid
                md:grid-cols-2
                gap-6
            ">



                <div className="
                    bg-white
                    border
                    rounded-2xl
                    p-5
                ">


                    <h2 className="
                        font-bold
                        mb-3
                    ">

                        Opdrachtgever

                    </h2>


                    <p>

                        {assignment.customer.name}

                    </p>


                    <p>

                        {assignment.customer.email}

                    </p>


                    <p>

                        {assignment.customer.phone}

                    </p>


                </div>






                <div className="
                    bg-white
                    border
                    rounded-2xl
                    p-5
                ">


                    <h2 className="
                        font-bold
                        mb-3
                    ">

                        Planning

                    </h2>



                    <p className="
                        flex
                        gap-2
                    ">

                        <CalendarDays size={18}/>


                        {assignment.plannedDate

                            ? new Date(
                                assignment.plannedDate
                            ).toLocaleDateString("nl-NL")

                            : "Nog niet gepland"

                        }


                    </p>




                    <div className="
                        mt-3
                    ">


                        <p className="font-medium">

                            Monteurs

                        </p>


                        {assignment.users.length === 0 && (

                            <p>

                                Geen monteur toegewezen

                            </p>

                        )}



                        {assignment.users.map((item,index)=>(

                            <p key={index}
                               className="flex gap-2">

                                <UserRound size={16}/>

                                {item.user.name}

                            </p>

                        ))}


                    </div>


                </div>


            </section>







            <section className="
                bg-white
                border
                rounded-2xl
                p-5
            ">


                <h2 className="
                    font-bold
                    flex
                    gap-2
                    mb-3
                ">

                    <StickyNote size={18}/>

                    Interne notities

                </h2>


                <p>

                    {assignment.internalNotes || 
                    "Geen interne notities"}

                </p>


            </section>








            <section className="
                bg-white
                border
                rounded-2xl
                p-5
            ">


                <h2 className="
                    font-bold
                    mb-3
                ">

                    Gekoppelde opdrachten

                </h2>


                {assignment.workorders.map((workorder)=>(


                    <div key={workorder.id}
                         className="
                         border
                         rounded-xl
                         p-3
                         mb-2
                         ">


                        <p className="font-medium">

                            {workorder.number}

                        </p>


                        {workorder.documents.map((doc)=>(


                            <a

                                key={doc.id}

                                href={doc.url}

                                target="_blank"

                                className="
                                    text-blue-700
                                    flex
                                    gap-2
                                    mt-2
                                "

                            >

                                <FileText size={16}/>

                                {doc.name}

                            </a>


                        ))}


                    </div>


                ))}


            </section>







            <section className="
                bg-white
                border
                rounded-2xl
                p-5
            ">


                <h2 className="
                    font-bold
                    flex
                    gap-2
                ">

                    <ClipboardCheck size={18}/>

                    Facturen

                </h2>



                {assignment.invoices.length === 0 && (

                    <p>

                        Geen facturen

                    </p>

                )}



                {assignment.invoices.map((invoice,index)=>(


                    <p key={index}>

                        {invoice.number} -
                        {invoice.status}

                    </p>


                ))}


            </section>



        </main>

    );

}