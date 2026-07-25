"use client";

import { Search } from "lucide-react";

import UserMenu from "./UserMenu";
import DateTime from "./DateTime";
import NotificationBell from "./NotificationBell";


export default function Header() {


    return (

        <header className="
            h-20
            bg-white
            border-b
            border-gray-200
            flex
            items-center
            justify-between
            px-8
        ">


            {/* Links */}

            <div className="
                flex
                items-center
                gap-10
            ">


                <h1 className="
                    text-xl
                    font-bold
                    text-gray-900
                    whitespace-nowrap
                ">

                    Project Management System

                </h1>





                {/* Zoekbalk */}

                <div className="
                    flex
                    items-center
                    w-[420px]
                    h-11
                    bg-gray-50
                    border
                    border-gray-200
                    rounded-xl
                    px-4
                ">


                    <Search

                        size={19}

                        className="
                            text-gray-400
                        "

                    />


                    <input

                        type="text"

                        placeholder="Zoeken..."

                        className="
                            ml-3
                            w-full
                            bg-transparent
                            outline-none
                            text-sm
                            text-gray-700
                        "

                    />


                </div>


            </div>





            {/* Rechts */}

            <div className="
                flex
                items-center
                gap-6
            ">


                {/* Klok + datum */}

                <DateTime />





                {/* Meldingen */}

                <NotificationBell/>





                {/* Gebruiker */}

                <UserMenu />


            </div>


        </header>

    );

}