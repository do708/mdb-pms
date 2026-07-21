"use client";


import { useSession, signOut } from "next-auth/react";



export default function UserMenu() {


    const { data: session } = useSession();



    return (

        <div className="flex items-center gap-4">


            <div className="text-right">


                <p className="text-sm font-medium text-gray-900">

                    {session?.user?.name ?? "Gebruiker"}

                </p>


                <p className="text-xs text-gray-500">

                    {session?.user?.role ?? "user"}

                </p>


            </div>



            <button

                onClick={() => signOut({ callbackUrl: "/login" })}

                className="
                    rounded-lg
                    border
                    px-3
                    py-1.5
                    text-sm
                    hover:bg-gray-100
                "

            >

                Uitloggen

            </button>


        </div>

    );

}