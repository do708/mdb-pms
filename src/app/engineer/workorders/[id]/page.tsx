"use client";

import { useEffect, useState, useRef, type ReactNode } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import StatusFlow from "@/components/workorders/StatusFlow";
import PhotosForm from "@/components/workorders/PhotosForm";
import CorrespondentieBlok from "@/components/workorders/CorrespondentieBlok";
import OpleverForm from "@/components/workorders/OpleverForm";
import AanvraagSpecificatiesOverzicht, {
    parseAanvraagSnapshot,
} from "@/components/aanvraag/AanvraagSpecificatiesOverzicht";

import { parseCustomerSchema } from "@/types/customerForms";

import {
    ontbrekendeMateriaalSerienummers,
    type OpleverData
} from "@/types/oplever";
import {
    klaarzetVanAanvraagSpecificaties,
    mergeKlaarzetPrefill,
} from "@/lib/aanvraag/klaarzetVanSpecificaties";
import { leesSchermAansturing } from "@/lib/klaarzetMateriaal";

interface Workorder {


    id:string;

    number:string;

    title:string;

    description:string | null;

    internalNotes:string | null;

    onHoldNotes:string | null;

    documents:{

        id:string;

        name:string;

        url:string;

    }[];

    formData:unknown;

    aanvraagSpecificaties?:unknown;

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

    plannedRoundTripKm:number | null;

