import {
    ClipboardList,
    FolderKanban,
    Users,
    CalendarDays,
    ArrowUpRight,
    CheckCircle,
    Clock,
    AlertCircle,
} from "lucide-react";

import { getDashboardStats } from "@/services/dashboard";


export default async function DashboardPage() {


    const stats = await getDashboardStats();



    const cards = [

        {
            title: "Werkbonnen",
            value: stats.workorders,
            description: "Totaal geregistreerd",
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
            description: "Relaties",
            icon: Users,
        },

        {
            title: "Gebruikers",
            value: stats.users,
            description: "Systeemgebruikers",
            icon: Users,
        },

    ];



    return (

        <div className="space-y-8">


            {/* Header */}

            <div className="flex items-center justify-between">


                <div>

                    <h1 className="text-3xl font-bold">
                        Goedemiddag 👋
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





            {/* KPI kaarten */}

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">


                {cards.map((card)=>{


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






            {/* Status */}

            <div className="rounded-xl border bg-white p-6">


                <h2 className="font-semibold mb-5">
                    Werkbon status
                </h2>


                <div className="grid gap-4 md:grid-cols-4">


                    <div className="flex items-center gap-3">

                        <CheckCircle className="text-green-600"/>

                        <div>

                            <p className="font-medium">
                                Afgerond
                            </p>

                            <p className="text-sm text-gray-500">
                                18 werkbonnen
                            </p>

                        </div>

                    </div>



                    <div className="flex items-center gap-3">

                        <Clock className="text-blue-600"/>

                        <div>

                            <p className="font-medium">
                                In behandeling
                            </p>

                            <p className="text-sm text-gray-500">
                                6 werkbonnen
                            </p>

                        </div>

                    </div>




                    <div className="flex items-center gap-3">

                        <CalendarDays className="text-orange-500"/>

                        <div>

                            <p className="font-medium">
                                Gepland
                            </p>

                            <p className="text-sm text-gray-500">
                                9 werkbonnen
                            </p>

                        </div>

                    </div>




                    <div className="flex items-center gap-3">

                        <AlertCircle className="text-red-600"/>

                        <div>

                            <p className="font-medium">
                                Openstaand
                            </p>

                            <p className="text-sm text-gray-500">
                                3 werkbonnen
                            </p>

                        </div>

                    </div>


                </div>


            </div>






            {/* Planning */}

            <div className="grid gap-6 lg:grid-cols-2">


                <div className="rounded-xl border bg-white">


                    <div className="border-b p-5">

                        <h2 className="font-semibold">
                            Vandaag gepland
                        </h2>

                    </div>


                    <div className="p-5 space-y-4">


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


                    <div className="p-5 space-y-4">


                        <p>
                            ✓ Werkbon #1024 afgerond
                        </p>

                        <p>
                            ✓ Nieuw project toegevoegd
                        </p>

                        <p>
                            ✓ Materiaal aanvraag verwerkt
                        </p>


                    </div>


                </div>


            </div>



        </div>

    );

}