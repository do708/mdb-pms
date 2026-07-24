"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { canAccessEngineer } from "@/lib/auth/checkRole";


interface Assignment {

    id:string;

    title:string;

    type:string;

    status:string;

    plannedDate:string | null;


    customer:{

        name:string;

        address:string | null;

        color:string;

    };


    users:{

        user:{

            name:string | null;

        }

    }[];

}





export default function EngineerPage(){


    const { data: session, status } = useSession();



    const [items,setItems] =
        useState<Assignment[]>([]);



    const [loading,setLoading] =
        useState(true);







    useEffect(()=>{


        async function load(){


            const response =
                await fetch("/api/engineer");


            const data =
                await response.json();


            setItems(data);


            setLoading(false);


        }


        load();


    },[]);







    if(loading){


        return (

            <main className="p-6">

                Laden...

            </main>

        );

    }

const userRole = session?.user?.role ?? "";


if(status !== "loading" && !canAccessEngineer(userRole)){


    return (

        <main className="p-6">

            Geen toegang

        </main>

    );

}





    return (

        <main className="
            p-4
            space-y-5
        ">


            <header>


                <h1 className="
                    text-3xl
                    font-bold
                ">

                    👷 Monteur planning

                </h1>


                <p className="text-gray-500">

                    Vandaag en komende werkzaamheden

                </p>


            </header>







            {
                items.length === 0 && (

                    <div className="
                        border
                        rounded-2xl
                        p-5
                    ">

                        Geen geplande werkzaamheden

                    </div>

                )

            }







            {
                items.map(item=>(


                    <section

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
                                item.customer.color

                        }}

                    >



                        <h2 className="
                            text-xl
                            font-bold
                        ">

                            {item.title}

                        </h2>





                        <p className="
                            mt-2
                        ">

                            🏢 {item.customer.name}

                        </p>





                        <p>

                            📍 {item.customer.address || "Geen adres"}

                        </p>





                        <p>

                            📅 {

                                item.plannedDate

                                ?

                                new Date(
                                    item.plannedDate
                                )
                                .toLocaleDateString(
                                    "nl-NL"
                                )

                                :

                                "Geen datum"

                            }

                        </p>







                        <p className="
                            mt-2
                        ">

                            👥

                            {
                                item.users

                                .map(
                                    x=>x.user.name
                                )

                                .join(", ")

                            }

                        </p>








                        <div className="
                            flex
                            gap-3
                            mt-5
                        ">


                            <Link

                                href={`/engineer/workorders/${item.id}`}

                                className="
                                    bg-black
                                    text-white
                                    px-4
                                    py-3
                                    rounded-xl
                                "

                            >

                                Open opdracht

                            </Link>



                        </div>





                    </section>


                ))

            }



        </main>

    );


}