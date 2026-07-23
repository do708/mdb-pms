"use client";

import { useEffect, useState } from "react";
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
                    text-3xl
                    font-bold
                ">

                    📋 {workorder.number}

                </h1>


                <p className="text-gray-500">

                    {workorder.title}

                </p>


            </header>







            <section className="
                bg-white
                border
                rounded-2xl
                p-5
                space-y-2
            ">


                <p>
                    🏢 {workorder.project.customer.name}
                </p>


                <p>
                    📍 {workorder.project.customer.address || "-"}
                </p>


                <p>
                    📁 {workorder.project.name}
                </p>


                <p>
                    👷 {workorder.assignedUser?.name || "Geen monteur"}
                </p>


                <p>
                    Status: {workorder.status}
                </p>


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
                bg-white
                border
                rounded-2xl
                p-5
            ">


                <h2 className="font-bold mb-3">

                    📦 Materialen

                </h2>



                {
                    workorder.materials?.map((item:any)=>(

                        <p key={item.id}>

                            {item.name} ({item.quantity})

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