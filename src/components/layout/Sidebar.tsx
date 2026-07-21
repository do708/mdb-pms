"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";


const menu = [
    {
        name: "Dashboard",
        href: "/dashboard",
    },
    {
        name: "Klanten",
        href: "/customers",
    },
    {
        name: "Projecten",
        href: "/projects",
    },
    {
        name: "Werkbonnen",
        href: "/workorders",
    },
    {
        name: "Planning",
        href: "/planning",
    },
    {
        name: "Materialen",
        href: "/materials",
    },
    {
        name: "Documenten",
        href: "/documents",
    },
    {
        name: "Rapportages",
        href: "/reports",
    },
    {
        name: "Gebruikers",
        href: "/users",
    },
    {
        name: "Instellingen",
        href: "/settings",
    },
];


export default function Sidebar() {

    const pathname = usePathname();


    return (

        <aside className="w-64 min-h-screen border-r bg-white">

            <div className="p-6 border-b">

                <h1 className="text-xl font-bold">
                    MDB PMS
                </h1>

                <p className="text-sm text-gray-500">
                    Project Management System
                </p>

            </div>


            <nav className="p-4 space-y-1">

                {menu.map((item) => (

                    <Link
                        key={item.href}
                        href={item.href}
                        className={`
                            block rounded-lg px-4 py-2
                            ${
                                pathname.startsWith(item.href)
                                ? "bg-black text-white"
                                : "hover:bg-gray-100"
                            }
                        `}
                    >

                        {item.name}

                    </Link>

                ))}

            </nav>

        </aside>

    );

}