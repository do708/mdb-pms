"use client";

import { useEffect, useState } from "react";
import DeleteButton from "@/components/DeleteButton";

import {
    FileText,
    ExternalLink
} from "lucide-react";



interface DocumentItem {

    id:string;

    name:string;

    type:string;

    url:string;

    createdAt:string;

    workorder?:{

        number:string;

        project?:{

            name:string;

            customer?:{

                name:string;

            }

        }

    }

}





export default function DocumentsPage(){


    const [documents,setDocuments] =
        useState<DocumentItem[]>([]);


    const [loading,setLoading] =
        useState(true);





    async function loadDocuments(){


        const response =
            await fetch("/api/documents");


        const data =
            await response.json();


        setDocuments(data);


        setLoading(false);

    }


    useEffect(()=>{

        loadDocuments();

    },[]);






    return (

        <main className="
            space-y-6
            p-6
        ">


            <div>

                <h1 className="
                    text-2xl
                    font-bold
                ">

                    Documenten

                </h1>


                <p className="
                    text-gray-500
                ">

                    Werkbonnen, rapporten en bestanden

                </p>


            </div>





            <section className="
                bg-white
                border
                rounded-2xl
                p-5
            ">



                <h2 className="
                    font-bold
                    mb-4
                ">

                    Document overzicht

                </h2>





                {loading && (

                    <p>
                        Laden...
                    </p>

                )}





                {!loading && documents.length === 0 && (

                    <p className="text-gray-500">

                        Nog geen documenten beschikbaar.

                    </p>

                )}






                <div className="
                    space-y-3
                ">


                    {documents.map((doc)=>(


                        <div

                            key={doc.id}

                            className="
                                border
                                rounded-xl
                                p-4
                                flex
                                items-center
                                justify-between
                            "

                        >


                            <div className="
                                flex
                                gap-3
                                items-center
                            ">


                                <FileText size={24}/>



                                <div>


                                    <p className="font-semibold">

                                        {doc.name}

                                    </p>


                                    <p className="
                                        text-sm
                                        text-gray-500
                                    ">

                                        {doc.workorder?.number ?? ""}
                                        
                                        {" "}

                                        {doc.workorder?.project?.customer?.name ?? ""}

                                    </p>


                                </div>


                            </div>





                            <div className="
                                flex
                                gap-4
                                items-center
                            ">

                                <a

                                    href={doc.url}

                                    target="_blank"

                                    className="
                                        text-blue-700
                                        flex
                                        gap-2
                                        items-center
                                    "

                                >

                                    Open

                                    <ExternalLink size={16}/>

                                </a>


                                <DeleteButton

                                    url={`/api/documents/${doc.id}`}

                                    label={`document "${doc.name}"`}

                                    onDeleted={loadDocuments}

                                    compact

                                />

                            </div>



                        </div>


                    ))}


                </div>



            </section>


        </main>

    );

}