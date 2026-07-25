"use client";

import { useEffect, useState } from "react";

import {
    BEUGEL_TYPES,
    ExtraKosten,
    OpleverData,
    SchermBlok,
    emptyExtraKosten,
    emptySchermBlok,
    mergeOpleverData
} from "@/types/oplever";



interface Props {

    workorderId?:string;

    initial:unknown;

    // Naam van monteur 1 (de toegewezen monteur), voor de urenlabels
    monteur1Name?:string | null;

    // Ingebed in een groter formulier: geen eigen opslaanknop,
    // wijzigingen gaan via onChange omhoog naar de parent.
    embedded?:boolean;

    onChange?:(data:OpleverData)=>void;

}



// ---------- kleine bouwstenen ----------

function JaNee({

    value,

    onChange,

    labels = ["Ja","Nee"]

}:{

    value:boolean | null;

    onChange:(value:boolean)=>void;

    labels?:[string,string] | string[];

}){

    return (

        <div className="flex gap-2">

            <button

                type="button"

                onClick={()=>onChange(true)}

                className={`
                    px-4
                    py-1.5
                    rounded-full
                    border
                    text-sm
                    ${
                        value === true
                        ?
                        "bg-green-500 border-green-500 text-white"
                        :
                        "text-gray-400"
                    }
                `}

            >
                {labels[0]}
            </button>

            <button

                type="button"

                onClick={()=>onChange(false)}

                className={`
                    px-4
                    py-1.5
                    rounded-full
                    border
                    text-sm
                    ${
                        value === false
                        ?
                        "bg-sky-400 border-sky-400 text-white"
                        :
                        "text-gray-400"
                    }
                `}

            >
                {labels[1]}
            </button>

        </div>

    );

}



function Keuze({

    value,

    options,

    onChange

}:{

    value:string;

    options:readonly string[];

    onChange:(value:string)=>void;

}){

    return (

        <div className="flex flex-wrap gap-2">

            {
                options.map(option=>(

                    <button

                        key={option}

                        type="button"

                        onClick={()=>onChange(option)}

                        className={`
                            px-4
                            py-1.5
                            rounded-full
                            border
                            text-sm
                            ${
                                value === option
                                ?
                                "bg-green-500 border-green-500 text-white"
                                :
                                "text-gray-400"
                            }
                        `}

                    >
                        {option}
                    </button>

                ))
            }

        </div>

    );

}



function Veld({

    label,

    value,

    onChange,

    small = false

}:{

    label:string;

    value:string;

    onChange:(value:string)=>void;

    small?:boolean;

}){

    return (

        <label className={`block ${small ? "w-36" : ""}`}>

            <span className="text-sm text-gray-600">

                {label}

            </span>

            <input

                value={value}

                onChange={(e)=>onChange(e.target.value)}

                className="
                    w-full
                    border
                    rounded-xl
                    p-2
                    mt-1
                "

            />

        </label>

    );

}



function Vraag({

    label,

    children

}:{

    label:string;

    children:React.ReactNode;

}){

    return (

        <div className="
            border-b
            border-dashed
            pb-3
            mb-3
            space-y-2
        ">

            <p className="text-sm">

                {label}

            </p>

            {children}

        </div>

    );

}



function Kop({

    children

}:{

    children:React.ReactNode;

}){

    return (

        <h3 className="
            bg-gray-100
            font-bold
            text-sm
            rounded-lg
            px-3
            py-2
            mb-4
        ">

            {children}

        </h3>

    );

}



// ---------- extra kosten (Parkeerkosten / Materiaal / Sejour) ----------

