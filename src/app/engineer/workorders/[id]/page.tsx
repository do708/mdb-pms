"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import StatusFlow from "@/components/workorders/StatusFlow";
import PhotosForm from "@/components/workorders/PhotosForm";
import CorrespondentieBlok from "@/components/workorders/CorrespondentieBlok";
import OpleverForm from "@/components/workorders/OpleverForm";

import { parseCustomerSchema } from "@/types/customerForms";

import type { OpleverData } from "@/types/oplever";
import { sendWorkorderMail } from "@/lib/email/sendWorkorderMail";

interface Workorder {


    id:string;

    number:string;

    title:string;

    description:string | null;

    internalNotes:string | null;

    documents:{

        id:string;

        name:string;

        url:string;

    }[];

    formData:unknown;

    assignedUser:{

        name:string | null;

    } | null;

    extraEngineers?:{
        user:{
            name:string | null;
        };
    }[];

    forms?:{
        formType:{
            key:string;
            name:string;
        };
    }[];

    status:string;

    sentAt:string | null;

    location:string | null;

    city:string | null;

    contactPersoon:string | null;

    contactEmail:string | null;

    contactPhone:string | null;

    werkInstructie:string | null;

    customer:{

        name:string;

        address:string | null;

        formSchema?:unknown;

    } | null;


    project:{

        name:string;

        customer:{

            name:string;

            address:string | null;

        };

    } | null;


}







// Eén materiaalregel (Schermen / Players / Beugels): aantal-tekstveld +
// vinkjes "Geleverd" en "Klaargezet". Is het tekstvak leeg, dan geldt de
// regel als "n.v.t." en zijn de vinkjes niet nodig. Is het tekstvak ingevuld,
// dan zijn Geleverd én Klaargezet verplicht (rood kader tot ze aanstaan).
function MateriaalRij({
    label,
    plh,
    aantal,
    geleverd,
    klaargezet,
    onAantal,
    onGeleverd,
    onKlaargezet
}:{
    label:string;
    plh:string;
    aantal:string;
    geleverd:boolean;
    klaargezet:boolean;
    onAantal:(v:string)=>void;
    onGeleverd:(v:boolean)=>void;
    onKlaargezet:(v:boolean)=>void;
}){

    const ingevuld =
        aantal.trim() !== "";

    // Niet in orde = tekstvak ingevuld maar nog niet allebei aangevinkt.
    const nietInOrde =
        ingevuld && (!geleverd || !klaargezet);

    return (
        <div className="mb-2">

            <div className="
                flex
                items-center
                justify-between
                mb-1
            ">
                <span className="
                    text-sm
                    font-medium
                    text-slate-700
                ">
                    {label}
                </span>

                {
                    !ingevuld && (
                        <span className="
                            text-[11px]
                            text-slate-400
                            font-medium
                        ">
                            n.v.t.
                        </span>
                    )
                }
            </div>

            <div className="
                grid
                grid-cols-[1fr_auto_auto]
                gap-2
                items-center
            ">

                <input
                    type="text"
                    value={aantal}
                    onChange={(e)=>onAantal(e.target.value)}
                    placeholder={plh}
                    className={`
                        border
                        rounded-lg
                        p-2
                        text-sm
                        bg-white
                        ${nietInOrde ? "border-red-300" : ""}
                    `}
                />

                <div className="w-16 flex justify-center">
                    <input
                        type="checkbox"
                        checked={geleverd}
                        disabled={!ingevuld}
                        onChange={(e)=>onGeleverd(e.target.checked)}
                        className={`
                            w-5 h-5
                            ${!ingevuld ? "opacity-30" : ""}
                            ${nietInOrde && !geleverd ? "ring-2 ring-red-300 rounded" : ""}
                        `}
                    />
                </div>

                <div className="w-16 flex justify-center">
                    <input
                        type="checkbox"
                        checked={klaargezet}
                        disabled={!ingevuld}
                        onChange={(e)=>onKlaargezet(e.target.checked)}
                        className={`
                            w-5 h-5
                            ${!ingevuld ? "opacity-30" : ""}
                            ${nietInOrde && !klaargezet ? "ring-2 ring-red-300 rounded" : ""}
                        `}
                    />
                </div>

            </div>

        </div>
    );

}


