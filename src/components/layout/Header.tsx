"use client";

import SearchBox from "./SearchBox";

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

                <SearchBox/>


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