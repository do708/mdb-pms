"use client";

import { useEffect, useState } from "react";

import Link from "next/link";



interface Workorder {


    id:string;

    number:string;

    title:string;

    status:string;


    project:{

        name:string;

        customer:{

            name:string;

        };

    };


    assignedUser?:{

        name:string | null;

    } | null;


}







export default function WorkordersPage(){


    const [workorders,setWorkorders] =
        useState<Workorder[]>([]);



    const [loading,setLoading] =
        useState(true);



    const [search,setSearch] =
        useState("");



    const [status,setStatus] =
        useState("alle");







    useEffect(()=>{


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
                .includes(
                    search.toLowerCase()
                )

                ||

                workorder.title
                .toLowerCase()
                .includes(
                    search.toLowerCase()
                )

                ||

                workorder.project.customer.name
                .toLowerCase()
                .includes(
                    search.toLowerCase()
                );





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



            <header>


                <h1 className="
                    text-3xl
                    font-bold
                ">

                    📋 Werkbonnen

                </h1>


                <p className="text-gray-500">

                    Overzicht alle werkzaamheden

                </p>


            </header>









            <section className="
                bg-white
                border
                rounded-2xl
                p-5
                space-y-4
            ">



                <input

                    value={search}

                    onChange={(e)=>
                        setSearch(
                            e.target.value
                        )
                    }

                    placeholder="
                    Zoek werkbon, klant of project
                    "

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


                    <option value="open">

                        Open

                    </option>


                    <option value="in_uitvoering">

                        In uitvoering

                    </option>


                    <option value="afgerond">

                        Afgerond

                    </option>


                </select>


            </section>









            <section className="
                space-y-4
            ">


                {
                    filtered.map(workorder=>(


                        <div

                            key={workorder.id}

                            className="
                                bg-white
                                border
                                rounded-2xl
                                p-5
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

                                🏢 {workorder.project.customer.name}

                            </p>


                            <p>

                                📁 {workorder.project.name}

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
                                {workorder.status}

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



                            </div>




                        </div>


                    ))
                }



            </section>




        </main>

    );


}