"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StatusFlow from "@/components/workorders/StatusFlow";
import { useParams, useRouter } from "next/navigation";



export default function WorkorderDetailPage(){


    const params = useParams();

    const router = useRouter();


    const id =
        params.id as string;



    const [workorder,setWorkorder] =
        useState<any>(null);



    const [loading,setLoading] =
        useState(true);







    useEffect(()=>{


        async function load(){


            const response =
                await fetch(
                    `/api/workorders/${id}`
                );


            const data =
                await response.json();



            setWorkorder(data);


            setLoading(false);


        }


        load();


    },[id]);









    async function deleteWorkorder(){


        const confirmDelete =
            confirm(
                "Werkbon verwijderen?"
            );


        if(!confirmDelete){

            return;

        }




        const response =
            await fetch(

                `/api/workorders/${id}`,

                {

                    method:"DELETE"

                }

            );




        if(response.ok){


            alert(
                "Werkbon verwijderd"
            );


            router.push(
                "/workorders"
            );


        }


    }








    if(loading){


        return (

            <main className="p-6">

                Laden...

            </main>

        );

    }






    if(!workorder){


        return (

            <main className="p-6">

                Werkbon niet gevonden

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

                    📋 {workorder.number}

                </h1>


                <p className="text-gray-500">

                    {workorder.title}

                </p>


                <Link

                    href={`/workorders/${workorder.id}/edit`}

                    className="
                        inline-block
                        mt-3
                        text-sm
                        text-blue-700
                        border
                        border-blue-200
                        rounded-lg
                        px-4
                        py-2
                        hover:bg-blue-50
                    "

                >

                    ✏️ Werkbon wijzigen

                </Link>


            </header>







            <section className="
                bg-white
                border
                rounded-2xl
                p-5
                space-y-2
            ">


                <p>
                    🏢 {workorder.customer?.name ?? workorder.project?.customer?.name ?? "—"}
                </p>


                <p>
                    📍 {workorder.location ?? workorder.customer?.address ?? workorder.project?.customer?.address ?? "-"}
                </p>


                <p>
                    
                </p>


                <p>
                    👷 {workorder.assignedUser?.name || "Geen monteur"}
                </p>


            </section>


            <section className="
                bg-white
                border
                rounded-2xl
                p-5
                mt-4
            ">

                <h2 className="font-bold mb-3">

                    Status

                </h2>

                <StatusFlow

                    workorderId={workorder.id}

                    current={workorder.status}

                    onChanged={(newStatus)=>
                        setWorkorder({
                            ...workorder,
                            status:newStatus
                        })
                    }

                />

            </section>







            <section className="
                bg-white
                border
                rounded-2xl
                p-5
            ">


                <h2 className="font-bold mb-3">

                    📝 Werkzaamheden

                </h2>


                <p>

                    {workorder.description || "Geen omschrijving"}

                </p>


            </section>





            {workorder.internalNotes && (

                <section className="
                    bg-amber-50
                    border
                    border-amber-300
                    rounded-2xl
                    p-5
                ">


                    <h2 className="font-bold mb-3">

                        🔒 Interne notitie

                    </h2>


                    <p className="whitespace-pre-wrap">

                        {workorder.internalNotes}

                    </p>


                    <p className="text-xs text-amber-700 mt-3">

                        Niet zichtbaar voor de klant en niet opgenomen in de PDF.

                    </p>


                </section>

            )}







            <section className="
                bg-white
                border
                rounded-2xl
                p-5
            ">


                <h2 className="font-bold mb-3">

                    ⏱ Uren

                </h2>


                {
                    workorder.hours?.map((hour:any)=>(

                        <p key={hour.id}>

                            {hour.hours} uur

                        </p>

                    ))
                }


            </section>
















            <section className="
                flex
                gap-3
            ">


                <a

                    href={`/api/workorders/${id}/pdf`}

                    className="
                        bg-black
                        text-white
                        px-5
                        py-3
                        rounded-xl
                    "

                >

                    📄 PDF

                </a>





                <button

                    onClick={deleteWorkorder}

                    className="
                        bg-red-600
                        text-white
                        px-5
                        py-3
                        rounded-xl
                    "

                >

                    🗑 Verwijderen

                </button>


            </section>



        </main>

    );


}