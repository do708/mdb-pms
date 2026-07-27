"use client";

import { useRef, useState } from "react";



interface SignatureFormProps {

    workorderId:string;

}






export default function SignatureForm({

    workorderId

}:SignatureFormProps){


    const canvasRef =
        useRef<HTMLCanvasElement | null>(null);



    const [drawing,setDrawing] =
        useState(false);



    const [saving,setSaving] =
        useState(false);







    function pointerPos(
        event:React.PointerEvent<HTMLCanvasElement>
    ){
        const canvas = canvasRef.current;
        if(!canvas){
            return { x:0, y:0 };
        }
        const rect = canvas.getBoundingClientRect();
        return {
            x:(event.clientX - rect.left) * (canvas.width / rect.width),
            y:(event.clientY - rect.top) * (canvas.height / rect.height)
        };
    }



    function startDrawing(

        event:React.PointerEvent<HTMLCanvasElement>

    ){

        event.preventDefault();


        const canvas =
            canvasRef.current;


        if(!canvas){

            return;

        }


        // De aanraking/pen vasthouden zodat tekenen doorloopt buiten het canvas.
        canvas.setPointerCapture(event.pointerId);



        const ctx =
            canvas.getContext("2d");


        if(!ctx){

            return;

        }



        const { x, y } = pointerPos(event);



        ctx.beginPath();


        ctx.moveTo(x, y);


        setDrawing(true);


    }







    function draw(

        event:React.PointerEvent<HTMLCanvasElement>

    ){


        if(!drawing){

            return;

        }

        event.preventDefault();



        const canvas =
            canvasRef.current;


        if(!canvas){

            return;

        }



        const ctx =
            canvas.getContext("2d");


        if(!ctx){

            return;

        }



        const { x, y } = pointerPos(event);



        ctx.lineTo(x, y);


        ctx.stroke();


    }







    function stopDrawing(){


        setDrawing(false);


    }








    function clearSignature(){


        const canvas =
            canvasRef.current;


        if(canvas){


            const ctx =
                canvas.getContext("2d");


            ctx?.clearRect(

                0,

                0,

                canvas.width,

                canvas.height

            );


        }


    }







    async function saveSignature(){


        const canvas =
            canvasRef.current;


        if(!canvas){

            return;

        }



        setSaving(true);



        try {


            const image =
                canvas.toDataURL(
                    "image/png"
                );



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

                            image

                        })

                    }

                );





            if(response.ok){


                alert(
                    "Handtekening opgeslagen"
                );


            } else {


                alert(
                    "Opslaan mislukt"
                );


            }



        } catch(error){


            console.error(error);


            alert(
                "Fout bij opslaan"
            );


        } finally {


            setSaving(false);


        }


    }









    return (

        <section className="
            bg-white
            border
            rounded-2xl
            p-5
            space-y-4
        ">


            <h2 className="
                font-bold
                text-lg
            ">

                ✍️ Handtekening klant

            </h2>





            <canvas

                ref={canvasRef}

                width={600}

                height={250}


                onPointerDown={startDrawing}

                onPointerMove={draw}

                onPointerUp={stopDrawing}

                onPointerCancel={stopDrawing}


                className="
                    border
                    rounded-xl
                    w-full
                    bg-gray-50
                    touch-none
                "

                style={{ touchAction:"none" }}

            />







            <button

                onClick={clearSignature}

                className="
                    w-full
                    border
                    rounded-xl
                    py-3
                "

            >

                Wissen

            </button>







            <button

                onClick={saveSignature}

                disabled={saving}


                className="
                    w-full
                    bg-blue-600
                    text-white
                    rounded-xl
                    py-3
                    font-bold
                "

            >

                {
                    saving
                    ?
                    "Opslaan..."
                    :
                    "✍️ Handtekening opslaan"
                }


            </button>




        </section>

    );


}