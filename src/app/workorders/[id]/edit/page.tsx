"use client";

import { useEffect, useState } from "react";

import { useParams, useRouter } from "next/navigation";

import MaterialsForm from "@/components/workorders/MaterialsForm";
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


    const [description,setDescription] =
        useState("");


    const [internalNotes,setInternalNotes] =
        useState("");


    const [assignedUserId,setAssignedUserId] =
        useState("");


    const [plannedDate,setPlannedDate] =
        useState("");


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

                            description,

                            internalNotes,

                            assignedUserId,

                            plannedDate

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
                    text-3xl
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


                <label className="block">

                    <span className="text-sm text-gray-600">

                        Locatie / adres

                    </span>

                    <input

                        value={location}

                        onChange={(e)=>setLocation(e.target.value)}

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


                <label className="block">

                    <span className="text-sm text-gray-600">

                        Geplande datum

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




            {/* Materialen aanpassen (ander materiaal gekozen, etc.) */}

            <MaterialsForm

                workorderId={id}

            />




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
