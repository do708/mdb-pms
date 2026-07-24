"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { canAccessAdmin } from "@/lib/auth/checkRole";



interface User {


    id:string;

    name:string | null;

    email:string;

    role:string;

    active:boolean;


}







export default function UsersPage(){


    const { data: session, status } = useSession();



    const [users,setUsers] =
        useState<User[]>([]);



    const [loading,setLoading] =
        useState(true);








    useEffect(()=>{


        async function load(){


            const response =
                await fetch(

                    "/api/users"

                );



            const data =
                await response.json();



            setUsers(data);


            setLoading(false);


        }


        load();


    },[]);









    if(loading){


        return (

            <main className="p-6">

                Gebruikers laden...

            </main>

        );

    }

const userRole = session?.user?.role ?? "";


if(status !== "loading" && !canAccessAdmin(userRole)){


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


            <header>


                <h1 className="
                    text-3xl
                    font-bold
                ">

                    👥 Gebruikersbeheer

                </h1>


                <p className="text-gray-500">

                    Beheer medewerkers en rollen

                </p>


            </header>









            <section className="
                bg-white
                border
                rounded-2xl
                p-5
            ">


                <h2 className="
                    font-bold
                    mb-4
                ">

                    Rollen

                </h2>



                <div className="
                    space-y-2
                ">


                    <p>

                        👑 Admin - volledige toegang

                    </p>


                    <p>

                        🏢 Kantoor - projecten en werkbonnen

                    </p>


                    <p>

                        👷 Monteur - eigen opdrachten

                    </p>


                </div>


            </section>









            <section className="
                bg-white
                border
                rounded-2xl
                p-5
            ">


                <h2 className="
                    font-bold
                    mb-4
                ">

                    Gebruikers

                </h2>







                <div className="
                    space-y-3
                ">


                    {
                        users.map(user=>(


                            <div

                                key={user.id}

                                className="
                                    border
                                    rounded-xl
                                    p-4
                                "

                            >


                                <p className="font-bold">

                                    {user.name || "Geen naam"}

                                </p>


                                <p>

                                    {user.email}

                                </p>


                                <p className="mt-2">

                                    Rol:
                                    {" "}
                                    {user.role}

                                </p>


                                <p>

                                    Status:
                                    {" "}
                                    {
                                        user.active
                                        ?
                                        "Actief"
                                        :
                                        "Uitgeschakeld"
                                    }

                                </p>



                            </div>


                        ))
                    }


                </div>




            </section>





        </main>

    );


}