"use client";


import { useEffect, useState } from "react";

import Link from "next/link";

import {
    AlertTriangle,
    FileWarning,
    ClipboardList,
    Euro,
    Plus
} from "lucide-react";



interface DashboardData {

    missingWorkorders:any[];

    unbilledInspections:any[];

    unpaidInvoices:any[];

}





export default function DashboardPage(){


    const [data,setData] =
        useState<DashboardData | null>(null);


    const [loading,setLoading] =
        useState(true);





    useEffect(()=>{


        async function load(){


            const response =
                await fetch("/api/dashboard");


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






    return (

        <main className="
            p-6
            space-y-6
        ">


            <header>

                <h1 className="
                    text-3xl
                    font-bold
                ">

                    MDB PMS Dashboard

                </h1>


                <p className="
                    text-gray-500
                ">

                    Overzicht van openstaande acties

                </p>


            </header>







            <section className="
                grid
                md:grid-cols-3
                gap-4
            ">


                <div className="
                    border
                    rounded-2xl
                    p-5
                    bg-white
                ">


                    <div className="
                        flex
                        gap-2
                        items-center
                    ">

                        <AlertTriangle/>

                        <h2 className="font-bold">

                            Werkbonnen

                        </h2>

                    </div>


                    <p className="
                        text-3xl
                        mt-3
                    ">

                        {data?.missingWorkorders.length}

                    </p>


                    <p className="text-gray-500">

                        ontbreken

                    </p>


                </div>






                <div className="
                    border
                    rounded-2xl
                    p-5
                    bg-white
                ">


                    <div className="
                        flex
                        gap-2
                        items-center
                    ">


                        <ClipboardList/>


                        <h2 className="font-bold">

                            Opnames

                        </h2>


                    </div>


                    <p className="
                        text-3xl
                        mt-3
                    ">


                        {data?.unbilledInspections.length}


                    </p>


                    <p className="text-gray-500">

                        controleren

                    </p>


                </div>








                <div className="
                    border
                    rounded-2xl
                    p-5
                    bg-white
                ">


                    <div className="
                        flex
                        gap-2
                        items-center
                    ">


                        <Euro/>


                        <h2 className="font-bold">

                            Facturen

                        </h2>


                    </div>



                    <p className="
                        text-3xl
                        mt-3
                    ">


                        {data?.unpaidInvoices.length}


                    </p>


                    <p className="text-gray-500">

                        openstaand

                    </p>


                </div>


            </section>







            <section className="
                border
                rounded-2xl
                bg-white
                p-5
            ">


                <h2 className="
                    font-bold
                    mb-4
                ">

                    Acties nodig

                </h2>





                {data?.missingWorkorders.map((item)=>(


                    <Link

                        key={item.id}

                        href={`/assignments/${item.id}`}

                        className="
                            block
                            border-b
                            py-3
                        "

                    >

                        <div className="flex gap-2">

                            <FileWarning size={18}/>

                            {item.title}

                        </div>


                        <p className="text-sm text-gray-500">

                            {item.customer.name}

                        </p>


                    </Link>


                ))}



                {data?.missingWorkorders.length === 0 && (

                    <p>

                        Geen openstaande werkbonnen 🎉

                    </p>

                )}


            </section>







            <section className="
                flex
                gap-3
                flex-wrap
            ">


                <Link

                    href="/assignments"

                    className="
                        bg-black
                        text-white
                        px-4
                        py-3
                        rounded-xl
                        flex
                        gap-2
                    "

                >

                    <Plus size={18}/>

                    Nieuwe opdracht

                </Link>




                <Link

                    href="/workorders/new"

                    className="
                        border
                        px-4
                        py-3
                        rounded-xl
                    "

                >

                    Nieuwe werkbon

                </Link>


            </section>



        </main>

    );


}