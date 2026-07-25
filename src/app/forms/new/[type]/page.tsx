"use client";

import { useState } from "react";

import { useParams, useRouter } from "next/navigation";

import DynamicForm, { FormValues } from "@/components/forms/DynamicForm";

import { getFormDefinition } from "@/constants/formDefinitions";



export default function NewFormPage(){


    const params =
        useParams();


    const router =
        useRouter();


    const type =
        params.type as string;


    const definition =
        getFormDefinition(type);


    const [saving,setSaving] =
        useState(false);




    if(!definition){

        return (

            <main className="p-6">

                Onbekend formuliertype.

            </main>

        );

    }




    async function submit(
        values:FormValues
    ){


        setSaving(true);


        try {


            const response =
                await fetch(

                    "/api/forms",

                    {

                        method:"POST",

                        headers:{
                            "Content-Type":"application/json"
                        },

                        body:JSON.stringify({

                            type,

                            data:values

                        })

                    }

                );


            if(response.ok){


                const created =
                    await response.json();


                router.push(
                    `/forms/${created.id}`
                );


            } else {


                alert(
                    "Formulier opslaan mislukt"
                );


            }


        } finally {

            setSaving(false);

        }


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

                    {definition.icon} {definition.label}

                </h1>


                <p className="
                    text-gray-500
                ">

                    {definition.description}

                </p>


            </header>




            <section className="
                bg-white
                border
                rounded-2xl
                p-5
            ">

                <DynamicForm

                    definition={definition}

                    onSubmit={submit}

                    saving={saving}

                />

            </section>


        </main>

    );

}
