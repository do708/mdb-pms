"use client";

import Link from "next/link";
import Image from "next/image";

import {
    LayoutDashboard,
    ClipboardList,
    FolderKanban,
    Users,
    CalendarDays,
    Package,
    FileText,
    Settings,
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
        name: "Instellingen",
        href: "/settings",
        icon: Settings,
    },

];


export default function Sidebar() {


return (

<aside className="
w-72
min-h-screen
bg-[#020617]
text-white
flex
flex-col
">


<div className="
p-6
border-b
border-white/10
">


<Image

src="/images/mdb-logo.png"

alt="MDB Networks"

width={180}

height={80}

/>


<p className="mt-4 text-sm text-gray-400">

MDB PMS

</p>


</div>





<nav className="flex-1 p-4 space-y-2">


{menu.map((item)=>{


const Icon = item.icon;


return (

<Link

key={item.name}

href={item.href}

className="
flex
items-center
gap-4
rounded-xl
px-4
py-3
text-gray-300
hover:bg-blue-600
hover:text-white
transition
"

>


<Icon size={20}/>


<span>

{item.name}

</span>


</Link>

);


})}



</nav>






<div className="
p-6
text-sm
text-gray-500
border-t
border-white/10
">


MDB Networks

<br/>

Field Service Management

</div>



</aside>


);

}