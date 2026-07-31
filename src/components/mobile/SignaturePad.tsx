"use client";

import { useRef, useState } from "react";

import SignatureCanvas from "react-signature-canvas";

import { Save, Eraser } from "lucide-react";


interface SignaturePadProps {

    workorderId:string;

}





export default function SignaturePad({

    workorderId

}:SignaturePadProps) {


    const sigRef = useRef<any>(null);


    const [saving, setSaving] =
        useState(false);


    const [message, setMessage] =
        useState("");





    function clearSignature(){

        sigRef.current?.clear();

    }






    async function saveSignature(){


        if(sigRef.current?.isEmpty()){


            setMessage(
                "Geen handtekening aanwezig"
            );

            return;

        }



        try {


            setSaving(true);

            setMessage("");



            const signatureUrl =
                sigRef.current
                    .getTrimmedCanvas()
                    .toDataURL("image/png");






            const response =
                await fetch(

                    `/api/workorders/${workorderId}/signature`,

                    {

                        method:"POST",

                        headers:{

                            "Content-Type":
                            "application/json"

                        },


                        body:JSON.stringify({

                            signatureUrl,

                            customerName:
                                "Opdrachtgever"

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




            setMessage(
                "✓ Handtekening opgeslagen"
            );




        } catch(error){


            console.error(error);


            setMessage(
                "Opslaan mislukt"
            );



        } finally {


            setSaving(false);


        }


    }







    return (

        <div className="space-y-3">


            <div className="
                border
                rounded-xl
                bg-white
            ">

                <SignatureCanvas

                    ref={sigRef}

                    canvasProps={{

                        className:
                        "w-full h-48"

                    }}

                />


            </div>




            <div className="
                flex
                gap-3
            ">


                <button

                    type="button"

                    onClick={clearSignature}

                    className="
                        flex-1
                        border
                        rounded-xl
                        p-3
                        flex
                        justify-center
                        gap-2
                    "

                >

                    <Eraser size={18}/>

                    Wissen

                </button>




                <button

                    type="button"

                    onClick={saveSignature}

                    disabled={saving}

                    className="
                        flex-1
                        bg-[#12345b]
                        text-white
                        rounded-xl
                        p-3
                        flex
                        justify-center
                        gap-2
                    "

                >

                    <Save size={18}/>

                    {saving
                        ? "Opslaan..."
                        : "Opslaan"
                    }

                </button>


            </div>




            {message && (

                <p className="
                    text-sm
                    text-center
                ">

                    {message}

                </p>

            )}


        </div>

    );

}