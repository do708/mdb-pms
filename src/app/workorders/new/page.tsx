"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { useSession } from "next-auth/react";

import OpleverForm from "@/components/workorders/OpleverForm";

import {
    OpleverData,
    emptyOpleverData
} from "@/types/oplever";



interface Customer {

    id:string;

    name:string;

}



interface Engineer {

    id:string;

    name:string | null;

}



export default function NewWorkorderPage(){


    const router =
        useRouter();


    const { data:session } =
        useSession();


    const role =
        session?.user?.role;


    const isEngineer =
        role === "engineer";




    const [customers,setCustomers] =
        useState<Customer[]>([]);


    const [engineers,setEngineers] =
        useState<Engineer[]>([]);


    const [title,setTitle] =
        useState("");


    const [description,setDescription] =
        useState("");


    const [internalNotes,setInternalNotes] =
        useState("");


    const [customerId,setCustomerId] =
        useState("");


    const [location,setLocation] =
        useState("");


    const [assignedUserId,setAssignedUserId] =
        useState("");


    const [plannedDate,setPlannedDate] =
        useState("");


    const [formData,setFormData] =
        useState<OpleverData>(
            emptyOpleverData()
        );


    const [saving,setSaving] =
        useState(false);


    const [error,setError] =
        useState("");




    useEffect(()=>{


        async function load(){


            const customersResponse =
                await fetch("/api/customers");


            const customersData =
                await customersResponse.json();


            setCustomers(
                Array.isArray(customersData)
                ?
                customersData
                :
                []
            );




            const engineersResponse =
                await fetch("/api/engineers");


            const engineersData =
                await engineersResponse.json();


            setEngineers(
                Array.isArray(engineersData)
                ?
                engineersData
                :
                []
            );


        }


        load();


    },[]);




    async function save(){


        setError("");


        if(!title){

            setError("Vul een titel in");

            window.scrollTo({ top:0, behavior:"smooth" });

            return;

        }


        if(!isEngineer && !customerId){

            setError("Kies een opdrachtgever");

            window.scrollTo({ top:0, behavior:"smooth" });

            return;

        }




        setSaving(true);


        try {


            const response =
                await fetch(

                    "/api/workorders",

                    {

                        method:"POST",

                        headers:{
                            "Content-Type":
                            "application/json"
                        },

                        body:JSON.stringify({

                            title,

                            description,

                            internalNotes,

                            customerId,

                            location,

                            assignedUserId,

                            plannedDate,

                            // Kantoor zet klaar zonder het opleverformulier;
                            // de monteur vult dat later in. Een monteur die
                            // zelf een werkbon maakt vult het meteen in.
                            formData:
                                isEngineer
                                ?
                                formData
                                :
                                undefined,

                            status:"ontvangen"

                        })

                    }

                );


            if(response.ok){


                const created =
                    await response.json();


                router.push(
                    `/workorders/${created.id}`
                );


            } else {


                setError(
                    "Werkbon aanmaken mislukt"
                );

                window.scrollTo({ top:0, behavior:"smooth" });


            }


        } finally {

            setSaving(false);

        }


    }




    return (

        <main className="
            p-6
            space-y-6
            max-w-4xl
        ">


            <header>


                <h1 className="
                    text-3xl
                    font-bold
                ">

                    {
                        isEngineer
                        ?
                        "Nieuwe werkbon"
                        :
                        "Werkbon klaarzetten"
                    }

                </h1>


                <p className="
                    text-gray-500
                ">

                    {
                        isEngineer
                        ?
                        "Vul de werkbon in en sla onderaan op"
                        :
                        "Zet een klus klaar voor een monteur"
                    }

                </p>


            </header>




            {
                error && (

                    <p className="
                        bg-red-100
                        border
                        border-red-300
                        text-red-700
                        rounded-xl
                        p-3
                    ">

                        {error}

                    </p>

                )
            }




            <section className="
                bg-white
                rounded-2xl
                border
                p-5
                space-y-4
            ">


                <h2 className="font-bold">

                    📋 Opdracht

                </h2>


                <label className="block">

                    <span className="text-sm text-gray-600">

                        Wat moet er gebeuren? (titel)

                    </span>

                    <input

                        value={title}

                        onChange={(e)=>
                            setTitle(e.target.value)
                        }

                        placeholder="Bijv. Installatie 3 schermen etalage"

                        className="
                            w-full
                            border
                            rounded-xl
                            p-3
                            mt-1
                        "

                    />

                </label>


                {
                    !isEngineer && (

                        <label className="block">

                            <span className="text-sm text-gray-600">

                                Opdrachtgever

                            </span>

                            <select

                                value={customerId}

                                onChange={(e)=>
                                    setCustomerId(e.target.value)
                                }

                                className="
                                    w-full
                                    border
                                    rounded-xl
                                    p-3
                                    mt-1
                                    bg-white
                                "

                            >

                                <option value="">

                                    Kies opdrachtgever

                                </option>

                                {
                                    customers.map(customer=>(

                                        <option

                                            key={customer.id}

                                            value={customer.id}

                                        >

                                            {customer.name}

                                        </option>

                                    ))
                                }

                            </select>

                        </label>

                    )
                }


                <label className="block">

                    <span className="text-sm text-gray-600">

                        Waar? (locatie / adres)

                    </span>

                    <input

                        value={location}

                        onChange={(e)=>
                            setLocation(e.target.value)
                        }

                        placeholder="Straat, plaats"

                        className="
                            w-full
                            border
                            rounded-xl
                            p-3
                            mt-1
                        "

                    />

                </label>


                <label className="block">

                    <span className="text-sm text-gray-600">

                        Omschrijving werkzaamheden

                    </span>

                    <textarea

                        value={description}

                        onChange={(e)=>
                            setDescription(e.target.value)
                        }

                        className="
                            w-full
                            border
                            rounded-xl
                            p-3
                            mt-1
                            min-h-24
                        "

                    />

                </label>


                {
                    !isEngineer && (

                        <>

                            <label className="block">

                                <span className="text-sm text-gray-600">

                                    Wanneer? (geplande datum)

                                </span>

                                <input

                                    type="date"

                                    value={plannedDate}

                                    onChange={(e)=>
                                        setPlannedDate(e.target.value)
                                    }

                                    className="
                                        w-full
                                        max-w-xs
                                        border
                                        rounded-xl
                                        p-3
                                        mt-1
                                    "

                                />

                            </label>


                            <label className="block">

                                <span className="text-sm text-gray-600">

                                    Monteur

                                </span>

                                <select

                                    value={assignedUserId}

                                    onChange={(e)=>
                                        setAssignedUserId(e.target.value)
                                    }

                                    className="
                                        w-full
                                        border
                                        rounded-xl
                                        p-3
                                        mt-1
                                        bg-white
                                    "

                                >

                                    <option value="">

                                        Kies monteur

                                    </option>

                                    {
                                        engineers.map(engineer=>(

                                            <option

                                                key={engineer.id}

                                                value={engineer.id}

                                            >

                                                {engineer.name}

                                            </option>

                                        ))
                                    }

                                </select>

                            </label>


                            <label className="block">

                                <span className="text-sm text-gray-600">

                                    Interne opmerkingen (niet zichtbaar voor klant) —
                                    denk aan plattegronden, foto&apos;s, bijzonderheden

                                </span>

                                <textarea

                                    value={internalNotes}

                                    onChange={(e)=>
                                        setInternalNotes(e.target.value)
                                    }

                                    className="
                                        w-full
                                        border
                                        border-amber-300
                                        bg-amber-50
                                        rounded-xl
                                        p-3
                                        mt-1
                                        min-h-24
                                    "

                                />

                                <span className="text-xs text-gray-400">

                                    Bijlagen (plattegronden, foto&apos;s) kun je
                                    toevoegen nadat de werkbon is klaargezet,
                                    via &quot;Werkbon wijzigen&quot;.

                                </span>

                            </label>

                        </>

                    )
                }


            </section>




            {
                isEngineer && (

                    <OpleverForm

                        initial={formData}

                        embedded

                        onChange={setFormData}

                        monteur1Name={session?.user?.name ?? null}

                    />

                )
            }




            <button

                onClick={save}

                disabled={saving}

                className="
                    w-full
                    bg-black
                    text-white
                    rounded-xl
                    px-5
                    py-4
                    font-bold
                    disabled:opacity-50
                "

            >

                {
                    saving
                    ?
                    "Bezig met opslaan..."
                    :
                    isEngineer
                    ?
                    "✓ Werkbon opslaan"
                    :
                    "✓ Werkbon klaarzetten"
                }

            </button>


        </main>

    );

}
