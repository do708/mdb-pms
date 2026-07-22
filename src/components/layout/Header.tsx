"use client";

import { Search, Bell } from "lucide-react";

import UserMenu from "./UserMenu";
import DateTime from "./DateTime";


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

                <button

                    className="
                        relative
                        p-2
                        rounded-full
                        hover:bg-gray-100
                        transition
                    "

                >

                    <Bell size={21}/>


                    <span className="
                        absolute
                        top-1
                        right-1
                        w-2
                        h-2
                        bg-[#d6007e]
                        rounded-full
                    "/>


                </button>





                {/* Gebruiker */}

                <UserMenu />


            </div>


        </header>

    );

}