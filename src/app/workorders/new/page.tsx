"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { useSession } from "next-auth/react";

import OpleverForm from "@/components/workorders/OpleverForm";

import {
    OpleverData,
    emptyOpleverData
} from "@/types/oplever";



interface Project {

    id:string;

    name:string;

    customer:{

        name:string;

    };

}



interface Engineer {

    id:string;

    name:string | null;

}



export default function NewWorkorderPage(){


    const router =
        useRouter();


    const { data:session } =
        useSession();


    const role =
        session?.user?.role;


    const isEngineer =
        role === "engineer";




    const [projects,setProjects] =
        useState<Project[]>([]);


    const [engineers,setEngineers] =
        useState<Engineer[]>([]);


    const [title,setTitle] =
        useState("");


    const [description,setDescription] =
        useState("");


    const [internalNotes,setInternalNotes] =
        useState("");


    const [projectId,setProjectId] =
        useState("");


    const [assignedUserId,setAssignedUserId] =
        useState("");


    const [plannedDate,setPlannedDate] =
        useState("");


    const [formData,setFormData] =
        useState<OpleverData>(
            emptyOpleverData()
        );


    const [saving,setSaving] =
        useState(false);


    const [error,setError] =
        useState("");




    useEffect(()=>{


        async function load(){


            const projectsResponse =
                await fetch("/api/projects");


            const projectsData =
                await projectsResponse.json();


            setProjects(
                Array.isArray(projectsData)
                ?
                projectsData
                :
                []
            );




            const engineersResponse =
                await fetch("/api/engineers");


            const engineersData =
                await engineersResponse.json();


            setEngineers(
                Array.isArray(engineersData)
                ?
                engineersData
                :
                []
            );


        }


        load();


    },[]);




    async function save(){


        setError("");


        if(!title){

            setError("Vul een titel in");

            window.scrollTo({ top:0, behavior:"smooth" });

            return;

        }


        if(!projectId){

            setError("Kies een project");

            window.scrollTo({ top:0, behavior:"smooth" });

            return;

        }




        setSaving(true);


        try {


            const response =
                await fetch(

                    "/api/workorders",

                    {

                        method:"POST",

                        headers:{

                            "Content-Type":
                            "application/json"

                        },

                        body:JSON.stringify({

                            title,

                            description,

                            internalNotes,

                            projectId,

                            assignedUserId,

                            plannedDate,

                            formData

                        })

                    }

                );


            if(response.ok){


                const created =
                    await response.json();


                // Monteur wordt door de middleware automatisch naar
                // zijn eigen scherm gestuurd (/engineer/workorders/...)
                router.push(
                    `/workorders/${created.id}`
                );


            } else {


                setError(
                    "Werkbon aanmaken mislukt"
                );

                window.scrollTo({ top:0, behavior:"smooth" });


            }


        } finally {

            setSaving(false);

        }


    }




    return (

        <main className="
            p-6
            space-y-6
            max-w-4xl
        ">


            <header>


                <h1 className="
                    text-3xl
                    font-bold
                ">

                    Nieuwe werkbon

                </h1>


                <p className="
                    text-gray-500
                ">

                    Vul de werkbon in en sla onderaan op

                </p>


            </header>




            {
                error && (

                    <p className="
                        bg-red-100
                        border
                        border-red-300
                        text-red-700
                        rounded-xl
                        p-3
                    ">

                        {error}

                    </p>

                )
            }




            {/* ---------- Projectgegevens ---------- */}

            <section className="
                bg-white
                rounded-2xl
                border
                p-5
                space-y-4
            ">


                <h2 className="font-bold">

                    📁 Projectgegevens

                </h2>


                <input

                    value={title}

                    onChange={(e)=>
                        setTitle(e.target.value)
                    }

                    placeholder="Titel opdracht"

                    className="
                        w-full
                        border
                        rounded-xl
                        p-3
                    "

                />


                <select

                    value={projectId}

                    onChange={(e)=>
                        setProjectId(e.target.value)
                    }

                    className="
                        w-full
                        border
                        rounded-xl
                        p-3
                        bg-white
                    "

                >

                    <option value="">

                        Kies project

                    </option>

                    {
                        projects.map(project=>(

                            <option

                                key={project.id}

                                value={project.id}

                            >

                                {project.customer.name}
                                {" — "}
                                {project.name}

                            </option>

                        ))
                    }

                </select>


                <textarea

                    value={description}

                    onChange={(e)=>
                        setDescription(e.target.value)
                    }

                    placeholder="Omschrijving werkzaamheden"

                    className="
                        w-full
                        border
                        rounded-xl
                        p-3
                        min-h-24
                    "

                />


                {
                    !isEngineer && (

                        <>

                            <textarea

                                value={internalNotes}

                                onChange={(e)=>
                                    setInternalNotes(e.target.value)
                                }

                                placeholder="Interne notitie (niet zichtbaar voor klant)"

                                className="
                                    w-full
                                    border
                                    border-amber-300
                                    bg-amber-50
                                    rounded-xl
                                    p-3
                                "

                            />


                            <select

                                value={assignedUserId}

                                onChange={(e)=>
                                    setAssignedUserId(e.target.value)
                                }

                                className="
                                    w-full
                                    border
                                    rounded-xl
                                    p-3
                                    bg-white
                                "

                            >

                                <option value="">

                                    Kies monteur

                                </option>

                                {
                                    engineers.map(engineer=>(

                                        <option

                                            key={engineer.id}

                                            value={engineer.id}

                                        >

                                            {engineer.name}

                                        </option>

                                    ))
                                }

                            </select>

                        </>

                    )
                }


                <label className="block">

                    <span className="
                        text-sm
                        text-gray-600
                    ">

                        Geplande datum

                    </span>

                    <input

                        type="date"

                        value={plannedDate}

                        onChange={(e)=>
                            setPlannedDate(e.target.value)
                        }

                        className="
                            w-full
                            border
                            rounded-xl
                            p-3
                            mt-1
                        "

                    />

                </label>


            </section>




            {/* ---------- Opleverformulier ---------- */}

            <OpleverForm

                initial={formData}

                embedded

                onChange={setFormData}

                monteur1Name={
                    isEngineer
                    ?
                    session?.user?.name ?? null
                    :
                    engineers.find(
                        engineer=>
                            engineer.id === assignedUserId
                    )?.name ?? null
                }

            />




            <button

                onClick={save}

                disabled={saving}

                className="
                    w-full
                    bg-black
                    text-white
                    rounded-xl
                    px-5
                    py-4
                    font-bold
                    disabled:opacity-50
                "

            >

                {
                    saving
                    ?
                    "Bezig met opslaan..."
                    :
                    "✓ Werkbon opslaan"
                }

            </button>


        </main>

    );

}
