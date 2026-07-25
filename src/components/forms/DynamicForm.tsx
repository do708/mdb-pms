"use client";

import { useRef, useState } from "react";

import {
    FormDefinition,
    FormField
} from "@/constants/formDefinitions";



export type FormValues =
    Record<string,string>;



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

                setError("Upload mislukt");

            }


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

                type="file"

                accept="image/*"

                capture="environment"

                onChange={(e)=>{

                    const file =
                        e.target.files?.[0];

                    if(file){
                        upload(file);
                    }

                }}

                className="text-sm"

            />

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


    const [values,setValues] =
        useState<FormValues>({});


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


        await onSubmit(values);


    }




    function renderField(
        field:FormField
    ){


        const value =
            values[field.id] ?? "";


        switch(field.type){


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
                            text-sm
                            text-gray-600
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
                            text-sm
                            text-gray-600
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
                            text-sm
                            text-gray-600
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
                            text-sm
                            text-gray-600
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

                        <p className="text-sm">

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

                        <p className="text-sm">

                            {field.label}
                            {field.required ? " *" : ""}

                        </p>

                        <div className="
                            flex
                            flex-wrap
                            gap-2
                        ">

                            {
                                (field.options ?? []).map(option=>(

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

                    </div>

                );


            case "foto":

                return (

                    <div>

                        <p className="
                            text-sm
                            text-gray-600
                            mb-1
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
                            text-sm
                            text-gray-600
                            mb-1
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
                definition.fields.map(field=>(

                    <div key={field.id}>

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
