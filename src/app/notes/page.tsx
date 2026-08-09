"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import {
    PageHeader,
    PageShell,
    SpecPageCard,
    SpecPanel,
} from "@/components/ui/SpecLayout";



interface WorkorderWithNote {

    id:string;

    number:string;

    title:string;

    status:string;

    internalNotes:string | null;

    location:string | null;

    customer:{
        name:string;
    } | null;

    project:{

        name:string;

        customer:{

            name:string;

        };

    } | null;

    assignedUser:{

        name:string | null;

    } | null;

}



export default function NotesPage(){


    const [workorders,setWorkorders] =
        useState<WorkorderWithNote[]>([]);


    const [loading,setLoading] =
        useState(true);




    useEffect(()=>{


        async function load(){


            const response =
                await fetch("/api/workorders");


            const data =
                await response.json();


            setWorkorders(
                Array.isArray(data)
                ?
                data.filter(
                    (item:WorkorderWithNote)=>
                        item.internalNotes
                )
                :
                []
            );


            setLoading(false);


        }


        load();


    },[]);




    if(loading){

        return (

            <PageShell>
                <p className="text-sm text-gray-500">
                    Notities laden...
                </p>
            </PageShell>

        );

    }




    return (

        <PageShell>


            <PageHeader
                title="Interne notities"
                subtitle="Alle opdrachten met een interne notitie"
            />


            <SpecPageCard>

                {
                    workorders.length === 0
                    ? (
                        <p className="text-sm text-gray-500">
                            Geen opdrachten met interne notities.
                        </p>
                    )
                    : (
                        <div className="space-y-2">
                            {
                                workorders.map(workorder=>(
                                    <Link
                                        key={workorder.id}
                                        href={`/workorders/${workorder.id}`}
                                        className="block"
                                    >
                                        <SpecPanel tone="amber" className="hover:border-amber-300 transition">
                                            <div className="flex flex-wrap justify-between gap-2">
                                                <p className="text-sm font-semibold text-gray-900">
                                                    {workorder.number}
                                                    {" · "}
                                                    {workorder.title}
                                                </p>
                                                <span className="text-xs text-gray-500">
                                                    {workorder.status}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500">
                                                {workorder.customer?.name
                                                    ?? workorder.project?.customer.name
                                                    ?? "—"}
                                                {" · "}
                                                {workorder.location
                                                    ?? workorder.project?.name
                                                    ?? ""}
                                                {
                                                    workorder.assignedUser?.name
                                                    ? ` · ${workorder.assignedUser.name}`
                                                    : ""
                                                }
                                            </p>
                                            <p className="text-sm text-gray-900 whitespace-pre-wrap">
                                                {workorder.internalNotes}
                                            </p>
                                        </SpecPanel>
                                    </Link>
                                ))
                            }
                        </div>
                    )
                }

            </SpecPageCard>


        </PageShell>

    );

}
