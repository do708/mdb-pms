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
    Package,
    FileText,
    Settings,
    BarChart3,
    UserCog,
    PlusCircle,
    StickyNote,
    Archive
} from "lucide-react";



type MenuItem = {

    name:string;

    href:string;

    icon:React.ElementType;

    roles:string[];

};





const menu:MenuItem[] = [


    {
        name:"Dashboard",
        href:"/dashboard",
        icon:LayoutDashboard,
        roles:[
            "admin",
            "office"
        ]
    },


    {
        name:"Mijn dashboard",
        href:"/engineer",
        icon:LayoutDashboard,
        roles:[
            "engineer"
        ]
    },


    {
        name:"Werkbonnen",
        href:"/workorders",
        icon:ClipboardList,
        roles:[
            "admin",
            "office",
            "engineer"
        ]
    },


    {
        name:"Nieuwe werkbon",
        href:"/workorders/new",
        icon:PlusCircle,
        roles:[
            "admin",
            "office",
            "engineer"
        ]
    },


    {
        name:"Formulieren",
        href:"/forms",
        icon:ClipboardList,
        roles:[
            "admin",
            "office",
            "engineer"
        ]
    },


    {
        name:"Planning",
        href:"/planning",
        icon:CalendarDays,
        roles:[
            "admin",
            "office",
            "engineer"
        ]
    },


    {
        name:"Materialen",
        href:"/materials",
        icon:Package,
        roles:[
            "admin",
            "office",
            "engineer"
        ]
    },


    {
        name:"Documenten",
        href:"/documents",
        icon:FileText,
        roles:[
            "admin",
            "office"
        ]
    },


    {
        name:"Rapportages",
        href:"/reports",
        icon:BarChart3,
        roles:[
            "admin",
            "office"
        ]
    },


    {
        name:"Interne notities",
        href:"/notes",
        icon:StickyNote,
        roles:[
            "admin",
            "office",
            "engineer"
        ]
    },
    {
        name:"Klanten",
        href:"/customers",
        icon:Users,
        roles:[
            "admin",
            "office"
        ]
    },


    {
        name:"Archief",
        href:"/archive",
        icon:Archive,
        roles:[
            "admin",
            "office",
            "engineer"
        ]
    },


        {
        name:"Gebruikers",
        href:"/users",
        icon:UserCog,
        roles:[
            "admin"
        ]
    },


    {
        name:"Instellingen",
        href:"/settings",
        icon:Settings,
        roles:[
            "admin",
            "office",
            "engineer"
        ]
    },


];







export default function Sidebar(){


    const pathname =
        usePathname();


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

        <aside className="
            w-72
            min-h-screen
            bg-white
            border-r
            border-gray-200
            flex
            flex-col
        ">


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
                            pathname === item.href;



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
                                    `
                                }

                            >

                                <Icon size={20}/>

                                <span className="text-sm">

                                    {item.name}

                                </span>


                            </Link>

                        );


                    })
                }


            </nav>






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




        </aside>

    );


}