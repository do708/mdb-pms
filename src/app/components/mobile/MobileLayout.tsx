"use client";

import Image from "next/image";
import Link from "next/link";
import {
    ClipboardList,
    Home,
    User,
    LogOut,
} from "lucide-react";

import { signOut } from "next-auth/react";


export default function MobileLayout({

    children,

}: {

    children: React.ReactNode;

}) {


    return (

        <div className="
            min-h-screen
            bg-gray-50
            flex
            flex-col
        ">


            {/* Header */}

            <header className="
                bg-white
                border-b
                border-gray-200
                px-5
                py-4
                flex
                items-center
                justify-between
                sticky
                top-0
                z-20
            ">


                <Image

                    src="/images/mdb-logo.png"

                    alt="MDB Networks"

                    width={150}

                    height={60}

                    className="
                        object-contain
                    "

                    priority

                />



                <button

                    onClick={() => signOut({
                        callbackUrl: "/login"
                    })}

                    className="
                        flex
                        items-center
                        gap-2
                        text-sm
                        text-gray-500
                    "

                >

                    <LogOut size={18}/>

                </button>


            </header>





            {/* Content */}

            <main className="
                flex-1
                px-4
                py-5
                pb-24
            ">

                {children}

            </main>





            {/* Bottom navigation */}

            <nav className="
                fixed
                bottom-0
                left-0
                right-0
                h-20
                bg-white
                border-t
                border-gray-200
                flex
                items-center
                justify-around
                z-20
            ">


                <Link

                    href="/engineer"

                    className="
                        flex
                        flex-col
                        items-center
                        gap-1
                        text-[#d6007e]
                    "

                >

                    <Home size={22}/>

                    <span className="
                        text-xs
                    ">

                        Home

                    </span>


                </Link>




                <Link

                    href="/engineer/workorders"

                    className="
                        flex
                        flex-col
                        items-center
                        gap-1
                        text-gray-500
                    "

                >

                    <ClipboardList size={22}/>

                    <span className="
                        text-xs
                    ">

                        Werkbonnen

                    </span>


                </Link>




                <Link

                    href="/engineer/profile"

                    className="
                        flex
                        flex-col
                        items-center
                        gap-1
                        text-gray-500
                    "

                >

                    <User size={22}/>

                    <span className="
                        text-xs
                    ">

                        Profiel

                    </span>


                </Link>


            </nav>


        </div>

    );

}