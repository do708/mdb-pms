const stats = [
    {
        title: "Open werkbonnen",
        value: "24",
        description: "Werkbonnen wachten op verwerking",
    },
    {
        title: "Vandaag gepland",
        value: "8",
        description: "Installaties en service opdrachten",
    },
    {
        title: "Actieve projecten",
        value: "15",
        description: "Lopende projecten",
    },
    {
        title: "Omzet deze maand",
        value: "€42.500",
        description: "Gefactureerde projecten",
    },
];


const activities = [
    {
        title: "Werkbon #1024",
        customer: "Basic-Fit Utrecht",
        status: "In behandeling",
    },
    {
        title: "LED installatie",
        customer: "WTC Amsterdam",
        status: "Gepland",
    },
    {
        title: "Narrowcasting uitbreiding",
        customer: "Gemeente Utrecht",
        status: "Afgerond",
    },
];


export default function DashboardPage() {


    return (

        <div className="space-y-8">


            <div>

                <h1 className="text-3xl font-bold">

                    Dashboard

                </h1>

                <p className="text-gray-500">

                    Overzicht van MDB Networks projecten en werkzaamheden

                </p>

            </div>



            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">


                {stats.map((item) => (

                    <div
                        key={item.title}
                        className="rounded-xl border bg-white p-6 shadow-sm"
                    >

                        <p className="text-sm text-gray-500">

                            {item.title}

                        </p>


                        <h2 className="mt-2 text-3xl font-bold">

                            {item.value}

                        </h2>


                        <p className="mt-2 text-sm text-gray-400">

                            {item.description}

                        </p>


                    </div>

                ))}


            </div>




            <div className="rounded-xl border bg-white">


                <div className="border-b p-6">

                    <h2 className="font-semibold">

                        Recente werkzaamheden

                    </h2>

                </div>



                <div className="divide-y">


                    {activities.map((item) => (

                        <div
                            key={item.title}
                            className="flex items-center justify-between p-6"
                        >

                            <div>

                                <p className="font-medium">

                                    {item.title}

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


            </div>


        </div>

    );

}