export default function EngineerWorkorderPage(){


    const params = useParams();

    const { data:session } =
        useSession();

    const role =
        session?.user?.role ?? "";

    const isOffice =
        role === "admin" || role === "office";


    const id =
        params.id as string;




    const [workorder,setWorkorder] =
        useState<Workorder | null>(null);



    const [notes,setNotes] =
        useState("");


    // Klaargezet materiaal (pakbon + schermen/players/beugels).
    const [materiaal,setMateriaal] =
        useState({
            pakbonUrl:"",
            schermenAantal:"",
            schermenGeleverd:false,
            schermenKlaargezet:false,
            playersAantal:"",
            playersGeleverd:false,
            playersKlaargezet:false,
            beugelsAantal:"",
            beugelsGeleverd:false,
            beugelsKlaargezet:false,
            versterkersAantal:"",
            versterkersGeleverd:false,
            versterkersKlaargezet:false
        });

    const [pakbonUploaden,setPakbonUploaden] =
        useState(false);


    // Bezig-vlag voor het versturen van de afspraakmail.
    const [afspraakBezig,setAfspraakBezig] =
        useState(false);


    // Voor het automatisch bewaren van het materiaal-blok: onthoud of de
    // eerste (geladen) waarde al is gezet, zodat we niet meteen opslaan.
    const materiaalGeladen = useRef(false);
    const materiaalTimer = useRef<ReturnType<typeof setTimeout> | null>(null);



    const [status,setStatus] =
        useState("ontvangen");


    // Ingevulde opleverdata; wordt via onChange bijgehouden en bij opslaan
    // meegestuurd naar de server.
    const [opleverData,setOpleverData] =
        useState<OpleverData | null>(null);



    const [saving,setSaving] =
        useState(false);



    const [loading,setLoading] =
        useState(true);








    useEffect(()=>{


        async function load(){


            const response =
                await fetch(
                    `/api/workorders/${id}`
                );


            const data =
                await response.json();



            setWorkorder(data);

            setNotes(
                data.description || ""
            );


            // Klaargezet materiaal uit de opgeslagen formData halen.
            const opgeslagenMateriaal =
                data.formData?.klaarzetMateriaal;

            if(
                opgeslagenMateriaal &&
                typeof opgeslagenMateriaal === "object"
            ){
                setMateriaal(m=>({
                    ...m,
                    ...opgeslagenMateriaal
                }));
            }


            setStatus(
                data.status
            );


            setLoading(false);


        }


        load();


    },[id]);


    // Materiaal automatisch bewaren zodra er iets verandert (met korte
    // vertraging). Zo wordt ingetypte tekst onthouden zonder dat er iets
    // aangevinkt of op een knop geklikt hoeft te worden.
    useEffect(()=>{

        if(!materiaalGeladen.current){
            materiaalGeladen.current = true;
            return;
        }

        if(materiaalTimer.current){
            clearTimeout(materiaalTimer.current);
        }

        materiaalTimer.current =
            setTimeout(()=>{

                fetch(
                    `/api/workorders/${id}`,
                    {
                        method:"PUT",
                        headers:{
                            "Content-Type":"application/json"
                        },
                        body:JSON.stringify({
                            formData:{
                                ...(opleverData ?? {}),
                                klaarzetMateriaal:materiaal
                            }
                        })
                    }
                ).catch(()=>{});

            },800);

        return ()=>{
            if(materiaalTimer.current){
                clearTimeout(materiaalTimer.current);
            }
        };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[materiaal]);









    async function saveWorkorder(){


        setSaving(true);


        try {


            const response =
                await fetch(

                    `/api/workorders/${id}`,

                    {

                        method:"PUT",

                        headers:{

                            "Content-Type":
                            "application/json"

                        },


                        body:JSON.stringify({

                            description:notes,

                            formData:{
                                ...(opleverData ?? {}),
                                klaarzetMateriaal:materiaal
                            }

                        })

                    }

                );



            if(response.ok){


                alert(
                    "Werkbon opgeslagen"
                );


            } else {


                alert(
                    "Opslaan mislukt"
                );


            }



        } catch(error){


            console.error(error);


            alert(
                "Opslaan mislukt"
            );


        } finally {


            setSaving(false);


        }


    }










    if(loading){


        return (

            <main className="p-5">

                Werkbon laden...

            </main>

        );

    }


async function verstuurAfspraak(){


    if(
        !confirm(
            "Afspraakbevestiging naar de klant versturen? De status wordt op \"Afspraak verstuurd\" gezet."
        )
    ){
        return;
    }


    setAfspraakBezig(true);


    try {

        const response =
            await fetch(
                `/api/workorders/${id}/send-afspraak`,
                {
                    method:"POST",
                    headers:{
                        "Content-Type":"application/json"
                    },
                    body:JSON.stringify({})
                }
            );


        if(!response.ok){

            const data =
                await response.json().catch(()=>null);

            alert(
                data?.error
                ?
                data.error
                :
                "Afspraak versturen mislukt"
            );

            return;

        }


        setStatus("afspraak");

        alert("Afspraakbevestiging verstuurd.");

    } finally {

        setAfspraakBezig(false);

    }

}


async function completeWorkorder(){


    // Checklist is verplicht bij Digital Signage en eValue8 (niet bij Uren).
    const formKey =
        (workorder?.forms ?? [])[0]?.formType?.key ?? "";

    if(formKey !== "uren" && opleverData){

        const cl = opleverData.checklist;

        const ontbreekt =
            cl.werkendOpgeleverd === null
            || cl.lichtnetSchakelbaar === null
            || cl.wifiVanToepassing === null
            || !cl.remoteServices
            || cl.afvalverwijdering === null;

        if(ontbreekt){
            alert(
                "Vul eerst de volledige checklist in voordat je de werkbon verstuurt."
            );
            return;
        }

    }


    const confirmComplete =
        confirm(
            "Werkbon versturen? De werkbon wordt afgerond, als PDF opgeslagen en kantoor krijgt een melding."
        );


    if(!confirmComplete){

        return;

    }



    try {


        // Eerst de laatst ingevulde opleverdata opslaan, zodat de PDF de
        // actuele gegevens bevat.
        await fetch(
            `/api/workorders/${id}`,
            {
                method:"PUT",
                headers:{
                    "Content-Type":"application/json"
                },
                body:JSON.stringify({
                    description:notes,
                    formData:{
                                ...(opleverData ?? {}),
                                klaarzetMateriaal:materiaal
                            }
                })
            }
        );


        const completeResponse =
            await fetch(

                `/api/workorders/${id}/complete`,

                {

                    method:"POST"

                }

            );





        if(!completeResponse.ok){


            alert(
                "Werkbon versturen mislukt"
            );


            return;

        }







        const pdfResponse =
            await fetch(

                `/api/workorders/${id}/generate-pdf`,

                {

                    method:"POST"

                }

            );






        if(!pdfResponse.ok){


            alert(
                "PDF genereren mislukt"
            );


            return;

        }








        const pdfData =
            await pdfResponse.json();






        alert(

            "Werkbon verstuurd. Kantoor heeft een melding gekregen."

        );



        setStatus(

            "uitgevoerd"

        );





    } catch(error){


        console.error(error);



        alert(

            "Fout bij versturen werkbon"

        );


    }


}




    if(!workorder){


        return (

            <main className="p-5">

                Werkbon niet gevonden

            </main>

        );

    }









    return (

        <main className="
            p-5
            space-y-5
            bg-gray-50
            min-h-screen
        ">


            <header>


                <div className="
                    flex
                    items-center
                    justify-between
                    gap-3
                ">

                    <h1 className="
                        text-2xl
                        font-bold
                    ">

                        📝 {workorder.number}

                    </h1>


                    {
                        isOffice && (
                            <Link
                                href={`/workorders/${id}/edit`}
                                className="
                                    text-sm
                                    text-blue-600
                                    underline
                                    shrink-0
                                "
                            >
                                Wijzigen
                            </Link>
                        )
                    }

                </div>


            </header>


            {
                isOffice && (
                    <section className="
                        bg-white
                        rounded-2xl
                        p-4
                    ">
                        <StatusFlow
                            workorderId={id}
                            current={status || workorder.status}
                            onChanged={(nieuw)=>setStatus(nieuw)}
                        />

                        {
                            (()=>{

                                const huidig =
                                    status || workorder.status;

                                // Alles vanaf "afspraak" betekent dat de
                                // afspraak al verstuurd is (status 2 of hoger).
                                // Alleen bij "ontvangen" (status 1) mag het nog.
                                const alVerstuurd =
                                    huidig !== "ontvangen";

                                return (
                                    <>
                                        <button
                                            type="button"
                                            onClick={verstuurAfspraak}
                                            disabled={afspraakBezig || alVerstuurd}
                                            className="
                                                mt-3
                                                w-full
                                                bg-teal-600
                                                text-white
                                                rounded-xl
                                                py-3
                                                font-bold
                                                disabled:opacity-50
                                                disabled:cursor-not-allowed
                                            "
                                        >
                                            {
                                                afspraakBezig
                                                ?
                                                "Bezig met versturen..."
                                                :
                                                alVerstuurd
                                                ?
                                                "✓ Afspraak al verstuurd"
                                                :
                                                "✉️ Verstuur afspraak"
                                            }
                                        </button>

                                        <p className="text-xs text-slate-500 mt-2 text-center">
                                            {
                                                alVerstuurd
                                                ?
                                                "De afspraak is al verstuurd. Zet de status terug op \"Opdracht ontvangen\" om opnieuw te versturen."
                                                :
                                                "Stuurt een afspraakbevestiging naar de klant (bcc naar projects@mdb-networks.nl) en zet de status op \"Afspraak verstuurd\"."
                                            }
                                        </p>
                                    </>
                                );

                            })()
                        }

                    </section>
                )
            }









            <section className="
                bg-white
                rounded-2xl
                border
                p-5
                space-y-3
            ">


                <p>
                    🏢 {
                        workorder.customer?.name
                        ??
                        workorder.project?.customer.name
                        ??
                        "—"
                    }
                </p>


                <p className="text-gray-500">
                    {workorder.title}
                </p>


                {
                    workorder.contactPersoon && (
                        <p className="text-gray-700">
                            👤 {workorder.contactPersoon}
                            {
                                workorder.contactPhone
                                ?
                                ` · 📞 ${workorder.contactPhone}`
                                :
                                ""
                            }
                        </p>
                    )
                }

                {
                    workorder.contactEmail && (
                        <p>
                            <a
                                href={`mailto:${workorder.contactEmail}`}
                                className="text-blue-600 underline"
                            >
                                ✉️ {workorder.contactEmail}
                            </a>
                        </p>
                    )
                }


                {
                    (()=>{

                        const adres =
                            workorder.location
                            ??
                            workorder.customer?.address
                            ??
                            workorder.project?.customer.address
                            ??
                            "";

                        const stad =
                            workorder.city ?? "";

                        const volledig =
                            [adres, stad]
                            .filter(Boolean)
                            .join(", ");

                        if(!volledig){
                            return (
                                <p>📍 Geen locatie</p>
                            );
                        }

                        const mapsUrl =
                            `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(volledig)}`;

                        return (
                            <a
                                href={mapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="
                                    text-blue-600
                                    underline
                                    inline-flex
                                    items-center
                                    gap-1
                                "
                            >
                                📍 {volledig}
                                <span className="text-xs">↗</span>
                            </a>
                        );

                    })()
                }


            </section>









            {workorder.internalNotes && (

                <section className="
                    bg-amber-50
                    border
                    border-amber-300
                    rounded-2xl
                    p-4
                    mb-4
                ">


                    <h2 className="
                        font-bold
                        mb-2
                    ">

                        🔒 Interne notitie

                    </h2>


                    <p className="whitespace-pre-wrap text-sm">

                        {workorder.internalNotes}

                    </p>


                </section>

            )}




            {
                workorder.documents?.length > 0 && (

                    <section className="
                        bg-white
                        border
                        rounded-2xl
                        p-4
                        mb-4
                    ">

                        <h2 className="
                            font-bold
                            mb-2
                        ">

                            📎 Bijlagen van kantoor

                        </h2>


                        <div className="space-y-2">

                            {
                                workorder.documents.map(doc=>{


                                    const isImage =
                                        /\.(png|jpe?g|gif|webp)$/i
                                        .test(doc.name);


                                    return (

                                        <a

                                            key={doc.id}

                                            href={doc.url}

                                            target="_blank"

                                            className="
                                                block
                                                border
                                                rounded-xl
                                                p-2
                                                hover:bg-gray-50
                                            "

                                        >

                                            {
                                                isImage
                                                ?

                                                (
                                                    /* eslint-disable-next-line @next/next/no-img-element */
                                                    <img

                                                        src={doc.url}

                                                        alt={doc.name}

                                                        className="
                                                            max-h-48
                                                            rounded-lg
                                                            mb-1
                                                        "

                                                    />
                                                )
                                                :
                                                null
                                            }

                                            <span className="
                                                text-sm
                                                text-blue-700
                                            ">

                                                📎 {doc.name}

                                            </span>

                                        </a>

                                    );

                                })
                            }

                        </div>

                    </section>

                )
            }




            <section className="
                bg-white
                rounded-2xl
                border
                p-5
            ">


                <h2 className="
                    font-bold
                    mb-3
                ">

                    Werkzaamheden

                </h2>


                <div className="
                    grid
                    grid-cols-1
                    md:grid-cols-2
                    gap-5
                ">


                    {/* Links: wat er moet gebeuren */}
                    <textarea

                        value={notes}

                        onChange={(e)=>
                            setNotes(
                                e.target.value
                            )
                        }


                        className="
                            w-full
                            border
                            rounded-xl
                            p-3
                            min-h-40
                        "

                        placeholder="Beschrijf uitgevoerde werkzaamheden"

                    />


                    {/* Rechts: klaargezet materiaal */}
                    <div className="
                        border
                        rounded-xl
                        p-4
                        bg-slate-50
                    ">


                        <div className="
                            flex
                            items-center
                            justify-between
                            mb-3
                        ">

                            <span className="font-semibold text-slate-700">
                                Materiaal
                            </span>


                            <label className="
                                text-sm
                                text-sky-700
                                font-medium
                                cursor-pointer
                                hover:underline
                            ">

                                {
                                    pakbonUploaden
                                    ?
                                    "Bezig..."
                                    :
                                    (
                                        materiaal.pakbonUrl
                                        ?
                                        "Pakbon vervangen"
                                        :
                                        "Pakbon uploaden"
                                    )
                                }

                                <input
                                    type="file"
                                    className="hidden"
                                    onChange={async (e)=>{

                                        const file =
                                            e.target.files?.[0];

                                        if(!file){ return; }

                                        setPakbonUploaden(true);

                                        try {

                                            const body =
                                                new FormData();

                                            body.append("file",file);

                                            const res =
                                                await fetch(
                                                    "/api/upload",
                                                    {
                                                        method:"POST",
                                                        body
                                                    }
                                                );

                                            const data =
                                                await res.json();

                                            if(res.ok && data.url){
                                                setMateriaal(m=>({
                                                    ...m,
                                                    pakbonUrl:data.url
                                                }));
                                            } else {
                                                alert(
                                                    data?.error
                                                    ?
                                                    `Upload mislukt: ${data.error}`
                                                    :
                                                    "Upload mislukt"
                                                );
                                            }

                                        } finally {
                                            setPakbonUploaden(false);
                                        }

                                    }}
                                />

                            </label>

                        </div>


                        {
                            materiaal.pakbonUrl && (
                                <a
                                    href={materiaal.pakbonUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="
                                        block
                                        text-xs
                                        text-sky-600
                                        underline
                                        mb-3
                                    "
                                >
                                    Geüploade pakbon bekijken
                                </a>
                            )
                        }


                        {/* Kolomkoppen */}
                        <div className="
                            grid
                            grid-cols-[1fr_auto_auto]
                            gap-2
                            items-center
                            text-xs
                            font-medium
                            text-slate-500
                            mb-1
                        ">
                            <span></span>
                            <span className="w-16 text-center">Geleverd</span>
                            <span className="w-16 text-center">Klaargezet</span>
                        </div>


                        <MateriaalRij
                            label="Schermen"
                            plh={"bijv. 2x 55\" en 1x 32\""}
                            aantal={materiaal.schermenAantal}
                            geleverd={materiaal.schermenGeleverd}
                            klaargezet={materiaal.schermenKlaargezet}
                            onAantal={(v)=>setMateriaal(m=>({...m,schermenAantal:v}))}
                            onGeleverd={(v)=>setMateriaal(m=>({...m,schermenGeleverd:v}))}
                            onKlaargezet={(v)=>setMateriaal(m=>({...m,schermenKlaargezet:v}))}
                        />

                        <MateriaalRij
                            label="Players"
                            plh="aantal"
                            aantal={materiaal.playersAantal}
                            geleverd={materiaal.playersGeleverd}
                            klaargezet={materiaal.playersKlaargezet}
                            onAantal={(v)=>setMateriaal(m=>({...m,playersAantal:v}))}
                            onGeleverd={(v)=>setMateriaal(m=>({...m,playersGeleverd:v}))}
                            onKlaargezet={(v)=>setMateriaal(m=>({...m,playersKlaargezet:v}))}
                        />

                        <MateriaalRij
                            label="Beugels"
                            plh="bijv. muurbeugels"
                            aantal={materiaal.beugelsAantal}
                            geleverd={materiaal.beugelsGeleverd}
                            klaargezet={materiaal.beugelsKlaargezet}
                            onAantal={(v)=>setMateriaal(m=>({...m,beugelsAantal:v}))}
                            onGeleverd={(v)=>setMateriaal(m=>({...m,beugelsGeleverd:v}))}
                            onKlaargezet={(v)=>setMateriaal(m=>({...m,beugelsKlaargezet:v}))}
                        />

                        <MateriaalRij
                            label="Versterker/speakers"
                            plh="bijv. versterker + 4 speakers"
                            aantal={materiaal.versterkersAantal}
                            geleverd={materiaal.versterkersGeleverd}
                            klaargezet={materiaal.versterkersKlaargezet}
                            onAantal={(v)=>setMateriaal(m=>({...m,versterkersAantal:v}))}
                            onGeleverd={(v)=>setMateriaal(m=>({...m,versterkersGeleverd:v}))}
                            onKlaargezet={(v)=>setMateriaal(m=>({...m,versterkersKlaargezet:v}))}
                        />


                    </div>


                </div>


           </section>


<OpleverForm

    workorderId={id}

    initial={workorder.formData}

    monteur1Name={workorder.assignedUser?.name ?? null}

    extraEngineerNames={
        (workorder.extraEngineers ?? [])
        .map(e=>e.user?.name)
        .filter((n):n is string => !!n)
    }

    customerSchema={
        parseCustomerSchema(workorder.customer?.formSchema)
    }

    customerName={workorder.customer?.name ?? null}

    embedded

    onChange={setOpleverData}

    variant={
        (workorder.forms ?? [])[0]?.formType?.key === "uren"
        ?
        "uren"
        :
        (workorder.forms ?? [])[0]?.formType?.key === "evalue8"
        ?
        "evalue8"
        :
        "volledig"
    }

/>


<PhotosForm

    workorderId={id}

    readOnly={!!workorder.sentAt}

/>


            <div className="mt-6">
                <CorrespondentieBlok
                    workorderId={id}
                />
            </div>


            {
                /* Versturen-knop alleen tonen als de werkbon nog niet
                   verstuurd is. Daarna is dit een read-only weergave. */
                !workorder.sentAt && (

                    <button

                        onClick={completeWorkorder}

                        disabled={saving}

                        className="
                            w-full
                            bg-green-600
                            text-white
                            rounded-xl
                            py-4
                            font-bold
                            disabled:opacity-50
                        "

                    >

                        📤 Werkbon versturen

                    </button>

                )
            }



        </main>

    );


}