"use client";

import { useEffect, useRef, useState } from "react";

import {
    BEUGEL_TYPES,
    SCHERM_FORMATEN,
    ExtraKosten,
    HardwareRegel,
    OpleverData,
    SchermBlok,
    emptyExtraKosten,
    emptySchermBlok,
    emptyKioskBlok,
    KioskBlok,
    mergeOpleverData
} from "@/types/oplever";

import {
    CustomerFormSchema
} from "@/types/customerForms";

import CustomerFormSection from "./CustomerFormSection";



interface Props {

    workorderId?:string;

    initial:unknown;

    // Naam van monteur 1 (de toegewezen monteur), voor de urenlabels
    monteur1Name?:string | null;

    // Namen van de extra monteurs (uit het klaarzetten), voor monteur 2-4
    extraEngineerNames?:string[];

    // Per-opdrachtgever vragen (uit Customer.formSchema)
    customerSchema?:CustomerFormSchema | null;

    // Naam van de opdrachtgever (voor de kop van het klantspecifieke blok)
    customerName?:string | null;

    // Ingebed in een groter formulier: geen eigen opslaanknop,
    // wijzigingen gaan via onChange omhoog naar de parent.
    embedded?:boolean;

    onChange?:(data:OpleverData)=>void;

    // "volledig" (Digital Signage) toont alles; "uren" toont alleen
    // het Tarief & Uren-blok met een opmerkingenveld; "evalue8" toont het
    // Tarief-blok plus de eValue8-installatiesecties.
    variant?:"volledig" | "uren" | "evalue8";

}



// ---------- kleine bouwstenen ----------

function JaNee({

    value,

    onChange,

    labels = ["Ja","Nee"],

    compact = false,

    jaKleur = "green",

    neeKleur = "sky"

}:{

    value:boolean | null;

    onChange:(value:boolean)=>void;

    labels?:[string,string] | string[];

    compact?:boolean;

    jaKleur?:"green" | "red" | "orange" | "sky";

    neeKleur?:"green" | "red" | "orange" | "sky";

}){

    const size =
        compact
        ?
        "px-2.5 py-0.5 text-xs"
        :
        "px-4 py-1.5 text-sm";

    const kleurKlasse = (kleur:string)=>{
        if(kleur === "red") return "bg-red-100 border-red-300 text-red-800";
        if(kleur === "orange") return "bg-amber-100 border-amber-300 text-amber-800";
        if(kleur === "sky") return "bg-sky-100 border-sky-300 text-sky-800";
        if(kleur === "yellow") return "bg-yellow-100 border-yellow-300 text-yellow-800";
        return "bg-emerald-100 border-emerald-300 text-emerald-800";
    };

    return (

        <div className="flex gap-2">

            <button

                type="button"

                onClick={()=>onChange(true)}

                className={`
                    ${size}
                    rounded-full
                    border
                    ${
                        value === true
                        ?
                        kleurKlasse(jaKleur)
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
                    ${size}
                    rounded-full
                    border
                    ${
                        value === false
                        ?
                        kleurKlasse(neeKleur)
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



// Pastelkleuren voor de keuzeknoppen (per optie een andere tint).
const PASTEL_KEUZE = [
    "bg-sky-100 border-sky-300 text-sky-800",
    "bg-emerald-100 border-emerald-300 text-emerald-800",
    "bg-amber-100 border-amber-300 text-amber-800",
    "bg-violet-100 border-violet-300 text-violet-800",
    "bg-teal-100 border-teal-300 text-teal-800",
    "bg-indigo-100 border-indigo-300 text-indigo-800"
];

// Vaste kleurklassen voor als een optie een specifieke kleur moet krijgen.
const KEUZE_KLEUREN:Record<string,string> = {
    green:"bg-emerald-100 border-emerald-300 text-emerald-800",
    orange:"bg-amber-100 border-amber-300 text-amber-800",
    red:"bg-red-100 border-red-300 text-red-800",
    sky:"bg-sky-100 border-sky-300 text-sky-800",
    yellow:"bg-yellow-100 border-yellow-300 text-yellow-800"
};

function Keuze({

    value,

    options,

    onChange,

    kleuren

}:{

    value:string;

    options:readonly string[];

    onChange:(value:string)=>void;

    kleuren?:Record<string,string>;

}){

    return (

        <div className="flex flex-wrap gap-2">

            {
                options.map((option,index)=>{

                    const actiefKlasse =
                        kleuren && kleuren[option]
                        ?
                        KEUZE_KLEUREN[kleuren[option]]
                        :
                        PASTEL_KEUZE[index % PASTEL_KEUZE.length];

                    return (

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
                                transition
                                ${
                                    value === option
                                    ?
                                    actiefKlasse
                                    :
                                    "border-slate-200 text-gray-400 hover:border-slate-300"
                                }
                            `}

                        >
                            {option}
                        </button>

                    );

                })
            }

        </div>

    );

}



// Eén regel in de audio-lijst: label links, aantal-veld rechts.
// ---------- eValue8 ----------

// De vaste eValue8-installatieregels, gegroepeerd per sectie. Elke regel heeft
// een sleutel (voor opslag), een naam en een vaste toelichting ter info.
const EVALUE8_SECTIES:{
    titel:string;
    regels:{ key:string; naam:string; toelichting:string }[];
}[] = [
    {
        titel:"2. Werkplek (WKS)",
        regels:[
            { key:"wks_easy", naam:"Installatie WKS Easy", toelichting:"Aansluiting 220v / netwerk max. 1 meter" },
            { key:"wks_full", naam:"Installatie WKS Full", toelichting:"Aansluiting 220v / netwerk max. 3 meter" },
            { key:"wks_vervolg_kort", naam:"Vervolginstallatie (Kort)", toelichting:"Tijdsduur < 15 minuten" },
            { key:"wks_vervolg_lang", naam:"Vervolginstallatie (Lang)", toelichting:"Tijdsduur > 15 minuten" }
        ]
    },
    {
        titel:"3. Kiosk",
        regels:[
            { key:"kiosk_easy", naam:"Installatie Kiosk Easy", toelichting:"Bekabeling max. 1 meter" },
            { key:"kiosk_full", naam:"Installatie Kiosk Full", toelichting:"Bekabeling max. 3 meter" },
            { key:"kiosk_extended", naam:"Installatie Kiosk Extended", toelichting:"Bekabeling max. 10 meter" },
            { key:"kiosk_demontage", naam:"Demontage Kiosk", toelichting:"Verwijderen van bestaande kiosk" }
        ]
    },
    {
        titel:"4. Digital Signage (DS)",
        regels:[
            { key:"ds_extra_scherm", naam:"Extra scherm op locatie", toelichting:"Alleen i.c.m. volledige installatie" },
            { key:"ds_player", naam:"Installatie DS Player", toelichting:"Aansluiten op een bestaand scherm" },
            { key:"ds_swap", naam:"Installatie DS Swap", toelichting:"Wisselen van scherm of player op bestaande installatie" }
        ]
    },
    {
        titel:"5. Service, Software & Storingen",
        regels:[
            { key:"balie_software", naam:"Installatie Balie software", toelichting:"Softwarematige installatie" },
            { key:"storing_type1", naam:"Storing Type 1", toelichting:"Inclusief voorrijkosten + 1 uur installatie" },
            { key:"storing_type2", naam:"Storing Type 2", toelichting:"Max. 1 uur installatie (excl. voorrijkosten)" }
        ]
    }
];



// Eén aanvinkbare eValue8-regel met toelichting en aantal.
function EValue8Regel({
    naam,
    toelichting,
    item,
    onChange
}:{
    naam:string;
    toelichting:string;
    item:{ aan:boolean; aantal:string };
    onChange:(item:{ aan:boolean; aantal:string })=>void;
}){

    return (
        <div className={`
            rounded-xl
            border
            p-3
            transition
            ${
                item.aan
                ?
                "bg-sky-50 border-sky-300"
                :
                "bg-white border-slate-200"
            }
        `}>

            <div className="
                flex
                items-start
                justify-between
                gap-3
            ">

                <label className="
                    flex
                    items-start
                    gap-3
                    cursor-pointer
                    flex-1
                ">
                    <input
                        type="checkbox"
                        checked={item.aan}
                        onChange={(e)=>
                            onChange({
                                aan:e.target.checked,
                                aantal:e.target.checked ? (item.aantal || "1") : ""
                            })
                        }
                        className="w-4 h-4 mt-0.5"
                    />

                    <span>
                        <span className="
                            block
                            text-sm
                            font-medium
                            text-slate-800
                        ">
                            {naam}
                        </span>
                        <span className="
                            block
                            text-xs
                            text-slate-500
                        ">
                            {toelichting}
                        </span>
                    </span>
                </label>


                {
                    item.aan && (
                        <div className="
                            flex
                            items-center
                            gap-2
                            shrink-0
                        ">
                            <span className="text-xs text-slate-500">Aantal:</span>
                            <input
                                inputMode="numeric"
                                value={item.aantal}
                                onChange={(e)=>
                                    onChange({
                                        aan:item.aan,
                                        aantal:e.target.value
                                    })
                                }
                                className="w-16 border rounded-lg p-1.5 text-sm"
                            />
                        </div>
                    )
                }

            </div>

        </div>
    );
}



