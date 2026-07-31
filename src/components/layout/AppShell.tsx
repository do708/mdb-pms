"use client";

import { usePathname } from "next/navigation";

import Sidebar from "./Sidebar";
import Header from "./Header";



export default function AppShell({

    children,

}: {

    children: React.ReactNode;

}) {


    const pathname =
        usePathname();




    // Login en de publieke aanvraagpagina hebben geen applicatielayout
    // (geen navigatie/sidebar).

    const bare =
        pathname === "/login"
        ||
        pathname === "/aanvraag";





    if (bare) {


        return (

            <>

                {children}

            </>

        );

    }







    return (

        <div className="
            min-h-screen
            bg-[#f8fafc]
            flex
        ">


            <Sidebar />





            <div className="
                flex-1
                flex
                flex-col
            ">


                <Header />





                <main className="
                    flex-1
                    p-8
                ">

                    {children}

                </main>



            </div>



        </div>

    );


}