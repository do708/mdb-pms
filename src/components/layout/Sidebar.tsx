"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
    LayoutDashboard,
    Users,
    FolderKanban,
    ClipboardList,
    CalendarDays,
    Package,
    FileText,
    BarChart3,
    UserCog,
    Settings,
} from "lucide-react";


const sections = [

    {
        title: "Werk",

        items: [

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
                name: "Planning",
                href: "/planning",
                icon: CalendarDays,
            },

            {
                name: "Projecten",
                href: "/projects",
                icon: FolderKanban,
            },

        ],

    },


    {
        title: "Bedrijf",

        items: [

            {
                name: "Klanten",
                href: "/customers",
                icon: Users,
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

        ],

    },


    {
        title: "Rapportage",

        items: [

            {
                name: "Rapportages",
                href: "/reports",
                icon: BarChart3,
            },

        ],

    },


    {
        title: "Systeem",

        items: [

            {
                name: "Gebruikers",
                href: "/users",
                icon: UserCog,
            },

            {
                name: "Instellingen",
                href: "/settings",
                icon: Settings,
            },

        ],

    },

];


export default function Sidebar() {


    const pathname = usePathname();



    return (

        <aside className="w-64 min-h-screen border-r bg-white flex flex-col">


            {/* Logo */}

            <div className="p-6 border-b">


                <h1 className="text-xl font-bold">

                    MDB PMS

                </h1>


                <p className="text-sm text-gray-500">

                    Project Management System

                </p>


            </div>



            {/* Menu */}

            <nav className="flex-1 p-4 space-y-6">


                {sections.map((section) => (

                    <div key={section.title}>


                        <p className="mb-2 px-3 text-xs font-semibold uppercase text-gray-400">

                            {section.title}

                        </p>



                        <div className="space-y-1">


                            {section.items.map((item) => {


                                const Icon = item.icon;


                                const active = pathname.startsWith(item.href);



                                return (

                                    <Link

                                        key={item.href}

                                        href={item.href}

                                        className={`
                                            flex items-center gap-3 rounded-lg px-3 py-2 text-sm
                                            transition
                                            ${
                                                active
                                                ? "bg-black text-white"
                                                : "text-gray-700 hover:bg-gray-100"
                                            }
                                        `}

                                    >

                                        <Icon size={18}/>


                                        {item.name}


                                    </Link>

                                );


                            })}


                        </div>


                    </div>


                ))}


            </nav>



            {/* Footer */}

            <div className="border-t p-4 text-xs text-gray-400">

                MDB Networks
                <br/>
                PMS v0.2

            </div>


        </aside>

    );

}