"use client";

import { useEffect, useState } from "react";

import { useParams } from "next/navigation";

import { useSession } from "next-auth/react";

import {
    FormField,
    getFormDefinition
} from "@/constants/formDefinitions";



interface FormDetail {

    id:string;

    type:string;

    title:string;

    status:string;

    createdAt:string;

    data:Record<string,string>;

    user:{

        name:string | null;

    };

}



export default function FormDetailPage(){


    const params =
        useParams();


    const id =
        params.id as string;


    const { data:session } =
        useSession();


    const canManage =
        session?.user?.role === "admin" ||
        session?.user?.role === "office";


    const [busy,setBusy] =
        useState(false);


    const [form,setForm] =
        useState<FormDetail | null>(null);


    const [loading,setLoading] =
        useState(true);




    useEffect(()=>{


        async function load(){


            const response =
                await fetch(
                    `/api/forms/${id}`
                );


            if(response.ok){

                setForm(
                    await response.json()
                );

            }


            setLoading(false);


        }


        load();


    },[id]);




    if(loading){

        return (

            <main className="p-6">

                Formulier laden...

            </main>

        );

    }




    if(!form){

        return (

            <main className="p-6">

                Formulier niet gevonden.

            </main>

        );

    }




    const definition =
        getFormDefinition(form.type);


    async function setStatus(newStatus:string){

        if(!form){
            return;
        }

        setBusy(true);

        try {

            const response =
                await fetch(
                    `/api/forms/${form.id}`,
                    {
                        method:"PUT",
                        headers:{
                            "Content-Type":"application/json"
                        },
                        body:JSON.stringify({
                            status:newStatus
                        })
                    }
                );

            if(response.ok){
                setForm({
                    ...form,
                    status:newStatus
                });
            } else {
                const data =
                    await response.json().catch(()=>({}));
                alert(data.error ?? "Status wijzigen mislukt");
            }

        } finally {
            setBusy(false);
        }

    }




    function renderValue(
        field:FormField
    ){


        const value =
            form?.data?.[field.id] ?? "";


        if(field.type === "kop"){

            return null;

        }


        if(
            field.type === "foto" ||
            field.type === "handtekening"
        ){

            if(!value){
                return (
                    <span className="text-gray-400">—</span>
                );
            }

            return (

                /* eslint-disable-next-line @next/next/no-img-element */
                <img

                    src={value}

                    alt={field.label}

                    className={`
                        border
                        rounded-xl
                        bg-white
                        ${
                            field.type === "handtekening"
                            ?
                            "max-h-32"
                            :
                            "max-h-48"
                        }
                    `}

                />

            );

        }


        if(field.type === "janee"){

            if(!value){
                return (
                    <span className="text-gray-400">—</span>
                );
            }

            return (

                <span className={`
                    px-3
                    py-1
                    rounded-full
                    text-sm
                    text-white
                    ${
                        value === "Ja"
                        ?
                        "bg-green-500"
                        :
                        value === "Nee"
                        ?
                        "bg-sky-400"
                        :
                        "bg-gray-400"
                    }
                `}>

                    {value}

                </span>

            );

        }


        if(field.type === "money"){

            return (

                <strong>

                    {value ? `€ ${value}` : "—"}

                </strong>

            );

        }


        return (

            <span className={
                value
                ?
                "font-medium whitespace-pre-wrap"
                :
                "text-gray-400"
            }>

                {value || "—"}

            </span>

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
                    text-2xl
                    font-bold
                ">

                    {definition?.icon}{" "}
                    {form.title.replace(
                        /,\s*\d{2}-\d{2}-\d{4}\s*$/,
                        ""
                    )}

                </h1>


                <p className="
                    text-gray-500
                ">

                    {
                        new Date(form.createdAt)
                        .toLocaleDateString("nl-NL",{
                            weekday:"long",
                            day:"numeric",
                            month:"long",
                            year:"numeric"
                        })
                    }

                    {" · "}

                    {form.user.name}

                    {" · "}

                    <span className={`
                        px-2
                        py-0.5
                        rounded-full
                        text-xs
                        ${
                            form.status === "geaccepteerd"
                            ?
                            "bg-green-100 text-green-700"
                            :
                            form.status === "afgewezen"
                            ?
                            "bg-red-100 text-red-700"
                            :
                            form.status === "behandeld"
                            ?
                            "bg-blue-100 text-blue-700"
                            :
                            "bg-amber-100 text-amber-700"
                        }
                    `}>

                        {form.status}

                    </span>

                </p>


                {
                    canManage && form.status === "ingediend" && (

                        <div className="
                            flex
                            gap-2
                            mt-3
                            flex-wrap
                        ">

                            {
                                form.type === "verlof" && (

                                    <>

                                        <button

                                            onClick={()=>setStatus("geaccepteerd")}

                                            disabled={busy}

                                            className="
                                                bg-green-600
                                                text-white
                                                rounded-lg
                                                px-4
                                                py-2
                                                text-sm
                                                disabled:opacity-50
                                            "

                                        >

                                            ✓ Accepteren

                                        </button>

                                        <button

                                            onClick={()=>setStatus("afgewezen")}

                                            disabled={busy}

                                            className="
                                                border
                                                border-red-300
                                                text-red-700
                                                rounded-lg
                                                px-4
                                                py-2
                                                text-sm
                                                disabled:opacity-50
                                            "

                                        >

                                            Afwijzen

                                        </button>

                                    </>

                                )
                            }

                            {
                                form.type === "declaratie" && (

                                    <button

                                        onClick={()=>setStatus("behandeld")}

                                        disabled={busy}

                                        className="
                                            bg-blue-600
                                            text-white
                                            rounded-lg
                                            px-4
                                            py-2
                                            text-sm
                                            disabled:opacity-50
                                        "

                                    >

                                        ✓ Markeer als behandeld (terugbetaald)

                                    </button>

                                )
                            }

                            {
                                form.type !== "verlof" && form.type !== "declaratie" && (

                                    <button

                                        onClick={()=>setStatus("behandeld")}

                                        disabled={busy}

                                        className="
                                            bg-black
                                            text-white
                                            rounded-lg
                                            px-4
                                            py-2
                                            text-sm
                                            disabled:opacity-50
                                        "

                                    >

                                        ✓ Markeer als behandeld

                                    </button>

                                )
                            }

                        </div>

                    )
                }


            </header>




            <section className="
                bg-white
                border
                rounded-2xl
                p-5
                space-y-4
            ">

                {
                    definition?.fields.map(field=>{


                        if(field.type === "kop"){

                            return (

                                <h3

                                    key={field.id}

                                    className="
                                        bg-gray-100
                                        font-bold
                                        text-sm
                                        rounded-lg
                                        px-3
                                        py-2
                                        mt-2
                                    "

                                >

                                    {field.label}

                                </h3>

                            );

                        }


                        return (

                            <div

                                key={field.id}

                                className="
                                    flex
                                    flex-col
                                    gap-1
                                    border-b
                                    border-dashed
                                    pb-3
                                "

                            >

                                <span className="
                                    text-sm
                                    text-gray-500
                                ">

                                    {field.label}

                                </span>

                                {renderValue(field)}

                            </div>

                        );


                    })
                }

            </section>


        </main>

    );

}
