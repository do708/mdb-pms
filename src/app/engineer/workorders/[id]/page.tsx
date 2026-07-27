"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import PhotosForm from "@/components/workorders/PhotosForm";
import OpleverForm from "@/components/workorders/OpleverForm";

import { parseCustomerSchema } from "@/types/customerForms";

import type { OpleverData } from "@/types/oplever";
import { sendWorkorderMail } from "@/lib/email/sendWorkorderMail";

interface Workorder {


    id:string;

    number:string;

    title:string;

    description:string | null;

    internalNotes:string | null;

    documents:{

        id:string;

        name:string;

        url:string;

    }[];

    formData:unknown;

    assignedUser:{

        name:string | null;

    } | null;

    extraEngineers?:{
        user:{
            name:string | null;
        };
    }[];

    forms?:{
        formType:{
            key:string;
            name:string;
        };
    }[];

    status:string;

    location:string | null;

    city:string | null;

    customer:{

        name:string;

        address:string | null;

        formSchema?:unknown;

    } | null;


    project:{

        name:string;

        customer:{

            name:string;

            address:string | null;

        };

    } | null;


}







export default function EngineerWorkorderPage(){


    const params = useParams();

    const { data:session } =
        useSession();

    const role =
        session?.user?.role ?? "";

    const isOffice =
        role === "admin" || role === "office";


    const id =
        params.id as string;




    const [workorder,setWorkorder] =
        useState<Workorder | null>(null);



    const [notes,setNotes] =
        useState("");



    const [status,setStatus] =
        useState("ontvangen");


    // Ingevulde opleverdata; wordt via onChange bijgehouden en bij opslaan
    // meegestuurd naar de server.
    const [opleverData,setOpleverData] =
        useState<OpleverData | null>(null);



    const [saving,setSaving] =
        useState(false);



    const [loading,setLoading] =
        useState(true);








    useEffect(()=>{


        async function load(){


            const response =
                await fetch(
                    `/api/workorders/${id}`
                );


            const data =
                await response.json();



            setWorkorder(data);

            setNotes(
                data.description || ""
            );


            setStatus(
                data.status
            );


            setLoading(false);


        }


        load();


    },[id]);









    async function saveWorkorder(){


        setSaving(true);


        try {


            const response =
                await fetch(

                    `/api/workorders/${id}`,

                    {

                        method:"PUT",

                        headers:{

                            "Content-Type":
                            "application/json"

                        },


                        body:JSON.stringify({

                            description:notes,

                            formData:opleverData ?? undefined

                        })

                    }

                );



            if(response.ok){


                alert(
                    "Werkbon opgeslagen"
                );


            } else {


                alert(
                    "Opslaan mislukt"
                );


            }



        } catch(error){


            console.error(error);


            alert(
                "Opslaan mislukt"
            );


        } finally {


            setSaving(false);


        }


    }










    if(loading){


        return (

            <main className="p-5">

                Werkbon laden...

            </main>

        );

    }


async function completeWorkorder(){


    const confirmComplete =
        confirm(
            "Werkbon versturen? De werkbon wordt afgerond, als PDF opgeslagen en kantoor krijgt een melding."
        );


    if(!confirmComplete){

        return;

    }



    try {


        // Eerst de laatst ingevulde opleverdata opslaan, zodat de PDF de
        // actuele gegevens bevat.
        await fetch(
            `/api/workorders/${id}`,
            {
                method:"PUT",
                headers:{
                    "Content-Type":"application/json"
                },
                body:JSON.stringify({
                    description:notes,
                    formData:opleverData ?? undefined
                })
            }
        );


        const completeResponse =
            await fetch(

                `/api/workorders/${id}/complete`,

                {

                    method:"POST"

                }

            );





        if(!completeResponse.ok){


            alert(
                "Werkbon versturen mislukt"
            );


            return;

        }







        const pdfResponse =
            await fetch(

                `/api/workorders/${id}/generate-pdf`,

                {

                    method:"POST"

                }

            );






        if(!pdfResponse.ok){


            alert(
                "PDF genereren mislukt"
            );


            return;

        }








        const pdfData =
            await pdfResponse.json();






        alert(

            "Werkbon verstuurd. Kantoor heeft een melding gekregen."

        );



        setStatus(

            "uitgevoerd"

        );





    } catch(error){


        console.error(error);



        alert(

            "Fout bij versturen werkbon"

        );


    }


}




    if(!workorder){


        return (

            <main className="p-5">

                Werkbon niet gevonden

            </main>

        );

    }









    return (

        <main className="
            p-5
            space-y-5
            bg-gray-50
            min-h-screen
        ">


            <header>


                <div className="
                    flex
                    items-center
                    justify-between
                    gap-3
                ">

                    <h1 className="
                        text-2xl
                        font-bold
                    ">

                        📝 {workorder.number}

                    </h1>


                    {
                        isOffice && (
                            <Link
                                href={`/workorders/${id}/edit`}
                                className="
                                    text-sm
                                    text-blue-600
                                    underline
                                    shrink-0
                                "
                            >
                                Wijzigen
                            </Link>
                        )
                    }

                </div>


            </header>









            <section className="
                bg-white
                rounded-2xl
                border
                p-5
                space-y-3
            ">


                <p>
                    🏢 {
                        workorder.customer?.name
                        ??
                        workorder.project?.customer.name
                        ??
                        "—"
                    }
                </p>


                <p className="text-gray-500">
                    {workorder.title}
                </p>


                {
                    (()=>{

                        const adres =
                            workorder.location
                            ??
                            workorder.customer?.address
                            ??
                            workorder.project?.customer.address
                            ??
                            "";

                        const stad =
                            workorder.city ?? "";

                        const volledig =
                            [adres, stad]
                            .filter(Boolean)
                            .join(", ");

                        if(!volledig){
                            return (
                                <p>📍 Geen locatie</p>
                            );
                        }

                        const mapsUrl =
                            `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(volledig)}`;

                        return (
                            <a
                                href={mapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="
                                    text-blue-600
                                    underline
                                    inline-flex
                                    items-center
                                    gap-1
                                "
                            >
                                📍 {volledig}
                                <span className="text-xs">↗</span>
                            </a>
                        );

                    })()
                }


            </section>









            {workorder.internalNotes && (

                <section className="
                    bg-amber-50
                    border
                    border-amber-300
                    rounded-2xl
                    p-4
                    mb-4
                ">


                    <h2 className="
                        font-bold
                        mb-2
                    ">

                        🔒 Interne notitie

                    </h2>


                    <p className="whitespace-pre-wrap text-sm">

                        {workorder.internalNotes}

                    </p>


                </section>

            )}




            {
                workorder.documents?.length > 0 && (

                    <section className="
                        bg-white
                        border
                        rounded-2xl
                        p-4
                        mb-4
                    ">

                        <h2 className="
                            font-bold
                            mb-2
                        ">

                            📎 Bijlagen van kantoor

                        </h2>


                        <div className="space-y-2">

                            {
                                workorder.documents.map(doc=>{


                                    const isImage =
                                        /\.(png|jpe?g|gif|webp)$/i
                                        .test(doc.name);


                                    return (

                                        <a

                                            key={doc.id}

                                            href={doc.url}

                                            target="_blank"

                                            className="
                                                block
                                                border
                                                rounded-xl
                                                p-2
                                                hover:bg-gray-50
                                            "

                                        >

                                            {
                                                isImage
                                                ?

                                                (
                                                    /* eslint-disable-next-line @next/next/no-img-element */
                                                    <img

                                                        src={doc.url}

                                                        alt={doc.name}

                                                        className="
                                                            max-h-48
                                                            rounded-lg
                                                            mb-1
                                                        "

                                                    />
                                                )
                                                :
                                                null
                                            }

                                            <span className="
                                                text-sm
                                                text-blue-700
                                            ">

                                                📎 {doc.name}

                                            </span>

                                        </a>

                                    );

                                })
                            }

                        </div>

                    </section>

                )
            }




            <section className="
                bg-white
                rounded-2xl
                border
                p-5
            ">


                <h2 className="
                    font-bold
                    mb-3
                ">

                    Werkzaamheden

                </h2>



                <textarea

                    value={notes}

                    onChange={(e)=>
                        setNotes(
                            e.target.value
                        )
                    }


                    className="
                        w-full
                        border
                        rounded-xl
                        p-3
                        min-h-40
                    "

                    placeholder="
                    Beschrijf uitgevoerde werkzaamheden
                    "

                />


           </section>


<OpleverForm

    workorderId={id}

    initial={workorder.formData}

    monteur1Name={workorder.assignedUser?.name ?? null}

    extraEngineerNames={
        (workorder.extraEngineers ?? [])
        .map(e=>e.user?.name)
        .filter((n):n is string => !!n)
    }

    customerSchema={
        parseCustomerSchema(workorder.customer?.formSchema)
    }

    customerName={workorder.customer?.name ?? null}

    embedded

    onChange={setOpleverData}

    variant={
        (workorder.forms ?? [])[0]?.formType?.key === "uren"
        ?
        "uren"
        :
        (workorder.forms ?? [])[0]?.formType?.key === "evalue8"
        ?
        "evalue8"
        :
        "volledig"
    }

/>


<PhotosForm

    workorderId={id}

/>
















            <button

                onClick={completeWorkorder}

                disabled={saving}

                className="
                    w-full
                    bg-green-600
                    text-white
                    rounded-xl
                    py-4
                    font-bold
                    disabled:opacity-50
                "

            >

                📤 Werkbon versturen

            </button>



        </main>

    );


}