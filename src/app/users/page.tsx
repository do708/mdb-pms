"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import DeleteButton from "@/components/DeleteButton";
import Link from "next/link";

import { canAccessAdmin } from "@/lib/auth/checkRole";



interface User {


    id:string;

    name:string | null;

    email:string;

    role:string;

    active:boolean;


}







export default function UsersPage(){


    const { data: session, status } =
        useSession();



    const [users,setUsers] =
        useState<User[]>([]);



    const [loading,setLoading] =
        useState(true);







    async function load(){


        const response =
            await fetch("/api/users");


        const data =
            await response.json();


        setUsers(data);


        setLoading(false);


    }


    useEffect(()=>{


        load();


    },[]);







    const userRole =
        session?.user?.role ?? "";








    if(status === "loading" || loading){


        return (

            <main className="p-6">

                Gebruikers laden...

            </main>

        );

    }







    if(!canAccessAdmin(userRole)){


        return (

            <main className="p-6">

                Geen toegang

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


            <header className="
                flex
                justify-between
                items-center
            ">


                <div>

                    <h1 className="
                        text-3xl
                        font-bold
                    ">

                        👥 Gebruikersbeheer

                    </h1>


                    <p className="text-gray-500">

                        Beheer medewerkers en rollen

                    </p>


                </div>





                <Link

                    href="/users/new"

                    className="
                        bg-[#d6007e]
                        text-white
                        px-5
                        py-3
                        rounded-xl
                        font-bold
                    "

                >

                    + Nieuwe gebruiker

                </Link>



            </header>







            <section className="
                bg-white
                border
                rounded-xl
                p-4
            ">


                <h2 className="
                    font-bold
                    mb-4
                ">

                    Gebruikers

                </h2>





                <div className="space-y-3">


                    {
                        users.map(user=>(


                            <div

                                key={user.id}

                                className="
                                    border
                                    rounded-xl
                                    p-3
                                    flex
                                    items-center
                                    justify-between
                                    gap-3
                                "

                            >

                                <div className="min-w-0">

                                    <div className="
                                        flex
                                        items-center
                                        gap-2
                                        flex-wrap
                                    ">

                                        <span className="font-bold text-sm">

                                            {user.name || "Geen naam"}

                                        </span>

                                        <span className="
                                            text-xs
                                            bg-gray-100
                                            rounded-full
                                            px-2
                                            py-0.5
                                        ">

                                            {user.role}

                                        </span>

                                        {
                                            !user.active && (

                                                <span className="
                                                    text-xs
                                                    bg-red-100
                                                    text-red-700
                                                    rounded-full
                                                    px-2
                                                    py-0.5
                                                ">

                                                    Uitgeschakeld

                                                </span>

                                            )
                                        }

                                    </div>

                                    <p className="text-xs text-gray-500 truncate">

                                        {user.email}

                                    </p>

                                </div>


                                <div className="
                                    flex
                                    gap-2
                                    items-center
                                    shrink-0
                                ">

                                    <Link

                                        href={`/users/${user.id}/edit`}

                                        className="
                                            text-sm
                                            text-blue-700
                                            border
                                            border-blue-200
                                            rounded-lg
                                            px-3
                                            py-1.5
                                            hover:bg-blue-50
                                        "

                                    >

                                        Wijzigen

                                    </Link>


                                    {
                                        session?.user?.id !== user.id && (

                                            <DeleteButton

                                                url={`/api/users/${user.id}`}

                                                label={`gebruiker ${user.name || user.email}`}

                                                onDeleted={load}

                                            />

                                        )
                                    }

                                </div>


                            </div>


                        ))
                    }


                </div>



            </section>



        </main>

    );


}