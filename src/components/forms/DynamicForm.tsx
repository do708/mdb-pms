"use client";

import { useRef, useState } from "react";
import { useSession } from "next-auth/react";

import {
    FormDefinition,
    FormField
} from "@/constants/formDefinitions";



export type FormValues =
    Record<string,string>;


// Zachte pastelkleuren voor keuze-opties. Elke optie krijgt op volgorde een
// eigen kleur; geselecteerd wat voller, niet-geselecteerd heel licht.
const KEUZE_PASTELS:{ actief:string; rust:string }[] = [
    { actief:"bg-sky-100 border-sky-300 text-sky-800",         rust:"bg-sky-50 border-sky-200 text-sky-700" },
    { actief:"bg-emerald-100 border-emerald-300 text-emerald-800", rust:"bg-emerald-50 border-emerald-200 text-emerald-700" },
    { actief:"bg-amber-100 border-amber-300 text-amber-800",   rust:"bg-amber-50 border-amber-200 text-amber-700" },
    { actief:"bg-violet-100 border-violet-300 text-violet-800", rust:"bg-violet-50 border-violet-200 text-violet-700" },
    { actief:"bg-rose-100 border-rose-300 text-rose-800",      rust:"bg-rose-50 border-rose-200 text-rose-700" },
    { actief:"bg-teal-100 border-teal-300 text-teal-800",      rust:"bg-teal-50 border-teal-200 text-teal-700" }
];



interface Props {

    definition:FormDefinition;

    onSubmit:(values:FormValues)=>Promise<void>;

    saving:boolean;

}



// ---------- handtekeningveld ----------

function SignatureField({

    value,

    onChange

}:{

    value:string;

    onChange:(value:string)=>void;

}){


    const canvasRef =
        useRef<HTMLCanvasElement | null>(null);


    const drawing =
        useRef(false);




    function position(
        event:React.PointerEvent
    ){

        const canvas =
            canvasRef.current!;

        const rect =
            canvas.getBoundingClientRect();

        return {
            x:
                (event.clientX - rect.left) *
                (canvas.width / rect.width),
            y:
                (event.clientY - rect.top) *
                (canvas.height / rect.height)
        };

    }


    function start(
        event:React.PointerEvent
    ){

        drawing.current = true;

        const context =
            canvasRef.current!.getContext("2d")!;

        const { x,y } =
            position(event);

        context.beginPath();

        context.moveTo(x,y);

    }


    function move(
        event:React.PointerEvent
    ){

        if(!drawing.current){
            return;
        }

        const context =
            canvasRef.current!.getContext("2d")!;

        const { x,y } =
            position(event);

        context.lineWidth = 2;

        context.lineCap = "round";

        context.lineTo(x,y);

        context.stroke();

    }


    function end(){

        if(!drawing.current){
            return;
        }

        drawing.current = false;

        onChange(
            canvasRef.current!.toDataURL("image/png")
        );

    }


    function clear(){

        const canvas =
            canvasRef.current!;

        canvas
        .getContext("2d")!
        .clearRect(0,0,canvas.width,canvas.height);

        onChange("");

    }




    return (

        <div>

            <canvas

                ref={canvasRef}

                width={500}

                height={180}

                onPointerDown={start}

                onPointerMove={move}

                onPointerUp={end}

                onPointerLeave={end}

                className="
                    w-full
                    max-w-md
                    border
                    rounded-xl
                    bg-white
                    touch-none
                "

            />

            <div className="
                flex
                gap-3
                mt-1
                items-center
            ">

                <button

                    type="button"

                    onClick={clear}

                    className="
                        text-sm
                        text-gray-500
                        underline
                    "

                >

                    Wissen

                </button>

                {
                    value && (

                        <span className="
                            text-sm
                            text-green-600
                        ">

                            ✓ Handtekening gezet

                        </span>

                    )
                }

            </div>

        </div>

    );

}



// ---------- fotoveld ----------

function PhotoField({

    value,

    onChange

}:{

    value:string;

    onChange:(value:string)=>void;

}){


    const [uploading,setUploading] =
        useState(false);


    const [error,setError] =
        useState("");


    const photoRef =
        useRef<HTMLInputElement | null>(null);




    async function upload(
        file:File
    ){

        setUploading(true);

        setError("");


        try {


            const body =
                new FormData();

            body.append("file",file);


            const response =
                await fetch(
                    "/api/upload",
                    {
                        method:"POST",
                        body
                    }
                );


            const data =
                await response.json();


            if(
                response.ok &&
                data.url
            ){

                onChange(data.url);

            } else {

                setError(
                    data?.error
                    ?
                    `Upload mislukt: ${data.error}`
                    :
                    "Upload mislukt"
                );

            }


        } catch(err){

            setError(
                "Upload mislukt (netwerk of server)."
            );
            console.error("Foto-upload fout:", err);

        } finally {

            setUploading(false);

        }


    }




    return (

        <div className="space-y-2">

            {
                value && (

                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img

                        src={value}

                        alt="Foto"

                        className="
                            max-h-48
                            rounded-xl
                            border
                        "

                    />

                )
            }

            <input

                ref={photoRef}

                type="file"

                accept="image/*"

                onChange={(e)=>{

                    const file =
                        e.target.files?.[0];

                    if(file){
                        upload(file);
                    }

                    e.target.value = "";

                }}

                className="hidden"

            />


            <button

                type="button"

                onClick={()=>photoRef.current?.click()}

                className="
                    border-2
                    border-dashed
                    border-gray-300
                    rounded-xl
                    px-4
                    py-3
                    text-sm
                    text-gray-600
                    hover:bg-gray-50
                "

            >

                📷 {value ? "Foto vervangen" : "Foto toevoegen"}

            </button>

            {
                uploading && (

                    <p className="
                        text-sm
                        text-gray-500
                    ">

                        Bezig met uploaden...

                    </p>

                )
            }

            {
                error && (

                    <p className="
                        text-sm
                        text-red-600
                    ">

                        {error}

                    </p>

                )
            }

        </div>

    );

}



