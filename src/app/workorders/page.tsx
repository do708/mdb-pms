"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import DeleteButton from "@/components/DeleteButton";
import { PlanningStatusIcon, WorkorderStatusIconLegend } from "@/components/planning/PlanningStatusIcon";
import { getStatus, migrateStatus, WORKORDER_STATUSES } from "@/constants/workorderStatus";



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

                Opdrachten laden...

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
                        text-2xl
                        font-bold
                    ">

                        📋 Opdrachten

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

                            + Nieuwe opdracht

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

                    placeholder="Zoek opdracht, klant of project"

                    className="
                        w-full
                        border
                        rounded-xl
                        p-3
                    "

                />





                <WorkorderStatusIconLegend />





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
                                p-3
                                flex
                                flex-col
                                gap-3
                                sm:flex-row
                                sm:items-start
                                sm:justify-between
                            "

                        >


                            <div className="min-w-0 flex-1">

                                <div className="
                                    flex
                                    items-center
                                    gap-2
                                    flex-wrap
                                ">

                                    <span className="font-bold text-sm">

                                        {workorder.number}

                                    </span>

                                    <span className={`
                                        inline-flex items-center gap-1.5
                                        px-2 py-0.5 rounded-full text-xs
                                        ${getStatus(migrateStatus(workorder.status)).badge}
                                    `}>
                                        <PlanningStatusIcon
                                            status={workorder.status}
                                            className="h-3.5 w-3.5"
                                        />
                                        {
                                            getStatus(migrateStatus(workorder.status)).label
                                        }
                                    </span>

                                </div>


                                <p className="text-sm truncate">

                                    {workorder.title}

                                </p>


                                <p className="text-xs text-gray-500 truncate">

                                    🏢 {(workorder.customer?.name ?? workorder.project?.customer.name ?? "—")}

                                    {" · 📍 "}

                                    {workorder.location ?? workorder.project?.name ?? "—"}

                                    {" · 👷 "}

                                    {workorder.assignedUser?.name || "Geen monteur"}

                                </p>

                            </div>


                            <div className="
                                flex
                                flex-wrap
                                gap-2
                                items-center
                                sm:justify-end
                                sm:max-w-[min(100%,22rem)]
                            ">

                                <Link

                                    href={`/workorders/${workorder.id}`}

                                    title="Geplande opdracht openen"

                                    className="
                                        bg-black
                                        text-white
                                        px-3
                                        py-1.5
                                        rounded-lg
                                        text-sm
                                        font-medium
                                    "

                                >

                                    Openen

                                </Link>


                                <a

                                    href={`/api/workorders/${workorder.id}/pdf`}

                                    title="PDF download"

                                    className="
                                        border
                                        px-3
                                        py-1.5
                                        rounded-lg
                                        text-sm
                                    "

                                >

                                    PDF

                                </a>


                                {
                                    (role === "admin" || role === "office") && (

                                        <>

                                            <a

                                                href={`/api/workorders/${workorder.id}/photos/zip`}

                                                title="ZIP download met alle foto's"

                                                className="
                                                    border
                                                    px-3
                                                    py-1.5
                                                    rounded-lg
                                                    text-sm
                                                "

                                            >

                                                ZIP

                                            </a>

                                            <DeleteButton

                                                url={`/api/workorders/${workorder.id}`}

                                                label={`Opdracht ${workorder.number}`}

                                                onDeleted={load}

                                                compact

                                                title="Prullenbak"

                                            />

                                        </>

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