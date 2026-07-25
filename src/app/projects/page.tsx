"use client";

import { useEffect, useState } from "react";
import DeleteButton from "@/components/DeleteButton";
import Link from "next/link";


interface Project {

    id:string;

    number:string;

    name:string;

    status:string;

    customer:{

        name:string;

    };

}



export default function ProjectsPage(){


    const [projects,setProjects] =
        useState<Project[]>([]);


    const [loading,setLoading] =
        useState(true);


    const [search,setSearch] =
        useState("");





    async function loadProjects(){


        const response =
            await fetch(
                "/api/projects"
            );


        const data =
            await response.json();


        setProjects(data);

        setLoading(false);

    }


    useEffect(()=>{

        loadProjects();

    },[]);







    const filteredProjects =
        projects.filter(project =>

            project.name
                .toLowerCase()
                .includes(
                    search.toLowerCase()
                )

        );






    return (

        <main className="
            p-6
            space-y-6
        ">


            <header className="
                flex
                justify-between
                items-center
            ">


                <div>

                    <h1 className="
                        text-2xl
                        font-bold
                    ">

                        Projecten

                    </h1>


                    <p className="
                        text-gray-500
                    ">

                        Beheer projecten binnen MDB PMS

                    </p>


                </div>




                <Link

                    href="/projects/new"

                    className="
                        bg-[#d6007e]
                        text-white
                        px-5
                        py-3
                        rounded-xl
                        font-bold
                    "

                >

                    + Nieuw project

                </Link>


            </header>







            <input

                value={search}

                onChange={(e)=>
                    setSearch(
                        e.target.value
                    )
                }


                placeholder="Zoeken op projectnaam..."

                className="
                    w-full
                    border
                    rounded-xl
                    p-3
                "

            />







            <section className="
                bg-white
                border
                rounded-2xl
            ">


                {
                    loading

                    ?

                    <p className="p-5">

                        Projecten laden...

                    </p>


                    :


                    filteredProjects.length === 0

                    ?

                    <p className="p-5 text-gray-500">

                        Geen projecten gevonden.

                    </p>


                    :


                    <div className="
                        divide-y
                    ">


                        {
                            filteredProjects.map(project=>(


                                <div

                                    key={project.id}

                                    className="
                                        p-5
                                        flex
                                        justify-between
                                        items-center
                                    "

                                >


                                    <div>


                                        <h2 className="
                                            font-bold
                                        ">

                                            {project.name}

                                        </h2>



                                        <p className="
                                            text-sm
                                            text-gray-500
                                        ">

                                            {project.number}

                                        </p>



                                        <p className="
                                            text-sm
                                            text-gray-500
                                        ">

                                            🏢 {project.customer.name}

                                        </p>


                                    </div>





                                    <span className="
                                        bg-gray-100
                                        px-3
                                        py-1
                                        rounded-lg
                                        text-sm
                                    ">

                                        {project.status}

                                    </span>



                                    <div className="ml-3">

                                        <DeleteButton

                                            url={`/api/projects/${project.id}`}

                                            label={`project ${project.name}`}

                                            onDeleted={loadProjects}

                                            compact

                                        />

                                    </div>



                                </div>


                            ))

                        }


                    </div>


                }


            </section>



        </main>

    );

}