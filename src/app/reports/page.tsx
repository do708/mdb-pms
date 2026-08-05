"use client";

import { useEffect, useState } from "react";

import { formatClockHours } from "@/types/oplever";



interface ReportData {

    totals:{

        workorders:number;

        hoursTotal:number;

        hoursThisMonth:number;

        kilometersThisMonth:number;

    };

    byStatus:Record<string,number>;

    byEngineer:{

        name:string;

        hours:number;

        travel:number;

        kilometers:number;

        kilometersThisMonth:number;

    }[];

    byCustomer:{

        name:string;

        hours:number;

    }[];

}



export default function ReportsPage(){


    const [data,setData] =
        useState<ReportData | null>(null);


    const [error,setError] =
        useState("");


    const [loading,setLoading] =
        useState(true);




    useEffect(()=>{


        async function load(){


            const response =
                await fetch("/api/reports");


            if(!response.ok){

                setError(
                    response.status === 403
                    ?
                    "Rapportages zijn alleen beschikbaar voor kantoor en admin."
                    :
                    "Rapportage ophalen mislukt."
                );

                setLoading(false);

                return;

            }


            setData(
                await response.json()
            );


            setLoading(false);


        }


        load();


    },[]);




    if(loading){

        return (

            <main className="p-6">

                Rapportages laden...

            </main>

        );

    }




    if(error || !data){

        return (

            <main className="p-6">

                {error || "Geen data beschikbaar."}

            </main>

        );

    }




    return (

        <main className="
            p-6
            space-y-6
        ">


            <header>


                <h1 className="
                    text-2xl
                    font-bold
                ">

                    Rapportages

                </h1>


                <p className="
                    text-gray-500
                ">

                    Overzicht uren en werkbonnen

                </p>


            </header>




            <section className="
                grid
                grid-cols-1
                md:grid-cols-2
                lg:grid-cols-4
                gap-4
            ">


                <div className="
                    bg-white
                    border
                    rounded-2xl
                    p-4
                ">

                    <p className="text-gray-500">
                        Werkbonnen totaal
                    </p>

                    <p className="
                        text-3xl
                        font-bold
                    ">
                        {data.totals.workorders}
                    </p>

                </div>


                <div className="
                    bg-white
                    border
                    rounded-2xl
                    p-4
                ">

                    <p className="text-gray-500">
                        Uren totaal
                    </p>

                    <p className="
                        text-3xl
                        font-bold
                    ">
                        {formatClockHours(data.totals.hoursTotal) || "0"}
                    </p>

                </div>


                <div className="
                    bg-white
                    border
                    rounded-2xl
                    p-4
                ">

                    <p className="text-gray-500">
                        Uren deze maand
                    </p>

                    <p className="
                        text-3xl
                        font-bold
                    ">
                        {formatClockHours(data.totals.hoursThisMonth) || "0"}
                    </p>

                </div>


                <div className="
                    bg-white
                    border
                    rounded-2xl
                    p-4
                ">

                    <p className="text-gray-500">
                        Kilometers deze maand
                    </p>

                    <p className="
                        text-3xl
                        font-bold
                    ">
                        {data.totals.kilometersThisMonth}
                    </p>

                    <p className="
                        text-xs
                        text-gray-400
                        mt-1
                    ">
                        Geplande ritten kantoor ↔ klus
                    </p>

                </div>


            </section>




            <section className="
                bg-white
                border
                rounded-xl
                p-4
            ">


                <h2 className="
                    font-bold
                    mb-3
                ">

                    📋 Werkbonnen per status

                </h2>


                <div className="
                    flex
                    flex-wrap
                    gap-3
                ">

                    {
                        Object.entries(data.byStatus)
                        .map(([status,count])=>(

                            <div

                                key={status}

                                className="
                                    border
                                    rounded-xl
                                    px-4
                                    py-2
                                "

                            >

                                <span className="
                                    text-gray-500
                                    mr-2
                                ">
                                    {status}
                                </span>

                                <strong>
                                    {count}
                                </strong>

                            </div>

                        ))
                    }

                </div>


            </section>




            <section className="
                bg-white
                border
                rounded-xl
                p-4
            ">


                <h2 className="
                    font-bold
                    mb-1
                ">

                    👷 Uren per monteur

                </h2>

                <p className="
                    text-xs
                    text-gray-500
                    mb-3
                ">
                    Kilometers hier = werkelijk gereden die dag
                    (kantoor → alle stops op volgorde → kantoor).
                    Op project-urenlog telt alleen kantoor ↔
                    projectlocatie. Uren/reistijd als klok:
                    1.15, 1.30, 1.45, 2.
                </p>


                {
                    data.byEngineer.length === 0 && (

                        <p className="text-gray-500">

                            Nog geen uren geregistreerd.

                        </p>

                    )
                }


                {
                    data.byEngineer.length > 0 && (

                        <table className="
                            w-full
                            text-sm
                        ">


                            <thead>

                                <tr className="
                                    text-left
                                    border-b
                                ">

                                    <th className="py-2">
                                        Monteur
                                    </th>

                                    <th className="py-2 text-right">
                                        Uren
                                    </th>

                                    <th className="py-2 text-right">
                                        Reistijd
                                    </th>

                                    <th className="py-2 text-right">
                                        Kilometers
                                    </th>

                                    <th className="py-2 text-right">
                                        Km deze maand
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {
                                    data.byEngineer.map(engineer=>(

                                        <tr

                                            key={engineer.name}

                                            className="border-b"

                                        >

                                            <td className="py-2">
                                                {engineer.name}
                                            </td>

                                            <td className="py-2 text-right">
                                                {formatClockHours(engineer.hours) || "0"}
                                            </td>

                                            <td className="py-2 text-right">
                                                {formatClockHours(engineer.travel) || "0"}
                                            </td>

                                            <td className="py-2 text-right">
                                                {engineer.kilometers}
                                            </td>

                                            <td className="py-2 text-right">
                                                {engineer.kilometersThisMonth}
                                            </td>

                                        </tr>

                                    ))
                                }

                            </tbody>


                        </table>

                    )
                }


            </section>




            <section className="
                bg-white
                border
                rounded-xl
                p-4
            ">


                <h2 className="
                    font-bold
                    mb-3
                ">

                    🏢 Uren per klant

                </h2>


                {
                    data.byCustomer.length === 0 && (

                        <p className="text-gray-500">

                            Nog geen uren geregistreerd.

                        </p>

                    )
                }


                <div className="space-y-2">

                    {
                        data.byCustomer.map(customer=>(

                            <div

                                key={customer.name}

                                className="
                                    flex
                                    justify-between
                                    border-b
                                    py-2
                                "

                            >

                                <span>
                                    {customer.name}
                                </span>

                                <strong>
                                    {formatClockHours(customer.hours) || "0"} uur
                                </strong>

                            </div>

                        ))
                    }

                </div>


            </section>


        </main>

    );

}
