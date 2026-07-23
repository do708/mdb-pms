"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";





export default function LoginPage(){


    const router = useRouter();



    const [email,setEmail] =
        useState("");



    const [password,setPassword] =
        useState("");



    const [loading,setLoading] =
        useState(false);







    async function login(){


        setLoading(true);



        try {


            const response =
                await fetch(

                    "/api/auth/login",

                    {

                        method:"POST",

                        headers:{

                            "Content-Type":
                            "application/json"

                        },


                        body:JSON.stringify({

                            email,

                            password

                        })

                    }

                );







            const data =
                await response.json();






            if(!response.ok){


                alert(

                    data.error ||
                    "Inloggen mislukt"

                );


                return;


            }








            if(

                data.user.role === "engineer"

            ){


                router.push(

                    "/engineer"

                );


            } else {


                router.push(

                    "/dashboard"

                );


            }







        } catch(error){


            console.error(error);


            alert(

                "Fout bij inloggen"

            );


        } finally {


            setLoading(false);


        }


    }








    return (

        <main className="
            min-h-screen
            flex
            items-center
            justify-center
            bg-gray-50
            p-6
        ">


            <section className="
                bg-white
                border
                rounded-2xl
                p-6
                w-full
                max-w-md
                space-y-5
            ">


                <h1 className="
                    text-3xl
                    font-bold
                ">

                    🔐 MDB PMS Login

                </h1>







                <input

                    type="email"

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







                <input

                    type="password"

                    value={password}

                    onChange={(e)=>
                        setPassword(
                            e.target.value
                        )
                    }

                    placeholder="Wachtwoord"

                    className="
                        w-full
                        border
                        rounded-xl
                        p-3
                    "

                />







                <button

                    onClick={login}

                    disabled={loading}

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
                        loading
                        ?
                        "Inloggen..."
                        :
                        "🔓 Inloggen"
                    }

                </button>




            </section>



        </main>

    );


}