// ---------- het formulier ----------

export default function DynamicForm({

    definition,

    onSubmit,

    saving

}:Props){


    const { data:session } =
        useSession();

    const monteurNaam =
        session?.user?.name ?? "";


    const [values,setValues] =
        useState<FormValues>(()=>{

            const start:FormValues = {};

            // Datum/tijd-velden standaard vullen met nu (lokale tijd),
            // in het formaat dat datetime-local verwacht: YYYY-MM-DDTHH:mm
            const now = new Date();
            const pad = (n:number)=> String(n).padStart(2,"0");
            const lokaleDatum =
                `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;

            const lokaalNu =
                `${lokaleDatum}T${pad(now.getHours())}:${pad(now.getMinutes())}`;

            for(const field of definition.fields){

                // Datum/tijd-velden standaard op nu.
                if(field.type === "datetime"){
                    start[field.id] = lokaalNu;
                }

                // Datumvelden met defaultToday standaard op vandaag.
                if(field.type === "date" && field.defaultToday){
                    start[field.id] = lokaleDatum;
                }

            }

            return start;

        });


    const [error,setError] =
        useState("");




    function set(
        id:string,
        value:string
    ){

        setValues(previous=>({
            ...previous,
            [id]:value
        }));

        setError("");

    }




    async function submit(){


        for(const field of definition.fields){


            if(
                field.required &&
                !values[field.id]
            ){

                setError(
                    `Vul "${field.label}" in`
                );

                window.scrollTo({
                    top:0,
                    behavior:"smooth"
                });

                return;

            }


        }


        // Monteur-velden vullen met de naam van de ingelogde gebruiker,
        // zodat die wordt meegestuurd bij het opslaan.
        const teVersturen = { ...values };
        for(const field of definition.fields){
            if(field.type === "monteur"){
                teVersturen[field.id] = monteurNaam;
            }
        }


        await onSubmit(teVersturen);


    }




    function renderField(
        field:FormField
    ){


        const value =
            values[field.id] ?? "";


        switch(field.type){


            case "monteur":

                return (

                    <div className="block">

                        <span className="
                            block
                            text-sm
                            font-medium
                            text-slate-700
                            mb-1.5
                        ">
                            {field.label}
                        </span>

                        <p className="
                            w-full
                            border
                            rounded-xl
                            p-3
                            mt-1
                            bg-gray-50
                            text-gray-800
                        ">
                            {monteurNaam || "—"}
                        </p>

                    </div>

                );


            case "datetime":

                return (

                    <label className="block">

                        <span className="
                            block
                            text-sm
                            font-medium
                            text-slate-700
                            mb-1.5
                        ">
                            {field.label}
                            {field.required ? " *" : ""}
                        </span>

                        <input

                            type="datetime-local"

                            value={value}

                            onChange={(e)=>
                                set(field.id,e.target.value)
                            }

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

                );


            case "kop":

                return (

                    <h3 className="
                        bg-gray-100
                        font-bold
                        text-sm
                        rounded-lg
                        px-3
                        py-2
                        mt-2
                    ">

                        {field.label}

                    </h3>

                );


            case "text":

                return (

                    <label className="block">

                        <span className="
                            block
                            text-sm
                            font-medium
                            text-slate-700
                            mb-1.5
                        ">

                            {field.label}
                            {field.required ? " *" : ""}

                        </span>

                        <input

                            value={value}

                            onChange={(e)=>
                                set(field.id,e.target.value)
                            }

                            className="
                                w-full
                                border
                                rounded-xl
                                p-3
                                mt-1
                            "

                        />

                    </label>

                );


            case "textarea":

                return (

                    <label className="block">

                        <span className="
                            block
                            text-sm
                            font-medium
                            text-slate-700
                            mb-1.5
                        ">

                            {field.label}

                        </span>

                        <textarea

                            value={value}

                            onChange={(e)=>
                                set(field.id,e.target.value)
                            }

                            className="
                                w-full
                                border
                                rounded-xl
                                p-3
                                mt-1
                                min-h-20
                            "

                        />

                    </label>

                );


            case "date":

                return (

                    <label className="block">

                        <span className="
                            block
                            text-sm
                            font-medium
                            text-slate-700
                            mb-1.5
                        ">

                            {field.label}
                            {field.required ? " *" : ""}

                        </span>

                        <input

                            type="date"

                            value={value}

                            onChange={(e)=>
                                set(field.id,e.target.value)
                            }

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

                );


            case "money":

                return (

                    <label className="block">

                        <span className="
                            block
                            text-sm
                            font-medium
                            text-slate-700
                            mb-1.5
                        ">

                            {field.label}
                            {field.required ? " *" : ""}

                        </span>

                        <div className="
                            flex
                            items-center
                            gap-2
                            mt-1
                        ">

                            <span>€</span>

                            <input

                                inputMode="decimal"

                                value={value}

                                onChange={(e)=>
                                    set(field.id,e.target.value)
                                }

                                className="
                                    w-40
                                    border
                                    rounded-xl
                                    p-3
                                "

                            />

                        </div>

                    </label>

                );


            case "janee": {

                const options =
                    field.nvt
                    ?
                    ["Ja","Nee","n.v.t."]
                    :
                    ["Ja","Nee"];

                return (

                    <div className="
                        border-b
                        border-dashed
                        pb-3
                        space-y-2
                    ">

                        <p className="
                            block
                            text-sm
                            font-medium
                            text-slate-700
                            mb-1.5
                        ">

                            {field.label}

                        </p>

                        <div className="
                            flex
                            gap-2
                        ">

                            {
                                options.map(option=>(

                                    <button

                                        key={option}

                                        type="button"

                                        onClick={()=>
                                            set(field.id,option)
                                        }

                                        className={`
                                            px-4
                                            py-1.5
                                            rounded-full
                                            border
                                            text-sm
                                            ${
                                                value === option
                                                ?
                                                option === "Ja"
                                                ?
                                                "bg-green-500 border-green-500 text-white"
                                                :
                                                option === "Nee"
                                                ?
                                                "bg-sky-400 border-sky-400 text-white"
                                                :
                                                "bg-gray-400 border-gray-400 text-white"
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

                    </div>

                );

            }


            case "keuze":

                return (

                    <div className="space-y-2">

                        <p className="
                            block
                            text-sm
                            font-medium
                            text-slate-700
                            mb-1.5
                        ">

                            {field.label}
                            {field.required ? " *" : ""}

                        </p>

                        <div className="
                            flex
                            flex-wrap
                            gap-2
                        ">

                            {
                                (field.options ?? []).map((option,optieIndex)=>{

                                    const pastel =
                                        KEUZE_PASTELS[optieIndex % KEUZE_PASTELS.length];

                                    const gekozen =
                                        value === option;

                                    return (

                                    <button

                                        key={option}

                                        type="button"

                                        onClick={()=>
                                            set(field.id,option)
                                        }

                                        className={`
                                            px-4
                                            py-1.5
                                            rounded-full
                                            border
                                            text-sm
                                            transition
                                            ${
                                                gekozen
                                                ?
                                                `${pastel.actief} ring-2 ring-offset-1 ring-slate-300 font-medium`
                                                :
                                                `${pastel.rust} opacity-70`
                                            }
                                        `}

                                    >

                                        {option}

                                    </button>

                                    );

                                })
                            }

                        </div>

                    </div>

                );


            case "foto":

                return (

                    <div>

                        <p className="
                            block
                            text-sm
                            font-medium
                            text-slate-700
                            mb-1.5
                        ">

                            📷 {field.label}
                            {field.required ? " *" : ""}

                        </p>

                        <PhotoField

                            value={value}

                            onChange={(v)=>
                                set(field.id,v)
                            }

                        />

                    </div>

                );


            case "handtekening":

                return (

                    <div>

                        <p className="
                            block
                            text-sm
                            font-medium
                            text-slate-700
                            mb-1.5
                        ">

                            ✍️ {field.label}
                            {field.required ? " *" : ""}

                        </p>

                        <SignatureField

                            value={value}

                            onChange={(v)=>
                                set(field.id,v)
                            }

                        />

                    </div>

                );


        }

    }




    return (

        <div className="space-y-5">


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


            {
                definition.fields.map((field,index)=>(

                    <div
                        key={field.id}
                        className={
                            index === 0
                            ?
                            ""
                            :
                            "pt-5 border-t border-slate-100"
                        }
                    >

                        {renderField(field)}

                    </div>

                ))
            }


            <button

                onClick={submit}

                disabled={saving}

                className="
                    w-full
                    bg-black
                    text-white
                    rounded-xl
                    px-5
                    py-4
                    font-bold
                    disabled:opacity-50
                "

            >

                {
                    saving
                    ?
                    "Bezig met opslaan..."
                    :
                    `✓ ${definition.label} indienen`
                }

            </button>


        </div>

    );

}
