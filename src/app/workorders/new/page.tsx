"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";


interface Project {

    id:string;

    name:string;

    customer:{
        name:string;
    };

}


interface User {

    id:string;

    name:string | null;

}



export default function NewWorkorderPage(){


    const router = useRouter();

    const { data:session } =
        useSession();



    const role =
        session?.user?.role;



    const isEngineer =
        role === "engineer";




    const [projects,setProjects] =
        useState<Project[]>([]);



    const [users,setUsers] =
        useState<User[]>([]);




    const [title,setTitle] =
        useState("");



    const [description,setDescription] =
        useState("");



    const [projectId,setProjectId] =
        useState("");



    const [assignedUserId,setAssignedUserId] =
        useState("");



    const [plannedDate,setPlannedDate] =
        useState("");



    const [saving,setSaving] =
        useState(false);







    useEffect(()=>{


        async function load(){


            const projectsResponse =
                await fetch("/api/projects");


            const projectsData =
                await projectsResponse.json();


            setProjects(
                projectsData
            );





            if(!isEngineer){


                const usersResponse =
                    await fetch("/api/users");


                const usersData =
                    await usersResponse.json();


                setUsers(
                    usersData
                );


            }



        }



        if(role){

            load();

        }



    },[role,isEngineer]);







    async function createWorkorder(){


        setSaving(true);



        const finalAssignedUserId =

            isEngineer

            ?

            session?.user?.id

            :

            assignedUserId;





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

                            projectId,

                            assignedUserId:
                                finalAssignedUserId,

                            plannedDate

                        })

                    }

                );





            if(response.ok){


                router.push(
                    "/workorders"
                );


            } else {


                alert(
                    "Werkbon aanmaken mislukt"
                );


            }



        } catch(error){


            console.error(error);


            alert(
                "Fout bij aanmaken"
            );



        } finally {


            setSaving(false);


        }


    }







    return (

        <main className="
            p-6
            space-y-6
        ">


            <h1 className="
                text-2xl
                font-bold
            ">

                Nieuwe werkbon

            </h1>





            <section className="
                bg-white
                border
                rounded-2xl
                p-6
                space-y-4
            ">


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

                                {project.name}
                                {" - "}
                                {project.customer.name}


                            </option>


                        ))
                    }


                </select>








                {

                    !isEngineer && (


                        <select

                            value={assignedUserId}

                            onChange={(e)=>
                                setAssignedUserId(
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


                            <option value="">

                                Kies monteur

                            </option>



                            {
                                users.map(user=>(


                                    <option

                                        key={user.id}

                                        value={user.id}

                                    >

                                        {user.name}

                                    </option>


                                ))
                            }


                        </select>


                    )

                }







                <div>


                    <label className="
                        text-sm
                        text-gray-500
                    ">

                        Geplande datum

                    </label>



                    <input

                        type="date"

                        value={plannedDate}

                        onChange={(e)=>
                            setPlannedDate(
                                e.target.value
                            )
                        }

                        className="
                            w-full
                            border
                            rounded-xl
                            p-3
                        "

                    />


                </div>






                <button

                    onClick={createWorkorder}

                    disabled={saving}

                    className="
                        w-full
                        bg-[#d6007e]
                        text-white
                        rounded-xl
                        py-4
                        font-bold
                    "

                >

                    {
                        saving
                        ?
                        "Aanmaken..."
                        :
                        "➕ Werkbon aanmaken"
                    }


                </button>




            </section>


        </main>

    );

}