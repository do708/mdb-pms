"use client";

import { useEffect, useState } from "react";

import { useParams, useRouter } from "next/navigation";

import DocumentDropzone from "@/components/documents/DocumentDropzone";
import DeleteButton from "@/components/DeleteButton";



interface Customer {

    id:string;

    name:string;

}



interface Engineer {

    id:string;

    name:string | null;

}



export default function EditWorkorderPage(){


    const router =
        useRouter();


    const params =
        useParams();


    const id =
        params.id as string;




    const [customers,setCustomers] =
        useState<Customer[]>([]);


    const [engineers,setEngineers] =
        useState<Engineer[]>([]);


    const [title,setTitle] =
        useState("");


    const [customerId,setCustomerId] =
        useState("");


    const [location,setLocation] =
        useState("");


    const [city,setCity] =
        useState("");


    const [description,setDescription] =
        useState("");


    const [internalNotes,setInternalNotes] =
        useState("");


    const [assignedUserId,setAssignedUserId] =
        useState("");


    const [plannedDate,setPlannedDate] =
        useState("");


    const [startTime,setStartTime] =
        useState("");


    const [endTime,setEndTime] =
        useState("");


    const [multiDay,setMultiDay] =
        useState(false);


    const [endDate,setEndDate] =
        useState("");


    const [extraEngineerIds,setExtraEngineerIds] =
        useState<string[]>([]);


    function toggleExtra(uid:string){
        setExtraEngineerIds(prev=>
            prev.includes(uid)
            ?
            prev.filter(x=>x !== uid)
            :
            [...prev,uid]
        );
    }


    const [documents,setDocuments] =
        useState<{
            id:string;
            name:string;
            url:string;
        }[]>([]);


    const [loading,setLoading] =
        useState(true);


    const [saving,setSaving] =
        useState(false);


    const [error,setError] =
        useState("");




    useEffect(()=>{


        async function load(){


            const [
                workorderResponse,
                customersResponse,
                engineersResponse
            ] =
                await Promise.all([
                    fetch(`/api/workorders/${id}`),
                    fetch("/api/customers"),
                    fetch("/api/engineers")
                ]);


            const customersData =
                await customersResponse.json();

            setCustomers(
                Array.isArray(customersData)
                ?
                customersData
                :
                []
            );


            const engineersData =
                await engineersResponse.json();

            setEngineers(
                Array.isArray(engineersData)
                ?
                engineersData
                :
                []
            );




            if(workorderResponse.ok){


                const wo =
                    await workorderResponse.json();


                setTitle(wo.title ?? "");

                setCustomerId(
                    wo.customerId
                    ??
                    wo.project?.customerId
                    ??
                    ""
                );

                setLocation(wo.location ?? "");

                setCity(wo.city ?? "");

                setDescription(wo.description ?? "");

                setInternalNotes(wo.internalNotes ?? "");

                setAssignedUserId(wo.assignedUserId ?? "");

                setPlannedDate(
                    wo.plannedDate
                    ?
                    String(wo.plannedDate).slice(0,10)
                    :
                    ""
                );

                // Bepaal of dit een meerdaagse klus is: einddatum op een
                // andere dag dan de begindatum.
                const startDay =
                    wo.plannedDate
                    ?
                    String(wo.plannedDate).slice(0,10)
                    :
                    "";

                const endDay =
                    wo.plannedEndDate
                    ?
                    (()=>{
                        const d = new Date(wo.plannedEndDate);
                        const y = d.getFullYear();
                        const m = String(d.getMonth() + 1).padStart(2,"0");
                        const dd = String(d.getDate()).padStart(2,"0");
                        return `${y}-${m}-${dd}`;
                    })()
                    :
                    "";

                const isMultiDay =
                    !!endDay && !!startDay && endDay !== startDay;

                if(isMultiDay){

                    setMultiDay(true);
                    setEndDate(endDay);

                } else {

                    // Enkele dag: tijden uit de ISO-strings halen
                    if(wo.plannedDate){
                        const d = new Date(wo.plannedDate);
                        const hh = String(d.getHours()).padStart(2,"0");
                        const mm = String(d.getMinutes()).padStart(2,"0");
                        if(hh !== "00" || mm !== "00"){
                            setStartTime(`${hh}:${mm}`);
                        }
                    }

                    if(wo.plannedEndDate){
                        const d = new Date(wo.plannedEndDate);
                        const hh = String(d.getHours()).padStart(2,"0");
                        const mm = String(d.getMinutes()).padStart(2,"0");
                        if(hh !== "23" || mm !== "59"){
                            setEndTime(`${hh}:${mm}`);
                        }
                    }

                }

                // Extra monteurs
                if(Array.isArray(wo.extraEngineers)){
                    setExtraEngineerIds(
                        wo.extraEngineers
                        .map((e:any)=>e.userId ?? e.user?.id)
                        .filter(Boolean)
                    );
                }

                setDocuments(
                    Array.isArray(wo.documents)
                    ?
                    wo.documents
                    :
                    []
                );


            } else {


                setError("Werkbon niet gevonden");


            }


            setLoading(false);


        }


        load();


    },[id]);




    async function reloadDocuments(){


        const response =
            await fetch(`/api/workorders/${id}`);


        if(response.ok){

            const wo =
                await response.json();

            setDocuments(
                Array.isArray(wo.documents)
                ?
                wo.documents
                :
                []
            );

        }


    }




    async function save(){


        setError("");

        setSaving(true);


        try {


            const response =
                await fetch(

                    `/api/workorders/${id}`,

                    {

                        method:"PUT",

                        headers:{
                            "Content-Type":"application/json"
                        },

                        body:JSON.stringify({

                            title,

                            customerId,

                            location,

                            city,

                            description,

                            internalNotes,

                            assignedUserId,

                            extraEngineerIds,

                            plannedDate:
                                multiDay
                                ?
                                `${plannedDate}T09:00`
                                :
                                plannedDate && startTime
                                ?
                                `${plannedDate}T${startTime}`
                                :
                                plannedDate,

                            plannedEndDate:
                                multiDay && endDate
                                ?
                                `${endDate}T16:00`
                                :
                                plannedDate && endTime
                                ?
                                `${plannedDate}T${endTime}`
                                :
                                null

                        })

                    }

                );


            if(response.ok){


                router.push(`/workorders/${id}`);


            } else {


                const data =
                    await response
                    .json()
                    .catch(()=>({}));


                setError(
                    data.error ??
                    "Opslaan mislukt"
                );


            }


        } finally {

            setSaving(false);

        }


    }




    if(loading){

        return (

            <main className="p-6">

                Werkbon laden...

            </main>

        );

    }




    return (

        <main className="
            p-6
            space-y-6
            max-w-3xl
        ">


            <header>

                <h1 className="
                    text-2xl
                    font-bold
                ">

                    Werkbon wijzigen

                </h1>

                <p className="text-gray-500">

                    {title}

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
                border
                rounded-2xl
                p-5
                space-y-4
            ">


                <label className="block">

                    <span className="text-sm text-gray-600">

                        Titel

                    </span>

                    <input

                        value={title}

                        onChange={(e)=>setTitle(e.target.value)}

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

                        Opdrachtgever

                    </span>

                    <select

                        value={customerId}

                        onChange={(e)=>setCustomerId(e.target.value)}

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


                <div>

                    <span className="text-sm text-gray-600">

                        Waar? (adres en plaats)

                    </span>

                    <div className="
                        flex
                        flex-wrap
                        gap-3
                        mt-2
                    ">

                        <input

                            value={location}

                            onChange={(e)=>setLocation(e.target.value)}

                            placeholder="Straat en huisnummer"

                            className="
                                flex-1
                                min-w-[200px]
                                border
                                rounded-xl
                                p-3
                            "

                        />

                        <input

                            value={city}

                            onChange={(e)=>setCity(e.target.value)}

                            placeholder="Plaats"

                            className="
                                w-48
                                border
                                rounded-xl
                                p-3
                            "

                        />

                    </div>

                </div>


                <label className="block">

                    <span className="text-sm text-gray-600">

                        Omschrijving werkzaamheden

                    </span>

                    <textarea

                        value={description}

                        onChange={(e)=>setDescription(e.target.value)}

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


                <div className="
                    border
                    rounded-2xl
                    p-5
                    bg-gray-50
                    space-y-5
                ">

                    <label className="block">

                        <span className="
                            block
                            text-sm
                            font-medium
                            text-gray-700
                            mb-2
                        ">

                            Datum:

                        </span>

                        <input

                            type="date"

                            value={plannedDate}

                            onChange={(e)=>setPlannedDate(e.target.value)}

                            className="
                                w-full
                                max-w-xs
                                border
                                rounded-xl
                                p-3
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

                            onChange={(e)=>setMultiDay(e.target.checked)}

                        />

                        <span className="text-sm text-gray-700">

                            Meerdere dagen

                        </span>

                    </label>


                    {
                        multiDay && (

                            <label className="block">

                                <span className="
                                    block
                                    text-sm
                                    font-medium
                                    text-gray-700
                                    mb-2
                                ">

                                    Tot en met:

                                </span>

                                <input

                                    type="date"

                                    value={endDate}

                                    min={plannedDate}

                                    onChange={(e)=>setEndDate(e.target.value)}

                                    className="
                                        w-full
                                        max-w-xs
                                        border
                                        rounded-xl
                                        p-3
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
                            block
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
                                    block
                                    text-sm
                                    font-medium
                                    text-gray-700
                                    mb-2
                                ">

                                    Van

                                </span>

                                <input

                                    type="time"

                                    value={startTime}

                                    onChange={(e)=>setStartTime(e.target.value)}

                                    className="
                                        block
                                        border
                                        rounded-xl
                                        p-3
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
                                    block
                                    text-sm
                                    font-medium
                                    text-gray-700
                                    mb-2
                                ">

                                    Tot

                                </span>

                                <input

                                    type="time"

                                    value={endTime}

                                    onChange={(e)=>setEndTime(e.target.value)}

                                    className="
                                        block
                                        border
                                        rounded-xl
                                        p-3
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

                        onChange={(e)=>setAssignedUserId(e.target.value)}

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

                            Geen monteur

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

                        Interne opmerkingen (niet zichtbaar voor klant)

                    </span>

                    <textarea

                        value={internalNotes}

                        onChange={(e)=>setInternalNotes(e.target.value)}

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

                </label>


                <div>

                    <p className="text-sm text-gray-600 mb-2">

                        Bijlagen voor de monteur (plattegronden, foto&apos;s)

                    </p>


                    <DocumentDropzone

                        workorderId={id}

                        onUploaded={reloadDocuments}

                    />


                    {
                        documents.length > 0 && (

                            <div className="mt-3 space-y-2">

                                {
                                    documents.map(doc=>(

                                        <div

                                            key={doc.id}

                                            className="
                                                flex
                                                justify-between
                                                items-center
                                                border
                                                rounded-xl
                                                p-2
                                            "

                                        >

                                            <a

                                                href={doc.url}

                                                target="_blank"

                                                className="
                                                    text-sm
                                                    text-blue-700
                                                    truncate
                                                "

                                            >

                                                📎 {doc.name}

                                            </a>


                                            <DeleteButton

                                                url={`/api/documents/${doc.id}`}

                                                label={`bijlage "${doc.name}"`}

                                                onDeleted={reloadDocuments}

                                                compact

                                            />

                                        </div>

                                    ))
                                }

                            </div>

                        )
                    }

                </div>


            </section>







            <div className="
                flex
                gap-3
            ">

                <button

                    onClick={save}

                    disabled={saving}

                    className="
                        bg-black
                        text-white
                        rounded-xl
                        px-5
                        py-3
                        font-bold
                        disabled:opacity-50
                    "

                >

                    {saving ? "Bezig..." : "Opslaan"}

                </button>


                <button

                    onClick={()=>router.push(`/workorders/${id}`)}

                    className="
                        border
                        rounded-xl
                        px-5
                        py-3
                    "

                >

                    Annuleren

                </button>

            </div>


        </main>

    );

}