// Inline handtekening-vak: tekenen met vinger/pen/muis, opslaan als data-URL.
function HandtekeningVak({
    value,
    onChange
}:{
    value:string;
    onChange:(dataUrl:string)=>void;
}){

    const canvasRef =
        useRef<HTMLCanvasElement | null>(null);

    const tekenen =
        useRef(false);


    // Bestaande handtekening terugtekenen bij laden.
    useEffect(()=>{
        const canvas = canvasRef.current;
        if(!canvas || !value){
            return;
        }
        const ctx = canvas.getContext("2d");
        if(!ctx){
            return;
        }
        const img = new Image();
        img.onload = ()=>{
            ctx.clearRect(0,0,canvas.width,canvas.height);
            ctx.drawImage(img,0,0,canvas.width,canvas.height);
        };
        img.src = value;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[]);


    function pos(event:React.PointerEvent<HTMLCanvasElement>){
        const canvas = canvasRef.current;
        if(!canvas){
            return { x:0, y:0 };
        }
        const rect = canvas.getBoundingClientRect();
        return {
            x:(event.clientX - rect.left) * (canvas.width / rect.width),
            y:(event.clientY - rect.top) * (canvas.height / rect.height)
        };
    }


    function start(event:React.PointerEvent<HTMLCanvasElement>){
        event.preventDefault();
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if(!canvas || !ctx){
            return;
        }
        canvas.setPointerCapture(event.pointerId);
        const { x, y } = pos(event);
        ctx.beginPath();
        ctx.moveTo(x, y);
        tekenen.current = true;
    }


    function beweeg(event:React.PointerEvent<HTMLCanvasElement>){
        if(!tekenen.current){
            return;
        }
        event.preventDefault();
        const ctx = canvasRef.current?.getContext("2d");
        if(!ctx){
            return;
        }
        const { x, y } = pos(event);
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.strokeStyle = "#0f172a";
        ctx.lineTo(x, y);
        ctx.stroke();
    }


    function stop(){
        if(!tekenen.current){
            return;
        }
        tekenen.current = false;
        const canvas = canvasRef.current;
        if(canvas){
            onChange(canvas.toDataURL("image/png"));
        }
    }


    function wissen(){
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if(canvas && ctx){
            ctx.clearRect(0,0,canvas.width,canvas.height);
            onChange("");
        }
    }


    return (
        <div>
            <canvas
                ref={canvasRef}
                width={600}
                height={200}
                onPointerDown={start}
                onPointerMove={beweeg}
                onPointerUp={stop}
                onPointerCancel={stop}
                style={{ touchAction:"none" }}
                className="
                    border
                    rounded-xl
                    w-full
                    h-40
                    bg-gray-50
                "
            />
            <button
                type="button"
                onClick={wissen}
                className="
                    mt-2
                    text-sm
                    text-slate-500
                    hover:text-slate-700
                "
            >
                Wissen
            </button>
        </div>
    );
}



function AudioRegel({
    label,
    value,
    onChange
}:{
    label:string;
    value:string;
    onChange:(value:string)=>void;
}){
    return (
        <div className="
            flex
            items-center
            gap-3
            py-1.5
        ">
            <span className="
                text-sm
                text-slate-700
                flex-1
            ">
                {label}
            </span>
            <input
                inputMode="numeric"
                value={value}
                placeholder="Aantal"
                onChange={(e)=>onChange(e.target.value)}
                className="w-20 border rounded-lg p-1.5 text-sm"
            />
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

            <span className="
                block
                text-sm
                text-gray-600
                min-h-[2.5rem]
            ">

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
            flex
            flex-col
            sm:flex-row
            sm:items-center
            sm:justify-between
            gap-2
            sm:gap-4
            border-b
            border-slate-100
            py-2.5
        ">

            <p className="
                text-sm
                text-slate-700
                sm:flex-1
            ">

                {label}

            </p>

            <div className="sm:flex-shrink-0">

                {children}

            </div>

        </div>

    );

}



// Uitklapbare subsectie: onder de vraag een klein +/- knopje.
// Klik + om de detailvelden te tonen, - om ze weer te verbergen.
function UitklapVraag({
    label,
    actief,
    onToggle,
    children
}:{
    label:string;
    actief:boolean;
    onToggle:(actief:boolean)=>void;
    children:React.ReactNode;
}){

    return (

        <div className="
            border-b
            border-slate-100
            py-2.5
        ">

            <div className="
                flex
                items-center
                gap-3
            ">

                <p className="
                    text-sm
                    text-slate-700
                    flex-1
                ">
                    {label}
                </p>

                <button
                    type="button"
                    onClick={()=>onToggle(!actief)}
                    title={actief ? "Inklappen" : "Toevoegen"}
                    className={`
                        w-7
                        h-7
                        rounded-lg
                        flex
                        items-center
                        justify-center
                        text-lg
                        leading-none
                        transition
                        ${
                            actief
                            ?
                            "bg-sky-100 border border-sky-300 text-sky-700"
                            :
                            "border border-slate-300 text-slate-500 hover:border-sky-400 hover:text-sky-600"
                        }
                    `}
                >
                    {actief ? "–" : "+"}
                </button>

            </div>

            {
                actief && (
                    <div className="mt-3 space-y-3">
                        {children}
                    </div>
                )
            }

        </div>

    );

}



// Checklist-vraag: label boven, antwoord (en eventuele reden/sub-vraag) eronder.
function ChecklistVraag({
    label,
    children
}:{
    label:string;
    children:React.ReactNode;
}){
    return (
        <div className="
            border-b
            border-slate-100
            py-3
            space-y-3
        ">
            <p className="text-sm text-slate-700">
                {label}
            </p>
            {children}
        </div>
    );
}



// Reden-tekstvak dat onder een antwoord verschijnt.
function RedenVeld({
    value,
    onChange
}:{
    value:string;
    onChange:(value:string)=>void;
}){
    return (
        <div className="mt-1">
            <span className="block text-sm text-slate-600 mb-1">Reden:</span>
            <textarea
                rows={2}
                value={value}
                onChange={(e)=>onChange(e.target.value)}
                className="w-full border rounded-xl p-2.5 text-sm"
            />
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
            flex
            items-center
            gap-2.5
            font-semibold
            text-[15px]
            text-slate-800
            border-b
            border-slate-200
            pb-2
            mb-5
        ">

            <span className="
                inline-block
                w-1
                h-5
                rounded-full
                bg-[#d6007e]
            "></span>

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
                        "bg-amber-100 border-amber-300 text-amber-800"
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
                        rounded-lg
                        px-3
                        py-2
                        mt-2
                        bg-gray-50
                        w-56
                        space-y-2
                    ">

                        <div className="
                            flex
                            items-center
                            gap-1.5
                        ">
                            <span className="text-sm text-gray-500">€</span>
                            <input
                                inputMode="decimal"
                                value={value.kosten}
                                placeholder="0,00"
                                onChange={(e)=>
                                    onChange({
                                        ...value,
                                        kosten:e.target.value
                                    })
                                }
                                className="
                                    w-24
                                    border
                                    rounded-lg
                                    p-1.5
                                    text-sm
                                "
                            />
                        </div>

                        <div className="
                            flex
                            items-center
                            gap-1.5
                        ">
                            <span className="text-xs text-gray-500">
                                Voorgeschoten?
                            </span>
                            <JaNee
                                compact
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
                                    text-[11px]
                                    leading-snug
                                    text-orange-600
                                ">
                                    * Vergeet het formulier &apos;Bon declareren&apos; niet.
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

                                Scherm {index + 1}

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


                        <div className="space-y-2">
                            <p className="text-sm text-gray-600">Wat is er met dit scherm gedaan?</p>
                            <Keuze
                                value={blok.status}
                                options={[
                                    "Nieuw gemonteerd",
                                    "Hergebruikt gemonteerd",
                                    "Gedemonteerd"
                                ]}
                                onChange={(v)=>
                                    update(index,{
                                        status:v as SchermBlok["status"]
                                    })
                                }
                            />
                        </div>


                        <div className="
                            grid
                            grid-cols-1
                            sm:grid-cols-2
                            gap-3
                        ">

                            <div>
                                <span className="
                                    block
                                    text-sm
                                    text-gray-600
                                    min-h-[2.5rem]
                                ">
                                    Welk formaat scherm?
                                </span>

                                <select
                                    value={blok.formaat}
                                    onChange={(e)=>
                                        update(index,{ formaat:e.target.value })
                                    }
                                    className="w-full border rounded-xl p-2 bg-white"
                                >
                                    <option value="">— Kies —</option>
                                    {
                                        SCHERM_FORMATEN.map(f=>(
                                            <option key={f} value={f}>{f}</option>
                                        ))
                                    }
                                </select>

                                {
                                    blok.formaat === "Anders" && (
                                        <input
                                            value={blok.formaatAnders}
                                            placeholder="Eigen formaat"
                                            onChange={(e)=>
                                                update(index,{ formaatAnders:e.target.value })
                                            }
                                            className="w-full border rounded-xl p-2 mt-2"
                                        />
                                    )
                                }
                            </div>

                            <Veld

                                label="Hoeveel schermen van dit formaat?"

                                value={blok.aantal}

                                onChange={(v)=>
                                    update(index,{ aantal:v })
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

                            {
                                blok.typeBeugel === "Anders" && (
                                    <input
                                        value={blok.beugelAnders}
                                        placeholder="Welke beugel?"
                                        onChange={(e)=>
                                            update(index,{ beugelAnders:e.target.value })
                                        }
                                        className="w-full sm:w-72 border rounded-xl p-2"
                                    />
                                )
                            }

                        </div>


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

                ＋ Nog een scherm toevoegen

            </button>


        </div>

    );

}



// ---------- het formulier ----------

export default function OpleverForm({

    workorderId,

    initial,

    monteur1Name,

    extraEngineerNames = [],

    customerSchema = null,

    customerName = null,

    embedded = false,

    onChange,

    variant = "volledig"

}:Props){


    const [data,setData] =
        useState<OpleverData>(()=>{

            const merged = mergeOpleverData(initial);

            // Extra monteurs uit het klaarzetten voorvullen (alleen als leeg)
            if(extraEngineerNames[0] && !merged.tarief.monteur2){
                merged.tarief.monteur2 = extraEngineerNames[0];
            }
            if(extraEngineerNames[1] && !merged.tarief.monteur3){
                merged.tarief.monteur3 = extraEngineerNames[1];
            }
            if(extraEngineerNames[2] && !merged.tarief.monteur4){
                merged.tarief.monteur4 = extraEngineerNames[2];
            }

            return merged;

        });


    // Hoeveel monteur-blokken tonen we? Alleen monteur 1 + degenen die al
    // een naam hebben (uit het klaarzetten of eerder ingevuld). Minimaal 1.
    const [zichtbareMonteurs,setZichtbareMonteurs] =
        useState<number>(()=>{
            const merged = mergeOpleverData(initial);
            let n = 1;
            if(merged.tarief.monteur2 || extraEngineerNames[0]) n = 2;
            if(merged.tarief.monteur3 || extraEngineerNames[1]) n = 3;
            if(merged.tarief.monteur4 || extraEngineerNames[2]) n = 4;
            return n;
        });


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




    // De parent op de hoogte brengen ná het renderen (niet tijdens),
    // om "setState tijdens render" te voorkomen.
    useEffect(()=>{

        if(onChange){
            onChange(data);
        }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[data]);




    function update(
        mutate:(draft:OpleverData)=>void
    ){

        setData(previous=>{

            const next =
                structuredClone(previous);

            mutate(next);

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

        urenVeld,

        onRemove

    }:{

        nummer:number;

        naam?:string | null;

        naamVeld?:"monteur2" | "monteur3" | "monteur4";

        urenVeld:"urenMonteur1" | "urenMonteur2" | "urenMonteur3" | "urenMonteur4";

        onRemove?:()=>void;

    }){

        return (

            <div className="
                relative
                border
                rounded-xl
                p-3
                space-y-2
            ">

                {
                    onRemove && (
                        <button
                            type="button"
                            onClick={onRemove}
                            title="Monteur verwijderen"
                            className="
                                absolute
                                top-1.5
                                right-2
                                text-slate-400
                                hover:text-red-500
                                text-lg
                                leading-none
                            "
                        >
                            ×
                        </button>
                    )
                }


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

                        <div className="
                            w-full
                            border
                            border-transparent
                            rounded-xl
                            p-2
                            text-sm
                            bg-gray-50
                        ">

                            {naam ?? "—"}

                        </div>

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
            border-slate-200
            shadow-sm
            p-6
            sm:p-8
            space-y-8
        ">


            <div className="
                border-b
                border-slate-200
                pb-4
                mb-2
            ">

                <h2 className="
                    text-xl
                    font-bold
                    text-slate-900
                ">

                    {
                        variant === "uren"
                        ?
                        "Uren Opleverformulier"
                        :
                        variant === "evalue8"
                        ?
                        "eValue8 Opleverformulier"
                        :
                        "Digital Signage Opleverformulier"
                    }

                </h2>

                <p className="
                    text-sm
                    text-slate-500
                    mt-0.5
                ">

                    Vul de gegevens van de opgeleverde installatie in

                </p>

            </div>




            {/* ================= Klantspecifiek (bovenaan) ================= */}

            {
                customerSchema && (

                    <div className="
                        border
                        border-blue-200
                        rounded-2xl
                        p-5
                        bg-blue-50/40
                    ">

                        <h3 className="
                            flex
                            items-center
                            gap-2.5
                            font-semibold
                            text-[15px]
                            text-slate-800
                            border-b
                            border-blue-200
                            pb-2
                            mb-5
                        ">

                            <span className="
                                inline-block
                                w-1
                                h-5
                                rounded-full
                                bg-blue-600
                            "></span>

                            Klantspecifiek{customerName ? ` — ${customerName}` : ""}

                            <span className="
                                text-xs
                                font-normal
                                text-slate-400
                                ml-1
                            ">
                                alleen voor deze opdrachtgever
                            </span>

                        </h3>

                        <CustomerFormSection
                            schema={customerSchema}
                            values={data.custom}
                            onChange={(fieldId, value)=>{
                                update(draft=>{
                                    draft.custom = {
                                        ...draft.custom,
                                        [fieldId]:value
                                    };
                                });
                            }}
                        />

                    </div>

                )
            }




            {/* ================= Installatiegegevens ================= */}

            <div>

                <Kop>Installatiegegevens</Kop>


                <p className="
                    text-[13px]
                    font-semibold
                    text-slate-700
                    bg-slate-50
                    border-l-2
                    border-blue-500
                    px-3
                    py-1.5
                    rounded-r
                    mb-3
                ">

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

                    <div>

                        <span className="
                            block
                            text-sm
                            text-gray-600
                            min-h-[2.5rem]
                        ">
                            Voorrijtarief?
                        </span>

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
                        pb-2.5
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

                    {
                        zichtbareMonteurs >= 2 && (
                            <MonteurUren
                                nummer={2}
                                naamVeld="monteur2"
                                urenVeld="urenMonteur2"
                                onRemove={
                                    zichtbareMonteurs === 2
                                    ?
                                    ()=>{
                                        update(draft=>{
                                            draft.tarief.monteur2 = "";
                                            draft.tarief.urenMonteur2 = "";
                                        });
                                        setZichtbareMonteurs(1);
                                    }
                                    :
                                    undefined
                                }
                            />
                        )
                    }

                    {
                        zichtbareMonteurs >= 3 && (
                            <MonteurUren
                                nummer={3}
                                naamVeld="monteur3"
                                urenVeld="urenMonteur3"
                                onRemove={
                                    zichtbareMonteurs === 3
                                    ?
                                    ()=>{
                                        update(draft=>{
                                            draft.tarief.monteur3 = "";
                                            draft.tarief.urenMonteur3 = "";
                                        });
                                        setZichtbareMonteurs(2);
                                    }
                                    :
                                    undefined
                                }
                            />
                        )
                    }

                    {
                        zichtbareMonteurs >= 4 && (
                            <MonteurUren
                                nummer={4}
                                naamVeld="monteur4"
                                urenVeld="urenMonteur4"
                                onRemove={()=>{
                                    update(draft=>{
                                        draft.tarief.monteur4 = "";
                                        draft.tarief.urenMonteur4 = "";
                                    });
                                    setZichtbareMonteurs(3);
                                }}
                            />
                        )
                    }

                </div>


                {
                    zichtbareMonteurs < 4 && (
                        <button
                            type="button"
                            onClick={()=>setZichtbareMonteurs(n=>Math.min(4, n + 1))}
                            className="
                                text-sm
                                text-blue-600
                                hover:underline
                                mb-3
                            "
                        >
                            + Monteur toevoegen
                        </button>
                    )
                }


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
                        items-start
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


{
                  variant === "volledig" && (
                    <>

                <p className="
                    text-[13px]
                    font-semibold
                    text-slate-700
                    bg-slate-50
                    border-l-2
                    border-blue-500
                    px-3
                    py-1.5
                    rounded-r
                    mb-3
                ">

                    2. Installatie werkzaamheden

                </p>


                <UitklapVraag
                    label="1. Schermen"
                    actief={i.nieuweSchermen === true}
                    onToggle={(v)=>
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
                >

                    <SchermBlokken

                        blokken={i.nieuweFormaten}

                        onChange={(blokken)=>
                            update(draft=>{
                                draft.installatie.nieuweFormaten =
                                    blokken;
                            })
                        }

                    />

                </UitklapVraag>


                <UitklapVraag
                    label="2. Videowall"
                    actief={i.videowall === true}
                    onToggle={(v)=>
                        update(draft=>{
                            draft.installatie.videowall = v;
                        })
                    }
                >

                    {
                        i.videowall === true && (

                            <div className="space-y-4">

                                {/* Geïnstalleerd / gedemonteerd */}
                                <div className="space-y-2">
                                    <p className="text-sm text-gray-600">Status</p>
                                    <Keuze
                                        value={i.videowallStatus}
                                        options={["Geïnstalleerd","Gedemonteerd"]}
                                        onChange={(v)=>
                                            update(draft=>{
                                                draft.installatie.videowallStatus =
                                                    v as OpleverData["installatie"]["videowallStatus"];
                                            })
                                        }
                                    />
                                </div>

                                {/* Configuratie: aantal schermen horizontaal x verticaal */}
                                <div>
                                    <p className="text-sm text-gray-600 mb-2">
                                        Configuratie (aantal schermen)
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <Veld
                                            label="Horizontaal"
                                            value={i.videowallHorizontaal}
                                            onChange={(v)=>
                                                update(draft=>{
                                                    draft.installatie.videowallHorizontaal = v;
                                                })
                                            }
                                        />
                                        <Veld
                                            label="Verticaal"
                                            value={i.videowallVerticaal}
                                            onChange={(v)=>
                                                update(draft=>{
                                                    draft.installatie.videowallVerticaal = v;
                                                })
                                            }
                                        />
                                    </div>
                                </div>

                                {/* Formaat schermen (dropdown) */}
                                <div>
                                    <span className="block text-sm text-gray-600 mb-1">
                                        Formaat schermen
                                    </span>
                                    <select
                                        value={i.videowallFormaat}
                                        onChange={(e)=>
                                            update(draft=>{
                                                draft.installatie.videowallFormaat = e.target.value;
                                            })
                                        }
                                        className="w-full sm:w-64 border rounded-xl p-2 bg-white"
                                    >
                                        <option value="">— Kies —</option>
                                        {
                                            SCHERM_FORMATEN.map(f=>(
                                                <option key={f} value={f}>{f}</option>
                                            ))
                                        }
                                    </select>
                                    {
                                        i.videowallFormaat === "Anders" && (
                                            <input
                                                value={i.videowallFormaatAnders}
                                                placeholder="Eigen formaat"
                                                onChange={(e)=>
                                                    update(draft=>{
                                                        draft.installatie.videowallFormaatAnders = e.target.value;
                                                    })
                                                }
                                                className="w-full sm:w-64 border rounded-xl p-2 mt-2 block"
                                            />
                                        )
                                    }
                                </div>

                                {/* Oriëntatie */}
                                <div className="space-y-2">
                                    <p className="text-sm text-gray-600">Oriëntatie</p>
                                    <Keuze
                                        value={i.videowallOrientatie}
                                        options={["Landscape","Portrait"]}
                                        onChange={(v)=>
                                            update(draft=>{
                                                draft.installatie.videowallOrientatie =
                                                    v as OpleverData["installatie"]["videowallOrientatie"];
                                            })
                                        }
                                    />
                                </div>

                            </div>

                        )
                    }

                </UitklapVraag>


                <UitklapVraag
                    label="3. Kiosk"
                    actief={i.kiosk === true}
                    onToggle={(v)=>
                        update(draft=>{
                            draft.installatie.kiosk = v;
                            if(
                                v &&
                                draft.installatie.kioskBlokken.length === 0
                            ){
                                draft.installatie.kioskBlokken = [
                                    emptyKioskBlok()
                                ];
                            }
                        })
                    }
                >

                    <div className="space-y-4">

                        {
                            i.kioskBlokken.map((kb,ki)=>(

                                <div
                                    key={ki}
                                    className="
                                        relative
                                        border
                                        rounded-xl
                                        p-3
                                        space-y-3
                                    "
                                >

                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-semibold text-slate-700">
                                            Kiosk {ki + 1}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={()=>update(draft=>{
                                                draft.installatie.kioskBlokken.splice(ki,1);
                                            })}
                                            className="text-slate-400 hover:text-red-500 text-lg leading-none"
                                            title="Kiosk verwijderen"
                                        >
                                            ×
                                        </button>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-sm text-gray-600">Status</p>
                                        <Keuze
                                            value={kb.status}
                                            options={["Geïnstalleerd","Gedemonteerd"]}
                                            onChange={(v)=>update(draft=>{
                                                draft.installatie.kioskBlokken[ki].status =
                                                    v as KioskBlok["status"];
                                            })}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <div className="sm:col-span-2">
                                            <Veld
                                                label="Omschrijving"
                                                value={kb.omschrijving}
                                                onChange={(v)=>update(draft=>{
                                                    draft.installatie.kioskBlokken[ki].omschrijving = v;
                                                })}
                                            />
                                        </div>
                                        <Veld
                                            label="Aantal"
                                            value={kb.aantal}
                                            onChange={(v)=>update(draft=>{
                                                draft.installatie.kioskBlokken[ki].aantal = v;
                                            })}
                                        />
                                    </div>

                                </div>

                            ))
                        }

                        <button
                            type="button"
                            onClick={()=>update(draft=>{
                                draft.installatie.kioskBlokken.push(emptyKioskBlok());
                            })}
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
                            ＋ Nog een kiosk toevoegen
                        </button>

                    </div>

                </UitklapVraag>


                <UitklapVraag
                    label="4. Mediaplayers"
                    actief={!!i.mediaplayers}
                    onToggle={(v)=>
                        update(draft=>{
                            draft.installatie.mediaplayers =
                                (v ? "Geïnstalleerd" : "") as OpleverData["installatie"]["mediaplayers"];
                            if(!v){
                                draft.installatie.aantalMediaplayers = "";
                            }
                        })
                    }
                >

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

                </UitklapVraag>


                <UitklapVraag
                    label="5. Audio"
                    actief={i.audio === true}
                    onToggle={(v)=>
                        update(draft=>{
                            draft.installatie.audio = v;
                        })
                    }
                >

                    <div className="space-y-4">

                        <div className="space-y-2">
                            <p className="text-sm text-gray-600">Status</p>
                            <Keuze
                                value={i.audioStatus}
                                options={["Geïnstalleerd","Gedemonteerd"]}
                                onChange={(v)=>
                                    update(draft=>{
                                        draft.installatie.audioStatus =
                                            v as OpleverData["installatie"]["audioStatus"];
                                    })
                                }
                            />
                        </div>

                        <div className="space-y-2">

                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 pt-1">
                                {
                                    i.audioStatus === "Gedemonteerd"
                                    ?
                                    "Wat is er gedemonteerd? (vul het aantal in)"
                                    :
                                    "Wat is er geïnstalleerd? (vul het aantal in)"
                                }
                            </p>

                            <AudioRegel
                                label="Audiospeler"
                                value={i.audioSpeler}
                                onChange={(v)=>update(draft=>{
                                    draft.installatie.audioSpeler = v;
                                })}
                            />

                            <AudioRegel
                                label="Versterker"
                                value={i.audioVersterker}
                                onChange={(v)=>update(draft=>{
                                    draft.installatie.audioVersterker = v;
                                })}
                            />

                            <AudioRegel
                                label="Volumeregelaar"
                                value={i.audioVolumeregelaar}
                                onChange={(v)=>update(draft=>{
                                    draft.installatie.audioVolumeregelaar = v;
                                })}
                            />

                            <AudioRegel
                                label="Speakers"
                                value={i.audioSpeakers}
                                onChange={(v)=>update(draft=>{
                                    draft.installatie.audioSpeakers = v;
                                })}
                            />

                            {/* Anders: eigen tekst + aantal */}
                            <div className="
                                flex
                                items-center
                                gap-3
                                py-1.5
                            ">
                                <input
                                    value={i.audioAndersTekst}
                                    placeholder="Anders, namelijk..."
                                    onChange={(e)=>update(draft=>{
                                        draft.installatie.audioAndersTekst = e.target.value;
                                    })}
                                    className="flex-1 border rounded-lg p-1.5 text-sm"
                                />
                                <input
                                    inputMode="numeric"
                                    value={i.audioAndersAantal}
                                    placeholder="Aantal"
                                    onChange={(e)=>update(draft=>{
                                        draft.installatie.audioAndersAantal = e.target.value;
                                    })}
                                    className="w-20 border rounded-lg p-1.5 text-sm"
                                />
                            </div>

                        </div>

                    </div>

                </UitklapVraag>


                <div className="border-b border-slate-100 py-2.5 space-y-3">

                    <div className="
                        flex
                        flex-col
                        sm:flex-row
                        sm:items-center
                        sm:justify-between
                        gap-2
                        sm:gap-4
                    ">
                        <p className="text-sm text-slate-700 sm:flex-1">
                            6. Project (offerte basis) — is het een project?
                        </p>
                        <div className="sm:flex-shrink-0">
                            <JaNee
                                value={i.isProject}
                                onChange={(v)=>
                                    update(draft=>{
                                        draft.installatie.isProject = v;
                                    })
                                }
                            />
                        </div>
                    </div>

                    {
                        i.isProject === true && (
                            <div className="sm:w-72">
                                <span className="block text-sm text-gray-600 mb-1">
                                    Projectnummer
                                </span>
                                <input
                                    value={i.projectNummer}
                                    placeholder="Projectnummer"
                                    onChange={(e)=>
                                        update(draft=>{
                                            draft.installatie.projectNummer = e.target.value;
                                        })
                                    }
                                    className="w-full border rounded-xl p-2"
                                />
                            </div>
                        )
                    }

                </div>

                    </>
                  )
                }


                {/* ================= eValue8-installatieregels ================= */}
                {
                  variant === "evalue8" && (
                    <>
                        {
                            EVALUE8_SECTIES.map(sectie=>(
                                <div key={sectie.titel} className="pt-2">

                                    <p className="
                                        text-[13px]
                                        font-semibold
                                        text-slate-700
                                        bg-slate-50
                                        border-l-2
                                        border-blue-500
                                        px-3
                                        py-1.5
                                        rounded-r
                                        mb-3
                                    ">
                                        {sectie.titel}
                                    </p>

                                    <div className="space-y-2">
                                        {
                                            sectie.regels.map(regel=>(
                                                <EValue8Regel
                                                    key={regel.key}
                                                    naam={regel.naam}
                                                    toelichting={regel.toelichting}
                                                    item={
                                                        data.evalue8[regel.key]
                                                        ??
                                                        { aan:false, aantal:"" }
                                                    }
                                                    onChange={(item)=>update(draft=>{
                                                        draft.evalue8 = {
                                                            ...draft.evalue8,
                                                            [regel.key]:item
                                                        };
                                                    })}
                                                />
                                            ))
                                        }
                                    </div>

                                </div>
                            ))
                        }


                        {/* 6. Spare player */}
                        <div className="pt-2">

                            <p className="
                                text-[13px]
                                font-semibold
                                text-slate-700
                                bg-slate-50
                                border-l-2
                                border-blue-500
                                px-3
                                py-1.5
                                rounded-r
                                mb-3
                            ">
                                6. Spare player
                            </p>

                            <Vraag label="Spare player geïnstalleerd?">
                                <JaNee
                                    value={data.evalue8SparePlayer}
                                    onChange={(v)=>update(draft=>{
                                        draft.evalue8SparePlayer = v;
                                    })}
                                />
                            </Vraag>

                            {
                                data.evalue8SparePlayer === true && (
                                    <div className="mt-3 space-y-3">

                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Welk type / formaat (aantal per type)
                                        </p>

                                        <AudioRegel label="BTR 5" value={data.evalue8SpareBtr5} onChange={(v)=>update(draft=>{draft.evalue8SpareBtr5=v;})} />
                                        <AudioRegel label="GD" value={data.evalue8SpareGd} onChange={(v)=>update(draft=>{draft.evalue8SpareGd=v;})} />
                                        <AudioRegel label={'Kiosk Tablet 15,6"'} value={data.evalue8SpareKiosk156} onChange={(v)=>update(draft=>{draft.evalue8SpareKiosk156=v;})} />
                                        <AudioRegel label={'Kiosk Tablet 21"'} value={data.evalue8SpareKiosk21} onChange={(v)=>update(draft=>{draft.evalue8SpareKiosk21=v;})} />

                                        <div className="pt-1">
                                            <Vraag label="Melding gemaakt bij eValue8?">
                                                <JaNee
                                                    value={data.evalue8SpareMelding}
                                                    onChange={(v)=>update(draft=>{
                                                        draft.evalue8SpareMelding = v;
                                                    })}
                                                />
                                            </Vraag>
                                        </div>

                                    </div>
                                )
                            }

                        </div>

                    </>
                  )
                }


                <div className="pt-3">

                    <span className="
                        block
                        text-sm
                        font-medium
                        text-slate-700
                        mb-2
                    ">
                        Opmerkingen:
                    </span>

                    <textarea

                        value={i.opmerkingen}

                        onChange={(e)=>
                            update(draft=>{
                                draft.installatie.opmerkingen =
                                    e.target.value;
                            })
                        }

                        className="w-full border rounded-xl p-3 min-h-24"

                    />

                </div>

            </div>




            {
              variant === "volledig" && (
                <>

            {/* ================= Hardware geïnstalleerd/gedemonteerd ================= */}

            <div>

                <Kop>Hardware geïnstalleerd / gedemonteerd</Kop>

                <div className="overflow-x-auto">

                    <table className="w-full text-sm border-collapse">

                        <thead>

                            <tr className="bg-gray-50">

                                <th className="border p-2 text-left font-medium text-gray-600 w-48">
                                    Geïnstalleerd / gedemonteerd
                                </th>

                                <th className="border p-2 text-left font-medium text-gray-600">
                                    Merk
                                </th>

                                <th className="border p-2 text-left font-medium text-gray-600">
                                    Type
                                </th>

                                <th className="border p-2 text-left font-medium text-gray-600">
                                    Serienummer
                                </th>

                                <th className="border p-2 text-left font-medium text-gray-600">
                                    MAC Address
                                </th>

                                <th className="border p-2 w-10"></th>

                            </tr>

                        </thead>

                        <tbody>

                            {
                                data.hardware.map((regel,index)=>(

                                    <tr key={index}>

                                        <td className="border p-1">
                                            <select
                                                value={regel.actie}
                                                onChange={(e)=>update(draft=>{
                                                    draft.hardware[index].actie =
                                                        e.target.value as HardwareRegel["actie"];
                                                })}
                                                className="w-full p-1.5 rounded-lg bg-white"
                                            >
                                                <option value="">—</option>
                                                <option value="Geïnstalleerd">Geïnstalleerd</option>
                                                <option value="Gedemonteerd">Gedemonteerd</option>
                                            </select>
                                        </td>

                                        <td className="border p-1">
                                            <input
                                                value={regel.merk}
                                                onChange={(e)=>update(draft=>{
                                                    draft.hardware[index].merk = e.target.value;
                                                })}
                                                className="w-full p-1.5 rounded-lg bg-white"
                                            />
                                        </td>

                                        <td className="border p-1">
                                            <input
                                                value={regel.type}
                                                onChange={(e)=>update(draft=>{
                                                    draft.hardware[index].type = e.target.value;
                                                })}
                                                className="w-full p-1.5 rounded-lg bg-white"
                                            />
                                        </td>

                                        <td className="border p-1">
                                            <input
                                                value={regel.serienummer}
                                                onChange={(e)=>update(draft=>{
                                                    draft.hardware[index].serienummer = e.target.value;
                                                })}
                                                className="w-full p-1.5 rounded-lg bg-white"
                                            />
                                        </td>

                                        <td className="border p-1">
                                            <input
                                                value={regel.macAddress}
                                                onChange={(e)=>update(draft=>{
                                                    draft.hardware[index].macAddress = e.target.value;
                                                })}
                                                className="w-full p-1.5 rounded-lg bg-white"
                                            />
                                        </td>

                                        <td className="border p-1 text-center">
                                            <button
                                                type="button"
                                                onClick={()=>update(draft=>{
                                                    draft.hardware.splice(index,1);
                                                })}
                                                className="text-red-500 hover:text-red-700"
                                                title="Regel verwijderen"
                                            >
                                                ×
                                            </button>
                                        </td>

                                    </tr>

                                ))
                            }

                            {
                                data.hardware.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="border p-3 text-center text-gray-400">
                                            Nog geen hardware toegevoegd
                                        </td>
                                    </tr>
                                )
                            }

                        </tbody>

                    </table>

                </div>


                <button
                    type="button"
                    onClick={()=>update(draft=>{
                        draft.hardware.push({
                            actie:"",
                            merk:"",
                            type:"",
                            serienummer:"",
                            macAddress:""
                        });
                    })}
                    className="
                        mt-3
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
                    + Regel toevoegen
                </button>

            </div>

                </>
              )
            }


            {
              (variant === "volledig" || variant === "evalue8") && (
                <>


            {/* ================= Gebruikte materialen ================= */}

            <div>

                <Kop>Gebruikte materialen</Kop>


                <UitklapVraag
                    label="1. TV beugels gemonteerd"
                    actief={m.nieuweBeugels === true}
                    onToggle={(v)=>
                        update(draft=>{
                            draft.materialen.nieuweBeugels = v;
                        })
                    }
                >

                    <div className="space-y-2">

                        <div className="space-y-2">
                            <p className="text-sm text-gray-600">Nieuw of bestaand?</p>
                            <Keuze
                                value={m.bestaandeBeugels === true ? "Bestaand" : "Nieuw"}
                                options={["Nieuw","Bestaand"]}
                                onChange={(v)=>
                                    update(draft=>{
                                        draft.materialen.bestaandeBeugels = v === "Bestaand";
                                    })
                                }
                            />
                        </div>

                        <p className="text-sm text-gray-600 pt-1">
                            Welke beugels? (vul het aantal in)
                        </p>

                        <AudioRegel label="Muurbeugel" value={m.muurbeugel} onChange={(v)=>update(d=>{d.materialen.muurbeugel=v;})} />
                        <AudioRegel label="Zwenkbeugel" value={m.zwenkbeugel} onChange={(v)=>update(d=>{d.materialen.zwenkbeugel=v;})} />
                        <AudioRegel label="Plafondbeugel 150cm" value={m.plafond150} onChange={(v)=>update(d=>{d.materialen.plafond150=v;})} />
                        <AudioRegel label="Plafondbeugel 300cm" value={m.plafond300} onChange={(v)=>update(d=>{d.materialen.plafond300=v;})} />
                        <AudioRegel label="Vloerstandaard" value={m.vloerstandaard} onChange={(v)=>update(d=>{d.materialen.vloerstandaard=v;})} />
                        <AudioRegel label="Overig" value={m.overigBeugel} onChange={(v)=>update(d=>{d.materialen.overigBeugel=v;})} />

                    </div>

                </UitklapVraag>


                <UitklapVraag
                    label="2. Extra HDMI kabels gebruikt"
                    actief={m.extraHdmiKabels === true}
                    onToggle={(v)=>
                        update(draft=>{
                            draft.materialen.extraHdmiKabels = v;
                        })
                    }
                >
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 pt-1">HDMI kabels (aantal per lengte)</p>
                    <AudioRegel label="1 meter" value={m.hdmi1m} onChange={(v)=>update(d=>{d.materialen.hdmi1m=v;})} />
                    <AudioRegel label="2 meter" value={m.hdmi2m} onChange={(v)=>update(d=>{d.materialen.hdmi2m=v;})} />
                    <AudioRegel label="3 meter" value={m.hdmi3m} onChange={(v)=>update(d=>{d.materialen.hdmi3m=v;})} />
                    <AudioRegel label="5 meter" value={m.hdmi5m} onChange={(v)=>update(d=>{d.materialen.hdmi5m=v;})} />
                    <AudioRegel label="7,5 meter" value={m.hdmi75m} onChange={(v)=>update(d=>{d.materialen.hdmi75m=v;})} />
                    <AudioRegel label="10 meter" value={m.hdmi10m} onChange={(v)=>update(d=>{d.materialen.hdmi10m=v;})} />

                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 pt-1">HDMI splitters (aantal)</p>
                    <AudioRegel label="1x2 (1 ingang, 2 uitgangen)" value={m.hdmiSplitter1x2} onChange={(v)=>update(d=>{d.materialen.hdmiSplitter1x2=v;})} />
                    <AudioRegel label="1x4 (1 ingang, 4 uitgangen)" value={m.hdmiSplitter1x4} onChange={(v)=>update(d=>{d.materialen.hdmiSplitter1x4=v;})} />
                </UitklapVraag>


                <UitklapVraag
                    label="3. Extra patchkabels gebruikt"
                    actief={m.extraPatchkabels === true}
                    onToggle={(v)=>
                        update(draft=>{
                            draft.materialen.extraPatchkabels = v;
                        })
                    }
                >
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 pt-1">Aantal per lengte</p>
                    <AudioRegel label="Patchkabel 1 meter" value={m.patch1} onChange={(v)=>update(d=>{d.materialen.patch1=v;})} />
                    <AudioRegel label="Patchkabel 2 meter" value={m.patch2} onChange={(v)=>update(d=>{d.materialen.patch2=v;})} />
                    <AudioRegel label="Patchkabel 3 meter" value={m.patch3} onChange={(v)=>update(d=>{d.materialen.patch3=v;})} />
                    <AudioRegel label="Patchkabel 5 meter" value={m.patch5} onChange={(v)=>update(d=>{d.materialen.patch5=v;})} />
                    <AudioRegel label="Patchkabel 7,5 meter" value={m.patch75} onChange={(v)=>update(d=>{d.materialen.patch75=v;})} />
                    <AudioRegel label="Patchkabel 10 meter" value={m.patch10} onChange={(v)=>update(d=>{d.materialen.patch10=v;})} />
                </UitklapVraag>


                <UitklapVraag
                    label="Extra switches gebruikt"
                    actief={m.extraSwitches === true}
                    onToggle={(v)=>
                        update(draft=>{
                            draft.materialen.extraSwitches = v;
                        })
                    }
                >
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 pt-1">Switches (aantal per type)</p>
                    <AudioRegel label="5 poorten, gigabit" value={m.switch5port} onChange={(v)=>update(d=>{d.materialen.switch5port=v;})} />
                    <AudioRegel label="8 poorten, gigabit" value={m.switch8port} onChange={(v)=>update(d=>{d.materialen.switch8port=v;})} />
                    <AudioRegel label="5 poorten, PoE gigabit" value={m.switch5portPoe} onChange={(v)=>update(d=>{d.materialen.switch5portPoe=v;})} />
                </UitklapVraag>


                <UitklapVraag
                    label="4. Extra UTP kabel getrokken"
                    actief={m.utpGetrokken === true}
                    onToggle={(v)=>
                        update(draft=>{
                            draft.materialen.utpGetrokken = v;
                        })
                    }
                >
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 pt-1">UTP-kabels (aantal per type)</p>
                    <AudioRegel label="Type 2 (tot 20 meter)" value={m.utpType2} onChange={(v)=>update(d=>{d.materialen.utpType2=v;})} />
                    <AudioRegel label="Type 3 (tot 30 meter)" value={m.utpType3} onChange={(v)=>update(d=>{d.materialen.utpType3=v;})} />
                    <AudioRegel label="Type 4 (tot 40 meter)" value={m.utpType4} onChange={(v)=>update(d=>{d.materialen.utpType4=v;})} />
                    <AudioRegel label="Type 5 (tot 50 meter)" value={m.utpType5} onChange={(v)=>update(d=>{d.materialen.utpType5=v;})} />
                    <AudioRegel label="Type 6 (tot 60 meter)" value={m.utpType6} onChange={(v)=>update(d=>{d.materialen.utpType6=v;})} />
                    <AudioRegel label="Type 7 (tot 70 meter)" value={m.utpType7} onChange={(v)=>update(d=>{d.materialen.utpType7=v;})} />
                </UitklapVraag>


                <UitklapVraag
                    label="5. Extra stroomkabel getrokken"
                    actief={m.stroomkabelGetrokken === true}
                    onToggle={(v)=>
                        update(draft=>{
                            draft.materialen.stroomkabelGetrokken = v;
                        })
                    }
                >
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 pt-1">Stroomkabels (aantal per type)</p>
                    <AudioRegel label="Type 1 (tot 10 meter)" value={m.stroomType1} onChange={(v)=>update(d=>{d.materialen.stroomType1=v;})} />
                    <AudioRegel label="Type 2 (tot 20 meter)" value={m.stroomType2} onChange={(v)=>update(d=>{d.materialen.stroomType2=v;})} />
                    <AudioRegel label="Type 3 (tot 30 meter)" value={m.stroomType3} onChange={(v)=>update(d=>{d.materialen.stroomType3=v;})} />
                </UitklapVraag>


                <UitklapVraag
                    label="6. Verlengsnoeren (stekkerdozen) gebruikt"
                    actief={m.verlengsnoeren === true}
                    onToggle={(v)=>
                        update(draft=>{
                            draft.materialen.verlengsnoeren = v;
                        })
                    }
                >
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 pt-1">Aantal per soort</p>
                    <AudioRegel label="3-voudig, 1,5 meter" value={m.verleng15} onChange={(v)=>update(d=>{d.materialen.verleng15=v;})} />
                    <AudioRegel label="3-voudig, 3 meter" value={m.verleng3} onChange={(v)=>update(d=>{d.materialen.verleng3=v;})} />
                    <AudioRegel label="3-voudig, 5 meter" value={m.verleng5} onChange={(v)=>update(d=>{d.materialen.verleng5=v;})} />
                </UitklapVraag>


                <UitklapVraag
                    label="7. Extra seriële en/of USB speakers gebruikt"
                    actief={m.extraSpeakers === true}
                    onToggle={(v)=>
                        update(draft=>{
                            draft.materialen.extraSpeakers = v;
                        })
                    }
                >
                    <AudioRegel label="USB Speakers" value={m.usbSpeakers} onChange={(v)=>update(d=>{d.materialen.usbSpeakers=v;})} />

                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 pt-1">RS232 kabel (aantal per lengte)</p>
                    <AudioRegel label="1 meter" value={m.rs232_1m} onChange={(v)=>update(d=>{d.materialen.rs232_1m=v;})} />
                    <AudioRegel label="5 meter" value={m.rs232_5m} onChange={(v)=>update(d=>{d.materialen.rs232_5m=v;})} />
                    <AudioRegel label="10 meter" value={m.rs232_10m} onChange={(v)=>update(d=>{d.materialen.rs232_10m=v;})} />
                </UitklapVraag>


                <Vraag label="8. Gebruik gemaakt van een multicast set?">
                    <JaNee
                        value={m.multicast}
                        onChange={(v)=>update(draft=>{
                            draft.materialen.multicast = v;
                        })}
                    />
                </Vraag>

                {
                    m.multicast === true && (
                        <div className="mt-2 space-y-2">
                            <AudioRegel label="Zenders" value={m.multicastZenders} onChange={(v)=>update(draft=>{draft.materialen.multicastZenders=v;})} />
                            <AudioRegel label="Ontvangers" value={m.multicastOntvangers} onChange={(v)=>update(draft=>{draft.materialen.multicastOntvangers=v;})} />
                        </div>
                    )
                }


                <div className="pt-3">

                    <span className="
                        block
                        text-sm
                        font-medium
                        text-slate-700
                        mb-2
                    ">
                        Opmerkingen:
                    </span>

                    <textarea

                        value={m.opmerkingen}

                        onChange={(e)=>
                            update(draft=>{
                                draft.materialen.opmerkingen =
                                    e.target.value;
                            })
                        }

                        className="w-full border rounded-xl p-3 min-h-24"

                    />

                </div>

            </div>




            {/* ================= Checklist ================= */}

            <div>

                <Kop>Checklist *</Kop>

                <p className="text-xs text-slate-500 -mt-1 mb-2">
                    Alle checklistvragen zijn verplicht.
                </p>


                {/* 1. Werkend opgeleverd */}
                <ChecklistVraag label="1. Is de installatie werkend opgeleverd?">
                    <JaNee
                        value={c.werkendOpgeleverd}
                        jaKleur="green"
                        neeKleur="red"
                        onChange={(v)=>update(draft=>{
                            draft.checklist.werkendOpgeleverd = v;
                        })}
                    />
                    {
                        c.werkendOpgeleverd === false && (
                            <RedenVeld
                                value={c.redenWerkend}
                                onChange={(v)=>update(draft=>{
                                    draft.checklist.redenWerkend = v;
                                })}
                            />
                        )
                    }
                </ChecklistVraag>


                {/* 2. Lichtnet schakelbaar */}
                <ChecklistVraag label="2. Is de hardware aangesloten op het lichtnet of een ander schakelstroompunt dat handmatig uit te zetten is?">
                    <JaNee
                        value={c.lichtnetSchakelbaar}
                        jaKleur="red"
                        neeKleur="green"
                        onChange={(v)=>update(draft=>{
                            draft.checklist.lichtnetSchakelbaar = v;
                        })}
                    />
                    {
                        c.lichtnetSchakelbaar === true && (
                            <RedenVeld
                                value={c.redenLichtnet}
                                onChange={(v)=>update(draft=>{
                                    draft.checklist.redenLichtnet = v;
                                })}
                            />
                        )
                    }
                </ChecklistVraag>


                {/* 3. WiFi */}
                <ChecklistVraag label="3. WiFi verbinding van toepassing?">
                    <JaNee
                        value={c.wifiVanToepassing}
                        jaKleur="orange"
                        neeKleur="green"
                        onChange={(v)=>update(draft=>{
                            draft.checklist.wifiVanToepassing = v;
                        })}
                    />
                    {
                        c.wifiVanToepassing === true && (
                            <div className="
                                mt-3
                                rounded-xl
                                bg-slate-50
                                border
                                border-slate-100
                                p-3
                                space-y-2
                            ">
                                <p className="text-sm text-slate-600">
                                    Is de WiFi verbinding op moment van installatie sterk genoeg?
                                </p>
                                <Keuze
                                    value={c.wifiSterkte}
                                    options={["Ja","Matig","Slecht"]}
                                    kleuren={{
                                        "Ja":"green",
                                        "Matig":"orange",
                                        "Slecht":"red"
                                    }}
                                    onChange={(v)=>update(draft=>{
                                        draft.checklist.wifiSterkte =
                                            v as OpleverData["checklist"]["wifiSterkte"];
                                    })}
                                />
                            </div>
                        )
                    }
                </ChecklistVraag>


                {/* 4. Remote Services */}
                <ChecklistVraag label="4. Zijn de schermen gekoppeld aan Remote Services?">
                    <Keuze
                        value={c.remoteServices}
                        options={["Ja","Nee","n.v.t."]}
                        kleuren={{
                            "Ja":"green",
                            "Nee":"red",
                            "n.v.t.":"yellow"
                        }}
                        onChange={(v)=>update(draft=>{
                            draft.checklist.remoteServices =
                                v as OpleverData["checklist"]["remoteServices"];
                        })}
                    />
                    {
                        c.remoteServices === "Nee" && (
                            <RedenVeld
                                value={c.redenRemote}
                                onChange={(v)=>update(draft=>{
                                    draft.checklist.redenRemote = v;
                                })}
                            />
                        )
                    }
                </ChecklistVraag>


                {/* 5. Locatie mediaplayer */}
                <ChecklistVraag label="5. Wat is de locatie van de mediaplayer(s)?">
                    <p className="text-sm text-slate-500 -mt-1">
                        Meerdere locaties mogelijk — vink aan en vul het aantal in.
                    </p>
                    <div className="space-y-2">
                        {
                            [
                                "Achter het scherm",
                                "In de patchkast",
                                "Boven het plafond",
                                "Kiosk",
                                "Tizen/WebOS/Android",
                                "Anders"
                            ].map((locatie)=>{

                                const actief =
                                    c.mediaplayerLocaties[locatie] !== undefined;

                                return (
                                    <div
                                        key={locatie}
                                        className="
                                            grid
                                            grid-cols-[13rem_auto]
                                            items-center
                                            gap-3
                                        "
                                    >
                                        <button
                                            type="button"
                                            onClick={()=>update(draft=>{
                                                const huidig = { ...draft.checklist.mediaplayerLocaties };
                                                if(huidig[locatie] !== undefined){
                                                    delete huidig[locatie];
                                                } else {
                                                    huidig[locatie] = "";
                                                }
                                                draft.checklist.mediaplayerLocaties = huidig;
                                            })}
                                            className={`
                                                flex
                                                items-center
                                                gap-2
                                                px-4
                                                py-1.5
                                                rounded-full
                                                border
                                                text-sm
                                                text-left
                                                w-full
                                                transition
                                                ${
                                                    actief
                                                    ?
                                                    "bg-sky-100 border-sky-300 text-sky-800"
                                                    :
                                                    "border-slate-200 text-gray-400 hover:border-slate-300"
                                                }
                                            `}
                                        >
                                            <span className="w-3 shrink-0">{actief ? "✓" : ""}</span>
                                            <span>{locatie}</span>
                                        </button>

                                        <div className={`
                                            flex
                                            items-center
                                            gap-2
                                            ${actief ? "" : "invisible"}
                                        `}>
                                            <span className="text-sm text-slate-500">Aantal:</span>
                                            <input
                                                inputMode="numeric"
                                                value={c.mediaplayerLocaties[locatie] ?? ""}
                                                placeholder="Aantal"
                                                onChange={(e)=>update(draft=>{
                                                    draft.checklist.mediaplayerLocaties = {
                                                        ...draft.checklist.mediaplayerLocaties,
                                                        [locatie]:e.target.value
                                                    };
                                                })}
                                                className="w-20 border rounded-lg p-1.5 text-sm"
                                            />
                                        </div>
                                    </div>
                                );

                            })
                        }
                    </div>
                </ChecklistVraag>


                {/* 6. Afvalverwijdering */}
                <ChecklistVraag label="6. Afvalverwijdering?">
                    <JaNee
                        value={c.afvalverwijdering}
                        jaKleur="red"
                        neeKleur="green"
                        onChange={(v)=>update(draft=>{
                            draft.checklist.afvalverwijdering = v;
                        })}
                    />
                </ChecklistVraag>

            </div>

                </>
              )
            }


            {
              (variant === "volledig" || variant === "evalue8") && (
                <>

            {/* ================= Afronding / oplevering ================= */}

            <div>

                <Kop>Afronding</Kop>

                <div className="space-y-4">

                    <div className="
                        rounded-xl
                        border
                        border-gray-200
                        p-4
                        bg-gray-50
                    ">

                        <span className="text-sm font-medium text-gray-700 mb-2 block">
                            Werkzaamheden gereed?
                        </span>

                        <div className="flex gap-3">

                            <button
                                type="button"
                                onClick={()=>update(draft=>{
                                    draft.afronding.werkzaamhedenGereed = "gereed";
                                })}
                                className={
                                    "flex-1 rounded-xl py-3 px-3 font-bold border-2 transition "
                                    +
                                    (
                                        data.afronding.werkzaamhedenGereed === "gereed"
                                        ?
                                        "bg-green-600 text-white border-green-600"
                                        :
                                        "bg-white text-green-700 border-green-300"
                                    )
                                }
                            >
                                ✓ Gereed
                            </button>

                            <button
                                type="button"
                                onClick={()=>update(draft=>{
                                    draft.afronding.werkzaamhedenGereed = "niet_gereed";
                                })}
                                className={
                                    "flex-1 rounded-xl py-3 px-3 font-bold border-2 transition "
                                    +
                                    (
                                        data.afronding.werkzaamhedenGereed === "niet_gereed"
                                        ?
                                        "bg-red-600 text-white border-red-600"
                                        :
                                        "bg-white text-red-700 border-red-300"
                                    )
                                }
                            >
                                ✕ Niet gereed
                            </button>

                        </div>


                        {
                            data.afronding.werkzaamhedenGereed === "niet_gereed" && (

                                <label className="block mt-4">

                                    <span className="text-sm font-medium text-gray-700 mb-1 block">
                                        Omschrijving — wat moet er nog gebeuren en welke materialen zijn nodig?
                                    </span>

                                    <textarea
                                        rows={4}
                                        value={data.afronding.nietGereedOmschrijving}
                                        onChange={(e)=>update(draft=>{
                                            draft.afronding.nietGereedOmschrijving = e.target.value;
                                        })}
                                        placeholder="Bijv. nog 1 scherm ophangen, ontbrekende muurbeugel bestellen, retour voor nieuwe afspraak"
                                        className="
                                            w-full
                                            border
                                            rounded-xl
                                            p-3
                                        "
                                    />

                                    <span className="block text-xs text-gray-500 mt-1">
                                        Bij het afronden gaat er automatisch een melding naar kantoor
                                        (projects@mdb-networks.nl) om de klus opnieuw in te plannen en materiaal te bestellen.
                                    </span>

                                </label>

                            )
                        }

                    </div>


                    <label className="block">

                        <span className="text-sm font-medium text-gray-700 mb-1 block">
                            Nog af te ronden / vervolgafspraken / advies aan klant
                        </span>

                        <textarea
                            rows={3}
                            value={data.afronding.vervolgafspraken}
                            onChange={(e)=>update(draft=>{
                                draft.afronding.vervolgafspraken = e.target.value;
                            })}
                            className="w-full border rounded-xl p-3"
                        />

                    </label>


                    <label className="block">

                        <span className="text-sm font-medium text-gray-700 mb-1 block">
                            Meerwerk- en materiaal geleverd
                        </span>

                        <textarea
                            rows={3}
                            value={data.afronding.meerwerkMateriaal}
                            onChange={(e)=>update(draft=>{
                                draft.afronding.meerwerkMateriaal = e.target.value;
                            })}
                            className="w-full border rounded-xl p-3"
                        />

                    </label>


                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                        <label className="block">

                            <span className="text-sm font-medium text-gray-700 mb-1 block">
                                Meerarbeid en -materialen geleverd in opdracht van
                            </span>

                            <input
                                value={data.afronding.meerwerkInOpdrachtVan}
                                placeholder="Naam contactpersoon"
                                onChange={(e)=>update(draft=>{
                                    draft.afronding.meerwerkInOpdrachtVan = e.target.value;
                                })}
                                className="w-full border rounded-xl p-3"
                            />

                        </label>


                        <label className="block">

                            <span className="text-sm font-medium text-gray-700 mb-1 block">
                                Netwerkverbinding mediaspelers gecontroleerd door
                            </span>

                            <input
                                value={data.afronding.netwerkGecontroleerdDoor}
                                placeholder="Naam"
                                onChange={(e)=>update(draft=>{
                                    draft.afronding.netwerkGecontroleerdDoor = e.target.value;
                                })}
                                className="w-full border rounded-xl p-3"
                            />

                        </label>

                    </div>

                </div>

            </div>




            {/* ================= Handtekening voor akkoord ================= */}

            <div>

                <Kop>Handtekening voor akkoord</Kop>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">

                    <label className="block">

                        <span className="text-sm font-medium text-gray-700 mb-1 block">
                            Naam contactpersoon
                        </span>

                        <input
                            value={data.afronding.contactpersoon}
                            placeholder="Naam contactpersoon"
                            onChange={(e)=>update(draft=>{
                                draft.afronding.contactpersoon = e.target.value;
                            })}
                            className="w-full border rounded-xl p-3"
                        />

                    </label>


                    <div className="block">

                        <span className="text-sm font-medium text-gray-700 mb-1 block">
                            Handtekening voor akkoord
                        </span>

                        <HandtekeningVak
                            value={data.afronding.handtekening}
                            onChange={(dataUrl)=>update(draft=>{
                                draft.afronding.handtekening = dataUrl;
                            })}
                        />

                    </div>

                </div>

            </div>

                </>
              )
            }



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