function ExtraKostenBlok({

    label,

    value,

    onChange

}:{

    label:string;

    value:ExtraKosten;

    onChange:(value:ExtraKosten)=>void;

}){

    return (

        <div>


            <button

                type="button"

                onClick={()=>
                    onChange(
                        value.actief
                        ?
                        emptyExtraKosten()
                        :
                        { ...value, actief:true }
                    )
                }

                className={`
                    px-4
                    py-1.5
                    rounded-full
                    border
                    text-sm
                    ${
                        value.actief
                        ?
                        "bg-orange-400 border-orange-400 text-white"
                        :
                        "text-gray-400"
                    }
                `}

            >

                {label}

            </button>


            {
                value.actief && (

                    <div className="
                        border
                        rounded-xl
                        p-3
                        mt-2
                        space-y-3
                        bg-gray-50
                    ">


                        <label className="block w-40">

                            <span className="
                                text-sm
                                text-gray-600
                            ">

                                Kosten

                            </span>

                            <div className="
                                flex
                                items-center
                                gap-2
                            ">

                                <span>€</span>

                                <input

                                    inputMode="decimal"

                                    value={value.kosten}

                                    onChange={(e)=>
                                        onChange({
                                            ...value,
                                            kosten:e.target.value
                                        })
                                    }

                                    className="
                                        w-full
                                        border
                                        rounded-xl
                                        p-2
                                        mt-1
                                    "

                                />

                            </div>

                        </label>


                        <div className="space-y-2">

                            <p className="text-sm">

                                Heb je dit voorgeschoten?

                            </p>

                            <JaNee

                                value={value.voorgeschoten}

                                onChange={(v)=>
                                    onChange({
                                        ...value,
                                        voorgeschoten:v
                                    })
                                }

                            />

                        </div>


                        {
                            value.voorgeschoten === true && (

                                <p className="
                                    text-sm
                                    text-orange-600
                                    underline
                                ">

                                    * Vergeet het formulier
                                    &apos;Bon declareren&apos; niet.

                                </p>

                            )
                        }


                    </div>

                )
            }


        </div>

    );

}



// ---------- schermblok (herhaalbaar per formaat) ----------

function SchermBlokken({

    blokken,

    onChange

}:{

    blokken:SchermBlok[];

    onChange:(blokken:SchermBlok[])=>void;

}){


    function update(
        index:number,
        patch:Partial<SchermBlok>
    ){

        onChange(
            blokken.map(
                (blok,i)=>
                    i === index
                    ?
                    { ...blok, ...patch }
                    :
                    blok
            )
        );

    }




    return (

        <div className="space-y-4">


            {
                blokken.map((blok,index)=>(


                    <div

                        key={index}

                        className="
                            border
                            rounded-xl
                            p-4
                            bg-gray-50
                            space-y-3
                        "

                    >


                        <div className="
                            flex
                            justify-between
                            items-center
                        ">

                            <p className="
                                font-bold
                                text-sm
                            ">

                                Formaat {index + 1}

                            </p>

                            <button

                                type="button"

                                onClick={()=>
                                    onChange(
                                        blokken.filter(
                                            (_,i)=>i !== index
                                        )
                                    )
                                }

                                className="
                                    text-sm
                                    text-red-500
                                    underline
                                "

                            >

                                Verwijderen

                            </button>

                        </div>


                        <div className="
                            flex
                            flex-wrap
                            gap-3
                        ">

                            <Veld

                                small

                                label={'Welk formaat scherm? (bijv. 55")'}

                                value={blok.formaat}

                                onChange={(v)=>
                                    update(index,{ formaat:v })
                                }

                            />

                            <Veld

                                small

                                label="Hoeveel schermen van dit formaat?"

                                value={blok.aantal}

                                onChange={(v)=>
                                    update(index,{ aantal:v })
                                }

                            />

                            <Veld

                                small

                                label="Aantal schermen ingesteld"

                                value={blok.aantalIngesteld}

                                onChange={(v)=>
                                    update(index,{ aantalIngesteld:v })
                                }

                            />

                        </div>


                        <div className="space-y-2">

                            <p className="text-sm">

                                Heb je tilhulp gehad?

                            </p>

                            <JaNee

                                value={blok.tilhulp}

                                onChange={(v)=>
                                    update(index,{ tilhulp:v })
                                }

                            />

                        </div>


                        <div className="space-y-2">

                            <p className="text-sm">

                                Oriëntatie:

                            </p>

                            <Keuze

                                value={blok.orientatie}

                                options={["Landscape","Portrait"]}

                                onChange={(v)=>
                                    update(index,{
                                        orientatie:
                                            v as SchermBlok["orientatie"]
                                    })
                                }

                            />

                        </div>


                        <div className="space-y-2">

                            <p className="text-sm">

                                Type beugel:

                            </p>

                            <Keuze

                                value={blok.typeBeugel}

                                options={BEUGEL_TYPES}

                                onChange={(v)=>
                                    update(index,{ typeBeugel:v })
                                }

                            />

                        </div>


                        <Veld

                            label="Bekabeling t.b.v. de schermen"

                            value={blok.bekabeling}

                            onChange={(v)=>
                                update(index,{ bekabeling:v })
                            }

                        />


                    </div>


                ))
            }


            <button

                type="button"

                onClick={()=>
                    onChange([
                        ...blokken,
                        emptySchermBlok()
                    ])
                }

                className="
                    text-sm
                    border
                    border-dashed
                    rounded-xl
                    px-4
                    py-2
                    text-gray-600
                    hover:bg-gray-50
                "

            >

                ＋ Voeg nog een formaat toe

            </button>


        </div>

    );

}



