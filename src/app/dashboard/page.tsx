"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { canAccessOffice } from "@/lib/auth/checkRole";
import { getStatus } from "@/constants/workorderStatus";
import { FORM_DEFINITIONS } from "@/constants/formDefinitions";
import AanvraagSpecificatiesOverzicht from "@/components/aanvraag/AanvraagSpecificatiesOverzicht";



interface OpenAanvraag {
    id:string;
    locatie:string | null;
    straat:string | null;
    huisnummer:string | null;
    postcode:string | null;
    plaats:string | null;
    schermen:string | null;
    beugel:string | null;
    stroom:string | null;
    internet:string | null;
    opmerkingen:string | null;
    aanvragerNaam:string | null;
    specificaties:unknown;
    bijlagen:unknown;
    createdAt:string;
    customer:{ name:string };
}



// Sectie op het dashboard met binnengekomen aanvragen van opdrachtgevers.
function AanvragenSectie(){

    const [aanvragen,setAanvragen] =
        useState<OpenAanvraag[]>([]);

    const [laden,setLaden] =
        useState(true);

    const [bezigId,setBezigId] =
        useState("");

    const [open,setOpen] =
        useState<string>("");


    async function laad(){
        try {
            const res = await fetch("/api/aanvragen");
            if(res.ok){
                const data = await res.json();
                setAanvragen(data.aanvragen || []);
            }
        } catch {
            // stil
        }
        setLaden(false);
    }


    useEffect(()=>{
        laad();
    },[]);


    async function behandel(id:string){

        setBezigId(id);

        try {
            const res =
                await fetch(`/api/aanvragen/${id}/behandelen`,{
                    method:"POST"
                });

            const data = await res.json();

            if(res.ok && data.workorderId){
                // Naar de klaarzet/bewerk-pagina om te controleren, plannen en
                // de afspraak te versturen.
                window.location.href = `/workorders/${data.workorderId}/edit`;
            } else {
                setBezigId("");
                laad();
            }

        } catch {
            setBezigId("");
        }

    }


    if(laden || aanvragen.length === 0){
        return null;
    }


    return (

        <section className="bg-white border rounded-2xl p-5">

            <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-gray-900">
                    Openstaande aanvragen
                </h2>
                <span className="text-xs font-bold bg-amber-100 text-amber-700 rounded-full px-2 py-0.5">
                    {aanvragen.length}
                </span>
            </div>

            <div className="space-y-2">

                {aanvragen.map((a)=>{

                    const adres =
                        [
                            [a.straat, a.huisnummer].filter(Boolean).join(" "),
                            [a.postcode, a.plaats].filter(Boolean).join(" ")
                        ].filter(Boolean).join(", ");

                    const isOpen = open === a.id;

                    const aantalBijlagen =
                        Array.isArray(a.bijlagen) ? a.bijlagen.length : 0;

                    return (

                        <div
                            key={a.id}
                            className="border rounded-xl p-3"
                        >

                            <div className="flex items-start justify-between gap-3">

                                <button
                                    type="button"
                                    onClick={()=>setOpen(isOpen ? "" : a.id)}
                                    className="text-left flex-1"
                                >
                                    <p className="font-semibold text-gray-900">
                                        {a.customer.name}
                                        {a.locatie ? ` · ${a.locatie}` : ""}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {adres || "Geen adres opgegeven"}
                                        {aantalBijlagen > 0 ? ` · 📎 ${aantalBijlagen}` : ""}
                                    </p>
                                </button>

                                <button
                                    type="button"
                                    onClick={()=>behandel(a.id)}
                                    disabled={bezigId === a.id}
                                    className="
                                        bg-blue-600
                                        text-white
                                        rounded-lg
                                        px-3
                                        py-2
                                        text-sm
                                        font-bold
                                        whitespace-nowrap
                                        disabled:opacity-50
                                    "
                                >
                                    {bezigId === a.id ? "Bezig..." : "In behandeling nemen"}
                                </button>

                            </div>


                            {
                                isOpen && (
                                    <div className="mt-3 pt-3 border-t">
                                        <AanvraagSpecificatiesOverzicht
                                            snapshot={{
                                                specificaties:a.specificaties,
                                                aanvragerNaam:a.aanvragerNaam,
                                                opmerkingen:a.opmerkingen,
                                                schermen:a.schermen,
                                                beugel:a.beugel,
                                                stroom:a.stroom,
                                                internet:a.internet,
                                            }}
                                            locatie={{
                                                locatie:a.locatie,
                                                straat:a.straat,
                                                huisnummer:a.huisnummer,
                                                postcode:a.postcode,
                                                plaats:a.plaats,
                                                opdrachtgever:a.customer.name,
                                            }}
                                            bijlagen={
                                                Array.isArray(a.bijlagen)
                                                ? (a.bijlagen as { url?:string; name?:string }[])
                                                : null
                                            }
                                        />
                                    </div>
                                )
                            }

                        </div>

                    );

                })}

            </div>

        </section>

    );

}


