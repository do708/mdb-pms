"use client";

import { useEffect, useState } from "react";

import { formatClockHours } from "@/types/oplever";
import {
    PageHeader,
    PageShell,
    SpecFieldLabel,
    SpecListRow,
    SpecPageCard,
    SpecPanel,
    SpecStat,
    specSelectClassName,
} from "@/components/ui/SpecLayout";



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


    const [engineerFilter,setEngineerFilter] =
        useState("alle");




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

            <PageShell>

                <p className="text-sm text-gray-500">
                    Rapportages laden...
                </p>

            </PageShell>

        );

    }




    if(error || !data){

        return (

            <PageShell>

                <SpecPanel tone="amber">
                    <p className="text-sm text-gray-800">
                        {error || "Geen data beschikbaar."}
                    </p>
                </SpecPanel>

            </PageShell>

        );

    }




    return (

        <PageShell>


            <PageHeader
                title="Rapportages"
                subtitle="Overzicht uren en opdrachten"
            />


            <div className="
                grid grid-cols-1 md:grid-cols-2
                lg:grid-cols-4 gap-3
            ">
                <SpecStat
                    label="Opdrachten totaal"
                    value={data.totals.workorders}
                />
                <SpecStat
                    label="Uren totaal"
                    value={formatClockHours(data.totals.hoursTotal) || "0"}
                />
                <SpecStat
                    label="Uren deze maand"
                    value={formatClockHours(data.totals.hoursThisMonth) || "0"}
                />
                <SpecStat
                    label="Kilometers deze maand"
                    value={data.totals.kilometersThisMonth}
                    hint="Dagroute vanaf Monitorweg 10 (zaak → klussen → zaak)"
                />
            </div>


            <SpecPageCard>

                <SpecPanel title="Opdrachten per status" tone="slate">
                    <div className="flex flex-wrap gap-2">
                        {
                            Object.entries(data.byStatus)
                            .map(([status,count])=>(
                                <div
                                    key={status}
                                    className="
                                        rounded-lg border border-gray-200
                                        bg-white px-3 py-2 text-sm
                                    "
                                >
                                    <span className="text-xs text-gray-500 mr-2">
                                        {status}
                                    </span>
                                    <strong className="text-gray-900">
                                        {count}
                                    </strong>
                                </div>
                            ))
                        }
                    </div>
                </SpecPanel>


                <SpecPanel
                    title="Uren per monteur"
                    hint="Kilometers = automatisch berekende dagroute bij inplannen (Monitorweg 10 → alle klussen die dag → Monitorweg 10). Op project-urenlog telt alleen kantoor ↔ projectlocatie. Uren/reistijd als klok: 1.15, 1.30, 1.45, 2."
                >
                    <label className="block max-w-xs">
                        <SpecFieldLabel>Filter monteur</SpecFieldLabel>
                        <select
                            value={engineerFilter}
                            onChange={(e)=>
                                setEngineerFilter(e.target.value)
                            }
                            className={specSelectClassName}
                        >
                            <option value="alle">Alle monteurs</option>
                            {
                                data.byEngineer.map((engineer)=>(
                                    <option
                                        key={engineer.name}
                                        value={engineer.name}
                                    >
                                        {engineer.name}
                                    </option>
                                ))
                            }
                        </select>
                    </label>

                    {
                        data.byEngineer.length === 0
                        ? (
                            <p className="text-sm text-gray-500">
                                Nog geen uren geregistreerd.
                            </p>
                        )
                        : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left border-b border-gray-200">
                                            <th className="py-2 text-xs font-medium text-gray-500">
                                                Monteur
                                            </th>
                                            <th className="py-2 text-right text-xs font-medium text-gray-500">
                                                Uren
                                            </th>
                                            <th className="py-2 text-right text-xs font-medium text-gray-500">
                                                Reistijd
                                            </th>
                                            <th className="py-2 text-right text-xs font-medium text-gray-500">
                                                Kilometers
                                            </th>
                                            <th className="py-2 text-right text-xs font-medium text-gray-500">
                                                Km deze maand
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {
                                            data.byEngineer
                                                .filter((engineer)=>
                                                    engineerFilter === "alle"
                                                    || engineer.name
                                                        === engineerFilter
                                                )
                                                .map(engineer=>(
                                                    <tr
                                                        key={engineer.name}
                                                        className="border-b border-gray-100"
                                                    >
                                                        <td className="py-2 text-gray-900">
                                                            {engineer.name}
                                                        </td>
                                                        <td className="py-2 text-right text-gray-900">
                                                            {formatClockHours(engineer.hours) || "0"}
                                                        </td>
                                                        <td className="py-2 text-right text-gray-900">
                                                            {formatClockHours(engineer.travel) || "0"}
                                                        </td>
                                                        <td className="py-2 text-right text-gray-900">
                                                            {engineer.kilometers}
                                                        </td>
                                                        <td className="py-2 text-right text-gray-900">
                                                            {engineer.kilometersThisMonth}
                                                        </td>
                                                    </tr>
                                                ))
                                        }
                                    </tbody>
                                </table>
                            </div>
                        )
                    }
                </SpecPanel>


                <SpecPanel title="Uren per klant">
                    {
                        data.byCustomer.length === 0
                        ? (
                            <p className="text-sm text-gray-500">
                                Nog geen uren geregistreerd.
                            </p>
                        )
                        : (
                            <div className="space-y-2">
                                {
                                    data.byCustomer.map(customer=>(
                                        <SpecListRow
                                            key={customer.name}
                                            className="flex justify-between items-center gap-3"
                                        >
                                            <span className="text-sm text-gray-900">
                                                {customer.name}
                                            </span>
                                            <strong className="text-sm text-gray-900">
                                                {formatClockHours(customer.hours) || "0"} uur
                                            </strong>
                                        </SpecListRow>
                                    ))
                                }
                            </div>
                        )
                    }
                </SpecPanel>

            </SpecPageCard>


        </PageShell>

    );

}
