"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";



export default function UserDetailPage(){


    const params = useParams();

    const router = useRouter();


    const id =
        params.id as string;



    const [name,setName] =
        useState("");



    const [email,setEmail] =
        useState("");



    const [role,setRole] =
        useState("engineer");



    const [active,setActive] =
        useState(true);



    const [loading,setLoading] =
        useState(true);



    const [saving,setSaving] =
        useState(false);







    useEffect(()=>{


        async function load(){


            const response =
                await fetch(
                    `/api/users/${id}`
                );


            const data =
                await response.json();



            setName(
                data.name || ""
            );


            setEmail(
                data.email
            );


            setRole(
                data.role
            );


            setActive(
                data.active
            );


            setLoading(false);


        }



        load();


    },[id]);








    async function saveUser(){


        setSaving(true);



        try {


            const response =
                await fetch(

                    `/api/users/${id}`,

                    {

                        method:"PUT",

                        headers:{

                            "Content-Type":
                            "application/json"

                        },


                        body:JSON.stringify({

                            name,

                            email,

                            role,

                            active

                        })

                    }

                );





            if(response.ok){


                alert(
                    "Gebruiker opgeslagen"
                );


                router.push(
                    "/users"
                );


            } else {


                alert(
                    "Opslaan mislukt"
                );


            }



        } catch(error){


            console.error(error);


            alert(
                "Fout bij opslaan"
            );


        } finally {


            setSaving(false);


        }


    }








    if(loading){


        return (

            <main className="p-6">

                Laden...

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

                    👤 Gebruiker beheren

                </h1>


            </header>







            <section className="
                bg-white
                border
                rounded-2xl
                p-6
                space-y-4
            ">


                <input

                    value={name}

                    onChange={(e)=>
                        setName(
                            e.target.value
                        )
                    }

                    placeholder="Naam"

                    className="
                        w-full
                        border
                        rounded-xl
                        p-3
                    "

                />





                <input

                    value={email}

                    onChange={(e)=>
                        setEmail(
                            e.target.value
                        )
                    }

                    placeholder="E-mail"

                    className="
                        w-full
                        border
                        rounded-xl
                        p-3
                    "

                />







                <select

                    value={role}

                    onChange={(e)=>
                        setRole(
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

                    <option value="admin">
                        👑 Admin
                    </option>

                    <option value="office">
                        🏢 Kantoor
                    </option>

                    <option value="engineer">
                        👷 Monteur
                    </option>


                </select>







                <label className="
                    flex
                    gap-3
                    items-center
                ">


                    <input

                        type="checkbox"

                        checked={active}

                        onChange={(e)=>
                            setActive(
                                e.target.checked
                            )
                        }

                    />


                    Actief


                </label>







                <button

                    onClick={saveUser}

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
                        "Opslaan..."
                        :
                        "💾 Gebruiker opslaan"
                    }

                </button>



            </section>



        </main>

    );


}