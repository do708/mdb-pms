"use client";

import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
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

import PlanningMiniMonth from "@/components/planning/PlanningMiniMonth";



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
        name:"Opdracht inplannen",
        href:"/workorders/new",
        icon:PlusCircle,
        title:"Opdracht voorbereiden en inplannen",
        roles:["admin","office","engineer"]
    },

    {
        name:"Opdrachten",
        href:"/workorders",
        icon:ClipboardList,
        title:"Overzicht van actieve en afgeronde opdrachten",
        roles:["admin","office","engineer"]
    },

    {
        name:"Projecten",
        href:"/projects",
        icon:Folder,
        title:"Grotere, langlopende projecten met gebundelde opdrachten",
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
        menu
            .filter((item) => item.roles.includes(role))
            .map((item) => {
                if (item.href !== "/planning") return item;
                const t = new Date();
                const iso = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
                return {
                    ...item,
                    href: `/planning?date=${iso}`,
                };
            });





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
            print:hidden
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

                    src="/images/MDB-Logo.png"

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

            {role !== "engineer" &&
            (pathname === "/planning" ||
                pathname.startsWith("/planning/")) ? (
                <div className="shrink-0 px-2 pt-2">
                    <Suspense fallback={null}>
                        <PlanningMiniMonth />
                    </Suspense>
                </div>
            ) : null}

            <nav className="
                flex-1
                min-h-0
                flex
                flex-col
                px-4
                py-4
            ">

                <div className="flex-1 min-h-0 overflow-y-auto space-y-1">
                {
                    items.map((item)=>{


                        const Icon =
                            item.icon;



                        const active =
                            item.href.startsWith("/planning")
                                ? pathname === "/planning" ||
                                  pathname.startsWith("/planning/")
                                : item.href === "/engineer"
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
                                            ? "Opdracht invullen"
                                            : item.name
                                    }

                                </span>


                            </Link>

                        );


                    })
                }
                </div>

                <div className="shrink-0 mt-auto">
                    {role !== "engineer" ? (
                        <div className="pt-3 border-t border-gray-100 space-y-1">
                            <p className="
                                px-4
                                text-xs
                                uppercase
                                text-gray-400
                                mb-1
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
                                    py-3.5
                                    min-h-[48px]
                                    rounded-xl
                                    text-gray-600
                                    hover:bg-gray-100
                                    active:bg-gray-200
                                    w-full
                                    text-left
                                "
                            >
                                <span className="text-xl w-5 text-center shrink-0">
                                    📒
                                </span>
                                <div>
                                    <div className="text-base sm:text-sm font-medium">
                                        Bunni
                                    </div>
                                    <div className="text-xs text-gray-400">
                                        Boekhoudsysteem
                                    </div>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={()=>{
                                    window.open(
                                        "https://www.vogels.com/nl-nl/p/pro-avmountadvisor#/pro-avmountadvisor/display?token=362942eb78612938757db61dc3b301fa",
                                        "Vogels",
                                        "width=1400,height=900"
                                    );
                                }}
                                className="
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
                                    w-full
                                    text-left
                                "
                            >
                                <span className="text-xl w-5 text-center shrink-0">
                                    📺
                                </span>
                                <div>
                                    <div className="text-base sm:text-sm font-medium">
                                        Vogels
                                    </div>
                                    <div className="text-xs text-gray-400">
                                        Pro-AV Advisor
                                    </div>
                                </div>
                            </button>
                        </div>
                    ) : null}
                </div>


            </nav>




        </aside>

    );


}