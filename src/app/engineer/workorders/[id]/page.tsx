"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import HoursForm from "@/components/workorders/HoursForm";
import PhotosForm from "@/components/workorders/PhotosForm";
import SignatureForm from "@/components/workorders/SignatureForm";
import { sendWorkorderMail } from "@/lib/email/sendWorkorderMail";

interface Workorder {


    id:string;

    number:string;

    title:string;

    description:string | null;

    internalNotes:string | null;

    status:string;


    project:{

        name:string;

        customer:{

            name:string;

            address:string | null;

        };

    };


}







export default function EngineerWorkorderPage(){


    const params = useParams();


    const id =
        params.id as string;




    const [workorder,setWorkorder] =
        useState<Workorder | null>(null);



    const [notes,setNotes] =
        useState("");



    const [status,setStatus] =
        useState("open");



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

                            description:notes

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
            "Werkbon afronden?"
        );


    if(!confirmComplete){

        return;

    }



    try {


        const completeResponse =
            await fetch(

                `/api/workorders/${id}/complete`,

                {

                    method:"POST"

                }

            );





        if(!completeResponse.ok){


            alert(
                "Werkbon afronden mislukt"
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

            "Werkbon afgerond en PDF opgeslagen"

        );



        setStatus(

            "afgerond"

        );





    } catch(error){


        console.error(error);



        alert(

            "Fout bij afronden werkbon"

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


                <h1 className="
                    text-2xl
                    font-bold
                ">

                    📝 {workorder.number}

                </h1>


                <p className="text-gray-500">

                    {workorder.title}

                </p>


            </header>









            <section className="
                bg-white
                rounded-2xl
                border
                p-5
                space-y-3
            ">


                <p>
                    🏢 {workorder.project.customer.name}
                </p>


                <p>
                    📍 {

                        workorder.project.customer.address
                        ||
                        "Geen adres"

                    }
                </p>


                <p>
                    📁 {workorder.project.name}
                </p>


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


<HoursForm

    workorderId={id}

/>


<PhotosForm

    workorderId={id}

/>


<SignatureForm

    workorderId={id}

/>






            <section className="
                bg-white
                rounded-2xl
                border
                p-5
            ">


                <h2 className="font-bold mb-3">

                    Status

                </h2>



                <select

                    value={status}

                    onChange={(e)=>
                        setStatus(
                            e.target.value
                        )
                    }


                    className="
                        w-full
                        border
                        rounded-xl
                        p-3
                    "

                >

                    <option value="open">

                        Open

                    </option>


                    <option value="in_uitvoering">

                        In uitvoering

                    </option>


                    <option value="afgerond">

                        Afgerond

                    </option>


                </select>


            </section>









            <button

                onClick={saveWorkorder}

                disabled={saving}


                className="
                    w-full
                    bg-black
                    text-white
                    rounded-xl
                    py-4
                    font-bold
                "

            >

                {
                    saving
                    ?
                    "Opslaan..."
                    :
                    "💾 Werkbon opslaan"
                }


            </button>

<button

    onClick={completeWorkorder}


    className="
        w-full
        bg-green-600
        text-white
        rounded-xl
        py-4
        font-bold
    "

>

    ✅ Werkbon afronden

</button>



        </main>

    );


}