// ---------- het formulier ----------

export default function OpleverForm({

    workorderId,

    initial,

    monteur1Name,

    embedded = false,

    onChange

}:Props){


    const [data,setData] =
        useState<OpleverData>(
            mergeOpleverData(initial)
        );


    const [engineers,setEngineers] =
        useState<{
            id:string;
            name:string | null;
        }[]>([]);


    const [saving,setSaving] =
        useState(false);


    const [message,setMessage] =
        useState("");




    useEffect(()=>{


        async function load(){


            const response =
                await fetch("/api/engineers");


            const engineersData =
                await response.json();


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




    function update(
        mutate:(draft:OpleverData)=>void
    ){

        setData(previous=>{

            const next =
                structuredClone(previous);

            mutate(next);

            if(onChange){
                onChange(next);
            }

            return next;

        });

        setMessage("");

    }




    async function save(){


        if(!workorderId){
            return;
        }


        setSaving(true);

        setMessage("");


        try {


            const response =
                await fetch(

                    `/api/workorders/${workorderId}/form`,

                    {

                        method:"PUT",

                        headers:{
                            "Content-Type":"application/json"
                        },

                        body:JSON.stringify({
                            formData:data
                        })

                    }

                );


            setMessage(
                response.ok
                ?
                "Opleverformulier opgeslagen"
                :
                "Opslaan mislukt"
            );


        } finally {

            setSaving(false);

        }


    }




    const t = data.tarief;

    const i = data.installatie;

    const m = data.materialen;

    const c = data.checklist;




    function MonteurUren({

        nummer,

        naam,

        naamVeld,

        urenVeld

    }:{

        nummer:number;

        naam?:string | null;

        naamVeld?:"monteur2" | "monteur3" | "monteur4";

        urenVeld:"urenMonteur1" | "urenMonteur2" | "urenMonteur3" | "urenMonteur4";

    }){

        return (

            <div className="
                border
                rounded-xl
                p-3
                space-y-2
            ">


                <p className="
                    text-sm
                    font-bold
                ">

                    Monteur {nummer}

                </p>


                {
                    naamVeld
                    ?
                    (

                        <select

                            value={t[naamVeld]}

                            onChange={(e)=>
                                update(draft=>{
                                    draft.tarief[naamVeld] =
                                        e.target.value;
                                })
                            }

                            className="
                                w-full
                                border
                                rounded-xl
                                p-2
                                bg-white
                                text-sm
                            "

                        >

                            <option value="">

                                — Geen —

                            </option>

                            {
                                engineers.map(engineer=>(

                                    <option

                                        key={engineer.id}

                                        value={engineer.name ?? ""}

                                    >

                                        {engineer.name}

                                    </option>

                                ))
                            }

                        </select>

                    )
                    :
                    (

                        <p className="text-sm">

                            {naam ?? "—"}

                        </p>

                    )
                }


                <label className="block">

                    <span className="
                        text-xs
                        text-gray-500
                    ">

                        Uren (regiebasis)

                    </span>

                    <input

                        inputMode="decimal"

                        value={t[urenVeld]}

                        onChange={(e)=>
                            update(draft=>{
                                draft.tarief[urenVeld] =
                                    e.target.value;
                            })
                        }

                        className="
                            w-full
                            border
                            rounded-xl
                            p-2
                            mt-1
                        "

                    />

                </label>


            </div>

        );

    }




    return (

        <section className="
            bg-white
            rounded-2xl
            border
            p-5
            space-y-6
        ">


            <h2 className="font-bold">

                📋 Opleverformulier

            </h2>




            {/* ================= Installatiegegevens ================= */}

            <div>

                <Kop>Installatiegegevens</Kop>


                <p className="font-bold text-sm mb-2">

                    1. Tarief &amp; Uren

                </p>


                <div className="
                    flex
                    flex-wrap
                    items-end
                    gap-4
                    border-b
                    border-dashed
                    pb-3
                    mb-3
                ">

                    <div className="space-y-2">

                        <p className="text-sm">

                            Voorrijtarief?

                        </p>

                        <JaNee

                            value={t.voorrijtarief}

                            onChange={(v)=>
                                update(draft=>{
                                    draft.tarief.voorrijtarief = v;
                                })
                            }

                        />

                    </div>

                    <p className="
                        text-sm
                        font-bold
                        underline
                        pb-2
                    ">

                        of

                    </p>

                    <Veld

                        small

                        label="Aantal gereden kilometers?"

                        value={t.kilometers}

                        onChange={(v)=>
                            update(draft=>{
                                draft.tarief.kilometers = v;
                            })
                        }

                    />

                    <Veld

                        small

                        label="Reisuren:"

                        value={t.reisuren}

                        onChange={(v)=>
                            update(draft=>{
                                draft.tarief.reisuren = v;
                            })
                        }

                    />

                </div>


                <div className="
                    grid
                    grid-cols-1
                    md:grid-cols-2
                    gap-3
                    border-b
                    border-dashed
                    pb-3
                    mb-3
                ">

                    <MonteurUren

                        nummer={1}

                        naam={monteur1Name}

                        urenVeld="urenMonteur1"

                    />

                    <MonteurUren

                        nummer={2}

                        naamVeld="monteur2"

                        urenVeld="urenMonteur2"

                    />

                    <MonteurUren

                        nummer={3}

                        naamVeld="monteur3"

                        urenVeld="urenMonteur3"

                    />

                    <MonteurUren

                        nummer={4}

                        naamVeld="monteur4"

                        urenVeld="urenMonteur4"

                    />

                </div>


                <div className="
                    border-b
                    border-dashed
                    pb-3
                    mb-3
                    space-y-2
                ">

                    <p className="text-sm">

                        Heb je extra kosten gemaakt?

                    </p>

                    <div className="
                        flex
                        flex-wrap
                        gap-3
                    ">

                        <ExtraKostenBlok

                            label="Parkeerkosten"

                            value={t.parkeerkosten}

                            onChange={(v)=>
                                update(draft=>{
                                    draft.tarief.parkeerkosten = v;
                                })
                            }

                        />

                        <ExtraKostenBlok

                            label="Materiaal"

                            value={t.materiaalkosten}

                            onChange={(v)=>
                                update(draft=>{
                                    draft.tarief.materiaalkosten = v;
                                })
                            }

                        />

                        <ExtraKostenBlok

                            label="Sejour"

                            value={t.sejour}

                            onChange={(v)=>
                                update(draft=>{
                                    draft.tarief.sejour = v;
                                })
                            }

                        />

                    </div>

                </div>


                <p className="font-bold text-sm mb-2">

                    2. Installatie werkzaamheden

                </p>


                <Vraag label="Heb je nieuwe schermen geïnstalleerd?">

                    <JaNee

                        value={i.nieuweSchermen}

                        onChange={(v)=>
                            update(draft=>{

                                draft.installatie.nieuweSchermen = v;

                                if(
                                    v &&
                                    draft.installatie.nieuweFormaten.length === 0
                                ){
                                    draft.installatie.nieuweFormaten = [
                                        emptySchermBlok()
                                    ];
                                }

                            })
                        }

                    />

                    {
                        i.nieuweSchermen === true && (

                            <SchermBlokken

                                blokken={i.nieuweFormaten}

                                onChange={(blokken)=>
                                    update(draft=>{
                                        draft.installatie.nieuweFormaten =
                                            blokken;
                                    })
                                }

                            />

                        )
                    }

                </Vraag>


                <Vraag label="Heb je hergebruikte schermen geïnstalleerd?">

                    <JaNee

                        value={i.hergebruikteSchermen}

                        onChange={(v)=>
                            update(draft=>{

                                draft.installatie.hergebruikteSchermen = v;

                                if(
                                    v &&
                                    draft.installatie.hergebruikteFormaten.length === 0
                                ){
                                    draft.installatie.hergebruikteFormaten = [
                                        emptySchermBlok()
                                    ];
                                }

                            })
                        }

                    />

                    {
                        i.hergebruikteSchermen === true && (

                            <SchermBlokken

                                blokken={i.hergebruikteFormaten}

                                onChange={(blokken)=>
                                    update(draft=>{
                                        draft.installatie.hergebruikteFormaten =
                                            blokken;
                                    })
                                }

                            />

                        )
                    }

                </Vraag>


                <Vraag label="3. Videowall — heb je een videowall geïnstalleerd?">

                    <JaNee

                        value={i.videowall}

                        onChange={(v)=>
                            update(draft=>{
                                draft.installatie.videowall = v;
                            })
                        }

                    />

                    {
                        i.videowall === true && (

                            <div className="
                                flex
                                flex-wrap
                                gap-3
                            ">

                                <Veld

                                    small

                                    label="Configuratie (bijv. 2x2)"

                                    value={i.videowallConfiguratie}

                                    onChange={(v)=>
                                        update(draft=>{
                                            draft.installatie.videowallConfiguratie = v;
                                        })
                                    }

                                />

                                <Veld

                                    small

                                    label="Formaat schermen"

                                    value={i.videowallFormaat}

                                    onChange={(v)=>
                                        update(draft=>{
                                            draft.installatie.videowallFormaat = v;
                                        })
                                    }

                                />

                                <Veld

                                    small

                                    label="Aantal schermen"

                                    value={i.videowallAantal}

                                    onChange={(v)=>
                                        update(draft=>{
                                            draft.installatie.videowallAantal = v;
                                        })
                                    }

                                />

                            </div>

                        )
                    }

                </Vraag>


                <Vraag label="4. Kiosk — heb je een kiosk geïnstalleerd?">

                    <JaNee

                        value={i.kiosk}

                        onChange={(v)=>
                            update(draft=>{
                                draft.installatie.kiosk = v;
                            })
                        }

                    />

                    {
                        i.kiosk === true && (

                            <div className="
                                flex
                                flex-wrap
                                gap-3
                            ">

                                <Veld

                                    label="Omschrijving"

                                    value={i.kioskOmschrijving}

                                    onChange={(v)=>
                                        update(draft=>{
                                            draft.installatie.kioskOmschrijving = v;
                                        })
                                    }

                                />

                                <Veld

                                    small

                                    label="Aantal"

                                    value={i.kioskAantal}

                                    onChange={(v)=>
                                        update(draft=>{
                                            draft.installatie.kioskAantal = v;
                                        })
                                    }

                                />

                            </div>

                        )
                    }

                </Vraag>


                <Vraag label="5. Mediaplayers — heb je mediaplayers;">

                    <Keuze

                        value={i.mediaplayers}

                        options={["Geïnstalleerd","Gedemonteerd"]}

                        onChange={(v)=>
                            update(draft=>{
                                draft.installatie.mediaplayers =
                                    v as OpleverData["installatie"]["mediaplayers"];
                            })
                        }

                    />

                    {
                        i.mediaplayers && (

                            <Veld

                                small

                                label="Aantal:"

                                value={i.aantalMediaplayers}

                                onChange={(v)=>
                                    update(draft=>{
                                        draft.installatie.aantalMediaplayers = v;
                                    })
                                }

                            />

                        )
                    }

                </Vraag>


                <Vraag label="6. Audio — heb je audio geïnstalleerd?">

                    <JaNee

                        value={i.audio}

                        onChange={(v)=>
                            update(draft=>{
                                draft.installatie.audio = v;
                            })
                        }

                    />

                    {
                        i.audio === true && (

                            <div className="
                                flex
                                flex-wrap
                                gap-3
                            ">

                                <Veld

                                    label="Omschrijving"

                                    value={i.audioOmschrijving}

                                    onChange={(v)=>
                                        update(draft=>{
                                            draft.installatie.audioOmschrijving = v;
                                        })
                                    }

                                />

                                <Veld

                                    small

                                    label="Aantal"

                                    value={i.audioAantal}

                                    onChange={(v)=>
                                        update(draft=>{
                                            draft.installatie.audioAantal = v;
                                        })
                                    }

                                />

                            </div>

                        )
                    }

                </Vraag>


                <Vraag label="7. Project (offerte basis) — is het een project?">

                    <JaNee

                        value={i.isProject}

                        onChange={(v)=>
                            update(draft=>{
                                draft.installatie.isProject = v;
                            })
                        }

                    />

                </Vraag>


                <Vraag label="Opmerkingen:">

                    <textarea

                        value={i.opmerkingen}

                        onChange={(e)=>
                            update(draft=>{
                                draft.installatie.opmerkingen =
                                    e.target.value;
                            })
                        }

                        className="w-full border rounded-xl p-2 min-h-20"

                    />

                </Vraag>

            </div>




            {/* ================= Gebruikte materialen ================= */}

            <div>

                <Kop>Gebruikte materialen</Kop>


                <Vraag label="1. Heb je nieuwe TV beugels gemonteerd?">

                    <JaNee

                        value={m.nieuweBeugels}

                        onChange={(v)=>
                            update(draft=>{
                                draft.materialen.nieuweBeugels = v;
                            })
                        }

                    />

                </Vraag>


                <Vraag label="Heb je bestaande TV beugels gemonteerd?">

                    <JaNee

                        value={m.bestaandeBeugels}

                        onChange={(v)=>
                            update(draft=>{
                                draft.materialen.bestaandeBeugels = v;
                            })
                        }

                    />

                </Vraag>


                {
                    (
                        m.nieuweBeugels === true ||
                        m.bestaandeBeugels === true
                    ) && (

                        <div className="
                            flex
                            flex-wrap
                            gap-3
                            border-b
                            border-dashed
                            pb-3
                            mb-3
                        ">

                            <Veld small label="Muurbeugel" value={m.muurbeugel} onChange={(v)=>update(d=>{d.materialen.muurbeugel=v;})} />

                            <Veld small label="Zwenkbeugel" value={m.zwenkbeugel} onChange={(v)=>update(d=>{d.materialen.zwenkbeugel=v;})} />

                            <Veld small label="Plafondbeugel 150cm" value={m.plafond150} onChange={(v)=>update(d=>{d.materialen.plafond150=v;})} />

                            <Veld small label="Plafondbeugel 300cm" value={m.plafond300} onChange={(v)=>update(d=>{d.materialen.plafond300=v;})} />

                            <Veld small label="Vloerstandaard" value={m.vloerstandaard} onChange={(v)=>update(d=>{d.materialen.vloerstandaard=v;})} />

                            <Veld small label="Overig" value={m.overigBeugel} onChange={(v)=>update(d=>{d.materialen.overigBeugel=v;})} />

                        </div>

                    )
                }


                <Vraag label="2. Heb je extra HDMI kabels gebruikt?">

                    <JaNee

                        value={m.extraHdmiKabels}

                        onChange={(v)=>
                            update(draft=>{
                                draft.materialen.extraHdmiKabels = v;
                            })
                        }

                    />

                </Vraag>


                <Vraag label="Heb je extra HDMI splitters gebruikt?">

                    <JaNee

                        value={m.extraHdmiSplitters}

                        onChange={(v)=>
                            update(draft=>{
                                draft.materialen.extraHdmiSplitters = v;
                            })
                        }

                    />

                </Vraag>


                <Vraag label="3. Heb je extra patchkabels gebruikt?">

                    <JaNee

                        value={m.extraPatchkabels}

                        onChange={(v)=>
                            update(draft=>{
                                draft.materialen.extraPatchkabels = v;
                            })
                        }

                    />

                    {
                        m.extraPatchkabels === true && (

                            <div className="
                                flex
                                flex-wrap
                                gap-3
                            ">

                                <Veld small label="Patch kabel, 1 meter" value={m.patch1} onChange={(v)=>update(d=>{d.materialen.patch1=v;})} />

                                <Veld small label="Patch kabel, 2 meter" value={m.patch2} onChange={(v)=>update(d=>{d.materialen.patch2=v;})} />

                                <Veld small label="Patch kabel, 3 meter" value={m.patch3} onChange={(v)=>update(d=>{d.materialen.patch3=v;})} />

                                <Veld small label="Patch kabel, 5 meter" value={m.patch5} onChange={(v)=>update(d=>{d.materialen.patch5=v;})} />

                                <Veld small label="Patch kabel, 7,5 meter" value={m.patch75} onChange={(v)=>update(d=>{d.materialen.patch75=v;})} />

                                <Veld small label="Patch kabel, 10 meter" value={m.patch10} onChange={(v)=>update(d=>{d.materialen.patch10=v;})} />

                            </div>

                        )
                    }

                </Vraag>


                <Vraag label="Heb je extra switches gebruikt?">

                    <JaNee

                        value={m.extraSwitches}

                        onChange={(v)=>
                            update(draft=>{
                                draft.materialen.extraSwitches = v;
                            })
                        }

                    />

                </Vraag>


                <Vraag label="4. Heb je extra UTP kabel getrokken?">

                    <JaNee

                        value={m.utpGetrokken}

                        onChange={(v)=>
                            update(draft=>{
                                draft.materialen.utpGetrokken = v;
                            })
                        }

                    />

                </Vraag>


                <Vraag label="5. Heb je extra stroomkabel getrokken?">

                    <JaNee

                        value={m.stroomkabelGetrokken}

                        onChange={(v)=>
                            update(draft=>{
                                draft.materialen.stroomkabelGetrokken = v;
                            })
                        }

                    />

                </Vraag>


                <Vraag label="6. Heb je verlengsnoeren (stekkerdozen) gebruikt?">

                    <JaNee

                        value={m.verlengsnoeren}

                        onChange={(v)=>
                            update(draft=>{
                                draft.materialen.verlengsnoeren = v;
                            })
                        }

                    />

                    {
                        m.verlengsnoeren === true && (

                            <div className="
                                flex
                                flex-wrap
                                gap-3
                            ">

                                <Veld small label="3-voudig, 1,5 meter" value={m.verleng15} onChange={(v)=>update(d=>{d.materialen.verleng15=v;})} />

                                <Veld small label="3-voudig, 3 meter" value={m.verleng3} onChange={(v)=>update(d=>{d.materialen.verleng3=v;})} />

                                <Veld small label="3-voudig, 5 meter" value={m.verleng5} onChange={(v)=>update(d=>{d.materialen.verleng5=v;})} />

                            </div>

                        )
                    }

                </Vraag>


                <Vraag label="7. Besturing & Audio — heb je extra seriële en/of USB speakers gebruikt?">

                    <JaNee

                        value={m.extraSpeakers}

                        onChange={(v)=>
                            update(draft=>{
                                draft.materialen.extraSpeakers = v;
                            })
                        }

                    />

                </Vraag>


                <Vraag label="Opmerkingen:">

                    <textarea

                        value={m.opmerkingen}

                        onChange={(e)=>
                            update(draft=>{
                                draft.materialen.opmerkingen =
                                    e.target.value;
                            })
                        }

                        className="w-full border rounded-xl p-2 min-h-20"

                    />

                </Vraag>

            </div>




            {/* ================= Checklist ================= */}

            <div>

                <Kop>Checklist</Kop>


                <Vraag label="1. Is de installatie werkend opgeleverd?">

                    <JaNee

                        value={c.werkendOpgeleverd}

                        onChange={(v)=>
                            update(draft=>{
                                draft.checklist.werkendOpgeleverd = v;
                            })
                        }

                    />

                </Vraag>


                <Vraag label="2. Is de hardware aangesloten op het lichtnet of een ander schakelstroompunt dat handmatig uit te zetten is?">

                    <JaNee

                        value={c.lichtnetSchakelbaar}

                        onChange={(v)=>
                            update(draft=>{
                                draft.checklist.lichtnetSchakelbaar = v;
                            })
                        }

                    />

                </Vraag>


                <Vraag label="3. WiFi verbinding van toepassing?">

                    <JaNee

                        value={c.wifiVanToepassing}

                        onChange={(v)=>
                            update(draft=>{
                                draft.checklist.wifiVanToepassing = v;
                            })
                        }

                    />

                    {
                        c.wifiVanToepassing === true && (

                            <div className="space-y-2">

                                <p className="text-sm">

                                    Is de WiFi verbinding op moment van
                                    installatie sterk genoeg?

                                </p>

                                <Keuze

                                    value={c.wifiSterkte}

                                    options={["Ja","Matig","Slecht"]}

                                    onChange={(v)=>
                                        update(draft=>{
                                            draft.checklist.wifiSterkte =
                                                v as OpleverData["checklist"]["wifiSterkte"];
                                        })
                                    }

                                />

                            </div>

                        )
                    }

                </Vraag>


                <Vraag label="4. Zijn de schermen gekoppeld aan Remote Services?">

                    <Keuze

                        value={c.remoteServices}

                        options={["Ja","Nee","n.v.t."]}

                        onChange={(v)=>
                            update(draft=>{
                                draft.checklist.remoteServices =
                                    v as OpleverData["checklist"]["remoteServices"];
                            })
                        }

                    />

                </Vraag>


                <Vraag label="5. Wat is de locatie van de mediaplayer(s)?">

                    <Keuze

                        value={c.locatieMediaplayer}

                        options={[
                            "Achter het scherm",
                            "In de patchkast",
                            "Boven het plafond",
                            "Kiosk",
                            "Anders"
                        ]}

                        onChange={(v)=>
                            update(draft=>{
                                draft.checklist.locatieMediaplayer =
                                    v as OpleverData["checklist"]["locatieMediaplayer"];
                            })
                        }

                    />

                    {
                        c.locatieMediaplayer && (

                            <Veld

                                small

                                label="Aantal:"

                                value={c.aantalMediaplayers}

                                onChange={(v)=>
                                    update(draft=>{
                                        draft.checklist.aantalMediaplayers = v;
                                    })
                                }

                            />

                        )
                    }

                </Vraag>


                <Vraag label="6. Afvalverwijdering?">

                    <JaNee

                        value={c.afvalverwijdering}

                        onChange={(v)=>
                            update(draft=>{
                                draft.checklist.afvalverwijdering = v;
                            })
                        }

                    />

                </Vraag>

            </div>




            {
                !embedded && message && (

                    <p className={
                        message.includes("mislukt")
                        ?
                        "text-red-600"
                        :
                        "text-green-600"
                    }>

                        {message}

                    </p>

                )
            }


            {
                !embedded && (

                    <button

                        onClick={save}

                        disabled={saving}

                        className="
                            bg-black
                            text-white
                            rounded-xl
                            px-5
                            py-3
                            disabled:opacity-50
                        "

                    >

                        {
                            saving
                            ?
                            "Bezig..."
                            :
                            "Opleverformulier opslaan"
                        }

                    </button>

                )
            }


        </section>

    );

}
