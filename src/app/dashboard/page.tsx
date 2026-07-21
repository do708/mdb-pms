import {
    ClipboardList,
    FolderKanban,
    Users,
    ArrowUpRight,
    CheckCircle,
    Clock,
    AlertCircle,
} from "lucide-react";

import {
    getDashboardStats,
    getWorkorderStatus,
} from "@/services/dashboard";



export default async function DashboardPage() {


    const stats = await getDashboardStats();

    const workorderStatus = await getWorkorderStatus();



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
            description: "Lopende projecten",
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


            {/* Header */}

            <div className="flex items-center justify-between">


                <div>

                    <h1 className="text-3xl font-bold text-gray-900">

                        Dashboard 👋

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





            {/* KPI Cards */}


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



                                <div className="rounded-xl bg-gray-100 p-3">

                                    <Icon size={22}/>

                                </div>


                            </div>


                        </div>

                    );


                })}


            </div>






            {/* Werkbon status */}


            <div className="rounded-xl border bg-white p-6">


                <h2 className="mb-5 font-semibold">

                    Werkbon status

                </h2>



                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">


                    {workorderStatus.length === 0 && (

                        <p className="text-gray-500">

                            Geen werkbonnen beschikbaar

                        </p>

                    )}



                    {workorderStatus.map((item) => {


                        const status = item.status.toLowerCase();



                        let Icon = Clock;



                        if(status === "completed" || status === "done") {

                            Icon = CheckCircle;

                        }


                        if(status === "open") {

                            Icon = AlertCircle;

                        }



                        return (

                            <div

                                key={item.status}

                                className="flex items-center justify-between rounded-lg bg-gray-50 p-4"

                            >

                                <div className="flex items-center gap-3">


                                    <Icon size={22}/>


                                    <div>


                                        <p className="font-medium capitalize">

                                            {item.status}

                                        </p>


                                        <p className="text-sm text-gray-500">

                                            Werkbonnen

                                        </p>


                                    </div>


                                </div>



                                <p className="text-2xl font-bold">

                                    {item.count}

                                </p>


                            </div>

                        );


                    })}


                </div>


            </div>






            {/* Planning + Activiteiten */}


            <div className="grid gap-6 lg:grid-cols-2">



                <div className="rounded-xl border bg-white">


                    <div className="border-b p-5">

                        <h2 className="font-semibold">

                            Vandaag gepland

                        </h2>


                    </div>



                    <div className="space-y-4 p-5">


                        <div>

                            <p className="font-medium">

                                09:00 - LED installatie

                            </p>

                            <p className="text-sm text-gray-500">

                                WTC Amsterdam

                            </p>

                        </div>



                        <div>

                            <p className="font-medium">

                                11:30 - Service bezoek

                            </p>

                            <p className="text-sm text-gray-500">

                                Basic-Fit Utrecht

                            </p>

                        </div>



                        <div>

                            <p className="font-medium">

                                14:00 - Narrowcasting uitbreiding

                            </p>

                            <p className="text-sm text-gray-500">

                                Gemeente Utrecht

                            </p>

                        </div>


                    </div>


                </div>






                <div className="rounded-xl border bg-white">


                    <div className="border-b p-5">

                        <h2 className="font-semibold">

                            Recente activiteiten

                        </h2>


                    </div>



                    <div className="space-y-4 p-5">


                        <p>
                            ✓ Dashboard gekoppeld aan database
                        </p>


                        <p>
                            ✓ Auth systeem actief
                        </p>


                        <p>
                            ✓ Prisma verbinding actief
                        </p>


                    </div>


                </div>


            </div>



        </div>

    );

}