    plannedReisuren:number | null;

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







// Eén materiaalregel: compact — label + input + chips.
// Leeg tekstvak = n.v.t.
// Standaard: (Geleverd én Klaargezet) óf Op locatie.
// Native OS (Tizen/webOS/Android): Binnengekomen → Geprepareerd → Klaargezet
// (óf Op locatie).
function MateriaalRij({
    label,
    plh,
    aantal,
    geleverd,
    geprepareerd,
    klaargezet,
    opLocatie,
    nativeOsFlow,
    onAantal,
    onGeleverd,
    onGeprepareerd,
    onKlaargezet,
    onOpLocatie,
}:{
    label:string;
    plh:string;
    aantal:string;
    geleverd:boolean;
    geprepareerd?:boolean;
    klaargezet:boolean;
    opLocatie:boolean;
    nativeOsFlow?:boolean;
    onAantal:(v:string)=>void;
    onGeleverd:(v:boolean)=>void;
    onGeprepareerd?:(v:boolean)=>void;
    onKlaargezet:(v:boolean)=>void;
    onOpLocatie:(v:boolean)=>void;
}){

    const ingevuld =
        aantal.trim() !== "";

    const statusOk =
        opLocatie
        || (
            geleverd
            && klaargezet
            && (!nativeOsFlow || Boolean(geprepareerd))
        );

    const nietInOrde =
        ingevuld && !statusOk;

    function Chip({
        active,
        disabled,
        children,
        onToggle,
        warn,
    }:{
        active:boolean;
        disabled:boolean;
        children:ReactNode;
        onToggle:()=>void;
        warn?:boolean;
    }){
        return (
            <button
                type="button"
                disabled={disabled}
                onClick={onToggle}
                className={`
                    rounded px-1.5 py-0.5 text-[10px] font-semibold
                    border transition whitespace-nowrap
                    disabled:opacity-35 disabled:cursor-not-allowed
                    ${
                        active
                        ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                        : warn
                        ? "bg-white text-gray-600 border-red-300"
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                    }
                `}
            >
                {children}
            </button>
        );
    }

    return (
        <div className={`
            flex flex-col gap-1 py-1.5
            border-b border-gray-100 last:border-0
            ${nietInOrde ? "bg-red-50/40 -mx-1 px-1 rounded" : ""}
        `}>

            <div className="flex items-center gap-2 min-w-0">
                <span className="
                    w-[7.5rem] shrink-0 text-xs font-semibold text-gray-800
                ">
                    {label}
                    {
                        !ingevuld
                        ? (
                            <span className="ml-1 font-normal text-gray-400">
                                n.v.t.
                            </span>
                        )
                        : null
                    }
                </span>
                <input
                    type="text"
                    value={aantal}
                    onChange={(e)=>onAantal(e.target.value)}
                    placeholder={plh}
                    className={`
                        min-w-0 flex-1 border rounded px-2 py-1 text-xs bg-white
                        placeholder:text-gray-400
                        ${nietInOrde ? "border-red-300" : "border-gray-200"}
                    `}
                />
            </div>

            <div className="flex flex-wrap items-center gap-1 sm:pl-[7.5rem]">
                <Chip
                    active={geleverd}
                    disabled={!ingevuld || opLocatie}
                    warn={nietInOrde && !geleverd && !opLocatie}
                    onToggle={()=>onGeleverd(!geleverd)}
                >
                    {nativeOsFlow ? "Binnengekomen" : "Geleverd"}
                </Chip>
                {nativeOsFlow && onGeprepareerd ? (
                    <Chip
                        active={Boolean(geprepareerd)}
                        disabled={!ingevuld || opLocatie}
                        warn={
                            nietInOrde
                            && !geprepareerd
                            && !opLocatie
                        }
                        onToggle={()=>
                            onGeprepareerd(!geprepareerd)
                        }
                    >
                        Geprepareerd
                    </Chip>
                ) : null}
                <Chip
                    active={klaargezet}
                    disabled={!ingevuld || opLocatie}
                    warn={nietInOrde && !klaargezet && !opLocatie}
                    onToggle={()=>{
                        const next = !klaargezet;
                        onKlaargezet(next);
                        if(next){
                            onGeleverd(true);
                        }
                    }}
                >
                    Klaargezet
                </Chip>
                <span className="text-[10px] text-gray-400 px-0.5">
                    of
                </span>
                <Chip
                    active={opLocatie}
                    disabled={!ingevuld}
                    warn={nietInOrde && !opLocatie}
                    onToggle={()=>onOpLocatie(!opLocatie)}
                >
                    Op locatie
                </Chip>
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

    const [onHoldNotes,setOnHoldNotes] =
        useState("");

    const [onHoldNotesSaving,setOnHoldNotesSaving] =
        useState(false);


    // Klaargezet materiaal (pakbon + schermen/players/beugels).
    const [materiaal,setMateriaal] =
        useState({
            pakbonUrl:"",
            schermenAantal:"",
            schermenGeleverd:false,
            schermenGeprepareerd:false,
            schermenKlaargezet:false,
            schermenOpLocatie:false,
            playersAantal:"",
            playersGeleverd:false,
            playersKlaargezet:false,
            playersOpLocatie:false,
            beugelsAantal:"",
            beugelsGeleverd:false,
            beugelsKlaargezet:false,
            beugelsOpLocatie:false,
            kioskAantal:"",
            kioskGeleverd:false,
            kioskKlaargezet:false,
            kioskOpLocatie:false,
            versterkersAantal:"",
            versterkersGeleverd:false,
            versterkersKlaargezet:false,
            versterkersOpLocatie:false
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


    const [formError,setFormError] =
        useState("");



    const [saving,setSaving] =
        useState(false);



    const [loading,setLoading] =
        useState(true);


    // Toont het bedankscherm nadat de monteur de werkbon heeft verstuurd.
    const [verstuurd,setVerstuurd] =
        useState(false);








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

            setOnHoldNotes(
                data.onHoldNotes || ""
            );


            // Klaargezet materiaal uit de opgeslagen formData + aanvraag-prefill.
            const leegMateriaal = {
                pakbonUrl:"",
                schermenAantal:"",
                schermenGeleverd:false,
                schermenGeprepareerd:false,
                schermenKlaargezet:false,
                schermenOpLocatie:false,
                playersAantal:"",
                playersGeleverd:false,
                playersKlaargezet:false,
                playersOpLocatie:false,
                beugelsAantal:"",
                beugelsGeleverd:false,
                beugelsKlaargezet:false,
                beugelsOpLocatie:false,
                kioskAantal:"",
                kioskGeleverd:false,
                kioskKlaargezet:false,
                kioskOpLocatie:false,
                versterkersAantal:"",
                versterkersGeleverd:false,
                versterkersKlaargezet:false,
                versterkersOpLocatie:false
            };

            const opgeslagenMateriaal =
                data.formData?.klaarzetMateriaal;

            let startMateriaal = { ...leegMateriaal };

            if(
                opgeslagenMateriaal &&
                typeof opgeslagenMateriaal === "object"
            ){
                startMateriaal = {
                    ...startMateriaal,
                    ...opgeslagenMateriaal
                };
            }

            if(data.aanvraagSpecificaties){
                startMateriaal = mergeKlaarzetPrefill(
                    startMateriaal,
                    klaarzetVanAanvraagSpecificaties(
                        data.aanvraagSpecificaties
                    )
                );
            }

            setMateriaal(startMateriaal);


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
                    "Opdracht opgeslagen"
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
            <p className="text-gray-500">Opdracht laden…</p>
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

        const snFout =
            ontbrekendeMateriaalSerienummers(opleverData);

        if(snFout){
            setFormError(snFout);
            window.scrollTo({ top:0, behavior:"smooth" });
            return;
        }

        const cl = opleverData.checklist;

        const ontbreekt =
            cl.werkendOpgeleverd === null
            || cl.lichtnetSchakelbaar === null
            || cl.wifiVanToepassing === null
            || !cl.remoteServices
            || cl.afvalverwijdering === null;

        if(ontbreekt){
            alert(
                "Vul eerst de volledige checklist in voordat je de opdracht verstuurt."
            );
            return;
        }

    }


    const confirmComplete =
        confirm(
            "Werkbon versturen naar kantoor? Er wordt een PDF gemaakt en een ZIP met de foto's (elk bestand met de naam die je gaf)."
        );


    if(!confirmComplete){

        return;

    }

    setSaving(true);

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
                "Opdracht versturen mislukt"
            );


            return;

        }







        // De PDF is "mooi meegenomen": kantoor heeft de melding al via de
        // complete-stap hierboven. Lukt de PDF niet, dan negeren we dat stil -
        // de monteur krijgt daar geen foutmelding over.
        try {

            await fetch(
                `/api/workorders/${id}/generate-pdf`,
                {
                    method:"POST"
                }
            );

        } catch(pdfError){

            console.error("PDF genereren mislukt (genegeerd):", pdfError);

        }



        setStatus(

            "uitgevoerd"

        );


        // Bedankscherm tonen; na 5 seconden automatisch terug naar het
        // monteur-dashboard.
        setVerstuurd(true);

        setTimeout(()=>{
            window.location.href = "/engineer";
        }, 5000);





    } catch(error){


        console.error(error);



        alert(

            "Fout bij versturen opdracht"

        );


    } finally {

        setSaving(false);

    }


}




    if(!workorder){


        return (
            <p className="text-gray-500">Opdracht niet gevonden</p>
        );

    }

    const schermAansturing = leesSchermAansturing(
        workorder.aanvraagSpecificaties
    );
    const heeftNativeOsAansturing = schermAansturing.heeftNativeOs;









    if(verstuurd){

        return (
            <div className="flex min-h-[50vh] items-center justify-center py-8">
                <div className="text-center max-w-md px-2">

                    <div className="text-6xl mb-4">✓</div>

                    <h1 className="text-2xl font-bold text-gray-800 mb-2">
                        Bedankt voor het invullen van je opdracht!
                    </h1>

                    <p className="text-gray-600">
                        De opdracht is verstuurd en kantoor heeft een melding gekregen.
                        Je gaat zo automatisch terug naar je dashboard.
                    </p>

                </div>
            </div>
        );

    }


    return (
        <div className="space-y-5 -m-2 sm:-m-0">

            {
                formError && (
                    <p className="
                        bg-red-100
                        border
                        border-red-300
                        text-red-700
                        rounded-xl
                        p-3
                    ">
                        {formError}
                    </p>
                )
            }


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
                    <div className="
                        flex flex-wrap gap-2
                        rounded-xl border border-gray-200
                        bg-white p-3
                    ">
                        <a
                            href={`/api/workorders/${id}/pdf`}
                            className="
                                border border-gray-200 rounded-lg
                                px-3 py-1.5 text-sm font-medium
                                text-gray-700 hover:bg-gray-50
                            "
                        >
                            PDF downloaden
                        </a>
                        <a
                            href={`/api/workorders/${id}/photos/zip`}
                            className="
                                border border-gray-200 rounded-lg
                                px-3 py-1.5 text-sm font-medium
                                text-gray-700 hover:bg-gray-50
                            "
                        >
                            ZIP foto&apos;s
                        </a>
                        {(status || workorder.status) === "uitgevoerd" && (
                            <span className="
                                text-xs text-emerald-700
                                self-center ml-1
                            ">
                                Status: Uitgevoerd — monteur heeft afgerond
                            </span>
                        )}
                    </div>
                )
            }


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

                                // Alleen echt verstuurd (sentAt) of lineaire
                                // status vanaf "afspraak" — On Hold telt niet mee.
                                const flowAlVerstuurd = [
                                    "afspraak",
                                    "ingepland",
                                    "uitgevoerd",
                                    "gefactureerd",
                                ].includes(huidig);
                                const alVerstuurd =
                                    !!workorder.sentAt || flowAlVerstuurd;

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
                                                huidig === "on_hold"
                                                ?
                                                "Opdracht staat On Hold. Je kunt de afspraak versturen of eerst hervatten naar \"Opdracht ontvangen\"."
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


            {
                isOffice
                && (status || workorder.status) === "on_hold"
                && (
                    <section className="
                        rounded-2xl
                        border-2 border-amber-400
                        bg-amber-50
                        px-4 py-3
                        space-y-3
                    ">
                        <div className="space-y-1">
                            <p className="text-sm font-bold text-amber-950 inline-flex items-center gap-2">
                                <span className="
                                    inline-flex items-center rounded-full
                                    bg-amber-500 text-white text-xs font-semibold
                                    px-2.5 py-0.5
                                ">
                                    On Hold
                                </span>
                                Deze opdracht staat on hold
                            </p>
                            <p className="text-xs text-amber-900/90">
                                Controleer hieronder de specificatie uit de aanvraag
                                en de opmerkingen voordat je hervat.
                            </p>
                        </div>

                        <label className="block space-y-1.5">
                            <span className="text-xs font-semibold text-amber-950">
                                Opmerkingen
                            </span>
                            <textarea
                                value={onHoldNotes}
                                onChange={(e) => setOnHoldNotes(e.target.value)}
                                onBlur={async () => {
                                    const next = onHoldNotes.trim();
                                    const prev =
                                        (workorder.onHoldNotes || "").trim();
                                    if (next === prev) return;
                                    setOnHoldNotesSaving(true);
                                    try {
                                        const res = await fetch(
                                            `/api/workorders/${id}`,
                                            {
                                                method: "PATCH",
                                                headers: {
                                                    "Content-Type":
                                                        "application/json",
                                                },
                                                body: JSON.stringify({
                                                    onHoldNotes: next || null,
                                                }),
                                            }
                                        );
                                        if (res.ok) {
                                            setWorkorder((wo) =>
                                                wo
                                                    ? {
                                                          ...wo,
                                                          onHoldNotes:
                                                              next || null,
                                                      }
                                                    : wo
                                            );
                                        }
                                    } finally {
                                        setOnHoldNotesSaving(false);
                                    }
                                }}
                                rows={3}
                                placeholder="Waarom on hold? Wat moet er nog gebeuren?"
                                className="
                                    w-full rounded-xl border border-amber-300
                                    bg-white px-3 py-2 text-sm text-slate-900
                                    placeholder:text-slate-400
                                    focus:outline-none focus:ring-2 focus:ring-amber-400/50
                                "
                            />
                            {onHoldNotesSaving ? (
                                <span className="text-[11px] text-amber-800">
                                    Opslaan…
                                </span>
                            ) : null}
                        </label>
                    </section>
                )
            }

            {
                isOffice
                && !!workorder.aanvraagSpecificaties
                && (
                    <section className="
                        bg-white
                        rounded-2xl
                        border
                        p-5
                        space-y-2
                    ">
                        <h2 className="font-semibold text-gray-800 border-b pb-1">
                            Specificatie uit aanvraag
                        </h2>
                        <AanvraagSpecificatiesOverzicht
                            snapshot={parseAanvraagSnapshot(
                                workorder.aanvraagSpecificaties
                            )}
                            locatie={{
                                locatie: workorder.title,
                                opdrachtgever:
                                    workorder.customer?.name
                                    ?? workorder.project?.customer.name
                                    ?? null,
                                straat: workorder.location,
                                plaats: workorder.city,
                                contactPersoon: workorder.contactPersoon,
                                contactEmail: workorder.contactEmail,
                                contactPhone: workorder.contactPhone,
                            }}
                        />
                    </section>
                )
            }









            {
                !(
                    isOffice
                    && !!workorder.aanvraagSpecificaties
                ) && (
            <section className="
                bg-white
                rounded-2xl
                border
                p-5
                space-y-3
            ">

                <h2 className="font-semibold text-gray-800 border-b pb-1">
                    Locatie & contact
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">

                    <div className="min-w-0">
                        <p className="text-xs text-gray-500">
                            Opdrachtgever
                        </p>
                        <p className="text-sm text-gray-900 break-words">
                            {
                                workorder.customer?.name
                                ??
                                workorder.project?.customer.name
                                ??
                                "—"
                            }
                        </p>
                    </div>

                    {
                        workorder.title
                        ? (
                            <div className="min-w-0">
                                <p className="text-xs text-gray-500">
                                    Locatie / filiaalnaam
                                </p>
                                <p className="text-sm text-gray-900 break-words">
                                    {workorder.title}
                                </p>
                            </div>
                        )
                        : null
                    }

                    {
                        workorder.contactPersoon
                        ? (
                            <div className="min-w-0">
                                <p className="text-xs text-gray-500">
                                    Contactpersoon
                                </p>
                                <p className="text-sm text-gray-900 break-words">
                                    {workorder.contactPersoon}
                                </p>
                            </div>
                        )
                        : null
                    }

                    {
                        workorder.contactPhone
                        ? (
                            <div className="min-w-0">
                                <p className="text-xs text-gray-500">
                                    Telefoonnummer
                                </p>
                                <a
                                    href={`tel:${workorder.contactPhone}`}
                                    className="text-sm text-sky-700 hover:underline break-words"
                                >
                                    {workorder.contactPhone}
                                </a>
                            </div>
                        )
                        : null
                    }

                    {
                        workorder.contactEmail
                        ? (
                            <div className="min-w-0">
                                <p className="text-xs text-gray-500">
                                    E-mailadres
                                </p>
                                <a
                                    href={`mailto:${workorder.contactEmail}`}
                                    className="text-sm text-sky-700 hover:underline break-words"
                                >
                                    {workorder.contactEmail}
                                </a>
                            </div>
                        )
                        : null
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
                                    <div className="min-w-0 sm:col-span-2">
                                        <p className="text-xs text-gray-500">
                                            Adres
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            Geen locatie
                                        </p>
                                    </div>
                                );
                            }

                            const mapsUrl =
                                `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(volledig)}`;

                            return (
                                <div className="min-w-0 sm:col-span-2">
                                    <p className="text-xs text-gray-500">
                                        Adres
                                    </p>
                                    <a
                                        href={mapsUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="
                                            text-sm text-sky-700 hover:underline
                                            inline-flex items-center gap-1 break-words
                                        "
                                    >
                                        {volledig}
                                        <span className="text-xs shrink-0">
                                            ↗
                                        </span>
                                    </a>
                                </div>
                            );

                        })()
                    }

                </div>

            </section>
                )
            }









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
                isOffice && workorder.documents?.length > 0 && (

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
                p-4
                space-y-2.5
            ">

                <h2 className="font-semibold text-sm text-gray-800 border-b pb-1">
                    Werkzaamheden
                </h2>

                <div className="
                    grid
                    grid-cols-1
                    md:grid-cols-2
                    gap-3
                ">

                    <div className="
                        rounded-xl border border-gray-200
                        bg-white p-2.5 space-y-1.5
                    ">
                        <textarea
                            value={notes}
                            onChange={(e)=>
                                setNotes(
                                    e.target.value
                                )
                            }
                            className="
                                w-full
                                border border-gray-200
                                rounded-lg
                                p-2
                                min-h-28
                                text-sm text-gray-900
                                placeholder:text-gray-400
                            "
                            placeholder="Beschrijf werkzaamheden"
                        />
                    </div>

                    {isOffice && (
                    <div className="
                        rounded-xl border border-gray-200
                        bg-white p-2.5 space-y-1.5
                    ">

                        <div className="flex items-center justify-between gap-2">
                            <p className="text-xs text-gray-500">
                                Materiaal
                            </p>

                            <label className={`
                                shrink-0 rounded border px-2 py-1
                                text-[11px] font-semibold cursor-pointer
                                ${
                                    pakbonUploaden
                                    ? "border-gray-200 text-gray-400 bg-white"
                                    : "border-sky-200 text-sky-700 bg-white hover:bg-sky-50"
                                }
                            `}>

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
                                        inline-flex items-center
                                        text-xs font-medium
                                        text-sky-700 hover:underline
                                    "
                                >
                                    Geüploade pakbon bekijken
                                </a>
                            )
                        }

                        {heeftNativeOsAansturing ? (
                            <p className="
                                text-[11px] leading-snug
                                text-amber-900 bg-amber-50
                                border border-amber-200 rounded-lg px-2 py-1.5
                            ">
                                Schermen met Tizen / webOS / Android: vink
                                binnengekomen → geprepareerd → klaargezet
                                (of op locatie).
                            </p>
                        ) : null}

                        <div className="space-y-0">

                        <MateriaalRij
                            label="Schermen"
                            plh={"bijv. 2x 55\" en 1x 32\""}
                            aantal={materiaal.schermenAantal}
                            geleverd={materiaal.schermenGeleverd}
                            geprepareerd={materiaal.schermenGeprepareerd}
                            klaargezet={materiaal.schermenKlaargezet}
                            opLocatie={materiaal.schermenOpLocatie}
                            nativeOsFlow={heeftNativeOsAansturing}
                            onAantal={(v)=>setMateriaal(m=>({...m,schermenAantal:v}))}
                            onGeleverd={(v)=>setMateriaal(m=>({...m,schermenGeleverd:v}))}
                            onGeprepareerd={(v)=>setMateriaal(m=>({...m,schermenGeprepareerd:v}))}
                            onKlaargezet={(v)=>setMateriaal(m=>({...m,schermenKlaargezet:v}))}
                            onOpLocatie={(v)=>setMateriaal(m=>({...m,schermenOpLocatie:v}))}
                        />

                        <MateriaalRij
                            label="Players"
                            plh="aantal"
                            aantal={materiaal.playersAantal}
                            geleverd={materiaal.playersGeleverd}
                            klaargezet={materiaal.playersKlaargezet}
                            opLocatie={materiaal.playersOpLocatie}
                            onAantal={(v)=>setMateriaal(m=>({...m,playersAantal:v}))}
                            onGeleverd={(v)=>setMateriaal(m=>({...m,playersGeleverd:v}))}
                            onKlaargezet={(v)=>setMateriaal(m=>({...m,playersKlaargezet:v}))}
                            onOpLocatie={(v)=>setMateriaal(m=>({...m,playersOpLocatie:v}))}
                        />

                        <MateriaalRij
                            label="Beugels"
                            plh="bijv. muurbeugels"
                            aantal={materiaal.beugelsAantal}
                            geleverd={materiaal.beugelsGeleverd}
                            klaargezet={materiaal.beugelsKlaargezet}
                            opLocatie={materiaal.beugelsOpLocatie}
                            onAantal={(v)=>setMateriaal(m=>({...m,beugelsAantal:v}))}
                            onGeleverd={(v)=>setMateriaal(m=>({...m,beugelsGeleverd:v}))}
                            onKlaargezet={(v)=>setMateriaal(m=>({...m,beugelsKlaargezet:v}))}
                            onOpLocatie={(v)=>setMateriaal(m=>({...m,beugelsOpLocatie:v}))}
                        />

                        <MateriaalRij
                            label="Kiosk"
                            plh="bijv. 1x kiosk"
                            aantal={materiaal.kioskAantal}
                            geleverd={materiaal.kioskGeleverd}
                            klaargezet={materiaal.kioskKlaargezet}
                            opLocatie={materiaal.kioskOpLocatie}
                            onAantal={(v)=>setMateriaal(m=>({...m,kioskAantal:v}))}
                            onGeleverd={(v)=>setMateriaal(m=>({...m,kioskGeleverd:v}))}
                            onKlaargezet={(v)=>setMateriaal(m=>({...m,kioskKlaargezet:v}))}
                            onOpLocatie={(v)=>setMateriaal(m=>({...m,kioskOpLocatie:v}))}
                        />

                        <MateriaalRij
                            label="Versterker/speakers"
                            plh="bijv. versterker + 4 speakers"
                            aantal={materiaal.versterkersAantal}
                            geleverd={materiaal.versterkersGeleverd}
                            klaargezet={materiaal.versterkersKlaargezet}
                            opLocatie={materiaal.versterkersOpLocatie}
                            onAantal={(v)=>setMateriaal(m=>({...m,versterkersAantal:v}))}
                            onGeleverd={(v)=>setMateriaal(m=>({...m,versterkersGeleverd:v}))}
                            onKlaargezet={(v)=>setMateriaal(m=>({...m,versterkersKlaargezet:v}))}
                            onOpLocatie={(v)=>setMateriaal(m=>({...m,versterkersOpLocatie:v}))}
                        />

                        </div>

                    </div>
                    )}

                </div>

           </section>


