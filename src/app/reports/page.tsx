"use client";

import { useEffect, useState } from "react";



interface ReportData {

    totals:{

        workorders:number;

        hoursTotal:number;

        hoursThisMonth:number;

    };

    byStatus:Record<string,number>;

    byEngineer:{

        name:string;

        hours:number;

        travel:number;

        kilometers:number;

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
                    text-3xl
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
                md:grid-cols-3
                gap-4
            ">


                <div className="
                    bg-white
                    border
                    rounded-2xl
                    p-5
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
                    p-5
                ">

                    <p className="text-gray-500">
                        Uren totaal
                    </p>

                    <p className="
                        text-3xl
                        font-bold
                    ">
                        {data.totals.hoursTotal}
                    </p>

                </div>


                <div className="
                    bg-white
                    border
                    rounded-2xl
                    p-5
                ">

                    <p className="text-gray-500">
                        Uren deze maand
                    </p>

                    <p className="
                        text-3xl
                        font-bold
                    ">
                        {data.totals.hoursThisMonth}
                    </p>

                </div>


            </section>




            <section className="
                bg-white
                border
                rounded-2xl
                p-5
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
                rounded-2xl
                p-5
            ">


                <h2 className="
                    font-bold
                    mb-3
                ">

                    👷 Uren per monteur

                </h2>


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
                                                {engineer.hours}
                                            </td>

                                            <td className="py-2 text-right">
                                                {engineer.travel}
                                            </td>

                                            <td className="py-2 text-right">
                                                {engineer.kilometers}
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
                rounded-2xl
                p-5
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
                                    {customer.hours} uur
                                </strong>

                            </div>

                        ))
                    }

                </div>


            </section>


        </main>

    );

}
