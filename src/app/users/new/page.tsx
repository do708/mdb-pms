"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";





export default function NewUserPage(){


    const router = useRouter();



    const [name,setName] =
        useState("");



    const [email,setEmail] =
        useState("");



    const [password,setPassword] =
        useState("");



    const [role,setRole] =
        useState("engineer");



    const [saving,setSaving] =
        useState(false);







    async function createUser(){


        setSaving(true);



        try {


            const response =
                await fetch(

                    "/api/users",

                    {

                        method:"POST",

                        headers:{

                            "Content-Type":
                            "application/json"

                        },


                        body:JSON.stringify({

                            name,

                            email,

                            password,

                            role

                        })

                    }

                );






            if(response.ok){


                alert(
                    "Gebruiker aangemaakt"
                );


                router.push(
                    "/users"
                );


            } else {


                alert(
                    "Gebruiker aanmaken mislukt"
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
            bg-gray-50
            min-h-screen
        ">


            <header>


                <h1 className="
                    text-3xl
                    font-bold
                ">

                    ➕ Nieuwe gebruiker

                </h1>


                <p className="text-gray-500">

                    Medewerker toevoegen aan MDB Project Management Systeem

                </p>


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

                    type="email"

                    className="
                        w-full
                        border
                        rounded-xl
                        p-3
                    "

                />







                <input

                    value={password}

                    onChange={(e)=>
                        setPassword(
                            e.target.value
                        )
                    }

                    placeholder="Wachtwoord"

                    type="password"

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







                <button

                    onClick={createUser}

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
                        "➕ Gebruiker opslaan"
                    }


                </button>





            </section>



        </main>

    );


}