"use client";

import { Suspense, useEffect, useState } from "react";

import { useRouter, useSearchParams } from "next/navigation";

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



function NewWorkorderInner(){


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


    const [pendingFiles,setPendingFiles] =
        useState<File[]>([]);


    const [customerId,setCustomerId] =
        useState("");


    const [location,setLocation] =
        useState("");


    const searchParams =
        useSearchParams();


    const [assignedUserId,setAssignedUserId] =
        useState(searchParams.get("engineer") ?? "");


    const [extraEngineerIds,setExtraEngineerIds] =
        useState<string[]>([]);


    function toggleExtra(id:string){
        setExtraEngineerIds(prev=>
            prev.includes(id)
            ?
            prev.filter(x=>x !== id)
            :
            [...prev,id]
        );
    }


    const [plannedDate,setPlannedDate] =
        useState(()=>{
            const fromQuery =
                searchParams.get("date");
            if(fromQuery){
                return fromQuery;
            }
            // Standaard: vandaag (zo staat het huidige jaar al ingevuld)
            const now = new Date();
            const y = now.getFullYear();
            const m = String(now.getMonth() + 1).padStart(2,"0");
            const d = String(now.getDate()).padStart(2,"0");
            return `${y}-${m}-${d}`;
        });


    const [startTime,setStartTime] =
        useState("");


    const [endTime,setEndTime] =
        useState("");


    const [multiDay,setMultiDay] =
        useState(false);


    const [endDate,setEndDate] =
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

                            extraEngineerIds,

                            plannedDate:
                                plannedDate && startTime && !multiDay
                                ?
                                `${plannedDate}T${startTime}`
                                :
                                plannedDate,

                            plannedEndDate:
                                multiDay && endDate
                                ?
                                // Meerdaagse klus: eind = einde van de laatste dag
                                `${endDate}T23:59`
                                :
                                plannedDate && endTime
                                ?
                                `${plannedDate}T${endTime}`
                                :
                                null,

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


                // Eventueel meegegeven bijlagen nu koppelen aan de nieuwe werkbon
                for(const file of pendingFiles){

                    const fileBody =
                        new FormData();

                    fileBody.append("file",file);

                    fileBody.append("workorderId",created.id);

                    await fetch(
                        "/api/documents",
                        {
                            method:"POST",
                            body:fileBody
                        }
                    );

                }


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
                            mt-2
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
                            mt-2
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
                            mt-2
                            min-h-24
                        "

                    />

                </label>


                {
                    !isEngineer && (

                        <>

                            <div className="
                                border
                                rounded-2xl
                                p-5
                                bg-gray-50
                                space-y-5
                            ">

                                <label className="block">

                                    <span className="
                                        text-sm
                                        font-medium
                                        text-gray-700
                                    ">

                                        Wanneer?

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
                                            mt-2
                                            bg-white
                                        "

                                    />

                                </label>


                                <label className="
                                    flex
                                    items-center
                                    gap-2
                                    cursor-pointer
                                    select-none
                                ">

                                    <input

                                        type="checkbox"

                                        checked={multiDay}

                                        onChange={(e)=>
                                            setMultiDay(e.target.checked)
                                        }

                                    />

                                    <span className="text-sm text-gray-700">

                                        Meerdere dagen

                                    </span>

                                </label>


                                {
                                    multiDay && (

                                        <label className="block">

                                            <span className="
                                                text-sm
                                                font-medium
                                                text-gray-700
                                            ">

                                                Tot en met (einddatum)

                                            </span>

                                            <input

                                                type="date"

                                                value={endDate}

                                                min={plannedDate}

                                                onChange={(e)=>
                                                    setEndDate(e.target.value)
                                                }

                                                className="
                                                    w-full
                                                    max-w-xs
                                                    border
                                                    rounded-xl
                                                    p-3
                                                    mt-2
                                                    bg-white
                                                "

                                            />

                                        </label>

                                    )
                                }



                                {
                                    !multiDay && (

                                <div>

                                    <span className="
                                        text-sm
                                        font-medium
                                        text-gray-700
                                    ">

                                        Tijdstip (optioneel)

                                    </span>

                                    <div className="
                                        flex
                                        items-end
                                        gap-4
                                        mt-2
                                    ">

                                        <label className="block">

                                            <span className="
                                                text-sm
                                                font-medium
                                                text-gray-700
                                            ">

                                                Van

                                            </span>

                                            <input

                                                type="time"

                                                value={startTime}

                                                onChange={(e)=>
                                                    setStartTime(e.target.value)
                                                }

                                                className="
                                                    block
                                                    border
                                                    rounded-xl
                                                    p-3
                                                    mt-2
                                                    bg-white
                                                "

                                            />

                                        </label>


                                        <span className="
                                            text-gray-400
                                            pb-3.5
                                        ">

                                            —

                                        </span>


                                        <label className="block">

                                            <span className="
                                                text-sm
                                                font-medium
                                                text-gray-700
                                            ">

                                                Tot

                                            </span>

                                            <input

                                                type="time"

                                                value={endTime}

                                                onChange={(e)=>
                                                    setEndTime(e.target.value)
                                                }

                                                className="
                                                    block
                                                    border
                                                    rounded-xl
                                                    p-3
                                                    mt-2
                                                    bg-white
                                                "

                                            />

                                        </label>

                                    </div>

                                </div>

                                    )
                                }

                            </div>


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
                                        mt-2
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


                            <div>

                                <span className="text-sm text-gray-600">

                                    Extra monteurs (optioneel)

                                </span>

                                <div className="
                                    mt-2
                                    flex
                                    flex-wrap
                                    gap-2
                                ">

                                    {
                                        engineers
                                        .filter(e=>e.id !== assignedUserId)
                                        .map(engineer=>(

                                            <label

                                                key={engineer.id}

                                                className={`
                                                    flex
                                                    items-center
                                                    gap-2
                                                    border
                                                    rounded-lg
                                                    px-3
                                                    py-1.5
                                                    text-sm
                                                    cursor-pointer
                                                    ${
                                                        extraEngineerIds.includes(engineer.id)
                                                        ?
                                                        "bg-blue-50 border-blue-300"
                                                        :
                                                        ""
                                                    }
                                                `}

                                            >

                                                <input

                                                    type="checkbox"

                                                    checked={extraEngineerIds.includes(engineer.id)}

                                                    onChange={()=>toggleExtra(engineer.id)}

                                                />

                                                {engineer.name}

                                            </label>

                                        ))
                                    }

                                </div>

                            </div>


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
                                        mt-2
                                        min-h-24
                                    "

                                />

                            </label>


                            <div>

                                <span className="text-sm text-gray-600">

                                    Bijlagen (plattegronden, foto&apos;s)

                                </span>


                                <label className="
                                    mt-2
                                    flex
                                    flex-col
                                    items-center
                                    justify-center
                                    border-2
                                    border-dashed
                                    border-gray-300
                                    rounded-xl
                                    p-4
                                    text-center
                                    cursor-pointer
                                    hover:bg-gray-50
                                ">

                                    <span className="text-2xl">📁</span>

                                    <span className="text-sm text-gray-600">

                                        Klik om bestanden te kiezen

                                    </span>

                                    <input

                                        type="file"

                                        multiple

                                        className="hidden"

                                        onChange={(e)=>{
                                            if(e.target.files){
                                                setPendingFiles(prev=>[
                                                    ...prev,
                                                    ...Array.from(e.target.files!)
                                                ]);
                                            }
                                            e.target.value = "";
                                        }}

                                    />

                                </label>


                                {
                                    pendingFiles.length > 0 && (

                                        <div className="mt-2 space-y-1">

                                            {
                                                pendingFiles.map((file,index)=>(

                                                    <div

                                                        key={index}

                                                        className="
                                                            flex
                                                            justify-between
                                                            items-center
                                                            text-sm
                                                            border
                                                            rounded-lg
                                                            px-2
                                                            py-1
                                                        "

                                                    >

                                                        <span className="truncate">

                                                            📎 {file.name}

                                                        </span>

                                                        <button

                                                            type="button"

                                                            onClick={()=>
                                                                setPendingFiles(prev=>
                                                                    prev.filter((_,i)=>i !== index)
                                                                )
                                                            }

                                                            className="text-red-500 ml-2"

                                                        >

                                                            ✕

                                                        </button>

                                                    </div>

                                                ))
                                            }

                                        </div>

                                    )
                                }

                            </div>

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



export default function NewWorkorderPage(){

    return (

        <Suspense fallback={
            <main className="p-6">Laden...</main>
        }>

            <NewWorkorderInner/>

        </Suspense>

    );

}
