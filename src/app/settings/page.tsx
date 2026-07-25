"use client";

import { useState } from "react";

import { useSession } from "next-auth/react";



export default function SettingsPage(){


    const { data:session } =
        useSession();


    const [currentPassword,setCurrentPassword] =
        useState("");


    const [newPassword,setNewPassword] =
        useState("");


    const [repeatPassword,setRepeatPassword] =
        useState("");


    const [saving,setSaving] =
        useState(false);


    const [message,setMessage] =
        useState("");


    const [error,setError] =
        useState("");




    async function changePassword(){


        setMessage("");

        setError("");




        if(newPassword !== repeatPassword){

            setError(
                "Nieuwe wachtwoorden komen niet overeen"
            );

            return;

        }




        setSaving(true);


        try {


            const response =
                await fetch(

                    "/api/profile/password",

                    {

                        method:"POST",

                        headers:{

                            "Content-Type":
                            "application/json"

                        },

                        body:JSON.stringify({

                            currentPassword,

                            newPassword

                        })

                    }

                );


            const data =
                await response.json();


            if(response.ok){

                setMessage(
                    "Wachtwoord gewijzigd"
                );

                setCurrentPassword("");

                setNewPassword("");

                setRepeatPassword("");

            } else {

                setError(
                    data.error
                    ?? "Wachtwoord wijzigen mislukt"
                );

            }


        } finally {

            setSaving(false);

        }


    }




    return (

        <main className="
            p-6
            space-y-6
        ">


            <header>


                <h1 className="
                    text-2xl
                    font-bold
                ">

                    Instellingen

                </h1>


                <p className="
                    text-gray-500
                ">

                    Jouw account

                </p>


            </header>




            <section className="
                bg-white
                border
                rounded-xl
                p-4
                max-w-md
            ">


                <h2 className="
                    font-bold
                    mb-3
                ">

                    👤 Profiel

                </h2>


                <p>

                    {session?.user?.name ?? "-"}

                </p>


                <p className="text-gray-500">

                    {session?.user?.email ?? "-"}

                </p>


                <p className="
                    text-sm
                    text-gray-400
                    mt-2
                ">

                    Rol: {session?.user?.role ?? "-"}

                </p>


            </section>




            <section className="
                bg-white
                border
                rounded-xl
                p-4
                max-w-md
                space-y-3
            ">


                <h2 className="
                    font-bold
                ">

                    🔑 Wachtwoord wijzigen

                </h2>


                <input

                    type="password"

                    value={currentPassword}

                    onChange={(e)=>
                        setCurrentPassword(e.target.value)
                    }

                    placeholder="Huidig wachtwoord"

                    className="
                        w-full
                        border
                        rounded-xl
                        p-3
                    "

                />


                <input

                    type="password"

                    value={newPassword}

                    onChange={(e)=>
                        setNewPassword(e.target.value)
                    }

                    placeholder="Nieuw wachtwoord (min. 8 tekens)"

                    className="
                        w-full
                        border
                        rounded-xl
                        p-3
                    "

                />


                <input

                    type="password"

                    value={repeatPassword}

                    onChange={(e)=>
                        setRepeatPassword(e.target.value)
                    }

                    placeholder="Herhaal nieuw wachtwoord"

                    className="
                        w-full
                        border
                        rounded-xl
                        p-3
                    "

                />


                {
                    error && (

                        <p className="text-red-600">

                            {error}

                        </p>

                    )
                }


                {
                    message && (

                        <p className="text-green-600">

                            {message}

                        </p>

                    )
                }


                <button

                    onClick={changePassword}

                    disabled={saving}

                    className="
                        bg-black
                        text-white
                        rounded-xl
                        px-5
                        py-3
                        disabled:opacity-50
                    "

                >

                    {
                        saving
                        ?
                        "Bezig..."
                        :
                        "Wachtwoord wijzigen"
                    }

                </button>


            </section>


        </main>

    );

}
