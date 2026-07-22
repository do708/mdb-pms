"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

import {
    LayoutDashboard,
    ClipboardList,
    FolderKanban,
    Users,
    CalendarDays,
    Package,
    FileText,
    Settings,
    BarChart3,
} from "lucide-react";


const menu = [

    {
        name: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
    },

    {
        name: "Werkbonnen",
        href: "/workorders",
        icon: ClipboardList,
    },

    {
        name: "Projecten",
        href: "/projects",
        icon: FolderKanban,
    },

    {
        name: "Klanten",
        href: "/customers",
        icon: Users,
    },

    {
        name: "Planning",
        href: "/planning",
        icon: CalendarDays,
    },

    {
        name: "Materialen",
        href: "/materials",
        icon: Package,
    },

    {
        name: "Documenten",
        href: "/documents",
        icon: FileText,
    },

    {
        name: "Rapportages",
        href: "/reports",
        icon: BarChart3,
    },

    {
        name: "Instellingen",
        href: "/settings",
        icon: Settings,
    },

];



export default function Sidebar() {


    const pathname = usePathname();



    return (

        <aside className="
            w-72
            min-h-screen
            bg-white
            border-r
            border-gray-200
            flex
            flex-col
        ">


            {/* Logo */}

            <div className="
                px-2
                py-4
                border-b
                border-gray-100
                overflow-hidden
            ">


                <Image

                    src="/images/mdb-logo.png"

                    alt="MDB Networks"

                    width={500}

                    height={190}

                    className="
                        object-contain
                        object-left
                    "

                    priority

                />


            </div>





            {/* Navigatie */}

            <nav className="
                flex-1
                px-4
                py-6
                space-y-1
            ">


                {menu.map((item) => {


                    const Icon = item.icon;

                    const active = pathname === item.href;



                    return (

                        <Link

                            key={item.href}

                            href={item.href}

                            className={

                                active

                                ?

                                `
                                flex
                                items-center
                                gap-3
                                px-4
                                py-3
                                rounded-xl
                                bg-[#fce7f3]
                                text-[#d6007e]
                                font-semibold
                                transition
                                `

                                :

                                `
                                flex
                                items-center
                                gap-3
                                px-4
                                py-3
                                rounded-xl
                                text-gray-600
                                hover:bg-gray-100
                                hover:text-gray-900
                                transition
                                `

                            }

                        >


                            <Icon size={20}/>


                            <span className="text-sm">

                                {item.name}

                            </span>


                        </Link>

                    );


                })}


            </nav>


        </aside>

    );

}