{
    !isOffice && (
        <OpleverForm

            workorderId={id}

            initial={workorder.formData}

            aanvraagSpecificaties={workorder.aanvraagSpecificaties}

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

            error={formError}

            onChange={(next)=>{
                setFormError("");
                setOpleverData(next);
            }}

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

            plannedRoundTripKm={
                workorder.plannedRoundTripKm
            }

            plannedReisuren={
                workorder.plannedReisuren
            }

        />
    )
}


            <PhotosForm
                workorderId={id}
                readOnly={!!workorder.sentAt}
            />

            {
                isOffice && (
                    <CorrespondentieBlok
                        workorderId={id}
                    />
                )
            }


            {
                /* Alleen monteur verstuurt ná inplannen. Kantoor ziet de
                   opdracht via Opdrachten (openen / PDF / ZIP). */
                !isOffice
                && !workorder.sentAt
                && (status || workorder.status) === "ingepland"
                && (

                    <button
                        type="button"
                        onClick={completeWorkorder}
                        disabled={saving}
                        className="
                            w-full
                            bg-[#d6007e] text-white
                            rounded-lg px-4 py-2.5
                            text-sm font-semibold
                            disabled:opacity-50
                        "
                    >
                        {saving ? "Bezig..." : "Verstuur werkbon"}
                    </button>

                )
            }



        </div>
    );
}