"use client";

import { useState } from "react";

import {
    OpleverData,
    mergeOpleverData
} from "@/types/oplever";



interface Props {

    workorderId?:string;

    initial:unknown;

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

    options:string[];

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

        <label className={`block ${small ? "w-32" : ""}`}>

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



// ---------- het formulier ----------

export default function OpleverForm({

    workorderId,

    initial,

    embedded = false,

    onChange

}:Props){


    const [data,setData] =
        useState<OpleverData>(
            mergeOpleverData(initial)
        );


    const [saving,setSaving] =
        useState(false);


    const [message,setMessage] =
        useState("");




    function set<
        S extends keyof OpleverData,
        K extends keyof OpleverData[S]
    >(
        section:S,
        key:K,
        value:OpleverData[S][K]
    ){

        setData(previous=>{

            const next = {

                ...previous,

                [section]:{
                    ...previous[section],
                    [key]:value
                }

            };

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




            {/* ---------- Installatiegegevens ---------- */}

            <div>

                <Kop>Installatiegegevens</Kop>


                <p className="font-bold text-sm mb-2">

                    1. Tarief &amp; Uren

                </p>


                <Vraag label="Voorrijtarief?">

                    <JaNee

                        value={t.voorrijtarief}

                        onChange={v=>set("tarief","voorrijtarief",v)}

                    />

                </Vraag>


                <div className="
                    flex
                    flex-wrap
                    gap-3
                    border-b
                    border-dashed
                    pb-3
                    mb-3
                ">

                    <Veld

                        small

                        label="Kilometers"

                        value={t.kilometers}

                        onChange={v=>set("tarief","kilometers",v)}

                    />

                    <Veld

                        small

                        label="Reisuren"

                        value={t.reisuren}

                        onChange={v=>set("tarief","reisuren",v)}

                    />

                    <Veld

                        small

                        label="Parkeerkosten"

                        value={t.parkeerkosten}

                        onChange={v=>set("tarief","parkeerkosten",v)}

                    />

                    <Veld

                        small

                        label="Materiaal (€)"

                        value={t.materiaalkosten}

                        onChange={v=>set("tarief","materiaalkosten",v)}

                    />

                    <Veld

                        small

                        label="Hotel / sejour"

                        value={t.hotelSejour}

                        onChange={v=>set("tarief","hotelSejour",v)}

                    />

                </div>


                <p className="font-bold text-sm mb-2">

                    2. Installatie werkzaamheden

                </p>


                <Vraag label="Heb je nieuwe schermen geïnstalleerd?">

                    <JaNee

                        value={i.nieuweSchermen}

                        onChange={v=>set("installatie","nieuweSchermen",v)}

                    />

                </Vraag>


                <Vraag label="Heb je hergebruikte schermen geïnstalleerd?">

                    <JaNee

                        value={i.hergebruikteSchermen}

                        onChange={v=>set("installatie","hergebruikteSchermen",v)}

                    />

                </Vraag>


                <div className="
                    flex
                    flex-wrap
                    gap-3
                    border-b
                    border-dashed
                    pb-3
                    mb-3
                ">

                    <Veld

                        small

                        label={'Formaat (bijv. 55")'}

                        value={i.schermFormaat}

                        onChange={v=>set("installatie","schermFormaat",v)}

                    />

                    <Veld

                        small

                        label="Aantal schermen"

                        value={i.aantalSchermen}

                        onChange={v=>set("installatie","aantalSchermen",v)}

                    />

                    <Veld

                        small

                        label="Aantal ingesteld"

                        value={i.aantalIngesteld}

                        onChange={v=>set("installatie","aantalIngesteld",v)}

                    />

                    <Veld

                        label="Type beugel"

                        value={i.typeBeugel}

                        onChange={v=>set("installatie","typeBeugel",v)}

                    />

                </div>


                <Vraag label="Heb je tilhulp gehad?">

                    <JaNee

                        value={i.tilhulp}

                        onChange={v=>set("installatie","tilhulp",v)}

                    />

                </Vraag>


                <Vraag label="Oriëntatie:">

                    <Keuze

                        value={i.orientatie}

                        options={["Landscape","Portrait"]}

                        onChange={v=>set("installatie","orientatie",v as OpleverData["installatie"]["orientatie"])}

                    />

                </Vraag>


                <Vraag label="3. Videowall (opmerking)">

                    <input

                        value={i.videowall}

                        onChange={e=>set("installatie","videowall",e.target.value)}

                        className="w-full border rounded-xl p-2"

                    />

                </Vraag>


                <Vraag label="4. Kiosk (opmerking)">

                    <input

                        value={i.kiosk}

                        onChange={e=>set("installatie","kiosk",e.target.value)}

                        className="w-full border rounded-xl p-2"

                    />

                </Vraag>


                <Vraag label="5. Mediaplayers">

                    <Keuze

                        value={i.mediaplayers}

                        options={["Geïnstalleerd","Gedemonteerd"]}

                        onChange={v=>set("installatie","mediaplayers",v as OpleverData["installatie"]["mediaplayers"])}

                    />

                    <Veld

                        small

                        label="Aantal"

                        value={i.aantalMediaplayers}

                        onChange={v=>set("installatie","aantalMediaplayers",v)}

                    />

                </Vraag>


                <Vraag label="6. Audio (opmerking)">

                    <input

                        value={i.audio}

                        onChange={e=>set("installatie","audio",e.target.value)}

                        className="w-full border rounded-xl p-2"

                    />

                </Vraag>


                <Vraag label="7. Is het een project (offertebasis)?">

                    <JaNee

                        value={i.isProject}

                        onChange={v=>set("installatie","isProject",v)}

                    />

                </Vraag>


                <Vraag label="Opmerkingen:">

                    <textarea

                        value={i.opmerkingen}

                        onChange={e=>set("installatie","opmerkingen",e.target.value)}

                        className="w-full border rounded-xl p-2 min-h-20"

                    />

                </Vraag>

            </div>




            {/* ---------- Gebruikte materialen ---------- */}

            <div>

                <Kop>Gebruikte materialen</Kop>


                <Vraag label="1. Heb je nieuwe TV beugels gemonteerd?">

                    <JaNee

                        value={m.nieuweBeugels}

                        onChange={v=>set("materialen","nieuweBeugels",v)}

                    />

                </Vraag>


                <Vraag label="Heb je bestaande TV beugels gemonteerd?">

                    <JaNee

                        value={m.bestaandeBeugels}

                        onChange={v=>set("materialen","bestaandeBeugels",v)}

                    />

                </Vraag>


                <div className="
                    flex
                    flex-wrap
                    gap-3
                    border-b
                    border-dashed
                    pb-3
                    mb-3
                ">

                    <Veld small label="Muurbeugel" value={m.muurbeugel} onChange={v=>set("materialen","muurbeugel",v)} />

                    <Veld small label="Zwenkbeugel" value={m.zwenkbeugel} onChange={v=>set("materialen","zwenkbeugel",v)} />

                    <Veld small label="Plafond 150cm" value={m.plafond150} onChange={v=>set("materialen","plafond150",v)} />

                    <Veld small label="Plafond 300cm" value={m.plafond300} onChange={v=>set("materialen","plafond300",v)} />

                    <Veld small label="Vloerstandaard" value={m.vloerstandaard} onChange={v=>set("materialen","vloerstandaard",v)} />

                    <Veld small label="Overig" value={m.overigBeugel} onChange={v=>set("materialen","overigBeugel",v)} />

                </div>


                <Vraag label="2. Heb je extra HDMI kabels gebruikt?">

                    <JaNee

                        value={m.extraHdmiKabels}

                        onChange={v=>set("materialen","extraHdmiKabels",v)}

                    />

                </Vraag>


                <Vraag label="Heb je extra HDMI splitters gebruikt?">

                    <JaNee

                        value={m.extraHdmiSplitters}

                        onChange={v=>set("materialen","extraHdmiSplitters",v)}

                    />

                </Vraag>


                <Vraag label="3. Heb je extra patchkabels gebruikt?">

                    <JaNee

                        value={m.extraPatchkabels}

                        onChange={v=>set("materialen","extraPatchkabels",v)}

                    />

                </Vraag>


                {
                    m.extraPatchkabels === true && (

                        <div className="
                            flex
                            flex-wrap
                            gap-3
                            border-b
                            border-dashed
                            pb-3
                            mb-3
                        ">

                            <Veld small label="1 meter" value={m.patch1} onChange={v=>set("materialen","patch1",v)} />

                            <Veld small label="2 meter" value={m.patch2} onChange={v=>set("materialen","patch2",v)} />

                            <Veld small label="3 meter" value={m.patch3} onChange={v=>set("materialen","patch3",v)} />

                            <Veld small label="5 meter" value={m.patch5} onChange={v=>set("materialen","patch5",v)} />

                            <Veld small label="7,5 meter" value={m.patch75} onChange={v=>set("materialen","patch75",v)} />

                            <Veld small label="10 meter" value={m.patch10} onChange={v=>set("materialen","patch10",v)} />

                        </div>

                    )
                }


                <Vraag label="Heb je extra switches gebruikt?">

                    <JaNee

                        value={m.extraSwitches}

                        onChange={v=>set("materialen","extraSwitches",v)}

                    />

                </Vraag>


                <Vraag label="4. Heb je extra UTP kabel getrokken?">

                    <JaNee

                        value={m.utpGetrokken}

                        onChange={v=>set("materialen","utpGetrokken",v)}

                    />

                </Vraag>


                <Vraag label="5. Heb je extra stroomkabel getrokken?">

                    <JaNee

                        value={m.stroomkabelGetrokken}

                        onChange={v=>set("materialen","stroomkabelGetrokken",v)}

                    />

                </Vraag>


                <Vraag label="6. Heb je verlengsnoeren (stekkerdozen) gebruikt?">

                    <JaNee

                        value={m.verlengsnoeren}

                        onChange={v=>set("materialen","verlengsnoeren",v)}

                    />

                </Vraag>


                {
                    m.verlengsnoeren === true && (

                        <div className="
                            flex
                            flex-wrap
                            gap-3
                            border-b
                            border-dashed
                            pb-3
                            mb-3
                        ">

                            <Veld small label="3-voudig, 1,5 m" value={m.verleng15} onChange={v=>set("materialen","verleng15",v)} />

                            <Veld small label="3-voudig, 3 m" value={m.verleng3} onChange={v=>set("materialen","verleng3",v)} />

                            <Veld small label="3-voudig, 5 m" value={m.verleng5} onChange={v=>set("materialen","verleng5",v)} />

                        </div>

                    )
                }


                <Vraag label="7. Heb je extra seriële en/of USB speakers gebruikt?">

                    <JaNee

                        value={m.extraSpeakers}

                        onChange={v=>set("materialen","extraSpeakers",v)}

                    />

                </Vraag>


                <Vraag label="Opmerkingen:">

                    <textarea

                        value={m.opmerkingen}

                        onChange={e=>set("materialen","opmerkingen",e.target.value)}

                        className="w-full border rounded-xl p-2 min-h-20"

                    />

                </Vraag>

            </div>




            {/* ---------- Checklist ---------- */}

            <div>

                <Kop>Checklist</Kop>


                <Vraag label="1. Is de installatie werkend opgeleverd?">

                    <JaNee

                        value={c.werkendOpgeleverd}

                        onChange={v=>set("checklist","werkendOpgeleverd",v)}

                    />

                </Vraag>


                <Vraag label="2. Is de hardware aangesloten op een schakelstroompunt dat handmatig uit te zetten is?">

                    <JaNee

                        value={c.lichtnetSchakelbaar}

                        onChange={v=>set("checklist","lichtnetSchakelbaar",v)}

                    />

                </Vraag>


                <Vraag label="3. WiFi verbinding van toepassing?">

                    <JaNee

                        value={c.wifiVanToepassing}

                        onChange={v=>set("checklist","wifiVanToepassing",v)}

                    />

                </Vraag>


                {
                    c.wifiVanToepassing === true && (

                        <Vraag label="Is de WiFi verbinding sterk genoeg?">

                            <Keuze

                                value={c.wifiSterkte}

                                options={["Ja","Matig","Slecht"]}

                                onChange={v=>set("checklist","wifiSterkte",v as OpleverData["checklist"]["wifiSterkte"])}

                            />

                        </Vraag>

                    )
                }


                <Vraag label="4. Zijn de schermen gekoppeld aan Remote Services?">

                    <Keuze

                        value={c.remoteServices}

                        options={["Ja","Nee","n.v.t."]}

                        onChange={v=>set("checklist","remoteServices",v as OpleverData["checklist"]["remoteServices"])}

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

                        onChange={v=>set("checklist","locatieMediaplayer",v as OpleverData["checklist"]["locatieMediaplayer"])}

                    />

                    <Veld

                        small

                        label="Aantal"

                        value={c.aantalMediaplayers}

                        onChange={v=>set("checklist","aantalMediaplayers",v)}

                    />

                </Vraag>


                <Vraag label="6. Afvalverwijdering?">

                    <JaNee

                        value={c.afvalverwijdering}

                        onChange={v=>set("checklist","afvalverwijdering",v)}

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
