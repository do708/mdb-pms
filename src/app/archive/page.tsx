"use client";

import { useEffect, useState } from "react";

import { getStatus } from "@/constants/workorderStatus";

import { FORM_DEFINITIONS } from "@/constants/formDefinitions";



function formIcon(type:string):string {

    return (
        FORM_DEFINITIONS.find(d=>d.type === type)?.icon
        ?? "📝"
    );

}



interface Workorder {

    id:string;

    number:string;

    title:string;

    status:string;

    plannedDate:string | null;

    customer:{ name:string } | null;

    project:{ customer:{ name:string } | null } | null;

    assignedUser:{ name:string | null } | null;

}



interface Form {

    id:string;

    type:string;

    title:string;

    status:string;

    createdAt:string;

    user:{ name:string | null } | null;

}



export default function ArchivePage(){


    const [q,setQ] =
        useState("");


    const [customer,setCustomer] =
        useState("");


    const [engineer,setEngineer] =
        useState("");


    const [from,setFrom] =
        useState("");


    const [to,setTo] =
        useState("");


    const [type,setType] =
        useState("");


    const [workorders,setWorkorders] =
        useState<Workorder[]>([]);


    const [forms,setForms] =
        useState<Form[]>([]);


    const [loading,setLoading] =
        useState(true);




    async function search(){


        setLoading(true);


        const params =
            new URLSearchParams();


        if(q) params.set("q",q);

        if(customer) params.set("customer",customer);

        if(engineer) params.set("engineer",engineer);

        if(from) params.set("from",from);

        if(to) params.set("to",to);

        if(type) params.set("type",type);


        const response =
            await fetch(
                `/api/archive?${params.toString()}`
            );


        if(response.ok){

            const data =
                await response.json();

            setWorkorders(data.workorders ?? []);

            setForms(data.forms ?? []);

        }


        setLoading(false);


    }




    // Bij het openen meteen laden; daarna op knop
    useEffect(()=>{

        search();

    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[]);




    function reset(){

        setQ("");

        setCustomer("");

        setEngineer("");

        setFrom("");

        setTo("");

        setType("");

    }




    return (

        <main className="
            p-6
            space-y-5
        ">


            <header>

                <h1 className="
                    text-2xl
                    font-bold
                ">

                    Archief

                </h1>

                <p className="text-gray-500 text-sm">

                    Afgeronde werkbonnen en oudere formulieren

                </p>

            </header>




            {/* Filters */}

            <section className="
                bg-white
                border
                rounded-2xl
                p-4
                space-y-3
            ">


                <div className="
                    grid
                    grid-cols-1
                    md:grid-cols-3
                    gap-3
                ">

                    <input

                        value={q}

                        onChange={(e)=>setQ(e.target.value)}

                        placeholder="Zoek op opdracht / nummer"

                        className="
                            border
                            rounded-xl
                            p-2.5
                        "

                    />

                    <input

                        value={customer}

                        onChange={(e)=>setCustomer(e.target.value)}

                        placeholder="Opdrachtgever"

                        className="
                            border
                            rounded-xl
                            p-2.5
                        "

                    />

                    <input

                        value={engineer}

                        onChange={(e)=>setEngineer(e.target.value)}

                        placeholder="Monteur"

                        className="
                            border
                            rounded-xl
                            p-2.5
                        "

                    />

                </div>


                <div className="
                    grid
                    grid-cols-1
                    md:grid-cols-3
                    gap-3
                ">

                    <label className="text-sm text-gray-600">

                        Van

                        <input

                            type="date"

                            value={from}

                            onChange={(e)=>setFrom(e.target.value)}

                            className="
                                w-full
                                border
                                rounded-xl
                                p-2.5
                                mt-1
                            "

                        />

                    </label>

                    <label className="text-sm text-gray-600">

                        Tot

                        <input

                            type="date"

                            value={to}

                            onChange={(e)=>setTo(e.target.value)}

                            className="
                                w-full
                                border
                                rounded-xl
                                p-2.5
                                mt-1
                            "

                        />

                    </label>

                    <label className="text-sm text-gray-600">

                        Soort

                        <select

                            value={type}

                            onChange={(e)=>setType(e.target.value)}

                            className="
                                w-full
                                border
                                rounded-xl
                                p-2.5
                                mt-1
                                bg-white
                            "

                        >

                            <option value="">Alles</option>

                            <option value="werkbon">Werkbonnen</option>

                            <option value="formulier">Formulieren</option>

                        </select>

                    </label>

                </div>


                <div className="
                    flex
                    gap-3
                ">

                    <button

                        onClick={search}

                        className="
                            bg-black
                            text-white
                            rounded-xl
                            px-5
                            py-2.5
                            font-medium
                        "

                    >

                        Zoeken

                    </button>

                    <button

                        onClick={()=>{ reset(); }}

                        className="
                            border
                            rounded-xl
                            px-5
                            py-2.5
                        "

                    >

                        Wissen

                    </button>

                </div>


            </section>




            {
                loading && (

                    <p className="text-gray-500">

                        Laden...

                    </p>

                )
            }




            {/* Resultaten werkbonnen */}

            {
                type !== "formulier" && (

                    <section className="
                        bg-white
                        border
                        rounded-2xl
                        p-4
                    ">

                        <h2 className="font-bold mb-3">

                            📋 Werkbonnen ({workorders.length})

                        </h2>


                        <div className="space-y-2">

                            {
                                workorders.map(workorder=>(

                                    <a

                                        key={workorder.id}

                                        href={`/workorders/${workorder.id}`}

                                        className="
                                            flex
                                            justify-between
                                            items-center
                                            border
                                            rounded-xl
                                            p-3
                                            hover:bg-gray-50
                                        "

                                    >

                                        <div className="min-w-0">

                                            <p className="font-medium text-sm truncate">

                                                {workorder.number} — {workorder.title}

                                            </p>

                                            <p className="text-xs text-gray-500 truncate">

                                                🏢 {
                                                    workorder.customer?.name
                                                    ?? workorder.project?.customer?.name
                                                    ?? "—"
                                                }

                                                {" · 👷 "}

                                                {workorder.assignedUser?.name ?? "—"}

                                                {
                                                    workorder.plannedDate
                                                    ?
                                                    " · " +
                                                    new Date(workorder.plannedDate)
                                                        .toLocaleDateString("nl-NL")
                                                    :
                                                    ""
                                                }

                                            </p>

                                        </div>

                                        <span className={`
                                            shrink-0
                                            ml-2
                                            px-2
                                            py-0.5
                                            rounded-full
                                            text-xs
                                            ${getStatus(workorder.status).badge}
                                        `}>

                                            {getStatus(workorder.status).label}

                                        </span>

                                    </a>

                                ))
                            }

                            {
                                !loading && workorders.length === 0 && (

                                    <p className="text-sm text-gray-400">

                                        Geen werkbonnen gevonden.

                                    </p>

                                )
                            }

                        </div>

                    </section>

                )
            }




            {/* Resultaten formulieren */}

            {
                type !== "werkbon" && (

                    <section className="
                        bg-white
                        border
                        rounded-2xl
                        p-4
                    ">

                        <h2 className="font-bold mb-3">

                            📝 Formulieren ({forms.length})

                        </h2>


                        <div className="space-y-2">

                            {
                                forms.map(form=>(

                                    <a

                                        key={form.id}

                                        href={`/forms/${form.id}`}

                                        className="
                                            flex
                                            justify-between
                                            items-center
                                            border
                                            rounded-xl
                                            p-3
                                            hover:bg-gray-50
                                        "

                                    >

                                        <div className="min-w-0">

                                            <p className="font-medium text-sm truncate">

                                                {formIcon(form.type)} {form.title}

                                            </p>

                                            <p className="text-xs text-gray-500 truncate">

                                                {form.user?.name ?? ""}

                                                {" · "}

                                                {
                                                    new Date(form.createdAt)
                                                        .toLocaleDateString("nl-NL")
                                                }

                                            </p>

                                        </div>

                                    </a>

                                ))
                            }

                            {
                                !loading && forms.length === 0 && (

                                    <p className="text-sm text-gray-400">

                                        Geen formulieren gevonden.

                                    </p>

                                )
                            }

                        </div>

                    </section>

                )
            }


        </main>

    );

}
