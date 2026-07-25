"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import DeleteButton from "@/components/DeleteButton";

import { FORM_DEFINITIONS } from "@/constants/formDefinitions";



interface FormItem {

    id:string;

    type:string;

    title:string;

    status:string;

    createdAt:string;

    user:{

        name:string | null;

    };

}



export default function FormsPage(){


    const [forms,setForms] =
        useState<FormItem[]>([]);


    const [loading,setLoading] =
        useState(true);




    async function load(){


        const response =
            await fetch("/api/forms");


        const data =
            await response.json();


        setForms(
            Array.isArray(data)
            ?
            data
            :
            []
        );


        setLoading(false);

    }


    useEffect(()=>{

        load();

    },[]);




    return (

        <main className="
            p-6
            space-y-6
        ">


            <header>


                <h1 className="
                    text-2xl
                    font-bold
                ">

                    Formulieren

                </h1>


                <p className="
                    text-gray-500
                ">

                    Declaraties, verlofaanvragen en inspecties

                </p>


            </header>




            <section className="
                grid
                grid-cols-1
                md:grid-cols-3
                gap-4
            ">

                {
                    FORM_DEFINITIONS.map(definition=>(


                        <Link

                            key={definition.type}

                            href={`/forms/new/${definition.type}`}

                            className="
                                bg-white
                                border
                                rounded-xl
                                p-4
                                hover:bg-gray-50
                            "

                        >


                            <p className="
                                text-3xl
                                mb-2
                            ">

                                {definition.icon}

                            </p>


                            <p className="font-bold">

                                {definition.label}

                            </p>


                            <p className="
                                text-sm
                                text-gray-500
                            ">

                                {definition.description}

                            </p>


                        </Link>


                    ))
                }

            </section>




            <section className="
                bg-white
                border
                rounded-xl
                p-4
            ">


                <h2 className="
                    font-bold
                    mb-3
                ">

                    📋 Ingediende formulieren

                </h2>


                {
                    loading && (

                        <p className="text-gray-500">

                            Laden...

                        </p>

                    )
                }


                {
                    !loading &&
                    forms.length === 0 && (

                        <p className="text-gray-500">

                            Nog geen formulieren ingediend.

                        </p>

                    )
                }


                <div className="space-y-3">

                    {
                        forms.map(form=>(


                          <div

                            key={form.id}

                            className="
                                flex
                                items-center
                                gap-2
                            "

                          >

                            <Link

                                href={`/forms/${form.id}`}

                                className="
                                    flex-1
                                    flex
                                    justify-between
                                    items-center
                                    border
                                    rounded-xl
                                    p-3
                                    hover:bg-gray-50
                                "

                            >


                                <div>

                                    <p className="font-bold">

                                        {form.title}

                                    </p>

                                    <p className="
                                        text-sm
                                        text-gray-500
                                    ">

                                        {
                                            new Date(form.createdAt)
                                            .toLocaleDateString("nl-NL")
                                        }

                                        {" · "}

                                        {form.user.name}

                                    </p>

                                </div>


                                <span className="
                                    text-sm
                                    bg-gray-100
                                    rounded-full
                                    px-3
                                    py-1
                                ">

                                    {form.status}

                                </span>


                            </Link>


                            <DeleteButton

                                url={`/api/forms/${form.id}`}

                                label={`formulier "${form.title}"`}

                                onDeleted={load}

                                compact

                            />

                          </div>


                        ))
                    }

                </div>


            </section>


        </main>

    );

}
