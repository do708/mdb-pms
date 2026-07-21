import {
    ClipboardList,
    CalendarDays,
    FolderKanban,
    Users,
    ArrowUpRight,
} from "lucide-react";

import { getDashboardStats } from "@/services/dashboard";


const planning = [

    {
        time: "09:00",
        title: "LED installatie",
        location: "WTC Amsterdam",
    },

    {
        time: "11:30",
        title: "Service bezoek",
        location: "Basic-Fit Utrecht",
    },

    {
        time: "14:00",
        title: "Narrowcasting uitbreiding",
        location: "Gemeente Utrecht",
    },

];


const workorders = [

    {
        number: "#1024",
        customer: "Basic-Fit Utrecht",
        status: "In behandeling",
    },

    {
        number: "#1023",
        customer: "WTC Amsterdam",
        status: "Gepland",
    },

    {
        number: "#1022",
        customer: "Gemeente Utrecht",
        status: "Afgerond",
    },

];


export default async function DashboardPage() {


    const stats = await getDashboardStats();



    const cards = [

        {
            title: "Werkbonnen",
            value: stats.workorders,
            description: "Totaal aantal werkbonnen",
            icon: ClipboardList,
        },

        {
            title: "Projecten",
            value: stats.projects,
            description: "Actieve projecten",
            icon: FolderKanban,
        },

        {
            title: "Klanten",
            value: stats.customers,
            description: "Geregistreerde klanten",
            icon: Users,
        },

        {
            title: "Gebruikers",
            value: stats.users,
            description: "Systeem gebruikers",
            icon: Users,
        },

    ];



    return (

        <div className="space-y-8">


            <div className="flex items-center justify-between">


                <div>

                    <h1 className="text-3xl font-bold text-gray-900">

                        Dashboard

                    </h1>


                    <p className="text-gray-500">

                        Overzicht van MDB Networks werkzaamheden

                    </p>

                </div>



                <button className="flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-white">

                    Nieuwe werkbon

                    <ArrowUpRight size={16}/>

                </button>


            </div>





            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">


                {cards.map((card) => {


                    const Icon = card.icon;


                    return (

                        <div

                            key={card.title}

                            className="rounded-xl border bg-white p-6 shadow-sm"

                        >


                            <div className="flex justify-between">


                                <div>


                                    <p className="text-sm text-gray-500">

                                        {card.title}

                                    </p>



                                    <p className="mt-3 text-3xl font-bold">

                                        {card.value}

                                    </p>



                                    <p className="mt-2 text-sm text-gray-400">

                                        {card.description}

                                    </p>


                                </div>



                                <div className="rounded-lg bg-gray-100 p-3">


                                    <Icon size={22}/>


                                </div>


                            </div>


                        </div>

                    );


                })}


            </div>






            <div className="grid gap-6 lg:grid-cols-2">



                <div className="rounded-xl border bg-white">


                    <div className="border-b p-5">

                        <h2 className="font-semibold">

                            Laatste werkbonnen

                        </h2>

                    </div>




                    {workorders.map((item) => (


                        <div

                            key={item.number}

                            className="flex justify-between border-b p-5 last:border-0"

                        >


                            <div>


                                <p className="font-medium">

                                    {item.number}

                                </p>


                                <p className="text-sm text-gray-500">

                                    {item.customer}

                                </p>


                            </div>



                            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm">

                                {item.status}

                            </span>


                        </div>


                    ))}


                </div>






                <div className="rounded-xl border bg-white">


                    <div className="border-b p-5">

                        <h2 className="font-semibold">

                            Vandaag gepland

                        </h2>

                    </div>




                    {planning.map((item) => (


                        <div

                            key={item.time}

                            className="flex gap-5 border-b p-5 last:border-0"

                        >


                            <div className="font-semibold">

                                {item.time}

                            </div>



                            <div>


                                <p className="font-medium">

                                    {item.title}

                                </p>



                                <p className="text-sm text-gray-500">

                                    {item.location}

                                </p>


                            </div>


                        </div>


                    ))}


                </div>



            </div>



        </div>

    );

}