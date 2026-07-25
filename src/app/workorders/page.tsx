"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import DeleteButton from "@/components/DeleteButton";
import { getStatus, WORKORDER_STATUSES } from "@/constants/workorderStatus";



interface Workorder {

    id:string;

    number:string;

    title:string;

    status:string;

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

    assignedUser?:{

        name:string | null;

    } | null;


}







export default function WorkordersPage(){


    const { data: session } =
        useSession();



    const role =
        session?.user?.role || "";



    const canCreateWorkorder =
        role === "admin"
        ||
        role === "office";





    const [workorders,setWorkorders] =
        useState<Workorder[]>([]);



    const [loading,setLoading] =
        useState(true);



    const [search,setSearch] =
        useState("");



    const [status,setStatus] =
        useState("alle");







    async function load(){


        const response =
            await fetch(
                "/api/workorders"
            );


        const data =
            await response.json();


        setWorkorders(data);


        setLoading(false);

    }


    useEffect(()=>{

        load();

    },[]);








    if(loading){


        return (

            <main className="p-6">

                Werkbonnen laden...

            </main>

        );

    }








    const filtered =

        workorders.filter(workorder=>{


            const matchesSearch =

                workorder.number
                .toLowerCase()
                .includes(search.toLowerCase())

                ||

                workorder.title
                .toLowerCase()
                .includes(search.toLowerCase())

                ||

                (workorder.customer?.name ?? workorder.project?.customer.name ?? "—")
                .toLowerCase()
                .includes(search.toLowerCase());





            const matchesStatus =

                status === "alle"

                ||

                workorder.status === status;




            return matchesSearch && matchesStatus;


        });









    return (

        <main className="
            p-6
            space-y-6
            bg-gray-50
            min-h-screen
        ">



            <header className="
                flex
                justify-between
                items-start
            ">


                <div>


                    <h1 className="
                        text-3xl
                        font-bold
                    ">

                        📋 Werkbonnen

                    </h1>


                    <p className="text-gray-500">

                        Overzicht alle werkzaamheden

                    </p>


                </div>





                {
                    canCreateWorkorder && (

                        <Link

                            href="/workorders/new"

                            className="
                                bg-[#d6007e]
                                text-white
                                px-5
                                py-3
                                rounded-xl
                                font-bold
                            "

                        >

                            + Nieuwe werkbon

                        </Link>

                    )
                }




            </header>









            <section className="
                bg-white
                border
                rounded-xl
                p-4
                space-y-4
            ">



                <input

                    value={search}

                    onChange={(e)=>
                        setSearch(
                            e.target.value
                        )
                    }

                    placeholder="Zoek werkbon, klant of project"

                    className="
                        w-full
                        border
                        rounded-xl
                        p-3
                    "

                />





                <select

                    value={status}

                    onChange={(e)=>
                        setStatus(
                            e.target.value
                        )
                    }


                    className="
                        w-full
                        border
                        rounded-xl
                        p-3
                    "

                >

                    <option value="alle">

                        Alle statussen

                    </option>

                    {
                        WORKORDER_STATUSES.map(status=>(

                            <option

                                key={status.key}

                                value={status.key}

                            >

                                {status.label}

                            </option>

                        ))
                    }


                </select>


            </section>









            <section className="space-y-4">


                {
                    filtered.map(workorder=>(


                        <div

                            key={workorder.id}

                            className="
                                bg-white
                                border
                                rounded-xl
                                p-4
                            "

                        >


                            <h2 className="
                                text-xl
                                font-bold
                            ">

                                {workorder.number}

                            </h2>


                            <p>

                                {workorder.title}

                            </p>


                            <p className="mt-2">

                                🏢 {(workorder.customer?.name ?? workorder.project?.customer.name ?? "—")}

                            </p>


                            <p>

                                📍 {workorder.location ?? workorder.project?.name ?? ""}

                            </p>



                            <p>

                                👷 {

                                    workorder.assignedUser?.name
                                    ||
                                    "Geen monteur"

                                }

                            </p>



                            <p className="mt-2">

Status:
                                {" "}
                                <span className={`px-2 py-0.5 rounded-full text-xs ${getStatus(workorder.status).badge}`}>
                                    {getStatus(workorder.status).label}
                                </span>

                            </p>







                            <div className="
                                flex
                                gap-3
                                mt-4
                            ">


                                <Link

                                    href={`/workorders/${workorder.id}`}

                                    className="
                                        bg-black
                                        text-white
                                        px-4
                                        py-3
                                        rounded-xl
                                    "

                                >

                                    Open

                                </Link>




                                <a

                                    href={`/api/workorders/${workorder.id}/pdf`}

                                    className="
                                        border
                                        px-4
                                        py-3
                                        rounded-xl
                                    "

                                >

                                    PDF

                                </a>


                                {
                                    (role === "admin" || role === "office") && (

                                        <DeleteButton

                                            url={`/api/workorders/${workorder.id}`}

                                            label={`werkbon ${workorder.number}`}

                                            onDeleted={load}

                                        />

                                    )
                                }



                            </div>




                        </div>


                    ))
                }



            </section>




        </main>

    );


}