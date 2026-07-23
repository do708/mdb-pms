"use client";

import { useEffect, useState } from "react";


interface Workorder {

    id:string;

    number:string;

    title:string;

    description:string | null;

    status:string;


    project:{

        name:string;

        customer:{

            name:string;

            address:string | null;

        };

    };


    assignment?:{

        internalNotes:string | null;

    };

}





export default function EngineerWorkorderPage({

    params

}:{

    params:{
        id:string;
    }

}){


    const [workorder,setWorkorder] =
        useState<Workorder | null>(null);



    const [loading,setLoading] =
        useState(true);



    const [notes,setNotes] =
        useState("");



    const [hours,setHours] =
        useState("");



    const [status,setStatus] =
        useState("open");



    const [saving,setSaving] =
        useState(false);






    useEffect(()=>{


        async function load(){


            const response =
                await fetch(
                    `/api/workorders/${params.id}`
                );


            const data =
                await response.json();



            setWorkorder(data);



            setNotes(
                data.description || ""
            );


            setStatus(
                data.status || "open"
            );



            setLoading(false);


        }



        load();



    },[params.id]);







    async function saveWorkorder(){


        setSaving(true);



        try {


            await fetch(

                `/api/workorders/${params.id}/save`,

                {

                    method:"POST",

                    headers:{

                        "Content-Type":"application/json"

                    },

                    body:JSON.stringify({

                        description:notes,

                        hours:Number(hours),

                        status:status

                    })

                }

            );



            alert(
                "Werkbon opgeslagen"
            );



        } catch(error){


            console.error(
                error
            );


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

                    📝 Werkbon

                </h1>


                <p className="text-gray-500">

                    {workorder.number}

                </p>

            </header>







            <section className="
                bg-white
                border
                rounded-2xl
                p-5
                space-y-3
            ">


                <h2 className="
                    text-xl
                    font-bold
                ">

                    {workorder.title}

                </h2>



                <p>

                    🏢 {workorder.project.customer.name}

                </p>



                <p>

                    📍

                    {" "}

                    {
                        workorder.project.customer.address
                        ||
                        "Geen adres"
                    }

                </p>



                <p>

                    📁 {workorder.project.name}

                </p>


            </section>








            <section className="
                bg-white
                border
                rounded-2xl
                p-5
                space-y-3
            ">


                <h2 className="font-bold">

                    Werkzaamheden

                </h2>



                <textarea

                    value={notes}

                    onChange={(e)=>
                        setNotes(
                            e.target.value
                        )
                    }


                    placeholder="
                    Beschrijf uitgevoerde werkzaamheden...
                    "


                    className="
                        w-full
                        border
                        rounded-xl
                        p-3
                        min-h-32
                    "

                />


            </section>








            <section className="
                bg-white
                border
                rounded-2xl
                p-5
                space-y-3
            ">


                <h2 className="font-bold">

                    ⏱️ Urenregistratie

                </h2>



                <input

                    type="number"

                    value={hours}

                    onChange={(e)=>
                        setHours(
                            e.target.value
                        )
                    }


                    placeholder="Aantal uren"


                    className="
                        w-full
                        border
                        rounded-xl
                        p-3
                    "

                />


            </section>








            {
                workorder.assignment?.internalNotes && (

                    <section className="
                        bg-yellow-100
                        border
                        border-yellow-300
                        rounded-2xl
                        p-5
                    ">


                        <h2 className="font-bold">

                            📌 Interne notitie

                        </h2>



                        <p>

                            {
                                workorder.assignment.internalNotes
                            }

                        </p>


                    </section>

                )
            }








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


            </button>            <section className="
                bg-white
                border
                rounded-2xl
                p-5
                space-y-3
            ">


                <h2 className="font-bold">

                    📷 Foto's

                </h2>



                <button

                    className="
                        border
                        rounded-xl
                        px-4
                        py-3
                    "

                >

                    Foto toevoegen

                </button>


            </section>








            <section className="
                bg-white
                border
                rounded-2xl
                p-5
                space-y-3
            ">


                <h2 className="font-bold">

                    ✍️ Handtekening klant

                </h2>



                <div className="
                    h-40
                    border
                    rounded-xl
                    flex
                    items-center
                    justify-center
                    text-gray-400
                ">


                    Handtekening veld


                </div>


            </section>









            <section className="
                bg-white
                border
                rounded-2xl
                p-5
                space-y-3
            ">


                <h2 className="font-bold">

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