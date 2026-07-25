"use client";

import { useEffect, useState } from "react";

import { useParams } from "next/navigation";

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

                    {definition?.icon} {form.title}

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

                    {form.status}

                </p>


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
