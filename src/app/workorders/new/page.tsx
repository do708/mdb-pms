"use client";

import { Suspense, useEffect, useState } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { useSession } from "next-auth/react";

import OpleverForm from "@/components/workorders/OpleverForm";

import type { OpleverData } from "@/types/oplever";
import { setPendingSchedule } from "@/lib/planning/pendingSchedule";





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

    const isEngineer =
        session?.user?.role === "engineer";








    const [customers,setCustomers] =
        useState<Customer[]>([]);


    const [engineers,setEngineers] =
        useState<Engineer[]>([]);


    const [title,setTitle] =
        useState("");


    const [description,setDescription] =
        useState("");


    // Werkinstructie voor de monteur (komt NIET in de klant-mail).
    const [werkInstructie,setWerkInstructie] =
        useState("");


    const [internalNotes,setInternalNotes] =
        useState("");


    const [pendingFiles,setPendingFiles] =
        useState<File[]>([]);


    const [customerId,setCustomerId] =
        useState("");


    // Adresvelden gelijk aan Aanvraag Service- en Installatiewerkzaamheden
    const [straat,setStraat] =
        useState("");

    const [huisnummer,setHuisnummer] =
        useState("");

    const [postcode,setPostcode] =
        useState("");

    const [city,setCity] =
        useState("");


    // Contactgegevens voor de afspraakmail (mogen leeg blijven).
    const [contactPersoon,setContactPersoon] =
        useState("");

    const [contactEmail,setContactEmail] =
        useState("");

    const [contactPhone,setContactPhone] =
        useState("");


    // Beschikbare formuliertypes + welke zijn aangevinkt voor deze werkbon.
    const [formTypes,setFormTypes] =
        useState<{ id:string; key:string; name:string }[]>([]);


    const [selectedFormTypeId,setSelectedFormTypeId] =
        useState<string>("");


    // De sleutel van het gekozen formuliertype (bijv. "digital_signage").
    const selectedFormKey =
        formTypes.find(ft=>ft.id === selectedFormTypeId)?.key ?? "";


    // Ingevulde opleverdata (voor de monteur, inline bij Digital Signage).
    const [opleverData,setOpleverData] =
        useState<OpleverData | null>(null);


    // Foto's die de monteur kiest vóór het eerste opslaan; ze worden pas
    // geüpload zodra de werkbon bestaat.
    const [opleverFotos,setOpleverFotos] =
        useState<File[]>([]);


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




            try {
                const formTypesResponse =
                    await fetch("/api/form-types");

                const formTypesData =
                    await formTypesResponse.json();

                setFormTypes(
                    Array.isArray(formTypesData)
                    ?
                    formTypesData
                    :
                    []
                );
            } catch {
                // stil falen; dan toont het scherm geen formuliertypes
            }




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




    async function save(
        options?:{ goToPlanning?:boolean }
    ){


        setError("");


        if(!title){

            setError("Vul een titel in");

            window.scrollTo({ top:0, behavior:"smooth" });

            return;

        }


        if(!customerId){

            setError("Kies een opdrachtgever");

            window.scrollTo({ top:0, behavior:"smooth" });

            return;

        }


        // Bij inplannen via planning: geen losse datum/tijd hier valideren.
        if(
            !options?.goToPlanning
            &&
            plannedDate &&
            startTime &&
            endTime &&
            endTime <= startTime
        ){

            setError("De eindtijd moet ná de begintijd liggen");

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

                            werkInstructie,

                            internalNotes,

                            customerId,

                            straat,

                            huisnummer,

                            postcode,

                            location:
                                [straat, huisnummer]
                                    .filter(Boolean)
                                    .join(" ")
                                    .trim()
                                || null,

                            city,

                            contactPersoon,

                            contactEmail,

                            contactPhone,

                            assignedUserId:
                                options?.goToPlanning
                                ? ""
                                : assignedUserId,

                            extraEngineerIds:
                                options?.goToPlanning
                                ? []
                                : extraEngineerIds,

                            plannedDate:
                                options?.goToPlanning
                                ? null
                                :
                                multiDay
                                ?
                                // Meerdaagse klus: automatisch 09:00 op de eerste dag
                                `${plannedDate}T09:00`
                                :
                                plannedDate && startTime
                                ?
                                `${plannedDate}T${startTime}`
                                :
                                plannedDate,

                            plannedEndDate:
                                options?.goToPlanning
                                ? null
                                :
                                multiDay && endDate
                                ?
                                // Meerdaagse klus: automatisch tot 16:00 op de laatste dag
                                `${endDate}T16:00`
                                :
                                plannedDate && endTime
                                ?
                                `${plannedDate}T${endTime}`
                                :
                                null,

                            // Voor de monteur bij Digital Signage sturen we de
                            // inline ingevulde opleverdata direct mee.
                            formData:
                                (
                                    isEngineer
                                    &&
                                    (
                                        selectedFormKey === "digital_signage"
                                        ||
                                        selectedFormKey === "uren"
                                        ||
                                        selectedFormKey === "evalue8"
                                    )
                                )
                                ?
                                (opleverData ?? undefined)
                                :
                                undefined,

                            formTypeIds:
                                selectedFormTypeId
                                ?
                                [selectedFormTypeId]
                                :
                                [],

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


                // Inline gekozen foto's nu uploaden en koppelen aan de werkbon.
                if(opleverFotos.length > 0){

                    const fotoBody =
                        new FormData();

                    opleverFotos.forEach(foto=>{
                        fotoBody.append("photos", foto);
                    });

                    await fetch(
                        `/api/workorders/${created.id}/photos`,
                        {
                            method:"POST",
                            body:fotoBody
                        }
                    );

                }


                // Een monteur verstuurt de werkbon meteen: PDF genereren,
                // melding naar projects en status op "uitgevoerd". Voor
                // office/admin blijft het bij klaarzetten.
                if(isEngineer){
                    try {
                        await fetch(
                            `/api/workorders/${created.id}/complete`,
                            {
                                method:"POST"
                            }
                        );
                    } catch {
                        // versturen mag het aanmaken niet blokkeren
                    }
                }


                if(options?.goToPlanning){
                    const customerName =
                        customers.find((c)=>c.id === customerId)?.name
                        || "";
                    const label =
                        [customerName, title].filter(Boolean).join(" · ")
                        || title
                        || "Klus";

                    setPendingSchedule({
                        workorderId:created.id,
                        label,
                    });

                    router.push("/planning");
                    return;
                }


                // Iedereen komt na het aanmaken op de uitvoerpagina.
                router.push(
                    `/engineer/workorders/${created.id}`
                );


            } else {


                setError(
                    "Opdracht aanmaken mislukt"
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
                    text-2xl
                    font-bold
                ">

                    {
                        isEngineer
                        ?
                        "Opdracht invullen"
                        :
                        "Opdracht inplannen"
                    }

                </h1>


                <p className="
                    text-gray-500
                ">

                    {
                        isEngineer
                        ?
                        "Vul de gegevens in en verstuur onderaan"
                        :
                        "Vul de gegevens in en plan in via de weekplanning"
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


                {
                    true && (

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


                <div className="space-y-4">

                    <h2 className="font-semibold text-gray-800 border-b pb-1">
                        Gegevens locatie &amp; contactpersoon
                    </h2>

                    <label className="block">
                        <span className="text-sm text-gray-600">
                            Locatie / filiaalnaam
                        </span>
                        <input
                            value={title}
                            onChange={(e)=>setTitle(e.target.value)}
                            placeholder="Bijv. Filiaal Almere Centrum"
                            className="w-full border rounded-xl p-3 mt-1"
                        />
                    </label>

                    <div className="flex flex-wrap gap-3">
                        <label className="block flex-1 min-w-[180px]">
                            <span className="text-sm text-gray-600">Straat</span>
                            <input
                                value={straat}
                                onChange={(e)=>setStraat(e.target.value)}
                                className="w-full border rounded-xl p-3 mt-1"
                            />
                        </label>
                        <label className="block w-28">
                            <span className="text-sm text-gray-600">Huisnr.</span>
                            <input
                                value={huisnummer}
                                onChange={(e)=>setHuisnummer(e.target.value)}
                                className="w-full border rounded-xl p-3 mt-1"
                            />
                        </label>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <label className="block w-36">
                            <span className="text-sm text-gray-600">Postcode</span>
                            <input
                                value={postcode}
                                onChange={(e)=>setPostcode(e.target.value)}
                                className="w-full border rounded-xl p-3 mt-1"
                            />
                        </label>
                        <label className="block flex-1 min-w-[180px]">
                            <span className="text-sm text-gray-600">Plaats</span>
                            <input
                                value={city}
                                onChange={(e)=>setCity(e.target.value)}
                                className="w-full border rounded-xl p-3 mt-1"
                            />
                        </label>
                    </div>

                    <label className="block">
                        <span className="text-sm text-gray-600">Contactpersoon:</span>
                        <input
                            value={contactPersoon}
                            onChange={(e)=>setContactPersoon(e.target.value)}
                            placeholder="Naam contactpersoon"
                            className="w-full border rounded-xl p-3 mt-1"
                        />
                    </label>

                    <div className="flex flex-wrap gap-3">
                        <label className="block flex-1 min-w-[180px]">
                            <span className="text-sm text-gray-600">E-mailadres</span>
                            <input
                                type="email"
                                value={contactEmail}
                                onChange={(e)=>setContactEmail(e.target.value)}
                                placeholder="naam@bedrijf.nl"
                                className="w-full border rounded-xl p-3 mt-1"
                            />
                        </label>
                        <label className="block flex-1 min-w-[150px]">
                            <span className="text-sm text-gray-600">Telefoonnummer</span>
                            <input
                                value={contactPhone}
                                onChange={(e)=>setContactPhone(e.target.value)}
                                placeholder="06 ..."
                                className="w-full border rounded-xl p-3 mt-1"
                            />
                        </label>
                    </div>

                </div>


                <label className="block">

                    <span className="text-sm text-gray-600">

                        Werkzaamheden (voor de klant)

                    </span>

                    <span className="block text-xs text-gray-400 mb-1">
                        Deze tekst komt in de afspraakmail naar de klant.
                    </span>

                    <textarea

                        value={description}

                        onChange={(e)=>
                            setDescription(e.target.value)
                        }

                        placeholder="Bijv. 2x scherm installeren"

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


                <label className="block mt-4">

                    <span className="text-sm text-gray-600">

                        Werkinstructie monteur

                    </span>

                    <span className="block text-xs text-gray-400 mb-1">
                        Interne instructie voor de monteur. Komt niet in de klant-mail.
                    </span>

                    <textarea

                        value={werkInstructie}

                        onChange={(e)=>
                            setWerkInstructie(e.target.value)
                        }

                        placeholder="Bijv. sleutel ophalen bij receptie, ladder meenemen"

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

                            <div className="
                                border
                                rounded-2xl
                                p-5
                                bg-gray-50
                                space-y-4
                                min-w-0
                                overflow-hidden
                            ">

                                <div>
                                    <h2 className="font-semibold text-gray-800">
                                        Planning
                                    </h2>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        Kies een vrij moment in de weekplanning. Datum, tijd en monteur(s) zet je daar.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={()=>void save({ goToPlanning:true })}
                                    disabled={saving}
                                    className="
                                        w-full
                                        sm:w-auto
                                        bg-[#0066FF]
                                        text-white
                                        rounded-xl
                                        px-5
                                        py-3
                                        font-bold
                                        disabled:opacity-50
                                    "
                                >
                                    {saving ? "Bezig..." : "Inplannen"}
                                </button>

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
                                                e.target.value = "";
                                            }
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


                {/* Welke opleverformulieren zijn van toepassing op deze werkbon? */}
                {
                    formTypes.length > 0 && (

                        <div className="
                            border
                            rounded-2xl
                            p-5
                            bg-gray-50
                            space-y-3
                        ">

                            <span className="
                                block
                                text-sm
                                font-medium
                                text-gray-700
                            ">
                                Welke formulier moet er ingevuld worden?
                            </span>

                            <div className="
                                flex
                                flex-wrap
                                gap-3
                            ">
                                {
                                    formTypes.map(ft=>{

                                        const gekozen =
                                            selectedFormTypeId === ft.id;

                                        return (
                                            <button
                                                key={ft.id}
                                                type="button"
                                                onClick={()=>{
                                                    setSelectedFormTypeId(
                                                        gekozen ? "" : ft.id
                                                    );
                                                }}
                                                className={`
                                                    px-4
                                                    py-2
                                                    rounded-xl
                                                    border
                                                    text-sm
                                                    transition
                                                    ${
                                                        gekozen
                                                        ?
                                                        "bg-blue-50 border-blue-400 text-blue-800 font-medium"
                                                        :
                                                        "bg-white border-slate-200 text-gray-600 hover:border-slate-300"
                                                    }
                                                `}
                                            >
                                                {ft.name}
                                            </button>
                                        );

                                    })
                                }
                            </div>

                        </div>

                    )
                }


                {/* Inline invulformulier voor de monteur, direct onder de keuze */}
                {
                    isEngineer
                    &&
                    (
                        selectedFormKey === "digital_signage"
                        ||
                        selectedFormKey === "uren"
                        ||
                        selectedFormKey === "evalue8"
                    )
                    && (

                        <div className="pt-2">

                            <OpleverForm
                                initial={opleverData}
                                embedded
                                onChange={setOpleverData}
                                monteur1Name={session?.user?.name ?? null}
                                variant={
                                    selectedFormKey === "uren"
                                    ?
                                    "uren"
                                    :
                                    selectedFormKey === "evalue8"
                                    ?
                                    "evalue8"
                                    :
                                    "volledig"
                                }
                            />


                            {/* Foto's; worden pas bij het eerste opslaan geüpload */}
                            <div className="
                                bg-white
                                border
                                rounded-2xl
                                p-5
                                mt-4
                                space-y-3
                            ">

                                <h2 className="font-bold text-lg">
                                    📷 Foto&apos;s
                                </h2>

                                <label className="
                                    block
                                    w-full
                                    border-2
                                    border-dashed
                                    border-gray-300
                                    rounded-xl
                                    p-4
                                    text-center
                                    text-gray-600
                                    cursor-pointer
                                    hover:bg-gray-50
                                ">
                                    📷 Foto's toevoegen
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={(e)=>{
                                            if(e.target.files){
                                                setOpleverFotos(prev=>[
                                                    ...prev,
                                                    ...Array.from(e.target.files!)
                                                ]);
                                            }
                                        }}
                                        className="hidden"
                                    />
                                </label>

                                {
                                    opleverFotos.length > 0 && (
                                        <div className="
                                            grid
                                            grid-cols-2
                                            sm:grid-cols-3
                                            gap-3
                                        ">
                                            {
                                                opleverFotos.map((foto,index)=>(
                                                    <div
                                                        key={index}
                                                        className="
                                                            border
                                                            rounded-xl
                                                            overflow-hidden
                                                            bg-gray-50
                                                            relative
                                                        "
                                                    >
                                                        <img
                                                            src={URL.createObjectURL(foto)}
                                                            alt={`Foto ${index + 1}`}
                                                            className="w-full h-28 object-cover"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={()=>
                                                                setOpleverFotos(prev=>
                                                                    prev.filter((_,i)=>i !== index)
                                                                )
                                                            }
                                                            className="
                                                                absolute
                                                                top-1
                                                                right-1
                                                                bg-white/80
                                                                rounded-full
                                                                w-6
                                                                h-6
                                                                text-red-500
                                                            "
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                ))
                                            }
                                        </div>
                                    )
                                }

                                <p className="text-xs text-gray-400">
                                    De foto's worden opgeslagen zodra je de opdracht opslaat.
                                </p>

                            </div>

                        </div>

                    )
                }


                {/* Nog niet gebouwde formulieren */}
                {
                    isEngineer
                    &&
                    selectedFormKey
                    &&
                    selectedFormKey !== "digital_signage"
                    &&
                    selectedFormKey !== "uren"
                    &&
                    selectedFormKey !== "evalue8"
                    && (

                        <div className="
                            bg-amber-50
                            border
                            border-amber-200
                            rounded-2xl
                            p-5
                            text-amber-800
                            text-sm
                        ">
                            Dit formulier wordt binnenkort toegevoegd.
                        </div>

                    )
                }




            </section>




            <button

                onClick={()=>void save()}

                disabled={saving}

                className={
                    isEngineer
                    ?
                    `
                    w-full
                    bg-green-600
                    text-white
                    rounded-xl
                    px-5
                    py-4
                    font-bold
                    disabled:opacity-50
                    `
                    :
                    `
                    w-full
                    bg-black
                    text-white
                    rounded-xl
                    px-5
                    py-4
                    font-bold
                    disabled:opacity-50
                    `
                }

            >

                {
                    saving
                    ?
                    "Bezig met opslaan..."
                    :
                    isEngineer
                    ?
                    "📤 Opdracht versturen"
                    :
                    "Opslaan"
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
