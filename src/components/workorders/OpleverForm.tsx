"use client";

import { useEffect, useState } from "react";

import {
    BEUGEL_TYPES,
    SCHERM_FORMATEN,
    ExtraKosten,
    HardwareRegel,
    OpleverData,
    SchermBlok,
    emptyExtraKosten,
    emptySchermBlok,
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
        if(kleur === "red") return "bg-red-500 border-red-500 text-white";
        if(kleur === "orange") return "bg-orange-400 border-orange-400 text-white";
        if(kleur === "sky") return "bg-sky-400 border-sky-400 text-white";
        return "bg-green-500 border-green-500 text-white";
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
                            "bg-blue-600 text-white"
                            :
                            "border border-slate-300 text-slate-500 hover:border-blue-400 hover:text-blue-600"
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

    extraEngineerNames = [],

    customerSchema = null,

    customerName = null,

    embedded = false,

    onChange

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

                    Opleverformulier

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
                    label="Nieuwe schermen geïnstalleerd"
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
                    label="Hergebruikte schermen geïnstalleerd"
                    actief={i.hergebruikteSchermen === true}
                    onToggle={(v)=>
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
                >

                    <SchermBlokken

                        blokken={i.hergebruikteFormaten}

                        onChange={(blokken)=>
                            update(draft=>{
                                draft.installatie.hergebruikteFormaten =
                                    blokken;
                            })
                        }

                    />

                </UitklapVraag>


                <UitklapVraag
                    label="3. Videowall geïnstalleerd"
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
                    label="4. Kiosk geïnstalleerd"
                    actief={i.kiosk === true}
                    onToggle={(v)=>
                        update(draft=>{
                            draft.installatie.kiosk = v;
                        })
                    }
                >

                    <div className="
                        grid
                        grid-cols-1
                        sm:grid-cols-3
                        gap-3
                    ">

                        <div className="sm:col-span-2">
                            <Veld
                                label="Omschrijving"
                                value={i.kioskOmschrijving}
                                onChange={(v)=>
                                    update(draft=>{
                                        draft.installatie.kioskOmschrijving = v;
                                    })
                                }
                            />
                        </div>

                        <Veld
                            label="Aantal"
                            value={i.kioskAantal}
                            onChange={(v)=>
                                update(draft=>{
                                    draft.installatie.kioskAantal = v;
                                })
                            }
                        />

                    </div>

                </UitklapVraag>


                <UitklapVraag
                    label="5. Mediaplayers"
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
                    label="6. Audio geïnstalleerd"
                    actief={i.audio === true}
                    onToggle={(v)=>
                        update(draft=>{
                            draft.installatie.audio = v;
                        })
                    }
                >

                    <div className="
                        grid
                        grid-cols-1
                        sm:grid-cols-3
                        gap-3
                    ">

                        <div className="sm:col-span-2">
                            <Veld
                                label="Omschrijving"
                                value={i.audioOmschrijving}
                                onChange={(v)=>
                                    update(draft=>{
                                        draft.installatie.audioOmschrijving = v;
                                    })
                                }
                            />
                        </div>

                        <Veld
                            label="Aantal"
                            value={i.audioAantal}
                            onChange={(v)=>
                                update(draft=>{
                                    draft.installatie.audioAantal = v;
                                })
                            }
                        />

                    </div>

                </UitklapVraag>


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




            {/* ================= Hardware geïnstalleerd/ontmanteld ================= */}

            <div>

                <Kop>Hardware geïnstalleerd / ontmanteld</Kop>

                <div className="overflow-x-auto">

                    <table className="w-full text-sm border-collapse">

                        <thead>

                            <tr className="bg-gray-50">

                                <th className="border p-2 text-left font-medium text-gray-600 w-48">
                                    Geïnstalleerd / ontmanteld
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
                                                <option value="Ontmanteld">Ontmanteld</option>
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

                <Kop>Checklist</Kop>


                <Vraag label="1. Is de installatie werkend opgeleverd?">

                    <JaNee

                        value={c.werkendOpgeleverd}

                        jaKleur="green"

                        neeKleur="red"

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

                        jaKleur="red"

                        neeKleur="green"

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

                        jaKleur="orange"

                        neeKleur="sky"

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


            {/* ================= Afronding / oplevering ================= */}

            <div>

                <Kop>Afronding</Kop>

                <div className="space-y-4">

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

                        <div className="
                            border
                            border-dashed
                            rounded-xl
                            h-28
                            flex
                            items-center
                            justify-center
                            text-center
                            text-gray-400
                            text-sm
                            bg-gray-50
                            px-4
                        ">
                            De klant zet de handtekening bij het onderdeel
                            &quot;Handtekening klant&quot; onderaan de werkbon.
                        </div>

                    </div>

                </div>

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
