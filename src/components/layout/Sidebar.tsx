"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

import {
    LayoutDashboard,
    ClipboardList,
    Users,
    CalendarDays,
    FileText,
    Settings,
    BarChart3,
    UserCog,
    PlusCircle,
    Archive,
    Folder
} from "lucide-react";



type MenuItem = {

    name:string;

    href:string;

    icon:React.ElementType;

    roles:string[];

    title?:string;

};





const menu:MenuItem[] = [

    {
        name:"Dashboard",
        href:"/dashboard",
        icon:LayoutDashboard,
        title:"Centraal overzicht, notificaties en snelle inzicht",
        roles:["admin","office"]
    },

    {
        name:"Mijn dashboard",
        href:"/engineer",
        icon:LayoutDashboard,
        title:"Centraal overzicht en geplande werkzaamheden",
        roles:["engineer"]
    },

    {
        name:"Planning",
        href:"/planning",
        icon:CalendarDays,
        title:"Het inplannen van monteurs en werkzaamheden",
        roles:["admin","office","engineer"]
    },

    {
        name:"Werkbonnen",
        href:"/workorders",
        icon:ClipboardList,
        title:"Overzicht van actieve en afgeronde werkbonnen",
        roles:["admin","office","engineer"]
    },

    {
        name:"Werkbon klaarzetten",
        href:"/workorders/new",
        icon:PlusCircle,
        title:"Werkbon voorbereiden en klaarzetten voor de monteur",
        roles:["admin","office","engineer"]
    },

    {
        name:"Projecten",
        href:"/projects",
        icon:Folder,
        title:"Grotere, langlopende opdrachten met gebundelde werkbonnen",
        roles:["admin","office","engineer"]
    },

    {
        name:"Formulieren",
        href:"/forms",
        icon:ClipboardList,
        title:"Intake- en inspectieformulieren gekoppeld aan opdrachten",
        roles:["admin","office","engineer"]
    },

    {
        name:"Rapportages",
        href:"/reports",
        icon:BarChart3,
        title:"Analyses, urenoverzichten en financiële inzichten",
        roles:["admin","office"]
    },

    {
        name:"Archief",
        href:"/archive",
        icon:Archive,
        title:"Historie van afgeronde projecten en oude dossiers",
        roles:["admin","office","engineer"]
    },

    {
        name:"Documenten",
        href:"/documents",
        icon:FileText,
        title:"Centrale opslag voor handleidingen, certificaten, enz.",
        roles:["admin","office"]
    },

    {
        name:"Opdrachtgevers",
        href:"/customers",
        icon:Users,
        title:"Klantendatabase en contactpersonen",
        roles:["admin","office"]
    },

    {
        name:"Gebruikers",
        href:"/users",
        icon:UserCog,
        title:"Rechten, accounts en rollen toewijzen",
        roles:["admin"]
    },

    {
        name:"Instellingen",
        href:"/settings",
        icon:Settings,
        title:"Systeemconfiguratie, notificaties en stamgegevens",
        roles:["admin","office","engineer"]
    },

];







export default function Sidebar({
    mobileOpen = false,
    onNavigate,
}: {
    mobileOpen?: boolean;
    onNavigate?: () => void;
}) {

    const pathname = usePathname();

    const { data:session } =
        useSession();



    const role =
        session?.user?.role || "";



    const items =
        menu.filter(

            item =>
                item.roles.includes(role)

        );





    return (

        <aside
            className={`
            w-[min(100vw-3rem,18rem)]
            max-w-[18rem]
            min-h-screen
            bg-white
            border-r
            border-gray-200
            flex
            flex-col
            shrink-0
            max-lg:fixed
            max-lg:inset-y-0
            max-lg:left-0
            max-lg:z-50
            max-lg:shadow-xl
            max-lg:transition-transform
            max-lg:duration-200
            max-lg:ease-out
            ${
                mobileOpen
                    ? "max-lg:translate-x-0"
                    : "max-lg:-translate-x-full"
            }
            lg:relative
            lg:translate-x-0
        `}
        >


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





            <nav className="
                flex-1
                px-4
                py-6
                space-y-1
            ">


                {
                    items.map((item)=>{


                        const Icon =
                            item.icon;



                        const active =
                            item.href === "/engineer"
                                ? pathname === "/engineer" ||
                                  pathname.startsWith("/engineer/")
                                : item.href === "/workorders"
                                ? pathname === "/workorders" ||
                                  (pathname.startsWith("/workorders/") &&
                                      !pathname.startsWith(
                                          "/workorders/new"
                                      ))
                                : item.href === "/workorders/new"
                                ? pathname === "/workorders/new" ||
                                  pathname.startsWith("/workorders/new/")
                                : pathname === item.href ||
                                  pathname.startsWith(`${item.href}/`);



                        return (

                            <Link

                                key={item.href}

                                href={item.href}

                                title={item.title}

                                onClick={() => onNavigate?.()}

                                className={

                                    active

                                    ?

                                    `
                                    flex
                                    items-center
                                    gap-3
                                    px-4
                                    py-3.5
                                    min-h-[48px]
                                    rounded-xl
                                    bg-[#fce7f3]
                                    text-[#d6007e]
                                    font-semibold
                                    `

                                    :

                                    `
                                    flex
                                    items-center
                                    gap-3
                                    px-4
                                    py-3.5
                                    min-h-[48px]
                                    rounded-xl
                                    text-gray-600
                                    hover:bg-gray-100
                                    active:bg-gray-200
                                    `
                                }

                            >

                                <Icon size={20}/>

                                <span className="text-base sm:text-sm">

                                    {
                                        item.href === "/workorders/new" &&
                                        role === "engineer"
                                            ? "Werkbon invullen"
                                            : item.name
                                    }

                                </span>


                            </Link>

                        );


                    })
                }


            </nav>






            {role !== "engineer" ? (
            <div className="
                border-t
                border-gray-100
                px-4
                py-5
            ">


                <p className="
                    text-xs
                    uppercase
                    text-gray-400
                    mb-3
                ">

                    Externe systemen

                </p>




                <button

                    type="button"

                    onClick={()=>{


                        window.open(

                            "https://www.bunni.nl",

                            "Bunni",

                            "width=1400,height=900"

                        );


                    }}

                    className="
                        flex
                        items-center
                        gap-3
                        px-4
                        py-3
                        rounded-xl
                        text-gray-600
                        hover:bg-gray-100
                        w-full
                        text-left
                    "

                >

                    <span className="text-xl">

                        📒

                    </span>



                    <div>

                        <div className="text-sm font-medium">

                            Bunni

                        </div>


                        <div className="text-xs text-gray-400">

                            Boekhoudsysteem

                        </div>


                    </div>


                </button>


            </div>
            ) : null}




        </aside>

    );


}