function formIcon(type:string):string {

    return (
        FORM_DEFINITIONS.find(d=>d.type === type)?.icon
        ?? "📝"
    );

}


function formTypeLabel(type:string):string {

    const map:Record<string,string> = {
        verlof:"Verlof",
        declaratie:"Bon declareren",
        werkplekinspectie:"Werkplekinspectie"
    };

    return (
        map[type]
        ??
        (FORM_DEFINITIONS.find(d=>d.type === type)?.label ?? type)
    );

}


function nlDate(value:unknown):string {

    if(!value || typeof value !== "string"){
        return "";
    }

    const d = new Date(value);

    if(isNaN(d.getTime())){
        return "";
    }

    return d.toLocaleDateString("nl-NL");

}


// Korte samenvatting per formulier: bij verlof de van-tot datums
function formSummary(form:any):string {

    if(form.type === "verlof"){

        const from = nlDate(form.data?.eersteDag);
        const to = nlDate(form.data?.laatsteDag);

        if(from && to){
            return `Verlof · ${from} t/m ${to}`;
        }

        if(from){
            return `Verlof · ${from}`;
        }

        return "Verlof";

    }

    if(form.type === "declaratie"){

        const datum = nlDate(form.data?.datum);

        return datum
            ?
            `Bon declareren · ${datum}`
            :
            "Bon declareren";

    }

    return formTypeLabel(form.type);

}


interface DashboardData {

    counters:{

        ingepland:number;

        uitgevoerd:number;

        teLaat:number;

        openForms:number;

    };


    teLaat:any[];


    materiaalWaarschuwing:any[];


    recent:any[];


    recentForms:any[];

}






