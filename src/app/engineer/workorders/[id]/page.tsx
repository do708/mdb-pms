"use client";


import Link from "next/link";

import { useState } from "react";


import {

    ArrowLeft,
    MapPin,
    Camera,
    Package,
    Monitor,
    Save,
    Send,
    FileText,
    PenLine,

} from "lucide-react";



import PhotoUpload from "@/components/mobile/PhotoUpload";

import SignaturePad from "@/components/mobile/SignaturePad";


import MaterialModal, {

    MaterialItem

} from "@/components/mobile/MaterialModal";


import HardwareModal, {

    HardwareItem

} from "@/components/mobile/HardwareModal";





export default function WorkOrderDetailPage({

    params,

}: {

    params:{
        id:string;
    }

}) {



    const [materialModalOpen, setMaterialModalOpen] =
        useState(false);



    const [materials, setMaterials] =
        useState<MaterialItem[]>([]);




    const [hardwareModalOpen, setHardwareModalOpen] =
        useState(false);



    const [hardware, setHardware] =
        useState<HardwareItem[]>([]);




    const [saving, setSaving] =
        useState(false);




    const [saveMessage, setSaveMessage] =
        useState("");




    const [description, setDescription] =
        useState("");





    async function saveWorkorder(){


        try {


            setSaving(true);

            setSaveMessage("");



            const response = await fetch(

                `/api/workorders/${params.id}/save`,

                {

                    method:"PUT",

                    headers:{

                        "Content-Type":
                        "application/json"

                    },


                    body:JSON.stringify({

                        title:"Werkbon",

                        description,

                        materials,

                        hardware

                    })

                }

            );




            const data =
                await response.json();





            if(!response.ok){

                throw new Error(

                    data.error ||

                    "Opslaan mislukt"

                );

            }





            setSaveMessage(

                "✓ Werkbon opgeslagen"

            );





        } catch(error){


            console.error(error);


            setSaveMessage(

                "Opslaan mislukt"

            );


        } finally {


            setSaving(false);

        }


    }






    async function sendWorkorder(){


        try {


            setSaving(true);

            setSaveMessage("");



            const response = await fetch(

                `/api/workorders/${params.id}/pdf/save`,

                {

                    method:"POST"

                }

            );




            const data =
                await response.json();





            if(!response.ok){

                throw new Error(

                    data.error ||

                    "Verzenden mislukt"

                );

            }




            setSaveMessage(

                "✓ Werkbon verzonden"

            );





        } catch(error){


            console.error(error);


            setSaveMessage(

                "Verzenden mislukt"

            );



        } finally {


            setSaving(false);

        }


    }





    return (

        <main className="
            space-y-5
            pb-10
        ">


            <div className="
                flex
                items-center
                gap-3
            ">


                <Link

                    href="/engineer"

                    className="
                        bg-white
                        border
                        rounded-xl
                        p-2
                    "

                >

                    <ArrowLeft size={20}/>

                </Link>



                <div>

                    <p className="
                        text-xs
                        text-gray-500
                    ">

                        Werkbon

                    </p>


                    <h1 className="
                        text-xl
                        font-bold
                    ">

                        WB-2026-001

                    </h1>


                </div>


            </div>            <section className="
                bg-white
                border
                rounded-2xl
                p-5
            ">


                <div className="
                    flex
                    gap-2
                    items-center
                    mb-4
                ">


                    <FileText size={20}/>


                    <h2 className="font-bold">

                        Algemene informatie

                    </h2>


                </div>


                <p className="font-semibold">

                    Pathé Amsterdam

                </p>


                <div className="
                    flex
                    gap-2
                    items-center
                    mt-2
                    text-sm
                    text-gray-500
                ">

                    <MapPin size={16}/>

                    Amsterdam

                </div>


            </section>





            <section className="
                bg-white
                border
                rounded-2xl
                p-5
            ">


                <h2 className="
                    font-bold
                    mb-3
                ">

                    Werkzaamheden

                </h2>



                <textarea

                    value={description}

                    onChange={(e)=>

                        setDescription(

                            e.target.value

                        )

                    }


                    placeholder="Beschrijf de uitgevoerde werkzaamheden..."

                    className="
                        w-full
                        min-h-[140px]
                        border
                        rounded-xl
                        p-4
                    "

                />


            </section>






            <section className="
                bg-white
                border
                rounded-2xl
                p-5
            ">


                <div className="
                    flex
                    gap-2
                    items-center
                    mb-4
                ">


                    <Camera size={20}/>


                    <h2 className="font-bold">

                        Foto's

                    </h2>


                </div>



                <PhotoUpload

                    workorderId={params.id}

                />


            </section>







            <section className="
                bg-white
                border
                rounded-2xl
                p-5
            ">



                <div className="
                    flex
                    gap-2
                    items-center
                ">


                    <Package size={20}/>


                    <h2 className="font-bold">

                        Materialen

                    </h2>


                </div>




                <button

                    onClick={() =>

                        setMaterialModalOpen(true)

                    }


                    className="
                        mt-4
                        text-blue-700
                        font-semibold
                    "

                >

                    + Toevoegen

                </button>



                {materials.length > 0 && (

                    <div className="mt-4 space-y-2">


                        {materials.map((item,index)=>(

                            <div

                                key={index}

                                className="
                                    border
                                    rounded-lg
                                    p-3
                                    text-sm
                                "

                            >

                                {item.name}

                            </div>

                        ))}


                    </div>

                )}



            </section>






            <section className="
                bg-white
                border
                rounded-2xl
                p-5
            ">


                <div className="
                    flex
                    gap-2
                    items-center
                ">


                    <Monitor size={20}/>


                    <h2 className="font-bold">

                        Hardware

                    </h2>


                </div>




                <button

                    onClick={() =>

                        setHardwareModalOpen(true)

                    }


                    className="
                        mt-4
                        text-blue-700
                        font-semibold
                    "

                >

                    + Toevoegen

                </button>



                {hardware.length > 0 && (

                    <div className="mt-4 space-y-2">


                        {hardware.map((item,index)=>(

                            <div

                                key={index}

                                className="
                                    border
                                    rounded-lg
                                    p-3
                                    text-sm
                                "

                            >

                                {item.name}

                            </div>

                        ))}


                    </div>

                )}



            </section>            <section className="
                bg-white
                border
                rounded-2xl
                p-5
            ">


                <div className="
                    flex
                    gap-2
                    items-center
                    mb-4
                ">


                    <PenLine size={20}/>


                    <h2 className="font-bold">

                        Klant akkoord

                    </h2>


                </div>



                <SignaturePad

                    workorderId={params.id}

                />


            </section>






            <button

                onClick={saveWorkorder}

                disabled={saving}

                className="
                    w-full
                    flex
                    justify-center
                    gap-2
                    items-center
                    py-4
                    rounded-xl
                    bg-white
                    border
                    font-semibold
                "

            >

                <Save size={20}/>


                {saving

                    ? "Opslaan..."

                    : "Concept opslaan"

                }


            </button>







            <button

                onClick={sendWorkorder}

                disabled={saving}

                className="
                    w-full
                    flex
                    justify-center
                    gap-2
                    items-center
                    py-4
                    rounded-xl
                    bg-[#12345b]
                    text-white
                    font-semibold
                "

            >

                <Send size={20}/>


                {saving

                    ? "Verzenden..."

                    : "Werkbon verzenden"

                }


            </button>







            {saveMessage && (

                <p className="
                    text-center
                    text-sm
                    text-green-600
                ">

                    {saveMessage}

                </p>

            )}








            <MaterialModal

                open={materialModalOpen}

                onClose={() =>

                    setMaterialModalOpen(false)

                }


                onAdd={(item)=>{


                    setMaterials([

                        ...materials,

                        item

                    ]);

                }}

            />







            <HardwareModal

                open={hardwareModalOpen}

                onClose={() =>

                    setHardwareModalOpen(false)

                }


                onAdd={(item)=>{


                    setHardware([

                        ...hardware,

                        item

                    ]);

                }}

            />



        </main>

    );


}