export default function DashboardPage(){


    const [data,setData] =
        useState<DashboardData | null>(null);



    const [loading,setLoading] =
        useState(true);


    const { data: session, status } = useSession();

    const userRole = session?.user?.role ?? "";







    useEffect(()=>{


        async function load(){


            const response =
                await fetch(

                    "/api/dashboard"

                );


            const result =
                await response.json();



            setData(result);


            setLoading(false);


        }



        load();


    },[]);








    if(loading){


        return (

            <main className="p-6">

                Dashboard laden...

            </main>

        );

    }

    if (status !== "loading" && !canAccessOffice(userRole)) {

        return (

            <main className="p-6">

                Geen toegang

            </main>

        );

    }






    return (

        <main className="
            p-6
            space-y-6
            bg-gray-50
            min-h-screen
        ">



            <AanvragenSectie />










            <section className="
                grid
                grid-cols-2
                md:grid-cols-4
                gap-3
            ">



                <div className="
                    bg-blue-50
                    border
                    border-blue-200
                    rounded-xl
                    p-4
                ">

                    <p className="text-sm text-blue-700">

                        Ingepland

                    </p>


                    <p className="text-2xl font-bold text-blue-700">

                        {data?.counters.ingepland ?? 0}

                    </p>

                </div>



                <div className="
                    bg-indigo-50
                    border
                    border-indigo-200
                    rounded-xl
                    p-4
                ">

                    <p className="text-sm text-indigo-700">

                        Uitgevoerd

                    </p>


                    <p className="text-2xl font-bold text-indigo-700">

                        {data?.counters.uitgevoerd ?? 0}

                    </p>

                </div>



                <div className="
                    bg-purple-50
                    border
                    border-purple-200
                    rounded-xl
                    p-4
                ">

                    <p className="text-sm text-purple-700">

                        Formulieren

                    </p>


                    <p className="text-2xl font-bold text-purple-700">

                        {data?.counters.openForms ?? 0}

                    </p>

                </div>



                <div className={`
                    border
                    rounded-xl
                    p-4
                    ${
                        (data?.counters.teLaat ?? 0) > 0
                        ?
                        "bg-red-50 border-red-300"
                        :
                        "bg-gray-50 border-gray-200"
                    }
                `}>

                    <p className={
                        (data?.counters.teLaat ?? 0) > 0
                        ?
                        "text-sm text-red-700 font-medium"
                        :
                        "text-sm text-gray-500"
                    }>

                        Nog in te vullen

                    </p>


                    <p className={`
                        text-2xl
                        font-bold
                        ${
                            (data?.counters.teLaat ?? 0) > 0
                            ?
                            "text-red-600"
                            :
                            "text-gray-400"
                        }
                    `}>

                        {data?.counters.teLaat ?? 0}

                    </p>

                </div>




            </section>




            {
                (data?.teLaat?.length ?? 0) > 0 && (

                    <section className="
                        bg-red-50
                        border
                        border-red-300
                        rounded-xl
                        p-4
                    ">

                        <h2 className="
                            text-xl
                            font-bold
                            mb-4
                            text-red-700
                        ">

                            ⚠️ Nog in te vullen ({data?.teLaat?.length})

                        </h2>


                        <div className="space-y-3">

                            {
                                data?.teLaat?.map(workorder=>(

                                    <a

                                        key={workorder.id}

                                        href={`/workorders/${workorder.id}`}

                                        className="
                                            flex
                                            justify-between
                                            items-center
                                            bg-white
                                            border
                                            border-red-200
                                            rounded-xl
                                            p-3
                                            hover:bg-red-50
                                        "

                                    >

                                        <div>

                                            <p className="font-bold">

                                                {workorder.number} — {workorder.title}

                                            </p>

                                            <p className="text-sm text-gray-500">

                                                🏢 {
                                                    workorder.customer?.name
                                                    ?? workorder.project?.customer?.name
                                                    ?? "—"
                                                }

                                                {" · "}

                                                👷 {workorder.assignedUser?.name ?? "Geen monteur"}

                                            </p>

                                        </div>


                                        <span className="text-sm text-red-600 font-medium">

                                            Gepland:
                                            {" "}
                                            {
                                                workorder.plannedDate
                                                ?
                                                new Date(workorder.plannedDate)
                                                    .toLocaleDateString("nl-NL")
                                                :
                                                "—"
                                            }

                                        </span>

                                    </a>

                                ))
                            }

                        </div>

                    </section>

                )
            }




            {
                (data?.materiaalWaarschuwing?.length ?? 0) > 0 && (

                    <section className="
                        bg-red-50
                        border
                        border-red-300
                        rounded-xl
                        p-4
                    ">

                        <h2 className="
                            text-xl
                            font-bold
                            mb-1
                            text-red-700
                        ">

                            📦 Materiaal nog niet gecontroleerd ({data?.materiaalWaarschuwing?.length})

                        </h2>

                        <p className="
                            text-sm
                            text-red-700
                            mb-4
                        ">
                            Deze klussen staan morgen ingepland, maar het klaargezette
                            materiaal is nog niet volledig geleverd/klaargezet.
                        </p>


                        <div className="space-y-3">

                            {
                                data?.materiaalWaarschuwing?.map(workorder=>(

                                    <a

                                        key={workorder.id}

                                        href={`/workorders/${workorder.id}`}

                                        className="
                                            flex
                                            justify-between
                                            items-center
                                            bg-white
                                            border
                                            border-red-200
                                            rounded-xl
                                            p-3
                                            hover:bg-red-50
                                        "

                                    >

                                        <div>

                                            <p className="font-bold">

                                                {workorder.number} — {workorder.title}

                                            </p>

                                            <p className="text-sm text-gray-500">

                                                🏢 {workorder.customer ?? "—"}

                                                {
                                                    workorder.engineer
                                                    ?
                                                    ` · 👷 ${workorder.engineer}`
                                                    :
                                                    ""
                                                }

                                            </p>

                                        </div>

                                        <span className="
                                            text-xs
                                            font-semibold
                                            text-red-700
                                            whitespace-nowrap
                                        ">
                                            Controleer materiaal →
                                        </span>

                                    </a>

                                ))
                            }

                        </div>

                    </section>

                )
            }




            <section className="
                grid
                grid-cols-1
                lg:grid-cols-2
                gap-4
            ">


                <div className="
                    bg-white
                    border
                    rounded-2xl
                    p-4
                ">

                    <h2 className="
                        font-bold
                        mb-3
                    ">

                        📋 Laatste werkbonnen

                    </h2>


                    <div className="space-y-2">

                        {
                            data?.recent.map(workorder=>(

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

                                        <p className="
                                            font-medium
                                            text-sm
                                            truncate
                                        ">

                                            {workorder.number} — {workorder.title}

                                        </p>

                                        <p className="text-xs text-gray-500 truncate">

                                            🏢 {
                                                workorder.customer?.name
                                                ?? workorder.project?.customer?.name
                                                ?? "—"
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
                            (data?.recent?.length ?? 0) === 0 && (

                                <p className="text-sm text-gray-400">

                                    Nog geen werkbonnen.

                                </p>

                            )
                        }

                    </div>

                </div>




                <div className="
                    bg-white
                    border
                    rounded-2xl
                    p-4
                ">

                    <h2 className="
                        font-bold
                        mb-3
                    ">

                        📝 Laatste formulieren

                    </h2>


                    <div className="space-y-2">

                        {
                            data?.recentForms?.map(form=>(

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

                                        <p className="
                                            font-medium
                                            text-sm
                                            truncate
                                        ">

                                            {formIcon(form.type)} {form.user?.name ?? "Onbekend"}

                                        </p>

                                        <p className="text-xs text-gray-500 truncate">

                                            {formSummary(form)}

                                        </p>

                                    </div>


                                    <span className="
                                        shrink-0
                                        ml-2
                                        px-2
                                        py-0.5
                                        rounded-full
                                        text-xs
                                        bg-fuchsia-100
                                        text-fuchsia-700
                                    ">

                                        {form.status}

                                    </span>

                                </a>

                            ))
                        }

                        {
                            (data?.recentForms?.length ?? 0) === 0 && (

                                <p className="text-sm text-gray-400">

                                    Nog geen formulieren.

                                </p>

                            )
                        }

                    </div>

                </div>


            </section>





        </main>

    );


}